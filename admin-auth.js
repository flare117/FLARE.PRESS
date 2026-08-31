// Server-side admin login bridge. Authorization is stored in an HttpOnly cookie.
(function(){
  const form=document.getElementById('loginForm');
  if(form)form.addEventListener('submit',async function(){
    const login=document.getElementById('login')?.value||'';
    const password=document.getElementById('password')?.value||'';
    try{
      const r=await fetch('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({login,password})});
      if(!r.ok){const j=await r.json().catch(()=>({}));console.warn('Admin authentication failed:',j.error||r.status)}
    }catch(e){console.warn('Admin authentication request failed:',e)}
  },true);
  const logout=document.getElementById('logout');
  if(logout)logout.addEventListener('click',async function(){
    try{await fetch('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({action:'logout'})})}catch(e){}
  },true);
})();
