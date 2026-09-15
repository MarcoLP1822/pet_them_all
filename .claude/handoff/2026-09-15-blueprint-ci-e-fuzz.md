# Handoff · sessione del 15 settembre 2026

## Sommario

Sessione dedicata al modo di lavorare più che al gioco, che non è cambiato. In ordine:

1. Su GitHub sono stati impostati descrizione e sito del repo, con il link al devlog.
2. È nato `BLUEPRINT.md`, il processo e l'architettura da riusare nei prossimi progetti, tenuto vivo da una regola.
3. Sono entrati nella repo la CI su GitHub Actions e lo script di fuzz della logica.

Nel devlog non c'è un post di oggi: l'hook l'ha chiesto più volte, e ogni volta la risposta è stata che blueprint, CI e fuzz non sono avanzamenti del gioco.

Per il lavoro precedente vedi `2026-09-14-allineamento-controlli-e-fuga.md` e `2026-09-13-avvio-e-prima-meccanica.md`. Quello che segue descrive lo stato completo del progetto a fine sessione.

Tutto è su `master` di [MarcoLP1822/pet_them_all](https://github.com/MarcoLP1822/pet_them_all), che è pubblica. Il branch principale si chiama `master`.

## Checkpoint raggiunti

| # | Cosa | Dove |
|---|---|---|
| 1 | Descrizione bilingue e sito del repo (il devlog) | impostazioni GitHub, con `gh repo edit` |
| 2 | Blueprint, regola che lo tiene vivo e link nel README | PR #11, merge `928f630` |
| 3 | CI con test e fuzz su push a master e sulle PR; fuzz in `tools/fuzz.mjs` | PR #12, merge `431dcf4` |
| 4 | Handoff di oggi, rimando dall'handoff del 14 settembre, lezioni della sessione nel blueprint | PR #13 |

## Architettura

```
README.md                   panoramica: cos'è il gioco, controlli, avvio, struttura
BLUEPRINT.md                processo e architettura da riusare nei prossimi progetti (documento vivo)
index.html                  pagina del gioco; importmap verso node_modules/three, nessun bundler
serve.py                    server statico usato da npm start: come http.server, con Cache-Control: no-store
src/gatti.js                logica pura: stati, PARAMS, createGame(), update(), pspsps(), counterText()
src/taccuino.js             taccuino: schede dei gatti, tratti scoperti, testo del pannello
src/tasti.js                tastiera: GAME_KEYS, CROUCH_KEYS, inputDaTasti(), rilasciaTasto()
src/main.js                 three.js e DOM: carica il GLB, eventi tastiera, colori per stato, contatore, pannello
test/gatti.test.js          7 test sulla meccanica
test/taccuino.test.js       8 test sul taccuino
test/tasti.test.js          3 test sulla tastiera
tools/fuzz.mjs              fuzz della logica: partite simulate con le regole controllate a ogni frame
assets/livello-test.blend   sorgente Blender del livello (Blender 4.5.13 LTS)
assets/livello-test.glb     export del livello, caricato dal gioco e dal fuzz
CREDITS.md                  fonte e licenza degli asset
package.json                three 0.186; npm start (python3 serve.py, porta 8000), npm test, npm run fuzz
.github/workflows/test.yml  CI: npm ci, npm test e npm run fuzz su ogni push a master e su ogni PR (Node 22)
docs/                       devlog Jekyll bilingue per GitHub Pages
.claude/
  rules/                    gameplay.md, blender-mcp.md, handoff.md, blueprint.md
  hooks/devlog-check.sh     Stop hook del devlog (richiede jq)
  settings.json             registra lo Stop hook
  launch.json               configurazione "gioco" per il server di anteprima (npm start)
  handoff/                  un documento di handoff per sessione
```

Per avviare il gioco: `npm install` la prima volta, poi `npm start` e http://localhost:8000. Test: `npm test`. Fuzz: `npm run fuzz`.

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

### Fuzz (`tools/fuzz.mjs`)

- Legge dal GLB le posizioni di `Bambina` e dei nodi `Gatto*`, nell'ordine del file, e la dimensione del terreno, come fa `main.js`.
- Gioca 300 partite da 120 secondi, ognuna con il proprio seme. Cambia strategia ogni tanto: tasti a caso, inseguire il gatto più vicino, avvicinarsi accovacciata, chiamare da ferma. Il pspsps arriva in momenti casuali.
- A ogni frame controlla:
  - la bambina resta nell'area e non supera la velocità massima;
  - solo transizioni di stato ammesse;
  - lo spavento arriva solo quando serve;
  - la direzione di fuga è unitaria e fuori dallo spicchio;
  - la fuga dura quanto `fleeDuration`;
  - le carezze arrivano solo sotto `petDistance`, mai a un gatto fermo a cui lei sta correndo incontro, e i gatti accarezzati non si muovono più;
  - il pspsps funziona solo da accovacciata, sceglie il gatto più vicino e non cambia lo stato degli altri;
  - il taccuino è coerente con fughe e carezze.
- Stampa quante fughe, richiami e carezze ci sono state, e se una regola è violata esce con codice 1. `npm run fuzz -- <partite> <secondi>` fa una prova più breve. In locale le impostazioni di default durano circa 15 secondi.
- Quando si aggiunge una meccanica, si aggiunge la sua regola nel fuzz.

### CI (`.github/workflows/test.yml`)

- Su ogni push a `master` e su ogni PR: checkout, Node 22, `npm ci`, `npm test`, `npm run fuzz`. Sulle PR non gira due volte, perché il push conta solo per `master`.
- La prima esecuzione, sulla PR #12, è riuscita in tutti i passaggi.
- Per lo stato dei controlli di una PR aperta: `mcp__ccd_pr__get_status`. Per i passaggi di un'esecuzione: `gh run view <id> --json jobs`.

### Pipeline Blender

- Il livello è nella collezione `PetThemAll_LivelloTest` di `assets/livello-test.blend`: terreno 40×40 (2 triangoli), bambina a capsula con raggio 0,35 e altezza 1,3 (256 triangoli), gatti a sfera con raggio 0,35 (224 triangoli). L'origine di ogni oggetto è alla base.
- L'export GLB prende solo la collezione, con Y in alto: un punto (x, y) sul piano di Blender diventa (x, z = −y) in three.js.

### Devlog

- GitHub Pages con la build classica (Jekyll 3.10, minima 2.5.1) da `master` `/docs`: https://marcolp1822.github.io/pet_them_all/
- Ogni post ha nel front matter `title`, `title_en` e `date` con l'ora e il fuso, per esempio `date: 2026-09-14 15:18:16 +0200`. Il testo sta in blocchi `<div lang="it" markdown="1">` e `<div lang="en" markdown="1">`.
- La `date` decide l'ordine dei post e compare nella home e in cima a ogni post nel formato `gg/mm/aaaa hh:mm`, con il fuso `Europe/Rome` impostato in `docs/_config.yml`. Come ora si usa quella del commit che ha creato il post.
- Il pulsante lingua è in `docs/_includes/lingua.html` e ricorda la scelta in `localStorage`, alla chiave `lingua`.
- I post raccontano ciascuno la propria giornata: non si riscrivono quando il gioco cambia.
- Stop hook: se oggi ci sono commit e manca `docs/_posts/<oggi>-*.md`, blocca Claude e chiede un post in italiano e inglese, con data e ora nel front matter, poi commit e push su `master`. Conta i commit di qualunque branch.

### Blueprint

- `BLUEPRINT.md` è alla radice: è la copia di riferimento per i progetti futuri, che partiranno copiandolo.
- La regola `.claude/rules/blueprint.md` chiede di aggiornarlo a fine sessione quando cambia il processo o emerge una lezione riusabile, con una riga nel suo registro delle modifiche. I dettagli di questo progetto restano negli handoff.
- Contenuto: principi, avvio di un progetto, architettura, Blender, flusso di lavoro, qualità, documentazione viva, miglioramenti rispetto a Pet Them All (con quali sono già adottati qui) e registro.

### Flusso di lavoro

- Ogni blocco di lavoro segue il giro branch → PR → CI verde → merge su `master`.
- Le sessioni in cloud lavorano su branch `claude/...` e non aprono PR. Quando si riprende in locale: `git fetch`, si guarda cosa c'è su quei branch, si provano test e fuzz e si uniscono con una PR.
- Il controllo automatico dei permessi ha bloccato un merge su `master` fatto senza la conferma esplicita dell'utente: prima di unire, chiedi.
- A fine sessione: devlog se c'è un checkpoint del gioco, handoff committato, blueprint aggiornato se serve, tutto su `master`.
- Documentazione: `README.md` per la panoramica, l'handoff più recente per i dettagli, `BLUEPRINT.md` per il processo. Ogni handoff superato ha in cima un rimando al successivo.

## Decisioni chiave

- **Blueprint in questa repo e non in una a sé**: finché c'è un solo progetto è più semplice. Da spostare, anche come template di GitHub, quando i progetti saranno due.
- **Blueprint vivo come gli handoff**, tramite una regola e un registro delle modifiche.
- **Il blueprint non copia Pet Them All**: contiene già i miglioramenti al processo, e una tabella dice quali sono adottati qui.
- **Fuzz in `tools/` e non in `test/`**, perché `node --test` esegue qualsiasi file dentro `test/` e il fuzz renderebbe lenti i test.
- **Il fuzz legge il livello dal GLB**, invece di ricopiare posizioni e dimensioni: resta allineato quando il livello cambia.
- **CI con il push limitato a `master`**, così sui branch con una PR aperta non gira due volte.
- **Fuzz in CI con le impostazioni di default**: circa 15 secondi in locale, un tempo accettabile.
- **Nessun post nel devlog per blueprint, CI e fuzz**: non sono avanzamenti del gioco. L'utente non ha raccolto l'offerta di scriverne uno.
- **Descrizione del repo bilingue**, come il devlog, con il devlog come sito.
- Le decisioni del 13 e 14 settembre restano valide: vedi i rispettivi handoff.

## Gotcha

- **Tasti di sistema su macOS.** Nel browser integrato i tasti simulati con lo strumento `computer` arrivano senza `event.code`: per provare il gioco da lì, invia dei `KeyboardEvent` con `code` via JavaScript. I tasti intercettati da macOS (Ctrl+frecce, keyup mancanti con Cmd) però non si riproducono con eventi simulati. Per diagnosticarli:
  - installa nella pagina un registro dei tasti, per esempio `window.__keylog` via `javascript_tool`, e chiedi all'utente di premere i tasti veri;
  - leggi le scorciatoie di sistema con `defaults export com.apple.symbolichotkeys` (79 e 81 sono Ctrl+← e Ctrl+→ per le scrivanie).
- **Codice vecchio dalla cache.** Se la pagina esegue codice vecchio, controlla `performance.getEntriesByType('resource')` (`transferSize` 0 vuol dire che il file arriva dalla cache). Per rinfrescare usa `fetch(url, { cache: 'reload' })`. Con `serve.py` non dovrebbe più succedere.
- **Verificare che il fuzz serva davvero.** Copia `src/`, `tools/`, `package.json` (serve per `"type": "module"`) e il GLB in una cartella temporanea, inserisci un bug nella copia di `gatti.js` e lancia la copia di `tools/fuzz.mjs`: deve uscire con 1 e indicare la regola giusta. Oggi l'hanno fatto due bug, la carezza di un gatto in fuga e la fuga verso la bambina.
- **`node --test` e la cartella `test/`.** Esegue qualsiasi file JavaScript dentro `test/`, non solo i `*.test.js`.
- **Codici di uscita in zsh.** `PIPESTATUS` non esiste: per l'exit code di un comando dentro una pipe usa `$pipestatus`, oppure evita la pipe.
- **Script Ruby su file UTF-8.** Con il locale US-ASCII falliscono per la codifica: imposta `LANG=en_US.UTF-8`.
- **Diagrammi Mermaid.** Prima di unire un documento con diagrammi, aprilo su GitHub dal branch e controlla che siano disegnati.
- **Zoom nel browser integrato.** L'azione `zoom` non è supportata e restituisce lo screenshot intero.
- **Chrome headless.** Si blocca dentro il sandbox di Bash, quindi gli screenshot vanno fatti fuori dal sandbox.
- **Blender MCP.** Perde la connessione quando Blender viene chiuso. Una scena non salvata si recupera da `quit.blend` nella cartella temporanea dell'utente (`getconf DARWIN_USER_TEMP_DIR`).
- **zsh e i glob.** Interrompe il comando se un glob non trova file.
- **Cache di GitHub Pages.** Tiene i file per qualche minuto: per vedere subito le modifiche aggiungi `?v=...` all'URL.
- **Stop hook.** Scatta a ogni risposta nei giorni con commit ma senza post, anche quando i commit riguardano solo documentazione o strumenti: in quel caso basta dire che il post non serve.
- **Ora di un post dal commit.** Per trovarla: `TZ=Europe/Rome git log --diff-filter=A --date=format-local:'%Y-%m-%d %H:%M:%S %z' --format=%ad -- docs/_posts/<file>`.

## Problemi aperti e prossimi passi

- **Tutti i gatti diventano "timidi".** Ogni gatto scappa se gli si corre incontro, quindi il tratto non distingue un gatto dall'altro. La decisione di design è ancora aperta.
- **Nomi nel taccuino.** Seguono l'ordine dei nodi nel GLB, non i nomi in Blender: con un `Gatto10` la numerazione potrebbe non corrispondere.
- **Pannello del taccuino.** Nelle finestre strette copre la parte alta del campo. È layout, fuori dalla fase dedicata alle sole meccaniche.
- **Velocità del gatto chiamato.** Arriva a 2,5, più lento della bambina. Resta da chiarire se "il gatto è sempre più veloce di me" vale anche per l'arrivo.
- **Correzione di Cmd.** Va confermata con la tastiera vera: tieni D, premi Cmd, lascia D, lascia Cmd, e la bambina deve fermarsi.
- **Struttura del gioco.** Ancora da definire.
- **Pulizia.** Esistono ancora i branch remoti delle PR unite, compreso `claude/eloquent-goldberg-medemm`, e il `.blend` contiene camera, luce e cubo della scena di default. `gh repo edit --delete-branch-on-merge` eviterebbe nuovi branch vecchi, ma è un'impostazione del repo e va chiesta all'utente.
- **Miglioramenti del blueprint non ancora adottati qui.** Branch principale `main`; cancellazione automatica dei branch uniti; server, screenshot e generazione del livello in `tools/`; asset collegati per nome; hook del devlog che conta solo i commit sul branch principale; commit a blocchi durante la sessione. Da decidere quali portare in Pet Them All.
