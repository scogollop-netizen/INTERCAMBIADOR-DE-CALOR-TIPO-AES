/**
 * @module physics/filmCoefficients
 * @description Coeficientes de película hi, hio, ho
 * (Ecs. 4.6.4, 4.6.5, 4.7.5 de la base de conocimiento).
 *
 * SOLID-D: la correlación concreta (Sieder-Tate, Kern-coraza, o una futura)
 * se INYECTA — este módulo depende del contrato FilmCorrelation, no de una
 * implementación. SOLID-S: solo coeficientes de película.
 */

/**
 * Coeficiente de película con la correlación inyectada.
 * @param {import('../data/correlations.js').FilmCorrelation} correlation
 * @param {{re:number, pr:number, k:number, dFt:number, phi?:number, side:string}} p
 */
export function filmCoefficient(correlation, { re, pr, k, dFt, phi = 1, side }) {
  const value = correlation.compute({ re, pr, k, dFt, phi });
  return {
    value,
    withinRange: correlation.applies(re),
    trace: {
      name: `Coeficiente de película (${side}) — ${correlation.name}`,
      equation: side === 'tubos'
        ? 'hi·Di/k = 0.027·Re^0.8·Pr^(1/3)·φ'
        : 'ho·De/k = 0.36·Re^0.55·Pr^(1/3)·φ',
      substitution: `Re = ${re.toFixed(0)}, Pr = ${pr}, k = ${k}, D = ${dFt.toFixed(5)} ft, φ = ${phi}`,
      result: value, units: 'Btu/(h·ft²·°F)',
      meaning: 'Conductancia convectiva de la película de fluido adyacente a la pared del tubo.',
      source: correlation.source,
      note: phi === 1
        ? 'φ=1 asumido (simplificación explícita de la fuente prioritaria, §6.6).'
        : `Corrección de viscosidad de pared aplicada: φ = ${phi}.`,
    },
  };
}

/** hio = hi·(Di/Do): coeficiente interno referido al área externa (Kern Ec. 6.5). */
export function referToOuterArea({ hi, idIn, odIn }) {
  const value = hi * (idIn / odIn);
  return {
    value,
    trace: {
      name: 'Coeficiente interno referido al área externa',
      equation: 'hio = hi · (Di/Do)',
      substitution: `hio = ${hi.toFixed(1)} · (${idIn}/${odIn})`,
      result: value, units: 'Btu/(h·ft²·°F)',
      meaning: 'Reescala hi a la base de área externa para combinarlo con ho en la ecuación de resistencias en serie.',
      source: 'Kern Ec. (6.5); fuente prioritaria §6.6',
    },
  };
}
