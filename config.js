// =====================================================================
//  CONFIGURAÇÃO — tudo o que muda de evento para evento fica aqui
// =====================================================================

// 1) Cole aqui a configuração do projeto Firebase
//    (Consola Firebase > Definições do projeto > As suas apps > Web)
export const FIREBASE = {
  apiKey: "AIzaSyCcqoL0jbcjpC9ZTGnLGNFSv9V9EOh6WqQ",
  authDomain: "ayres-bilhetes.firebaseapp.com",
  projectId: "ayres-bilhetes",
  storageBucket: "ayres-bilhetes.firebasestorage.app",
  messagingSenderId: "95653311265",
  appId: "1:95653311265:web:a7c94e496f04198da7c460"
};

// 2) E-mails com acesso ao painel (têm de ser iguais aos do firestore.rules)
export const ADMINS = [
  "cursos@ayrespolesport.com",
  "ct.posap@gmail.com"
];

// 3) Evento
export const EVENTO = {
  nome: "Estrelas de Natal",
  subtitulo: "Espetáculo de Final de Ano",
  organizacao: "AYRE'S — Ginástica & Danças Aéreas",
  local: "POSAP — Centro de Treinamento e Eventos",
  morada: "Sintra",
  site: "https://ayrespolesport.com",
  instagram: "ayres.polesport.portugal",
  data: "13 de dezembro de 2026",
  abertura: "19h00",           // abertura do salão
  inicio: "19h30",             // início do espetáculo
  incluiMesa: "Inclui 1 garrafa de vinho, 1 garrafa de água de 250 ml por pessoa e finger food",
  incluiCadeira: "Inclui 1 taça de vinho, 1 garrafa de água de 250 ml e finger food",
};

// 3b) Programação. Em "parte" começa um novo bloco do espetáculo.
//     MOSTRAR_ALUNAS = false esconde os nomes na página pública (há crianças no elenco).
export const MOSTRAR_ALUNAS = false;
export const PROGRAMA = [
  { parte: 1, tema: "Loba da Neve", mod: "Pole Sport", alunas: "Francisca Craveiro" },
  { parte: 2, tema: "SnowWoman", mod: "Pole Pêndulo", alunas: "Geovana Lima" },
  { tema: "Sininhos", mod: "Pole Sport / Pêndulo / Hoop · Kids 2", alunas: "Sasha, Vira, Mini Alisa (poles), Yassenia e Nikol (hoop)" },
  { tema: "Chocolate Quente", mod: "Pole Pêndulo", alunas: "Alexia Lima" },
  { tema: "Caixinha de Música", mod: "Pole Sport", alunas: "Alisa Zhurbenko" },
  { tema: "Biscoitos da Alegria", mod: "Pole / Pêndulo / Hoop · Kids 1", alunas: "Yasseniia, Nikol (pole), Helena, Isabel, Petra, Irina (hoop)" },
  { tema: "Pijama Mágico", mod: "Hoop", alunas: "Geovana Lima" },
  { tema: "Festa no Telhado", mod: "Pole Sport", alunas: "Varvara" },
  { tema: "Guirlandas do Bem", mod: "Hoop", alunas: "Madalena, Yasseniia, Inês" },
  { tema: "Família", mod: "Pole Sport", alunas: "Marta Patrão" },
  { tema: "A Carta para o Pai Natal", mod: "Pole Sport", alunas: "Maria Eduarda" },
  { parte: 3, tema: "A Mãe do Presépio", mod: "Pole Sport Double", alunas: "Alexia Lima e Geovana Lima" },
  { tema: "Mãe Natal", mod: "Hoop + Pole", alunas: "Ana Matos" },
  { tema: "Rock de Natal", mod: "Hoop Kids Inter", alunas: "Sasha, Vira e Mini Alisa" },
  { tema: "A Princesa da Neve", mod: "Pole Sport", alunas: "Mariana Fedorova" },
  { tema: "Elfa da Magia do Amor", mod: "Hoop (paratleta)", alunas: "Nastasia Varganova" },
  { tema: "O Som do Natal", mod: "Pole Sport", alunas: "Liam Aronow" },
  { tema: "O Trenó", mod: "Pole Pêndulo", alunas: "Francisca Craveiro" },
  { tema: "Quebra-Nozes", mod: "Pole Sport", alunas: "Barbara Sinalyova" },
  { parte: 4, tema: "A Estrela", mod: "Hoop Kids", alunas: "Varvara" },
  { tema: "A Ajudante do Pai Natal", mod: "Pole Sport", alunas: "Alexia Lima" },
  { parte: 5, tema: "A Árvore da Magia", mod: "Pole Sport / Pêndulo / Hoop / Solo", alunas: "Todos os alunos", final: true },
];

// 4) Preços (euros)
export const PRECO_MESA = 160;   // mesa inteira, 4 pessoas
export const PRECO_CADEIRA = 45;  // por pessoa, mesa partilhada com outras famílias
export const LUGARES_POR_MESA = 4;
export const TOTAL_MESAS = 19;

// 5) Pagamento e contacto
export const MBWAY = "963 680 504";
export const WHATSAPP = "351963680504";  // com indicativo, só números
export const EMAIL_CONTACTO = "cursos@ayrespolesport.com";

// 6) Tempo que a reserva fica guardada à espera do pagamento (minutos)
export const MINUTOS_RESERVA = 30;

// Regra de preço: 4 lugares da mesma mesa = preço de mesa; caso contrário, por cadeira.
// É calculada a partir dos lugares, por isso não pode ser manipulada no browser.
export function precoDosLugares(ids) {
  const porMesa = {};
  ids.forEach(id => { const m = id.split("-")[0]; porMesa[m] = (porMesa[m] || 0) + 1; });
  let total = 0;
  for (const m in porMesa) {
    const n = porMesa[m];
    total += n === LUGARES_POR_MESA ? PRECO_MESA : n * PRECO_CADEIRA;
  }
  return total;
}

export const idLugar = (mesa, lugar) => `m${String(mesa).padStart(2, "0")}-${lugar}`;
export const mesaDe = id => parseInt(id.slice(1, 3), 10);
export const lugarDe = id => parseInt(id.split("-")[1], 10);
export const euro = v => v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

export function descreverLugares(ids) {
  const porMesa = {};
  ids.forEach(id => { const m = mesaDe(id); (porMesa[m] = porMesa[m] || []).push(lugarDe(id)); });
  return Object.keys(porMesa).sort((a, b) => a - b).map(m => {
    const l = porMesa[m];
    return l.length === LUGARES_POR_MESA ? `Mesa ${m} (inteira)` : `Mesa ${m} · ${l.length} cadeira${l.length > 1 ? "s" : ""}`;
  }).join(" + ");
}

// Posição de cada mesa na planta (coordenadas do desenho)
export const POS_MESAS = {
  1: [318, 388], 2: [275, 455], 3: [320, 510], 4: [278, 575], 5: [320, 628],
  6: [278, 690], 7: [318, 748], 8: [278, 808], 9: [370, 815], 10: [490, 815],
  11: [625, 340], 12: [540, 388], 13: [625, 452], 14: [540, 495], 15: [625, 568],
  16: [548, 610], 17: [625, 665], 18: [545, 738], 19: [625, 815]
};
