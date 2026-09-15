// Fuzz della logica di gioco: tante partite simulate, con input casuali e strategie mirate, controllando
// a ogni frame le regole della meccanica. È deterministico: ogni partita usa il proprio seme.
// Uso: npm run fuzz, oppure npm run fuzz -- <partite> <secondi> (di default 300 partite da 120 secondi).
import { readFileSync } from 'node:fs';
import { createGame, update, pspsps, PARAMS, FERMO, IN_ARRIVO, IN_FUGA, ACCAREZZATO } from '../src/gatti.js';
import { TRATTI } from '../src/taccuino.js';

const DT = 1 / 60;
const EPS = 1e-9;
const PARTITE = Number(process.argv[2] ?? 300);
const SECONDI = Number(process.argv[3] ?? 120);
if (!(PARTITE > 0 && SECONDI > 0)) throw new Error('uso: npm run fuzz -- <partite> <secondi>');

// Partenze e area dal livello, come in main.js: i nodi Gatto* nell'ordine del GLB e la larghezza del terreno.
const glb = readFileSync(new URL('../assets/livello-test.glb', import.meta.url));
const gltf = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
const nodi = gltf.scenes[gltf.scene ?? 0].nodes.map((i) => gltf.nodes[i]);
const suPiano = (nodo) => [nodo.translation?.[0] ?? 0, nodo.translation?.[2] ?? 0];
const GATTI = nodi.filter((nodo) => nodo.name.startsWith('Gatto')).map(suPiano);
const BAMBINA = suPiano(nodi.find((nodo) => nodo.name === 'Bambina'));
const terreno = nodi.find((nodo) => nodo.name === 'Terreno');
const AREA = gltf.accessors[gltf.meshes[terreno.mesh].primitives[0].attributes.POSITION].max[0];

const rng = (seme) => {
  let s = seme >>> 0;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
};
const distanza = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const violazioni = new Map();
const segnala = (regola, esempio) => {
  const v = violazioni.get(regola);
  if (v) v.volte++;
  else violazioni.set(regola, { volte: 1, esempio });
};
const conteggi = { fughe: 0, richiami: 0, carezze: 0 };

