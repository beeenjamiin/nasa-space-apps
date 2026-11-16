# Frontera 2D v3: bosque, animación y misión NASA

Esta entrega conserva las partidas y la campaña Luna–Marte. La prioridad visual es el bosque terrestre, la animación del astronauta y las partículas. La revisión del reto también incorpora alimentos y protección contra partículas solares en la aventura 2D.

## Referencias y dirección artística

Se buscaron y examinaron imágenes de Terraria, incluidas capturas distribuidas por su editor en [Steam](https://store.steampowered.com/app/105600/Terraria/) y una [captura de bosque](https://scalacube.com/blog/terraria/how-to-summon-a-pet-in-terraria). Las referencias se descargaron solo para inspección, fuera del repositorio. No se distribuyen sus imágenes ni sprites.

Lo observado: troncos altos y finos, corteza de tonos cálidos, ramas expuestas, copas irregulares con hojas que caen en grupos, bordes oscuros y montañas separadas por color. El nuevo arte es original: cuatro variantes de árboles de 96×184, con raíces, ramas, corteza y grupos de hojas. Todos los árboles están en la Tierra; no crecen árboles sin protección sobre la Luna.

La Tierra tiene cielo más vivo, vegetación en planos y un área despejada para el lanzamiento. La torre, el ascensor y la pasarela conservan el recorrido hasta la cabina. La aproximación NASA de la arquitectura sigue documentada en `FRONTERA-REFERENCIAS.md`.

## Módulo de animación

**Objetivo:** representar movimiento legible sin separar cabeza o pies del cuerpo.

- `src2d/animation.js`: máquina de estados actualizada por la simulación, no por los FPS de renderizado. Marcha/carrera usan la distancia recorrida para elegir el fotograma; detenerse deja de mover el ciclo de pies.
- `src2d/human.js`: conserva los fotogramas completos de Astro (Ragde, CC0), y añade poses originales para ascenso, caída, impulso y aterrizaje. Sus segmentos unen hombro–codo–mano y cadera–rodilla–bota; no se estiran tiras separadas del sprite.
- `src2d/simulation.js`: alimenta la máquina con posición, velocidad vertical, contacto, minería e impulso.
- `src2d/renderer.js`: dibuja la pose actual. El pico tiene su arco visual durante el picado.

El reposo alterna los fotogramas completos originales con una variación lenta; las dos poses de cada fase aérea varían articulaciones y no reinician todo el personaje. El selector y la cinemática reutilizan el mismo dibujante.

**Modificar:** ajustar la distancia de 3,6 píxeles por fotograma en `animation.js` cambia la cadencia. Las coordenadas de articulaciones están en `suitPose`; mantener las raíces en hombros/cadera y pasar la prueba de silueta antes de cambiarlas.

**Resultado esperado:** salto, caída y aterrizaje distinguibles, sin miembros separados. Es animación pixelada estilizada, no captura de movimiento ni simulación biomecánica.

## Módulo de partículas

`src2d/effects.js` concentra humo, llama, polvo y fragmentos; `cinematic.js` y `renderer.js` lo utilizan.

- Humo terrestre: sprites de 32×32 con contornos escalonados, lóbulos y distintos tonos; la estela se expande y pierde opacidad. Se cachean 16 combinaciones, sin crear lienzos cada cuadro.
- Motor: núcleo caliente y lenguas de llama variables en una rejilla de píxeles.
- Luna: el escape existe, pero no se dibuja humo mezclándose con una atmósfera terrestre. El polvo sigue una parábola con gravedad. Marte usa la referencia gravitacional marciana.
- Juego: los fragmentos de minería y el impulso tienen vida finita. La lista tiene un máximo de 112 partículas, se limpia al cambiar de mundo y consulta sólidos para retirar fragmentos en contacto.

Las partículas cinematográficas son funciones del tiempo: se puede inspeccionar cualquier instante sin reproducir todos los anteriores. Los tamaños, colores, tiempos y velocidades son elecciones visuales. No son un modelo de dinámica de fluidos ni de transporte real de polvo.

## Módulo de vida y refugio

`src2d/life-support.js` usa los parámetros educativos del objeto `support` en `data/pixel-config.json`. `Simulation` guarda estos estados dentro de `support`; los guardados anteriores reciben valores iniciales compatibles.

1. **Nutrición:** se consume gradualmente. Una ración aumenta nutrición hasta 30 puntos y salud hasta 25, con máximos de 100. Comer consume una ración; no devuelve otra.
2. **Cultivo:** acercarse al depósito dentro del hábitat y pulsar E abre la mochila operativa. Iniciar consume 6 agua, 4 energía y una de seis semillas; las luces consumen 0,07 energía por segundo de juego. Falta de energía o base apagada pausa el crecimiento. Al completar el ciclo se añade una ración una sola vez. Las semillas representan también el paquete de cultivo y nutrientes.
3. **Refugio:** reforzarlo cuesta 8 regolitos y 2 hierro una sola vez por planeta. Los mismos materiales también sirven para fabricar. Reduce el factor de exposición dentro, sin eliminarlo ni crear un escudo energético.
4. **Ejercicio solar:** después de activar el hábitat, su reloj operativo avisa a los 90 s, activa un intervalo de exposición a los 114 s y lo termina a los 149 s. El objetivo temporal pasa a buscar refugio y después se retoma la expedición. Las reservas siguen consumiéndose al esperar.
5. **Consecuencias:** exposición acumulada, salud, costes, cultivos, nutrición y fase del ejercicio se conservan al guardar. La bitácora explica cada resultado. El cultivo y el refuerzo se rechazan fuera de la base o sin recursos, sin cobrar parcialmente.

Los doce segundos de cultivo representan un ciclo largo ficticio. Exposición, daño de salud y factores de atenuación son índices de juego, sin unidades clínicas ni espesor físico certificado. No se modelan espectros energéticos, dosis reales ni toda la radiación cósmica de fondo.

## Auditoría del objetivo educativo

El [reto oficial de Space Apps](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) pide administrar un puesto lunar o marciano y experimentar los compromisos entre recursos.

| Necesidad | Comportamiento ejecutable |
| --- | --- |
| Oxígeno, agua, salud y energía | Consumo, producción con electricidad/agua disponibles y límites; fallo del soporte vital puede requerir rescate. |
| Energía solar | Reparación y fabricación tienen coste; paneles adicionales mejoran la producción con capacidad limitada. |
| Protección y evento solar | Aviso simulado, refugio, refuerzo con materiales y exposición acumulada. |
| Alimentos | Reservas y semillas limitadas, nutrición y cultivo con consumo de agua/electricidad. |
| Ciencia | Muestras, análisis con costes, desbloqueo de viaje a Marte y misión científica marciana. |
| Decisiones y resultados | Explorar consume oxígeno; investigar y cultivar compiten por agua/energía; blindaje y fabricación compiten por materiales. |
| Progreso | Guardado local, recuperación de partidas anteriores, campaña verificable hasta Marte, rescate y nueva expedición. |
| Claridad científica | Fuentes oficiales enlazadas; parámetros ficticios identificados; ninguna alerta presentada como observación actual. |

Esto sigue siendo un prototipo 2D: no se implementan en esta entrega dosimetría, ecosistemas completos, crecimiento botánico real, ciclos de iluminación reales ni API en vivo. No contiene telemetría ni pretende ser una misión NASA operativa. Una sola figura jugable representa al comandante; los indicadores resumen la seguridad de la expedición.

## Fuentes científicas consultadas

- [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/): soporte vital, agua y oxígeno. Las tasas del juego son propias.
- [NASA OCHMO: Radiation Protection](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf): protección mediante materiales y refugios; no se usan sus espesores como si el hábitat ficticio estuviera certificado.
- [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/): referencia de clima espacial. No hay consulta de API ni aviso en vivo. El calendario del juego es un ejercicio, no un dato histórico.
- [NASA OSDR VEG-05](https://osdr.nasa.gov/bio/repo/data/payloads/VEG-05) y [Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/): investigación sobre cultivos, luz, agua y nutrientes. No se importan resultados para inventar rendimientos.
- [NASA: Rocket Exhaust on the Moon](https://www.nasa.gov/general/rocket-exhaust-on-the-moon-nasa-supercomputers-reveal-surface-effects/): interacción de escape y regolito con baja gravedad y sin atmósfera.

Las referencias se conservan en `data/pixel-science.json`; `liveData` y la integración de API continúan desactivados.

## Ejecutar, comprobar y aprender

En VS Code, abrir el proyecto, usar Node moderno compatible con el proyecto y ejecutar `npm ci`, `npm run build`, `npm run preview`. Abrir `/pixel.html`. El ZIP independiente tiene `index.html` en la raíz y se sirve con Live Server; no abrir con `file://`.

Pruebas reproducibles:

1. Crear personaje, iniciar sin omitir el vídeo y observar árboles, ascensor, pasarela, humo, órbita y descenso.
2. Caminar, soltar dirección, saltar e impulsar; comprobar brazos, botas y transición de caída a suelo.
3. Mantener el pico: ver la animación y los fragmentos; soltar debe cancelar el progreso.
4. Activar control y acercarse al depósito. Iniciar cultivo, intentar iniciarlo otra vez y comprobar que no se cobra dos veces. Seguir caminando mientras crece.
5. Cultivo sin batería: no avanza. Con electricidad: entrega una ración al terminar.
6. Reforzar con 8 regolitos/2 hierro y comprobar que se cobran una sola vez. Comparar exposición con y sin refugio durante el ejercicio.
7. Guardar y continuar: se mantienen cultivo, provisiones y fase solar. Completar muestras, módulo, viaje y análisis en Marte.

`npm test` ejecuta la suite completa. `node tools/pixel-raster-qa.mjs` genera imágenes de bosque, poses, cultivo y cinemáticas y mide tiempos de rasterizado CPU. `tests/pixel-v3.test.js` comprueba las nuevas relaciones, incluyendo una carga de 12 000 ráfagas para verificar el límite de partículas. No se anuncian esos tiempos como FPS de un dispositivo.

No hubo una nueva sesión gráfica de navegador ni prueba en Android/iOS físicos en este entorno. La interfaz sí se ejercita con Happy DOM y Canvas real, incluidos controles táctiles, guardado y operaciones del hábitat. La distribución CSS real y la descarga en cada navegador móvil necesitan una comprobación manual.

Errores habituales: usar un archivo local bloquea las cargas; servir por HTTP. Una cosecha detenida requiere batería y base activada. Si el botón de refugio falla, comprobar distancia, materiales y si ya está reforzado. Un aviso solar no cambia el cielo lunar ni implica que el juego haya descargado información actual.

## Trabajo de cuatro integrantes

| Integrante | Archivos propios | Contrato |
| --- | --- | --- |
| Arte y mundo | `decor.js`, `habitat.js`, `planets.js` | Devuelven sprites cacheados o dibujan; no modifican recursos. |
| Personaje | `animation.js`, `human.js`, `input.js` | La simulación entrega movimiento; animación devuelve una pose; el dibujante no mueve colisiones. |
| Simulación | `simulation.js`, `life-support.js`, `world.js` | Cambios atómicos, estado guardable y pruebas de campaña/recursos. |
| Interfaz y ciencia | `main.js`, `pixel.html`, `pixel.css`, `pixel-science.json` | Invoca acciones públicas, muestra costes y distingue datos de parámetros. |

`renderer.js` y `cinematic.js` son archivos de integración: acordar un responsable por PR. Usar ramas `feat/arte`, `feat/personaje`, `feat/simulacion`, `feat/interfaz`, actualizar desde `main`, pasar las pruebas pertinentes y revisar el PR antes de integrarlo. No editar los bundles de `dist` a mano; se generan con el build.
