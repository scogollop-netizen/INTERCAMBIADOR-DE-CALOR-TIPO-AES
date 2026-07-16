/**
 * @module physics/energyBalance
 * @description Balance de energía y carga térmica (Ec. 4.1.1 de la base de
 * conocimiento; Kern paso 1; fuente prioritaria §6.1).
 *
 * SOLID-S: única responsabilidad = balance de energía. Funciones puras.
 * Cada función devuelve { value, trace } para la trazabilidad de la UI
 * (ecuación + sustitución + unidades + significado físico).
 */

/**
 * Carga térmica a partir del fluido con datos completos.
 * Q = ṁ·Cp·|ΔT|
 * @param {{massFlowLbH:number, cp:number, tInF:number, tOutF:number}} fluid
 * @returns {{value:number, trace:Object}} Q en Btu/h
 */
export function heatDuty({ massFlowLbH, cp, tInF, tOutF }) {
  const dT = Math.abs(tOutF - tInF);
  const value = massFlowLbH * cp * dT;
  return {
    value,
    trace: {
      name: 'Carga térmica (balance de energía)',
      equation: 'Q = ṁ · Cp · |ΔT|',
      substitution: `Q = ${massFlowLbH} · ${cp} · |${tOutF} − ${tInF}|`,
      result: value,
      units: 'Btu/h',
      meaning: 'Calor total intercambiado entre las corrientes (1ª ley, sin cambio de fase ni pérdidas).',
      source: 'Kern paso 1; fuente prioritaria §6.1',
    },
  };
}

/**
 * Caudal faltante del segundo fluido a partir de Q.
 * ṁ = Q / (Cp·|ΔT|)
 * @param {number} qBtuH
 * @param {{cp:number, tInF:number, tOutF:number}} fluid
 * @returns {{value:number, trace:Object}} caudal en lb/h
 */
export function missingMassFlow(qBtuH, { cp, tInF, tOutF }) {
  const dT = Math.abs(tOutF - tInF);
  const value = qBtuH / (cp * dT);
  return {
    value,
    trace: {
      name: 'Caudal faltante por balance de energía',
      equation: 'ṁ = Q / (Cp · |ΔT|)',
      substitution: `ṁ = ${qBtuH} / (${cp} · |${tOutF} − ${tInF}|)`,
      result: value,
      units: 'lb/h',
      meaning: 'El calor cedido por un fluido debe ser absorbido por el otro; despeje del caudal desconocido.',
      source: 'Kern paso 1; fuente prioritaria §6.1',
    },
  };
}
