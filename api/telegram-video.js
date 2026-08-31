export default async function handler(req, res) {
  const id = String(req.query?.id || '').replace(/\D/g, '');
  if (!id) return res.status(400).json({ error: 'Missing video id' });

  try {
    const url = `https://t.me/flare_itv/${id}?embed=1&single=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FLARE Video Player' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);

    const html = await response.text();
    const player = html.match(/<a[^>]+class="[^"]*tgme_widget_message_video_player[^"]*"[\s\S]*?<\/a>/i);
    const area = player ? player[0] : html;
    const match = area.match(/<video[^>]+src=["']([^"']+)["']/i)
      || area.match(/<video[^>]+data-src=["']([^"']+)["']/i)
      || area.match(/<source[^>]+src=["']([^"']+)["']/i);

    if (!match?.[1]) throw new Error('Telegram video URL not found');

    const videoUrl = String(match[1])
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Location', videoUrl);
    return res.status(302).end();
  } catch (error) {
    return res.status(404).json({ error: 'Video unavailable', message: String(error.message || error) });
  }
}
