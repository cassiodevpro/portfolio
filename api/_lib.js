// Utilidades compartilhadas pelas funções da pasta api/ (o "_" no nome faz a Vercel não expor este arquivo como rota).
import crypto from 'node:crypto';
import { put, get, list, del } from '@vercel/blob';

// ---------- Contatos (leads) no Vercel Blob privado ----------
// Cada contato é um arquivo leads/<id>.json. O repositório é público: nada disso vai para o Git.

const PREFIX = 'leads/';

export async function saveLead(lead) {
  await put(`${PREFIX}${lead.id}.json`, JSON.stringify(lead), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readLead(id) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return null;
  const r = await get(`${PREFIX}${id}.json`, { access: 'private', useCache: false });
  if (!r) return null;
  return JSON.parse(await new Response(r.stream).text());
}

export async function listLeads() {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const leads = await Promise.all(
    out.map(async (b) => {
      try {
        const r = await get(b.pathname, { access: 'private', useCache: false });
        return r ? JSON.parse(await new Response(r.stream).text()) : null;
      } catch {
        return null;
      }
    })
  );
  return leads.filter(Boolean).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
}

export async function deleteLead(id) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return;
  await del(`${PREFIX}${id}.json`);
}

export function newLeadId() {
  return crypto.randomBytes(12).toString('hex');
}

// Token que deixa o navegador do visitante anexar perguntas só ao próprio contato.
export function leadToken(id) {
  return hmac(`lead:${id}`).slice(0, 32);
}
export function checkLeadToken(id, token) {
  return typeof token === 'string' && safeEqual(leadToken(id), token);
}

// ---------- Validação de contato ----------

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/;

export function findContact(text) {
  const s = String(text || '');
  const e = s.match(EMAIL);
  if (e) return e[0];
  const p = s.match(PHONE);
  if (p && p[0].replace(/\D/g, '').length >= 10) return p[0].trim();
  return null;
}

export function clean(v, max) {
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

// ---------- Sessão do admin ----------

const SESSION_HOURS = 8;
const COOKIE = 'adm';

function hmac(data) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET ausente');
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkCredentials(user, pass) {
  const expectedUser = process.env.ADMIN_USER || '';
  const [saltHex, hashHex] = String(process.env.ADMIN_PASS_HASH || '').split(':');
  if (!expectedUser || !saltHex || !hashHex) return false;
  const got = crypto.scryptSync(String(pass || ''), Buffer.from(saltHex, 'hex'), 64);
  const userOk = safeEqual(
    crypto.createHash('sha256').update(String(user || '')).digest('hex'),
    crypto.createHash('sha256').update(expectedUser).digest('hex')
  );
  const passOk = crypto.timingSafeEqual(got, Buffer.from(hashHex, 'hex'));
  return userOk && passOk;
}

export function sessionCookie() {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const value = `${exp}.${hmac(`adm:${exp}`)}`;
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAdmin(req) {
  const raw = String(req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  try {
    return safeEqual(hmac(`adm:${exp}`), sig);
  } catch {
    return false;
  }
}

// ---------- Proteções gerais ----------

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
}

// Limite simples em memória (por instância da função): proteção básica contra abuso.
const buckets = new Map();
export function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  buckets.set(key, list);
  if (buckets.size > 5000) buckets.clear();
  return list.length > max;
}
