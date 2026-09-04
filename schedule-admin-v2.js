(()=>{
const DAYS=['Сегодня','Завтра','Через 2 дня','Через 3 дня','Через 4 дня','Через 5 дней','Через 6 дней'];
const defaults=[['10:00','FLARE. Новости','Новости','Главные события дня, коротко и по делу.',''],['10:25','Истории города','Общество','Люди, места и события города.',''],['11:00','Дайджест','Дайджест','Самое важное за час.',''],['11:30','FLARE. Погода','Погода','Погода в Москве и регионах.',''],['12:00','Новости','Новости','Дневной выпуск FLARE.',''],['12:30','FLARE. Интервью','Интервью','Разговоры с гостями и героями дня.',''],['13:00','FLARE рекомендует','Шоу','Интересные истории и лучшие материалы FLARE.',''],['14:00','Новости','Новости','Дневной выпуск новостей.',''],['15:00','Дайджест','Дайджест','Главное за день.',''],['17:00','FLARE. Вечер','Информационная программа','Главные события к вечеру.',''],['19:00','Новости','Новости','Вечерний выпуск новостей FLARE.',''],['21:00','Прямой эфир','Эфир','События в реальном времени.','']];
const makeWeek=()=>Array.from({length:7},()=>defaults.map(x=>({time:x[0],title:x[1],category:x[2],description:x[3],image:x[4]})));
let week=makeWeek();let day=0;let dirty=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function normalizeWeek(x){if(!Array.isArray(x))return makeWeek();return Array.from({length:7},(_,di)=>Array.from({length:12},(_,i)=>{const p=Array.isArray(x[di])?x[di][i]:null;const d=defaults[i];return {time:p?.time||d[0],title:p?.title||d[1],category:p?.category||d[2],description:p?.description||d[3],image:p?.image||d[4]}}));}
function migrateLegacy(d){
  if(Array.isArray(d?.scheduleData)&&d.scheduleData.length)return normalizeWeek(d.scheduleData);
  if(d?.sch1Title==='__FLARE_WEEK_SCHEDULE__'){
    try{const parsed=JSON.parse(d.sch1Text||'');if(Array.isArray(parsed))return normalizeWeek(parsed)}catch{}
  }
  const w=makeWeek();
  for(let i=0;i<6;i++)w[0][i]={time:d?.[`sch${i+1}Time`]||w[0][i].time,title:d?.[`sch${i+1}Title`]||w[0][i].title,category:d?.[`sch${i+1}Category`]||w[0][i].category,description:d?.[`sch${i+1}Text`]||w[0][i].description,image:d?.[`sch${i+1}Image`]||''};
  return w;
}
async function load(){
  try{const r=await fetch('/api/schedule?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();week=migrateLegacy(d);localStorage.setItem('flareScheduleData',JSON.stringify(week));setStatus('✓ Телепрограмма загружена с сервера')}catch(e){try{const raw=localStorage.getItem('flareScheduleData');if(raw)week=normalizeWeek(JSON.parse(raw));setStatus('⚠️ Сервер недоступен, используется сохранённая сетка')}catch{setStatus('⚠️ Не удалось загрузить телепрограмму')}}
  render();
}
function setStatus(text){const s=document.getElementById('scheduleStatus');if(s)s.textContent=text;}
function render(){
  const host=document.querySelector('#scheduleTab .scheduleAdminGrid');if(!host)return;
  host.innerHTML=`<div class="scheduleDayTabs">${DAYS.map((x,i)=>`<button type="button" class="scheduleDayTab ${i===day?'active':''}" data-sday="${i}">${x}</button>`).join('')}</div><div class="scheduleEditors"></div><div class="scheduleSaveBar"><button type="button" class="redBtn" id="saveScheduleV2">Сохранить телепрограмму</button><span class="saved" id="scheduleSaveNote"></span></div>`;
  const editors=host.querySelector('.scheduleEditors');
  week[day].forEach((p,i)=>{const s=document.createElement('section');s.className='adminCard scheduleEditor';s.innerHTML=`<div class="editorHead"><h3>Программа ${i+1}</h3><span>${DAYS[day]}</span></div><label>Время<input data-k="time" data-i="${i}" type="time" value="${esc(p.time)}"></label><label>Название<input data-k="title" data-i="${i}" value="${esc(p.title)}"></label><label>Категория<input data-k="category" data-i="${i}" value="${esc(p.category)}"></label><label>Описание<textarea data-k="description" data-i="${i}">${esc(p.description)}</textarea></label><label>Картинка<input data-k="image" data-i="${i}" type="url" placeholder="https://…/image.jpg" value="${esc(p.image)}"></label><div class="imagePreview" data-preview="${i}" style="${p.image?`background-image:url('${esc(p.image)}')`:''}">${p.image?'':'Превью картинки'}</div>`;editors.appendChild(s)});
  dirty=false;
}
async function saveServer(){
  setStatus('⏳ Сохраняем телепрограмму…');
  try{
    const r=await fetch('/api/schedule?ts='+Date.now(),{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({scheduleData:week})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);
    localStorage.setItem('flareScheduleData',JSON.stringify(week));
    setStatus('✓ Телепрограмма сохранена на сервере');
    const note=document.getElementById('scheduleSaveNote');if(note)note.textContent='Сохранено';
    dirty=false;return true;
  }catch(e){setStatus('❌ '+e.message);return false}
}
window.saveScheduleV2=saveServer;
window.saveSchedule=saveServer;
function bind(){
  const host=document.querySelector('#scheduleTab .scheduleAdminGrid');if(!host||host.dataset.bound)return;host.dataset.bound='1';
  host.addEventListener('click',e=>{
    const b=e.target.closest('[data-sday]');if(b){day=Number(b.dataset.sday)||0;render();return}
    const save=e.target.closest('#saveScheduleV2');if(save)saveServer();
  });
  host.addEventListener('input',e=>{const el=e.target.closest('[data-k]');if(!el)return;const i=Number(el.dataset.i);if(!week[day]?.[i])return;week[day][i][el.dataset.k]=el.value;dirty=true;localStorage.setItem('flareScheduleData',JSON.stringify(week));if(el.dataset.k==='image'){const p=host.querySelector(`[data-preview="${i}"]`);if(p){p.style.backgroundImage=el.value?`url("${el.value.replace(/"/g,'')}")`:'';p.textContent=el.value?'':'Превью картинки'}}});
}
function inject(){if(document.getElementById('scheduleAdminV3Style'))return;const st=document.createElement('style');st.id='scheduleAdminV3Style';st.textContent='.scheduleDayTabs{display:flex;gap:8px;overflow:auto;margin:0 0 18px;padding-bottom:4px}.scheduleDayTab{border:1px solid #d6d7da;background:#fff;border-radius:999px;padding:10px 14px;font:inherit;font-weight:800;white-space:nowrap;cursor:pointer}.scheduleDayTab.active{background:#ef4b23;border-color:#ef4b23;color:#fff}.scheduleEditors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.scheduleEditor{min-width:0}.editorHead{display:flex;justify-content:space-between;gap:10px;align-items:center}.editorHead h3{margin-top:0}.editorHead span{font-size:10px;color:#888;text-transform:uppercase}.scheduleEditor input,.scheduleEditor textarea{width:100%;box-sizing:border-box}.imagePreview{height:120px;margin-top:10px;border-radius:10px;border:1px dashed #ccc;background:#f4f4f5 center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px}.scheduleSaveBar{display:flex;align-items:center;gap:12px;margin-top:18px}@media(max-width:800px){.scheduleEditors{grid-template-columns:1fr}}';document.head.appendChild(st)}
function init(){inject();render();bind();load()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();