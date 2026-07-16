/**
 * @module physics/overallCoefficient
 * @description Coeficiente global limpio Uc y de diseño UD
 * (Ecs. 4.9.1, 4.9.1-bis, 4.9.3 de la base de conocimiento).
 *
 * SOLID-S: solo combinación de resistencias térmicas.
 * SOLID-O: la forma "tres resistencias" convive como estrategia alternativa
 * sin modificar la forma de validación (dos resistencias, Kern Ec. 6.38).
 */

/** Uc de dos resistencias (forma de validación — Kern Ec. 6.38, [USADA]). */
export function cleanCoefficientKern({ hio, ho }) {
  const value = (hio * ho) / (hio + ho);
  return {
    value,
    trace: {
      name: 'Coeficiente global limpio (Kern, dos resistencias)',
      equation: 'Uc = hio·ho / (hio + ho)',
      substitution: `Uc = ${hio.toFixed(1)}·${ho.toFixed(1)} / (${hio.toFixed(1)} + ${ho.toFixed(1)})`,
      result: value, units: 'Btu/(h·ft²·°F)',
      meaning: 'Resistencias convectivas en serie (base área externa), despreciando la conducción de la pared metálica (válido para tubo delgado de acero).',
      source: 'Kern Ec. (6.38); fuente prioritaria §6.8 — forma de VALIDACIÓN',
    },
  };
}

/** Uc de tres resistencias (opción avanzada — [SOLO TEORÍA], §4.4 del trabajo). */
export function cleanCoefficientFull({ hi, ho, idIn, odIn, tubeK }) {
  const doFt = odIn, diFt = idIn; // razón adimensional: pueden quedarse en in
  const rConv_i = doFt / (hi * diFt);
  const rWall = (odIn / 12) * Math.log(odIn / idIn) / (2 * tubeK);
  const rConv_o = 1 / ho;
  const value = 1 / (rConv_i + rWall + rConv_o);
  return {
    value,
    trace: {
      name: 'Coeficiente global limpio (tres resistencias — modo avanzado)',
      equation: 'Uc = [do/(hi·Di) + do·ln(do/Di)/(2·kt) + 1/ho]⁻¹',
      substitution: `do=${odIn} in, Di=${idIn} in, hi=${hi.toFixed(1)}, ho=${ho.toFixed(1)}, kt=${tubeK} Btu/(h·ft·°F)`,
      result: value, units: 'Btu/(h·ft²·°F)',
      meaning: 'Incluye la resistencia de conducción radial de la pared del tubo. NO es la forma usada en la validación.',
      source: 'Fuente prioritaria §4.4 (fundamento teórico); Incropera/Çengel',
    },
  };
}

/** UD = 1/(1/Uc + Rd)  (Kern Ec. 6.13 reordenada, [USADA]). */
export function designCoefficient({ uc, rdTotal }) {
  const value = 1 / (1 / uc + rdTotal);
  return {
    value,
    trace: {
      name: 'Coeficiente global de diseño (con ensuciamiento)',
      equation: '1/UD = 1/Uc + Rd',
      substitution: `UD = 1/(1/${uc.toFixed(2)} + ${rdTotal})`,
      result: value, units: 'Btu/(h·ft²·°F)',
      meaning: 'Coeficiente real de operación a largo plazo, penalizado por la resistencia de ensuciamiento prevista.',
      source: 'Kern Ec. (6.13); fuente prioritaria §6.8',
    },
  };
}
