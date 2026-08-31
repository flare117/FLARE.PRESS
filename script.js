const items=[['Главные события дня: что важно знать прямо сейчас','Новости','news.html'],['Что изменится этой осенью','Общество','news.html'],['Новые технологии меняют привычный эфир','Технологии','news.html'],['FLARE. Новости','Программа','programs.html'],['Истории города','Программа','programs.html'],['Дайджест','Программа','programs.html'],['Телепрограмма FLARE','Эфир','schedule.html']];
const DEFAULT_FLARE={liveEnabled:false,vkUrl:'',onairTitle:'FLARE. Новости',onairText:'Главные события дня — коротко и по делу.',newsTitle:'Главные события дня: что важно знать прямо сейчас',newsText:'Короткие новости, важные события и комментарии редакции FLARE.',newsTime:'СЕГОДНЯ · 10:15',news2Title:'Что изменится этой осенью',news3Title:'Новые технологии меняют привычный эфир',sch1Title:'FLARE. Новости',sch2Title:'Истории города',sch3Title:'Дайджест',sch4Title:'FLARE. Погода',aboutText:'FLARE — интернет-телеканал нового формата: новости, программы, прямые трансляции и важные события.',aboutYear:'2026'};
function flareData(){try{return {...DEFAULT_FLARE,...JSON.parse(localStorage.getItem('flareData')||'{}')}}catch{return {...DEFAULT_FLARE}}}
function applyFlareData(){const d=flareData();Object.entries(d).forEach(([k,v])=>{document.querySelectorAll('#'+k).forEach(e=>{if(e.tagName==='INPUT'||e.tagName==='TEXTAREA')e.value=v;else e.textContent=v})}); const wrap=document.getElementById('vkPlayerWrap'), iframe=document.getElementById('vkPlayer'), off=document.getElementById('offlineState'); if(wrap&&iframe&&off){if(d.liveEnabled&&d.vkUrl){iframe.src=d.vkUrl;wrap.hidden=false;off.hidden=true}else{iframe.removeAttribute('src');wrap.hidden=true;off.hidden=false}}}
function openSearch(){const s=document.getElementById('search');if(!s)return;s.classList.add('open');const q=document.getElementById('q');q.value='';q.focus();searchSite()}
function closeSearch(e){const s=document.getElementById('search');if(!s)return;if(!e||e.target===s)s.classList.remove('open')}
function searchSite(){const q=(document.getElementById('q')?.value||'').trim().toLowerCase();const r=document.getElementById('results');if(!r)return;const found=items.filter(x=>!q||x[0].toLowerCase().includes(q)||x[1].toLowerCase().includes(q));r.innerHTML=found.map(x=>`<a class="result" href="${x[2]}"><b>${x[0]}</b><small>${x[1]}</small></a>`).join('')||'<p>Ничего не найдено</p>'}
function updateClock(){const el=document.getElementById('clock');if(!el)return;el.textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date())}
applyFlareData();updateClock();setInterval(updateClock,1000);document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('search')?.classList.remove('open')});

function renderFlareRates(){const d=flareData();document.querySelectorAll('[data-rate]').forEach(e=>{const v=d['rate'+e.dataset.rate];e.textContent=v?Number(v).toLocaleString('ru-RU',{maximumFractionDigits:4})+' ₽':'—'});document.querySelectorAll('[data-rate-date]').forEach(e=>e.textContent=d.rateUpdated||'Курс в админ-панели');}
renderFlareRates();

async function loadTelegramNews(){
  const targets=[document.getElementById('telegramNewsHome'),document.getElementById('telegramNewsPage')].filter(Boolean);
  if(!targets.length)return;
  try{
    const res=await fetch('data/telegram.json?'+Date.now(),{cache:'no-store'});
    if(!res.ok)throw new Error('feed');
    const data=await res.json();
    const posts=Array.isArray(data.posts)?data.posts:[];
    targets.forEach(target=>{
      if(!posts.length){target.innerHTML='<div class="telegramEmpty">Пока нет публикаций. <a href="https://t.me/flare_itv" target="_blank" rel="noopener">Открыть Telegram FLARE →</a></div>';return;}
      const limit=target.id==='telegramNewsHome'?3:9;
      target.innerHTML=posts.slice(0,limit).map(p=>{
        const safeText=(p.text||'Медиа-публикация FLARE').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const date=p.time?new Date(p.time).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
        return `<article class="telegramCard"><div class="telegramCardTop"><span>FLARE · TELEGRAM</span><time>${date}</time></div><h3>${safeText}</h3><div class="telegramCardBottom"><span>${p.views||''}</span><a href="${p.link}" target="_blank" rel="noopener">Читать в Telegram →</a></div></article>`;
      }).join('');
    });
  }catch(e){
    targets.forEach(target=>target.innerHTML='<div class="telegramEmpty">Не удалось загрузить ленту. <a href="https://t.me/flare_itv" target="_blank" rel="noopener">Открыть @flare_itv →</a></div>');
  }
}
loadTelegramNews();

