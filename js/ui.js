/**
 * @module ui
 * @description Renderizado del panel de resultados: veredictos, resultados
 * con trazabilidad expandible (ecuación → sustitución → resultado →
 * significado → fuente), panel "Propiedades y fuentes" y modal de validación.
 *
 * SOLID-S: solo transforma resultados del motor en DOM. Cero ingeniería.
 */

import { FLUID_PRESETS, PROPERTY_LABELS } from './data/fluids.js';

const $ = (id) => document.getElementById(id);
const fmt = (v, d = 2) =>
  typeof v !== 'number' ? String(v)
    : Math.abs(v) >= 100000 ? v.toLocaleString('es', { maximumFractionDigits: 0 })
    : Math.abs(v) >= 100 ? v.toFixed(1)
    : v.toFixed(Math.abs(v) < 0.01 ? 5 : d + 2 - 2 || 2);

/* ------------------------- Veredictos ------------------------- */
const VERDICT_LABELS = {
  tubeTurbulent: 'Régimen turbulento en tubos (Re > 10 000)',
  shellTurbulent: 'Régimen turbulento en coraza (Re > 10 000)',
  fAcceptable: 'Factor de corrección F > 0.75',
  tubeDpOk: 'ΔP tubos ≤ límite permitido',
  shellDpOk: 'ΔP coraza ≤ límite permitido',
  areaOk: 'Área instalada ≥ área requerida',
  baffleSpacingInRange: 'Espaciado de deflectores en 20–50 % de Ds',
  designAccepted: 'DISEÑO ACEPTADO',
};

export function renderVerdicts(verdicts) {
  $('verdicts').innerHTML = Object.entries(VERDICT_LABELS).map(([k, label]) => {
    const ok = verdicts[k];
    return `<div class="verdict ${ok ? 'ok' : 'bad'} fade-in">
      <span>${label}</span><span>${ok ? '✔ cumple' : '✘ no cumple'}</span></div>`;
  }).join('');
}

/* -------------------- Resultados + trazas -------------------- */
function resultRows(result) {
  const r = result;
  return [
    ['Carga térmica Q', r.duty.qBtuH, 'Btu/h'],
    ['Caudal fluido caliente W', r.duty.hotMassFlowLbH, 'lb/h'],
    ['Caudal fluido frío w', r.duty.coldMassFlowLbH, 'lb/h'],
    ['LMTD', r.thermal.lmtdF, '°F'],
    ['R / S', `${r.thermal.R.toFixed(4)} / ${r.thermal.S.toFixed(4)}`, '—'],
    ['Factor F', r.thermal.F, '—'],
    ['ΔTm verdadera', r.thermal.dTmF, '°F'],
    ['Número de tubos Nt', r.geometry.tubeCount, '—'],
    ['Área instalada A', r.geometry.installedAreaFt2, 'ft²'],
    ['Área de flujo tubos ap', r.tubeSide.flowAreaFt2, 'ft²'],
    ['Velocidad másica Gt', r.tubeSide.gt, 'lb/(h·ft²)'],
    ['Velocidad lineal vt', r.tubeSide.velocityFtS, 'ft/s'],
    ['Reynolds tubos Ret', r.tubeSide.re, '—'],
    ['hi', r.tubeSide.hi, 'Btu/(h·ft²·°F)'],
    ['hio', r.tubeSide.hio, 'Btu/(h·ft²·°F)'],
    ['Área de flujo coraza as', r.shellSide.flowAreaFt2, 'ft²'],
    ['Diámetro equivalente De', r.geometry.deFt, 'ft'],
    ['Velocidad másica Gs', r.shellSide.gs, 'lb/(h·ft²)'],
    ['Reynolds coraza Res', r.shellSide.re, '—'],
    ['ho', r.shellSide.ho, 'Btu/(h·ft²·°F)'],
    ['U limpio Uc', r.overall.ucBtuHFt2F, 'Btu/(h·ft²·°F)'],
    ['Rd combinado', r.overall.rdTotal, 'h·ft²·°F/Btu'],
    ['U diseño UD', r.overall.udBtuHFt2F, 'Btu/(h·ft²·°F)'],
    ['Área requerida Areq', r.overall.areaRequiredFt2, 'ft²'],
    ['Sobrediseño', r.overall.overdesignPct, '%'],
    ['f tubos (Fig. 26)', r.tubeSide.frictionFactor, 'ft²/in²'],
    ['ΔP tubos fricción', r.tubeSide.dpFrictionPsi, 'psi'],
    ['ΔP tubos retorno', r.tubeSide.dpReturnPsi, 'psi'],
    ['ΔP tubos TOTAL', r.tubeSide.dpTotalPsi, 'psi'],
    ['Cruces N+1', r.shellSide.crosses, '—'],
    ['f coraza (Fig. 29)', r.shellSide.frictionFactor, 'ft²/in²'],
    ['ΔP coraza TOTAL', r.shellSide.dpPsi, 'psi'],
  ];
}

