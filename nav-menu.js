(()=>{
const extras=[
 ['📺 Сейчас и далее','index.html#now-next'],
 ['📰 Архив новостей','news.html#archive'],
 ['💱 Курс валют и металлов','index.html#rates'],
 ['🎬 Программы FLARE','programs.html'],
 ['🔴 Прямо сейчас','index.html#live'],
 ['🌦️ Погода Москвы и Московской области','index.html#weather']
];
function init(){
 document.querySelectorAll('.nav').forEach(nav=>{
  const n=nav.querySelector('nav'); if(!n)return;
  const links=[...n.querySelectorAll('a')];
  const find=t=>links.find(a=>a.textContent.trim()===t);
  const main=['Главная','Новости','Курс','Телепрограмма','О канале'];
  n.innerHTML='';
  main.forEach(t=>{const a=find(t)||document.createElement('a');if(!a.textContent)a.textContent=t;if(t==='Главная')a.href='index.html';if(t==='Новости')a.href='news.html';if(t==='Курс')a.href='index.html#rates';if(t==='Телепрограмма')a.href='schedule.html';if(t==='О канале')a.href='about.html';n.appendChild(a)});
  const menu=document.createElement('div');menu.className='flareMoreMenu';
  menu.innerHTML='<button class="flareMenuBtn" aria-label="Дополнительное меню" aria-expanded="false"><span></span><span></span><span></span></button><div class="flareMoreDropdown"></div>';
  const drop=menu.querySelector('.flareMoreDropdown');
  extras.forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;drop.appendChild(a)});
  nav.appendChild(menu);
  const btn=menu.querySelector('.flareMenuBtn');
  btn.addEventListener('click',e=>{e.stopPropagation();menu.classList.toggle('open');btn.setAttribute('aria-expanded',menu.classList.contains('open'))});
  menu.addEventListener('mouseenter',()=>menu.classList.add('open'));
  menu.addEventListener('mouseleave',()=>menu.classList.remove('open'));
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
