// Envia o bilhete por e-mail depois de a organização confirmar o pagamento.
// Envio direto pela caixa da escola (SMTP do One.com). Variáveis de ambiente no Netlify:
//   SMTP_USER  = cursos@ayrespolesport.com
//   SMTP_PASS  = palavra-passe dessa caixa de e-mail
//   (opcionais) SMTP_HOST = send.one.com · SMTP_PORT = 465 · REMETENTE_NOME = AYRE'S
//   (opcionais) ADMINS = e-mails com acesso ao painel, separados por vírgula
// Alternativa: se existir BREVO_API_KEY (e REMETENTE_EMAIL), envia pelo Brevo.
import tls from "node:tls";

const FIREBASE_API_KEY_PADRAO = "AIzaSyCcqoL0jbcjpC9ZTGnLGNFSv9V9EOh6WqQ";   // chave pública da app web
const FIREBASE_PROJECT_PADRAO = "ayres-bilhetes";
const ADMINS_PADRAO = "cursos@ayrespolesport.com,ct.posap@gmail.com";

const resp = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const b64 = t => Buffer.from(String(t), "utf8").toString("base64");

function valor(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(valor);
  if ("timestampValue" in v) return v.timestampValue;
  return null;
}

// ---------- cliente SMTP mínimo (TLS implícito, porta 465) ----------
export function enviarSMTP({ host, port, user, pass, from, fromName, to, toName, subject, html, rejectUnauthorized = true }) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host, port, servername: host, rejectUnauthorized });
    let buf = "", passo = 0, terminado = false;
    const fim = (erro) => { if (terminado) return; terminado = true; try { sock.end(); } catch {} erro ? reject(erro) : resolve(); };
    const linha = l => sock.write(l + "\r\n");
    const enc = t => `=?UTF-8?B?${b64(t)}?=`;
    const corpo = b64(html).replace(/.{76}/g, "$&\r\n");
    const msg = [
      `From: ${enc(fromName)} <${from}>`,
      `To: ${enc(toName || to)} <${to}>`,
      `Reply-To: ${from}`,
      `Subject: ${enc(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${from.split("@")[1]}>`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      corpo,
    ].join("\r\n");
    // sequência: [código esperado, comando a enviar a seguir]
    const etapas = [
      [220, () => linha(`EHLO ${from.split("@")[1]}`)],
      [250, () => linha("AUTH LOGIN")],
      [334, () => linha(b64(user))],
      [334, () => linha(b64(pass))],
      [235, () => linha(`MAIL FROM:<${from}>`)],
      [250, () => linha(`RCPT TO:<${to}>`)],
      [250, () => linha("DATA")],
      [354, () => sock.write(msg + "\r\n.\r\n")],
      [250, () => { linha("QUIT"); fim(); }],
    ];
    sock.setEncoding("utf8");
    sock.setTimeout(20000, () => fim(new Error("SMTP sem resposta")));
    sock.on("error", e => fim(e));
    sock.on("data", d => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\r\n")) >= 0) {
        const l = buf.slice(0, i); buf = buf.slice(i + 2);
        if (/^\d{3}-/.test(l)) continue;                  // resposta em várias linhas: esperar a última
        const cod = parseInt(l.slice(0, 3), 10);
        const [esperado, acao] = etapas[passo] || [];
        if (cod !== esperado) return fim(new Error(`SMTP ${cod}: ${l.slice(4, 120)}`));
        passo++; acao();
      }
    });
  });
}

export default async (req) => {
  if (req.method !== "POST") return resp(405, { erro: "método" });
  const E = process.env;
  const FIREBASE_API_KEY = E.FIREBASE_API_KEY || FIREBASE_API_KEY_PADRAO;
  const FIREBASE_PROJECT_ID = E.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_PADRAO;
  const usaSMTP = E.SMTP_USER && E.SMTP_PASS;
  const usaBrevo = E.BREVO_API_KEY && E.REMETENTE_EMAIL;
  if (!usaSMTP && !usaBrevo) return resp(500, { erro: "e-mail não configurado" });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const { pedido, link } = await req.json().catch(() => ({}));
  if (!token || !pedido || !link) return resp(400, { erro: "pedido inválido" });

  // 1) confirma que quem pede é da organização
  const look = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
  const email = (await look.json().catch(() => ({})))?.users?.[0]?.email?.toLowerCase();
  const admins = (E.ADMINS || ADMINS_PADRAO).split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
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
  let urlBilhete;
  try { urlBilhete = new URL(link); } catch { return resp(400, { erro: "link inválido" }); }
  const h = urlBilhete.hostname;
  if (!(h === new URL(req.url).hostname || h.endsWith("ayrespolesport.com") || h.endsWith(".netlify.app"))) return resp(400, { erro: "link inválido" });

  const n = (p.lugares || []).length;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(urlBilhete.href)}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0a005b;color:#f3f1ff;padding:28px;border-radius:16px">
    <h1 style="color:#f1d47a;margin:0 0 4px">Estrelas de Natal</h1>
    <p style="margin:0 0 18px;color:#b9b6e6">Espetáculo de Final de Ano · AYRE'S Ginástica &amp; Danças Aéreas</p>
    <p>Olá ${esc(String(p.nome).split(" ")[0])}, o seu pagamento foi confirmado. Este é o seu bilhete.</p>
    <p><b>Código:</b> ${esc(p.codigo)}<br><b>Pessoas:</b> ${n}<br>
       <b>Data:</b> 13 de dezembro de 2026 · abertura 19h00 · início 19h30<br>
       <b>Local:</b> POSAP — Centro de Treinamento e Eventos, Sintra</p>
    <div style="text-align:center;margin:20px 0"><img src="${qr}" width="240" height="240" alt="QR Code" style="background:#fff;border-radius:10px"></div>
    <p style="text-align:center"><a href="${esc(urlBilhete.href)}" style="background:#d4af37;color:#1a1440;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Abrir e guardar o bilhete</a></p>
    <p style="color:#b9b6e6;font-size:13px">Apresente o QR Code na receção. Qualquer dúvida, responda a este e-mail.</p></div>`;
  const assunto = `O seu bilhete — Estrelas de Natal (${p.codigo})`;
  const nomeRem = E.REMETENTE_NOME || "AYRE'S — Ginástica & Danças Aéreas";

  try {
    if (usaSMTP) {
      await enviarSMTP({ host: E.SMTP_HOST || "send.one.com", port: Number(E.SMTP_PORT || 465), user: E.SMTP_USER, pass: E.SMTP_PASS,
        from: E.SMTP_USER, fromName: nomeRem, to: p.email, toName: p.nome, subject: assunto, html });
    } else {
      const b = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST", headers: { "api-key": E.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender: { email: E.REMETENTE_EMAIL, name: nomeRem }, replyTo: { email: E.REMETENTE_EMAIL },
          to: [{ email: p.email, name: p.nome }], subject: assunto, htmlContent: html })
      });
      if (!b.ok) throw new Error("Brevo " + b.status);
    }
  } catch (e) { return resp(502, { erro: String(e.message || e).slice(0, 120) }); }
  return resp(200, { ok: true });
};
