import { next } from '@vercel/functions';
import { createHmac, timingSafeEqual } from 'node:crypto';
const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const ADMIN_LOGIN=process.env.FLARE_ADMIN_LOGIN||'flareitvadm';
const ADMIN_SECRET=process.env.FLARE_ADMIN_SECRET||process.env.FLARE_ADMIN_PASSWORD||'flareitvadm';
const KEY='flare:site-status';
function isAdmin(request){const raw=request.headers.get('cookie')||'';const match=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith('flare_admin='));if(!match)return false;try{const token=decodeURIComponent(match.slice('flare_admin='.length));const expected=createHmac('sha256',ADMIN_SECRET).update(`flare-admin-v1:${ADMIN_LOGIN}`).digest('base64url');const a=Buffer.from(token),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
async function getSiteStatus(){if(!REDIS_URL||!REDIS_TOKEN)return{enabled:false};try{const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:`Bearer ${REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(['GET',KEY]),cache:'no-store'});if(!r.ok)return{enabled:false};const j=await r.json();const data=j.result?JSON.parse(j.result):null;if(!data||!data.updatedAt)return{enabled:false,legacy:true};const expires=Date.parse(data.expiresAt||'');if(Number.isFinite(expires)&&Date.now()>=expires)return{enabled:false,expired:true};return data}catch{return{enabled:false}}}
export const config={runtime:'nodejs',matcher:['/','/:path*']};
export default async function middleware(request){const url=new URL(request.url),p=url.pathname;if(p==='/404.html'||p==='/admin.html'||p.startsWith('/api/')||(p.includes('.')&&!p.endsWith('.html')))return next();const status=await getSiteStatus();if(status.enabled&&!isAdmin(request)){const page=await fetch(new URL('/404.html',request.url),{cache:'no-store'});const body=await page.text();return new Response(body,{status:404,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate'}})}return next();}
