(function(){
  function init(){
    if(document.getElementById('flareManagerPopup')) return;
    const style=document.createElement('style');
    style.textContent=`#flareManagerPopup{position:fixed;right:24px;bottom:24px;width:min(390px,calc(100vw - 32px));background:#fff;color:#111216;border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.28);z-index:9999;overflow:hidden;border:1px solid #e5e5e7;animation:flareManagerIn .45s cubic-bezier(.2,.8,.2,1)}#flareManagerPopup .fmAccent{height:5px;background:#e31b23}#flareManagerPopup .fmBody{padding:20px}#flareManagerPopup .fmTop{display:flex;align-items:center;justify-content:space-between;gap:15px}#flareManagerPopup .fmTitle{font-size:23px;font-weight:900;letter-spacing:-.5px}#flareManagerPopup .fmClose{border:0;background:#f0f0f2;color:#666;width:32px;height:32px;border-radius:50%;font-size:21px;cursor:pointer;line-height:1}#flareManagerPopup .fmText{margin:9px 0 17px;color:#666;line-height:1.45;font-size:14px}#flareManagerPopup .fmButton{display:block;background:#e31b23;color:#fff;text-align:center;padding:12px 16px;border-radius:10px;font-weight:850;font-size:14px;transition:.2s}#flareManagerPopup .fmButton:hover{background:#c9161d;transform:translateY(-1px)}@keyframes flareManagerIn{from{opacity:0;transform:translateY(25px) scale(.97)}to{opacity:1;transform:none}}@media(max-width:600px){#flareManagerPopup{right:16px;bottom:16px;width:calc(100vw - 32px)}}`;
    document.head.appendChild(style);
    const popup=document.createElement('div');
    popup.id='flareManagerPopup';
    popup.setAttribute('role','dialog');
    popup.setAttribute('aria-label','Менеджер FLARE');
    popup.innerHTML='<div class="fmAccent"></div><div class="fmBody"><div class="fmTop"><div class="fmTitle">Менеджер тут 👋</div><button class="fmClose" type="button" aria-label="Закрыть">×</button></div><div class="fmText">Есть новость, реклама или предложение? Напиши менеджеру FLARE.</div><a class="fmButton" href="https://t.me/managerflareof" target="_blank" rel="noopener noreferrer">Написать менеджеру →</a></div>';
    document.body.appendChild(popup);
    popup.querySelector('.fmClose').addEventListener('click',()=>popup.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
