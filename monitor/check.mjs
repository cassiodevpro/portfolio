// Verifica cada site de monitor/sites.json e grava status.json na raiz (lido pelo index.html).
// Uso: node monitor/check.mjs  — sai com código 0 mesmo com site fora do ar; quem decide o alerta é o workflow.
import { readFile, writeFile } from "node:fs/promises";

const TIMEOUT_MS = 15000;
const TRIES = 2;

async function probe(url) {
  for (let i = 0; i < TRIES; i++) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status < 500) return { up: true, code: res.status, ms: Date.now() - t0 };
      if (i === TRIES - 1) return { up: false, code: res.status, ms: null };
    } catch (err) {
      if (i === TRIES - 1) return { up: false, code: null, ms: null, error: err.cause?.code || err.name };
    }
  }
}

const sites = JSON.parse(await readFile(new URL("./sites.json", import.meta.url)));
const results = await Promise.all(sites.map(async (s) => ({ ...s, ...(await probe(s.url)) })));
const status = { checkedAt: new Date().toISOString(), sites: results };

await writeFile(new URL("../status.json", import.meta.url), JSON.stringify(status, null, 2) + "\n");
for (const r of results) console.log(`${r.up ? "UP  " : "DOWN"} ${r.code ?? r.error ?? "-"} ${r.name} ${r.url}`);
