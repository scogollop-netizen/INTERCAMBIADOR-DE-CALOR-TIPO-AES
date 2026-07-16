/**
 * @module data/fluids
 * @description Presets de fluidos con TRAZABILIDAD de fuente por propiedad
 * (requisito "Propiedades y fuentes" de las directrices).
 *
 * SOLID-S: solo datos de fluidos. SOLID-O: agregar un fluido = agregar un
 * objeto; la UI y el motor no cambian.
 *
 * Cada propiedad lleva: valor, unidades, T/P de referencia y fuente.
 */

export const FLUID_PRESETS = Object.freeze({
  gasolina: {
    label: 'Gasolina (fuente prioritaria)',
    defaults: { cp: 0.55, viscosityCp: 0.45, k: 0.087, sg: 0.74, pr: 6.88, foulingRd: 0.001 },
    refTemp: 'Promedio de operación 120–160 °F', refPress: '50 psia',
    sources: {
      cp:  { units: 'Btu/(lb·°F)', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      viscosityCp: { units: 'cP', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      k:   { units: 'Btu/(h·ft·°F)', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      sg:  { units: 'adimensional', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      pr:  { units: 'adimensional', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      foulingRd: { units: 'h·ft²·°F/Btu', src: 'Tabla 12 de Kern / fuente prioritaria §6.8' },
    },
  },
  kerosene: {
    label: 'Kerosene (fuente prioritaria)',
    defaults: { cp: 0.48, viscosityCp: 1.50, k: 0.081, sg: 0.82, pr: 21.5, foulingRd: 0.001 },
    refTemp: 'Promedio de operación 75–120 °F', refPress: '50 psia',
    sources: {
      cp:  { units: 'Btu/(lb·°F)', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      viscosityCp: { units: 'cP', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      k:   { units: 'Btu/(h·ft·°F)', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      sg:  { units: 'adimensional', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      pr:  { units: 'adimensional', src: 'Enunciado del proyecto (fuente prioritaria, §3.1.3)' },
      foulingRd: { units: 'h·ft²·°F/Btu', src: 'Tabla 12 de Kern / fuente prioritaria §6.8' },
    },
  },
  agua: {
    label: 'Agua (≈ 30 °C / 86 °F)',
    defaults: { cp: 1.0, viscosityCp: 0.80, k: 0.356, sg: 0.996, pr: 5.4, foulingRd: 0.001 },
    refTemp: '86 °F (30 °C)', refPress: '1 atm',
    sources: {
      cp:  { units: 'Btu/(lb·°F)', src: 'Kern, Apéndice (propiedades del agua); Çengel Tabla A-9' },
      viscosityCp: { units: 'cP', src: 'Çengel, Heat and Mass Transfer, Tabla A-9 (agua saturada)' },
      k:   { units: 'Btu/(h·ft·°F)', src: 'Çengel Tabla A-9 (0.615 W/m·K ≈ 0.356 Btu/h·ft·°F)' },
      sg:  { units: 'adimensional', src: 'Çengel Tabla A-9 (ρ ≈ 996 kg/m³)' },
      pr:  { units: 'adimensional', src: 'Çengel Tabla A-9' },
      foulingRd: { units: 'h·ft²·°F/Btu', src: 'Tabla 12 de Kern (agua de ciudad/pozo)' },
    },
  },
  custom: {
    label: 'Personalizado (usuario)',
    defaults: { cp: 0.5, viscosityCp: 1.0, k: 0.08, sg: 0.85, pr: 10, foulingRd: 0.001 },
    refTemp: 'Definida por el usuario', refPress: '—',
    sources: {
      cp:  { units: 'Btu/(lb·°F)', src: 'Introducido por el usuario' },
      viscosityCp: { units: 'cP', src: 'Introducido por el usuario' },
      k:   { units: 'Btu/(h·ft·°F)', src: 'Introducido por el usuario' },
      sg:  { units: 'adimensional', src: 'Introducido por el usuario' },
      pr:  { units: 'adimensional', src: 'Introducido por el usuario' },
      foulingRd: { units: 'h·ft²·°F/Btu', src: 'Introducido por el usuario' },
    },
  },
});

/** Nombres legibles de las propiedades para el panel "Propiedades y fuentes". */
export const PROPERTY_LABELS = Object.freeze({
  cp: { name: 'Calor específico', symbol: 'Cp' },
  viscosityCp: { name: 'Viscosidad dinámica', symbol: 'μ' },
  k: { name: 'Conductividad térmica', symbol: 'k' },
  sg: { name: 'Gravedad específica', symbol: 's' },
  pr: { name: 'Número de Prandtl', symbol: 'Pr' },
  foulingRd: { name: 'Factor de ensuciamiento', symbol: 'Rd' },
});
