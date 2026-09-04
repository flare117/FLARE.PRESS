(function(){
  const form=document.getElementById('loginForm');
  const json=async r=>{const t=await r.text();try{return JSON.parse(t)}catch{return {error:t||('HTTP '+r.status)}}};
  const api=async (url,options={})=>fetch(url,{cache:'no-store',credentials:'same-origin',...options});
  async function login(e){
    e.preventDefault();e.stopImmediatePropagation();
    const err=document.getElementById('loginError');if(err)err.textContent='Входим…';
    try{const r=await api('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:document.getElementById('login')?.value||'',password:document.getElementById('password')?.value||''})});const d=await json(r);if(!r.ok||!d.authenticated)throw new Error(d.error||'Не удалось войти');sessionStorage.setItem('flareAdmin','1');if(err)err.textContent='';if(typeof showPanel==='function')showPanel()}catch(x){if(err)err.textContent='❌ '+x.message}}
  if(form)form.addEventListener('submit',login,true);

  async function saveServerConfig(){
    const keys=['liveEnabled','vkUrl','onairTitle','onairText','nextTitle','nextTime','sch1Time','sch1Title','sch1Category','sch1Text','sch2Time','sch2Title','sch2Category','sch2Text','sch3Time','sch3Title','sch3Category','sch3Text','sch4Time','sch4Title','sch4Category','sch4Text','sch5Time','sch5Title','sch5Category','sch5Text','sch6Time','sch6Title','sch6Category','sch6Text','newsSource','newsTitle','newsText','newsTime','news2Title','news2Text','news2Category','news3Title','news3Text','news3Category','aboutText','aboutYear','program1Title','program1Text','program2Title','program2Text','program3Title','program3Text','rateUSD','rateEUR','rateGold','rateSilver','ratePlatinum','ratePalladium','rateUpdated'];
    const payload={};for(const k of keys){const el=document.getElementById(k);if(el)payload[k]=el.type==='checkbox'?el.checked:el.value}
    const r=await api('/api/site-config?ts='+Date.now(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await json(r);if(!r.ok)throw new Error(d.error||('HTTP '+r.status));localStorage.setItem('flareData',JSON.stringify({...payload,...d}));return d;
  }
  async function saveScheduleServer(){
    const keys=['onairTitle','onairText','nextTitle','nextTime','sch1Time','sch1Title','sch1Category','sch1Text','sch2Time','sch2Title','sch2Category','sch2Text','sch3Time','sch3Title','sch3Category','sch3Text','sch4Time','sch4Title','sch4Category','sch4Text','sch5Time','sch5Title','sch5Category','sch5Text','sch6Time','sch6Title','sch6Category','sch6Text'];
    const payload={};for(const k of keys){const el=document.getElementById(k);if(el)payload[k]=el.value}
    const r=await api('/api/schedule?ts='+Date.now(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await json(r);if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d;
  }
  const save=document.getElementById('save');
  if(save)save.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const s=document.getElementById('saved');if(s)s.textContent='⏳ Сохраняем на сервер…';try{await saveServerConfig();await saveScheduleServer();if(s)s.textContent='✓ Все изменения сохранены на сервере'}catch(x){if(s)s.textContent='❌ '+x.message}setTimeout(()=>{if(s)s.textContent=''},4500)},true);

  const logout=document.getElementById('logout');
  if(logout)logout.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();try{await api('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})})}finally{sessionStorage.removeItem('flareAdmin');location.reload()}},true);

  async function refreshServerConfig(){try{const r=await api('/api/site-config?ts='+Date.now());if(!r.ok)return;const d=await r.json();const local=JSON.parse(localStorage.getItem('flareData')||'{}');localStorage.setItem('flareData',JSON.stringify({...local,...d}));for(const [k,v] of Object.entries(d)){const el=document.getElementById(k);if(el){if(el.type==='checkbox')el.checked=!!v;else el.value=v??''}}}catch{}}
  if(sessionStorage.getItem('flareAdmin')==='1')setTimeout(refreshServerConfig,150);
})();
