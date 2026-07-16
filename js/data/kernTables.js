/**
 * @module data/kernTables
 * @description Datos de catálogo digitalizados de Kern (Tablas 9, 10 y 8/12).
 *
 * SOLID-S: única responsabilidad = proveer DATOS de catálogo (sin lógica de
 * cálculo). SOLID-O: agregar tubos, corazas o servicios nuevos = agregar
 * filas, sin tocar ningún módulo de physics/.
 *
 * Trazabilidad:
 *  - TUBE_DATA: Tabla 10 del Apéndice de Kern (extracto verificado contra el
 *    escaneo original — Base de conocimiento, Anexo A).
 *  - TUBE_COUNT: Tabla 9 de Kern. El ancla (Ds=29", 3/4" tri 1", 6 pasos →
 *    546 tubos) proviene de la fuente prioritaria (Sección 6.5) y es el dato
 *    de validación. La tabla es extensible (Anexo B de la base de conocimiento).
 *  - FOULING_DEFAULTS: Tabla 12 de Kern / fuente prioritaria §6.8.
 *  - TYPICAL_U: Tabla 8 de Kern (valores orientativos para el U inicial).
 */

/**
 * @typedef {Object} TubeSpec
 * @property {number} odIn        Diámetro externo [in]
 * @property {number} bwg         Calibre BWG
 * @property {number} idIn        Diámetro interno [in]  (Tabla 10)
 * @property {number} flowAreaIn2 Área de flujo por tubo a't [in²] (Tabla 10)
 * @property {number} extSurfFt2PerFt Superficie externa a'' [ft²/ft] (Tabla 10)
 */

/** @type {TubeSpec[]} Tabla 10 (extracto: tubos 3/4" y 1"). */
export const TUBE_DATA = Object.freeze([
  // --- 3/4 in DE (a'' = 0.1963 ft²/ft) ---
  { odIn: 0.75, bwg: 10, idIn: 0.482, flowAreaIn2: 0.182, extSurfFt2PerFt: 0.1963 },
  { odIn: 0.75, bwg: 12, idIn: 0.532, flowAreaIn2: 0.223, extSurfFt2PerFt: 0.1963 },
  { odIn: 0.75, bwg: 14, idIn: 0.584, flowAreaIn2: 0.268, extSurfFt2PerFt: 0.1963 },
  { odIn: 0.75, bwg: 16, idIn: 0.620, flowAreaIn2: 0.302, extSurfFt2PerFt: 0.1963 }, // ← usado por la fuente prioritaria
  { odIn: 0.75, bwg: 18, idIn: 0.652, flowAreaIn2: 0.334, extSurfFt2PerFt: 0.1963 },
  // --- 1 in DE (a'' = 0.2618 ft²/ft) ---
  { odIn: 1.0, bwg: 13, idIn: 0.810, flowAreaIn2: 0.515, extSurfFt2PerFt: 0.2618 },
  { odIn: 1.0, bwg: 14, idIn: 0.834, flowAreaIn2: 0.546, extSurfFt2PerFt: 0.2618 },
  { odIn: 1.0, bwg: 16, idIn: 0.870, flowAreaIn2: 0.594, extSurfFt2PerFt: 0.2618 },
]);

/** Busca la ficha de tubo por (DE, BWG). @returns {TubeSpec|undefined} */
export function findTube(odIn, bwg) {
  return TUBE_DATA.find((t) => t.odIn === odIn && t.bwg === bwg);
}

/**
 * @typedef {Object} TubeCountEntry
 * @property {number} shellIdIn  Diámetro interno de coraza [in]
 * @property {number} tubeOdIn   DE de tubo [in]
 * @property {('triangular'|'square')} layout
 * @property {number} pitchIn    Paso Pt [in]
 * @property {Object<number, number>} countByPasses  {nPasos: Nt}
 * @property {string} source     Trazabilidad del dato
 */

/** @type {TubeCountEntry[]} Tabla 9 (anclas verificadas; extensible). */
export const TUBE_COUNT = Object.freeze([
  {
    shellIdIn: 29, tubeOdIn: 0.75, layout: 'triangular', pitchIn: 1.0,
    countByPasses: { 6: 546 },
    source: 'Fuente prioritaria §6.5 (Tabla 9 de Kern, Ds=29", 6 pasos)',
  },
  {
    shellIdIn: 21.25, tubeOdIn: 1.0, layout: 'square', pitchIn: 1.25,
    countByPasses: { 4: 158 },
    source: 'Kern, Ejemplo 7.3 (Ds=21¼", 4 pasos)',
  },
]);

/** Busca Nt en la Tabla 9. @returns {number|undefined} */
export function findTubeCount({ shellIdIn, tubeOdIn, layout, pitchIn, passes }) {
  const row = TUBE_COUNT.find(
    (e) => e.shellIdIn === shellIdIn && e.tubeOdIn === tubeOdIn &&
           e.layout === layout && e.pitchIn === pitchIn,
  );
  return row ? row.countByPasses[passes] : undefined;
}

/** Factores de ensuciamiento por defecto [h·ft²·°F/Btu] (Tabla 12 de Kern;
 *  valor de la fuente prioritaria para fracciones ligeras de refinería). */
export const FOULING_DEFAULTS = Object.freeze({
  gasolina: 0.001,
  kerosene: 0.001,
  aguaTratada: 0.001,
  organicoLigero: 0.001,
});

/** Rangos típicos de U de diseño [Btu/(h·ft²·°F)] (Tabla 8 de Kern) —
 *  solo orientativos para el arranque del dimensionamiento. */
export const TYPICAL_U = Object.freeze([
  { hot: 'org. ligero', cold: 'org. ligero', min: 40, max: 75 },
  { hot: 'org. medio', cold: 'org. medio', min: 20, max: 60 },
  { hot: 'agua', cold: 'agua', min: 250, max: 500 },
  { hot: 'org. ligero (gasolina)', cold: 'org. medio (kerosene)', min: 25, max: 60,
    note: 'La fuente prioritaria asume U_D=25 (§6.3)' },
]);
