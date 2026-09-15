# Pet Them All

Prototipo di un gioco in cui una bambina cammina e trova gatti da accarezzare. Per ora c'è la meccanica di base, con forme segnaposto al posto della grafica.

Il devlog, in italiano e inglese, è su https://marcolp1822.github.io/pet_them_all/

## Come si gioca

La bambina è la capsula blu, i gatti sono le sfere.

| Tasto | Azione |
|---|---|
| WASD o frecce | Muoversi |
| Shift, tenuto premuto | Accovacciarsi: la bambina rallenta |
| E, da accovacciata | Pspsps: arriva il gatto fermo più vicino, se è entro 8 unità |

- Se la bambina corre verso un gatto vicino, lui scappa per 2,5 secondi in una direzione a caso, mai dritto verso di lei, ed è più veloce di lei.
- Arrivando a meno di un'unità da un gatto che non sta scappando, lo si accarezza e il contatore sale.
- Il taccuino in alto a sinistra raccoglie i tratti che si scoprono su ogni gatto.
- Colori dei gatti: grigio fermo, giallo in arrivo, rosso in fuga, verde accarezzato.

## Avvio

Servono Node.js, per three.js e i test, e Python 3, per il server locale.

```bash
npm install
npm start
```

Poi apri http://localhost:8000. Per i test:

```bash
npm test
```

## Struttura

| Percorso | Contenuto |
|---|---|
| `index.html`, `src/main.js` | Pagina del gioco: three.js, tastiera, contatore e taccuino a schermo |
| `src/gatti.js` | Logica della meccanica, senza DOM |
| `src/taccuino.js` | Taccuino dei gatti |
| `src/tasti.js` | Lettura della tastiera |
| `test/` | Test con `node --test` |
| `assets/livello-test.blend`, `assets/livello-test.glb` | Livello di prova fatto in Blender e il suo export |
| `serve.py` | Server locale senza cache, usato da `npm start` |
| `docs/` | Devlog Jekyll pubblicato con GitHub Pages |
| `.claude/` | Regole, hook e handoff per lo sviluppo con Claude Code |
| `CREDITS.md` | Fonte e licenza degli asset |
| `BLUEPRINT.md` | Processo e architettura da riusare nei prossimi progetti |

## Per chi sviluppa

- Le convenzioni del progetto sono in `.claude/rules/`.
- Architettura, decisioni e problemi aperti sono descritti nell'handoff più recente, in `.claude/handoff/`.
- Ogni modifica passa da un branch e da una pull request unita su `master`.
- Il modo di lavorare, pensato per essere riusato in altri progetti, è in [BLUEPRINT.md](BLUEPRINT.md).
