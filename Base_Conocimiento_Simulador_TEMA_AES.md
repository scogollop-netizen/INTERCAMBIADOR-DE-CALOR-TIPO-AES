# BASE DE CONOCIMIENTO TÉCNICO
## Fundamento Matemático y Físico para el Simulador Web de un Intercambiador de Calor de Tubo y Coraza TEMA Tipo AES

**Rol:** Referencia de ingeniería — Diseño Térmico y Mecánico de Intercambiadores TEMA AES (Método de Kern)
**Propósito:** Base de conocimiento trazable para la implementación posterior de un simulador interactivo. Este documento NO contiene código ni resuelve el problema; organiza ecuaciones, variables, metodología y datos de validación.

---

## 0. JERARQUÍA Y TRATAMIENTO DE LAS FUENTES

### 0.1 Fuente prioritaria (gobierna toda decisión de metodología)

**"Diseño de un intercambiador de calor de carcasa y tubos para el intercambio térmico entre gasolina y kerosene"** — Salome Castellón, Santiago Cogollo, María Camila Pacheco, Víctor Morales. Universidad del Atlántico, Facultad de Ingeniería, Programa de Ingeniería Química, Transferencia de Calor II (2026-1). *[Archivo: Proyecto_final_transferencia_de_calor.pdf]*

Este es **el trabajo escrito que se debe entregar** y **el único documento contra el cual se validará el simulador**. Toda ecuación, correlación, tabla de referencia y secuencia de cálculo implementada en el simulador debe permitir reproducir **exactamente** los resultados numéricos de este trabajo (Sección 6 "Desarrollo de los cálculos" y Sección 8 "Resultados"). Cuando este documento presenta una ecuación en su Sección 4 ("Fundamento teórico") pero usa una forma distinta o simplificada en su Sección 6 ("Desarrollo de los cálculos"), **prevalece siempre lo efectivamente calculado en la Sección 6**, y la diferencia se documenta explícitamente en la Sección 7 de este informe.

**Problema resuelto por la fuente prioritaria:** intercambiador TEMA AES para calentar 150 000 lb/h de kerosene (75→120 °F) enfriando gasolina (160→120 °F), presión de operación 50 psia, ΔP máx. gasolina = 7 psi, ΔP máx. kerosene = 10 psi, factor de ensuciamiento combinado 0.002 h·ft²·°F/Btu. Resultado final: carcasa 29 in DI, 546 tubos de ¾ in DE (16 BWG) de 16 ft, arreglo triangular de 1 in de paso, 6 pasos por tubos, deflectores a 9 in, U_D = 77.76 Btu/h·ft²·°F, área real 1714.5 ft² (40.5 % de sobrediseño respecto al área requerida de 1220.4 ft²), ΔP tubos = 8.58–9.75 psi (ver discrepancia documentada en §7.3), ΔP carcasa = 4.80 psi.

### 0.2 Fuentes complementarias (solo para explicar, justificar o verificar — nunca para sustituir la metodología anterior)

| Fuente | Archivo | Uso en este documento |
|---|---|---|
| Kern, D.Q. — *Process Heat Transfer* / *Procesos de Transferencia de Calor*, ed. en español (31ª reimpr.) | procesos_de_transferencia_de_calor_-_kern__31_ed_.pdf | **Fuente madre de toda la metodología.** Se identificó que el problema de la fuente prioritaria es una adaptación directa del **Ejemplo 7.3 de Kern** ("Cálculo de un intercambiador de kerosena–aceite crudo"), que usa exactamente el mismo procedimiento de 15 pasos + verificación de caída de presión, las mismas Tablas (9, 10, 12) y las mismas Figuras (17, 18, 24, 26, 28, 29). Se usa para verificar el origen exacto, la forma canónica y las condiciones de aplicación de cada ecuación. |
| TEMA Standards, 10ª ed. (2019) | Normas_Tema.pdf | Nomenclatura oficial (Sección 1, Figura N-1.2, Tabla N-2), definición de la designación AES, reglas constructivas generales (Sección 5, RCB). |
| Excel de cálculo intercambiador agua–agua (ejercicio distinto, en SI) | INTERCAMIADOR_DE_C.pdf | Referencia complementaria de estructura de hoja de cálculo (organización de datos de entrada/salida) y de un segundo caso ya resuelto con la misma familia de ecuaciones, útil para contrastar el manejo de unidades SI vs. inglesas. **No se usa para validar el simulador** (es un problema distinto: agua–agua, unidades SI, ΔP en Pa). |
| Apuntes de clase manuscritos (2 documentos) | ECUACIONES_PROYECTO_CALOR_2.pdf, Ecuaciones_calor_2.pdf | Notas de cátedra que resumen la misma metodología de Kern en forma de procedimiento numerado (1–22), útiles para la reconstrucción de la secuencia de cálculo y para la fórmula geométrica del diámetro equivalente. Contienen una **constante de fricción alternativa (7.5×10¹²)** que difiere de la usada en la fuente prioritaria (5.22×10¹⁰) — ver discrepancia documentada en §7.2. |
| ROL / instrucciones del proyecto | PROYECTO_CALOR.pdf | Define el alcance y la estructura de este documento. |

### 0.3 Regla de resolución de conflictos

1. Si la fuente prioritaria calculó algo explícitamente → se usa esa forma exacta, aunque exista una forma "más completa" en la teoría o en Kern.
2. Si la fuente prioritaria menciona una ecuación solo en su marco teórico (Sección 4) pero no la aplica en sus cálculos (Sección 6) → se documenta como "solo teoría" y **no** se usa para la validación numérica, aunque se conserva en la base de conocimiento por si se desea un "modo avanzado" del simulador.
3. Si existe una diferencia entre la fuente prioritaria y Kern (fuente madre) → se investigó el original de Kern (Ejemplo 7.3, Cap. 7) y se documenta cuál forma coincide con cuál, dejando la decisión de implementación a favor de la fuente prioritaria, con la justificación técnica correspondiente.
4. Los documentos complementarios (Excel agua-agua, apuntes manuscritos) **nunca** sustituyen una constante o correlación de la fuente prioritaria; solo sirven para contraste y como fuente de fórmulas geométricas no detalladas explícitamente en el trabajo prioritario (p. ej., la fórmula cerrada del diámetro equivalente).

---

## 1. EL INTERCAMBIADOR TEMA TIPO AES — ESTUDIO TÉCNICO

### 1.1 Designación TEMA y significado del código "AES"

Según la norma TEMA (Sección 1, "Heat Exchanger Nomenclature", Regla N-1.2), todo intercambiador de tubo y coraza se designa con **tres letras**: cabezal delantero (front end) – tipo de coraza (shell type) – cabezal trasero (rear end), en ese orden, conforme a la Figura N-1.2 del estándar. La propia norma trae como **ejemplo típico N-1.3.1** un intercambiador de cabezal flotante tipo anillo partido, con carrete y tapa removibles, coraza de un paso, 23¼ in DI y tubos de 16 ft — descrito literalmente como **"TYPE AES"**. Esto confirma de forma directa (Figura N-2 del estándar, rotulada explícitamente "AES") que:

| Posición | Letra | Componente TEMA | Significado constructivo |
|---|---|---|---|
| 1ª (cabezal delantero) | **A** | *Channel and Removable Cover* (carrete con tapa removible) | Cabezal estacionario tipo canal, con tapa desmontable independiente del carrete. Permite inspeccionar/limpiar el lado de tubos sin desconectar la tubería de proceso del carrete. |
| 2ª (tipo de coraza) | **E** | *One-Pass Shell* (coraza de un paso) | El fluido de coraza entra por una boquilla y sale por otra, recorriendo la longitud una sola vez (configuración más simple y económica; es la base de la ecuación de LMTD con factor de corrección F). |
| 3ª (cabezal trasero) | **S** | *Floating Head with Backing Device* (cabezal flotante con dispositivo de respaldo, tipo "split-ring") | El espejo trasero **no** está soldado a la coraza: se desliza axialmente dentro de una carcasa de cabezal flotante y queda sujeto por un anillo partido (split ring) y un anillo de respaldo. Permite la **extracción completa del haz de tubos** para limpieza mecánica y absorbe la expansión térmica diferencial entre tubos y coraza. |

**Por qué AES para este servicio (justificación técnica, según la fuente prioritaria y la norma):** el AES es el estándar de facto en refinación e hidrocarburos porque (a) el haz de tubos es 100 % removible, indispensable cuando alguno de los fluidos de proceso (gasolina, kerosene, crudos) tiende a formar incrustaciones orgánicas; y (b) el cabezal flotante desacopla mecánicamente la dilatación térmica de los tubos respecto a la coraza, evitando los esfuerzos que sí aparecen en un intercambiador de tubos fijos (tipo "L/M/N") cuando ΔT entre coraza y tubos es alto.

### 1.2 Componentes principales (Tabla N-2 del estándar TEMA, Figura N-2)

La norma numera 40 partes típicas; las relevantes para el tipo AES y para la representación visual del simulador son:

| # TEMA | Componente | Rol en el AES | Relevancia para el simulador |
|---|---|---|---|
| 1 | Cabezal estacionario – Carrete (*Channel*) | Aloja la entrada/salida del fluido de tubos; contiene los pasos si n>1 | Animable: mostrar flujo entrando/saliendo, dividido en pasos |
| 3 | Brida del cabezal estacionario | Une carrete a espejo/coraza | Geométrico, estático |
| 4 | Tapa del carrete (*Channel Cover*) | Removible — acceso para limpieza de tubos | Visual: puede "abrirse" en animación educativa |
| 5 | Boquilla del cabezal estacionario | Entrada/salida de fluido de tubos | Entrada de usuario (diámetro de boquilla, Tabla 5.3 TEMA) |
| 6 | Espejo estacionario (*Stationary Tubesheet*) | Placa perforada que sostiene y sella los extremos fijos de los tubos | Geométrico — define patrón de tubos (pitch, arreglo) |
| 7 | **Tubos** | Superficie primaria de transferencia de calor | Núcleo del modelo térmico e hidráulico (Di, Do, BWG, L, número, arreglo) |
| 8 | **Coraza** (*Shell*) | Contiene el fluido de coraza y el haz de tubos | Define Ds, geometría de flujo cruzado |
| 12 | Boquillas de coraza | Entrada/salida fluido de coraza | Entrada de usuario |
| 15 | Espejo flotante (*Floating Tubesheet*) | Extremo móvil del haz — no fijo a la coraza | Habilita expansión térmica libre |
| 16 | Tapa del cabezal flotante (*Floating Head Cover*) | Cierra el extremo flotante; redirige el fluido de tubos entre pasos | Define geometría de retorno (pérdida por retorno ΔPr) |
| 18 | Dispositivo de respaldo del cabezal flotante (*Backing Device*) | Anillo partido + contrabrida — la "S" de AES | Diferenciador constructivo (no afecta cálculo térmico, sí mantenimiento) |
| 27 | Tirantes y espaciadores (*Tierods and Spacers*) | Sostienen la posición axial de los deflectores | Geométrico/estructural |
| 28 | **Deflectores transversales / placas de soporte** (*Baffles*) | Dirigen el fluido de coraza en flujo cruzado; soportan los tubos contra vibración | Parámetro clave del modelo hidráulico de coraza (B, corte de deflector, número de cruces N+1) |
| 31 | Partición de pasos (*Pass Partition*) | Divide el carrete para forzar múltiples pasos por tubos | Define número de pasos n (parámetro de diseño crítico) |

### 1.3 Configuración física y principio de funcionamiento

