# Portfólio — Cássio Moreira de Souza

Página única (`index.html`) publicada na Vercel: https://portfolio-repo-liard-five.vercel.app

## Monitor automático

- `monitor/sites.json` — lista dos sites verificados (adicione um item para monitorar um projeto novo).
- `monitor/check.mjs` — acessa cada URL e grava `status.json`, que o `index.html` lê para mostrar os selos "Online".
- `.github/workflows/monitor.yml` — roda a cada 6 horas (ou manualmente em *Actions → Monitor dos sites → Run workflow*),
  publica o `status.json` e abre uma issue com o rótulo `monitor` quando um site cai; fecha a issue quando ele volta.

Rodar localmente: `node monitor/check.mjs`.

## Chat "Pergunte sobre mim"

- `api/chat.js` é uma função serverless da Vercel (`POST /api/chat`) que chama a DeepSeek com um resumo do perfil.
- A chave fica **só** na variável de ambiente `DEEPSEEK_API_KEY` da Vercel (Settings → Environment Variables), nunca no repositório.
- Sem a variável, o chat responde "desativado" em vez de quebrar. Limite: 15 perguntas por IP a cada 10 minutos.
- Ao mudar experiência ou projetos, atualize o texto `PROFILE` em `api/chat.js`.

### Contatos (leads) e área `/admin`

- Ao abrir o chat, o visitante é convidado a deixar nome e e-mail/WhatsApp (`POST /api/contato`). Se pular, a IA convida de novo
  no fim das respostas, e um e-mail ou telefone digitado na conversa vira contato automaticamente. As perguntas feitas ficam junto do contato.
- Os contatos ficam no **Vercel Blob privado** `portfolio-contatos` (`leads/<id>.json`), nunca no repositório, que é público.
- `/admin` pede usuário e senha e lista os contatos: marcar como retornado/arquivado, apagar, exportar CSV, links para e-mail e WhatsApp.
- Variáveis na Vercel: `ADMIN_USER`, `ADMIN_PASS_HASH` (scrypt, formato `salt:hash` em hex), `SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`.
  Para trocar a senha, gere um hash novo e substitua `ADMIN_PASS_HASH`:

  ```bash
  P='nova-senha' node -e 'const c=require("crypto");const s=c.randomBytes(16);console.log(s.toString("hex")+":"+c.scryptSync(process.env.P,s,64).toString("hex"))'
  ```

## Stack dos projetos ao passar o mouse

Cada projeto tem `data-langs` e `data-tech` no `index.html` (separados por vírgula; prefixo `*` destaca em laranja como IA).

## App de finanças

O APK do Agente Cassio Dev Pro fica em *Releases* (`app-financas-v<versão>`). Para publicar uma versão nova:

```bash
gh release create app-financas-v1.4.0 ../app-chat-finance/apk/agente-cassiodevpro-v1.4.0.apk \
  --title "Agente Cassio Dev Pro — Android v1.4.0" --notes "..."
```

e atualize o link do botão "Baixar app Android" no `index.html`.
