// GET /api/admin/leads — lista os contatos; PATCH { id, status } — marca como retornado; DELETE { id } — apaga.
import { isAdmin, listLeads, readLead, saveLead, deleteLead, sameOrigin } from '../_lib.js';

const STATUS = ['novo', 'retornado', 'arquivado'];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'Faça login.' });

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ leads: await listLeads() });
    }
    const { id, status } = req.body || {};
    if (req.method === 'PATCH') {
      if (!STATUS.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
      const lead = await readLead(id);
      if (!lead) return res.status(404).json({ error: 'Contato não encontrado.' });
      lead.status = status;
      lead.atualizadoEm = new Date().toISOString();
      await saveLead(lead);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await deleteLead(id);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err) {
    console.error('admin leads', err);
    return res.status(500).json({ error: 'Erro ao acessar os contatos.' });
  }
}
