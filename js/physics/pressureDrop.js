/**
 * @module physics/pressureDrop
 * @description Caídas de presión lado tubos (fricción + retorno) y lado
 * coraza (Ecs. 4.11.2, 4.11.3, 4.11.6 de la base de conocimiento).
 *
 * SOLID-S: solo hidráulica de pérdidas de carga.
 * SOLID-D: el factor de fricción llega como valor ya resuelto (por la
 * estrategia FrictionFactorProvider o por override del usuario) — este
 * módulo no sabe de dónde salió f.
 *
 * REGLA CRÍTICA DE UNIDADES (Anexo C): G en lb/(h·ft²); L, Di, Ds, De en ft;
 * f en ft²/in² (cartas de Kern). Resultado directo en psi.
 * Nota §7.7 de la base de conocimiento: Ds SIEMPRE en ft (Kern Ej. 7.3
 * usa 21.25/12); la sustitución escrita de la fuente prioritaria con
 * Ds=29 in contiene un deslizamiento de factor 10 — este módulo implementa
 * la forma correcta de Kern.
 */

import { KERN_DP_CONSTANT, GC, SQIN_PER_SQFT } from '../utils/constants.js';

/** ΔP por fricción, lado tubos: f·Gt²·L·n / (5.22e10·Di·s·φ)  [psi]. */
export function tubeFrictionDrop({ f, gt, tubeLengthFt, passes, idFt, sg, phi = 1 }) {
  const value = (f * gt * gt * tubeLengthFt * passes) /
                (KERN_DP_CONSTANT * idFt * sg * phi);
  return {
    value,
    trace: {
      name: 'Caída de presión por fricción (tubos)',
      equation: 'ΔPt = f·Gt²·L·n / (5.22×10¹⁰·Di·s·φ)',
      substitution: `ΔPt = ${f}·(${gt.toFixed(1)})²·${tubeLengthFt}·${passes} / (5.22×10¹⁰·${idFt.toFixed(5)}·${sg}·${phi})`,
      result: value, units: 'psi',
      meaning: 'Pérdida por fricción distribuida en la longitud recta de los n pasos de tubos.',
      source: 'Kern Ec. (7.45); fuente prioritaria §6.10',
    },
  };
}

/** ΔP por retorno en cabezales: 4n·V²·ρ / (2·gc·144)  [psi]
 *  (forma con densidad explícita — la que reproduce la cifra de la fuente
 *  prioritaria; equivalente a la Ec. 7.46 de Kern con s). */
export function tubeReturnDrop({ passes, velocityFtS, densityLbFt3 }) {
  const value = (4 * passes * velocityFtS * velocityFtS * densityLbFt3) /
                (2 * GC * SQIN_PER_SQFT);
  return {
    value,
    trace: {
      name: 'Caída de presión por retorno en cabezales (tubos)',
      equation: 'ΔPr = 4n·V²·ρ / (2·gc·144)',
      substitution: `ΔPr = 4·${passes}·(${velocityFtS.toFixed(3)})²·${densityLbFt3.toFixed(2)} / (2·32.2·144)`,
      result: value, units: 'psi',
      meaning: 'Pérdida de forma por el cambio brusco de dirección entre pasos (≈4 cargas de velocidad por retorno).',
      source: 'Kern Ec. (7.46)/Fig. 27; fuente prioritaria §6.10',
    },
  };
}

/** ΔP total lado tubos = fricción + retorno (Kern Ec. 7.47). */
export function tubeTotalDrop({ frictionPsi, returnPsi }) {
  const value = frictionPsi + returnPsi;
  return {
    value,
    trace: {
      name: 'Caída de presión total (tubos)',
      equation: 'ΔP_tubos = ΔP_fricción + ΔP_retorno',
      substitution: `${frictionPsi.toFixed(2)} + ${returnPsi.toFixed(2)}`,
      result: value, units: 'psi',
      meaning: 'Valor a comparar contra el ΔP máximo permitido del fluido de tubos.',
      source: 'Kern Ec. (7.47); fuente prioritaria §6.10 (8.58 psi — ver discrepancia §7.3)',
    },
  };
}

/** ΔP lado coraza: f·Gs²·Ds·(N+1) / (5.22e10·De·s·φ)  [psi] — Ds en ft. */
export function shellDrop({ f, gs, shellIdFt, crosses, deFt, sg, phi = 1 }) {
  const value = (f * gs * gs * shellIdFt * crosses) /
                (KERN_DP_CONSTANT * deFt * sg * phi);
  return {
    value,
    trace: {
      name: 'Caída de presión (coraza)',
      equation: 'ΔPs = f·Gs²·Ds·(N+1) / (5.22×10¹⁰·De·s·φ)',
      substitution: `ΔPs = ${f}·(${gs.toFixed(1)})²·${shellIdFt.toFixed(3)}·${crosses.toFixed(2)} / (5.22×10¹⁰·${deFt}·${sg}·${phi})`,
      result: value, units: 'psi',
      meaning: 'Pérdida por flujo cruzado repetido sobre el haz entre deflectores. Ds en ft (forma correcta de Kern — ver base de conocimiento §7.7).',
      source: 'Kern Ec. (7.44); fuente prioritaria §6.10',
    },
  };
}
