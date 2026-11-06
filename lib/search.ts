import { MAX_AREA, MAX_PRICE, MIN_AREA, env } from './config';

export type Candidate = {
  url: string; title: string; snippet: string; source: string;
  price_eur: number | null; area_sqm: number | null;
  ground_floor: boolean | null; multiple_windows: boolean | null;
  status: 'compatibile_preliminare' | 'da_verificare';
};

const searches = [
  'site:immobiliare.it "Bari" "Picone" "locale" vendita',
  'site:idealista.it "Bari" "Picone" "locale" vendita',
  'site:casa.it "Bari" "Picone" "negozio" vendita',
  '"Bari Picone" "locale commerciale" "vendita" "piano terra"',
  '"Bari Picone" "negozio" "vendita" "vetrine"',
];

function numberFromAmount(input: string): number {
  const s = input.replace(/\s/g, '').replace(/[.,](?=\d{3}(?:\D|$))/g, '');
  return Number(s.replace(',', '.'));
}

export function parseCandidate(raw: {url: string; title: string; description?: string}): Candidate | null {
  let parsed: URL;
  try { parsed = new URL(raw.url); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  // Canonicalize tracking params to avoid duplicates caused by ads/UTM.
  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|ref$)/i.test(key)) parsed.searchParams.delete(key);
  }
  const text = `${raw.title} ${raw.description ?? ''}`;
  const t = text.toLowerCase();
  if (!/picone/i.test(text) || !/bari/i.test(text)) return null;
  if (/\b(affitto|locazione|in affitto)\b/i.test(t) && !/\bvendita\b/i.test(t)) return null;
  if (!/\b(locale|negozio|commerciale|immobile|vetrin[ae])\b/i.test(t)) return null;
  // Price is accepted only when explicitly accompanied by EUR/€; otherwise unknown.
  const p1 = text.match(/(?:€|eur[o]?)\s*([\d.,]{3,12})/i);
  const p2 = text.match(/([\d.,]{3,12})\s*(?:€|euro)\b/i);
  const price = p1 || p2 ? Math.round(numberFromAmount((p1 || p2)![1])) : null;
  const areaMatch = text.match(/\b(\d{2,3})\s*(?:m²|mq|metri quadri|m2)\b/i);
  const area = areaMatch ? Number(areaMatch[1]) : null;
  if (price !== null && (!Number.isFinite(price) || price > MAX_PRICE || price <= 0)) return null;
  if (area !== null && (area < MIN_AREA || area > MAX_AREA)) return null;
  const ground = /\b(piano terra|p\.\s*terra|piano terreno)\b/i.test(text) ? true :
    /\b(primo piano|secondo piano|terzo piano|piano [1-9])\b/i.test(text) ? false : null;
  if (ground === false) return null;
  const windows = /\b([2-9]|due|tre|quattro|cinque)\s+(vetrin[ae]|finestre|punti luce)\b/i.test(text) ? true : null;
  const status = ground === true && area !== null && price !== null ? 'compatibile_preliminare' : 'da_verificare';
  return {url: parsed.toString(), title: raw.title.slice(0, 400), snippet: (raw.description ?? '').slice(0, 900),
    source: parsed.hostname, price_eur: price, area_sqm: area,
    ground_floor: ground, multiple_windows: windows, status};
}

export async function discover(): Promise<{candidates: Candidate[]; errors: string[]}> {
  const all = new Map<string, Candidate>();
  const errors: string[] = [];
  for (const q of searches) {
    try {
      const u = new URL('https://api.search.brave.com/res/v1/web/search');
      u.searchParams.set('q', q);
      u.searchParams.set('country', 'IT');
      u.searchParams.set('search_lang', 'it');
      u.searchParams.set('count', '20');
      const res = await fetch(u, {headers: {'X-Subscription-Token': env('BRAVE_API_KEY'), Accept: 'application/json'}, cache: 'no-store', signal: AbortSignal.timeout(15000)});
      if (!res.ok) throw new Error(`Brave HTTP ${res.status}`);
      const json = await res.json();
      const rows = (json?.web?.results ?? []) as Array<{url: string; title: string; description?: string}>;
      for (const row of rows) {
        const c = parseCandidate(row);
        if (c) all.set(c.url, c);
      }
    } catch (e) { errors.push(`${q}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  return {candidates: [...all.values()], errors};
}
