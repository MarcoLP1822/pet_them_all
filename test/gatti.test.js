import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, pspsps, counterText, PARAMS, FERMO, IN_ARRIVO, IN_FUGA, ACCAREZZATO } from '../src/gatti.js';

const DT = 1 / 60;
const STILL = { x: 0, z: 0, crouch: false };
const CROUCHED = { x: 0, z: 0, crouch: true };
const RUN_RIGHT = { x: 1, z: 0, crouch: false };
// Dagli estremi al centro: fuga il più vicino possibile alla bambina da un lato e dall'altro, e fuga dritta.
const RANDOM_VALUES = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.999];

function simulate(game, input, seconds) {
  for (let i = 0; i < Math.round(seconds / DT); i++) update(game, input, DT);
}

// Tasti di chi corre dietro al primo gatto: verso di lui, in una delle 8 direzioni della tastiera.
const chase = ({ girl, cats: [cat] }) => ({
  x: Math.sign(Math.round(cat.x - girl.x)),
  z: Math.sign(Math.round(cat.z - girl.z)),
  crouch: false,
});

// Pseudocasuale con seme: sequenze diverse, ma uguali a ogni `npm test`.
function seeded(seed) {
  let state = seed;
  return () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

// Spaventa un gatto correndogli incontro. Ritorna la direzione della fuga in gradi (0 = dritto via dalla bambina)
// e quanti gradi la separano dalla direzione che dal gatto va verso la bambina.
function scare(params, r) {
  const game = createGame({ cats: [[3.5, 0]], params, random: () => r });
  const [cat] = game.cats;
  while (cat.state === FERMO) update(game, RUN_RIGHT, DT);
  const towardX = game.girl.x - cat.x;
  const towardZ = game.girl.z - cat.z;
  const cos = (cat.fleeX * towardX + cat.fleeZ * towardZ) / Math.hypot(towardX, towardZ);
  return {
    heading: (Math.atan2(cat.fleeZ, cat.fleeX) * 180) / Math.PI,
    fromGirl: (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI,
  };
}

test('pspsps: richiama solo un gatto fermo entro il raggio di richiamo', () => {
  const game = createGame({ cats: [[7.9, 0], [0, 8.1]] });
  update(game, STILL, DT);
  assert.equal(pspsps(game), null, 'in piedi non funziona');

  update(game, CROUCHED, DT);
  assert.equal(pspsps(game), game.cats[0]);
  assert.equal(game.cats[0].state, IN_ARRIVO);
  assert.equal(pspsps(game), null, 'il secondo gatto è fuori raggio');
  assert.equal(game.cats[1].state, FERMO);

  const wider = createGame({ cats: [[0, 8.1]], params: { ...PARAMS, callRadius: 9 } });
  update(wider, CROUCHED, DT);
  assert.equal(pspsps(wider), wider.cats[0], 'il raggio è parametrizzabile');
});

test('fermo → in_arrivo → accarezzato: il gatto richiamato raggiunge la bambina', () => {
  const game = createGame({ cats: [[5, 0]] });
  const [cat] = game.cats;
  assert.equal(cat.state, FERMO);
  update(game, CROUCHED, DT);
  pspsps(game);
  assert.equal(cat.state, IN_ARRIVO);

  simulate(game, CROUCHED, 1);
  assert.equal(cat.state, IN_ARRIVO);
  assert.ok(cat.x < 5, 'si sta avvicinando');

  simulate(game, CROUCHED, 2);
  assert.equal(cat.state, ACCAREZZATO);
  const petPosition = [cat.x, cat.z];
  simulate(game, CROUCHED, 1);
  assert.deepEqual([cat.x, cat.z], petPosition, 'resta fermo sul posto');
});

test('fermo → in_fuga → fermo: correndo verso il gatto lo si spaventa, da qualunque parte scappi', () => {
  for (const r of RANDOM_VALUES) {
    const game = createGame({ cats: [[3.5, 0]], random: () => r });
    const [cat] = game.cats;
    assert.equal(cat.state, FERMO);
    simulate(game, RUN_RIGHT, 0.25);
    assert.equal(cat.state, IN_FUGA, `random ${r}`);

    simulate(game, STILL, 1);
    assert.equal(cat.state, IN_FUGA, `random ${r}`);
    assert.ok(Math.hypot(cat.x - 3.5, cat.z) > 3, `random ${r}: si allontana da dov'era`);

    simulate(game, STILL, 2);
    assert.equal(cat.state, FERMO, `random ${r}`);
  }
});

test('la fuga va in una direzione imprevedibile, ma mai nello spicchio di 30° verso la bambina', () => {
  const headings = [];
  for (let i = 0; i <= 200; i++) {
    const r = i / 201;
    const { heading, fromGirl } = scare(PARAMS, r);
    assert.ok(fromGirl >= 15 - 1e-6, `random ${r}: scappa a ${fromGirl.toFixed(1)}° dalla direzione della bambina`);
    headings.push(heading);
  }
  assert.ok(Math.max(...headings) - Math.min(...headings) > 320, 'le direzioni coprono quasi tutto il giro');
  assert.ok(Math.abs(scare(PARAMS, 0).fromGirl - 15) < 1e-6, 'al limite sfiora lo spicchio');
  assert.ok(Math.abs(scare(PARAMS, 0.5).heading) < 1e-6, 'a metà scappa dritto via dalla bambina');
  assert.ok(Math.abs(scare({ ...PARAMS, fleeExcludedAngle: 90 }, 0).fromGirl - 45) < 1e-6, 'lo spicchio è parametrizzabile');
});

test('in fuga il gatto è più veloce della bambina, e inseguendolo non si fa mai accarezzare, neanche contro i bordi', () => {
  const game = createGame({ cats: [[3.5, 0]], random: () => 0.5 });
  const [cat] = game.cats;
  while (cat.state === FERMO) update(game, RUN_RIGHT, DT);
  const [startX, startZ] = [cat.x, cat.z];
  simulate(game, RUN_RIGHT, 0.5);
  assert.ok(Math.hypot(cat.x - startX, cat.z - startZ) > PARAMS.girlMaxSpeed * 0.5, 'in mezzo secondo fa più strada di quanta ne faccia lei');

  for (const start of [[3.5, 0], [18, 0], [18, 18]]) {
    for (let seed = 1; seed <= 20; seed++) {
      const chased = createGame({ cats: [start], random: seeded(seed) });
      for (let i = 0; i < 20 / DT; i++) {
        update(chased, chase(chased), DT);
        assert.notEqual(chased.cats[0].state, ACCAREZZATO, `gatto partito da ${start}, seme ${seed}: accarezzato mentre lo si inseguiva`);
      }
    }
  }
});

test('avvicinandosi piano da accovacciata il gatto non scappa', () => {
  const game = createGame({ cats: [[3.5, 0]] });
  simulate(game, { x: 1, z: 0, crouch: true }, 2);
  assert.equal(game.cats[0].state, ACCAREZZATO);
});

test('il contatore sale a ogni gatto accarezzato', () => {
  const game = createGame({ cats: [[0.5, 0], [0, -0.5], [10, 10], [-10, -10]] });
  assert.equal(counterText(game), '0/4 gatti accarezzati');
  update(game, STILL, DT);
  assert.equal(counterText(game), '2/4 gatti accarezzati');
  simulate(game, STILL, 1);
  assert.equal(counterText(game), '2/4 gatti accarezzati', 'non conta due volte lo stesso gatto');
});
