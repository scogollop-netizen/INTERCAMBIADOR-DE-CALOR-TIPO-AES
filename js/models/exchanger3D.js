/**
 * @module models/exchanger3D
 * @description Modelo 3D interactivo del intercambiador TEMA AES (Three.js).
 *
 * SOLID-S: única responsabilidad = representación tridimensional. No calcula
 * nada de ingeniería: recibe geometría + resultados ya resueltos y los dibuja.
 * SOLID-D: expone una API pequeña (init/update/setCutaway/setVisibility) —
 * la app depende de esta interfaz, no de Three.js.
 *
 * Representación ESQUEMÁTICA: 1 unidad = 10 in de diámetro; la longitud se
 * comprime (factor propio) para que el equipo quepa en pantalla. Los conteos
 * de tubos y deflectores, el arreglo (triangular/cuadrado), el paso y el
 * corte de deflector al 25 % sí son fieles a la geometría de cálculo.
 *
 * Componentes TEMA representados (Tabla N-2): carcasa (8), tubos (7),
 * deflectores segmentados (28), carrete tipo A con tapa (1,4), cabezal
 * flotante tipo S (15,16), boquillas de coraza y de carrete (5,12).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------- estado interno del módulo ---------- */
let renderer, scene, camera, controls, clock;
let groups = {};           // shell, tubes, baffles, heads, nozzles, flow
let clipPlane;             // corte longitudinal
let flowState = { tubeParticles: null, shellParticles: null, tubePath: [], shellPath: [], on: true };
let currentGeom = null;

const COLORS = {
  shell: 0x64748b, head: 0x475569, tube: 0xb45309, baffle: 0x334155,
  nozzleHot: 0xf97316, nozzleCold: 0x38bdf8,
};
const IN_TO_U = 1 / 10;        // 10 in = 1 unidad (diámetros)
const LEN_COMPRESS = 0.35;     // compresión visual de longitud

/* =================================================================== */
/*  API PÚBLICA                                                         */
/* =================================================================== */

/** Inicializa la escena dentro del contenedor. */
export function init(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(9, 5, 11);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x93c5fd, 0.5); rim.position.set(-8, -4, -6); scene.add(rim);

  clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6); // desactivado
  clock = new THREE.Clock();

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight || 420;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container); resize();

  renderer.setAnimationLoop(tick);
}

/**
 * (Re)construye el intercambiador a partir de la geometría de cálculo y los
 * resultados térmicos (para colorear los gradientes de temperatura).
 * @param {Object} geometry  {shellIdIn, tubeOdIn, pitchIn, layout, passes,
 *                            tubeCount, tubeLengthFt, baffleSpacingIn}
 * @param {Object} thermal   {hotInF, hotOutF, coldInF, coldOutF, tubeSide}
 */
export function update(geometry, thermal) {
  currentGeom = { geometry, thermal };
  disposeGroups();

  const R = (geometry.shellIdIn / 2) * IN_TO_U;
  const L = geometry.tubeLengthFt * 12 * IN_TO_U * LEN_COMPRESS;

  groups.shell = buildShell(R, L);
  groups.heads = buildHeads(R, L);
  groups.nozzles = buildNozzles(R, L, thermal.tubeSide);
  groups.tubes = buildTubes(geometry, R, L);
  groups.baffles = buildBaffles(geometry, R, L);
  groups.flow = buildFlow(geometry, thermal, R, L);

  Object.values(groups).forEach((g) => scene.add(g));
  controls.target.set(0, 0, 0);
}

/** Corte longitudinal animado (GSAP). */
export function setCutaway(on) {
  const target = on ? 0.02 : 1e6;
  if (window.gsap) {
    window.gsap.to(clipPlane, { constant: target, duration: 0.9, ease: 'power2.inOut' });
  } else clipPlane.constant = target;
}

/** Visibilidad por componente: 'shell'|'tubes'|'baffles'|'flow'. */
export function setVisibility(component, visible) {
  if (component === 'flow') { flowState.on = visible; if (groups.flow) groups.flow.visible = visible; return; }
  const map = { shell: ['shell', 'heads', 'nozzles'], tubes: ['tubes'], baffles: ['baffles'] };
  (map[component] || []).forEach((k) => { if (groups[k]) groups[k].visible = visible; });
}

