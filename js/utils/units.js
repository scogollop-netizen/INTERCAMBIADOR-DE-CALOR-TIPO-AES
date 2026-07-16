/**
 * @module utils/units
 * @description Conversores de unidades puros y sin estado.
 *
 * SOLID-S: única responsabilidad = convertir unidades.
 * SOLID-O: agregar un nuevo conversor no modifica los existentes.
 *
 * El motor de cálculo trabaja internamente en el SISTEMA INGLÉS DE KERN
 * (Btu, lb, h, ft, °F, psi) porque es el sistema de la fuente prioritaria
 * y de las constantes empíricas (5.22e10, 2.42, cartas de fricción).
 * La conversión a SI se hace solo en la capa de presentación.
 */

import {
  CP_TO_LB_FT_H,
  IN_PER_FT,
  WATER_DENSITY_LB_FT3,
} from './constants.js';

/** cP → lb/(ft·h). Obligatorio antes de cualquier Reynolds (Anexo C). */
export const cPToLbFtH = (cP) => cP * CP_TO_LB_FT_H;

/** in → ft. */
export const inToFt = (inches) => inches / IN_PER_FT;

/** ft → in. */
export const ftToIn = (ft) => ft * IN_PER_FT;

/** Gravedad específica → densidad [lb/ft³] (convención de la fuente prioritaria). */
export const sgToDensityLbFt3 = (sg) => sg * WATER_DENSITY_LB_FT3;

/* ------- Conversores de presentación (Inglés ↔ SI) ------- */

export const btuHToW = (btuH) => btuH * 0.29307107;
export const lbHToKgS = (lbH) => lbH * 0.000125998;
export const ft2ToM2 = (ft2) => ft2 * 0.09290304;
export const psiToPa = (psi) => psi * 6894.757;
export const fToC = (f) => (f - 32) / 1.8;
export const deltaFToDeltaC = (dF) => dF / 1.8;
export const btuHFt2FToWm2K = (u) => u * 5.678263;
export const ftSToMS = (fts) => fts * 0.3048;
