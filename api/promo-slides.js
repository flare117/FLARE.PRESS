import { isAdminRequest } from './admin-auth.js';

const KEY = 'flare:promo-slides';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const DEFAULT_SLIDES = [
  { title: 'ГЛАВНЫЕ НОВОСТИ ВСЕГДА ПОД РУКОЙ', text: 'Подписывайтесь на наш канал в Телеграм', button: 'Подробнее', link: 'https://t.me/flare_itv', image: '' },
  { title: 'СОТРУДНИЧАЙТЕ С FLARE', text: 'Реклама, сотрудничество и ваши новости — пишите менеджеру.', button: 'Подробнее', link: 'https://t.me/managerflareof', image: '' }
];

function configured(){ return Boolean(REDIS_URL && REDIS_TOKEN); }
async function redis(command,args=[]){
  if(!configured()) throw new Error('Upstash Redis is not connected');
  const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:`Bearer ${REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify([command,...args])});
  if(!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  const j=await r.json(); if(j.error) throw new Error(j.error); return j.result;
}
function cors(res){res.setHeader('Access-Control-Allow-Origin','same-origin');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-FLARE-Admin-Login,X-FLARE-Admin-Password');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Cache-Control','no-store');return res}
function normalizeSlide(s){return {title:String(s?.title||'').trim(),text:String(s?.text||'').trim(),button:String(s?.button||'Подробнее').trim(),link:String(s?.link||'https://t.me/managerflareof').trim(),image:String(s?.image||'').trim()}}
function normalizeSlides(value){const arr=Array.isArray(value)?value:[];return arr.map(normalizeSlide).filter(s=>s.title||s.text||s.image)}
export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS') return cors(res).status(204).end();
    if(req.method==='GET'){
      const raw=await redis('GET',[KEY]);
      return cors(res.status(200).json({slides:raw?normalizeSlides(JSON.parse(raw)):DEFAULT_SLIDES}));
    }
    if(req.method==='POST'){
      if(!isAdminRequest(req)) return cors(res.status(401).json({error:'Unauthorized'}));
      const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
      const slides=normalizeSlides(body.slides);
      if(!slides.length) return cors(res.status(400).json({error:'Добавьте хотя бы один слайд'}));
      await redis('SET',[KEY,JSON.stringify(slides)]);
      return cors(res.status(200).json({ok:true,slides}));
    }
    return cors(res.status(405).json({error:'Method not allowed'}));
  }catch(error){console.error('promo-slides error:',error);return cors(res.status(503).json({error:error.message||'Server error'}))}
}
