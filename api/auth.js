import { randomInt, randomBytes, createHash } from 'node:crypto';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FLARE_FROM_EMAIL || process.env.RESEND_FROM || 'FLARE <onboarding@resend.dev>';
const SESSION_COOKIE = 'flare_user';
const CODE_TTL = 600;

const json = (res, status, data) => {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(data);
};

const redis = async (command, args = []) => {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Upstash Redis is not connected');
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([command, ...args])
  });
  const text = await r.text();
  let j = {};
  try { j = text ? JSON.parse(text) : {}; } catch { throw new Error(`Redis returned HTTP ${r.status}`); }
  if (!r.ok || j.error) throw new Error(j.error || `Redis HTTP ${r.status}`);
  return j.result;
};

const hash = s => createHash('sha256').update(String(s)).digest('hex');
const cleanEmail = s => String(s || '').trim().toLowerCase();
const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'same-origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  return res;
}

async function sendCode(email, code) {
  if (!RESEND_KEY) throw new Error('Email service is not configured. Add RESEND_API_KEY and FLARE_FROM_EMAIL in Vercel.');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Код регистрации FLARE',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>Регистрация в FLARE</h2><p>Ваш код подтверждения:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</div><p>Код действует 10 минут.</p></div>`
    })
  });
  const text = await r.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
  if (!r.ok) throw new Error(body.message || `Email service HTTP ${r.status}`);
  return body;
}

function setSession(res, email) {
  const token = `${email}.${randomBytes(24).toString('hex')}`;
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = String(body.action || '');

    if (action === 'register-start') {
      const email = cleanEmail(body.email);
      if (!validEmail(email)) return json(res, 400, { ok: false, error: 'Введите корректный email.' });

      const emailHash = hash(email);
      const existing = await redis('GET', [`flare:auth:user:${emailHash}`]);
      if (existing) return json(res, 409, { ok: false, error: 'Пользователь с таким email уже зарегистрирован.' });

      const code = String(randomInt(100000, 1000000));
      const key = `flare:auth:code:${emailHash}`;
      await redis('SET', [key, JSON.stringify({ codeHash: hash(code), email, createdAt: Date.now() }), 'EX', CODE_TTL]);
      await sendCode(email, code);

      return json(res, 200, { ok: true, message: 'Код отправлен на почту.' });
    }

    if (action === 'register-verify') {
      const email = cleanEmail(body.email);
      const code = String(body.code || '').trim();
      if (!validEmail(email) || !/^\d{6}$/.test(code)) return json(res, 400, { ok: false, error: 'Введите email и 6-значный код.' });

      const key = `flare:auth:code:${hash(email)}`;
      const raw = await redis('GET', [key]);
      if (!raw) return json(res, 400, { ok: false, error: 'Код истёк. Запросите новый.' });

      const saved = JSON.parse(raw);
      if (saved.codeHash !== hash(code)) return json(res, 400, { ok: false, error: 'Неверный код.' });

      await redis('DEL', [key]);
      const user = { email, createdAt: Date.now(), provider: 'email' };
      await redis('SET', [`flare:auth:user:${hash(email)}`, JSON.stringify(user)]);
      setSession(res, email);

      return json(res, 200, { ok: true, user });
    }

    if (action === 'telegram-unavailable') return json(res, 200, { ok: false, message: 'Временно не работает' });

    return json(res, 400, { ok: false, error: 'Неизвестное действие.' });
  } catch (e) {
    console.error('auth error', e);
    return json(res, 503, { ok: false, error: e?.message || 'Ошибка сервера' });
  }
}
