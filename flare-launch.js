/* FLARE Global Winter Launch — 01.12.2026 */
(function(){
  'use strict';
  const launch=new Date('2026-12-01T00:00:00+03:00');
  const now=new Date();
  document.documentElement.classList.add('flare-winter-2026');
  const banner=document.createElement('div');
  banner.className='flareLaunchBanner';
  function render(){
    const diff=launch-new Date();
    if(diff<=0){banner.classList.add('done');banner.innerHTML='✦ <strong>FLARE · НОВОГОДНЕЕ ОБНОВЛЕНИЕ</strong> уже запущено';return}
    const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000);
    banner.innerHTML='❄ <strong>ГЛОБАЛЬНОЕ ОБНОВЛЕНИЕ</strong> · 1 декабря · до запуска: '+d+'д '+h+'ч '+m+'м';
  }
  render(); setInterval(render,30000);
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(banner));
})();
