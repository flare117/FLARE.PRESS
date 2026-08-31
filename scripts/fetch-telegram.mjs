import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

const CHANNEL = 'flare_itv';
const URL = `https://t.me/s/${CHANNEL}`;
const OUT = new URL('../data/telegram.json', import.meta.url);

const res = await fetch(URL, {headers:{'user-agent':'Mozilla/5.0 FLARE Telegram Feed/1.0'}});
if (!res.ok) throw new Error(`Telegram returned HTTP ${res.status}`);
const html = await res.text();
const $ = cheerio.load(html);
const posts=[];
$('.tgme_widget_message_wrap').each((_,el)=>{
  const m=$(el).find('.tgme_widget_message').first();
  const dp=m.attr('data-post')||''; const id=dp.split('/').pop();
  if(!id || posts.some(p=>p.id===id)) return;
  const text=m.find('.tgme_widget_message_text').first().text().replace(/\s+/g,' ').trim();
  const time=m.find('time').first().attr('datetime')||'';
  const views=m.find('.tgme_widget_message_views').first().text().trim();
  const link=`https://t.me/${CHANNEL}/${id}`;
  const hasMedia=m.find('.tgme_widget_message_photo_wrap,.tgme_widget_message_video,.tgme_widget_message_document').length>0;
  if(!text && !hasMedia) return;
  posts.push({id,text:text||'Медиа-публикация FLARE',time,views,link});
});
posts.sort((a,b)=>Number(b.id)-Number(a.id));
await fs.writeFile(OUT, JSON.stringify({channel:CHANNEL,channelUrl:`https://t.me/${CHANNEL}`,updatedAt:new Date().toISOString(),posts:posts.slice(0,12)},null,2)+'\n');
console.log(`Saved ${Math.min(posts.length,12)} Telegram posts.`);
