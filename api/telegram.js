export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const response = await fetch('https://t.me/s/flare_itv', {headers:{'User-Agent':'Mozilla/5.0 FLARE News Reader'},cache:'no-store'});
    if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
    const html = await response.text(); const posts=[];
    const blocks=html.split('tgme_widget_message_wrap').slice(1);
    for(const block of blocks.slice(-12)){
      const dataMatch=block.match(/data-post="flare_itv\/(\d+)"/); if(!dataMatch) continue;
      const id=dataMatch[1];
      const textMatch=block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
      const text=textMatch?textMatch[1].replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim():'Публикация FLARE';
      const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      const title=(lines[0]||'Публикация FLARE').slice(0,160);
      const body=lines.slice(1).join('\n').trim();
      const timeMatch=block.match(/<time[^>]+datetime="([^"]+)"/); const photoMatch=block.match(/background-image:url\('([^']+)'\)/);
      const hasVideo=/tgme_widget_message_video|<video\b|tgme_widget_message_document_video/.test(block);
      posts.push({id,text,title,body,time:timeMatch?timeMatch[1]:'',link:`https://t.me/flare_itv/${id}`,image:photoMatch?photoMatch[1].replace(/&amp;/g,'&'):'',hasVideo});
    }
    posts.reverse(); return res.status(200).json({posts,source:'telegram',updatedAt:new Date().toISOString()});
  }catch(error){return res.status(502).json({error:'Telegram feed unavailable',message:String(error.message||error)})}
}
