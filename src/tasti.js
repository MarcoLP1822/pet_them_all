// Tastiera: dai tasti premuti (event.code) all'input che si aspetta update() in gatti.js.
// Solo logica, niente DOM: i test girano con `npm test`.

export const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE'];

// Ci si accovaccia con Shift, non con Ctrl: su Mac Ctrl+← e Ctrl+→ cambiano scrivania e non arrivano mai
// alla pagina (con le impostazioni di default nemmeno Ctrl+↑ e Ctrl+↓), e su Windows Ctrl+W chiude la scheda.
export const CROUCH_KEYS = ['ShiftLeft', 'ShiftRight'];

// Su Mac, finché Cmd è premuto, il browser non manda il keyup degli altri tasti: un tasto lasciato con Cmd giù
// resterebbe premuto per sempre. Al rilascio di Cmd li liberiamo tutti, tranne Shift, il cui keyup arriva comunque.
export function rilasciaTasto(keys, code) {
  keys.delete(code);
  if (code !== 'MetaLeft' && code !== 'MetaRight') return;
  for (const held of keys) if (!CROUCH_KEYS.includes(held)) keys.delete(held);
}

export function inputDaTasti(keys) {
  const held = (...codes) => codes.some((code) => keys.has(code));
  return {
    x: held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft'),
    z: held('KeyS', 'ArrowDown') - held('KeyW', 'ArrowUp'),
    crouch: held(...CROUCH_KEYS),
  };
}
