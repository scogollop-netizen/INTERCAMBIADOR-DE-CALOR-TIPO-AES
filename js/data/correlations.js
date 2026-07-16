/**
 * @module data/correlations
 * @description Estrategias intercambiables de correlación (patrón Strategy).
 *
 * SOLID-O (Abierto/Cerrado): para agregar una correlación nueva (p. ej.
 * Bell-Delaware, Dittus-Boelter, otro corte de deflector) se AÑADE un objeto
 * que cumpla la misma interfaz — no se modifica ningún módulo de physics/.
 *
 * SOLID-D (Inversión de dependencias): calculationsService recibe estas
 * estrategias por inyección; los módulos de alto nivel dependen de la
 * "interfaz" (contrato JSDoc), no de la implementación concreta.
 *
 * SOLID-L (Liskov): cualquier objeto que respete los contratos
 * FilmCorrelation / FrictionFactorProvider puede sustituir a los aquí
 * definidos sin romper el flujo de cálculo.
 *
 * @typedef {Object} FilmCorrelation
 * @property {string} id
 * @property {string} name              Nombre citable (trazabilidad)
 * @property {string} source            Origen bibliográfico
 * @property {(re:number)=>boolean} applies  Rango de validez
 * @property {(p:{re:number, pr:number, k:number, dFt:number, phi:number})=>number} compute
 *
 * @typedef {Object} FrictionFactorProvider
 * @property {string} id
 * @property {string} source
 * @property {(re:number)=>number} compute  f en ft²/in² (cartas de Kern)
 */

import { CORRELATION_COEFFS, CRITERIA } from '../utils/constants.js';

const { SIEDER_TATE_C, SIEDER_TATE_RE_EXP, KERN_SHELL_C, KERN_SHELL_RE_EXP, PR_EXP } =
  CORRELATION_COEFFS;

/** Lado tubos — Sieder-Tate (Kern Ec. 6.15a / Fig. 24).
 *  hi = 0.027·(k/Di)·Re^0.8·Pr^(1/3)·φ  — [USADA] fuente prioritaria §6.6. */
export const siederTateTube = Object.freeze({
  id: 'sieder-tate-tube',
  name: 'Sieder-Tate (interior de tubos, turbulento)',
  source: 'Kern, Ec. (6.15a); fuente prioritaria §4.3/6.6',
  applies: (re) => re >= CRITERIA.RE_TURBULENT_MIN,
  compute: ({ re, pr, k, dFt, phi }) =>
    SIEDER_TATE_C * (k / dFt) * Math.pow(re, SIEDER_TATE_RE_EXP) * Math.pow(pr, PR_EXP) * phi,
});

/** Lado coraza — Kern (deflectores segmentados 25 %) (Ec. 6.15b / Fig. 28).
 *  ho = 0.36·(k/De)·Re^0.55·Pr^(1/3)·φ — [USADA] fuente prioritaria §6.7. */
export const kernShell = Object.freeze({
  id: 'kern-shell-25',
  name: 'Kern lado coraza (deflectores segmentados 25 %)',
  source: 'Kern, Ec. (6.15b), Fig. 28; fuente prioritaria §4.3/6.7',
  applies: (re) => re >= 1000, // rango práctico de la Fig. 28
  compute: ({ re, pr, k, dFt, phi }) =>
    KERN_SHELL_C * (k / dFt) * Math.pow(re, KERN_SHELL_RE_EXP) * Math.pow(pr, PR_EXP) * phi,
});

/**
 * Fricción lado tubos — ajuste potencial de la Fig. 26 de Kern.
 * Anclas del ajuste (leídas del propio Kern, Ejs. 7.3/7.4):
 * (Re=8 220, f=0.000285) y (Re=36 400, f=0.00019).
 * f(11 190) ≈ 0.00026 vs 0.00023 leído por la fuente prioritaria (lectura
 * gráfica); por eso el motor acepta override explícito (ver
 * calculationsService, frictionOverrides) para reproducir la validación exacta.
 */
export const kernTubeFriction = Object.freeze({
  id: 'kern-fig26-fit',
  source: 'Ajuste potencial de la Fig. 26 de Kern (anclas Ejs. 7.3/7.4)',
  compute: (re) => 0.003323 * Math.pow(re, -0.2725),
});

/** Fricción lado coraza — ajuste potencial de la Fig. 29 de Kern.
 *  Anclas: (Re=16 200, f=0.0019) y (Re=25 300, f=0.00175) (Ejs. 7.3/7.4). */
export const kernShellFriction = Object.freeze({
  id: 'kern-fig29-fit',
  source: 'Ajuste potencial de la Fig. 29 de Kern (anclas Ejs. 7.3/7.4)',
  compute: (re) => 0.011339 * Math.pow(re, -0.1843),
});

/** Metodología por defecto = método de Kern (la de la fuente prioritaria).
 *  Un futuro "método Bell-Delaware" se registraría como otro objeto con la
 *  misma forma, sin tocar el código existente (SOLID-O). */
export const KERN_METHODOLOGY = Object.freeze({
  id: 'kern',
  tubeFilm: siederTateTube,
  shellFilm: kernShell,
  tubeFriction: kernTubeFriction,
  shellFriction: kernShellFriction,
});
