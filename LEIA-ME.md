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
4. **E-mail dos bilhetes** (sai direto da caixa cursos@ayrespolesport.com, pelo One.com):
   - Netlify → Project configuration → Environment variables → adicionar:
     `SMTP_USER=cursos@ayrespolesport.com` e `SMTP_PASS=<palavra-passe dessa caixa de e-mail>`
   - Fazer "Trigger deploy" depois de adicionar. Sem isto, o painel funciona e o bilhete vai só por WhatsApp.
5. Entrar em `/admin.html` → **Mais → Criar lugares das mesas**.
6. Fazer uma compra de teste, confirmar, abrir o bilhete, testar a leitura do QR e cancelar.
7. No site do One.com: botão "Comprar bilhetes" → `https://bilhetes.ayrespolesport.com`.

## Adicionar outro administrador
Acrescentar o e-mail em `ADMINS` (`config.js`), na lista de `firestore.rules` e na variável `ADMINS` do Netlify, e criar o utilizador no Firebase Auth.

## Abertura das vendas
Painel → Mais → **Abertura das vendas**: escolher data/hora e "Guardar abertura" (ou "Abrir já"). Até lá a página mostra a contagem regressiva e a sala só para ver. "Encerrar vendas" fecha tudo. As regras do Firestore também bloqueiam reservas fora do período.

## Arte do bilhete
Colocar a imagem em `img/bilhete-arte.jpg` (1080×1920). Da altura 1000 px para baixo a arte deve ser lisa e clara — é onde o site escreve nome, mesa, código e o QR Code. Posições ajustáveis em `BILHETE_ARTE` no `config.js`. Sem a imagem, usa-se o fundo padrão.
