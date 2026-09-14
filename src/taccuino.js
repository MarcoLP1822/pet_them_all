// Taccuino dei gatti: per ogni gatto incontrato, i tratti che la bambina ha scoperto su di lui.
// Solo dati, niente three.js: i test girano con `npm test`.

// Chiave = stato in cui il gatto entra (vedi gatti.js), valore = pool da cui pescare il tratto.
// Nessuno stato nuovo: i trigger sono quelli che il gioco ha già.
export const TRATTI = {
  in_fuga: ['è timido, scappa se ti avvicini in fretta'],
  accarezzato: [
    'adora le coccole sulla schiena',
    'fa le fusa fortissimo',
    'ha un miao acutissimo',
    'si struscia sempre sulle gambe',
  ],
};

export function nuovaScheda(id) {
  return {
    id,
    nome: `Gatto ${id}`,
    tratti: [],
    // Un tratto per trigger: il flag resta alzato anche quando lo stato si ripete.
    registrati: Object.fromEntries(Object.keys(TRATTI).map((trigger) => [trigger, false])),
  };
}

// Chiamata a ogni ingresso di stato. Ritorna il tratto appena scoperto, o null se non c'è niente da registrare.
export function scopriTratto(cat, trigger, random = Math.random) {
  const pool = TRATTI[trigger];
  if (!pool || cat.registrati[trigger]) return null;
  cat.registrati[trigger] = true;
  const tratto = pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
  cat.tratti.push(tratto);
  return tratto;
}

// Solo i gatti su cui si è scoperto qualcosa: il taccuino non anticipa quelli mai incontrati.
export function taccuinoRighe(game) {
  return game.cats
    .filter((cat) => cat.tratti.length > 0)
    .map(({ id, nome, tratti }) => ({ id, nome, tratti: [...tratti] }));
}

export function taccuinoTesto(game) {
  const righe = taccuinoRighe(game);
  if (righe.length === 0) return 'Taccuino: ancora nessun gatto incontrato';
  const corpo = righe.flatMap(({ nome, tratti }) => [`${nome}:`, ...tratti.map((tratto) => `- ${tratto}`)]);
  return ['Taccuino:', ...corpo].join('\n');
}
