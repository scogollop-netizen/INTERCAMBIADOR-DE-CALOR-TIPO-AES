/**
 * @module physics/fouling
 * @description Resistencia de ensuciamiento combinada (Ec. 4.9.2).
 * SOLID-S: solo ensuciamiento.
 */

/**
 * Rd combinado. Forma simple (la usada por la fuente prioritaria, ambos
 * factores ya en base externa): Rd = Rdi + Rdo.
 * Forma general (Rdi en base interna): Rd = Rdi·(Do/Di) + Rdo.
 * @param {{rdi:number, rdo:number, referToOuter?:boolean, odIn?:number, idIn?:number}} p
 */
export function combinedFouling({ rdi, rdo, referToOuter = false, odIn, idIn }) {
  const value = referToOuter ? rdi * (odIn / idIn) + rdo : rdi + rdo;
  return {
    value,
    trace: {
      name: 'Resistencia de ensuciamiento combinada',
      equation: referToOuter ? 'Rd = Rdi·(Do/Di) + Rdo' : 'Rd = Rdi + Rdo',
      substitution: referToOuter
        ? `Rd = ${rdi}·(${odIn}/${idIn}) + ${rdo}`
        : `Rd = ${rdi} + ${rdo}`,
      result: value, units: 'h·ft²·°F/Btu',
      meaning: 'Previsión de diseño por depósitos e incrustaciones (Tabla 12 de Kern). No es un valor medido: es un margen de operación a largo plazo.',
      source: 'Kern Tabla 12; fuente prioritaria §6.8 (0.001 + 0.001 = 0.002)',
    },
  };
}