for (let seme = 1; seme <= PARTITE; seme++) {
  const caso = rng(seme);
  const game = createGame({ cats: GATTI, girl: BAMBINA, params: { ...PARAMS, areaHalfSize: AREA }, random: rng(seme * 7919 + 13) });
  const p = game.params;
  const inizioFuga = game.cats.map(() => 0);
  const postoCarezza = game.cats.map(() => null);
  const scappato = game.cats.map(() => false);
  let input = { x: 0, z: 0, crouch: false };
  let strategia = 'caso';
  let durata = 0;

  for (let frame = 0; frame < SECONDI / DT; frame++) {
    const dove = { seme, frame };

    // Ogni tanto cambia strategia: tasti a caso, inseguire, avvicinarsi accovacciata, chiamare da ferma.
    if (durata-- <= 0) {
      const r = caso();
      strategia = r < 0.35 ? 'caso' : r < 0.6 ? 'insegui' : r < 0.85 ? 'avvicinati' : 'chiama';
      durata = 20 + Math.floor(caso() * 150);
      if (strategia === 'caso') input = { x: Math.floor(caso() * 3) - 1, z: Math.floor(caso() * 3) - 1, crouch: caso() < 0.4 };
    }
    const bersaglio = game.cats
      .filter((c) => c.state !== ACCAREZZATO)
      .sort((a, b) => distanza(a, game.girl) - distanza(b, game.girl))[0];
    if (bersaglio && (strategia === 'insegui' || strategia === 'avvicinati')) {
      const dx = bersaglio.x - game.girl.x;
      const dz = bersaglio.z - game.girl.z;
      input = { x: Math.abs(dx) > 0.2 ? Math.sign(dx) : 0, z: Math.abs(dz) > 0.2 ? Math.sign(dz) : 0, crouch: strategia === 'avvicinati' };
    }
    if (strategia === 'chiama') input = { x: 0, z: 0, crouch: true };

    // pspsps come in main.js: conta se la bambina è accovacciata nel momento in cui si preme E.
    if (caso() < (strategia === 'chiama' ? 0.05 : 0.005)) {
      game.girl.crouched = input.crouch;
      const stati = game.cats.map((c) => c.state);
      const nelRaggio = game.cats.filter((c, i) => stati[i] === FERMO && distanza(c, game.girl) <= p.callRadius);
      const chiamato = pspsps(game);
      if (chiamato) conteggi.richiami++;
      if (!input.crouch && chiamato) segnala('pspsps in piedi chiama un gatto', dove);
      if (input.crouch && nelRaggio.length && !chiamato) segnala('pspsps da accovacciata non chiama un gatto fermo nel raggio', dove);
      if (chiamato && nelRaggio.some((c) => distanza(c, game.girl) < distanza(chiamato, game.girl) - EPS)) segnala('pspsps non chiama il gatto più vicino', dove);
      game.cats.forEach((c, i) => {
        if (c !== chiamato && c.state !== stati[i]) segnala('pspsps cambia stato a un gatto non chiamato', dove);
      });
    }

    const prima = game.cats.map((c) => ({ ...c }));
    update(game, input, DT);
    const g = game.girl;

    if (![g.x, g.z, g.vx, g.vz].every(Number.isFinite) || Math.abs(g.x) > AREA + EPS || Math.abs(g.z) > AREA + EPS) segnala('bambina fuori area o NaN', dove);
    if (Math.hypot(g.vx, g.vz) > p.girlMaxSpeed * (g.crouched ? p.crouchSpeedFactor : 1) + EPS) segnala('bambina oltre la velocità massima', dove);

    game.cats.forEach((c, i) => {
      const b = prima[i];
      const qui = { ...dove, gatto: c.id };
      if (![c.x, c.z].every(Number.isFinite) || Math.abs(c.x) > AREA + EPS || Math.abs(c.z) > AREA + EPS) segnala('gatto fuori area o NaN', qui);
      const dx = c.x - g.x;
      const dz = c.z - g.z;
      const dist = Math.hypot(dx, dz);
      const incontro = dist > 0 ? (g.vx * dx + g.vz * dz) / dist : 0; // quanto in fretta lei gli va incontro
      const siSpaventa = dist > 0 && dist <= p.reactionRadius && incontro > p.fleeSpeedThreshold;
      const controllaDirezione = () => {
        const gradi = (Math.acos(Math.max(-1, Math.min(1, -(c.fleeX * dx + c.fleeZ * dz) / dist))) * 180) / Math.PI;
        if (gradi < p.fleeExcludedAngle / 2 - 1e-6) segnala('scappa dentro lo spicchio verso la bambina', { ...qui, gradi });
        if (Math.abs(Math.hypot(c.fleeX, c.fleeZ) - 1) > EPS) segnala('direzione di fuga non unitaria', qui);
      };
      const controllaDurata = () => {
        const secondi = (frame - inizioFuga[i]) * DT;
        if (Math.abs(secondi - p.fleeDuration) > DT + EPS) segnala('fuga di durata sbagliata', { ...qui, secondi });
      };

      switch (`${b.state}→${c.state}`) {
        case `${FERMO}→${FERMO}`:
          if (siSpaventa) segnala('fermo non scappa anche se lei gli corre incontro', qui);
          if (dist < p.petDistance) segnala('fermo a distanza di carezza ma non accarezzato', qui);
          break;
        case `${FERMO}→${IN_FUGA}`:
          conteggi.fughe++;
          scappato[i] = true;
          inizioFuga[i] = frame;
          if (!siSpaventa) segnala('scappa senza motivo', qui);
          controllaDirezione();
          break;
        case `${IN_FUGA}→${IN_FUGA}`:
          if (c.fleeTime > b.fleeTime) {
            // finita la fuga, è ripartito nello stesso frame perché lei gli correva addosso
            controllaDurata();
            conteggi.fughe++;
            inizioFuga[i] = frame;
            controllaDirezione();
          }
          break;
        case `${IN_FUGA}→${FERMO}`:
          controllaDurata();
          break;
        case `${IN_ARRIVO}→${IN_ARRIVO}`:
          if (dist > distanza(b, g) + EPS) segnala('in_arrivo si allontana dalla bambina', qui);
          break;
        case `${FERMO}→${ACCAREZZATO}`:
        case `${IN_ARRIVO}→${ACCAREZZATO}`:
        case `${IN_FUGA}→${ACCAREZZATO}`:
          conteggi.carezze++;
          if (dist >= p.petDistance) segnala('accarezzato da lontano', qui);
          if (b.state !== IN_ARRIVO && siSpaventa) segnala('accarezzato mentre lei gli corre incontro', qui);
          if (b.state === IN_FUGA) controllaDurata();
          postoCarezza[i] = [c.x, c.z];
          break;
        case `${ACCAREZZATO}→${ACCAREZZATO}`:
          if (c.x !== postoCarezza[i][0] || c.z !== postoCarezza[i][1]) segnala('gatto accarezzato che si muove', qui);
          break;
        default:
          segnala(`transizione non prevista ${b.state}→${c.state}`, qui);
      }

      if (new Set(c.tratti).size !== c.tratti.length) segnala('tratto duplicato nel taccuino', qui);
      if (c.tratti.includes(TRATTI[IN_FUGA][0]) !== scappato[i]) segnala('tratto timido non coerente con le fughe', qui);
      if (c.tratti.some((t) => TRATTI[ACCAREZZATO].includes(t)) !== (c.state === ACCAREZZATO)) segnala('tratto delle coccole non coerente con la carezza', qui);
    });
  }
}

console.log(`${PARTITE} partite da ${SECONDI} secondi: ${conteggi.fughe} fughe, ${conteggi.richiami} richiami, ${conteggi.carezze} carezze`);
for (const [regola, { volte, esempio }] of violazioni) console.log(`VIOLAZIONE ${regola}: ${volte} volte, per esempio ${JSON.stringify(esempio)}`);
if (violazioni.size) process.exit(1);
console.log('Nessuna regola violata');
