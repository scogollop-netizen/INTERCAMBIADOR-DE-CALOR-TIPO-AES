/**
 * @module app
 * @description Punto de entrada — "composition root" de la aplicación.
 *
 * SOLID-D: aquí (y solo aquí) se conectan las implementaciones concretas:
 * motor de cálculo, UI, gráficas, modelo 3D y eventos. Ningún otro módulo
 * conoce a los demás; todos se comunican a través de este compositor.
 */

import { runKernDesign } from './services/calculationsService.js';
import { validateAgainstPriorityWork } from './services/validationService.js';
import { renderResults, renderVerdicts, renderProperties, renderValidation } from './ui.js';
import { renderCharts } from './graphics/charts.js';
import * as exchanger3D from './models/exchanger3D.js';
import { bindEvents, readInput, loadPriorityCase } from './events.js';

/* ---------- Cálculo + refresco de toda la aplicación ---------- */
function calculate() {
  let input;
  try {
    input = readInput();
    const result = runKernDesign(structuredClone(input));

    renderVerdicts(result.verdicts);
    renderResults(result);
    renderProperties(input);
    renderCharts(result, input);

    exchanger3D.update(
      { ...input.geometry, tubeCount: result.geometry.tubeCount },
      {
        hotInF: input.hotFluid.tInF, hotOutF: input.hotFluid.tOutF,
        coldInF: input.coldFluid.tInF, coldOutF: input.coldFluid.tOutF,
        tubeSide: input.tubeSide,
      },
    );

    if (window.gsap) {
      window.gsap.from('#results .res-row', { opacity: 0, y: 6, stagger: 0.008, duration: 0.25, ease: 'power1.out' });
    }
  } catch (err) {
    document.getElementById('verdicts').innerHTML =
      `<div class="verdict bad">Error de entrada: ${err.message}</div>`;
    console.error(err);
  }
}

/* ---------- Arranque ---------- */
exchanger3D.init(document.getElementById('viewport'));

bindEvents({
  onCalculate: calculate,
  onValidate: () => renderValidation(validateAgainstPriorityWork()),
  onViewFull: () => exchanger3D.setCutaway(false),
  onViewCut: () => exchanger3D.setCutaway(true),
  onToggle: (component, on) => exchanger3D.setVisibility(component, on),
});

// Estado inicial: el caso de validación (gasolina–kerosene) ya calculado.
loadPriorityCase();
calculate();
