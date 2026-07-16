/**
 * @module services/validationService
 * @description Validación del motor contra la fuente prioritaria
 * (caso gasolina–kerosene). Contiene el caso de validación canónico y los
 * valores objetivo con las tolerancias justificadas en la Sección 6 de la
 * base de conocimiento (Base_Conocimiento_Simulador_TEMA_AES.md).
 *
 * SOLID-S: única responsabilidad = definir el caso de validación y comparar.
 */

import { runKernDesign } from './calculationsService.js';

/** Caso canónico de validación (entradas exactas de la fuente prioritaria,
 *  Secciones 3.1 y 6). Los overrides de fricción reproducen las lecturas
 *  gráficas del trabajo (Figs. 26 y 29 de Kern). */
export const VALIDATION_CASE = Object.freeze({
  hotFluid: {
    name: 'Gasolina', tInF: 160, tOutF: 120, cp: 0.55,
    viscosityCp: 0.45, k: 0.087, sg: 0.74, pr: 6.88,
    foulingRd: 0.001, maxDpPsi: 7,
  },
  coldFluid: {
    name: 'Kerosene', massFlowLbH: 150000, tInF: 75, tOutF: 120, cp: 0.48,
    viscosityCp: 1.50, k: 0.081, sg: 0.82, pr: 21.5,
    foulingRd: 0.001, maxDpPsi: 10,
  },
  tubeSide: 'cold', // kerosene por tubos (fuente prioritaria §6.1)
  geometry: {
    tubeOdIn: 0.75, tubeBwg: 16, tubeLengthFt: 16,
    layout: 'triangular', pitchIn: 1.0, passes: 6,
    shellIdIn: 29, baffleSpacingIn: 9,
  },
  frictionOverrides: { tube: 0.00023, shell: 0.00165 }, // lecturas Figs. 26/29
  phi: { tube: 1, shell: 1 },
});

/** Valores objetivo (fuente prioritaria) + tolerancias (base de conocimiento §6). */
export const EXPECTED = Object.freeze([
  { path: 'duty.qBtuH',                 target: 3240000,  tolPct: 0.1, label: 'Q [Btu/h]' },
  { path: 'duty.hotMassFlowLbH',        target: 147273,   tolPct: 0.1, label: 'W gasolina [lb/h]' },
  { path: 'thermal.lmtdF',              target: 42.44,    tolPct: 0.1, label: 'LMTD [°F]' },
  { path: 'thermal.R',                  target: 0.8889,   tolPct: 0.1, label: 'R' },
  { path: 'thermal.S',                  target: 0.5294,   tolPct: 0.1, label: 'S' },
  { path: 'thermal.F',                  target: 0.8045,   tolPct: 0.4, label: 'F (§7.9)' },
  { path: 'thermal.dTmF',               target: 34.14,    tolPct: 0.4, label: 'ΔTm [°F] (§7.9)' },
  { path: 'geometry.installedAreaFt2',  target: 1714.5,   tolPct: 0.1, label: 'A real [ft²]' },
  { path: 'tubeSide.flowAreaFt2',       target: 0.1908,   tolPct: 0.5, label: 'ap [ft²]' },
  { path: 'tubeSide.gt',                target: 786163.5, tolPct: 0.5, label: 'Gt [lb/h·ft²]' },
  { path: 'tubeSide.velocityFtS',       target: 4.267,    tolPct: 0.5, label: 'vt [ft/s]' },
  { path: 'tubeSide.re',                target: 11190,    tolPct: 0.5, label: 'Ret' },
  { path: 'tubeSide.hi',                target: 203.0,    tolPct: 1.5, label: 'hi [Btu/h·ft²·°F]' },
  { path: 'tubeSide.hio',               target: 167.8,    tolPct: 1.5, label: 'hio [Btu/h·ft²·°F]' },
  { path: 'shellSide.flowAreaFt2',      target: 0.4531,   tolPct: 0.5, label: 'as [ft²]' },
  { path: 'geometry.deFt',              target: 0.06,     tolPct: 3.0, label: 'De [ft]' },
  { path: 'shellSide.gs',               target: 325034,   tolPct: 0.5, label: 'Gs [lb/h·ft²]' },
  { path: 'shellSide.re',               target: 17908,    tolPct: 3.0, label: 'Res' },
  { path: 'shellSide.ho',               target: 204.1,    tolPct: 7.0, label: 'ho [Btu/h·ft²·°F] (§7.8)' },
  { path: 'overall.ucBtuHFt2F',         target: 92.09,    tolPct: 7.0, label: 'Uc [Btu/h·ft²·°F]' },
  { path: 'overall.udBtuHFt2F',         target: 77.76,    tolPct: 7.0, label: 'UD [Btu/h·ft²·°F]' },
  { path: 'overall.areaRequiredFt2',    target: 1220.4,   tolPct: 7.0, label: 'Areq [ft²]' },
  { path: 'overall.overdesignPct',      target: 40.5,     tolAbs: 6.0, label: '% sobrediseño' },
  { path: 'tubeSide.dpFrictionPsi',     target: 6.17,     tolPct: 2.0, label: 'ΔPt fricción [psi]' },
  { path: 'tubeSide.dpReturnPsi',       target: 2.41,     tolPct: 2.0, label: 'ΔPt retorno [psi]' },
  { path: 'tubeSide.dpTotalPsi',        target: 8.58,     tolPct: 2.0, label: 'ΔPt total [psi] (§7.3)' },
  { path: 'shellSide.crosses',          target: 21.33,    tolPct: 0.5, label: 'N+1' },
  // §7.7: la fórmula correcta (Ds en ft) da ≈3.9; el trabajo reporta 4.80.
  { path: 'shellSide.dpPsi',            target: 4.80,     tolAbs: 1.0, label: 'ΔPs [psi] (§7.7)' },
]);

const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

/**
 * Ejecuta el caso canónico y compara contra los objetivos.
 * @returns {{passed:boolean, rows:Array, result:Object}}
 */
export function validateAgainstPriorityWork() {
  const result = runKernDesign(structuredClone
    ? structuredClone(VALIDATION_CASE)
    : JSON.parse(JSON.stringify(VALIDATION_CASE)));

  const rows = EXPECTED.map((e) => {
    const actual = getPath(result, e.path);
    const dev = actual - e.target;
    const devPct = (dev / e.target) * 100;
    const ok = e.tolAbs != null
      ? Math.abs(dev) <= e.tolAbs
      : Math.abs(devPct) <= e.tolPct;
    return { label: e.label, target: e.target, actual, devPct, ok };
  });

  const verdictsOk = result.verdicts.designAccepted === true;
  return { passed: rows.every((r) => r.ok) && verdictsOk, rows, result };
}