/* =================================================================== */
/*  CONSTRUCCIÓN DE COMPONENTES                                         */
/* =================================================================== */

function clippedMat(opts) {
  return new THREE.MeshStandardMaterial({
    ...opts, clippingPlanes: [clipPlane], side: THREE.DoubleSide,
  });
}

function buildShell(R, L) {
  const g = new THREE.Group();
  const mat = clippedMat({ color: COLORS.shell, metalness: 0.75, roughness: 0.35, transparent: true, opacity: 0.92 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 48, 1, true), mat);
  shell.rotation.z = Math.PI / 2; g.add(shell);
  // bridas de coraza (10, 11 en Tabla N-2)
  const flangeMat = clippedMat({ color: COLORS.head, metalness: 0.8, roughness: 0.4 });
  [-L / 2, L / 2].forEach((x) => {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, 0.12, 48), flangeMat);
    f.rotation.z = Math.PI / 2; f.position.x = x; g.add(f);
  });
  return g;
}

function buildHeads(R, L) {
  const g = new THREE.Group();
  const mat = clippedMat({ color: COLORS.head, metalness: 0.8, roughness: 0.4 });
  // Carrete "A" (cilindro corto + tapa plana removible) — frente (x negativo)
  const channel = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, R * 0.9, 48), mat);
  channel.rotation.z = Math.PI / 2; channel.position.x = -L / 2 - R * 0.45; g.add(channel);
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.1, R * 1.1, 0.1, 48), mat);
  cover.rotation.z = Math.PI / 2; cover.position.x = -L / 2 - R * 0.95; g.add(cover);
  // Cabezal flotante "S" (casquete + carcasa de cabezal) — atrás (x positivo)
  const bonnet = new THREE.Mesh(new THREE.SphereGeometry(R * 0.95, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  bonnet.rotation.z = -Math.PI / 2; bonnet.position.x = L / 2 + R * 0.25; g.add(bonnet);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.8, 0.05, 12, 40), clippedMat({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 }));
  ring.rotation.y = Math.PI / 2; ring.position.x = L / 2 + 0.08; g.add(ring); // anillo partido (18)
  return g;
}

function buildNozzles(R, L, tubeSide) {
  const g = new THREE.Group();
  const hotC = tubeSide === 'hot' ? COLORS.nozzleHot : COLORS.nozzleHot;
  const mk = (x, y, color) => {
    const n = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.18, R * 0.18, R * 0.55, 20),
      new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 }));
    n.position.set(x, y > 0 ? R + R * 0.27 : -R - R * 0.27, 0);
    g.add(n);
  };
  // Boquillas de coraza (fluido de coraza): entrada arriba-izquierda, salida abajo-derecha
  const shellColor = tubeSide === 'cold' ? COLORS.nozzleHot : COLORS.nozzleCold;
  mk(-L / 2 + R * 0.5, 1, shellColor); mk(L / 2 - R * 0.5, -1, shellColor);
  // Boquillas del carrete (fluido de tubos)
  const tubeColor = tubeSide === 'cold' ? COLORS.nozzleCold : COLORS.nozzleHot;
  const nz = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.18, R * 0.18, R * 0.55, 20),
    new THREE.MeshStandardMaterial({ color: tubeColor, metalness: 0.7, roughness: 0.4 }));
  nz.position.set(-L / 2 - R * 0.45, R * 1.25, 0); g.add(nz);
  const nz2 = nz.clone(); nz2.position.y = -R * 1.25; g.add(nz2);
  return g;
}

