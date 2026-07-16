/**
 * @module services/calculationsService
 * @description Orquestador del método de Kern completo — reproduce la
 * secuencia exacta de la fuente prioritaria (§2.2 de la base de conocimiento):
 * balance → LMTD/F → geometría → lado tubos → lado coraza → Uc/UD →
 * comparación de áreas → caídas de presión → veredictos.
 *
 * SOLID-S: este servicio SOLO orquesta; cada cálculo vive en physics/.
 * SOLID-D: recibe la metodología (correlaciones + fricción) por inyección;
 *          por defecto usa KERN_METHODOLOGY, pero cualquier objeto con el
 *          mismo contrato la sustituye (SOLID-L) sin tocar este archivo.
 * SOLID-O: soportar otro tipo TEMA/otro método = inyectar otra metodología.
 *
 * @typedef {Object} FluidSpec
 * @property {string} name
 * @property {number} [massFlowLbH]   Si falta, se calcula por balance.
 * @property {number} tInF
 * @property {number} tOutF
 * @property {number} cp              Btu/(lb·°F)
 * @property {number} viscosityCp     cP
 * @property {number} k               Btu/(h·ft·°F)
 * @property {number} sg              gravedad específica
 * @property {number} pr              Prandtl
 * @property {number} [foulingRd]     h·ft²·°F/Btu
 * @property {number} [maxDpPsi]
 *
 * @typedef {Object} GeometrySpec
 * @property {number} tubeOdIn
 * @property {number} tubeBwg
 * @property {number} tubeLengthFt
 * @property {('triangular'|'square')} layout
 * @property {number} pitchIn
 * @property {number} passes
 * @property {number} shellIdIn
 * @property {number} [tubeCount]     Si falta, se busca en Tabla 9.
 * @property {number} baffleSpacingIn
 */

import { heatDuty, missingMassFlow } from '../physics/energyBalance.js';
import { lmtd, rsParameters, correctionFactorF, trueTemperatureDifference } from '../physics/lmtd.js';
import {
  installedArea, tubeSideFlowArea, tubeClearance,
  shellSideFlowArea, equivalentDiameter, baffleCrosses,
} from '../physics/geometry.js';
import { massVelocity, linearVelocity, reynolds } from '../physics/reynolds.js';
import { filmCoefficient, referToOuterArea } from '../physics/filmCoefficients.js';
import { cleanCoefficientKern, designCoefficient } from '../physics/overallCoefficient.js';
import { combinedFouling } from '../physics/fouling.js';
import {
  tubeFrictionDrop, tubeReturnDrop, tubeTotalDrop, shellDrop,
} from '../physics/pressureDrop.js';
import { findTube, findTubeCount } from '../data/kernTables.js';
import { KERN_METHODOLOGY } from '../data/correlations.js';
import { cPToLbFtH, inToFt, sgToDensityLbFt3 } from '../utils/units.js';
import { CRITERIA } from '../utils/constants.js';

/**
 * Ejecuta el diseño/verificación completo.
 * @param {{hotFluid:FluidSpec, coldFluid:FluidSpec,
 *          tubeSide:('hot'|'cold'), geometry:GeometrySpec,
 *          methodology?:Object,
 *          frictionOverrides?:{tube?:number, shell?:number},
 *          phi?:{tube?:number, shell?:number}}} input
 * @returns {Object} árbol de resultados con trazas y veredictos
 */
