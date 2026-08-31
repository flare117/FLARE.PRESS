export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch('https://t.me/s/flare_itv', {
      headers: { 'User-Agent': 'Mozilla/5.0 FLARE News Reader' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);

    const html = await response.text();
    const posts = [];
    const blocks = html.split('tgme_widget_message_wrap').slice(1);

    for (const block of blocks.slice(-12)) {
      const dataMatch = block.match(/data-post="flare_itv\/(\d+)"/);
      if (!dataMatch) continue;

      const id = dataMatch[1];
      const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);

      let text = textMatch ? textMatch[1]
        .replace(/<br\s*\/?>(?=.)/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#33;/gi, '!')
        .replace(/&#x27;/gi, "'")
        : 'Публикация FLARE';

      const lines = text
        .split(/\r?\n+/)
        .map(x => x.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean);

      const title = (lines[0] || 'Публикация FLARE').slice(0, 160);
      const body = lines.slice(1).join('\n\n').trim();

      const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/);
      const photoMatch = block.match(/background-image:url\('([^']+)'\)/);
      const videoMatch = block.match(/<video[^>]+src="([^"]+)"[^>]*>/i);
      const videoUrl = videoMatch ? videoMatch[1].replace(/&amp;/g, '&') : '';
      const hasVideo = Boolean(videoUrl) || /tgme_widget_message_video|tgme_widget_message_document_video/.test(block);

      posts.push({
        id,
        text,
        title,
        body,
        time: timeMatch ? timeMatch[1] : '',
        link: `https://t.me/flare_itv/${id}`,
        image: photoMatch ? photoMatch[1].replace(/&amp;/g, '&') : '',
        hasVideo,
        videoUrl
      });
    }

    posts.reverse();
    return res.status(200).json({ posts, source: 'telegram', updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({
      error: 'Telegram feed unavailable',
      message: String(error.message || error)
    });
  }
}
