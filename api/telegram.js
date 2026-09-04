const CHANNEL = '@flare_itv';
const REDIS_KEY = 'flare:telegram_posts';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN || '';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_ENDPOINT || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'").replace(/&#33;/g, '!').replace(/&nbsp;/g, ' ');
}

function textFromMessage(message) {
  const value = message?.text ?? message?.caption ?? '';
  if (typeof value === 'string') return value.trim();
  return String(value?.text || '').trim();
}

function normalizeMessage(message) {
  if (!message) return null;
  const text = textFromMessage(message);
  const id = String(message.message_id || '');
  if (!id) return null;
  const lines = text.split(/\r?\n+/).map(x => x.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);
  const title = (lines[0] || 'Публикация FLARE').slice(0, 160);
  const body = lines.slice(1).join('\n\n').trim();
  const photo = Array.isArray(message.photo) && message.photo.length ? message.photo[message.photo.length - 1] : null;
  const video = message.video || null;
  const document = message.document || null;
  const isDocumentVideo = (document?.mime_type || '').startsWith('video/');
  return {
    id,
    text,
    title,
    body,
    time: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
    link: `https://t.me/flare_itv/${id}`,
    image: photo?.file_id || '',
    videoFileId: video?.file_id || (isDocumentVideo ? document?.file_id || '' : ''),
    hasVideo: !!video || isDocumentVideo,
    source: 'telegram-bot'
  };
}

async function redis(command, ...args) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const response = await fetch(`${REDIS_URL}/${command}/${args.map(x => encodeURIComponent(x)).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Redis HTTP ${response.status}`);
  return response.json();
}

async function readPosts() {
  const result = await redis('get', REDIS_KEY);
  if (!result?.result) return [];
  try { return JSON.parse(result.result); } catch { return []; }
}

async function writePosts(posts) {
  const clean = posts.filter(Boolean).slice(0, 50);
  await redis('set', REDIS_KEY, JSON.stringify(clean));
  return clean;
}

async function telegram(method, body = {}) {
  if (!BOT_TOKEN) throw new Error('Telegram bot token is not configured');
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), cache: 'no-store'
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || `Telegram API error ${response.status}`);
  return data.result;
}

async function storeMessage(message) {
  const post = normalizeMessage(message);
  if (!post) return [];
  const posts = await readPosts();
  const next = [post, ...posts.filter(x => String(x.id) !== post.id)];
  return writePosts(next);
}

async function fallbackPublicFeed() {
  const response = await fetch('https://t.me/s/flare_itv', {
    headers: { 'User-Agent': 'Mozilla/5.0 FLARE News Reader' }, cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  const html = await response.text();
  const posts = [];
  const blocks = html.split('tgme_widget_message_wrap').slice(1);
  for (const block of blocks.slice(-20)) {
    const dataMatch = block.match(/data-post="flare_itv\/(\d+)"/);
    if (!dataMatch) continue;
    const id = dataMatch[1];
    const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    const text = textMatch ? decodeHtml(textMatch[1].replace(/<br\s*\/?>(?=.)/gi, '\n').replace(/<[^>]+>/g, '')) : 'Публикация FLARE';
    const lines = text.split(/\r?\n+/).map(x => x.trim()).filter(Boolean);
    const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/);
    const photoMatch = block.match(/background-image:url\('([^']+)'\)/);
    posts.push({ id, text, title: (lines[0] || 'Публикация FLARE').slice(0,160), body: lines.slice(1).join('\n\n'), time: timeMatch?.[1] || '', link: `https://t.me/flare_itv/${id}`, image: photoMatch ? decodeHtml(photoMatch[1]) : '', hasVideo: /tgme_widget_message_video|<video\b/i.test(block), videoUrl: '' });
  }
  return posts.reverse();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
      if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).json({ error: 'Unauthorized' });
      const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const message = update.channel_post || update.edited_channel_post;
      if (message) {
        const chat = message.chat?.username ? `@${message.chat.username}` : '';
        if (chat.toLowerCase() === CHANNEL.toLowerCase() || message.chat?.id) await storeMessage(message);
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    let posts = await readPosts();
    let source = posts.length ? 'redis' : 'telegram-public-fallback';

    // Webhook registration is intentionally not performed on every public feed request.
    // Telegram webhook must be configured once, separately, to avoid turning feed reads
    // into Telegram API authorization failures.
    if (!posts.length) {
      try {
        posts = await fallbackPublicFeed();
        if (posts.length && REDIS_URL && REDIS_TOKEN) {
          await writePosts(posts);
          source = 'telegram-public-fallback';
        }
      } catch (e) {
        return res.status(502).json({ error: 'Telegram feed unavailable', message: e.message, botConfigured: !!BOT_TOKEN });
      }
    }

    return res.status(200).json({ posts: posts.slice(0, 12), source, channel: CHANNEL, bot: '@flare_itv_bot', updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Telegram feed error:', error);
    return res.status(502).json({ error: 'Telegram feed unavailable', message: String(error.message || error) });
  }
}
