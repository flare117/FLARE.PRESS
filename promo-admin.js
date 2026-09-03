(function(){
  const DEFAULTS=[
    {title:'ГЛАВНЫЕ НОВОСТИ ВСЕГДА ПОД РУКОЙ',text:'Подписывайтесь на наш канал в Телеграм',button:'Подробнее',link:'https://t.me/flare_itv',image:''},
    {title:'СОТРУДНИЧАЙТЕ С FLARE',text:'Реклама, сотрудничество и ваши новости — пишите менеджеру.',button:'Подробнее',link:'https://t.me/managerflareof',image:''}
  ];
  const list=document.getElementById('promoAdminList');
  const status=document.getElementById('promoStatus');
  const tab=document.querySelector('.adminTab[data-tab="promoTab"]');
  const panel=document.getElementById('promoTab');
  if(!list||!tab||!panel)return;
  let slides=[];
  function openTab(){document.querySelectorAll('.adminTab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.adminTabPanel').forEach(x=>x.classList.remove('active'));tab.classList.add('active');panel.classList.add('active');loadSlides()}
  tab.addEventListener('click',openTab);
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')}
  function render(){
    list.innerHTML=slides.map((s,i)=>`<div class="promoAdminCard" data-index="${i}"><div class="promoAdminCardTop"><h3>Слайд ${i+1}</h3><button type="button" class="ghostAdmin promoRemove" data-index="${i}">Удалить</button></div><div class="promoAdminGrid"><div class="promoPreview">${s.image?`<img src="${esc(s.image)}" alt="Предпросмотр">`:'<span>Без изображения</span>'}</div><div><label>Заголовок<input data-field="title" value="${esc(s.title)}" placeholder="Например: ГЛАВНЫЕ НОВОСТИ"></label><label>Текст<textarea data-field="text" placeholder="Описание слайда">${esc(s.text)}</textarea></label><div class="rateGrid"><label>Текст кнопки<input data-field="button" value="${esc(s.button||'Подробнее')}"></label><label>Ссылка кнопки<input data-field="link" value="${esc(s.link)}" placeholder="https://t.me/..." ></label></div><label>Изображение<input class="promoFile" type="file" accept="image/*" data-index="${i}"><span class="promoFileHint">Можно выбрать файл до 600 КБ.</span></label><label>Или URL изображения<input data-field="image" value="${esc(s.image)}" placeholder="https://.../image.jpg"></label></div></div></div>`).join('');
    list.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{const i=Number(input.closest('.promoAdminCard').dataset.index);slides[i][input.dataset.field]=input.value;if(input.dataset.field==='image')render()}));
    list.querySelectorAll('.promoRemove').forEach(btn=>btn.addEventListener('click',()=>{slides.splice(Number(btn.dataset.index),1);render()}));
    list.querySelectorAll('.promoFile').forEach(file=>file.addEventListener('change',readImage));
  }
  function readImage(e){const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){status.textContent='❌ Выберите изображение';return}if(file.size>600*1024){status.textContent='❌ Изображение больше 600 КБ';e.target.value='';return}const reader=new FileReader();reader.onload=()=>{slides[Number(e.target.dataset.index)].image=reader.result;status.textContent='✓ Изображение добавлено';render()};reader.onerror=()=>status.textContent='❌ Не удалось прочитать изображение';reader.readAsDataURL(file)}
  async function loadSlides(){status.textContent='⏳ Загружаем…';try{const r=await fetch('/api/promo-slides?ts='+Date.now(),{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();slides=Array.isArray(d.slides)?d.slides:DEFAULTS.map(x=>({...x}));status.textContent='';render()}catch(e){slides=DEFAULTS.map(x=>({...x}));status.textContent='⚠️ Сервер недоступен — показаны стандартные слайды';render()}}
  document.getElementById('addPromoSlide')?.addEventListener('click',()=>{slides.push({title:'НОВЫЙ СЛАЙД',text:'Текст нового слайда',button:'Подробнее',link:'https://t.me/managerflareof',image:''});render()});
  document.getElementById('savePromoSlides')?.addEventListener('click',async()=>{status.textContent='⏳ Сохраняем…';try{const r=await fetch('/api/promo-slides?ts='+Date.now(),{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({slides})});const d=await r.json();if(!r.ok)throw new Error(d.error||('HTTP '+r.status));slides=d.slides||slides;render();status.textContent='✓ Слайды сохранены на сервере'}catch(e){status.textContent='❌ '+e.message}});
  loadSlides();
})();
