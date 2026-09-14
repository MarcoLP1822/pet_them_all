// Meccanica core: la bambina chiama i gatti (pspsps) e li accarezza.
// Solo logica, niente three.js: i test girano con `npm test`.

import { nuovaScheda, scopriTratto } from './taccuino.js';

export const FERMO = 'fermo';
export const IN_ARRIVO = 'in_arrivo';
export const IN_FUGA = 'in_fuga';
export const ACCAREZZATO = 'accarezzato';

const GIRL_MAX_SPEED = 4;

export const PARAMS = {
  areaHalfSize: 20,
  girlMaxSpeed: GIRL_MAX_SPEED,
  crouchSpeedFactor: 0.4, // accovacciata rallenta, restando sotto la soglia di fuga
  callRadius: 8,
  catSpeed: 2.5,
  reactionRadius: 3,
  fleeSpeedThreshold: GIRL_MAX_SPEED / 2,
  fleeSpeed: GIRL_MAX_SPEED * 1.5, // in fuga il gatto è sempre più veloce della bambina
  fleeDuration: 2.5,
  fleeExcludedAngle: 30, // gradi: spicchio centrato sulla bambina in cui il gatto non scappa mai
  petDistance: 1,
};

// random è iniettabile: i test scelgono il tratto delle coccole e la direzione di fuga invece di subirli.
export function createGame({ cats, girl = [0, 0], params = PARAMS, random = Math.random }) {
  return {
    params,
    random,
    girl: { x: girl[0], z: girl[1], vx: 0, vz: 0, crouched: false },
    cats: cats.map(([x, z], i) => ({ x, z, state: FERMO, fleeTime: 0, fleeX: 0, fleeZ: 0, ...nuovaScheda(i + 1) })),
  };
}

// Ogni cambio di stato passa da qui: è il punto in cui il taccuino registra i tratti.
function entra(game, cat, state) {
  cat.state = state;
  scopriTratto(cat, state, game.random);
}

// E da accovacciata: il gatto fermo più vicino entro il raggio di richiamo arriva.
// ponytail: risponde un solo gatto per pressione, il più vicino
export function pspsps(game) {
  if (!game.girl.crouched) return null;
  let called = null;
  let nearest = game.params.callRadius;
  for (const cat of game.cats) {
    const d = distance(cat, game.girl);
    if (cat.state === FERMO && d <= nearest) {
      called = cat;
      nearest = d;
    }
  }
  if (called) entra(game, called, IN_ARRIVO);
  return called;
}

// input: { x, z } direzione da tastiera (-1, 0, 1), crouch se è accovacciata (vedi tasti.js). dt in secondi.
export function update(game, input, dt) {
  const { params: p, girl } = game;
  girl.crouched = input.crouch;
  const length = Math.hypot(input.x, input.z);
  const speed = length === 0 ? 0 : (p.girlMaxSpeed * (girl.crouched ? p.crouchSpeedFactor : 1)) / length;
  girl.vx = input.x * speed;
  girl.vz = input.z * speed;
  girl.x = clamp(girl.x + girl.vx * dt, p.areaHalfSize);
  girl.z = clamp(girl.z + girl.vz * dt, p.areaHalfSize);

  for (const cat of game.cats) {
    if (cat.state === IN_FUGA) {
      slideAlongEdges(cat, p.areaHalfSize);
      cat.x = clamp(cat.x + cat.fleeX * p.fleeSpeed * dt, p.areaHalfSize);
      cat.z = clamp(cat.z + cat.fleeZ * p.fleeSpeed * dt, p.areaHalfSize);
      cat.fleeTime -= dt;
      if (cat.fleeTime <= 0) entra(game, cat, FERMO);
    }

    const dx = cat.x - girl.x;
    const dz = cat.z - girl.z;
    const dist = Math.hypot(dx, dz);

    // Controllato dopo la fuga: un gatto appena fermato a cui la bambina corre addosso riscappa, non si fa accarezzare.
    if (cat.state === FERMO && dist > 0 && dist <= p.reactionRadius) {
      const approachSpeed = (girl.vx * dx + girl.vz * dz) / dist; // quanto in fretta la bambina gli va incontro
      if (approachSpeed > p.fleeSpeedThreshold) {
        Object.assign(cat, { fleeTime: p.fleeDuration, ...fleeDirection(dx, dz, game.random, p.fleeExcludedAngle) });
        entra(game, cat, IN_FUGA);
      }
    } else if (cat.state === IN_ARRIVO && dist > 0) {
      const step = Math.min(p.catSpeed * dt, dist);
      cat.x -= (dx / dist) * step;
      cat.z -= (dz / dist) * step;
    }

    if ((cat.state === FERMO || cat.state === IN_ARRIVO) && distance(cat, girl) < p.petDistance) {
      entra(game, cat, ACCAREZZATO);
    }
  }
}

// Direzione di fuga a caso, uniforme su tutto il giro tranne lo spicchio di `excluded` gradi centrato sulla bambina:
// il gatto può scappare di lato o passarle accanto, mai dritto verso di lei. (awayX, awayZ) punta dalla bambina al gatto.
// ponytail: la direzione si sceglie una volta sola, quando si spaventa; poi corre dritto, e lungo i bordi se ci arriva
function fleeDirection(awayX, awayZ, random, excluded) {
  const maxOffset = Math.PI - (excluded * Math.PI) / 360; // 180° meno metà spicchio
  const angle = Math.atan2(awayZ, awayX) + (random() * 2 - 1) * maxOffset;
  return { fleeX: Math.cos(angle), fleeZ: Math.sin(angle) };
}

// Contro un bordo il gatto in fuga ci corre lungo invece di restare schiacciato lì, dove lo si raggiungerebbe.
// Se ci arriva dritto o finisce in un angolo, corre lungo il bordo verso il centro.
function slideAlongEdges(cat, half) {
  if (Math.abs(cat.x) >= half && Math.sign(cat.fleeX) === Math.sign(cat.x)) {
    cat.fleeX = 0;
    cat.fleeZ = Math.sign(cat.fleeZ) || -Math.sign(cat.z) || 1;
  }
  if (Math.abs(cat.z) >= half && Math.sign(cat.fleeZ) === Math.sign(cat.z)) {
    cat.fleeZ = 0;
    cat.fleeX = Math.sign(cat.fleeX) || -Math.sign(cat.x) || 1;
  }
}

export function counterText(game) {
  const petted = game.cats.filter((cat) => cat.state === ACCAREZZATO).length;
  return `${petted}/${game.cats.length} gatti accarezzati`;
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clamp = (value, half) => Math.max(-half, Math.min(half, value));
