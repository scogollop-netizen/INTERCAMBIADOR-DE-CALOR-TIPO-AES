/**
 * @module utils/constants
 * @description Constantes físicas, de conversión y de metodología (Kern).
 *
 * RESPONSABILIDAD ÚNICA (SOLID-S): este archivo SOLO define constantes.
 * No contiene lógica. Cualquier módulo que necesite una constante la
 * importa desde aquí — nunca se "hardcodea" un número mágico en physics/.
 *
 * Trazabilidad: cada constante cita su origen en la base de conocimiento
 * (Base_Conocimiento_Simulador_TEMA_AES.md, Anexo C) y en Kern.
 */

/** Constante dimensional de las ecuaciones de caída de presión de Kern
 *  (Ecs. 7.44 y 7.45). Requiere: G en lb/(h·ft²), L/D/Ds/De en ft,
 *  f en ft²/in² (cartas de Kern, Figs. 26 y 29). Resultado en psi. */
export const KERN_DP_CONSTANT = 5.22e10;

/** Constante gravitacional de conversión gc [lb·ft/(lbf·s²)]
 *  usada en la pérdida por retorno de cabezales (Kern Ec. 7.46). */
export const GC = 32.2;

/** Densidad de referencia del agua [lb/ft³] usada por la fuente
 *  prioritaria para convertir gravedad específica a densidad (ρ = s·62.4). */
export const WATER_DENSITY_LB_FT3 = 62.4;

/** Conversión de viscosidad: 1 cP = 2.42 lb/(ft·h) (Kern, nomenclatura Cap. 6). */
export const CP_TO_LB_FT_H = 2.42;

/** Conversiones geométricas del sistema inglés. */
export const IN_PER_FT = 12;
export const SQIN_PER_SQFT = 144;
export const SECONDS_PER_HOUR = 3600;

/** Criterios de aceptación de la metodología (fuente prioritaria + Kern). */
export const CRITERIA = Object.freeze({
  /** Régimen turbulento mínimo recomendado (Kern; fuente prioritaria §4.3). */
  RE_TURBULENT_MIN: 10000,
  /** Factor de corrección mínimo aceptable (fuente prioritaria §6.4). */
  F_MIN: 0.75,
  /** Regla pedagógica de espaciado de deflectores como fracción de Ds
   *  (fuente prioritaria §4.6; ver discrepancia §7.4 de la base de
   *  conocimiento respecto a TEMA RCB-4). */
  BAFFLE_SPACING_MIN_FRACTION: 0.20,
  BAFFLE_SPACING_MAX_FRACTION: 0.50,
});

/** Exponentes/coeficientes de las correlaciones de película (Kern Ec. 6.15a/b). */
export const CORRELATION_COEFFS = Object.freeze({
  SIEDER_TATE_C: 0.027,     // lado tubos
  SIEDER_TATE_RE_EXP: 0.8,
  KERN_SHELL_C: 0.36,       // lado coraza (deflectores segmentados 25 %)
  KERN_SHELL_RE_EXP: 0.55,
  PR_EXP: 1 / 3,
  WALL_VISCOSITY_EXP: 0.14, // φ = (μ/μw)^0.14 (no usado en validación: φ=1)
});
