import { isAdminRequest } from './admin-auth.js';

const KEY = 'flare:schedule';
const LOGIN = process.env.FLARE_WORKER_LOGIN || 'flareworker';
const PASSWORD = process.env.FLARE_WORKER_PASSWORD || 'flareworker';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(command, args = []) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Upstash Redis is not connected');
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([command, ...args]),
    cache: 'no-store'
  });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const defaults = {
  liveEnabled:false,vkUrl:'',onairTitle:'FLARE. Новости',onairText:'Главные события дня — коротко и по делу.',nextTitle:'Истории города',nextTime:'10:25',
  sch1Time:'10:00',sch1Title:'FLARE. Новости',sch1Category:'Новости',sch1Text:'Главные события дня, коротко и по делу.',sch1Image:'',
  sch2Time:'10:25',sch2Title:'Истории города',sch2Category:'Общество',sch2Text:'Люди, места и события города.',sch2Image:'',
  sch3Time:'11:00',sch3Title:'Дайджест',sch3Category:'Дайджест',sch3Text:'Самое важное за час.',sch3Image:'',
  sch4Time:'11:30',sch4Title:'FLARE. Погода',sch4Category:'Погода',sch4Text:'Погода в Москве и регионах.',sch4Image:'',
  sch5Time:'12:00',sch5Title:'Новости',sch5Category:'Новости',sch5Text:'Дневной выпуск FLARE.',sch5Image:'',
  sch6Time:'12:30',sch6Title:'FLARE. Интервью',sch6Category:'Интервью',sch6Text:'Разговоры с гостями и героями дня.',sch6Image:'',
  sch7Time:'13:00',sch7Title:'FLARE рекомендует',sch7Category:'Шоу',sch7Text:'Интересные истории и лучшие материалы FLARE.',sch7Image:'',
  sch8Time:'14:00',sch8Title:'Новости',sch8Category:'Новости',sch8Text:'Дневной выпуск новостей.',sch8Image:'',
  sch9Time:'15:00',sch9Title:'Дайджест',sch9Category:'Дайджест',sch9Text:'Главное за день.',sch9Image:'',
  sch10Time:'17:00',sch10Title:'FLARE. Вечер',sch10Category:'Информационная программа',sch10Text:'Главные события к вечеру.',sch10Image:'',
  sch11Time:'19:00',sch11Title:'Новости',sch11Category:'Новости',sch11Text:'Вечерний выпуск новостей FLARE.',sch11Image:'',
  sch12Time:'21:00',sch12Title:'Прямой эфир',sch12Category:'Эфир',sch12Text:'События в реальном времени.',sch12Image:'',
  newsSource:'telegram',newsTitle:'Главные события дня: что важно знать прямо сейчас',newsText:'Короткие новости, важные события и комментарии редакции FLARE.',newsTime:'СЕГОДНЯ · 10:15',
  news2Title:'Что изменится этой осенью',news2Text:'Главные изменения и события дня.',news2Category:'Общество',news3Title:'Новые технологии меняют привычный эфир',news3Text:'Главное из мира технологий.',news3Category:'Технологии',
  aboutText:'FLARE — интернет-телеканал нового формата: новости, программы, прямые трансляции и важные события.',aboutYear:'2026',
  program1Title:'Дайджест',program1Text:'Самое важное за день',program2Title:'FLARE. Новости',program2Text:'Оперативно и без лишнего',program3Title:'Прямой эфир',program3Text:'События в реальном времени',
  rateUSD:92.5,rateEUR:107.8,rateGold:10450,rateSilver:145,ratePlatinum:4200,ratePalladium:3800,rateUpdated:''
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-FLARE-Worker-Login, X-FLARE-Worker-Password');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  return res;
}

function send(res, status, body) {
  cors(res);
  return res.status(status).json(body);
}

function authorized(req) {
  return isAdminRequest(req) || (
    req.headers['x-flare-worker-login'] === LOGIN &&
    req.headers['x-flare-worker-password'] === PASSWORD
  );
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      cors(res);
      return res.status(204).end();
    }

    const raw = await redis('GET', [KEY]);

    if (req.method === 'GET') {
      let saved = {};
      if (raw) {
        try { saved = JSON.parse(raw); } catch { saved = {}; }
      }
      return send(res, 200, { ...defaults, ...saved });
    }

    if (req.method === 'POST') {
      if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      let old = {};
      if (raw) {
        try { old = JSON.parse(raw); } catch { old = {}; }
      }
      const data = { ...defaults, ...old };

      for (const key of Object.keys(defaults)) {
        if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
        if (key === 'liveEnabled') data[key] = Boolean(body[key]);
        else if (typeof defaults[key] === 'number') data[key] = Number(body[key]);
        else data[key] = String(body[key] ?? '');
      }

      await redis('SET', [KEY, JSON.stringify(data)]);
      return send(res, 200, { ok: true, ...data });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('schedule API error:', e);
    return send(res, 503, { error: e.message || 'Server error' });
  }
}
