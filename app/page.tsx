import { db } from '../lib/db';
export const dynamic = 'force-dynamic';
const euro = (n:number | null) => n === null ? 'Da verificare' : `${n.toLocaleString('it-IT')} €`;
export default async function Home() {
  const client=db();
  const [{data: listings, error: listError}, {data: runs, error: runError}] = await Promise.all([
    client.from('listings').select('*').order('first_seen_at',{ascending:false}).limit(100),
    client.from('runs').select('*').order('started_at',{ascending:false}).limit(8),
  ]);
  return <main>
    <header><p className="eyebrow">MONITORAGGIO IMMOBILIARE</p><h1>Immobili Scout <span>Bari</span></h1><p>Il tuo osservatorio per il futuro poliambulatorio ortopedico.</p></header>
    <section className="filters"><div><small>Zona</small><strong>Picone, Bari</strong></div><div><small>Budget</small><strong>fino a 200.000 €</strong></div><div><small>Superficie</small><strong>80–200 m²</strong></div><div><small>Tipologia</small><strong>Vendita · piano terra</strong></div><div><small>Preferenze</small><strong>Più punti luce · da ristrutturare</strong></div></section>
    <section><h2>Annunci trovati <small>({listings?.length ?? 0} visualizzati)</small></h2>
      {listError ? <p className="warning">Errore archivio: {listError.message}</p> : !listings?.length ? <p className="empty">Non ci sono ancora annunci. Dopo la prima esecuzione programmata compariranno qui.</p> :
      <div className="cards">{listings.map((x)=><article className="card" key={x.id}>
        <small>{x.source} · {new Date(x.first_seen_at).toLocaleDateString('it-IT')}</small>
        <h3>{x.title}</h3><strong className="price">{euro(x.price_eur)}</strong>
        <p>{x.area_sqm ?? '?'} m² · Piano terra: {x.ground_floor === true ? 'indicato' : 'da verificare'} · Punti luce: {x.multiple_windows === true ? 'multipli' : 'da verificare'}</p>
        <p className="snippet">{x.snippet}</p><a href={x.url} target="_blank" rel="noreferrer noopener">Apri annuncio originale ↗</a>
      </article>)}</div>}
    </section>
    <section><h2>Ultimi controlli</h2>{runError ? <p className="warning">Errore: {runError.message}</p> :
      !runs?.length ? <p className="empty">Nessun controllo ancora registrato.</p> :
      <div className="tablewrap"><table><thead><tr><th>Quando</th><th>Stato</th><th>Trovati</th><th>Nuovi</th><th>Ribassi</th></tr></thead><tbody>{runs.map(x)=><tr key={x.id}><td>{new Date(x.started_at).toLocaleString('it-IT',{timeZone:'Europe/Rome'})}</td><td>{x.status}</td><td>{x.found}</td><td>{x.new_count}</td><td>{x.changed_count}</td></tr>)}</tbody></table></div>}
    </section><footer>Versione 0.1 · Ricerca basata su risultati indicizzati · Verificare sempre le caratteristiche degli immobili e l'idoneità sanitaria.</footer>
  </main>;
}
