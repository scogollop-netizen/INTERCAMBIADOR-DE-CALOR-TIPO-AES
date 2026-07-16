/**
 * @module events
 * @description Enlace formulario ↔ estado ↔ recálculo.
 *
 * SOLID-S: única responsabilidad = capturar entradas del usuario y construir
 * el objeto de entrada del motor. No renderiza resultados (ui.js) ni calcula
 * (services/). SOLID-D: recibe por inyección el callback `onCalculate` — no
 * conoce al orquestador.
 */

import { FLUID_PRESETS } from './data/fluids.js';
import { TUBE_DATA, findTubeCount } from './data/kernTables.js';
import { CRITERIA } from './utils/constants.js';
import { showBaffleWarning } from './ui.js';

const $ = (id) => document.getElementById(id);
const num = (id) => {
  const v = $(id).value.trim();
  return v === '' ? undefined : Number(v);
};

/* ---------- Caso de validación (fuente prioritaria) ---------- */
export const PRIORITY_CASE_FORM = Object.freeze({
  hot: { preset: 'gasolina', tin: 160, tout: 120, flow: '', dpmax: 7 },
  cold: { preset: 'kerosene', tin: 75, tout: 120, flow: 150000, dpmax: 10 },
  tubeSide: 'cold',
  geo: { od: '0.75', bwg: '16', len: 16, passes: '6', layout: 'triangular', pitch: 1, ds: 29, nt: 546, baffle: 9 },
  friction: { tube: 0.00023, shell: 0.00165 },
});

/* ---------- Poblado de selects dependientes ---------- */
function fillPresetSelect(sel) {
  sel.innerHTML = Object.entries(FLUID_PRESETS)
    .map(([k, p]) => `<option value="${k}">${p.label}</option>`).join('');
}

function fillBwgOptions() {
  const od = Number($('geo-od').value);
  const opts = TUBE_DATA.filter((t) => t.odIn === od)
    .map((t) => `<option value="${t.bwg}">${t.bwg}</option>`).join('');
  $('geo-bwg').innerHTML = opts;
}

function applyFluidPreset(side) {
  const key = $(`${side}-preset`).value;
  const d = FLUID_PRESETS[key].defaults;
  $(`${side}-cp`).value = d.cp; $(`${side}-mu`).value = d.viscosityCp;
  $(`${side}-k`).value = d.k; $(`${side}-sg`).value = d.sg;
  $(`${side}-pr`).value = d.pr; $(`${side}-rd`).value = d.foulingRd;
}

/** Sugiere Nt desde la Tabla 9 si la combinación existe. */
function suggestTubeCount() {
  const nt = findTubeCount({
    shellIdIn: Number($('geo-ds').value), tubeOdIn: Number($('geo-od').value),
    layout: $('geo-layout').value, pitchIn: Number($('geo-pitch').value),
    passes: Number($('geo-passes').value),
  });
  if (nt) $('geo-nt').value = nt;
}

function checkBaffleRule() {
  const b = Number($('geo-baffle').value), ds = Number($('geo-ds').value);
  if (!b || !ds) return showBaffleWarning('');
  const frac = b / ds;
  if (frac < CRITERIA.BAFFLE_SPACING_MIN_FRACTION || frac > CRITERIA.BAFFLE_SPACING_MAX_FRACTION) {
    showBaffleWarning(`Aviso: B/Ds = ${(frac * 100).toFixed(0)} % está fuera del rango pedagógico 20–50 % `
      + '(la norma TEMA RCB-4 define mínimos/máximos constructivos distintos — ver base de conocimiento §7.4).');
  } else showBaffleWarning('');
}

