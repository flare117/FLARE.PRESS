import { next } from '@vercel/functions';
const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_ENDPOINT;
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const KEY='flare:site-status';

async function getSiteStatus(){
  if(!REDIS_URL||!REDIS_TOKEN)return {enabled:false};
  try{
    const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:`Bearer ${REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(['GET',KEY]),cache:'no-store'});
    if(!r.ok)return {enabled:false};
    const j=await r.json();
    const data=j.result?JSON.parse(j.result):null;
    if(!data)return {enabled:false};
    const expires=Date.parse(data.expiresAt||'');
    if(Number.isFinite(expires)&&Date.now()>=expires)return {enabled:false,expired:true};
    return data;
  }catch{return {enabled:false}}
}

export const config={runtime:'nodejs',matcher:['/','/:path*']};
export default async function middleware(request){
  const url=new URL(request.url),p=url.pathname;
  if(p==='/404.html'||p==='/admin.html'||p.startsWith('/api/')||(p.includes('.')&&!p.endsWith('.html')))return next();
  const status=await getSiteStatus();
  if(status.enabled){
    const page=await fetch(new URL('/404.html',request.url),{cache:'no-store'});
    const body=await page.text();
    return new Response(body,{status:404,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate'}});
  }
  return next();
}
