# Handoff · sessione del 14 settembre 2026

## Sommario

Sessione locale arrivata dopo una sessione in cloud. Cosa è successo, in ordine:

1. La copia locale è stata allineata con il lavoro fatto in cloud, cioè il taccuino dei gatti.
2. I controlli sono stati corretti: ci si accovaccia solo con Shift, e i tasti rimasti bloccati da Cmd vengono liberati.
3. La direzione di fuga dei gatti è diventata imprevedibile.
4. È stato fatto un debug completo del gioco, durante il quale è emerso che il server di sviluppo serviva file vecchi dalla cache; il server è stato sistemato.
5. Il devlog ora mostra data e ora e ordina i post in base all'ora di pubblicazione.

Da questa sessione in poi l'handoff si committa, così lo leggono anche le sessioni in cloud.

Per il lavoro precedente (setup, prima meccanica, devlog, pipeline Blender) vedi `2026-09-13-avvio-e-prima-meccanica.md`. Quello che segue descrive lo stato completo del progetto a fine sessione.

Tutto è su `master` di [MarcoLP1822/pet_them_all](https://github.com/MarcoLP1822/pet_them_all), che è pubblica. Il branch principale si chiama `master`.

## Checkpoint raggiunti

| # | Cosa | Dove |
|---|---|---|
| 1 | Taccuino dei gatti, fatto in cloud, unito su master | PR #7, merge `05f14d2` (commit `e96f854`, `a453e6b`) |
| 2 | Regola di handoff aggiornata: il documento si committa e prima di riprendere si allinea con GitHub | `.claude/rules/handoff.md`, PR #8 |
| 3 | Accovacciarsi solo con Shift; al rilascio di Cmd i tasti bloccati vengono liberati | commit `c83ba4f`, PR #8 |
| 4 | Fuga in una direzione a caso, fuori da uno spicchio di 30° centrato sulla bambina | commit `c678a42`, PR #8 |
| 5 | Debug completo: 300 partite simulate senza violazioni, suite stabile su 30 esecuzioni | nessun file nella repo (vedi Gotcha) |
| 6 | Server di sviluppo senza cache (`serve.py`) | commit `9c4895d`, PR #8 |
| 7 | Post del devlog su fuga e controlli, handoff committati | PR #8, merge `64930ec` |
| 8 | Devlog con data e ora, post in ordine di pubblicazione | PR #9 |

## Architettura

```
index.html                  pagina del gioco; importmap verso node_modules/three, nessun bundler
serve.py                    server statico usato da npm start: come http.server, con Cache-Control: no-store
src/gatti.js                logica pura: stati, PARAMS, createGame(), update(), pspsps(), counterText()
src/taccuino.js             taccuino: schede dei gatti, tratti scoperti, testo del pannello
src/tasti.js                tastiera: GAME_KEYS, CROUCH_KEYS, inputDaTasti(), rilasciaTasto()
src/main.js                 three.js e DOM: carica il GLB, eventi tastiera, colori per stato, contatore, pannello
test/gatti.test.js          7 test sulla meccanica
test/taccuino.test.js       8 test sul taccuino
test/tasti.test.js          3 test sulla tastiera
assets/livello-test.blend   sorgente Blender del livello (Blender 4.5.13 LTS)
assets/livello-test.glb     export del livello, caricato dal gioco
CREDITS.md                  fonte e licenza degli asset
package.json                three 0.186; npm start (python3 serve.py, porta 8000), npm test (node --test)
docs/                       devlog Jekyll bilingue per GitHub Pages
.claude/
  rules/                    gameplay.md, blender-mcp.md, handoff.md
  hooks/devlog-check.sh     Stop hook del devlog (richiede jq)
  settings.json             registra lo Stop hook
  launch.json               configurazione "gioco" per il server di anteprima (npm start)
  handoff/                  un documento di handoff per sessione
```

Per avviare il gioco: `npm install` la prima volta, poi `npm start` e http://localhost:8000. Per i test: `npm test`.

### Logica del gioco (`src/gatti.js`)

- Ogni gatto è in uno di quattro stati: `fermo`, `in_arrivo`, `in_fuga`, `accarezzato` (quest'ultimo è definitivo).
- `PARAMS`: `girlMaxSpeed` 4, `crouchSpeedFactor` 0.4, `callRadius` 8, `catSpeed` 2.5, `reactionRadius` 3, `fleeSpeedThreshold` 2 (metà della velocità massima), `fleeSpeed` 6 (1,5 volte la bambina), `fleeDuration` 2.5 s, `fleeExcludedAngle` 30°, `petDistance` 1, `areaHalfSize` 20. Nel gioco `areaHalfSize` viene sostituito dalla dimensione del terreno letta dal GLB.
- `createGame({ cats, girl, params, random })`: `random` è iniettabile (di default `Math.random`) e serve sia per pescare i tratti del taccuino sia per la direzione di fuga. Nei test lo si fissa per avere risultati ripetibili.
- Ogni cambio di stato passa da `entra()`, che avvisa il taccuino.
- `update(game, input, dt)` tratta ogni gatto in quest'ordine:
  1. movimento e timer della fuga, con `slideAlongEdges` contro i bordi; a fine timer il gatto torna `fermo`;
  2. spavento, se il gatto è `fermo`, la bambina è entro `reactionRadius` e la velocità con cui gli va incontro supera la soglia; la direzione arriva da `fleeDirection`;
  3. movimento dei gatti `in_arrivo` verso la bambina;
  4. carezza, se la distanza è sotto `petDistance` e il gatto è `fermo` o `in_arrivo`.
- L'ordine conta: un gatto che finisce la fuga mentre la bambina gli corre addosso riscappa invece di farsi accarezzare.
- `fleeDirection(awayX, awayZ, random, excluded)`: direzione uniforme nell'intervallo ±(180° − excluded/2) attorno alla direzione che va dalla bambina al gatto. Viene scelta una volta per fuga, poi il gatto corre dritto, o lungo il bordo se ci arriva. Può passare accanto alla bambina.
- `pspsps(game)`: funziona solo da accovacciata e manda `in_arrivo` il gatto `fermo` più vicino entro `callRadius`.

### Taccuino (`src/taccuino.js`)

- `TRATTI`: la prima volta che il gatto va `in_fuga` riceve "è timido, scappa se ti avvicini in fretta"; la prima volta che viene `accarezzato` riceve un tratto pescato da un gruppo di quattro.
- `nuovaScheda(id)` crea `id`, `nome` ("Gatto N"), `tratti` e un flag per trigger; `scopriTratto` registra al massimo un tratto per trigger per gatto.
- `taccuinoTesto(game)` elenca solo i gatti con almeno un tratto. `main.js` riscrive il pannello solo quando il testo cambia.

### Tastiera e pagina (`src/tasti.js`, `src/main.js`)

- Controlli: WASD o frecce per muoversi, Shift per accovacciarsi, E da accovacciata per il pspsps. I tasti si leggono con `event.code`.
- `main.js` tiene l'insieme dei tasti premuti:
  - `keydown` lo aggiunge, e chiama `preventDefault` sui tasti di gioco;
  - `keyup` passa da `rilasciaTasto`, che al rilascio di Cmd libera tutti i tasti tranne Shift;
  - `blur` svuota l'insieme.
- Il GLB deve avere i nodi `Terreno`, `Bambina`, `Gatto1`…: posizioni iniziali e dimensione dell'area arrivano da lì. GLTFLoader toglie caratteri come `.` dai nomi. I numeri dei gatti nel taccuino seguono l'ordine dei nodi nel GLB.
- La camera è fissa e inquadra l'area 40×40. Se la finestra è più stretta di 4:3 si allontana.
- Colori: grigio fermo, giallo in arrivo, rosso in fuga, verde accarezzato.

### Pipeline Blender

- Il livello è nella collezione `PetThemAll_LivelloTest` di `assets/livello-test.blend`: terreno 40×40 (2 triangoli), bambina a capsula con raggio 0,35 e altezza 1,3 (256 triangoli), gatti a sfera con raggio 0,35 (224 triangoli). L'origine di ogni oggetto è alla base.
- L'export GLB prende solo la collezione, con Y in alto: un punto (x, y) sul piano di Blender diventa (x, z = −y) in three.js.

### Devlog

- GitHub Pages con la build classica (Jekyll 3.10, minima 2.5.1) da `master` `/docs`: https://marcolp1822.github.io/pet_them_all/
- Ogni post ha nel front matter `title`, `title_en` e `date` con l'ora e il fuso, per esempio `date: 2026-09-14 15:18:16 +0200`. Il testo sta in blocchi `<div lang="it" markdown="1">` e `<div lang="en" markdown="1">`.
- La `date` decide l'ordine dei post e compare nella home e in cima a ogni post nel formato `gg/mm/aaaa hh:mm`, con il fuso `Europe/Rome` impostato in `docs/_config.yml`. Senza l'ora, Jekyll ordina i post dello stesso giorno per nome del file. Come ora si usa quella del commit che ha creato il post.
- Il pulsante lingua è in `docs/_includes/lingua.html` e ricorda la scelta in `localStorage`, alla chiave `lingua`.
- Stop hook: se oggi ci sono commit e manca `docs/_posts/<oggi>-*.md`, blocca Claude e chiede un post in italiano e inglese, con data e ora nel front matter, poi commit e push su `master`.

### Flusso di lavoro

- Ogni blocco di lavoro segue il giro branch → PR → merge su `master`.
- Le sessioni in cloud lavorano su branch `claude/...` e non aprono PR. Quando si riprende in locale: `git fetch`, si guarda cosa c'è su quei branch, si provano i test e si uniscono con una PR.
- Il controllo automatico dei permessi ha bloccato un merge su `master` fatto senza la conferma esplicita dell'utente: prima di unire, chiedi.
- A fine sessione: devlog se c'è un checkpoint, handoff committato, tutto su `master`.

## Decisioni chiave

- **Accovacciarsi solo con Shift.** Su macOS Ctrl+← e Ctrl+→ servono a cambiare scrivania e non arrivano mai alla pagina; con le impostazioni di default lo stesso vale per Ctrl+↑ e Ctrl+↓. Su Windows Ctrl+W chiude la scheda. L'utente ha scelto Shift.
- **Al rilascio di Cmd si liberano i tasti, tranne Shift.** Mentre Cmd è premuto i browser su macOS non mandano il keyup degli altri tasti. Il keyup di Shift invece arriva sempre.
- **Fuga casuale fuori da uno spicchio di 30° in totale**, cioè 15° per lato, centrato sulla bambina. È una richiesta dell'utente. Se "30 gradi" era inteso per lato, basta impostare `fleeExcludedAngle` a 60.
- **Direzione scelta una volta per fuga**, niente zigzag: è il minimo richiesto.
- **Un solo `random` iniettabile** per tratti e fuga, così i test restano ripetibili.
- **`serve.py` al posto di `python3 -m http.server`.** Durante il debug il browser integrato ha eseguito un `tasti.js` vecchio preso dalla cache anche dopo aver ricaricato la pagina.
- **L'handoff si committa**, perché le sessioni in cloud non possono leggere file che non sono nella repo.
- **Data e ora nei post del devlog**, richieste dall'utente. I due post del 14 settembre comparivano nell'ordine sbagliato perché Jekyll li ordinava per nome del file.
- Le decisioni del 13 settembre (niente bundler, logica separata dal rendering, livello deciso in Blender, devlog in `docs/`) restano valide.

## Gotcha

- **Tasti di sistema su macOS.** Nel browser integrato i tasti simulati con lo strumento `computer` arrivano senza `event.code`: per provare il gioco da lì, invia dei `KeyboardEvent` con `code` via JavaScript. I tasti intercettati da macOS (Ctrl+frecce, keyup mancanti con Cmd) però non si riproducono con eventi simulati. Per diagnosticarli:
  - installa nella pagina un registro dei tasti, per esempio `window.__keylog` via `javascript_tool`, e chiedi all'utente di premere i tasti veri;
  - leggi le scorciatoie di sistema con `defaults export com.apple.symbolichotkeys` (79 e 81 sono Ctrl+← e Ctrl+→ per le scrivanie).
- **Codice vecchio dalla cache.** Se la pagina esegue codice vecchio, controlla `performance.getEntriesByType('resource')` (`transferSize` 0 vuol dire che il file arriva dalla cache). Per rinfrescare usa `fetch(url, { cache: 'reload' })`. Con `serve.py` non dovrebbe più succedere, ma nei browser che avevano già i file in cache da prima serve una ricarica forzata.
- **Zoom nel browser integrato.** L'azione `zoom` non è supportata e restituisce lo screenshot intero.
- **Script di fuzz fuori dalla repo.** Quello usato per il debug stava nello scratchpad della sessione. Simulava 300 partite da 2 minuti, con input casuali e le strategie inseguire, avvicinarsi accovacciata e chiamare, e a ogni frame controllava stati, raggi, spicchio e durata della fuga, bordi, carezze e taccuino. Se serve va riscritto.
- **Chrome headless.** Si blocca dentro il sandbox di Bash, quindi gli screenshot vanno fatti fuori dal sandbox.
- **Blender MCP.** Perde la connessione quando Blender viene chiuso. Una scena non salvata si recupera da `quit.blend` nella cartella temporanea dell'utente (`getconf DARWIN_USER_TEMP_DIR`).
- **zsh.** Interrompe il comando se un glob non trova file.
- **Cache di GitHub Pages.** Tiene i file per qualche minuto: per vedere subito le modifiche aggiungi `?v=...` all'URL.
- **Stop hook.** Scatta a ogni risposta nei giorni con commit ma senza post, compreso dopo mezzanotte.
- **Ora di un post dal commit.** Per trovarla: `TZ=Europe/Rome git log --diff-filter=A --date=format-local:'%Y-%m-%d %H:%M:%S %z' --format=%ad -- docs/_posts/<file>`.

## Problemi aperti e prossimi passi

- **Tutti i gatti diventano "timidi".** Ogni gatto scappa se gli si corre incontro, quindi il tratto non distingue un gatto dall'altro. La decisione di design è ancora aperta.
- **Nomi nel taccuino.** Seguono l'ordine dei nodi nel GLB, non i nomi in Blender: con un `Gatto10` la numerazione potrebbe non corrispondere.
- **Pannello del taccuino.** Nelle finestre strette copre la parte alta del campo. È layout, fuori dalla fase dedicata alle sole meccaniche.
- **Velocità del gatto chiamato.** Arriva a 2,5, più lento della bambina. Resta da chiarire se "il gatto è sempre più veloce di me" vale anche per l'arrivo.
- **Correzione di Cmd.** Va confermata con la tastiera vera: tieni D, premi Cmd, lascia D, lascia Cmd, e la bambina deve fermarsi.
- **Struttura del gioco.** Ancora da definire.
- **Pulizia.** Esistono ancora i branch remoti delle PR unite, compreso `claude/eloquent-goldberg-medemm`, e il `.blend` contiene camera, luce e cubo della scena di default.