/** Posiciones (y,z) de tubos según arreglo y paso reales, dentro del haz. */
function tubeLayoutPositions({ pitchIn, tubeOdIn, layout, tubeCount }, R) {
  const p = pitchIn * IN_TO_U, rMax = R - tubeOdIn * IN_TO_U * 1.5;
  const pts = [];
  const rows = Math.ceil((2 * rMax) / (layout === 'triangular' ? p * Math.sqrt(3) / 2 : p)) + 2;
  for (let i = -rows; i <= rows; i++) {
    const y = layout === 'triangular' ? i * p * Math.sqrt(3) / 2 : i * p;
    const xOff = layout === 'triangular' && Math.abs(i) % 2 === 1 ? p / 2 : 0;
    for (let j = -rows; j <= rows; j++) {
      const z = j * p + xOff;
      if (Math.hypot(y, z) <= rMax) pts.push([y, z]);
    }
  }
  // ordenar del centro hacia afuera y tomar hasta Nt (fiel al conteo real)
  pts.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  return pts.slice(0, Math.min(tubeCount, pts.length));
}

function buildTubes(geom, R, L) {
  const g = new THREE.Group();
  const positions = tubeLayoutPositions(geom, R);
  const rTube = Math.max(geom.tubeOdIn * IN_TO_U * 0.5, 0.02);
  const geo = new THREE.CylinderGeometry(rTube, rTube, L * 0.98, 8);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: COLORS.tube, metalness: 0.85, roughness: 0.35 });
  const inst = new THREE.InstancedMesh(geo, mat, positions.length);
  const m = new THREE.Matrix4();
  positions.forEach(([y, z], i) => { m.setPosition(0, y, z); inst.setMatrixAt(i, m); });
  g.add(inst);
  g.userData.positions = positions;
  return g;
}

/** Deflector segmentado al 25 % (Shape circular con cuerda recortada). */
function buildBaffles(geom, R, L) {
  const g = new THREE.Group();
  const n = Math.max(1, Math.round((12 * geom.tubeLengthFt) / geom.baffleSpacingIn) - 1); // N deflectores
  const cut = 0.25; // corte 25 % (condición de las cartas de Kern)
  const chordY = R * (1 - 2 * cut); // altura de la cuerda de corte
  const mat = new THREE.MeshStandardMaterial({
    color: COLORS.baffle, metalness: 0.4, roughness: 0.7, side: THREE.DoubleSide,
  });
  const geoTop = new THREE.ExtrudeGeometry(makeSegmentShape(R * 0.97, chordY, 'bottom'), { depth: 0.06, bevelEnabled: false });
  const geoBot = new THREE.ExtrudeGeometry(makeSegmentShape(R * 0.97, -chordY, 'top'), { depth: 0.06, bevelEnabled: false });
  const nVisible = Math.min(n, 40);
  for (let i = 1; i <= nVisible; i++) {
    const x = -L / 2 + (L * i) / (nVisible + 1);
    const geoUse = i % 2 === 1 ? geoTop : geoBot; // corte alternado arriba/abajo
    const b = new THREE.Mesh(geoUse, mat);
    b.rotation.y = Math.PI / 2; b.position.x = x; g.add(b);
  }
  g.userData.baffleXs = Array.from({ length: nVisible }, (_, i) => -L / 2 + (L * (i + 1)) / (nVisible + 1));
  return g;
}

/** Disco con un segmento recortado: 'bottom' = conserva parte inferior…  */
function makeSegmentShape(R, chordY, keep) {
  const s = new THREE.Shape();
  const a = Math.asin(THREE.MathUtils.clamp(chordY / R, -1, 1));
  if (keep === 'bottom') { // recorta el casquete superior (ventana arriba)
    s.absarc(0, 0, R, Math.PI - a, Math.PI * 2 + a, false);
    s.lineTo(R * Math.cos(a), chordY);
  } else {                 // recorta el casquete inferior (ventana abajo)
    s.absarc(0, 0, R, a, Math.PI - a, false);
    s.lineTo(-R * Math.cos(a), chordY);
  }
  s.closePath();
  return s;
}

/* ---------- FLUJO ANIMADO (partículas con gradiente térmico) ---------- */

const lerpColor = (c1, c2, t) => new THREE.Color(c1).lerp(new THREE.Color(c2), t);

