// POST /api/admin/login — entra; DELETE — sai.
import { checkCredentials, sessionCookie, clearCookie, sameOrigin, clientIp, limited } from '../_lib.js';

export default async function handler(req, res) {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (limited(`login:${clientIp(req)}`, 5, 15 * 60_000)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' });
  }

  const { usuario, senha } = req.body || {};
  const ok = checkCredentials(usuario, senha);
  await new Promise((r) => setTimeout(r, 400)); // atrasa tentativas em sequência
  if (!ok) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  res.setHeader('Set-Cookie', sessionCookie());
  return res.status(200).json({ ok: true });
}