/** Busca la traza cuyo nombre corresponde mejor a la fila (por palabra clave). */
function findTrace(traces, label) {
  const key = label.toLowerCase();
  return traces.find((t) => {
    const n = t.name.toLowerCase();
    if (key.includes('carga')) return n.includes('carga térmica');
    if (key.includes('lmtd')) return n.includes('lmtd');
    if (key.startsWith('r / s')) return n.includes('r y s');
    if (key.includes('factor f')) return n.includes('factor de corrección');
    if (key.includes('δtm')) return n.includes('verdadera');
    if (key.includes('instalada')) return n.includes('instalada');
    if (key.includes('flujo tubos')) return n.includes('flujo por tubos');
    if (key.includes('gt')) return n.includes('másica (tubos)');
    if (key.includes('lineal')) return n.includes('lineal');
    if (key.includes('ret')) return n.includes('reynolds (tubos)');
    if (key === 'hi') return n.includes('(tubos)') && n.includes('película');
    if (key === 'hio') return n.includes('externa') && n.includes('interno');
    if (key.includes('flujo coraza')) return n.includes('transversal de coraza');
    if (key.includes('equivalente')) return n.includes('equivalente');
    if (key.includes('gs')) return n.includes('másica (coraza)');
    if (key.includes('res')) return n.includes('reynolds (coraza)');
    if (key === 'ho') return n.includes('(coraza)') && n.includes('película');
    if (key.includes('u limpio')) return n.includes('limpio');
    if (key.includes('rd')) return n.includes('ensuciamiento combinada');
    if (key.includes('u diseño')) return n.includes('diseño (con ensuciamiento)');
    if (key.includes('requerida')) return n.includes('requerida');
    if (key.includes('fricción') && key.includes('tubos')) return n.includes('fricción (tubos)');
    if (key.includes('retorno')) return n.includes('retorno');
    if (key.includes('tubos total')) return n.includes('total (tubos)');
    if (key.includes('cruces')) return n.includes('cruces');
    if (key.includes('coraza total')) return n.includes('presión (coraza)');
    return false;
  });
}

export function renderResults(result) {
  const container = $('results');
  container.innerHTML = '';
  const rows = resultRows(result);
  rows.forEach(([label, value, units]) => {
    const row = document.createElement('div');
    row.className = 'res-row fade-in';
    row.innerHTML = `<span class="text-slate-400">${label}</span>
      <span class="res-val">${typeof value === 'number' ? fmt(value) : value} <span class="text-slate-500 font-normal">${units}</span></span>`;
    container.appendChild(row);

    const trace = findTrace(result.traces, label);
    if (trace) {
      const det = document.createElement('div');
      det.className = 'res-trace hidden';
      det.innerHTML = `
        <div class="text-slate-300 font-medium">${trace.name}</div>
        <code>Ecuación: ${trace.equation}</code>
        <code>Sustitución: ${trace.substitution}</code>
        <code>Resultado: ${typeof trace.result === 'object' ? JSON.stringify(trace.result) : fmt(trace.result)} ${trace.units}</code>
        <div class="mt-1">${trace.meaning}</div>
        <div class="text-slate-500 mt-1">Fuente: ${trace.source}</div>
        ${trace.note ? `<div class="text-amber-400/80 mt-1">${trace.note}</div>` : ''}`;
      container.appendChild(det);
      row.addEventListener('click', () => det.classList.toggle('hidden'));
    }
  });
}

/* ---------------- Propiedades y fuentes ---------------- */
export function renderProperties(input) {
  const blocks = [
    { title: `Fluido caliente — ${input.hotFluid.name}`, fluid: input.hotFluid, preset: input.hotPresetKey },
    { title: `Fluido frío — ${input.coldFluid.name}`, fluid: input.coldFluid, preset: input.coldPresetKey },
  ];
  $('properties').innerHTML = blocks.map(({ title, fluid, preset }) => {
    const meta = FLUID_PRESETS[preset] ?? FLUID_PRESETS.custom;
    const rows = Object.entries(PROPERTY_LABELS).map(([k, { name, symbol }]) => {
      const src = meta.sources[k];
      const val = fluid[k === 'viscosityCp' ? 'viscosityCp' : k];
      return `<tr><td>${name} (${symbol})</td><td>${val}</td><td>${src.units}</td></tr>
              <tr><td colspan="3" class="text-slate-500 !border-b-slate-800">↳ ${src.src}</td></tr>`;
    }).join('');
    return `<div class="prop-block">
      <div class="font-medium text-slate-300 mb-1">${title}</div>
      <div class="text-slate-500 mb-1">T ref: ${meta.refTemp} · P ref: ${meta.refPress}</div>
      <table class="vtable"><thead><tr><th>Propiedad</th><th>Valor</th><th>Unid.</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }).join('');
}

/* ---------------- Modal de validación ---------------- */
export function renderValidation({ passed, rows }) {
  const body = $('validate-body');
  body.innerHTML = `
    <p class="mb-2 ${passed ? 'text-emerald-400' : 'text-red-400'} font-semibold">
      ${passed ? '✔ El motor reproduce el trabajo escrito dentro de las tolerancias documentadas.' : '✘ Hay magnitudes fuera de tolerancia.'}
    </p>
    <table class="vtable">
      <thead><tr><th>Magnitud</th><th>Objetivo</th><th>Motor</th><th>Desv %</th><th>Estado</th></tr></thead>
      <tbody>${rows.map((r) => `
        <tr class="${r.ok ? '' : 'text-red-400'}">
          <td>${r.label}</td><td>${fmt(r.target)}</td><td>${fmt(r.actual)}</td>
          <td>${r.devPct.toFixed(2)}</td><td>${r.ok ? '✔' : '✘'}</td></tr>`).join('')}
      </tbody></table>
    <p class="text-slate-500 text-xs mt-2">Tolerancias y discrepancias justificadas en la Base de Conocimiento (§6–§7, incluidas §7.3, §7.7, §7.8 y §7.9).</p>`;
  $('modal-validate').classList.remove('hidden');
  if (window.gsap) window.gsap.from('#modal-validate .card', { y: 24, opacity: 0, duration: 0.35, ease: 'power2.out' });
}

export function showBaffleWarning(msg) {
  const el = $('baffle-warn');
  if (msg) { el.textContent = msg; el.classList.remove('hidden'); }
  else el.classList.add('hidden');
}
