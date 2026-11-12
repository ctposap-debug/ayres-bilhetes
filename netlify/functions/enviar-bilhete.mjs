// Envia o bilhete por e-mail (Brevo) depois de a organização confirmar o pagamento.
// Variáveis de ambiente no Netlify: BREVO_API_KEY, FIREBASE_API_KEY, FIREBASE_PROJECT_ID,
// ADMINS (e-mails separados por vírgula), REMETENTE_EMAIL, REMETENTE_NOME

const resp = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// converte um documento da API REST do Firestore em objeto simples
function valor(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(valor);
  if ("timestampValue" in v) return v.timestampValue;
  return null;
}

export default async (req) => {
  if (req.method !== "POST") return resp(405, { erro: "método" });
  const { BREVO_API_KEY, FIREBASE_API_KEY, FIREBASE_PROJECT_ID, ADMINS = "", REMETENTE_EMAIL, REMETENTE_NOME = "AYRE'S" } = process.env;
  if (!BREVO_API_KEY || !FIREBASE_API_KEY || !FIREBASE_PROJECT_ID || !REMETENTE_EMAIL) return resp(500, { erro: "e-mail não configurado" });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const { pedido, link } = await req.json().catch(() => ({}));
  if (!token || !pedido || !link) return resp(400, { erro: "pedido inválido" });

  // 1) confirma que quem pede é da organização
  const look = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
  const email = (await look.json().catch(() => ({})))?.users?.[0]?.email?.toLowerCase();
  const admins = ADMINS.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!look.ok || !email || !admins.includes(email)) return resp(403, { erro: "sem permissão" });

  // 2) lê o pedido com a credencial da própria administradora (as regras do Firestore aplicam-se)
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pedidos/${encodeURIComponent(pedido)}`,
    { headers: { Authorization: "Bearer " + token } });
  if (!r.ok) return resp(404, { erro: "pedido não encontrado" });
  const f = (await r.json()).fields || {};
  const p = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, valor(v)]));
  if (p.estado !== "pago") return resp(409, { erro: "pedido ainda não está pago" });
  if (!p.email) return resp(400, { erro: "pedido sem e-mail" });

  // só aceitamos links para o próprio site
  const origem = new URL(req.url).origin;
  let urlBilhete;
  try { urlBilhete = new URL(link); } catch { return resp(400, { erro: "link inválido" }); }
  if (urlBilhete.origin !== origem && !urlBilhete.hostname.endsWith("ayrespolesport.com")) return resp(400, { erro: "link inválido" });

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(urlBilhete.href)}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0a005b;color:#f3f1ff;padding:28px;border-radius:16px">
    <h1 style="color:#f1d47a;margin:0 0 4px">Estrelas de Natal</h1>
    <p style="margin:0 0 18px;color:#b9b6e6">Espetáculo de Final de Ano · AYRE'S Ginástica &amp; Danças Aéreas</p>
    <p>Olá ${esc(String(p.nome).split(" ")[0])}, o seu pagamento foi confirmado. Este é o seu bilhete.</p>
    <p><b>Código:</b> ${esc(p.codigo)}<br><b>Lugares:</b> ${esc(p.lugares.length)} pessoa(s)<br>
       <b>Data:</b> 13 de dezembro de 2026<br><b>Local:</b> POSAP — Centro de Treinamento e Eventos, Sintra</p>
    <div style="text-align:center;margin:20px 0"><img src="${qr}" width="240" height="240" alt="QR Code" style="background:#fff;border-radius:10px"></div>
    <p style="text-align:center"><a href="${esc(urlBilhete.href)}" style="background:#d4af37;color:#1a1440;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Abrir o bilhete</a></p>
    <p style="color:#b9b6e6;font-size:13px">Apresente o QR Code na receção. Qualquer dúvida, responda a este e-mail.</p></div>`;

  const b = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: REMETENTE_EMAIL, name: REMETENTE_NOME },
      replyTo: { email: REMETENTE_EMAIL, name: REMETENTE_NOME },
      to: [{ email: p.email, name: p.nome }],
      subject: `O seu bilhete — Estrelas de Natal (${p.codigo})`,
      htmlContent: html
    })
  });
  if (!b.ok) return resp(502, { erro: "Brevo " + b.status });
  return resp(200, { ok: true });
};
