# Bilhetes — Estrelas de Natal (AYRE'S / POSAP)

Site estático (Netlify) + Firebase (Firestore e Auth). O pagamento é feito por MB WAY direto para o telemóvel da organização e confirmado à mão no painel.

## Páginas
- `index.html` — venda pública: mapa das 19 mesas, mesa inteira (160 €) ou cadeira (45 €), reserva de 24 h
- `bilhete.html?id=…` — estado da reserva / bilhete com QR Code (atualiza sozinho quando é confirmado)
- `admin.html` — painel: confirmar/cancelar, mapa com quem está em cada mesa, venda no local, entrada por QR, exportar CSV
- `config.js` — **tudo o que se edita**: Firebase, preços, textos, MB WAY, WhatsApp, admins

## Regras de negócio
- Preço calculado a partir dos lugares: 4 lugares da mesma mesa = 160 €; senão 45 € por cadeira. O painel recalcula o valor e assinala se o valor gravado não bater certo.
- Reserva fica 24 h; depois os lugares voltam a aparecer livres. Se a pessoa pagar depois e os lugares ainda estiverem livres, a confirmação funciona; se outra pessoa os tiver ocupado, o painel avisa.
- Dados pessoais (`pedidos`) só são lidos pela organização. O bilhete público (`bilhetes`) só tem primeiro nome, código e lugares, e só abre com o link secreto.

## Configuração (uma vez)
1. **Firebase** (entrar com a conta Google `ct.posap@gmail.com`): criar projeto novo (ex.: `ayres-bilhetes`, plano Spark).
   - Firestore → criar base (região `eur3`).
   - Authentication → ativar **Google** (entra com `ct.posap@gmail.com`, sem palavra-passe nova) e, como alternativa, Email/Password → criar o utilizador `cursos@ayrespolesport.com` (e, se quiser, também `ct.posap@gmail.com`) com uma palavra-passe — é este login que entra no painel.
   - Definições → app Web → copiar a configuração para `FIREBASE` em `config.js`.
   - Firestore → Regras → colar `firestore.rules` → Publicar.
   - Authentication → Settings → Authorized domains → adicionar `bilhetes.ayrespolesport.com`.
2. **GitHub / Netlify**: repositório privado → site novo no Netlify ligado ao repositório (sem comando de build).
3. **Domínio** (painel DNS do One.com): registo `CNAME` `bilhetes` → `<nome-do-site>.netlify.app`. No Netlify, adicionar o domínio `bilhetes.ayrespolesport.com` (HTTPS automático).
4. **E-mail (Brevo)**, opcional mas recomendado:
   - Conta Brevo → Senders & Domains → autenticar `ayrespolesport.com` (copiar os registos TXT/CNAME para o DNS do One.com).
   - No Netlify → Environment variables:
     `BREVO_API_KEY`, `FIREBASE_API_KEY` (igual ao do config), `FIREBASE_PROJECT_ID`,
     `ADMINS=cursos@ayrespolesport.com,ct.posap@gmail.com`, `REMETENTE_EMAIL=cursos@ayrespolesport.com`, `REMETENTE_NOME=AYRE'S`
   - Sem isto, o painel continua a funcionar e o bilhete vai por WhatsApp.
5. Entrar em `/admin.html` → **Mais → Criar lugares das mesas**.
6. Fazer uma compra de teste, confirmar, abrir o bilhete, testar a leitura do QR e cancelar.
7. No site do One.com: botão "Comprar bilhetes" → `https://bilhetes.ayrespolesport.com`.

## Adicionar outro administrador
Acrescentar o e-mail em `ADMINS` (`config.js`), na lista de `firestore.rules` e na variável `ADMINS` do Netlify, e criar o utilizador no Firebase Auth.
