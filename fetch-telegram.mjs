import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

const CHANNEL = 'flare_itv';
const URL = `https://t.me/s/${CHANNEL}`;

const res = await fetch(URL, {
  headers: { 'user-agent': 'Mozilla/5.0 (compatible; FLARE-site/1.0)' }
});
if (!res.ok) throw new Error(`Telegram returned HTTP ${res.status}`);
const html = await res.text();
const $ = cheerio.load(html);
const posts = [];

$('.tgme_widget_message_wrap').each((_, el) => {
  const message = $(el).find('.tgme_widget_message').first();
  const dataPost = message.attr('data-post') || '';
  const id = dataPost.split('/').pop();
  if (!id || posts.some(p => p.id === id)) return;

  const text = message.find('.tgme_widget_message_text').first().text().replace(/\s+/g, ' ').trim();
  const time = message.find('time').first().attr('datetime') || '';
  const views = message.find('.tgme_widget_message_views').first().text().trim();
  const link = `https://t.me/${CHANNEL}/${id}`;
  if (!text && !message.find('.tgme_widget_message_photo_wrap').length && !message.find('.tgme_widget_message_video').length) return;

  posts.push({ id, text: text || 'Медиа-публикация FLARE', time, views, link });
});

posts.sort((a,b) => Number(b.id) - Number(a.id));
const payload = {
  channel: CHANNEL,
  channelUrl: `https://t.me/${CHANNEL}`,
  updatedAt: new Date().toISOString(),
  posts: posts.slice(0, 9)
};
await fs.writeFile('data/telegram.json', JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Saved ${payload.posts.length} Telegram posts.`);
