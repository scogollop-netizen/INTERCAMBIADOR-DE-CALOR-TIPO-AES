# Simulador TEMA AES — Intercambiador de Tubo y Coraza (Método de Kern)

Simulador web **100 % estático** (sin backend) de un intercambiador de calor de
tubo y coraza **TEMA tipo AES**, con motor de cálculo validado contra el trabajo
escrito *"Diseño de un intercambiador de calor de carcasa y tubos gasolina–kerosene"*
(Universidad del Atlántico, Transferencia de Calor II).


## Qué hace

- **Panel izquierdo (entradas):** fluidos caliente/frío (presets con fuentes o
  personalizado), temperaturas, caudales (uno puede dejarse vacío y se calcula
  por balance), propiedades, Rd, ΔP máximos, asignación tubos/coraza y toda la
  geometría TEMA AES (DE/BWG de tubo, L, arreglo triangular/cuadrado, paso,
  pasos, Ds, Nt con sugerencia de la Tabla 9, espaciado de deflectores con
  verificación 20–50 % de Ds).
- **Centro:** modelo **3D interactivo** (Three.js): rotar/zoom/desplazar,
  vista completa y **corte longitudinal** con transición animada (GSAP),
  activar/desactivar carcasa, tubos, deflectores y flujo; partículas de ambos
  fluidos con **gradiente de color por temperatura** y sentido de flujo
  (serpentín de n pasos en tubos; zigzag entre deflectores en coraza).
  Debajo, 4 **gráficas dinámicas** (Chart.js): T vs longitud, ΔP vs límites,
  h/U, área instalada vs requerida.
- **Panel derecho:** veredictos de diseño (Re turbulento, F>0.75, ΔP≤máx,
  A≥Areq…), resultados completos con **trazabilidad expandible** (clic en
  cualquier fila → ecuación, sustitución numérica, resultado, unidades,
  significado físico y fuente), y panel **"Propiedades y fuentes"**
  (valor, unidades, T/P de referencia y fuente bibliográfica por propiedad).
- **Botón "Verificar validación":** ejecuta el caso canónico y muestra la
  tabla objetivo-vs-motor con tolerancias (Base de Conocimiento §6–§7).

## Estructura (arquitectura modular, SOLID)

```
index.html                    Estructura (sin lógica)
css/                          tailwind.css (compilado) + styles/components/animations
assets/vendor/                three.module.js, OrbitControls, chart.umd.js, gsap.min.js
js/
├── app.js                    Composition root (única unión de módulos — SOLID-D)
├── events.js                 Formulario → objeto de entrada (SRP)
├── ui.js                     Resultados, trazas, veredictos, propiedades (SRP)
├── graphics/charts.js        Gráficas Chart.js (SRP)
├── models/exchanger3D.js     Modelo 3D Three.js — API init/update/setCutaway (SRP/DIP)
├── utils/                    constants.js, units.js
├── data/                     kernTables.js (Tablas 9/10/12/8), correlations.js
│                             (estrategias intercambiables — SOLID-O/L), fluids.js
├── physics/                  8 módulos puros con traza: energyBalance, lmtd,
│                             geometry, reynolds, filmCoefficients,
│                             overallCoefficient, fouling, pressureDrop
└── services/                 calculationsService (orquestador con metodología
                              inyectada — DIP), validationService (caso canónico)
tests/validation.test.js      node tests/validation.test.js → ✔ VALIDADO
```

**SOLID:** cada archivo tiene una responsabilidad (S); correlaciones, fluidos,
tubos y tipos TEMA se agregan como datos/estrategias sin modificar lo existente
(O); cualquier objeto que cumpla los contratos `FilmCorrelation` /
`FrictionFactorProvider` / `methodology` sustituye a los actuales (L); los
módulos importan solo lo que usan (I); el orquestador y `app.js` dependen de
abstracciones inyectadas, no de implementaciones (D).

## Fidelidad a la fuente prioritaria

Secuencia exacta del método de Kern del trabajo escrito: balance → LMTD/R/S/F
analítico → Tablas 9/10 → lado tubos (ap, Gt, vt, Ret, hi, hio) → lado coraza
(as, De, Gs, Res, ho) → Uc (Ec. 6.38) → Rd → UD → Areq/sobrediseño → ΔP tubos
(fricción Ec. 7.45 + retorno Ec. 7.46) y ΔP coraza (Ec. 7.44, Ds en ft).
φ=1 por defecto (como el trabajo). Los factores de fricción usan ajustes de las
Figs. 26/29 de Kern y aceptan valores manuales (0.00023 / 0.00165 reproducen
las lecturas del trabajo; el botón "Caso de validación" los carga).
Discrepancias documentadas §7.1–§7.9 en `Base_Conocimiento_Simulador_TEMA_AES.md`.

## Desarrollo (opcional)

Solo si se modifican clases de Tailwind: `npm install` y
`npx tailwindcss -i tailwind.input.css -o css/tailwind.css --minify`.
Validación del motor: `node tests/validation.test.js`.