/* ---------- Construcción del objeto de entrada del motor ---------- */
export function readInput() {
  const fluid = (side, presetKeyId) => ({
    name: FLUID_PRESETS[$(presetKeyId).value].label.split(' (')[0],
    massFlowLbH: num(`${side}-flow`),
    tInF: num(`${side}-tin`), tOutF: num(`${side}-tout`),
    cp: num(`${side}-cp`), viscosityCp: num(`${side}-mu`), k: num(`${side}-k`),
    sg: num(`${side}-sg`), pr: num(`${side}-pr`),
    foulingRd: num(`${side}-rd`) ?? 0, maxDpPsi: num(`${side}-dpmax`),
  });

  return {
    hotFluid: fluid('hot', 'hot-preset'),
    coldFluid: fluid('cold', 'cold-preset'),
    hotPresetKey: $('hot-preset').value,
    coldPresetKey: $('cold-preset').value,
    tubeSide: $('tube-side').value,
    geometry: {
      tubeOdIn: Number($('geo-od').value), tubeBwg: Number($('geo-bwg').value),
      tubeLengthFt: num('geo-len'), layout: $('geo-layout').value,
      pitchIn: num('geo-pitch'), passes: Number($('geo-passes').value),
      shellIdIn: num('geo-ds'), tubeCount: num('geo-nt'),
      baffleSpacingIn: num('geo-baffle'),
    },
    frictionOverrides: { tube: num('f-tube'), shell: num('f-shell') },
    phi: { tube: 1, shell: 1 },
  };
}

/** Carga el caso de validación en el formulario. */
export function loadPriorityCase() {
  const C = PRIORITY_CASE_FORM;
  for (const side of ['hot', 'cold']) {
    $(`${side}-preset`).value = C[side].preset; applyFluidPreset(side);
    $(`${side}-tin`).value = C[side].tin; $(`${side}-tout`).value = C[side].tout;
    $(`${side}-flow`).value = C[side].flow; $(`${side}-dpmax`).value = C[side].dpmax;
  }
  $('tube-side').value = C.tubeSide;
  $('geo-od').value = C.geo.od; fillBwgOptions(); $('geo-bwg').value = C.geo.bwg;
  $('geo-len').value = C.geo.len; $('geo-passes').value = C.geo.passes;
  $('geo-layout').value = C.geo.layout; $('geo-pitch').value = C.geo.pitch;
  $('geo-ds').value = C.geo.ds; $('geo-nt').value = C.geo.nt;
  $('geo-baffle').value = C.geo.baffle;
  $('f-tube').value = C.friction.tube; $('f-shell').value = C.friction.shell;
  checkBaffleRule();
}

/**
 * Inicializa selects, presets y listeners.
 * @param {{onCalculate:Function, onValidate:Function,
 *          onViewFull:Function, onViewCut:Function,
 *          onToggle:(component:string, on:boolean)=>void}} handlers
 */
export function bindEvents(handlers) {
  fillPresetSelect($('hot-preset')); fillPresetSelect($('cold-preset'));
  fillBwgOptions();

  $('hot-preset').addEventListener('change', () => applyFluidPreset('hot'));
  $('cold-preset').addEventListener('change', () => applyFluidPreset('cold'));
  $('geo-od').addEventListener('change', () => { fillBwgOptions(); suggestTubeCount(); });
  ['geo-ds', 'geo-pitch', 'geo-layout', 'geo-passes'].forEach((id) =>
    $(id).addEventListener('change', suggestTubeCount));
  ['geo-baffle', 'geo-ds'].forEach((id) => $(id).addEventListener('input', checkBaffleRule));

  $('btn-calc').addEventListener('click', handlers.onCalculate);
  $('btn-validate').addEventListener('click', handlers.onValidate);
  $('btn-load-case').addEventListener('click', () => { loadPriorityCase(); handlers.onCalculate(); });
  $('modal-close').addEventListener('click', () => $('modal-validate').classList.add('hidden'));

  // Recalcular al presionar Enter en cualquier input
  document.getElementById('panel-inputs').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlers.onCalculate();
  });

  // Controles del modelo 3D
  const full = $('btn-view-full'), cut = $('btn-view-cut');
  full.addEventListener('click', () => { full.classList.add('active'); cut.classList.remove('active'); handlers.onViewFull(); });
  cut.addEventListener('click', () => { cut.classList.add('active'); full.classList.remove('active'); handlers.onViewCut(); });
  [['tgl-shell', 'shell'], ['tgl-tubes', 'tubes'], ['tgl-baffles', 'baffles'], ['tgl-flow', 'flow']]
    .forEach(([id, comp]) => $(id).addEventListener('change', (e) => handlers.onToggle(comp, e.target.checked)));
}