En el AES, el fluido de tubos entra por una boquilla del carrete (1), atraviesa el primer grupo de tubos, es redirigido por la tapa del cabezal flotante (16) —o por la partición de pasos, si hay más de dos pasos— y regresa por el resto de los tubos hacia la boquilla de salida del carrete. El fluido de coraza entra perpendicularmente al haz por una boquilla de coraza, es forzado por los deflectores transversales (28) a seguir una trayectoria en zigzag (flujo cruzado alternado), maximizando la turbulencia y el coeficiente de película externo, y sale por la boquilla opuesta. Los dos fluidos **nunca se mezclan**; el calor se transfiere por conducción a través de la pared metálica de cada tubo. La configuración térmica resultante (una coraza – *n* pasos de tubos) no es contracorriente pura, de ahí la necesidad del factor de corrección F sobre la LMTD (§4.2).

### 1.4 Parámetros geométricos, térmicos e hidráulicos que definen un AES

*(ver clasificación completa y exhaustiva en la Sección 3)*

- **Geométricos:** diámetro interno de coraza (Ds), diámetro externo/interno de tubo (Do, Di), calibre BWG, longitud de tubo (L), número de tubos (Nt), arreglo (triangular/cuadrado), paso entre tubos (Pt), número de pasos por tubos (n), espaciado de deflectores (B), corte de deflector (%), diámetro de boquillas.
- **Térmicos:** temperaturas de entrada/salida de ambos fluidos, carga térmica (Q), LMTD, factor F, ΔTm, coeficientes de película (hi, ho), coeficiente global limpio (Uc) y de diseño (UD), factores de ensuciamiento (Rdi, Rdo).
- **Hidráulicos:** velocidades másicas (Gt, Gs), número de Reynolds (Ret, Res), factores de fricción (ft, fs), caídas de presión (ΔPtubos, ΔPcarcasa), número de cruces (N+1).

### 1.5 Limitaciones y aplicaciones típicas del tipo AES

- **Limitación de presión de coraza:** el cabezal flotente con anillo partido limita la presión de diseño de coraza (típicamente hasta ~300–600 psi según tamaño, frente a diseños "pull-through" tipo T que sacrifican área por facilidad de extracción, o tipo fijo N que resisten mayor presión pero no permiten limpieza mecánica externa de tubos).
- **Costo:** más caro que un intercambiador de tubos fijos (tipo N/L/M) por la complejidad mecánica del cabezal flotante, pero se justifica cuando el ensuciamiento (fouling) de cualquiera de los dos fluidos requiere limpieza mecánica periódica — exactamente el caso de corrientes de refinería como gasolina y kerosene, que forman depósitos orgánicos.
- **Aplicación característica:** intercambio líquido–líquido o líquido–vapor en refinación, petroquímica, y procesos donde ambas corrientes requieren limpieza periódica y hay expansión térmica diferencial relevante (ΔT grande entre fluido de coraza y de tubos, o materiales de coraza/tubos con distinto coeficiente de expansión).
- **Restricción de diseño relevante para el simulador:** el espaciado de deflectores (B) debe mantenerse dentro de un rango que equilibre turbulencia (para h alto) y caída de presión (para no exceder el ΔP máximo permitido) — la fuente prioritaria fija esta regla entre 20 % y 50 % de Ds (ver §4.7 y nota TEMA en §7.4 sobre el valor mínimo real de la norma).

---

## 2. METODOLOGÍA GENERAL DE CÁLCULO — MÉTODO DE KERN

### 2.1 Procedimiento de referencia (Kern, Capítulo 7 — "Intercambiadores de tubo y coraza: flujo 1-2 contracorriente-paralelo")

Se verificó en la fuente madre (Kern, Cap. 7) que el problema resuelto por la fuente prioritaria es una **variación directa del Ejemplo 7.3 de Kern** ("Cálculo de un intercambiador de kerosena–aceite crudo": 43 800 lb/h de kerosene 42°API de 390→200 °F enfriada por 149 000 lb/h de crudo 34°API de 100→170 °F). Kern presenta el procedimiento oficial de verificación/diseño de un intercambiador 1-2 en 15 pasos térmicos + verificación de caída de presión, que se reproduce aquí íntegro porque es la plantilla exacta que la fuente prioritaria siguió (con las omisiones documentadas en §2.3):

