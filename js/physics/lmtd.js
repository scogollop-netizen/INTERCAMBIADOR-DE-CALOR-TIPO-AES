/**
 * @module physics/lmtd
 * @description LMTD, parámetros R/S, factor F analítico (Bowman-Mueller-Nagle)
 * y ΔTm (Ecs. 4.2.1–4.2.4 de la base de conocimiento).
 *
 * SOLID-S: única responsabilidad = fuerza motriz térmica.
 * La forma ANALÍTICA de F (no la gráfica) es la usada por la fuente
 * prioritaria (§6.4) y la que debe implementar el simulador.
 */

/**
 * LMTD a contracorriente. ΔT1 = T1−t2 ; ΔT2 = T2−t1 (convención de la
 * fuente prioritaria: ΔT1=160−120=40, ΔT2=120−75=45).
 * @returns {{value:number, dT1:number, dT2:number, trace:Object}}
 */
export function lmtd({ hotInF, hotOutF, coldInF, coldOutF }) {
  const dT1 = hotInF - coldOutF;
  const dT2 = hotOutF - coldInF;
  if (dT1 <= 0 || dT2 <= 0) {
    throw new RangeError('LMTD indefinida: cruce de temperaturas no físico para esta configuración.');
  }
  const value = dT1 === dT2 ? dT1 : (dT2 - dT1) / Math.log(dT2 / dT1);
  return {
    value, dT1, dT2,
    trace: {
      name: 'Diferencia media logarítmica de temperatura (LMTD)',
      equation: 'LMTD = (ΔT₂ − ΔT₁) / ln(ΔT₂/ΔT₁)',
      substitution: `LMTD = (${dT2} − ${dT1}) / ln(${dT2}/${dT1})`,
      result: value,
      units: '°F',
      meaning: 'Fuerza motriz térmica promedio para contracorriente pura (base a corregir con F).',
      source: 'Kern Ec. (5.14); fuente prioritaria §6.4',
    },
  };
}

/** R = (T1−T2)/(t2−t1) ; S = (t2−t1)/(T1−t1). */
export function rsParameters({ hotInF, hotOutF, coldInF, coldOutF }) {
  const R = (hotInF - hotOutF) / (coldOutF - coldInF);
  const S = (coldOutF - coldInF) / (hotInF - coldInF);
  return {
    R, S,
    trace: {
      name: 'Parámetros adimensionales R y S',
      equation: 'R = (T₁−T₂)/(t₂−t₁) ;  S = (t₂−t₁)/(T₁−t₁)',
      substitution: `R = (${hotInF}−${hotOutF})/(${coldOutF}−${coldInF}) ; S = (${coldOutF}−${coldInF})/(${hotInF}−${coldInF})`,
      result: { R, S },
      units: 'adimensional',
      meaning: 'R: relación de capacidades caloríficas. S: eficiencia de temperatura del fluido frío.',
      source: 'Kern Ec. (7.42)/Fig. 18; fuente prioritaria §6.4',
    },
  };
}

/**
 * Factor de corrección F — forma analítica cerrada para 1 paso de coraza y
 * 2,4,6,… pasos de tubos (Bowman-Mueller-Nagle).
 * @returns {{value:number, trace:Object}}
 */
export function correctionFactorF(R, S) {
  const sq = Math.sqrt(R * R + 1);
  let value;
  if (Math.abs(R - 1) < 1e-9) {
    // Límite R→1 de la fórmula general (evita 0/0).
    value = (S * sq / (1 - S)) /
      Math.log((2 - S * (2 - sq)) / (2 - S * (2 + sq)));
  } else {
    value = (sq * Math.log((1 - S) / (1 - R * S))) /
      ((R - 1) * Math.log((2 - S * (R + 1 - sq)) / (2 - S * (R + 1 + sq))));
  }
  return {
    value,
    trace: {
      name: 'Factor de corrección de temperatura F',
      equation: 'F = [√(R²+1)·ln((1−S)/(1−RS))] / [(R−1)·ln((2−S(R+1−√(R²+1)))/(2−S(R+1+√(R²+1))))]',
      substitution: `R = ${R.toFixed(4)}, S = ${S.toFixed(4)}`,
      result: value,
      units: 'adimensional',
      meaning: 'Corrige la LMTD por el flujo mixto (paralelo+contracorriente) de la configuración 1-2n. Criterio de aceptación: F > 0.75.',
      source: 'Bowman-Mueller-Nagle; fuente prioritaria §4.1/6.4 (forma analítica, no gráfica)',
    },
  };
}

/** ΔTm = F · LMTD. */
export function trueTemperatureDifference(F, lmtdF) {
  const value = F * lmtdF;
  return {
    value,
    trace: {
      name: 'Diferencia de temperatura verdadera',
      equation: 'ΔTm = F · LMTD',
      substitution: `ΔTm = ${F.toFixed(4)} · ${lmtdF.toFixed(2)}`,
      result: value,
      units: '°F',
      meaning: 'Fuerza motriz térmica efectiva real de la configuración multipaso.',
      source: 'Kern Ec. (7.42); fuente prioritaria §6.4',
    },
  };
}
