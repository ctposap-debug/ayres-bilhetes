// Desenho do bilhete em imagem (arte + dados + QR). Usado na página do bilhete e no envio por e-mail.
// Precisa da biblioteca QRCode (qrcodejs) carregada na página.
import { EVENTO, BILHETE_ARTE, descreverLugares } from "./config.js";

// ---------- imagem do bilhete (arte + dados + QR) ----------
function carregar(src) {
  return new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
}
export async function desenharBilhete(b, link, tipo = "image/png", qualidade) {
  const A = BILHETE_ARTE, W = A.largura, H = A.altura;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const arte = await carregar(A.imagem);
  if (arte) g.drawImage(arte, 0, 0, W, H);
  else {                                    // fundo padrão
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#1a1490"); gr.addColorStop(1, "#0a005b");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const [l1, l2] = await Promise.all([carregar("img/ayres.jpg"), carregar("img/posap.jpg")]);
    const circ = (img, x) => { if (!img) return; g.save(); g.beginPath(); g.arc(x, 250, 140, 0, 7); g.clip();
      g.drawImage(img, x - 140, 110, 280, 280); g.restore(); };
    circ(l1, 370); circ(l2, 710);
    g.textAlign = "center"; g.fillStyle = "#f1d47a"; g.font = "800 110px Georgia, serif";
    g.fillText("ESTRELAS", W / 2, 560); g.fillText("DE NATAL", W / 2, 680);
    g.fillStyle = "#d8d4ff"; g.font = "500 44px system-ui, sans-serif";
    g.fillText("Espetáculo de Final de Ano", W / 2, 770);
    g.fillText("AYRE'S — Ginástica & Danças Aéreas", W / 2, 840);
    g.fillStyle = "#fbf7ec"; g.beginPath(); g.roundRect(60, A.zonaDados - 20, W - 120, H - A.zonaDados - 40, 40); g.fill();
  }
  // dados
  const y0 = A.zonaDados; g.textAlign = "center";
  g.fillStyle = A.corDestaque; g.font = "700 34px system-ui, sans-serif"; g.fillText("B I L H E T E", W / 2, y0 + 70);
  g.fillStyle = A.corTexto; g.font = "800 64px system-ui, sans-serif"; g.fillText(b.nome, W / 2, y0 + 150, W - 200);
  g.font = "700 44px system-ui, sans-serif"; g.fillText(descreverLugares(b.lugares), W / 2, y0 + 220, W - 160);
  g.font = "500 36px system-ui, sans-serif";
  g.fillText(`${b.lugares.length} pessoa${b.lugares.length > 1 ? "s" : ""} · Código ${b.codigo}`, W / 2, y0 + 278);
  g.fillText(EVENTO.data, W / 2, y0 + 330, W - 200);
  g.fillText(`Abertura ${EVENTO.abertura} · Início ${EVENTO.inicio}`, W / 2, y0 + 380, W - 200);
  // QR
  const tmp = document.createElement("div");
  new QRCode(tmp, { text: link, width: A.qr.tamanho, height: A.qr.tamanho, correctLevel: QRCode.CorrectLevel.M });
  const qc = tmp.querySelector("canvas");
  g.fillStyle = "#fff"; g.fillRect(A.qr.x - 16, A.qr.y - 16, A.qr.tamanho + 32, A.qr.tamanho + 32);
  g.drawImage(qc, A.qr.x, A.qr.y, A.qr.tamanho, A.qr.tamanho);
  g.fillStyle = A.corTexto; g.font = "500 28px system-ui, sans-serif";
  g.fillText(`${EVENTO.local} · ${EVENTO.morada}`, W / 2, A.qr.y + A.qr.tamanho + 62, W - 200);
  return c.toDataURL(tipo, qualidade);
}

