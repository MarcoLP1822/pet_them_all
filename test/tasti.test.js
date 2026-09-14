import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inputDaTasti, rilasciaTasto } from '../src/tasti.js';

const DIREZIONI = [
  ['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0],
  ['KeyW', 0, -1], ['KeyS', 0, 1], ['KeyA', -1, 0], ['KeyD', 1, 0],
];

test('accovacciata con Shift ci si muove in tutte e quattro le direzioni, con le frecce e con WASD', () => {
  for (const shift of ['ShiftLeft', 'ShiftRight']) {
    for (const [tasto, x, z] of DIREZIONI) {
      assert.deepEqual(inputDaTasti(new Set([shift, tasto])), { x, z, crouch: true }, `${shift} + ${tasto}`);
    }
  }
});

test('Ctrl non fa più accovacciare', () => {
  assert.deepEqual(inputDaTasti(new Set(['ControlLeft', 'ArrowLeft'])), { x: -1, z: 0, crouch: false });
});

test('lasciando Cmd si liberano i tasti rimasti bloccati, ma non Shift', () => {
  for (const cmd of ['MetaLeft', 'MetaRight']) {
    const keys = new Set(['ShiftLeft', 'KeyD', 'ArrowUp', cmd]);
    rilasciaTasto(keys, cmd);
    assert.deepEqual([...keys], ['ShiftLeft'], cmd);
  }

  const keys = new Set(['KeyD', 'KeyW']);
  rilasciaTasto(keys, 'KeyW');
  assert.deepEqual([...keys], ['KeyD'], 'un tasto normale libera solo sé stesso');
});
