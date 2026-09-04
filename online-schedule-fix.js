(()=>{
const ids=Array.from({length:6},(_,i)=>i+1);let cached=[];
function legacySchedule(d){if(d?.sch1Title==='__FLARE_WEEK_SCHEDULE__'){try{const x=JSON.parse(d.sch1Text||'');if(Array.isArray(x))return Array.isArray(x[0])?x[0]:x}catch{}}return ids.map(i=>({time:d?.[`sch${i}Time`]||'',title:d?.[`sch${i}Title`]||'',category:d?.[`sch${i}Category`]||'',description:d?.[`sch${i}Text`]||'',image:d?.[`sch${i}Image`]||''}))}
function apply(list){ids.forEach((n,i)=>{const p=list?.[i]||{};const time=document.getElementById(`sch${n}Time`),title=document.getElementById(`sch${n}Title`),text=document.getElementById(`sch${n}Text`);if(time)time.textContent=p.time||'';if(title)title.textContent=p.title||'';if(text)text.textContent=p.description||p.text||p.category||'';[time,title,text].forEach(e=>{if(e){e.removeAttribute('value');e.removeAttribute('title')}})})}
async function load(){try{const r=await fetch('/api/schedule?ts='+Date.now(),{cache:'no-store'});if(!r.ok)return;const d=await r.json();let raw=d?.scheduleData;if(typeof raw==='string'){try{raw=JSON.parse(raw)}catch{raw=null}}let list=Array.isArray(raw)&&raw.length?(Array.isArray(raw[0])?raw[0]:raw):legacySchedule(d);cached=Array.isArray(list)?list:[];apply(cached)}catch{}}
function init(){load();setInterval(()=>{if(cached.length)apply(cached)},250);setInterval(load,10000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
