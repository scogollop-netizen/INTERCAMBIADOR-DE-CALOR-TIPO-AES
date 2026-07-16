/**
 * @module graphics/charts
 * @description Gráficas dinámicas (Chart.js): perfil de temperatura,
 * caídas de presión vs límites, coeficientes h/U y comparación de áreas.
 *
 * SOLID-S: solo dibuja datos ya calculados; no hace ingeniería.
 * SOLID-D: recibe el árbol de resultados del motor por parámetro.
 * (Chart.js llega como global `Chart` desde el CDN — ver index.html.)
 *
 * Nota técnica: el perfil T(x) mostrado es el perfil característico del
 * arreglo (interpolación tipo LMTD entre las temperaturas terminales); es
 * ilustrativo de la evolución térmica, no una integración diferencial.
 */

let charts = {};

const baseOpts = {
  responsive: true,
  plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 10 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
  },
};

function make(id, cfg) {
  charts[id]?.destroy();
  charts[id] = new Chart(document.getElementById(id), cfg);
}

/** Perfil de temperatura vs longitud (contracorriente equivalente). */
function tempProfile(result, input) {
  const N = 21;
  const xs = Array.from({ length: N }, (_, i) => +(i / (N - 1) * input.geometry.tubeLengthFt).toFixed(1));
  const { hotFluid: h, coldFluid: c } = input;
  // Perfiles exponenciales característicos entre terminales (ilustrativos)
  const exp = (t0, t1, i) => t0 + (t1 - t0) * (1 - Math.exp(-2.2 * i / (N - 1))) / (1 - Math.exp(-2.2));
  const hot = xs.map((_, i) => exp(h.tInF, h.tOutF, i));
  const cold = xs.map((_, i) => exp(c.tOutF, c.tInF, i)); // contracorriente: frío entra por el extremo opuesto
  make('chart-temp', {
    type: 'line',
    data: {
      labels: xs,
      datasets: [
        { label: `${h.name} (caliente)`, data: hot, borderColor: '#f97316', backgroundColor: '#f9731633', tension: 0.35, pointRadius: 0, fill: false },
        { label: `${c.name} (frío)`, data: cold, borderColor: '#38bdf8', backgroundColor: '#38bdf833', tension: 0.35, pointRadius: 0, fill: false },
      ],
    },
    options: { ...baseOpts, scales: { ...baseOpts.scales, x: { ...baseOpts.scales.x, title: { display: true, text: 'Longitud (ft)', color: '#64748b' } }, y: { ...baseOpts.scales.y, title: { display: true, text: '°F', color: '#64748b' } } } },
  });
}

/** ΔP calculadas vs límites permitidos. */
function dpChart(result, input) {
  const tubeF = input.tubeSide === 'cold' ? input.coldFluid : input.hotFluid;
  const shellF = input.tubeSide === 'cold' ? input.hotFluid : input.coldFluid;
  make('chart-dp', {
    type: 'bar',
    data: {
      labels: [`Tubos (${tubeF.name})`, `Coraza (${shellF.name})`],
      datasets: [
        { label: 'ΔP calculada (psi)', data: [result.tubeSide.dpTotalPsi, result.shellSide.dpPsi], backgroundColor: ['#38bdf8', '#f97316'] },
        { label: 'ΔP máxima (psi)', data: [tubeF.maxDpPsi ?? null, shellF.maxDpPsi ?? null], backgroundColor: '#47556966', borderColor: '#94a3b8', borderWidth: 1 },
      ],
    },
    options: baseOpts,
  });
}

/** Coeficientes h y U (limpio vs diseño). */
function uChart(result) {
  make('chart-u', {
    type: 'bar',
    data: {
      labels: ['hio (tubos→ext)', 'ho (coraza)', 'Uc (limpio)', 'UD (diseño)'],
      datasets: [{
        label: 'Btu/(h·ft²·°F)',
        data: [result.tubeSide.hio, result.shellSide.ho, result.overall.ucBtuHFt2F, result.overall.udBtuHFt2F],
        backgroundColor: ['#38bdf8', '#f97316', '#a78bfa', '#34d399'],
      }],
    },
    options: baseOpts,
  });
}

/** Área instalada vs requerida (sobrediseño). */
function areaChart(result) {
  make('chart-area', {
    type: 'bar',
    data: {
      labels: ['Área requerida', 'Área instalada'],
      datasets: [{
        label: 'ft²',
        data: [result.overall.areaRequiredFt2, result.geometry.installedAreaFt2],
        backgroundColor: ['#facc15', '#34d399'],
      }],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        subtitle: {
          display: true, color: '#94a3b8',
          text: `Sobrediseño: ${result.overall.overdesignPct.toFixed(1)} %`,
        },
      },
    },
  });
}

/** Punto de entrada: redibuja todas las gráficas. */
export function renderCharts(result, input) {
  tempProfile(result, input);
  dpChart(result, input);
  uChart(result);
  areaChart(result);
}
