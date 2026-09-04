(()=>{
const ids=Array.from({length:6},(_,i)=>i+1);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function legacySchedule(d){
  if(d?.sch1Title==='__FLARE_WEEK_SCHEDULE__'){
    try{const x=JSON.parse(d.sch1Text||'');if(Array.isArray(x))return Array.isArray(x[0])?x[0]:x}catch{}
  }
  return ids.map(i=>({time:d?.[`sch${i}Time`],title:d?.[`sch${i}Title`],category:d?.[`sch${i}Category`],description:d?.[`sch${i}Text`],image:d?.[`sch${i}Image`]}));
}
function apply(list){
  ids.forEach((n,i)=>{
    const p=list?.[i]||{};
    const time=document.getElementById(`sch${n}Time`);const title=document.getElementById(`sch${n}Title`);const text=document.getElementById(`sch${n}Text`);
    if(time)time.textContent=p.time||'';
    if(title)title.textContent=p.title||'';
    if(text)text.textContent=p.description||p.text||p.category||'';
    [time,title,text].forEach(e=>{if(e){e.removeAttribute('title');e.removeAttribute('value')}});
  });
}
async function load(){
  try{
    const r=await fetch('/api/schedule?ts='+Date.now(),{cache:'no-store'});if(!r.ok)return;const d=await r.json();
    let list=Array.isArray(d.scheduleData)&&d.scheduleData.length?(Array.isArray(d.scheduleData[0])?d.scheduleData[0]:d.scheduleData):legacySchedule(d);
    if(!Array.isArray(list))list=[];
    apply(list);
  }catch{}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
