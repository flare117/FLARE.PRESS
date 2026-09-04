(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function parseSchedule(d){
  let x=d?.scheduleData;
  if(typeof x==='string'){try{x=JSON.parse(x)}catch{x=null}}
  if(Array.isArray(x)&&x.length){
    const day=Array.isArray(x[0])?x[0]:x;
    return day.filter(Boolean).filter(p=>p.time||p.title||p.description||p.image);
  }
  const legacy=String(d?.sch1Text||'');
  if(d?.sch1Title==='__FLARE_WEEK_SCHEDULE__'){
    try{const y=JSON.parse(legacy);const day=Array.isArray(y?.[0])?y[0]:y;return Array.isArray(day)?day.filter(Boolean):[]}catch{}
  }
  const ids=['sch1','sch2','sch3','sch4','sch5','sch6'];
  return ids.map((id,i)=>({time:d?.[id+'Time']||'',title:d?.[id+'Title']||'',category:d?.[id+'Category']||'',description:d?.[id+'Text']||''})).filter(p=>p.time||p.title||p.description);
}
function render(items){
  const rows=[...document.querySelectorAll('.onlineRows .onlineRow')];
  if(!rows.length)return;
  rows.forEach((row,i)=>{
    const p=items[i];
    if(!p){row.hidden=true;return}
    row.hidden=false;
    row.querySelector('time')?.replaceChildren(document.createTextNode(String(p.time||'')));
    const b=row.querySelector('b'); if(b)b.textContent=String(p.title||'Без названия');
    const small=row.querySelector('small'); if(small)small.textContent=String(p.description||p.category||'');
    const badge=row.querySelector('.onlineBadge'); if(badge)badge.remove();
    if(i===0){const holder=row.querySelector('div');if(holder&&!holder.querySelector('.onlineBadge')){const s=document.createElement('span');s.className='onlineBadge';s.textContent='СЕЙЧАС';holder.appendChild(s)}}
  });
  rows.slice(items.length).forEach(r=>r.hidden=true);
}
async function load(){try{const r=await fetch('/api/schedule?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json();render(parseSchedule(d))}catch{render([])}}
function init(){load();setInterval(load,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
