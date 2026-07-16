/**
 * @module physics/reynolds
 * @description Velocidad másica, velocidad lineal y número de Reynolds
 * (Ecs. 4.6.2, 4.6.3, 4.7.4 de la base de conocimiento).
 *
 * SOLID-S: solo cinemática del flujo. Requiere μ ya convertida a lb/(ft·h)
 * (utils/units.cPToLbFtH) y diámetros en ft.
 */

import { SECONDS_PER_HOUR, CRITERIA } from '../utils/constants.js';

/** Velocidad másica G = ṁ/a  [lb/(h·ft²)]. */
export function massVelocity({ massFlowLbH, flowAreaFt2, side }) {
  const value = massFlowLbH / flowAreaFt2;
  return {
    value,
    trace: {
      name: `Velocidad másica (${side})`,
      equation: 'G = ṁ / a',
      substitution: `G = ${massFlowLbH} / ${flowAreaFt2.toFixed(4)}`,
      result: value, units: 'lb/(h·ft²)',
      meaning: 'Flujo por unidad de área normal; permite calcular Re sin conocer la densidad.',
      source: 'Kern Ec. (7.2); fuente prioritaria §6.6/6.7',
    },
  };
}

/** Velocidad lineal v = G/(3600·ρ)  [ft/s]. */
export function linearVelocity({ massVelocityLbHFt2, densityLbFt3 }) {
  const value = massVelocityLbHFt2 / (SECONDS_PER_HOUR * densityLbFt3);
  return {
    value,
    trace: {
      name: 'Velocidad lineal',
      equation: 'v = G / (3600·ρ)',
      substitution: `v = ${massVelocityLbHFt2.toFixed(1)} / (3600·${densityLbFt3.toFixed(2)})`,
      result: value, units: 'ft/s',
      meaning: 'Velocidad real del fluido; controla la pérdida por retorno y los criterios de erosión/sedimentación.',
      source: 'Conversión estándar; fuente prioritaria §6.6',
    },
  };
}

/** Reynolds Re = D·G/μ  (D en ft, μ en lb/(ft·h)). */
export function reynolds({ diameterFt, massVelocityLbHFt2, viscosityLbFtH, side }) {
  const value = (diameterFt * massVelocityLbHFt2) / viscosityLbFtH;
  return {
    value,
    turbulent: value > CRITERIA.RE_TURBULENT_MIN,
    trace: {
      name: `Número de Reynolds (${side})`,
      equation: 'Re = D·G / μ',
      substitution: `Re = ${diameterFt.toFixed(5)} · ${massVelocityLbHFt2.toFixed(1)} / ${viscosityLbFtH.toFixed(3)}`,
      result: value, units: 'adimensional',
      meaning: `Régimen de flujo. Criterio de diseño: Re > ${CRITERIA.RE_TURBULENT_MIN} (turbulento) para validez de las correlaciones.`,
      source: 'Kern Ec. (7.3); fuente prioritaria §6.6/6.7',
    },
  };
}
