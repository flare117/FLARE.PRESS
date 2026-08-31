const KEY = 'flare:site-status';
const LOGIN = process.env.FLARE_ADMIN_LOGIN || 'flareitvadm';
const PASSWORD = process.env.FLARE_ADMIN_PASSWORD || 'flareitvadm';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const DEFAULT_UNTIL = '2026-09-01T06:00:00+03:00';

function redisConfigured(){return Boolean(REDIS_URL&&REDIS_TOKEN)}
async function redis(command,args=[]){
  if(!redisConfigured()) throw new Error('Upstash Redis is not connected');
  const response=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:`Bearer ${REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify([command,...args])});
  if(!response.ok){const details=await response.text().catch(()=> '');throw new Error(`Redis HTTP ${response.status}${details?`: ${details}`:''}`)}
  const json=await response.json();if(json.error)throw new Error(json.error);return json.result;
}
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-FLARE-Admin-Login, X-FLARE-Admin-Password');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');return res}
const defaultData={enabled:false,title:'FLARE — сайт отключён на проведение работ',text:'Сайт закрыт до 1 сентября — 06:00 по МСК',expiresAt:DEFAULT_UNTIL};
function normalize(data){
  const value={...defaultData,...(data||{})};
  const expiresAt=value.expiresAt||DEFAULT_UNTIL;
  const expiresMs=Date.parse(expiresAt);
  const expired=Number.isFinite(expiresMs)&&Date.now()>=expiresMs;
  return {enabled:Boolean(value.enabled)&&!expired,title:String(value.title||defaultData.title),text:String(value.text||defaultData.text),expiresAt};
}
export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS'){res.statusCode=204;return cors(res).end()}
    if(req.method==='GET'){
      const raw=await redis('GET',[KEY]);
      return cors(res.status(200).json(normalize(raw?JSON.parse(raw):defaultData)));
    }
    if(req.method==='POST'){
      const login=req.headers['x-flare-admin-login'],password=req.headers['x-flare-admin-password'];
      if(login!==LOGIN||password!==PASSWORD)return cors(res.status(401).json({error:'Unauthorized'}));
      const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
      const data=normalize({enabled:Boolean(body.enabled),title:String(body.title||defaultData.title),text:String(body.text||defaultData.text),expiresAt:body.expiresAt||DEFAULT_UNTIL});
      await redis('SET',[KEY,JSON.stringify(data)]);
      return cors(res.status(200).json({ok:true,...data}));
    }
    return cors(res.status(405).json({error:'Method not allowed'}));
  }catch(error){console.error('site-status error:',error);return cors(res.status(503).json({error:error.message||'Server error'}))}
}
