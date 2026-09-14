import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, PARAMS, FERMO, IN_FUGA, ACCAREZZATO } from '../src/gatti.js';
import { TRATTI, taccuinoRighe, taccuinoTesto } from '../src/taccuino.js';

const DT = 1 / 60;
const STILL = { x: 0, z: 0, crouch: false };
const CORRE = { x: 1, z: 0, crouch: false };
const AVANZA_PIANO = { x: 1, z: 0, crouch: true };
const [TIMIDO] = TRATTI[IN_FUGA];
const COCCOLE = TRATTI[ACCAREZZATO];

function simulate(game, input, seconds) {
  for (let i = 0; i < Math.round(seconds / DT); i++) update(game, input, DT);
}

// Spaventa il gatto da capo: la bambina si piazza a 3.5 unità e gli corre addosso.
function spaventa(game, cat) {
  piazzaLaBambina(game, cat, 3.5);
  simulate(game, CORRE, 0.25);
}

// Lo raggiunge da vicino e accovacciata: piano com'è, il gatto non si spaventa.
function accarezza(game, cat) {
  piazzaLaBambina(game, cat, 2);
  simulate(game, AVANZA_PIANO, 1.5);
}

function piazzaLaBambina(game, cat, distanza) {
  game.girl.x = cat.x - distanza;
  game.girl.z = cat.z;
}

test('i trigger del taccuino sono stati che il gioco ha già', () => {
  assert.deepEqual(Object.keys(TRATTI), [IN_FUGA, ACCAREZZATO]);
});

test('ogni gatto nasce con id, nome segnaposto e taccuino vuoto', () => {
  const game = createGame({ cats: [[10, 0], [0, 10], [-10, 0]] });
  assert.deepEqual(
    game.cats.map(({ id, nome, tratti }) => [id, nome, tratti]),
    [[1, 'Gatto 1', []], [2, 'Gatto 2', []], [3, 'Gatto 3', []]],
  );
  assert.deepEqual(taccuinoRighe(game), [], 'un gatto mai incontrato non compare');
});

test('il primo in_fuga registra il tratto del gatto timido', () => {
  const game = createGame({ cats: [[3.5, 0]] });
  const [cat] = game.cats;

  spaventa(game, cat);
  assert.equal(cat.state, IN_FUGA);
  assert.deepEqual(cat.tratti, [TIMIDO]);
  assert.deepEqual(taccuinoRighe(game), [{ id: 1, nome: 'Gatto 1', tratti: [TIMIDO] }]);
});

test('il primo accarezzato registra un tratto pescato dal pool delle coccole', () => {
  for (const [caso, random, atteso] of [
    ['inizio pool', () => 0, COCCOLE[0]],
    ['metà pool', () => 0.5, COCCOLE[2]],
    ['fine pool', () => 0.999, COCCOLE.at(-1)],
  ]) {
    const game = createGame({ cats: [[3.5, 0]], random });
    simulate(game, AVANZA_PIANO, 2);
    assert.equal(game.cats[0].state, ACCAREZZATO, caso);
    assert.deepEqual(game.cats[0].tratti, [atteso], caso);
  }
});

test('senza random iniettato il tratto arriva comunque dal pool', () => {
  for (let i = 0; i < 50; i++) {
    const game = createGame({ cats: [[3.5, 0]] });
    simulate(game, AVANZA_PIANO, 2);
    assert.ok(COCCOLE.includes(game.cats[0].tratti[0]), `tratto fuori pool: ${game.cats[0].tratti[0]}`);
  }
});

test('il secondo in_fuga dello stesso gatto non aggiunge un altro tratto', () => {
  const game = createGame({ cats: [[3.5, 0]] });
  const [cat] = game.cats;
  spaventa(game, cat);
  assert.deepEqual(cat.tratti, [TIMIDO]);

  simulate(game, STILL, PARAMS.fleeDuration + 0.5);
  assert.equal(cat.state, FERMO, 'la prima fuga è finita');

  spaventa(game, cat);
  assert.equal(cat.state, IN_FUGA, 'scappa di nuovo');
  assert.deepEqual(cat.tratti, [TIMIDO], 'nessun tratto duplicato');
});

test('il secondo accarezzato dello stesso gatto non aggiunge un altro tratto', () => {
  const game = createGame({ cats: [[3.5, 0]], random: () => 0.5 });
  const [cat] = game.cats;
  simulate(game, AVANZA_PIANO, 2);
  assert.equal(cat.state, ACCAREZZATO);
  const scoperti = [...cat.tratti];
  assert.equal(scoperti.length, 1);

  // Oggi un gatto non esce mai da accarezzato: lo rimettiamo fermo a mano per controllare
  // che a reggere sia il flag, non il fatto che lo stato non si ripeta.
  cat.state = FERMO;
  update(game, { x: 0, z: 0, crouch: true }, DT);
  assert.equal(cat.state, ACCAREZZATO, 'si fa accarezzare di nuovo');
  assert.deepEqual(cat.tratti, scoperti, 'nessun tratto duplicato');
});

test('il pannello elenca solo i gatti incontrati, con i tratti scoperti finora', () => {
  const game = createGame({ cats: [[3.5, 0], [-15, 0]], random: () => 0 });
  const [primo] = game.cats;
  assert.equal(taccuinoTesto(game), 'Taccuino: ancora nessun gatto incontrato');

  spaventa(game, primo);
  assert.equal(taccuinoTesto(game), ['Taccuino:', 'Gatto 1:', `- ${TIMIDO}`].join('\n'));

  simulate(game, STILL, PARAMS.fleeDuration + 0.5);
  accarezza(game, primo);
  assert.equal(primo.state, ACCAREZZATO, 'raggiunto piano piano da accovacciata');
  assert.equal(
    taccuinoTesto(game),
    ['Taccuino:', 'Gatto 1:', `- ${TIMIDO}`, `- ${COCCOLE[0]}`].join('\n'),
    'due tratti sullo stesso gatto, il Gatto 2 mai incontrato non compare',
  );
});
