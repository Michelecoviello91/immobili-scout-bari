import { env } from './config';

export async function telegram(message: string) {
  // Telegram sendMessage allows <=4096 chars; split at paragraph boundaries where possible.
  const paragraphs = message.split('\n\n');
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > 3500 && current) { chunks.push(current); current = ''; }
    if (p.length > 3500) {
      if (current) { chunks.push(current); current = ''; }
      for (let n = 0; n < p.length; n += 3500) chunks.push(p.slice(n, n + 3500));
    } else current += (current ? '\n\n' : '') + p;
  }
  if (current) chunks.push(current);
  for (const text of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_id: env('TELEGRAM_CHAT_ID'), text, disable_web_page_preview: true}),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Telegram HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}
