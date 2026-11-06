# Immobili Scout Bari — prototipo v0.1

Web app privata Next.js + Supabase + Brave Search API + Telegram, pronta per la pubblicazione su Vercel **dopo aver configurato gli account e le credenziali**.

## Cosa fa
- Cerca ogni giorno 5 query su Brave Search con attenzione a Picone (Bari), locali in vendita.
- Filtra *soltanto se espliciti nel frammento* prezzi sopra 200.000 €, superfici fuori 80–200 m² e piani superiori.
- Registra link, titolo, snippet e attributi estratti quando disponibili; conserva lo storico e individua ribassi.
- Invia report Telegram anche se non rileva novità (distinguendo i casi di errore parziale).
- Mostra dashboard privata con annunci e ultimi controlli.

## Limitazioni reali
- Non effettua crawling diretto di Immobiliare.it, Idealista, Casa.it; usa solo i risultati indicizzati dal motore di ricerca. **Non garantisce copertura né aggiornamento completo.**
- Non usa AI per l'analisi delle fotografie: il numero di vetrine è rilevato solo quando scritto nel titolo/snippet.
- Se prezzo/area/piano mancano nello snippet, il risultato è *da verificare*, non automaticamente conforme.
- I duplicati basati su URL sono gestiti; lo stesso immobile con URL differenti può essere duplicato.
- Il report del primo giorno contiene tutti gli annunci inizialmente trovati, non necessariamente pubblicati in quella data.
- Le ricerche che falliscono tutte bloccano il report e registrano un errore; errori parziali vengono segnalati.
- Le ricerche giornaliere richiedono un piano Vercel che supporti le cron, rispettando la frequenza e i limiti previsti. `0 14 * * *` è **14:00 UTC**, ossia 15:00 in inverno e 16:00 in estate a Bari. L'esecuzione può non avvenire al minuto esatto.
- Il pannello usa HTTP Basic Auth come primo controllo d'accesso privato; per produzione multiutente preferire autenticazione dedicata (es. Supabase Auth con MFA). Non archivia dati dei pazienti.
- Non usa API non autorizzate né aggira login, CAPTCHA o limitazioni di accesso dei portali.

## Configurazione, passo per passo
1. Installa Node.js (>=20.9) e crea account su GitHub, Vercel, Supabase, Brave Search API e Telegram.
2. Su Supabase crea un progetto e incolla **`supabase/schema.sql`** nell'SQL Editor, poi eseguilo.
3. Copia `.env.example` in `.env.local`. Recupera `SUPABASE_URL` (Project URL) e la chiave `service_role` (solo server: mai in una pagina web o screenshot pubblico).
4. Crea una chiave su Brave Search API (`BRAVE_API_KEY`); attenzione ai costi e al credito disponibile nel tuo piano.
5. In Telegram apri @BotFather, invia `/newbot` e conserva il token. Apri il bot appena creato, premi Start e invia un messaggio. Nel browser visita `https://api.telegram.org/bot<TOKEN>/getUpdates` e leggi `message.chat.id` (non condividere token né chat id pubblicamente). Se non trovi il chat id, invia un altro messaggio al bot e riprova.
6. Imposta una password forte in `APP_PASSWORD`, un nome utente in `APP_USER` e un valore casuale lungo in `CRON_SECRET` (es. `openssl rand -hex 32`).
7. In locale: `npm install`, poi `npm run dev`; apri http://localhost:3000 e usa utente/password.
8. Carica il progetto in un **repository GitHub privato**; importa il repository su Vercel e aggiungi tutte le variabili di ambiente da `.env.local` in Project Settings → Environment Variables. NON inserire `.env.local` nel repository.
9. Esegui il deploy. Per testare il controllo manualmente, da Terminale: `curl -H 'Authorization: Bearer IL_TUO_CRON_SECRET' https://TUO-PROGETTO.vercel.app/api/cron` (non condividere il comando con token reali).
10. Consulta la dashboard e controlla il messaggio Telegram. Sui log di Vercel e nella tabella `runs` puoi identificare eventuali errori. Le esecuzioni automatiche partiranno secondo `vercel.json`.

## Passi successivi
- Connettori autorizzati specifici per portali/agenti con deduplica per indirizzo/foto.
- Estrazione strutturata verificabile da fonti consentite, verifica geografica Picone.
- Riconoscimento foto e punteggio per potenziale poliambulatorio, sempre con etichette *ipotetico / da verificare*.
- Orari con fuso `Europe/Rome` tramite scheduler esterno dedicato, se occorre precisione locale.
- Storico prezzi e notifiche prioritarie basate sui nuovi annunci dopo la prima esecuzione.
