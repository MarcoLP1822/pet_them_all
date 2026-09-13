import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, pspsps, counterText, PARAMS, FERMO, IN_ARRIVO, IN_FUGA, ACCAREZZATO } from '../src/gatti.js';

const DT = 1 / 60;
const STILL = { x: 0, z: 0, crouch: false };
const CROUCHED = { x: 0, z: 0, crouch: true };

function simulate(game, input, seconds) {
  for (let i = 0; i < Math.round(seconds / DT); i++) update(game, input, DT);
}

// Tasti di chi corre dietro al primo gatto: verso di lui, in una delle 8 direzioni della tastiera.
const chase = ({ girl, cats: [cat] }) => ({
  x: Math.sign(Math.round(cat.x - girl.x)),
  z: Math.sign(Math.round(cat.z - girl.z)),
  crouch: false,
});

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

test('fermo → in_fuga → fermo: correndo verso il gatto lo si spaventa', () => {
  const game = createGame({ cats: [[3.5, 0]] });
  const [cat] = game.cats;
  assert.equal(cat.state, FERMO);
  simulate(game, { x: 1, z: 0, crouch: false }, 0.25);
  assert.equal(cat.state, IN_FUGA);

  simulate(game, STILL, 1);
  assert.equal(cat.state, IN_FUGA);
  assert.ok(cat.x > 3.5, 'si allontana');

  simulate(game, STILL, 2);
  assert.equal(cat.state, FERMO);
});

test('in fuga il gatto è più veloce: inseguendolo si allontana e non si fa accarezzare, neanche contro i bordi', () => {
  const game = createGame({ cats: [[3.5, 0]] });
  const [cat] = game.cats;
  const gap = () => Math.hypot(cat.x - game.girl.x, cat.z - game.girl.z);
  while (cat.state === FERMO) update(game, chase(game), DT);
  const gapWhenScared = gap();
  for (let i = 0; i < 60; i++) update(game, chase(game), DT);
  assert.ok(gap() > gapWhenScared + 1, 'correndo la bambina non recupera terreno');

  for (const start of [[3.5, 0], [18, 0], [18, 18]]) {
    const chased = createGame({ cats: [start] });
    for (let i = 0; i < 20 / DT; i++) {
      update(chased, chase(chased), DT);
      assert.notEqual(chased.cats[0].state, ACCAREZZATO, `il gatto partito da ${start} si è fatto accarezzare mentre lo si inseguiva`);
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