function buildFlow(geom, thermal, R, L) {
  const g = new THREE.Group();
  const tubeIsCold = thermal.tubeSide === 'cold';
  // Colores: caliente 160→120 (naranja→amarillo pálido); frío 75→120 (azul→naranja suave)
  const tubeC0 = tubeIsCold ? 0x38bdf8 : 0xf97316;
  const tubeC1 = tubeIsCold ? 0xfb923c : 0xfde047;
  const shellC0 = tubeIsCold ? 0xf97316 : 0x38bdf8;
  const shellC1 = tubeIsCold ? 0xfde047 : 0xfb923c;

  /* Trayectoria lado tubos: n pasos en serpentín por sectores del haz */
  const n = geom.passes;
  const path = [];
  for (let p = 0; p < n; p++) {
    const y = -R * 0.6 + (R * 1.2 * p) / Math.max(1, n - 1 || 1);
    const x0 = p % 2 === 0 ? -L / 2 : L / 2, x1 = -x0;
    path.push({ x0, x1, y, z: 0.0 });
  }
  flowState.tubePath = path;

  const NP_T = 140;
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP_T * 3), 3));
  tGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NP_T * 3), 3));
  const tPts = new THREE.Points(tGeo, new THREE.PointsMaterial({ size: 0.14, vertexColors: true }));
  tPts.userData = { count: NP_T, kind: 'tube', c0: tubeC0, c1: tubeC1, seeds: rand(NP_T) };
  g.add(tPts); flowState.tubeParticles = tPts;

  /* Trayectoria lado coraza: zigzag entre deflectores */
  const NB = Math.max(2, Math.min(40, Math.round((12 * geom.tubeLengthFt) / geom.baffleSpacingIn)));
  flowState.shellPath = { L, R, NB };
  const NP_S = 160;
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP_S * 3), 3));
  sGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NP_S * 3), 3));
  const sPts = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true }));
  sPts.userData = { count: NP_S, kind: 'shell', c0: shellC0, c1: shellC1, seeds: rand(NP_S) };
  g.add(sPts); flowState.shellParticles = sPts;

  return g;
}

const rand = (n) => Float32Array.from({ length: n }, () => Math.random());

function tick() {
  controls.update();
  if (flowState.on && currentGeom) animateFlow(clock.getElapsedTime());
  renderer.render(scene, camera);
}

function animateFlow(time) {
  const { tubeParticles: tp, shellParticles: sp, tubePath, shellPath } = flowState;
  if (tp) {
    const { count, seeds, c0, c1 } = tp.userData;
    const pos = tp.geometry.attributes.position, col = tp.geometry.attributes.color;
    const nSeg = tubePath.length;
    for (let i = 0; i < count; i++) {
      const t = (time * 0.12 + seeds[i]) % 1;           // avance global 0..1
      const seg = Math.min(nSeg - 1, Math.floor(t * nSeg));
      const tl = t * nSeg - seg;                        // avance dentro del paso
      const s = tubePath[seg];
      const x = s.x0 + (s.x1 - s.x0) * tl;
      const jitter = (seeds[(i * 7) % count] - 0.5) * 0.25;
      pos.setXYZ(i, x, s.y + jitter, s.z + (seeds[(i * 13) % count] - 0.5) * 0.6);
      const c = lerpColor(c0, c1, t);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
  }
  if (sp) {
    const { count, seeds, c0, c1 } = sp.userData;
    const { L, R, NB } = shellPath;
    const pos = sp.geometry.attributes.position, col = sp.geometry.attributes.color;
    for (let i = 0; i < count; i++) {
      const t = (time * 0.08 + seeds[i]) % 1;
      const x = -L / 2 + L * t;
      const seg = Math.floor(t * NB);
      const phase = t * NB - seg;                       // 0..1 dentro del compartimiento
      const dir = seg % 2 === 0 ? 1 : -1;               // zigzag por ventanas alternadas
      const y = dir * R * 0.55 * Math.cos(phase * Math.PI);
      pos.setXYZ(i, x, y + (seeds[(i * 5) % count] - 0.5) * 0.2, (seeds[(i * 11) % count] - 0.5) * R * 1.2);
      const c = lerpColor(c0, c1, t);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
  }
}

function disposeGroups() {
  Object.values(groups).forEach((g) => {
    if (!g) return;
    scene.remove(g);
    g.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  });
  groups = {};
}
