import { createHmac, timingSafeEqual } from 'node:crypto';

const LOGIN = process.env.FLARE_ADMIN_LOGIN || 'flareitvadm';
const PASSWORD = process.env.FLARE_ADMIN_PASSWORD || 'flareitvadm';
const SECRET = process.env.FLARE_ADMIN_SECRET || PASSWORD;
const COOKIE = 'flare_admin';
const MAX_AGE = 60 * 60 * 24 * 7;

function tokenFor(login){
  return createHmac('sha256', SECRET).update(`flare-admin-v1:${login}`).digest('base64url');
}
function validToken(token){
  if(!token)return false;
  const a=Buffer.from(token);
  const b=Buffer.from(tokenFor(LOGIN));
  return a.length===b.length&&timingSafeEqual(a,b);
}
function cookieValue(req){
  const raw=req.headers.cookie||'';
  const match=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`));
  return match?decodeURIComponent(match.slice(COOKIE.length+1)):'';
}
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','same-origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Cache-Control','no-store');
  return res;
}
export function isAdminRequest(req){return validToken(cookieValue(req))}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    if(body.action==='logout'){
      res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      return res.status(200).json({ok:true,authenticated:false});
    }
    if(body.login!==LOGIN||body.password!==PASSWORD)return res.status(401).json({ok:false,error:'Неверный логин или пароль.'});
    res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(tokenFor(LOGIN))}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
    return res.status(200).json({ok:true,authenticated:true});
  }catch(e){return res.status(400).json({ok:false,error:'Некорректный запрос.'})}
}
