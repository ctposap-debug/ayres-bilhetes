// Desenho da planta do salão (SVG), partilhado entre a página pública e o painel
import { POS_MESAS, LUGARES_POR_MESA, idLugar } from "./config.js";

const NS = "http://www.w3.org/2000/svg";
const OFF = [[-19, -19], [19, -19], [-19, 19], [19, 19]];

function el(tag, attrs, parent, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

// estado efetivo de um documento de lugar (reserva expirada conta como livre)
export function estadoEfetivo(doc, agora = Date.now()) {
  if (!doc) return "livre";
  if (doc.estado === "reservado") {
    const exp = doc.expira?.toMillis ? doc.expira.toMillis() : doc.expira;
    return exp && exp > agora ? "reservado" : "livre";
  }
  return doc.estado || "livre";
}

export function desenharMapa(svg, { estados = {}, selecionados = new Set(), destaque = null, onMesa = null }) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", "50 110 630 760");
  const g = el("g", {}, svg);

  // áreas fixas
  el("rect", { x: 58, y: 130, width: 172, height: 420, rx: 6, class: "area area-camarim" }, g);
  el("text", { x: 144, y: 340, class: "area-txt", transform: "rotate(-90 144 340)" }, g, "Camarim e Aquecimento");
  el("rect", { x: 58, y: 640, width: 130, height: 48, rx: 4, class: "area" }, g);
  el("text", { x: 123, y: 670, class: "area-txt" }, g, "Receção");
  el("rect", { x: 58, y: 692, width: 130, height: 170, rx: 4, class: "area area-wc" }, g);
  el("text", { x: 123, y: 782, class: "area-txt" }, g, "WC");
  el("rect", { x: 615, y: 135, width: 40, height: 80, rx: 4, class: "area" }, g);
  el("text", { x: 635, y: 175, class: "area-txt small", transform: "rotate(-90 635 175)" }, g, "Som/Luz");

  // palco em T
  el("path", { d: "M275 175 H585 V345 H495 V738 H360 V345 H275 Z", class: "palco" }, g);
  el("text", { x: 430, y: 225, class: "palco-txt" }, g, "PALCO");
  [[365, 260, "pole"], [492, 260, "pole"], [432, 302, "hoop2"], [432, 385, "hoop"], [432, 516, "hoop"], [432, 646, "hoop"]]
    .forEach(([cx, cy, c]) => el("circle", { cx, cy, r: 11, class: "aparelho " + c }, g));

  // mesas
  for (let m = 1; m <= Object.keys(POS_MESAS).length; m++) {
    const [x, y] = POS_MESAS[m];
    const mg = el("g", { class: "mesa" + (destaque === m ? " destaque" : ""), "data-mesa": m, tabindex: 0, role: "button",
      "aria-label": `Mesa ${m}` }, g);
    let livres = 0;
    for (let l = 1; l <= LUGARES_POR_MESA; l++) {
      const id = idLugar(m, l);
      const st = selecionados.has(id) ? "sel" : (estados[id] || "livre");
      if (st === "livre") livres++;
      el("circle", { cx: x + OFF[l - 1][0], cy: y + OFF[l - 1][1], r: 8, class: "lugar " + st }, mg);
    }
    el("circle", { cx: x, cy: y, r: 19, class: "tampo" + (livres === 0 ? " cheia" : "") }, mg);
    el("text", { x, y: y + 6, class: "num" }, mg, m);
    if (onMesa) {
      mg.addEventListener("click", () => onMesa(m));
      mg.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onMesa(m); } });
    }
  }
}

export const CSS_MAPA = `
.mapa{width:100%;height:auto;display:block;touch-action:manipulation}
.mapa .area{fill:#1c1a52;stroke:#3a3780;stroke-width:2}
.mapa .area-camarim{stroke:#e8642c;stroke-width:3}
.mapa .area-wc{fill:#2a1d5c}
.mapa .area-txt{fill:#b9b6e6;font:600 17px system-ui,sans-serif;text-anchor:middle}
.mapa .area-txt.small{font-size:12px}
.mapa .palco{fill:#3d3b4f;stroke:#5c5a72;stroke-width:2}
.mapa .palco-txt{fill:#d8d6ea;font:700 20px system-ui,sans-serif;text-anchor:middle;letter-spacing:6px}
.mapa .aparelho{stroke:#0000004d;stroke-width:2}
.mapa .aparelho.pole{fill:#3b6cff}.mapa .aparelho.hoop{fill:#f07a1e}.mapa .aparelho.hoop2{fill:#ffc61a}
.mapa .mesa{cursor:pointer;outline:none}
.mapa .tampo{fill:#5a3a22;stroke:#d4af37;stroke-width:2}
.mapa .tampo.cheia{fill:#3a3340;stroke:#6b6577}
.mapa .mesa:hover .tampo,.mapa .mesa:focus .tampo,.mapa .mesa.destaque .tampo{stroke:#fff;stroke-width:3}
.mapa .num{fill:#fff;font:700 17px system-ui,sans-serif;text-anchor:middle;pointer-events:none}
.mapa .lugar{stroke:#0b0a3a;stroke-width:2}
.mapa .lugar.livre{fill:#3ecf8e}
.mapa .lugar.reservado{fill:#f5b942}
.mapa .lugar.pago{fill:#e5484d}
.mapa .lugar.sel{fill:#fff;stroke:#d4af37;stroke-width:3}
`;
