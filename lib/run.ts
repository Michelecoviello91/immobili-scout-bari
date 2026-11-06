import { db } from './db';
import { discover, type Candidate } from './search';
import { telegram } from './telegram';

type Listing = Candidate & { id?: number; first_seen_at?: string; price_changed_at?: string };
const euros = (n: number | null) => n === null ? 'prezzo non dichiarato' : `${n.toLocaleString('it-IT')} €`;
const desc = (c: Candidate) => `${c.title}\n${euros(c.price_eur)} · ${c.area_sqm ?? '?'} m² · piano terra: ${c.ground_floor === true ? 'sì' : 'non verificato'} · punti luce multipli: ${c.multiple_windows === true ? 'sì' : 'non verificati'}\n${c.url}`;

export async function runScout() {
  const client = db();
  const {data: run, error: runErr} = await client.from('runs').insert({status:'started'}).select('id').single();
  if (runErr || !run) throw new Error(`Tabella runs: ${runErr?.message ?? 'errore'}`);
  let success = false;
  try {
    const {candidates, errors} = await discover();
    if (errors.length === 5) throw new Error(`Tutte le ricerche fallite: ${errors.join('; ')}`);
    const fresh: Listing[] = [];
    const reductions: Listing[] = [];
    for (const c of candidates) {
      const {data: previous, error: lookupErr} = await client.from('listings').select('price_eur').eq('url', c.url).maybeSingle();
      if (lookupErr) throw new Error(lookupErr.message);
      if (!previous) {
        const {error} = await client.from('listings').insert(c);
        if (error) throw new Error(error.message);
        fresh.push(c);
      } else {
        const reduced = c.price_eur !== null && previous.price_eur !== null && c.price_eur < previous.price_eur;
        const {error} = await client.from('listings').update({
          ...c, price_eur: c.price_eur ?? previous.price_eur,
          last_seen_at: new Date().toISOString(),
          ...(reduced ? {price_changed_at: new Date().toISOString()} : {}),
        }).eq('url', c.url);
        if (error) throw new Error(error.message);
        if (reduced) reductions.push(c);
      }
    }
    const message = [
      `🏢 IMMOBILI SCOUT — BARI PICONE\nReport ${new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome', dateStyle:'medium'}).format(new Date())}`,
      `Risultati trovati: ${candidates.length} · Nuovi nell'archivio: ${fresh.length} · Ribassi: ${reductions.length}`,
      fresh.length ? `🆕 NUOVI ANNUNCI\n\n${fresh.slice(0, 12).map(desc).join('\n\n')}` : 'Nessun annuncio nuovo rispetto all’archivio.',
      reductions.length ? `📉 RIBASSI\n\n${reductions.slice(0, 8).map(desc).join('\n\n')}` : '',
      errors.length ? `⚠️ Fonti/ricerche non riuscite: ${errors.length} su 5.` : '',
      '⚠️ Dati dai risultati del motore di ricerca: prezzo, metratura, piano e idoneità sanitaria devono essere verificati direttamente negli annunci e con un tecnico.',
    ].filter(Boolean).join('\n\n');
    await telegram(message);
    const {error: finalErr} = await client.from('runs').update({status:errors.length ? 'partial' : 'ok', found:candidates.length, new_count:fresh.length, changed_count:reductions.length, completed_at:new Date().toISOString(), error: errors.length ? errors.join(' | ').slice(0, 3000) : null}).eq('id',run.id);
    if (finalErr) throw new Error(finalErr.message);
    success = true;
    return {found:candidates.length, newCount:fresh.length, reductions:reductions.length, warnings:errors.length};
  } finally {
    if (!success) await client.from('runs').update({status:'failed',completed_at:new Date().toISOString(),error:'Esecuzione non completata; consultare log Vercel'}).eq('id',run.id);
  }
}
