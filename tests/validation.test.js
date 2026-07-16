/**
 * Test de validación de la Etapa 1 (motor de cálculo).
 * Ejecutar:  node tests/validation.test.js
 * (También importable desde el navegador; no usa APIs de Node.)
 */
import { validateAgainstPriorityWork } from '../js/services/validationService.js';

const { passed, rows, result } = validateAgainstPriorityWork();

const fmt = (v) => (typeof v === 'number'
  ? (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(4))
  : String(v));

console.log('=== VALIDACIÓN CONTRA LA FUENTE PRIORITARIA (gasolina–kerosene) ===\n');
console.log('Magnitud'.padEnd(34), 'Objetivo'.padStart(12), 'Motor'.padStart(12), 'Desv %'.padStart(9), '  Estado');
console.log('-'.repeat(80));
for (const r of rows) {
  console.log(
    r.label.padEnd(34),
    fmt(r.target).padStart(12),
    fmt(r.actual).padStart(12),
    r.devPct.toFixed(2).padStart(9),
    r.ok ? '  ✔' : '  ✘ FUERA DE TOLERANCIA',
  );
}
console.log('-'.repeat(80));
console.log('\nVeredictos de diseño:', JSON.stringify(result.verdicts, null, 2));
console.log(`\nRESULTADO GLOBAL: ${passed ? '✔ VALIDADO' : '✘ NO VALIDADO'}`);
process.exitCode = passed ? 0 : 1;