**Bloque térmico (columna coraza ' / columna tubos, según Kern):**

1. Balance de calor: Q = WC(T₁−T₂) = wc(t₂−t₁)
2. Diferencia verdadera de temperatura: MLDT (Ec. 5.14), R, S, At = MLDT × F_T (Fig. 18 o forma analítica) — Ec. (7.42)
3. Temperaturas calóricas Tc, tc (Ec. 5.28, 5.29, con Fc de Fig. 17) — **paso que la fuente prioritaria omite** (ver §2.3)
4. Área de flujo: aₛ (coraza, Ec. 7.1) / aₜ (tubos, Ec. 7.48)
5. Velocidad másica: Gₛ = W/aₛ / Gₜ = w/aₜ (Ec. 7.2)
6. Diámetro equivalente De (coraza, Fig. 28 o Ec. 7.4) / diámetro interno D (tubos, Tabla 10); cálculo de Re
7. Factor de transferencia jH (coraza: Fig. 28; tubos: Fig. 24)
8. Propiedades a la temperatura calórica: c, k, (cp·μ/k)^(1/3)
9. Coeficiente de película: ho = jH(k/De)(cp·μ/k)^(1/3)φₛ (Ec. 6.15b) / hi = jH(k/D)(cp·μ/k)^(1/3)φₜ (Ec. 6.15a)
10. Temperatura de pared del tubo tw (Ec. 5.31) — **paso que la fuente prioritaria omite**
11. Obtener μw y φ = (μ/μw)^0.14 (Fig. 24, inserto) — **paso que la fuente prioritaria omite (asume φ=1)**
12. Coeficiente corregido por viscosidad de pared: ho·φₛ / hio = hi(Di/Do)·φₜ (Ec. 6.36, 6.37)
13. Coeficiente total limpio: Uc = hio·ho/(hio+ho) — Ec. (6.38)
14. Coeficiente total de diseño: UD = Q/(A·ΔTm), con A tomada de la geometría seleccionada (Tabla 10, a″)
15. Factor de obstrucción resultante: Rd = (Uc−UD)/(Uc·UD) — Ec. (6.13); se compara contra el Rd requerido (Tabla 12)

**Bloque de caída de presión:**

1'. f del lado de coraza (Fig. 29) / f del lado de tubos (Fig. 26), ambos en función de Re obtenido en el paso 6
2'. Número de cruces N+1 = 12L/B (Ec. 7.43) / ΔPt = f·Gt²·L·n /(5.22×10¹⁰·D·s·φ) (Ec. 7.45)
3'. ΔPs = f·Gs²·Ds·(N+1)/(5.22×10¹⁰·De·s·φ) (Ec. 7.44) / ΔPr = (4n/s)(V²/2g′) (Ec. 7.46, retorno en cabezales — Fig. 27)
4'. ΔP total = ΔPfricción + ΔPretorno (Ec. 7.47); se compara contra el ΔP máximo permitido

Este es el procedimiento **completo** de Kern. Es la referencia madre de toda ecuación citada en este documento.

### 2.2 Secuencia de cálculo efectivamente aplicada por la fuente prioritaria (Sección 6 del trabajo)

```
Datos de operación conocidos (T,t entrada/salida, Cp, μ, k, s, Pr, ΔPmax, Rd)
        │
        ▼
(6.1) Balance de energía → Q y caudal faltante (gasolina, W)
        │
        ▼
(6.2) Selección tipo TEMA (AES) y supuestos geométricos
      · Tubos 3/4" DE, 16 BWG, acero al carbono
      · L = 16 ft (decisión de diseño, controla ΔP tubos)
      · Arreglo triangular, paso 1"
        │
        ▼
(6.3) U_D inicial estimado (tabla de valores típicos Kern, servicio aceites ligeros) = 25 Btu/h·ft²·°F
        │
        ▼
(6.4) LMTD, R, S, F (forma analítica cerrada) → ΔTm = F×LMTD
        │
        ▼
(6.5) Selección de dimensiones con Tabla 9 y Tabla 10 de Kern
      · Di, at' (área de flujo/tubo), a'' (superficie externa/pie) — Tabla 10
      · Ds = 29 in, Nt = 546 tubos, 6 pasos — Tabla 9 (forzando turbulencia en tubos)
      → Área real instalada A = Nt·L·a''
        │
        ▼
(6.6) Análisis lado tubos (kerosene): ap, Gt, vt, Ret, hi, hio (φ=1)
        │
        ▼
(6.7) Análisis lado carcasa (gasolina): B asumido, as, De (Fig./Tabla Kern), Gs, Res, ho (φ=1)
        │
        ▼
(6.8) Coeficientes globales: Uc = hio·ho/(hio+ho);  Rd (Tabla 12);  UD = 1/(1/Uc + Rd)
        │
        ▼
(6.9) Comparación de áreas: A_requerida = Q/(UD·ΔTm)  vs.  A_real (geometría)
      → % de sobrediseño
        │
        ▼
(6.10) Verificación rigurosa de caída de presión
      · Tubos: f (Fig. 26) → ΔPfricción + ΔPretorno ≤ ΔPmax kerosene (10 psi)
      · Carcasa: N+1, f (Fig. 29) → ΔPfricción ≤ ΔPmax gasolina (7 psi)
        │
        ▼
(7-8) Diseño final aceptado (ambas restricciones cumplidas) → tabla de resultados
```

Este flujo es el que **debe implementar el simulador** para reproducir exactamente los resultados de la fuente prioritaria. No incluye iteración explícita porque, en este caso particular, la primera selección geométrica (Ds=29in, Nt=546, 6 pasos, L=16ft, B=9in) satisfizo simultáneamente el área requerida y ambos límites de ΔP; el simulador **sí** debe soportar iteración (cambiar B, L, número de pasos, Ds/Nt) como lo indica la propia fuente prioritaria en su Sección 5.9–5.11 ("en caso de presentarse diferencias significativas, se ajustaron las dimensiones preliminares").

### 2.3 Simplificaciones de la fuente prioritaria respecto al procedimiento completo de Kern

Documentadas aquí porque son la diferencia exacta entre "teoría" (Sección 4 del trabajo, o Kern íntegro) y "lo efectivamente calculado" (Sección 6 del trabajo) — ver también Sección 7 de este documento para el detalle de cada una y su justificación:

1. **Paso 3 de Kern (temperaturas calóricas Tc, tc) — omitido.** La fuente prioritaria no calcula temperaturas calóricas. Esto es **consistente y justificado** por el enunciado del propio problema (Sección 3 del trabajo: *"las propiedades termofísicas de ambos fluidos pueden asumirse constantes e iguales a los valores suministrados"*): si Cp, μ, k, Pr no varían con la temperatura, el método de temperatura calórica (diseñado precisamente para compensar esa variación) es innecesario. **No es un error, es una consecuencia del enunciado.**
2. **Pasos 10–12 de Kern (temperatura de pared tw, μw y corrección de viscosidad φ=(μ/μw)^0.14) — omitidos, φ tomado como 1.** Esto **sí** es una simplificación explícita reconocida por los propios autores ("Asumiendo φ = 1"). Reduce ligeramente la precisión de hi y ho pero es una práctica común cuando no se dispone de la temperatura de pared o cuando ambos fluidos tienen viscosidades similares (ver §7.1 para el impacto esperado).
3. **Paso 15 de Kern / Ec. 6.38 (Uc = hio·ho/(hio+ho)) — usado tal cual, sin término de conducción de pared.** Se verificó contra Kern (Ejemplo 7.3, misma ecuación 6.38) que esta es efectivamente **la forma oficial** que Kern usa en este procedimiento, no una simplificación de la fuente prioritaria. La forma "completa" con el término de conducción (do/(hi·Di) + do·ln(do/Di)/(2kt) + 1/ho), presentada en la Sección 4.4 del trabajo como fundamento teórico general, es una formulación de libro de texto (Incropera/Çengel) para el caso general; Kern la reduce a la forma de dos resistencias cuando la resistencia de pared es despreciable frente a las películas convectivas (tubo metálico delgado, alta conductividad). **Ambas ecuaciones son correctas; el simulador debe usar la forma de Kern (dos resistencias) para la validación, y puede ofrecer la forma completa como opción avanzada.**
4. **"Área provisional" (A = Q/(U·F·ΔTlm), paso intermedio presente en los apuntes de clase y en el Excel complementario) — no se muestra como cifra explícita en el trabajo.** El valor de UD=25 inicial se usa como criterio cualitativo para fijar 6 pasos (forzar turbulencia) y consultar directamente la Tabla 9 de Kern, sin mostrar el cálculo intermedio de área provisional. El área real (1714.5 ft²) surge directamente de la geometría de catálogo elegida, y solo se compara al final contra el área requerida ya con el U_D final (77.76), no con el U_D inicial estimado (25).

---

## 3. CLASIFICACIÓN DE VARIABLES DEL SISTEMA

### 3.1 Variables de entrada (definidas por el usuario / enunciado del problema)

| Variable | Símbolo | Valor en la fuente prioritaria | Unidad (Inglés/SI) | Categoría |
|---|---|---|---|---|
| Flujo másico fluido frío (tubos) | w | 150 000 | lb/h · (kg/s) | Operación |
| Temp. entrada fluido frío | t₁ | 75 | °F · (°C) | Operación |
| Temp. salida fluido frío (objetivo) | t₂ | 120 | °F · (°C) | Operación |
| Cp fluido frío | cₚc | 0.48 | Btu/(lb·°F) · (J/kg·K) | Propiedad física |
| μ fluido frío | μc | 1.50 | cP | Propiedad física |
| k fluido frío | kc | 0.081 | Btu/(h·ft·°F) | Propiedad física |
| Gravedad específica fluido frío | sc | 0.82 | adimensional | Propiedad física |
| Pr fluido frío | Prc | 21.5 | adimensional | Propiedad física |
| Temp. entrada fluido caliente | T₁ | 160 | °F | Operación |
| Temp. salida fluido caliente | T₂ | 120 | °F | Operación |
| Cp fluido caliente | cₚh | 0.55 | Btu/(lb·°F) | Propiedad física |
| μ fluido caliente | μh | 0.45 | cP | Propiedad física |
| k fluido caliente | kh | 0.087 | Btu/(h·ft·°F) | Propiedad física |
| Gravedad específica fluido caliente | sh | 0.74 | adimensional | Propiedad física |
| Pr fluido caliente | Prh | 6.88 | adimensional | Propiedad física |
| Presión de operación | P | 50 | psia | Operación |
| ΔP máximo permitido, lado caliente | ΔPmax,h | 7 | psi | Restricción |
| ΔP máximo permitido, lado frío | ΔPmax,c | 10 | psi | Restricción |
| Factor de ensuciamiento, cada fluido | Rdi, Rdo | 0.001 c/u | h·ft²·°F/Btu | Restricción de diseño |
| Diámetro externo de tubo (elegido) | Do | 3/4 | in | Geométrica (selección catálogo) |
| Calibre de tubo | BWG | 16 | — | Geométrica (selección catálogo, Tabla 10 Kern) |
| Longitud de tubo | L | 16 | ft | Geométrica (decisión de diseño) |
| Arreglo de tubos | — | Triangular | — | Geométrica |
| Paso entre tubos | Pt | 1 | in | Geométrica |
| Número de pasos por tubos | n | 6 | — | Geométrica (decisión de diseño) |
| Espaciado de deflectores | B | 9 | in | Geométrica (decisión de diseño) |
| Material de tubo | — | Acero al carbono | — | Restricción constructiva |

### 3.2 Variables intermedias (calculadas dentro del flujo, no mostradas como resultado final pero necesarias)

Carga térmica Q; caudal faltante W; ΔT₁, ΔT₂; LMTD; R; S; F; ΔTm; U_D inicial estimado; Nt (número de tubos, de catálogo); Di (diámetro interno de tubo, de catálogo); a't (área de flujo por tubo); a″ (superficie externa por pie); área de flujo por tubos (ap); velocidad másica de tubos (Gt); velocidad lineal de tubos (vt); Reynolds de tubos (Ret); coeficiente de película interno (hi); coeficiente referido a diámetro externo (hio); espacio libre entre tubos (C′); área de flujo transversal de coraza (as); diámetro equivalente (De); velocidad másica de coraza (Gs); Reynolds de coraza (Res); coeficiente de película externo (ho); factor de fricción de tubos (ft) y de coraza (fs); número de cruces (N+1).

### 3.3 Variables de salida (resultados finales que el simulador debe reportar)

Coeficiente global limpio (Uc); coeficiente global de diseño (UD); área real instalada (A); área requerida (Areq); porcentaje de sobrediseño; ΔP tubos (fricción + retorno, total); ΔP carcasa (total); veredicto de cumplimiento de cada restricción (Re turbulento, ΔP ≤ ΔPmax, A_real ≥ A_req).

### 3.4 Clasificación cruzada — geométricas / térmicas / hidráulicas / propiedades / operación

| Categoría | Variables |
|---|---|
| **Geométricas** | Ds, Do, Di, BWG, L, Nt, arreglo, Pt, n (pasos tubos), B (espaciado deflectores), corte de deflector, N+1 (cruces), diámetro de boquillas |
| **Térmicas** | T₁,T₂,t₁,t₂, Q, LMTD, R, S, F, ΔTm, hi, hio, ho, Uc, UD, Rd |
| **Hidráulicas** | ap, as, Gt, Gs, vt, Res, Ret, ft, fs, De, ΔPtubos, ΔPcarcasa, ΔPmax |
| **Propiedades físicas** | ρ (o s), Cp, μ, k, Pr (para cada fluido, a la temperatura de referencia usada) |
| **Variables de operación** | w, W (caudales), presión de operación, temperaturas de entrada (dato fijo del proceso) |
| **Variables dependientes** | Todo lo calculado a partir de las anteriores: Q, LMTD, F, Re, h, U, ΔP, %sobrediseño |
| **Variables independientes** | Caudales, temperaturas de entrada/salida objetivo, propiedades físicas, geometría elegida por el diseñador (Do, BWG, L, arreglo, Pt, n, B, Ds/Nt) |

---

## 4. BASE DE ECUACIONES (en el orden exacto de la secuencia de cálculo)

> Convención de esta sección: cada ecuación se presenta con nombre, fórmula, variables, significado físico, unidades, restricciones/supuestos, origen (procedencia exacta), etapa de diseño, entradas→salida, y **Estado de uso**, que puede ser: **[USADA]** (aplicada literalmente en la fuente prioritaria), **[USADA-SIMPLIFICADA]** (aplicada con una simplificación explícita respecto a la forma completa) o **[SOLO TEORÍA]** (aparece en el marco teórico de la fuente prioritaria o en Kern pero no se aplicó en los cálculos — se conserva para un eventual modo avanzado del simulador).

### 4.1 Balance de energía y carga térmica

**Ecuación 4.1.1 — Balance de energía global**
- Fórmula: ṁ_h·Cp_h·(T₁−T₂) = ṁ_c·Cp_c·(t₂−t₁) = Q
- Variables: ṁ_h, ṁ_c = flujo másico caliente/frío [lb/h]; Cp_h, Cp_c = calor específico [Btu/(lb·°F)]; T₁,T₂ = temp. entrada/salida fluido caliente; t₁,t₂ = temp. entrada/salida fluido frío [°F]; Q = carga térmica [Btu/h]
- Significado físico: primera ley de la termodinámica aplicada a un intercambiador adiabático hacia el exterior — todo el calor cedido por el fluido caliente es absorbido por el frío (no hay cambio de fase, no hay pérdidas al ambiente).
- Unidades: Sistema inglés de ingeniería (Btu, lb, h, °F) en la fuente prioritaria; en SI equivalente: W = kg/s · J/(kg·K) · K.
- Restricciones/supuestos: fluidos de una sola fase (sensible, sin cambio de fase); Cp constante en el rango de operación (consistente con el enunciado del problema); sin pérdidas de calor a través de la coraza (proceso adiabático hacia el exterior).
- Origen: primer principio de conservación de energía; forma explícita en Kern, Cap. 6-7 (Ec. base del balance de calor, paso 1 del procedimiento, Ejemplo 7.3).
- Etapa de diseño: primer paso, previo a cualquier cálculo geométrico o de transferencia.
- Entradas → Salida: {ṁ conocido de un fluido, Cp de ambos, T y t completas de un fluido, T o t parcial del otro} → {Q, caudal faltante del segundo fluido}.
- Estado de uso: **[USADA]** — Sección 6.1 de la fuente prioritaria: Q = 150000×0.48×(120−75) = 3 240 000 Btu/h; W = Q/[0.55×(160−120)] = 147 273 lb/h.

### 4.2 Diferencia media logarítmica de temperatura (LMTD) y factor de corrección F

**Ecuación 4.2.1 — LMTD**
- Fórmula: LMTD = (ΔT₂ − ΔT₁) / ln(ΔT₂/ΔT₁), con ΔT₁ = T₁−t₂ (extremo de "salida fría"), ΔT₂ = T₂−t₁ (extremo de "salida caliente"), según la convención de la fuente prioritaria (a contracorriente).
- Variables: T₁,T₂,t₁,t₂ como en 4.1.1; ΔT₁, ΔT₂ = diferencias de temperatura en cada extremo del intercambiador [°F]
- Significado físico: fuerza motriz térmica promedio efectiva para un arreglo a contracorriente pura, derivada de integrar Q=U·A·ΔT a lo largo del intercambiador asumiendo U constante.
- Unidades: °F (Inglés) / °C o K (SI); el resultado es adimensional en la razón interna del logaritmo.
- Restricciones/supuestos: U constante a lo largo del equipo; sin cambio de fase; representa flujo a contracorriente pura — por eso requiere el factor F para configuraciones multipaso.
- Origen: Kern, Ec. (5.14); derivación clásica de balance diferencial de calor en contracorriente.
- Etapa de diseño: inmediatamente después del balance de energía.
- Entradas → Salida: {T₁,T₂,t₁,t₂} → {LMTD}.
- Estado de uso: **[USADA]** — Sección 6.4: ΔT1=40 °F, ΔT2=45 °F, LMTD=42.44 °F.

**Ecuación 4.2.2 — Parámetros adimensionales R y S**
- Fórmula: R = (T₁−T₂)/(t₂−t₁); S = (t₂−t₁)/(T₁−t₁)
- Variables: como arriba; R = relación de capacidades caloríficas (adimensional); S = eficiencia térmica / relación de temperatura (adimensional, 0<S<1)
- Significado físico: R compara el "gasto calorífico" (ṁCp) del fluido caliente frente al frío (R = w_c·Cp_c/(w_h·Cp_h) equivalentemente); S mide qué tan cerca está el fluido frío de alcanzar la temperatura de entrada del caliente (grado de aproximación térmica).
- Unidades: adimensional.
- Restricciones/supuestos: definición válida para el arreglo de referencia (coraza 1 paso / tubos multipaso); el orden de las temperaturas en la fórmula debe respetar la convención fluido caliente=T, fluido frío=t.
- Origen: Kern, Ec. equivalentes a (7.42)/Fig. 18; TEMA/estándar clásico de intercambiadores 1-2 (Bowman, Mueller, Nagle 1940).
- Etapa de diseño: previo al cálculo de F.
- Entradas → Salida: {T₁,T₂,t₁,t₂} → {R, S}.
- Estado de uso: **[USADA]** — Sección 6.4: R=0.8889, S=0.5294.

**Ecuación 4.2.3 — Factor de corrección de temperatura F (forma analítica cerrada)**
- Fórmula: F = [√(R²+1)·ln((1−S)/(1−R·S))] / [(R−1)·ln( (2−S(R+1−√(R²+1))) / (2−S(R+1+√(R²+1))) )]
- Variables: R, S como arriba; F = factor de corrección adimensional (0<F≤1)
- Significado físico: corrige la LMTD (calculada como si fuera contracorriente pura) para tener en cuenta que en una configuración real de 1 coraza/2·k tubos el flujo es una combinación de corriente paralela y contracorriente. F=1 es contracorriente ideal; F cae rápidamente cuando hay "cruce de temperaturas" (T₂ < t₂, por ejemplo).
- Unidades: adimensional.
- Restricciones/supuestos: válida específicamente para **1 paso de coraza y 2, 4, 6… pasos de tubos** (que es exactamente el caso AES con n par); se recomienda F > 0.75 como criterio de aceptabilidad práctica de diseño (evita ΔTm excesivamente penalizada, indicando que se necesitarían más pasos de coraza).
- Origen: fórmula analítica de Bowman-Mueller-Nagle (1940), equivalente algebraico exacto de la lectura gráfica de la Fig. 18 de Kern / TEMA (a) "Un paso por la coraza y 2, 4, 6… pasos por los tubos" — ver gráfico reproducido en los apuntes de clase complementarios (Çengel, Fig. 11.18a).
- Etapa de diseño: inmediatamente después de LMTD.
- Entradas → Salida: {R, S} → {F}.
- Estado de uso: **[USADA]** — Sección 6.4: F=0.8045 (>0.75, cumple criterio de aceptación). **Nota de implementación:** la fuente prioritaria eligió deliberadamente la forma **analítica** en vez de leer F en el gráfico (Fig. 18 de Kern), lo cual es preferible para un simulador computacional porque evita depender de la interpolación visual de una carta. Esta es la forma que debe implementar el simulador.

**Ecuación 4.2.4 — Diferencia de temperatura verdadera (fuerza motriz corregida)**
- Fórmula: Q = U·A·ΔTm, con ΔTm = F × LMTD
- Variables: Q [Btu/h]; U [Btu/(h·ft²·°F)]; A [ft²]; ΔTm [°F]
- Significado físico: ecuación de diseño fundamental del intercambiador — relaciona la carga térmica con el área de transferencia, el coeficiente global y la fuerza motriz térmica real.
- Unidades: Inglés (Btu/h, ft², °F) o SI (W, m², K) de forma consistente.
- Restricciones/supuestos: U asumido constante en toda el área (o evaluado a temperatura calórica si se aplica esa refinación — no es el caso aquí).
- Origen: ecuación general de diseño térmico, Kern Ec. (6.1)/(7.49); universal en la literatura (Incropera, Çengel).
- Etapa de diseño: eje central de todo el procedimiento — se usa dos veces: (a) para estimar el área requerida con el U inicial asumido, y (b) al final, para verificar el área requerida con el U calculado real.
- Entradas → Salida: {Q, U, ΔTm} → {A} (o inversamente {Q,U,A}→{ΔTm} para verificación).
- Estado de uso: **[USADA]** — es la ecuación marco de toda la Sección 4.1 y 6.9 de la fuente prioritaria.

### 4.3 Temperaturas calóricas (marco teórico — no aplicado en el trabajo prioritario)

**Ecuación 4.3.1 — Temperatura calórica**
- Fórmula: Tc = T₂ + Fc(T₁−T₂); tc = t₁ + Fc(t₂−t₁), donde Fc ("fracción calórica") se obtiene de una carta (Fig. 17 de Kern) en función de (Kc, ΔT_extremo_caliente/ΔT_extremo_frío), y Kc es el "factor calórico" que mide cuánto varía U a lo largo del equipo.
- Variables: Tc, tc = temperaturas calóricas del fluido caliente/frío [°F]; Fc = fracción calórica [adimensional, 0–1]
- Significado físico: en servicios donde la viscosidad (y por tanto h, y por tanto U) varía fuertemente con la temperatura, evaluar las propiedades en el promedio aritmético de temperaturas produce error. La temperatura calórica es el punto en el que evaluar las propiedades da un U "puntual" igual al U integrado sobre toda la superficie.
- Unidades: °F.
- Restricciones/supuestos: solo relevante cuando U varía significativamente con T (típico de fracciones pesadas de petróleo, no de líquidos con propiedades cuasi-constantes).
- Origen: Kern, Ec. (5.28), (5.29), Fig. 17; paso 3 del procedimiento de 15 pasos (§2.1).
- Etapa de diseño: entre el cálculo de F y el cálculo de coeficientes de película (evaluación de propiedades).
- Entradas → Salida: {T₁,T₂,t₁,t₂, Kc} → {Tc, tc}.
- Estado de uso: **[SOLO TEORÍA]** — mencionado en la Sección 4.2 de la fuente prioritaria como fundamento conceptual, pero explícitamente no calculado: el enunciado del problema fija propiedades constantes, por lo que Tc=tc=condición de referencia dada. **Se recomienda incluir este módulo en el simulador como "modo avanzado / propiedades variables", mas no se usa para la validación contra la fuente prioritaria.**

### 4.4 Selección geométrica preliminar (datos de catálogo — Tablas 9 y 10 de Kern)

**Dato geométrico 4.4.1 — Características de tubo (Tabla 10 de Kern / TEMA)**
- Contenido: para cada combinación (Do, BWG) la Tabla 10 tabula: diámetro interno Di [in], espesor de pared [in], área de flujo interna por tubo a't [in²], superficie externa por pie lineal a″ [ft²/ft], superficie interna por pie lineal, peso por pie lineal [lb/ft].
- Valores usados por la fuente prioritaria (tubo 3/4 in DE, 16 BWG): Di = 0.620 in, a't = 0.302 in², a″ = 0.1963 ft²/ft (valores verificados exactamente contra la Tabla 10 original de Kern, ver Anexo A).
- Significado físico: son propiedades geométricas fijas de fabricación de tubería estándar para intercambiadores (no de tubería de proceso IPS).
- Unidades: pulgadas, ft²/ft.
- Restricciones/supuestos: valores estandarizados por fabricantes de tubo para condensadores/intercambiadores; el calibre BWG define el espesor de pared, no el diámetro externo (que se mantiene fijo por tamaño nominal).
- Origen: Tabla 10 del Apéndice de Kern (idéntica en función a la Tabla TEMA de tubos).
- Etapa de diseño: selección preliminar de geometría, antes de calcular área.
- Entradas → Salida: {Do, BWG (elegidos por el diseñador)} → {Di, a't, a″}.
- Estado de uso: **[USADA]** — Sección 6.5.

**Dato geométrico 4.4.2 — Disposición de espejos / cuenta de tubos (Tabla 9 de Kern)**
- Contenido: para cada diámetro de coraza (Ds) y cada combinación de diámetro de tubo/arreglo/paso, tabula el número máximo de tubos (Nt) que caben para 1, 2, 4, 6 y 8 pasos.
- Valor usado: Ds = 29 in, tubos 3/4 in en arreglo triangular de 1 in de paso, 6 pasos → Nt = 546.
- Significado físico: encapsula, mediante conteo geométrico real (con tolerancias de fabricación, espacio para pasadores de partición, zona de borde de coraza), la capacidad real de tubos de una coraza — evita tener que derivar geométricamente el empaquetamiento de círculos con reglas TEMA de tolerancia.
- Unidades: adimensional (conteo), Ds en pulgadas.
- Restricciones/supuestos: los valores son específicos del arreglo (triangular/cuadrado), paso y número de pasos; a mayor número de pasos, menor Nt (se pierde espacio por particiones).
- Origen: Tabla 9 del Apéndice de Kern, construida según normas mecánicas TEMA de tolerancia de perforado.
- Etapa de diseño: selección preliminar de geometría — determina simultáneamente Ds y Nt.
- Entradas → Salida: {Do, arreglo, Pt, n (pasos deseados), restricción de velocidad/Re} → {Ds, Nt}.
- Estado de uso: **[USADA]** — Sección 6.5: *"Se requiere forzar la velocidad en los tubos a través de 6 pasos… seleccionamos una carcasa de 29 pulgadas… Nt=546 tubos"*. **Nota de implementación:** para el simulador, esta tabla debe digitalizarse como una base de datos de consulta (lookup table) indexada por (Do, BWG-implícito-en-paso, arreglo, Pt, n) → (Ds, Nt), replicando el catálogo real de Kern/TEMA, en vez de una fórmula analítica de empaquetamiento (que sobreestimaría Nt al no incluir tolerancias constructivas).

**Ecuación 4.4.3 — Área de transferencia real instalada**
- Fórmula: A = Nt · L · a″
- Variables: Nt = número de tubos; L = longitud de tubo [ft]; a″ = superficie externa por pie lineal [ft²/ft]; A = área total [ft²]
- Significado físico: área externa total disponible para transferencia de calor, con base en la superficie externa de los tubos (convención estándar en intercambiadores tubo-coraza, ya que casi siempre se diseña con área externa como referencia).
- Unidades: ft² (Inglés) / m² (SI).
- Restricciones/supuestos: asume toda la longitud de tubo entre espejos como efectiva (sin descuento por zona ocupada en el espejo).
- Origen: geometría directa (Kern, relación implícita en el cálculo de a″).
- Etapa de diseño: inmediatamente después de fijar Nt y L.
- Entradas → Salida: {Nt, L, a″} → {A}.
- Estado de uso: **[USADA]** — Sección 6.5: A = 546×16×0.1963 = 1714.5 ft².

### 4.5 Área provisional con U estimado inicial (paso intermedio, complementario)

**Ecuación 4.5.1 — Área provisional**
- Fórmula: A_prov = Q / (U_asumido · F · LMTD)
- Variables: U_asumido = coeficiente global típico de tablas de referencia [Btu/(h·ft²·°F)]; resto como antes.
- Significado físico: primera estimación de tamaño del equipo antes de conocer la geometría real, usando un valor de U representativo de servicios similares (agua–agua, orgánicos ligeros, etc.) tomado de tablas de literatura (Tabla 8 de Kern / Tabla 3.5 de los apuntes complementarios).
- Unidades: ft².
- Restricciones/supuestos: el U de tabla es un rango orientativo (p. ej., 25–75 Btu/h·ft²·°F para keroseno-gasolina, ambos orgánicos ligeros); solo sirve para arrancar la selección de geometría, se reemplaza luego por el U calculado real.
- Origen: Kern, Tabla 8 del Apéndice ("Valores aproximados de los coeficientes totales para diseño"); paso 8 del procedimiento resumido en los apuntes de clase.
- Etapa de diseño: previa a la selección de Tabla 9/10 (guía la elección de cuántos pasos/qué tan compacto debe ser el equipo).
- Entradas → Salida: {Q, U_asumido, F, LMTD} → {A_prov}.
- Estado de uso: **[USADA-SIMPLIFICADA]** — la fuente prioritaria fija U_D=25 Btu/h·ft²·°F (Sección 6.3) como criterio de partida pero **no muestra explícitamente el valor numérico de A_prov**; pasa directamente a fijar 6 pasos (criterio de turbulencia) y consultar la Tabla 9. El simulador puede mostrar este paso intermedio como ayuda visual, aunque no sea estrictamente necesario para reproducir el resultado final.

### 4.6 Análisis del lado de los tubos (kerosene — fluido frío)

**Ecuación 4.6.1 — Área de flujo por tubos**
- Fórmula: ap = (Nt · at′) / (144 · n)
- Variables: Nt = número de tubos; at′ = área de flujo interna por tubo [in²] (Tabla 10); n = número de pasos; ap = área de flujo total disponible [ft²]
- Significado físico: área transversal efectiva por la que circula el fluido de tubos en un instante dado — al haber n pasos, solo Nt/n tubos conducen flujo "en paralelo" en cada paso.
- Unidades: ft² (conversión de in² con /144).
- Restricciones/supuestos: reparto uniforme de flujo entre todos los tubos de un mismo paso (sin bypass ni maldistribución).
- Origen: Kern, Ec. (7.48).
- Etapa de diseño: lado de tubos, primer cálculo hidráulico.
- Entradas → Salida: {Nt, at′, n} → {ap}.
- Estado de uso: **[USADA]** — Sección 6.6: ap = 546×0.302/144.6 ≈ 0.1908 ft² (nota: el divisor mostrado en el trabajo, 144.6, incorpora implícitamente n=6 junto con la conversión de unidades 144; verificar consistencia dimensional al implementar: 546×0.302/(144×6) = 0.1908 ft², coincide).

**Ecuación 4.6.2 — Velocidad másica y velocidad lineal, lado tubos**
- Fórmula: Gt = w/ap ; vt = Gt/(3600·ρ)
- Variables: w = flujo másico total del fluido de tubos [lb/h]; ap [ft²]; Gt = velocidad másica [lb/(h·ft²)]; ρ = densidad [lb/ft³] (=s×62.4, con s gravedad específica); vt = velocidad lineal [ft/s]
- Significado físico: Gt es el flujo por unidad de área normal a la dirección de flujo (útil porque no depende de la densidad para el cálculo de Re en forma de Gt); vt es la velocidad real del fluido, relevante para verificar rangos operativos recomendados (evitar erosión a alta velocidad, evitar sedimentación a baja velocidad).
- Unidades: Gt en lb/(h·ft²); vt en ft/s (factor 3600 convierte h→s).
- Restricciones/supuestos: flujo uniforme, propiedades evaluadas a temperatura de referencia (calórica o promedio según el caso).
- Origen: Kern, Ec. (7.2) para G; conversión estándar para v.
- Etapa de diseño: lado tubos.
- Entradas → Salida: {w, ap, ρ} → {Gt, vt}.
- Estado de uso: **[USADA]** — Sección 6.6: Gt=786 163.5 lb/(h·ft²); vt=4.267 ft/s.

**Ecuación 4.6.3 — Número de Reynolds, lado tubos**
- Fórmula: Ret = Di·Gt/μ (con Di en pies y μ en lb/(pie·h) = cP×2.42)
- Variables: Di = diámetro interno del tubo [ft]; Gt [lb/(h·ft²)]; μ = viscosidad dinámica [lb/(ft·h)]
- Significado físico: relación fuerzas inerciales/viscosas — determina el régimen de flujo (laminar/transición/turbulento) dentro del tubo.
- Unidades: adimensional; conversión de viscosidad obligatoria (1 cP = 2.42 lb/(ft·h) en el sistema inglés de Kern — **nota crítica de unidades**, ver Anexo C).
- Restricciones/supuestos: perfil de velocidad desarrollado; tubo circular liso.
- Origen: Kern, Ec. (7.3), definición estándar de Reynolds.
- Etapa de diseño: lado tubos, previo al cálculo de hi.
- Entradas → Salida: {Di, Gt, μ} → {Ret}.
- Estado de uso: **[USADA]** — Sección 6.6: Ret = (0.62/12)×786163.5/3.63 = 11 190 (>10 000 → turbulento, cumple criterio de diseño explícito de la fuente prioritaria).

**Ecuación 4.6.4 — Coeficiente de película interno, lado tubos (correlación de Sieder-Tate)**
- Fórmula: (hi·Di)/k = 0.027·(Di·Gt/μ)^0.8 · (Cp·μ/k)^(1/3) · φ ; equivalentemente hi = jH·(k/Di)·(Cp·μ/k)^(1/3)·φ, con jH obtenido de la Fig. 24 de Kern (curva adaptada de Sieder y Tate)
- Variables: hi = coeficiente de película interno [Btu/(h·ft²·°F)]; k = conductividad térmica del fluido [Btu/(h·ft·°F)]; Cp [Btu/(lb·°F)]; φ = (μ/μw)^0.14, corrección por viscosidad de pared [adimensional]
- Significado físico: correlación empírica de convección forzada turbulenta en el interior de tubos circulares — el grupo (Cp·μ/k)^(1/3) es el número de Prandtl elevado a 1/3 (efecto de la capa límite térmica relativa a la hidrodinámica); el exponente 0.8 sobre Re refleja la intensificación de la transferencia con la turbulencia.
- Unidades: Inglés — Btu/(h·ft²·°F).
- Restricciones/supuestos: **régimen turbulento, Re>10 000** (Kern recomienda explícitamente Re>10 000 para esta correlación, coincide con el criterio usado en la fuente prioritaria); tubo largo (L/D>60, para despreciar efectos de entrada — la fuente prioritaria no verifica explícitamente esta razón, con L=16ft y Di=0.62in ⇒ L/D≈310, la cumple ampliamente); fluido newtoniano de una sola fase.
- Origen: correlación de Sieder-Tate (1936); Kern, Ec. (6.15a); Fig. 24 del Apéndice (verificado directamente en el libro fuente: *"Curva de transferencia de calor lado de tubos, adaptada de Sieder y Tate"*).
- Etapa de diseño: lado tubos — coeficiente de película.
- Entradas → Salida: {Ret, Pr, k, Di, φ} → {hi}.
- Estado de uso: **[USADA-SIMPLIFICADA]** — Sección 6.6: hi = 203.0 Btu/(h·ft²·°F), con φ=1 explícitamente asumido (ver §4.8 para la forma completa).

**Ecuación 4.6.5 — Coeficiente referido al diámetro externo**
- Fórmula: hio = hi · (Di/Do)
- Variables: hio = coeficiente interno referido a la superficie externa del tubo [Btu/(h·ft²·°F)]; Di, Do en las mismas unidades
- Significado físico: como el área de transferencia de referencia del diseño es la externa (Do), el coeficiente interno debe reescalarse al área externa para poder combinarse con ho en la ecuación de resistencias en serie (ambos coeficientes deben estar en la misma base de área).
- Unidades: Btu/(h·ft²·°F).
- Restricciones/supuestos: válida para pared de tubo delgada donde se desprecia la curvatura logarítmica exacta (aproximación lineal Di/Do en vez de ln(Do/Di) exacto de la resistencia cilíndrica) — consistente con omitir el término de conducción de pared.
- Origen: Kern, Ec. (6.5).
- Etapa de diseño: lado tubos, previo al cálculo de Uc.
- Entradas → Salida: {hi, Di, Do} → {hio}.
- Estado de uso: **[USADA]** — Sección 6.6: hio = 203.0×(0.62/0.75) = 167.8 Btu/(h·ft²·°F).

### 4.7 Análisis del lado de la carcasa (gasolina — fluido caliente)

**Dato/ecuación 4.7.1 — Espaciado de deflectores (regla de diseño)**
- Fórmula usada por la fuente prioritaria: B fijado por decisión de diseño (9 in), verificado a posteriori contra la regla 20 %–50 % de Ds.
- Fórmula de referencia rápida (apuntes complementarios, no aplicada aquí): B = 0.45×Ds (o 0.3×Ds según otra variante consultada) como estimación inicial.
- Variables: B = espaciado entre deflectores [in]; Ds = diámetro interno de coraza [in]
- Significado físico: el espaciado de deflectores controla la velocidad transversal del fluido de coraza — deflectores muy juntos aumentan turbulencia (↑ho) pero también ΔP; deflectores muy separados reducen ΔP pero también ho y el soporte estructural contra vibración inducida por flujo.
- Unidades: in.
- Restricciones/supuestos: la fuente prioritaria declara la regla de aceptación **20 %–50 % de Ds** (Sección 4.6 del trabajo); 9/29 = 31 %, dentro del rango. **Nota de discrepancia con la norma TEMA real:** ver §7.4 — la norma TEMA (RCB-4.2) define el espaciado mínimo constructivo real como el mayor entre Ds/5 y 2 in, y el máximo según tablas de luz máxima no soportada por vibración, no una simple regla "20–50 %"; esa regla es una simplificación pedagógica común (atribuible a Kern/varios cursos) razonable para el nivel de este proyecto, pero no es literalmente el texto del estándar TEMA.
- Origen: regla práctica de diseño (Kern, discusión cualitativa Cap. 7; TEMA RCB-4.2 en su forma rigurosa).
- Etapa de diseño: selección geométrica de coraza — decisión de diseño, no siempre "calculada".
- Entradas → Salida: {Ds, criterio de ΔP objetivo} → {B} (por iteración/decisión de diseño, no por fórmula cerrada única).
- Estado de uso: **[USADA]** — Sección 6.7: *"Se asume 9 pulgadas para forzar… sin sobrepasar los 7 psi límite"* (B es una variable de diseño ajustada iterativamente contra la restricción de ΔP, no calculada de una fórmula cerrada).

**Ecuación 4.7.2 — Área de flujo transversal de coraza**
- Fórmula: as = (Ds · C′ · B) / (Pt · 144)
- Variables: Ds = diámetro interno de coraza [in]; C′ = espacio libre entre tubos adyacentes = Pt−Do [in]; B = espaciado de deflectores [in]; Pt = paso entre tubos [in]; as = área de flujo [ft²]
- Significado físico: área de paso disponible para el fluido de coraza en la sección central del haz de tubos (a la altura del diámetro de coraza), proporcional a la fracción de "claro" entre tubos y a la altura de la ventana entre deflectores consecutivos.
- Unidades: ft² (conversión /144 desde in²).
- Restricciones/supuestos: aproximación geométrica estándar de Kern (no considera exactamente la geometría de la ventana de corte de deflector, es una simplificación de "franja central" del haz).
- Origen: Kern, Ec. (7.1).
- Etapa de diseño: lado carcasa, primer cálculo hidráulico.
- Entradas → Salida: {Ds, C′, B, Pt} → {as}.
- Estado de uso: **[USADA]** — Sección 6.7: as = 29×0.25×9/144 = 0.4531 ft² (C′=Pt−Do=1−0.75=0.25 in).

**Ecuación 4.7.3 — Diámetro equivalente de coraza**
- Fórmula (arreglo triangular): De = 4·(Pt²·(√3/4) − π·Do²/8) / (π·Do/2)
- Fórmula (arreglo cuadrado): De = 4·(Pt² − π·Do²/4) / (π·Do)
- Variables: Pt, Do [in o ft, consistentes]; De = diámetro equivalente [ft o in]
- Significado físico: diámetro hidráulico "de transferencia de calor" del espacio entre tubos en flujo cruzado — no es el diámetro hidráulico clásico de caída de presión (4×área/perímetro mojado total), sino una definición específica de Kern que usa el perímetro de UN tubo (no de todos) para mantener consistencia con las correlaciones jH y f de coraza que fueron ajustadas empíricamente con esta definición particular.
- Unidades: ft (se calcula en in y se convierte).
- Restricciones/supuestos: válida solo para los arreglos y pasos estándar tabulados (triangular o cuadrado); depende únicamente de la geometría del haz, no del caudal.
- Origen: Kern, Ec. (7.4); tabulado también directamente en la Fig. 28 del Apéndice de Kern para combinaciones estándar de Do/Pt (De = 0.72 in para tubo 3/4 in en arreglo triangular de 1 in — valor tabular clásico que coincide con el cálculo por fórmula).
- Etapa de diseño: lado carcasa, previo al cálculo de Re de coraza.
- Entradas → Salida: {Pt, Do, tipo de arreglo} → {De}.
- Estado de uso: **[USADA]** — Sección 6.7: De = 0.06 ft (0.72 in), citado como leído de "Figura 28 de Kern" — verificado: es un valor estándar tabular para esta combinación geométrica exacta, coherente con la fórmula cerrada de arreglo triangular.

**Ecuación 4.7.4 — Velocidad másica y número de Reynolds, lado carcasa**
- Fórmula: Gs = W/as ; Res = De·Gs/μ
- Variables: W = flujo másico del fluido de coraza [lb/h]; as [ft²]; De [ft]; μ [lb/(ft·h)]; Gs [lb/(h·ft²)]; Res [adimensional]
- Significado físico: análogos a Gt y Ret pero para el flujo cruzado externo al haz de tubos.
- Unidades: Inglés.
- Restricciones/supuestos: mismas que Ret salvo que aquí el "diámetro" relevante es el equivalente De, no un diámetro físico de tubería.
- Origen: Kern, definición estándar (paralelo a 7.2/7.3, lado coraza).
- Etapa de diseño: lado carcasa.
- Entradas → Salida: {W, as, De, μ} → {Gs, Res}.
- Estado de uso: **[USADA]** — Sección 6.7: Gs = 147273/0.4531 ≈ 325 034 lb/(h·ft²) [ver nota de notación ambigua en §7.5]; Res = 0.06×325.034/1.089 = 17 908 (>10 000, turbulento).

**Ecuación 4.7.5 — Coeficiente de película externo, lado carcasa (correlación de Donohue/McAdams para flujo cruzado con deflectores)**
- Fórmula: (ho·De)/k = 0.36·(De·Gs/μ)^0.55 · (Cp·μ/k)^(1/3) · φ
- Variables: análogas a 4.6.4 pero con De y Gs en lugar de Di y Gt; exponente sobre Re es **0.55** (no 0.8) — refleja que el mecanismo dominante es flujo cruzado alrededor de un banco de tubos, no flujo interno en ducto.
- Significado físico: correlación empírica de transferencia de calor para flujo cruzado turbulento sobre un banco de tubos con deflectores segmentados al 25 % (la condición estándar bajo la cual Kern ajustó esta curva — Fig. 28 del Apéndice, indicado explícitamente en su título: *"…con haz de tubos con deflectores segmentados 25 %"*).
- Unidades: Inglés — Btu/(h·ft²·°F).
- Restricciones/supuestos: **válida específicamente para corte de deflector del 25 %** (si el diseño usa un corte distinto, esta curva pierde precisión — la fuente prioritaria no reporta explícitamente el % de corte de deflector usado, asumiéndose implícitamente el 25 % estándar de Kern); régimen turbulento Res>1000 aprox. (recomendado, aquí Res=17 908 lo cumple ampliamente).
- Origen: Kern, Ec. (6.15b); Fig. 28 del Apéndice (verificado: caption exacto *"Curva de transferencia de calor para lado de la coraza con haz de tubos con deflectores segmentados 25 %"*). Empíricamente relacionada con el método de Donohue.
- Etapa de diseño: lado carcasa — coeficiente de película.
- Entradas → Salida: {Res, Pr, k, De, φ} → {ho}.
- Estado de uso: **[USADA-SIMPLIFICADA]** — Sección 6.7: ho = 204.1 Btu/(h·ft²·°F), con φ=1 asumido.

### 4.8 Corrección de viscosidad de pared (marco teórico completo — no aplicado)

**Ecuación 4.8.1 — Factor de corrección φ**
- Fórmula: φ = (μ/μw)^0.14
- Variables: μ = viscosidad del fluido a la temperatura calórica (temperatura media de bulto) [cP o lb/(ft·h)]; μw = viscosidad evaluada a la temperatura de pared del tubo tw [misma unidad]
- Significado físico: corrige el coeficiente de película por el hecho de que la viscosidad real en la película adyacente a la pared (que controla el gradiente de velocidad, y por tanto la transferencia) difiere de la viscosidad de bulto — relevante cuando hay gran diferencia de temperatura entre el fluido y la pared del tubo (p. ej., calentamiento/enfriamiento de líquidos muy viscosos).
- Unidades: adimensional.
- Restricciones/supuestos: requiere conocer tw, que a su vez depende de un balance de resistencias en serie: tw = tc + [hio/(hio+ho)]×(Tc−tc) (Kern, Ec. 5.31).
- Origen: Sieder-Tate (1936); Kern, pasos 10'–12' / Ecs. (6.36), (6.37); Fig. 24 (inserto).
- Etapa de diseño: correctivo, entre el cálculo de hi/ho "sin corregir" y el cálculo de Uc.
- Entradas → Salida: {μ (bulto), tw, μw} → {φ}, aplicado multiplicativamente a hi y ho.
- Estado de uso: **[SOLO TEORÍA]** — la fuente prioritaria asume explícitamente φ=1 en ambos lados (Sección 6.6: *"Asumiendo φ=1"*), simplificación razonable cuando ambos fluidos son de baja viscosidad y similares entre sí (μ_gasolina=0.45 cP, μ_kerosene=1.50 cP — la diferencia no es extrema). **El impacto esperado de esta simplificación es menor al 5–10 % sobre h para hidrocarburos líquidos de baja viscosidad como este caso** (orden de magnitud típico para (μ/μw)^0.14 con razones de viscosidad de 1.5–2). Se recomienda incluir este módulo en el simulador como opción de mayor precisión, no requerida para la validación base.

### 4.9 Coeficientes globales de transferencia de calor

**Ecuación 4.9.1 — Coeficiente global limpio Uc (forma de dos resistencias, Kern)**
- Fórmula: Uc = (hio · ho) / (hio + ho)
- Variables: hio, ho [Btu/(h·ft²·°F)]; Uc = coeficiente global limpio (sin ensuciamiento) [Btu/(h·ft²·°F)]
- Significado físico: combinación en serie de las dos resistencias convectivas (interna y externa), ya referidas a la misma base de área (externa), **despreciando la resistencia de conducción de la pared metálica del tubo**.
- Unidades: Btu/(h·ft²·°F).
- Restricciones/supuestos: válida cuando la resistencia de pared (do·ln(do/di)/(2·kt)) es pequeña frente a 1/hio y 1/ho — cierto para tubos delgados de acero al carbono (kt=26 Btu/h·ft·°F aprox., pared ~0.065 in) frente a coeficientes convectivos del orden de 100–300 Btu/h·ft²·°F como los de este problema. **Se verificó contra Kern (Ejemplo 7.3, misma Ec. 6.38) que esta es la forma oficial del método, no una simplificación de la fuente prioritaria** — ver discusión completa en §7.1.
- Origen: Kern, Ec. (6.38).
- Etapa de diseño: combinación de coeficientes de película.
- Entradas → Salida: {hio, ho} → {Uc}.
- Estado de uso: **[USADA]** — Sección 6.8: Uc = 167.8×204.1/(167.8+204.1) = 92.09 Btu/(h·ft²·°F).

**Ecuación 4.9.1-bis — Coeficiente global limpio (forma completa de tres resistencias — teoría general, Sección 4.4 de la fuente prioritaria)**
- Fórmula: Uc = [do/(hi·Di) + do·ln(do/Di)/(2·kt) + 1/ho]⁻¹
- Variables adicionales: kt = conductividad térmica del material del tubo [Btu/(h·ft·°F)] (acero al carbono, kt≈26 Btu/h·ft·°F o 60 W/m·K según el problema de referencia en SI del documento complementario)
- Significado físico: modelo de resistencias en serie completo — película interna + conducción radial a través de la pared cilíndrica del tubo + película externa, sin despreciar ningún término.
- Unidades: Btu/(h·ft²·°F).
- Restricciones/supuestos: la forma general y más rigurosa; requiere conocer kt del material.
- Origen: teoría general de transferencia de calor (Incropera, Çengel); presentada explícitamente en la Sección 4.4 ("Fundamento teórico") de la fuente prioritaria.
- Etapa de diseño: alternativa más precisa al paso anterior.
- Entradas → Salida: {hi, ho, Di, Do, kt} → {Uc}.
- Estado de uso: **[SOLO TEORÍA]** — presentada como fundamento pero no aplicada numéricamente en la Sección 6; el simulador debe implementar la forma 4.9.1 (dos resistencias) para reproducir el resultado 92.09 Btu/(h·ft²·°F), y puede ofrecer esta forma completa como opción de mayor rigor (los resultados diferirán en una fracción pequeña, cuantificable si se desea, dado kt del acero al carbono).

**Ecuación 4.9.2 — Resistencia de ensuciamiento combinada**
- Fórmula: Rd = Rdi + Rdo (ambas ya referidas a la misma base de área, tal como se usaron: 0.001 + 0.001 = 0.002 h·ft²·°F/Btu)
- Forma más general (cuando Rdi está referida al área interna): Rd = Rdi·(Do/Di) + Rdo
- Variables: Rdi, Rdo = factores de obstrucción interno/externo [h·ft²·°F/Btu]; Rd = factor de obstrucción combinado, referido al área externa
- Significado físico: resistencia térmica adicional debida a la acumulación de depósitos, incrustaciones o costras sobre las superficies de intercambio durante la operación — es una previsión de diseño (no un valor "medido"), tomada de tablas empíricas de la industria según el tipo de fluido y servicio.
- Unidades: h·ft²·°F/Btu.
- Restricciones/supuestos: valores tabulados (Tabla 12 de Kern) representan práctica histórica de la industria de refinación; **no son constantes universales**, dependen de temperatura del fluido, velocidad y tipo de corriente.
- Origen: Kern, Tabla 12 del Apéndice ("Factores de obstrucción"), Ec. (6.13) reordenada.
- Etapa de diseño: previo al cálculo de UD.
- Entradas → Salida: {Rdi, Rdo (de tabla, según tipo de fluido)} → {Rd}.
- Estado de uso: **[USADA]** — Sección 6.8: Rd_total = 0.002 h·ft²·°F/Btu. **Nota de trazabilidad (ver §7.6):** la Tabla 12 original de Kern no lista una entrada única rotulada literalmente "gasolina" y "querosén" con el valor exacto 0.001 cada una; sin embargo, ese valor es consistente con múltiples entradas de la tabla para líquidos orgánicos ligeros/fracciones tratadas de refinería (rango típico 0.0005–0.002), por lo que 0.001 h·ft²·°F/Btu por corriente es una elección razonable y defendible, aunque no una cita literal verificable línea por línea.

**Ecuación 4.9.3 — Coeficiente global de diseño (sucio) UD**
- Fórmula: 1/UD = 1/Uc + Rd  ⇒  UD = 1/(1/Uc + Rd)
- Variables: como arriba; UD [Btu/(h·ft²·°F)]
- Significado físico: coeficiente global real de operación a largo plazo, penalizado por la resistencia de ensuciamiento — es el valor que se usa para calcular el área **requerida** de diseño (con margen de seguridad incorporado).
- Unidades: Btu/(h·ft²·°F).
- Restricciones/supuestos: asume Rd constante en el tiempo (en realidad crece desde 0 hasta el valor de diseño a lo largo del ciclo de operación — el "margen" de sobrediseño es lo que permite operar hasta que Rd alcance ese valor antes de requerir limpieza).
- Origen: Kern, Ec. (6.13) reordenada; paso 15 del procedimiento de 15 pasos.
- Etapa de diseño: paso final del bloque térmico, previo a la comparación de áreas.
- Entradas → Salida: {Uc, Rd} → {UD}.
- Estado de uso: **[USADA]** — Sección 6.8: UD = 1/(1/92.09+0.002) = 77.76 Btu/(h·ft²·°F).

### 4.10 Verificación de área — sobrediseño

**Ecuación 4.10.1 — Área requerida**
- Fórmula: Areq = Q / (UD · ΔTm)
- Variables: como en 4.2.4, con U=UD (coeficiente de diseño real, no el estimado inicial).
- Significado físico: área mínima teóricamente necesaria para transferir Q con el coeficiente global de diseño ya calculado (incluyendo ensuciamiento) y la fuerza motriz térmica corregida.
- Unidades: ft².
- Restricciones/supuestos: mismas que la ecuación general de diseño.
- Origen: despeje directo de Q=U·A·ΔTm.
- Etapa de diseño: comparación final de área.
- Entradas → Salida: {Q, UD, ΔTm} → {Areq}.
- Estado de uso: **[USADA]** — Sección 6.9: Areq = 3 240 000/(77.76×34.14) = 1220.4 ft².

**Ecuación 4.10.2 — Porcentaje de sobrediseño (exceso de área)**
- Fórmula: %Exceso = [(A_real − Areq)/Areq] × 100
- Variables: A_real = área instalada real (Ec. 4.4.3); Areq (Ec. 4.10.1)
- Significado físico: margen de superficie adicional instalada respecto al mínimo teórico — absorbe incertidumbre de diseño, permite degradación por ensuciamiento adicional al previsto, y da flexibilidad operativa (caudales o temperaturas ligeramente distintas a las de diseño).
- Unidades: %.
- Restricciones/supuestos: un exceso típico aceptable en la práctica industrial ronda 10–35 %; 40.5 % (el resultado de la fuente prioritaria) es alto pero se justifica explícitamente porque la geometría disponible en catálogo (Tabla 9, para 6 pasos y Ds=29in) no permite ajuste fino continuo del número de tubos.
- Origen: criterio estándar de ingeniería de diseño de intercambiadores (no una "ecuación de libro" per se, sino una métrica de evaluación de diseño).
- Etapa de diseño: verificación final, junto con caída de presión.
- Entradas → Salida: {A_real, Areq} → {%Exceso}.
- Estado de uso: **[USADA]** — Sección 6.9: (1714.5−1220.4)/1220.4×100 = 40.5 %.

### 4.11 Caídas de presión

**Ecuación 4.11.1 — Factor de fricción (lado tubos y lado carcasa) — vía gráfica**
- Forma: ft = f(Ret) leído de la Fig. 26 de Kern ("Factores de fricción, para lado de tubo"); fs = f(Res) leído de la Fig. 29 de Kern ("Factores de fricción lado de la coraza, para haces de tubos con deflectores segmentados 25 %").
- Variables: Ret, Res (adimensionales, calculados en §4.6.3 y §4.7.4); ft, fs [ft²/in²] — unidad peculiar de Kern, no el factor de fricción de Darcy/Fanning adimensional clásico; ya incluye una constante dimensional para que encaje directamente en las ecuaciones de ΔP de Kern (Ecs. 7.44/7.45).
- Significado físico: factor de fricción de Fanning modificado, empírico, correlacionado contra Reynolds a partir de datos experimentales — para tubos lisos en régimen turbulento decrece suavemente con Re (ley de potencia negativa); para flujo cruzado sobre banco de tubos (coraza) depende también del corte de deflector.
- Unidades: ft²/in² (particular de las cartas de Kern; no confundir con el factor de fricción de Darcy adimensional de otras referencias).
- Restricciones/supuestos: correlación empírica específica de Kern, válida en el rango de Re cubierto por las cartas (aprox. 10–10⁶); para el lado de coraza, válida específicamente para deflectores segmentados al 25 %.
- Origen: Kern, Fig. 26 y Fig. 29 del Apéndice (ambas verificadas directamente en el libro fuente).
- Etapa de diseño: previo al cálculo de ΔP.
- Entradas → Salida: {Ret} → {ft}; {Res} → {fs}.
- Estado de uso: **[USADA]** — Sección 6.10: ft=0.00023 ft²/in² (Ret=11 190, "Figura 26 de Kern"); fs=0.00165 ft²/in² (Res=17 908, "Figura 29 de Kern"). **Nota de implementación:** para el simulador, estas curvas gráficas deben digitalizarse como funciones f(Re) ajustadas (regresión potencial por tramos) para permitir cálculo automático sin lectura visual — los apuntes de clase complementarios contienen un ajuste analítico alternativo (f = 0.4137·Re^−0.2585 para tubos; forma bilineal f1, f2 para coraza) que puede usarse como base de la digitalización, **verificando siempre que el resultado final coincida con el valor leído por la fuente prioritaria** (ver discrepancia de constantes en §7.2).

**Ecuación 4.11.2 — Caída de presión por fricción, lado tubos**
- Fórmula: ΔPfricción,t = f·Gt²·L·n / (5.22×10¹⁰·Di·s·φ)
- Variables: f = ft [ft²/in²]; Gt [lb/(h·ft²)]; L [ft]; n = número de pasos; Di [ft]; s = gravedad específica [adimensional]; φ = corrección de viscosidad (=1 en este caso)
- Significado físico: pérdida de presión por fricción distribuida a lo largo de toda la trayectoria recta del fluido a través de los n pasos de tubos.
- Unidades: psi (lb/in²) — la constante 5.22×10¹⁰ es una constante dimensional empírica de Kern que ajusta las unidades inglesas mixtas (lb/h·ft² para G, ft para L y Di) para entregar directamente psi.
- Restricciones/supuestos: flujo turbulento completamente desarrollado; no incluye pérdidas por accesorios ni por entrada/salida de boquillas (solo fricción en tubo recto).
- Origen: Kern, Ec. (7.45).
- Etapa de diseño: verificación hidráulica, lado tubos.
- Entradas → Salida: {f, Gt, L, n, Di, s, φ} → {ΔPfricción,t}.
- Estado de uso: **[USADA]** — Sección 6.10: ΔPt = 0.00023×786.1635²×16×6/(5.22×10¹⁰×0.05167×0.82) = 6.17 psi.

**Ecuación 4.11.3 — Caída de presión por retorno en cabezales, lado tubos**
- Fórmula (Kern, forma con gravedad específica): ΔPretorno = (4n/s)·(V²/2g′)
- Fórmula (equivalente, forma con densidad — la efectivamente usada por la fuente prioritaria): ΔPretorno = 4n·V²·ρ / (2·gc·144)
- Variables: n = número de pasos; V = velocidad lineal del fluido en el tubo [ft/s]; s = gravedad específica; ρ = densidad [lb/ft³]; g′ = gc = 32.2 lb·ft/(lbf·s²) (constante gravitacional/de conversión, **distinta** de la constante g=4.18×10⁸ ft/h² que Kern usa en las ecuaciones de ΔP por fricción — ver nota en Anexo C); el factor 144 convierte lb/ft² a lb/in² (psi).
- Significado físico: pérdida de presión "de forma" (no de fricción) causada por el cambio brusco de dirección del fluido al pasar de un paso de tubos al siguiente dentro del cabezal flotante o del carrete — cada cambio de paso disipa aproximadamente 4 cargas de velocidad (4×V²/2g).
- Unidades: psi.
- Restricciones/supuestos: aproximación empírica (4 cargas de velocidad por cambio de paso es un valor típico recomendado por Kern, alternativa a leer la Fig. 27 — "Pérdida de presión por retorno, lado de tubos").
- Origen: Kern, Ec. (7.46); alternativa gráfica en Fig. 27 del Apéndice.
- Etapa de diseño: verificación hidráulica, lado tubos (se suma a la fricción).
- Entradas → Salida: {n, V, ρ o s} → {ΔPretorno}.
- Estado de uso: **[USADA]** — Sección 6.10: ΔPr = 4×6×(4.267)²×51.17/(2×32.2×144) = 2.41 psi. **Nota:** la fuente prioritaria usó la forma con densidad explícita (ρ=51.17 lb/ft³) en vez de la forma canónica de Kern con gravedad específica dividiendo V²/2g′ — ambas formas son físicamente equivalentes si se mantiene la consistencia de unidades (ρ = s×ρ_agua); se recomienda para el simulador implementar la forma con ρ explícita, que es la que reproduce el número exacto reportado.

**Ecuación 4.11.4 — Caída de presión total, lado tubos**
- Fórmula: ΔPt,total = ΔPfricción,t + ΔPretorno
- Significado físico: suma de ambas contribuciones — es el valor que se compara contra el ΔP máximo permitido para el fluido de tubos.
- Unidades: psi.
- Origen: Kern, Ec. (7.47).
- Estado de uso: **[USADA — con inconsistencia interna, ver §7.3]** — Sección 6.10 reporta ΔPt,total = 6.17+2.41 = **8.58 psi**, pero la tabla de resultados final (Sección 8) reporta **9.75 psi** para el mismo parámetro. Ambos valores cumplen el límite de 10 psi, por lo que la conclusión cualitativa del diseño no cambia, pero **el simulador debe decidir explícitamente cuál cifra reproducir como objetivo de validación** — se recomienda 8.58 psi por ser la cifra con desglose aritmético trazable en el propio documento.

**Ecuación 4.11.5 — Número de cruces, lado carcasa**
- Fórmula: N+1 = 12·L/B
- Variables: L = longitud de tubo [ft]; B = espaciado de deflectores [in]; N+1 = número de veces que el fluido de coraza atraviesa el haz en flujo cruzado (N = número de deflectores)
- Significado físico: cuenta cuántos "pasos" de flujo cruzado impone la sucesión de deflectores a lo largo de la longitud del intercambiador — cada cruce contribuye a la pérdida de presión total de coraza.
- Unidades: adimensional; el factor 12 convierte L de ft a in para que sea consistente con B en in.
- Restricciones/supuestos: asume deflectores igualmente espaciados en toda la longitud.
- Origen: Kern, Ec. (7.43).
- Etapa de diseño: lado carcasa, previo al cálculo de ΔP de coraza.
- Entradas → Salida: {L, B} → {N+1}.
- Estado de uso: **[USADA]** — Sección 6.10: N+1 = 12×16/9 = 21.33.

**Ecuación 4.11.6 — Caída de presión, lado carcasa**
- Fórmula: ΔPcarcasa = f·Gs²·Ds·(N+1) / (5.22×10¹⁰·De·s·φ)
- Variables: f = fs [ft²/in²]; Gs [lb/(h·ft²)]; Ds [ft]; N+1; De [ft]; s = gravedad específica; φ = corrección de viscosidad
- Significado físico: análoga a la fricción de tubos, pero para el flujo cruzado repetido sobre el haz de tubos entre deflectores — la geometría de coraza (Ds, De) reemplaza a la de tubo (Di).
- Unidades: psi.
- Restricciones/supuestos: correlación empírica de Kern, ligada a la misma curva de fricción de coraza (Fig. 29, deflectores al 25 %); no separa explícitamente pérdidas por entrada/salida de boquillas.
- Origen: Kern, Ec. (7.44).
- Etapa de diseño: verificación hidráulica, lado carcasa.
- Entradas → Salida: {f, Gs, Ds, N+1, De, s, φ} → {ΔPcarcasa}.
- Estado de uso: **[USADA]** — Sección 6.10: ΔPs = 0.00165×325.0347²×29×22/(5.22×10¹⁰×0.06×0.74) = 4.80 psi (nota: se usó N+1≈22, redondeo de 21.33).

### 4.12 Criterios de aceptación / iteración

**Criterio 4.12.1 — Verificación de régimen turbulento**
- Regla: Ret > 10 000 y Res > 10 000 (recomendación Kern para asegurar validez de las correlaciones de Sieder-Tate/Donohue y maximizar transferencia minimizando depósitos).
- Estado de uso: **[USADA]** — ambos Reynolds (11 190 y 17 908) cumplen.

**Criterio 4.12.2 — Verificación de caída de presión**
- Regla: ΔPt,total ≤ ΔPmax,fluido-tubos ; ΔPcarcasa ≤ ΔPmax,fluido-coraza
- Estado de uso: **[USADA]** — 8.58 (o 9.75) ≤ 10 psi; 4.80 ≤ 7 psi.

**Criterio 4.12.3 — Verificación de área**
- Regla: A_real ≥ Areq (con exceso positivo razonable)
- Estado de uso: **[USADA]** — 1714.5 ≥ 1220.4 ft² (40.5 % de exceso).

**Criterio 4.12.4 — Verificación del factor F**
- Regla: F > 0.75 (evita penalización excesiva de la fuerza motriz térmica; valores menores usualmente indican que se necesita más de un paso de coraza).
- Estado de uso: **[USADA]** — F=0.8045 > 0.75.

**Criterio 4.12.5 — Iteración**
- Regla (general del método, Sección 5.9–5.11 de la fuente prioritaria): si algún criterio anterior falla, se ajustan las variables de diseño disponibles: B (espaciado deflectores, afecta ΔPcarcasa y ho), L o n (número de pasos, afecta velocidad/Re/ΔP de tubos), Ds/Nt (tamaño de coraza, vía Tabla 9), y se repite el ciclo desde §4.4 en adelante.
- Estado de uso: **[USADA — implícitamente]** — en este caso particular la primera selección geométrica cumplió todos los criterios; el simulador debe implementar el ciclo completo de iteración para permitir al usuario explorar diseños alternativos.

### 4.13 Números adimensionales no aplicables a este problema (justificación de exclusión)

Por completitud respecto al listado solicitado, se documenta explícitamente por qué las siguientes correlaciones/números **no** forman parte de la base de ecuaciones del simulador de validación:

- **Número de Grashof / convección natural:** no aplica — el mecanismo dominante en ambos lados es convección **forzada** turbulenta (Re>10 000 en tubos y coraza domina ampliamente sobre cualquier efecto de flotabilidad).
- **Número de Stanton:** no se usa explícitamente en la fuente prioritaria ni en Kern para este método (aunque St = Nu/(Re·Pr) = jH/(Cp·μ/k)^(2/3) podría derivarse algebraicamente de jH, no aporta información nueva y no fue parte del cálculo).
- **Número de Peclet:** no aplica — es relevante en convección de metales líquidos o régimen laminar con Pr bajo; aquí Pr=6.88–21.5 (líquidos orgánicos) y régimen turbulento, contexto en el que Peclet no es la variable de control.
- **Método ε-NTU:** no fue usado por la fuente prioritaria (que aplicó el método LMTD-F clásico, apropiado porque las cuatro temperaturas del proceso son conocidas — problema de tipo "rating/diseño directo", no de "predicción de temperatura de salida desconocida", que es el escenario típico donde ε-NTU aporta ventaja). Puede incluirse como módulo alternativo del simulador, pero no es necesario para la validación.

---

## 5. PARÁMETROS IMPORTANTES Y SU ROL EN EL SIMULADOR

| Parámetro | Tipo en el simulador | ¿Se grafica? | ¿Se anima en 3D? | Influencia sobre el comportamiento |
|---|---|---|---|---|
| Caudales (w, W) | Entrada usuario (uno puede calcularse por balance) | Sí (flujo vs tiempo) | Sí (velocidad de partículas) | Determinan Q, G, Re, h, ΔP |
| Temperaturas T₁,T₂,t₁,t₂ | Entrada usuario | Sí (T vs longitud) | Sí (gradiente de color) | Determinan Q, LMTD, F |
| Propiedades (Cp, μ, k, s, Pr) | Entrada usuario / base de datos con fuente | Panel "Propiedades y fuentes" | Indirecto | Re, Pr, h, ΔP |
| Do, BWG, L, arreglo, Pt | Entrada usuario (catálogo) | — | Sí (geometría del modelo) | Di, área, ap, De |
| n (pasos), B (deflectores), Ds/Nt | Entrada usuario (con Tabla 9 como guía) | — | Sí (particiones, deflectores) | Re, h, ΔP, área |
| Q (carga térmica) | Calculado → resultado | Sí | Intensidad del intercambio | Eje de todo el diseño |
| LMTD, R, S, F, ΔTm | Calculados → resultado expandible | Sí (perfil T) | — | Fuerza motriz |
| Gt, Gs, vt, Ret, Res | Calculados → resultado | Sí (Re vs geometría) | Velocidad de partículas | Régimen de flujo, validez de correlaciones |
| hi, hio, ho | Calculados → resultado expandible | Sí | — | Uc |
| Uc, UD, Rd | Calculados → resultado expandible | Sí (U vs ensuciamiento) | — | Área requerida |
| A_real, Areq, % sobrediseño | Calculados → resultado destacado | Sí (barras comparativas) | — | Veredicto de diseño |
| ΔPtubos, ΔPcarcasa | Calculados → resultado con semáforo vs ΔPmax | Sí | Opcional (caída de presión por tramo) | Veredicto hidráulico |
| Criterios (Re>10⁴, F>0.75, ΔP≤max, A≥Areq) | Calculados → indicadores pasa/no-pasa | — | — | Disparan la iteración de diseño |

## 6. PLAN DE VALIDACIÓN DEL SIMULADOR (valores objetivo)

El simulador se considera validado si, con las entradas exactas del problema de la fuente prioritaria, reproduce:

| # | Magnitud | Valor objetivo (fuente prioritaria) | Tolerancia sugerida | Nota |
|---|---|---|---|---|
| 1 | Q | 3 240 000 Btu/h | exacto (<0.1 %) | aritmética directa |
| 2 | W (gasolina) | 147 273 lb/h | <0.1 % | |
| 3 | LMTD | 42.44 °F | <0.1 % | |
| 4 | R / S | 0.8889 / 0.5294 | <0.1 % | |
| 5 | F | 0.8045 | <0.2 % | forma analítica |
| 6 | ΔTm | 34.14 °F | <0.2 % | |
| 7 | A real | 1714.5 ft² | exacto | 546×16×0.1963 |
| 8 | ap / Gt / vt | 0.1908 ft² / 786 163.5 / 4.267 ft/s | <0.5 % | |
| 9 | Ret | 11 190 | <0.5 % | |
| 10 | hi / hio | 203.0 / 167.8 | <1.5 % | redondeos internos del trabajo |
| 11 | as / De / Gs / Res | 0.4531 ft² / 0.06 ft / 325 034 / 17 908 | <1 % | |
| 12 | ho | 204.1 | <7 % | el trabajo parece haber leído jH de la Fig. 28 y/o redondeado; la fórmula 0.36·Re^0.55·Pr^(1/3) da ≈217 (ver §7.8) |
| 13 | Uc / UD | 92.09 / 77.76 | <7 % | arrastra la tolerancia de ho |
| 14 | Areq / % exceso | 1220.4 ft² / 40.5 % | <7 % | |
| 15 | ΔPt fricción / retorno / total | 6.17 / 2.41 / 8.58 psi | <2 % con f=0.00023 inyectado | ver §7.3 (8.58 vs 9.75) |
| 16 | ΔPcarcasa | 4.80 psi (reportado) | ver §7.7 | fórmula con Ds en ft da ≈3.9–4.0 psi; ambos «cumplen <7 psi» |
| 17 | Veredictos | todos «cumple» | exacto | Re turb., F>0.75, ΔP≤max, A≥Areq |

## 7. DISCREPANCIAS DOCUMENTADAS Y DECISIÓN DE IMPLEMENTACIÓN

**7.1 φ=1 y forma de Uc (dos resistencias).** La fuente prioritaria asume φ=1 y usa Uc=hio·ho/(hio+ho) (Kern Ec. 6.38), omitiendo la resistencia de pared presentada en su propia Sección 4.4. Verificado contra Kern Ej. 7.3: es la forma oficial del método. **Implementar la forma de dos resistencias como modo de validación; la de tres resistencias como opción avanzada.**

**7.2 Constante de la ecuación de fricción.** Los apuntes de clase usan 7.5×10¹² con f de Darcy adimensional; la fuente prioritaria y Kern usan 5.22×10¹⁰ con f en ft²/in² (cartas de Kern). Son sistemas coherentes entre sí pero NO intercambiables. **Implementar 5.22×10¹⁰ + f de las cartas de Kern (Figs. 26 y 29).**

**7.3 ΔP tubos: 8.58 psi (Sección 6.10) vs 9.75 psi (tabla de resultados, Sección 8).** Inconsistencia interna del trabajo. La cifra trazable aritméticamente es 8.58 = 6.17 + 2.41. **Objetivo de validación: 8.58 psi.** Ambas cumplen <10 psi.

**7.4 Regla de espaciado de deflectores 20–50 % de Ds.** Es una regla pedagógica (razonable); la norma TEMA real (RCB-4) fija mínimo = máx(Ds/5, 2 in) y máximo por luz no soportada (vibración). **Implementar la regla 20–50 % como advertencia suave, citando la diferencia.**

**7.5 Notación Gs.** El trabajo escribe Gs=325.034 (separador de miles europeo) = 325 034 lb/(h·ft²). Verificado por consistencia con Res=17 908.

**7.6 Rd = 0.001 por corriente (Tabla 12).** No hay línea literal "gasolina=0.001 / kerosene=0.001" en la Tabla 12 original, pero el valor es consistente con las entradas de fracciones ligeras tratadas de refinería (0.0005–0.002). **Implementar Rd como entrada editable con 0.001+0.001 por defecto.**

**7.7 ΔP carcasa: sustitución con Ds=29 (in) en una fórmula que requiere ft.** La sustitución escrita del trabajo (0.00165·325034²·29·22/(5.22×10¹⁰·0.06·0.74)) daría ≈48 psi; el trabajo reporta 4.80 psi (un factor 10 de por medio). Con Ds en ft (29/12=2.417, como hace Kern en Ej. 7.3 con 21.25/12) el resultado correcto es ≈3.9–4.0 psi. **Implementar la fórmula con Ds en ft (forma correcta de Kern); en el reporte de validación, marcar 4.80 como "valor reportado por la fuente" y ≈4.0 como "valor de fórmula"; ambos cumplen <7 psi, el veredicto no cambia.**

**7.8 ho: 204.1 reportado vs ≈217 por fórmula cerrada.** La forma 0.36·(k/De)·Res^0.55·Pr^(1/3) con los valores del trabajo da ≈217 (−6 % de diferencia). Probable lectura de jH en la Fig. 28 o redondeo interno. **Implementar la fórmula cerrada (0.36…) por ser la declarada en la Sección 4.3 del trabajo; documentar la tolerancia del 7 % en la validación.**

**7.9 F analítico: 0.8045 reportado vs 0.8024 exacto.** Evaluando la fórmula analítica de Bowman-Mueller-Nagle con R=0.8889 y S=0.5294 (los mismos valores del trabajo) el resultado exacto es F=0.8024, no 0.8045 (−0.26 %). Diferencia atribuible a redondeos intermedios en la evaluación manual de los logaritmos del trabajo. Consecuencia: ΔTm exacto = 34.06 °F vs 34.14 °F reportado. **El simulador implementa la fórmula exacta; tolerancia de validación para F y ΔTm: 0.4 %.** El veredicto F>0.75 no cambia.

## ANEXO A — Tabla 10 de Kern (extracto verificado, tubos 3/4 in DE)

| BWG | Espesor (in) | Di (in) | a't (in²) | a'' (ft²/ft) |
|---|---|---|---|---|
| 10 | 0.134 | 0.482 | 0.182 | 0.1963 |
| 12 | 0.109 | 0.532 | 0.223 | 0.1963 |
| 14 | 0.083 | 0.584 | 0.268 | 0.1963 |
| **16** | **0.065** | **0.620** | **0.302** | **0.1963** |
| 18 | 0.049 | 0.652 | 0.334 | 0.1963 |
| 20 | 0.035 | 0.680 | 0.363* | 0.1963 |

*(Los valores en negrita son los usados por la fuente prioritaria; verificados contra el escaneo original del Apéndice de Kern.)*

## ANEXO B — Tabla 9 de Kern (cuenta de tubos) — estado de digitalización

Ancla verificada por la fuente prioritaria: **tubos 3/4 in DE, arreglo triangular Pt=1 in, Ds=29 in, 6 pasos → Nt=546**. El escaneo del Apéndice (pág. "Tabla 9, arreglo triangular") es de baja calidad OCR; la digitalización completa de la tabla queda como tarea del módulo de datos del simulador (estructura ya preparada como lookup extensible). Cada fila añadida deberá verificarse visualmente contra el escaneo.

## ANEXO C — Reglas críticas de unidades (sistema inglés de Kern)

- μ [lb/(ft·h)] = μ [cP] × **2.42**
- ρ [lb/ft³] = s × **62.4** (densidad del agua de referencia usada por la fuente prioritaria)
- Constante de las Ecs. 7.44/7.45: **5.22×10¹⁰**, con G en lb/(h·ft²), L y D en ft, f en ft²/in² → ΔP en psi
- ΔP de retorno: g′ = gc = **32.2** lb·ft/(lbf·s²), V en ft/s, ρ en lb/ft³, /144 → psi
- Diámetros de catálogo en in → convertir a ft (/12) antes de Re y ΔP
- N+1 = 12·L/B exige L en ft y B en in
