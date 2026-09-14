# Handoff · sessione del 13-14 settembre 2026

## Sommario

Prima sessione di Pet Them All. Si è partiti da una cartella vuota e si è arrivati a un prototipo giocabile della meccanica core: una bambina che chiama e accarezza gatti. Nel frattempo sono nati un devlog pubblico bilingue su GitHub Pages e una pipeline Blender → GLB → three.js, provata tramite Blender MCP.

Tutto è su `master` di [MarcoLP1822/pet_them_all](https://github.com/MarcoLP1822/pet_them_all). La repo è pubblica e il branch principale si chiama `master`, non `main`.

## Checkpoint raggiunti

| # | Cosa | Dove |
|---|---|---|
| 1 | Regole per Claude (gameplay, Blender) e `.gitignore` | commit `786a9af` |
| 2 | Stop hook che ricorda di scrivere il post del devlog | PR #1, merge `050cff5` |
| 3 | Devlog Jekyll su GitHub Pages da `master` `/docs`; repo resa pubblica | PR #2, merge `202fa79` |
| 4 | Prima meccanica: prototipo three.js, livello da Blender, test, post nel devlog | PR #3, merge `2197a61` |
| 5 | Devlog bilingue con pulsante lingua e screenshot del prototipo | PR #4, merge `1d22cb8` |
| 6 | Correzione del pulsante lingua, che non si vedeva | PR #5, merge `a94719b` |
| 7 | Scena Blender del livello salvata nella repo | PR #6, merge `7a3d594` |

## Architettura

```
index.html                  pagina del gioco; importmap verso node_modules/three, nessun bundler
src/gatti.js                logica pura: stati dei gatti, PARAMS, update(), pspsps(), counterText()
src/main.js                 three.js: carica il GLB, tastiera, colori per stato, contatore
test/gatti.test.js          6 test node:test sulla logica
assets/livello-test.blend   sorgente Blender del livello (Blender 4.5.13 LTS)
assets/livello-test.glb     export del livello, caricato dal gioco
CREDITS.md                  fonte e licenza degli asset
package.json                three 0.186; npm start (python3 -m http.server 8000), npm test
docs/                       devlog Jekyll per GitHub Pages
  _config.yml               minima, lang it, date gg/mm/aaaa, estratti disattivati
  index.html                elenco dei post con i titoli nelle due lingue
  _layouts/post.html        post.html di minima 2.5.1 + pulsante lingua + doppio titolo
  _includes/lingua.html     pulsante e script che mostrano una lingua alla volta
  _posts/                   post con title/title_en e blocchi <div lang="it|en" markdown="1">
  assets/img/               immagini dei post
.claude/
  rules/                    gameplay.md, blender-mcp.md, handoff.md (quest'ultimo fuori da git)
  hooks/devlog-check.sh     Stop hook del devlog (richiede jq)
  settings.json             registra lo Stop hook
  launch.json               configurazione "gioco" per il server di anteprima
  handoff/                  questi documenti (fuori da git)
```

### Logica del gioco (`src/gatti.js`)

- Ogni gatto è in uno di quattro stati: `fermo`, `in_arrivo`, `in_fuga`, `accarezzato` (quest'ultimo è definitivo).
- `PARAMS`: `girlMaxSpeed` 4, `crouchSpeedFactor` 0.4, `callRadius` 8, `catSpeed` 2.5, `reactionRadius` 3, `fleeSpeedThreshold` 2 (metà della velocità massima), `fleeSpeed` 6 (1,5 volte la bambina), `fleeDuration` 2.5 s, `petDistance` 1, `areaHalfSize` 20. Nel gioco `areaHalfSize` viene sostituito dalla dimensione del terreno letta dal GLB.
- `update(game, input, dt)` tratta ogni gatto in quest'ordine:
  1. movimento e timer della fuga, con `slideAlongEdges` contro i bordi;
  2. spavento, se la velocità con cui la bambina va verso il gatto supera la soglia entro il raggio di reazione;
  3. movimento dei gatti `in_arrivo`;
  4. carezza, se la distanza è sotto 1 e il gatto è `fermo` o `in_arrivo`.
- L'ordine conta: un gatto che finisce la fuga mentre la bambina gli corre addosso riscappa invece di farsi accarezzare.
- `pspsps(game)` funziona solo da accovacciata e manda `in_arrivo` il gatto `fermo` più vicino entro `callRadius`.

### Gioco nel browser (`src/main.js`)

- Il GLB deve avere i nodi `Terreno`, `Bambina`, `Gatto1`…`Gatto4`: posizioni iniziali e dimensione dell'area arrivano da lì. GLTFLoader toglie caratteri come `.` dai nomi, quindi niente nomi tipo `Gatto.001`.
- I tasti si leggono con `event.code`: WASD o frecce per muoversi, Ctrl o Shift per accovacciarsi, E per pspsps.
- La camera è fissa e inquadra l'area 40×40. Se la finestra è più stretta di 4:3 si allontana, così i bordi restano visibili.
- Colori: grigio fermo, giallo in arrivo, rosso in fuga, verde accarezzato.

### Pipeline Blender

- Il livello è generato con bmesh nella collezione `PetThemAll_LivelloTest`: terreno 40×40 (2 triangoli), bambina a capsula con raggio 0,35 e altezza 1,3 (256 triangoli), gatti a sfera con raggio 0,35 (224 triangoli). L'origine di ogni oggetto è alla base, quindi in three.js stanno a y = 0.
- L'export GLB prende solo la collezione (tramite selezione) con Y in alto: un punto (x, y) sul piano di Blender diventa (x, z = −y) in three.js.
- Il `.blend` è stato recuperato da `quit.blend` e contiene ancora camera, luce e cubo nascosto della scena di default.

### Devlog

- GitHub Pages con la build classica (github-pages 232, Jekyll 3.10, minima 2.5.1) da `master` `/docs`: https://marcolp1822.github.io/pet_them_all/
- Pulsante lingua: imposta `data-lingua` su `<html>`, il CSS nasconde i blocchi dell'altra lingua (tranne il pulsante) e la scelta resta in `localStorage` alla chiave `lingua`. Si parte in italiano.
- Stop hook: se oggi ci sono commit e manca `docs/_posts/<oggi>-*.md`, blocca Claude e chiede un post in italiano e inglese, poi commit e push su `master`. Se invece `stop_hook_active` è vero, lascia fermare.

## Decisioni chiave

- **Niente bundler.** three.js arriva da `node_modules` con un importmap e un server statico, senza passaggi di build.
- **Logica separata dal rendering**, così i test girano con `node --test` senza three.js.
- **Il livello si decide in Blender.** Il gioco legge dal GLB l'area e le posizioni, senza coordinate duplicate nel codice.
- **Da accovacciata la bambina rallenta, non si ferma.** Al 40% resta sotto la soglia di fuga e può avvicinarsi di soppiatto.
- **Il pspsps richiama un solo gatto**, il più vicino.
- **In fuga il gatto è sempre più veloce della bambina**, come chiesto, e corre lungo i bordi invece di restare bloccato.
- **Shift accovaccia come Ctrl**, perché su Mac alcune combinazioni con Ctrl non arrivano alla pagina.
- **Devlog in `docs/` e non su `gh-pages`**, così i post restano su `master`, dove li cerca l'hook. La repo è diventata pubblica perché GitHub Pages sul piano gratuito richiede una repo pubblica.
- **Traduzioni scritte a mano con un pulsante**, niente traduzione automatica.
- **Flusso git**: branch → PR → merge su `master` per ogni blocco di lavoro.
- **Handoff fuori da git** tramite `.git/info/exclude`: servono solo allo sviluppo.

## Gotcha

- Nel browser integrato dell'app i tasti simulati arrivano senza `event.code`. Per provare il gioco da lì bisogna inviare dei `KeyboardEvent` via JavaScript con `code` impostato.
- Chrome headless si blocca dentro il sandbox di Bash, quindi gli screenshot vanno fatti fuori dal sandbox. Quello del devlog è stato fatto pilotando Chrome via CDP con uno script Node, che non è nella repo.
- Blender MCP perde la connessione quando Blender viene chiuso. Una scena non salvata si recupera da `quit.blend` nella cartella temporanea dell'utente (`getconf DARWIN_USER_TEMP_DIR`).
- zsh interrompe il comando se un glob non trova file.
- GitHub Pages tiene i file in cache per qualche minuto: per vedere subito le modifiche aggiungi `?v=...` all'URL.
- Lo Stop hook scatta a ogni risposta nei giorni con commit ma senza post, compreso dopo mezzanotte.

## Problemi aperti e prossimi passi

- **Il "muro" da accovacciata con Ctrl**: è stato aggiunto Shift, ma nessuno ha confermato con una tastiera vera se Ctrl+WASD arriva alla pagina.
- **Velocità del gatto chiamato**: arriva a 2,5, più lento della bambina. Resta da chiedere se "il gatto è sempre più veloce di me" valeva anche per l'arrivo.
- **Struttura del gioco**: ancora da definire.
- **Pulizia**: i branch remoti delle PR unite esistono ancora e il `.blend` contiene oggetti di default inutili.
