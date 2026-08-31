import { next } from '@vercel/functions';
const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const KEY='flare:site-status';
async function isMaintenance(){if(!REDIS_URL||!REDIS_TOKEN)return false;try{const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:`Bearer ${REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(['GET',KEY]),cache:'no-store'});if(!r.ok)return false;const j=await r.json();return !!(j.result&&JSON.parse(j.result).enabled)}catch{return false}}
export const config={runtime:'nodejs',matcher:['/','/:path*']};
export default async function middleware(request){const url=new URL(request.url);const p=url.pathname;if(p==='/404.html'||p.startsWith('/api/')||p.includes('.')&&!p.endsWith('.html'))return next();if(await isMaintenance()){const page=await fetch(new URL('/404.html',request.url));const body=await page.text();return new Response(body,{status:404,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}})}return next()}
