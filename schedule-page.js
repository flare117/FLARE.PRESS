(()=>{
async function init(){try{const r=await fetch('/api/schedule?ts='+Date.now(),{cache:'no-store'});if(!r.ok)return;const d=await r.json();for(let i=1;i<=6;i++){['Category','Time','Title','Text'].forEach(k=>{const e=document.getElementById(`sch${i}${k}`);if(e&&d[`sch${i}${k}`]!==undefined)e.textContent=d[`sch${i}${k}`]})}const first=document.getElementById('sch1Text');if(first&&d.sch1Text)first.textContent=d.sch1Text}catch(e){console.warn('Schedule load failed',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
setInterval(init,60000);
})();
