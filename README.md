# Portfólio — Cássio Moreira de Souza

Página única (`index.html`) publicada na Vercel: https://portfolio-repo-liard-five.vercel.app

## Monitor automático

- `monitor/sites.json` — lista dos sites verificados (adicione um item para monitorar um projeto novo).
- `monitor/check.mjs` — acessa cada URL e grava `status.json`, que o `index.html` lê para mostrar os selos "Online".
- `.github/workflows/monitor.yml` — roda a cada 6 horas (ou manualmente em *Actions → Monitor dos sites → Run workflow*),
  publica o `status.json` e abre uma issue com o rótulo `monitor` quando um site cai; fecha a issue quando ele volta.

Rodar localmente: `node monitor/check.mjs`.

## App de finanças

O APK do Agente Cassio Dev Pro fica em *Releases* (`app-financas-v<versão>`). Para publicar uma versão nova:

```bash
gh release create app-financas-v1.4.0 ../app-chat-finance/apk/agente-cassiodevpro-v1.4.0.apk \
  --title "Agente Cassio Dev Pro — Android v1.4.0" --notes "..."
```

e atualize o link do botão "Baixar app Android" no `index.html`.