export function runKernDesign(input) {
  const {
    hotFluid, coldFluid, tubeSide, geometry,
    methodology = KERN_METHODOLOGY,
    frictionOverrides = {},
    phi = { tube: 1, shell: 1 },
  } = input;

  const traces = [];
  const push = (r) => { traces.push(r.trace); return r; };

  /* ---------- 1. Balance de energía ---------- */
  const known = hotFluid.massFlowLbH ? hotFluid : coldFluid;
  const unknown = hotFluid.massFlowLbH ? coldFluid : hotFluid;
  const q = push(heatDuty(known));
  if (!unknown.massFlowLbH) {
    unknown.massFlowLbH = push(missingMassFlow(q.value, unknown)).value;
  }

  /* ---------- 2. LMTD, R, S, F, ΔTm ---------- */
  const temps = {
    hotInF: hotFluid.tInF, hotOutF: hotFluid.tOutF,
    coldInF: coldFluid.tInF, coldOutF: coldFluid.tOutF,
  };
  const L = push(lmtd(temps));
  const rs = push(rsParameters(temps));
  const F = push(correctionFactorF(rs.R, rs.S));
  const dTm = push(trueTemperatureDifference(F.value, L.value));

  /* ---------- 3. Geometría (Tablas 9 y 10) ---------- */
  const tube = findTube(geometry.tubeOdIn, geometry.tubeBwg);
  if (!tube) throw new Error(`Tubo ${geometry.tubeOdIn}" BWG ${geometry.tubeBwg} no está en la Tabla 10 digitalizada.`);
  const tubeCount = geometry.tubeCount ?? findTubeCount({
    shellIdIn: geometry.shellIdIn, tubeOdIn: geometry.tubeOdIn,
    layout: geometry.layout, pitchIn: geometry.pitchIn, passes: geometry.passes,
  });
  if (!tubeCount) throw new Error('Combinación no encontrada en la Tabla 9 digitalizada; especifique tubeCount.');

  const area = push(installedArea({
    tubeCount, tubeLengthFt: geometry.tubeLengthFt, extSurfFt2PerFt: tube.extSurfFt2PerFt,
  }));

  /* ---------- 4. Lado tubos ---------- */
  const tubeFluid = tubeSide === 'hot' ? hotFluid : coldFluid;
  const shellFluid = tubeSide === 'hot' ? coldFluid : hotFluid;

  const ap = push(tubeSideFlowArea({
    tubeCount, flowAreaPerTubeIn2: tube.flowAreaIn2, passes: geometry.passes,
  }));
  const gt = push(massVelocity({ massFlowLbH: tubeFluid.massFlowLbH, flowAreaFt2: ap.value, side: 'tubos' }));
  const rhoTube = sgToDensityLbFt3(tubeFluid.sg);
  const vt = push(linearVelocity({ massVelocityLbHFt2: gt.value, densityLbFt3: rhoTube }));
  const idFt = inToFt(tube.idIn);
  const ret = push(reynolds({
    diameterFt: idFt, massVelocityLbHFt2: gt.value,
    viscosityLbFtH: cPToLbFtH(tubeFluid.viscosityCp), side: 'tubos',
  }));
  const hi = push(filmCoefficient(methodology.tubeFilm, {
    re: ret.value, pr: tubeFluid.pr, k: tubeFluid.k, dFt: idFt, phi: phi.tube, side: 'tubos',
  }));
  const hio = push(referToOuterArea({ hi: hi.value, idIn: tube.idIn, odIn: tube.odIn }));

  /* ---------- 5. Lado coraza ---------- */
  const cIn = tubeClearance({ pitchIn: geometry.pitchIn, tubeOdIn: geometry.tubeOdIn });
  const as = push(shellSideFlowArea({
    shellIdIn: geometry.shellIdIn, clearanceIn: cIn,
    baffleSpacingIn: geometry.baffleSpacingIn, pitchIn: geometry.pitchIn,
  }));
  const de = push(equivalentDiameter({
    pitchIn: geometry.pitchIn, tubeOdIn: geometry.tubeOdIn, layout: geometry.layout,
  }));
  const gs = push(massVelocity({ massFlowLbH: shellFluid.massFlowLbH, flowAreaFt2: as.value, side: 'coraza' }));
  const res = push(reynolds({
    diameterFt: de.value, massVelocityLbHFt2: gs.value,
    viscosityLbFtH: cPToLbFtH(shellFluid.viscosityCp), side: 'coraza',
  }));
  const ho = push(filmCoefficient(methodology.shellFilm, {
    re: res.value, pr: shellFluid.pr, k: shellFluid.k, dFt: de.value, phi: phi.shell, side: 'coraza',
  }));

  /* ---------- 6. Coeficientes globales ---------- */
  const uc = push(cleanCoefficientKern({ hio: hio.value, ho: ho.value }));
  const rd = push(combinedFouling({
    rdi: tubeFluid.foulingRd ?? 0, rdo: shellFluid.foulingRd ?? 0,
  }));
  const ud = push(designCoefficient({ uc: uc.value, rdTotal: rd.value }));

  /* ---------- 7. Comparación de áreas ---------- */
  const aReq = q.value / (ud.value * dTm.value);
  const overdesignPct = ((area.value - aReq) / aReq) * 100;
  traces.push({
    name: 'Área requerida y sobrediseño',
    equation: 'Areq = Q/(UD·ΔTm) ;  %exceso = (A−Areq)/Areq·100',
    substitution: `Areq = ${q.value}/(${ud.value.toFixed(2)}·${dTm.value.toFixed(2)})`,
    result: { aReq, overdesignPct }, units: 'ft², %',
    meaning: 'Margen de superficie instalada respecto al mínimo teórico.',
    source: 'Fuente prioritaria §6.9',
  });

  /* ---------- 8. Caídas de presión ---------- */
  const fT = frictionOverrides.tube ?? methodology.tubeFriction.compute(ret.value);
  const fS = frictionOverrides.shell ?? methodology.shellFriction.compute(res.value);

  const dpTf = push(tubeFrictionDrop({
    f: fT, gt: gt.value, tubeLengthFt: geometry.tubeLengthFt,
    passes: geometry.passes, idFt, sg: tubeFluid.sg, phi: phi.tube,
  }));
  const dpTr = push(tubeReturnDrop({
    passes: geometry.passes, velocityFtS: vt.value, densityLbFt3: rhoTube,
  }));
  const dpT = push(tubeTotalDrop({ frictionPsi: dpTf.value, returnPsi: dpTr.value }));

  const crosses = push(baffleCrosses({
    tubeLengthFt: geometry.tubeLengthFt, baffleSpacingIn: geometry.baffleSpacingIn,
  }));
  const dpS = push(shellDrop({
    f: fS, gs: gs.value, shellIdFt: inToFt(geometry.shellIdIn),
    crosses: crosses.value, deFt: de.value, sg: shellFluid.sg, phi: phi.shell,
  }));

  /* ---------- 9. Veredictos ---------- */
  const baffleFraction = geometry.baffleSpacingIn / geometry.shellIdIn;
  const verdicts = {
    tubeTurbulent: ret.turbulent,
    shellTurbulent: res.turbulent,
    fAcceptable: F.value > CRITERIA.F_MIN,
    tubeDpOk: tubeFluid.maxDpPsi == null || dpT.value <= tubeFluid.maxDpPsi,
    shellDpOk: shellFluid.maxDpPsi == null || dpS.value <= shellFluid.maxDpPsi,
    areaOk: area.value >= aReq,
    baffleSpacingInRange:
      baffleFraction >= CRITERIA.BAFFLE_SPACING_MIN_FRACTION &&
      baffleFraction <= CRITERIA.BAFFLE_SPACING_MAX_FRACTION,
  };
  verdicts.designAccepted = verdicts.tubeTurbulent && verdicts.shellTurbulent &&
    verdicts.fAcceptable && verdicts.tubeDpOk && verdicts.shellDpOk && verdicts.areaOk;

  return {
    duty: { qBtuH: q.value, hotMassFlowLbH: hotFluid.massFlowLbH, coldMassFlowLbH: coldFluid.massFlowLbH },
    thermal: { lmtdF: L.value, R: rs.R, S: rs.S, F: F.value, dTmF: dTm.value },
    geometry: { tube, tubeCount, installedAreaFt2: area.value, clearanceIn: cIn, deFt: de.value },
    tubeSide: {
      flowAreaFt2: ap.value, gt: gt.value, velocityFtS: vt.value, re: ret.value,
      hi: hi.value, hio: hio.value, frictionFactor: fT,
      dpFrictionPsi: dpTf.value, dpReturnPsi: dpTr.value, dpTotalPsi: dpT.value,
    },
    shellSide: {
      flowAreaFt2: as.value, gs: gs.value, re: res.value, ho: ho.value,
      frictionFactor: fS, crosses: crosses.value, dpPsi: dpS.value,
    },
    overall: {
      ucBtuHFt2F: uc.value, rdTotal: rd.value, udBtuHFt2F: ud.value,
      areaRequiredFt2: aReq, overdesignPct,
    },
    verdicts,
    traces,
  };
}
