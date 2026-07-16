/**
 * @module physics/geometry
 * @description Geometría del intercambiador: área instalada, áreas de flujo,
 * espacio libre, diámetro equivalente y número de cruces.
 * (Ecs. 4.4.3, 4.6.1, 4.7.2, 4.7.3, 4.11.5 de la base de conocimiento).
 *
 * SOLID-S: solo geometría; no propiedades de fluidos ni transferencia.
 */

import { SQIN_PER_SQFT, IN_PER_FT } from '../utils/constants.js';

/** Área de transferencia real instalada: A = Nt · L · a''  [ft²]. */
export function installedArea({ tubeCount, tubeLengthFt, extSurfFt2PerFt }) {
  const value = tubeCount * tubeLengthFt * extSurfFt2PerFt;
  return {
    value,
    trace: {
      name: 'Área de transferencia instalada',
      equation: "A = Nt · L · a''",
      substitution: `A = ${tubeCount} · ${tubeLengthFt} · ${extSurfFt2PerFt}`,
      result: value, units: 'ft²',
      meaning: 'Superficie externa total de los tubos disponible para el intercambio.',
      source: 'Kern (Tabla 10, a\'\'); fuente prioritaria §6.5',
    },
  };
}

/** Área de flujo lado tubos: ap = Nt·a\'t / (144·n)  [ft²]. */
export function tubeSideFlowArea({ tubeCount, flowAreaPerTubeIn2, passes }) {
  const value = (tubeCount * flowAreaPerTubeIn2) / (SQIN_PER_SQFT * passes);
  return {
    value,
    trace: {
      name: 'Área de flujo por tubos',
      equation: "ap = Nt · a't / (144 · n)",
      substitution: `ap = ${tubeCount} · ${flowAreaPerTubeIn2} / (144 · ${passes})`,
      result: value, units: 'ft²',
      meaning: 'Sección transversal efectiva por la que fluye el fluido de tubos en cada paso.',
      source: 'Kern Ec. (7.48); fuente prioritaria §6.6',
    },
  };
}

/** Espacio libre entre tubos: C' = Pt − Do  [in]. */
export function tubeClearance({ pitchIn, tubeOdIn }) {
  return pitchIn - tubeOdIn;
}

/** Área de flujo transversal de coraza: as = Ds·C'·B / (Pt·144)  [ft²]. */
export function shellSideFlowArea({ shellIdIn, clearanceIn, baffleSpacingIn, pitchIn }) {
  const value = (shellIdIn * clearanceIn * baffleSpacingIn) / (pitchIn * SQIN_PER_SQFT);
  return {
    value,
    trace: {
      name: 'Área de flujo transversal de coraza',
      equation: "as = Ds · C' · B / (Pt · 144)",
      substitution: `as = ${shellIdIn} · ${clearanceIn} · ${baffleSpacingIn} / (${pitchIn} · 144)`,
      result: value, units: 'ft²',
      meaning: 'Área de paso del fluido de coraza en la franja central del haz entre dos deflectores.',
      source: 'Kern Ec. (7.1); fuente prioritaria §6.7',
    },
  };
}

/**
 * Diámetro equivalente de coraza [ft] según el arreglo (Kern Ec. 7.4 /
 * Fig. 28). Para 3/4" en triangular de 1" el valor tabular clásico es
 * 0.72 in = 0.06 ft (el usado por la fuente prioritaria).
 */
export function equivalentDiameter({ pitchIn, tubeOdIn, layout }) {
  let deIn;
  if (layout === 'triangular') {
    deIn = (4 * (pitchIn * pitchIn * (Math.sqrt(3) / 4) - (Math.PI * tubeOdIn * tubeOdIn) / 8)) /
           ((Math.PI * tubeOdIn) / 2);
  } else { // 'square'
    deIn = (4 * (pitchIn * pitchIn - (Math.PI * tubeOdIn * tubeOdIn) / 4)) /
           (Math.PI * tubeOdIn);
  }
  const value = deIn / IN_PER_FT;
  return {
    value, deIn,
    trace: {
      name: 'Diámetro equivalente de coraza',
      equation: layout === 'triangular'
        ? 'De = 4·(Pt²·√3/4 − π·Do²/8) / (π·Do/2)'
        : 'De = 4·(Pt² − π·Do²/4) / (π·Do)',
      substitution: `Pt = ${pitchIn} in, Do = ${tubeOdIn} in, arreglo = ${layout}`,
      result: value, units: 'ft',
      meaning: 'Diámetro hidráulico de transferencia del espacio entre tubos (definición particular de Kern, consistente con sus cartas jH y f).',
      source: 'Kern Ec. (7.4)/Fig. 28; fuente prioritaria §6.7 (De = 0.06 ft para 3/4" tri 1")',
    },
  };
}

/** Número de cruces: N+1 = 12·L/B  (L en ft, B en in). */
export function baffleCrosses({ tubeLengthFt, baffleSpacingIn }) {
  const value = (IN_PER_FT * tubeLengthFt) / baffleSpacingIn;
  return {
    value,
    trace: {
      name: 'Número de cruces del haz (N+1)',
      equation: 'N+1 = 12·L / B',
      substitution: `N+1 = 12·${tubeLengthFt} / ${baffleSpacingIn}`,
      result: value, units: 'adimensional',
      meaning: 'Veces que el fluido de coraza atraviesa el haz en flujo cruzado, impuesto por los deflectores.',
      source: 'Kern Ec. (7.43); fuente prioritaria §6.10',
    },
  };
}
