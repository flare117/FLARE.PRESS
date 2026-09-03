import { randomBytes } from 'node:crypto';
import { isAdminRequest } from './admin-auth.js';
const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const KEY='flare:online';
const TTL=45;
async function redis(command,args=[]){if(!REDIS_URL||!REDIS_TOKEN)throw new Error('Upstash Redis is not connected');const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:`Bearer ${REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify([command,...args])});const j=await r.json();if(!r.ok||j.error)throw new Error(j.error||`Redis HTTP ${r.status}`);return j.result}
function cors(res){res.setHeader('Access-Control-Allow-Origin','same-origin');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Cache-Control','no-store');return res}
function sid(req){const raw=String(req.body?.sid||'');return /^[a-f0-9]{16,64}$/i.test(raw)?raw:randomBytes(16).toString('hex')}
export default async function handler(req,res){cors(res);if(req.method==='OPTIONS')return res.status(204).end();try{const now=Date.now();if(req.method==='POST'){const id=sid(req);await redis('ZADD',[KEY,now,id]);await redis('ZREMRANGEBYSCORE',[KEY,0,now-TTL*1000]);return res.status(200).json({ok:true,sid:id,ttl:TTL})}if(req.method==='GET'){if(!isAdminRequest(req))return res.status(401).json({error:'Unauthorized'});await redis('ZREMRANGEBYSCORE',[KEY,0,now-TTL*1000]);const count=await redis('ZCARD',[KEY]);return res.status(200).json({online:Number(count)||0,updatedAt:now})}return res.status(405).json({error:'Method not allowed'})}catch(e){console.error('online error',e);return res.status(503).json({error:e.message||'Server error'})}}
