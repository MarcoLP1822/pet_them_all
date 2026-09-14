import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createGame, update, pspsps, counterText, PARAMS } from './gatti.js';
import { taccuinoTesto } from './taccuino.js';

const STATE_COLORS = { fermo: 0x9e9e9e, in_arrivo: 0xffc107, in_fuga: 0xf44336, accarezzato: 0x4caf50 };
const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'ControlLeft', 'ControlRight'];
// Shift vale come Ctrl: su Mac alcune combinazioni con Ctrl (per esempio Ctrl+frecce) non arrivano al gioco
const CROUCH_KEYS = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight'];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 3));
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
const LOOK_AT = new THREE.Vector3(0, 0, 4); // un po' verso la camera, così si vede anche il bordo vicino dell'area
const CAMERA_OFFSET = new THREE.Vector3(0, 32, 26); // inquadra tutta l'area 40×40 in una finestra 4:3

// Se la finestra è più stretta di 4:3 la camera arretra, così i bordi laterali restano visibili.
function frameArea() {
  camera.aspect = innerWidth / innerHeight;
  camera.position.copy(LOOK_AT).addScaledVector(CAMERA_OFFSET, Math.max(1, 4 / 3 / camera.aspect));
  camera.lookAt(LOOK_AT);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
frameArea();
addEventListener('resize', frameArea);

// Il livello di test (terreno, bambina, gatti) è fatto in Blender ed esportato in GLB.
const level = (await new GLTFLoader().loadAsync('assets/livello-test.glb')).scene;
scene.add(level);

const ground = level.getObjectByName('Terreno');
const girlMesh = level.getObjectByName('Bambina');
const catMeshes = level.children.filter((node) => node.name.startsWith('Gatto'));

const game = createGame({
  cats: catMeshes.map((mesh) => [mesh.position.x, mesh.position.z]),
  girl: [girlMesh.position.x, girlMesh.position.z],
  params: { ...PARAMS, areaHalfSize: new THREE.Box3().setFromObject(ground).max.x },
});

ground.material = new THREE.MeshLambertMaterial({ color: 0x555555 });
girlMesh.material = new THREE.MeshLambertMaterial({ color: 0x42a5f5 });
const catMaterials = Object.fromEntries(
  Object.entries(STATE_COLORS).map(([state, color]) => [state, new THREE.MeshLambertMaterial({ color })]),
);

const keys = new Set();
const held = (...codes) => codes.some((code) => keys.has(code));
addEventListener('keydown', (event) => {
  if (GAME_KEYS.includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'KeyE' && !event.repeat) {
    game.girl.crouched = event.ctrlKey || event.shiftKey;
    pspsps(game);
  }
});
addEventListener('keyup', (event) => keys.delete(event.code));
addEventListener('blur', () => keys.clear());

const hud = document.getElementById('contatore');
const taccuinoHud = document.getElementById('taccuino');
let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  update(game, {
    x: held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft'),
    z: held('KeyS', 'ArrowDown') - held('KeyW', 'ArrowUp'),
    crouch: held(...CROUCH_KEYS),
  }, dt);

  girlMesh.position.set(game.girl.x, 0, game.girl.z);
  girlMesh.scale.y = game.girl.crouched ? 0.6 : 1;
  game.cats.forEach((cat, i) => {
    catMeshes[i].position.set(cat.x, 0, cat.z);
    catMeshes[i].material = catMaterials[cat.state];
  });
  hud.textContent = counterText(game);
  // Il taccuino cambia solo quando si sblocca un tratto: riscriviamo il pannello soltanto allora.
  const taccuino = taccuinoTesto(game);
  if (taccuino !== taccuinoHud.textContent) taccuinoHud.textContent = taccuino;
  renderer.render(scene, camera);
});
