(function(){
  const bar=document.getElementById('marketWeatherBar');
  if(!bar)return;
  const tempEl=document.getElementById('marketWeatherTemp');
  const usdEl=document.getElementById('marketWeatherUSD');
  const eurEl=document.getElementById('marketWeatherEUR');
  const updatedEl=document.getElementById('marketWeatherUpdated');
  const iconEl=document.getElementById('marketWeatherIcon');
  function n(v){return Number(v).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function setUpdated(){updatedEl.textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date())+' МСК'}
  async function weather(){
    try{
      const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m,weather_code&timezone=Europe%2FMoscow',{cache:'no-store'});
      if(!r.ok)throw new Error();
      const d=await r.json(); const t=Math.round(d.current.temperature_2m); tempEl.textContent=(t>0?'+':'')+t+' °C';
      const c=d.current.weather_code; iconEl.textContent=c===0?'☀️':c<=3?'⛅':c<=67?'🌧️':c<=77?'❄️':'⛈️';
    }catch(e){tempEl.textContent='— °C';iconEl.textContent=''}
  }
  async function rates(){
    try{
      const r=await fetch('https://www.cbr-xml-daily.ru/daily_json.js?ts='+Date.now(),{cache:'no-store'});
      if(!r.ok)throw new Error();
      const d=await r.json(); usdEl.textContent=n(d.Valute.USD.Value); eurEl.textContent=n(d.Valute.EUR.Value);
    }catch(e){
      try{const r=await fetch('https://www.cbr.ru/scripts/XML_daily.asp?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error();const x=await r.text();const get=id=>{const m=x.match(new RegExp('<CharCode>'+id+'<\\/CharCode>[\\s\\S]*?<Value>([^<]+)<\\/Value>'));return m?m[1].replace(',','.'):''};usdEl.textContent=get('USD')?n(get('USD')):'—';eurEl.textContent=get('EUR')?n(get('EUR')):'—'}catch(_){usdEl.textContent='—';eurEl.textContent='—'}
    }
  }
  async function update(){await Promise.all([weather(),rates()]);setUpdated()}
  update();setInterval(update,3600000);
})();
