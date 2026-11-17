// POST /api/contato — o visitante deixa nome e contato no início do chat.
import { saveLead, newLeadId, leadToken, findContact, clean, sameOrigin, clientIp, limited } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });
  if (limited(`contato:${clientIp(req)}`, 5, 60 * 60_000)) {
    return res.status(429).json({ error: 'Muitos envios. Tente mais tarde.' });
  }

  const b = req.body || {};
  if (b.site) return res.status(200).json({ ok: true }); // campo-isca para robôs

  const nome = clean(b.nome, 80);
  const contatoRaw = clean(b.contato, 120);
  const contato = findContact(contatoRaw);
  const empresa = clean(b.empresa, 120);

  if (nome.length < 2) return res.status(400).json({ error: 'Informe seu nome.' });
  if (!contato) return res.status(400).json({ error: 'Informe um e-mail ou WhatsApp com DDD válido.' });

  const id = newLeadId();
  const lead = {
    id,
    nome,
    contato: contatoRaw,
    empresa,
    origem: 'formulário do chat',
    status: 'novo',
    criadoEm: new Date().toISOString(),
    conversa: [],
  };
  try {
    await saveLead(lead);
  } catch (err) {
    console.error('saveLead', err);
    return res.status(500).json({ error: 'Não consegui salvar agora. Tente de novo.' });
  }
  return res.status(200).json({ id, token: leadToken(id) });
}
