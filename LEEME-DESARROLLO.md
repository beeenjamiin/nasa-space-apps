# Actualización de integración junior

Consulta primero `README.md` y `CAMBIOS-JUNIOR.md`: describen los nuevos menús, atajos, costes y pruebas. El contenido siguiente documenta versiones anteriores.

# Frontera 2D v5: fabricar, explorar y volver a casa

> Entrega integrada: mapa, selección de materiales, rover y avisos ya conectados.
> Consulta `LEEME-EXPORTACION.md` para ejecutar el ZIP y sus pruebas en Chromium.
> Las notas de versiones anteriores que indican ausencia de pruebas de navegador
> describen aquellas entregas, no esta exportación.

Esta versión conecta la fabricación con el inventario y la colocación manual, amplía la exploración marciana y cierra la expedición con el regreso a la Tierra. Conserva el soporte vital, la personalización, el pico mejorable, el salto y el ascenso de un solo bloque.

## Qué cambió y cómo usarlo

| Petición | Funcionamiento ejecutable |
| --- | --- |
| Más mecánicas 2D | Iluminación con lámparas colocables, balizas de ruta científica, consumibles de emergencia y diario de descubrimientos. |
| Nombres al hacer hover | Inventario y barra rápida muestran nombre/descripción al pasar el ratón o recibir foco de teclado. Las tarjetas táctiles muestran nombres visibles. |
| Vetas mejores | El generador 3 dibuja cuerpos minerales que se ramifican y cambian de dirección, con conexiones irregulares entre celdas. |
| Textura de piedra | Paletas por planeta, facetas, granos y pequeñas fracturas. Las vetas dejan de tener un recuadro repetido por bloque. |
| Quitar el traje | Pulsar T, usar el botón de la mochila o interactuar con el armario EVA. El personaje cambia a ropa sin casco ni mochila. La salida se bloquea hasta equiparse. |
| Energía algo más rápida | La producción del campo base pasa de 0,10 a 0,12 unidades de juego/s, conservando el consumo. Los paneles añadidos producen según su nivel. |
| Oscuridad progresiva | Aumenta suavemente según profundidad y tiempo; al subir también se desvanece gradualmente. El traje y las lámparas crean zonas de luz. |
| Colocación manual | Fabricar añade el objeto a la mochila. Elegir COLOCAR activa una previsualización; no aparece instalado por sí solo. |
| Paneles por niveles | I disponible al inicio, II tras el análisis lunar, III tras el análisis marciano. Tienen costes y producción diferentes. |
| Más recetas | Nueve recetas de objetos/módulos, además de las mejoras del pico, el cultivo y el refuerzo del refugio. |
| Más misiones en Marte | Preparar una baliza, visitar tres lugares, desplegar una señal científica y elaborar un informe con costes. |
| Volver a la Tierra | Fabricar el módulo de regreso, llegar a la nave y completar ascenso, órbita, transferencia, reentrada y amerizaje. Después aparece el informe final guardable. |

## Módulo de inventario y fabricación

**Archivos:** `data/pixel-items.json`, `src2d/crafting.js`, `src2d/inventory-ui.js`, `src2d/icons.js`; integración en `main.js`, `pixel.html` y `css/pixel.css`.

El JSON es la fuente de nombres, descripciones, ingredientes, productos y condiciones de desbloqueo. `craftItem()` exige cercanía al banco, revisa todos los ingredientes y solo después descuenta recursos. Los módulos de nave se instalan una sola vez; los objetos colocables permanecen en la mochila.

| Receta | Coste | Función |
| --- | --- | --- |
| Panel I | 4 regolitos, 2 hierro, 5 energía | +0,045 energía/s de juego al desplegarlo. |
| Panel II | 6 regolitos, 4 hierro, 8 energía | +0,075 energía/s; requiere análisis lunar. |
| Panel III | 10 regolitos, 6 hierro, 12 energía | +0,115 energía/s; requiere análisis marciano. |
| Lámpara | 3 regolitos, 1 hierro, 6 energía | Ilumina una cueva con carga finita. |
| Baliza | 4 regolitos, 2 hierro, 4 energía | Marca una ruta y permite completar la campaña científica. |
| Batería portátil | 3 regolitos, 2 hierro, 20 energía | Recupera hasta 18 energía una vez: almacena energía con pérdidas. |
| Botiquín | 4 regolitos, 2 hierro, 2 agua, 6 energía | Recupera hasta 30 salud y se consume. |
| Módulo a Marte | 12 regolitos, 4 hierro, 20 energía | Desbloquea el viaje después de investigar la Luna. |
| Módulo de regreso | 16 regolitos, 6 hierro, 2 hielo, 4 agua, 25 energía | Disponible tras completar el informe marciano. |

Los costes son parámetros educativos. El procesamiento de materiales y los suministros de los módulos se agrupan en recetas; no son una fórmula real de combustible o de fabricación aeroespacial.

**Resultado esperado:** pulsar FABRICAR cambia cantidades, pero no coloca un panel en el mundo. Un rechazo por falta de recursos no cobra ingredientes parciales. Las baterías y botiquines no tienen usos infinitos.

**Modificar:** añadir una entrada en `items` y una receta en `recipes`. Para que un objeto pueda desplegarse, debe tener `placeable` y un tipo admitido por el módulo; no basta con añadir un nombre. Las recetas actuales ya tienen toda su lógica implementada.

## Módulo de colocación

**Funciones:** `placementPreview()` calcula el resultado sin gastar nada; `placeCrafted()` repite la validación y consume una unidad únicamente si puede instalarse.

Pasos:

1. Fabricar en el banco y abrir la mochila.
2. Pulsar la tarjeta del objeto que indica COLOCAR.
3. Apuntar al suelo. Verde significa que cabe; rojo indica un rechazo.
4. En computadora, pulsar clic o B. En móvil, tocar el lugar del mundo o usar el botón contextual para el punto frontal.
5. Escape o × cancela. Cancelar no gasta el objeto.

Se comprueban alcance, línea de visión, suelo, espacio superior, paredes, instalaciones próximas y límites de cantidad. Un panel requiere superficie exterior y apoyos próximos; una lámpara o baliza puede instalarse bajo tierra. No se pueden colocar objetos a través de una pared ni salir a instalar sin traje. Hay un máximo de ocho paneles adicionales y 24 lámparas/balizas por planeta.

Los paneles de partidas anteriores mantienen sus posiciones y se interpretan como nivel I si no tenían nivel guardado. La colocación manual afecta a los objetos fabricados a partir de esta versión.

## Traje y personaje

**Archivos:** `simulation.js`, `human.js`, `input.js`, `renderer.js` y la interfaz.

El estado `equipment.suited` se conserva al guardar. Quitar el traje requiere estar dentro del hábitat con soporte vital y energía. Se elimina visualmente el casco/mochila y se representa ropa de vuelo con rostro, cabello, manos y botas de trabajo. Se conservan las animaciones completas y las articulaciones conectadas.

El movimiento consulta `suitAllows()` antes de cruzar el límite interior. Si falta traje, se detiene y explica cómo equiparlo; el mensaje tiene un intervalo para no llenar la bitácora. El impulso ficticio del traje tampoco funciona con ropa civil. Las reservas de oxígeno siguen siendo un indicador agregado del soporte vital.

**Prueba:** activar el control, pulsar T y caminar hacia la salida. Debe verse ropa civil y detenerse dentro. Pulsar T otra vez permite salir. El armario EVA se identifica con E al acercarse.

## Piedra, vetas y luz

**Archivos:** `world.js`, `materials.js`, `lighting.js`, `equipment-view.js` y `renderer.js`.

El generador 3 conserva las alturas sembradas del generador 2, pero sustituye los cuadros de ruido mineral por cuerpos conectados que avanzan, giran y se ramifican. El suelo inicial, el hábitat y los afloramientos de aprendizaje siguen siendo accesibles. Las vetas son ficticias y no representan un yacimiento NASA medido.

Las partidas de versiones 1 y 2 retienen exactamente sus celdas originales y excavaciones. Reciben el acabado visual nuevo sin regenerar sus minerales. Para ver la distribución nueva, crear una expedición nueva. La semilla y la versión del generador se guardan juntas.

`geologyTile()` combina color de distintas escalas, facetas, granos y fracturas pequeñas. Los segmentos minerales se conectan con variaciones de posición y brillo. Las texturas se dibujan en chunks cacheados; no se vuelven a pintar todos los bloques en cada cuadro. Excavar invalida también los chunks vecinos para actualizar los bordes.

`darknessAtDepth()` usa una curva continua entre poca profundidad y una zona profunda; `CaveLighting` interpola el cambio con tiempo independiente del FPS. Una máscara se reutiliza, deja pasar la luz del traje y añade círculos suaves en lámparas activas. Cada lámpara pierde carga gradualmente; no funciona para siempre ni requiere crear un lienzo nuevo cada cuadro. Su carga es un índice de autonomía, no una capacidad energética real.

## Campaña ampliada y regreso

**Archivos:** `expedition.js`, `simulation.js`, `cinematic.js`, `main.js` y el informe en `pixel.html`.

Después del primer análisis marciano:

1. Fabricar una baliza antes de explorar.
2. Investigar el archivo de capas sedimentarias.
3. Investigar minerales como pistas de agua antigua.
4. Revisar la estación de hielo. Da tres muestras congeladas una sola vez.
5. Colocar la baliza junto a uno de los lugares estudiados.
6. Regresar al laboratorio y elaborar el informe: 4 agua y 12 energía.
7. Fabricar el módulo de regreso en el banco.
8. Llegar con traje a la nave y pulsar E.
9. Completar o saltar la cinemática de 26 segundos: ascenso de Marte, órbita, transferencia, reentrada y paracaídas/amerizaje.
10. Ver y guardar el informe final en la Tierra. Continuar la partida vuelve a este informe.

El regreso es el cierre de esta expedición, con cinemática e informe; no se implementa un tercer mundo abierto terrestre. El estado conserva el último mapa planetario para reconstruir el guardado y marca `returnedEarth` como ubicación final/campaña terminada. Se puede iniciar otra expedición desde el inicio.

Las observaciones tienen lugares e instrumentos visibles, instrucciones y consecuencias. Las capas o minerales no se presentan como prueba de vida. Un mismo descubrimiento no da hielo repetidamente. El informe, los módulos y el retorno tienen comprobaciones para impedir saltos de progreso o cobros repetidos.

## Referencias consultadas

Las ideas de interfaz y colocación se contrastaron con [Placement](https://terraria.wiki.gg/wiki/Placement), [Tooltips](https://terraria.wiki.gg/wiki/Tooltips) y [Torches](https://terraria.wiki.gg/wiki/Torches) de la wiki oficial de Terraria. Se aplicaron sus conceptos de previsualización, información contextual e iluminación colocable con arte y código propios; en la Luna se utilizan lámparas eléctricas.

Las nuevas misiones usan referencias oficiales:

- [NASA: Sedimentary Signs of a Martian Lakebed](https://science.nasa.gov/resource/sedimentary-signs-of-a-martian-lakebed-2/?site=msl), para interpretar capas.
- [NASA Astrobiology: Evidence for Ancient Water on Mars](https://astrobiology.nasa.gov/news/evidence-for-ancient-water-on-mars/), para distinguir pistas minerales de conclusiones sobre vida o agua actual.
- [NASA: Locating Ice on Mars](https://www.nasa.gov/solar-system/nasa-is-locating-ice-on-mars-with-this-new-map/), para el interés del hielo del subsuelo y su cartografía.

No se importan mapas SWIM, mediciones de estos lugares ni datos actuales. La ubicación, los rendimientos, las recetas, el brillo, las reservas y los viajes comprimidos son parámetros del juego. El regreso humano desde Marte se representa como una misión futura imaginada. Las fuentes DONKI, OSDR, gravedad y soporte vital anteriores siguen disponibles en el diálogo de ciencia y `pixel-science.json`.

## Arquitectura y trabajo de cuatro integrantes

| Área | Archivos | Contrato |
| --- | --- | --- |
| Mundo y acabado | `world.js`, `materials.js`, `lighting.js`, `equipment-view.js` | Geometría/estado del terreno separados del dibujo; cachés acotadas. |
| Personaje | `human.js`, `animation.js`, `input.js` | El dibujo recibe pose/traje; no modifica reservas ni posición. |
| Simulación | `simulation.js`, `crafting.js`, `expedition.js`, `life-support.js` | Validaciones, costes atómicos, progreso y estado guardable. |
| Interfaz y ciencia | `main.js`, `inventory-ui.js`, `pixel.html`, CSS y JSON | Invoca acciones públicas, muestra nombres/costes y diferencia referencias de parámetros. |

`renderer.js` y `cinematic.js` conectan los módulos. Coordinar un responsable por PR para esos archivos. Usar ramas de área, traer `main`, ejecutar las pruebas pertinentes y revisar el PR antes de integrar. El bundle es generado: no editar `pixel-game.js` a mano.

## Ejecutar en VS Code

**Repositorio principal:** `npm ci`, `npm test`, `npm run build`, `npm run preview`; abrir `/pixel.html`.

**ZIP v5 independiente:** el juego compilado abre sirviendo `index.html` con Live Server. Para editar y probar, usar Node 24 o posterior, ejecutar `npm install`, `npm test`, `npm run build`. Sus fuentes están en `src2d/`, los JSON en `data/` y las pruebas en `tests/`. Editar la estructura en `pixel.html`; el build genera `index.html` y el bundle. `npm run preview` sirve el paquete, o se puede seguir usando Live Server. El ZIP contiene la aventura completa y sus licencias.

## Verificación y problemas habituales

La suite principal aprobó 238 pruebas; las 55 de la aventura 2D incluyen la campaña física hasta la Tierra en cuatro mapas, fabricación/colocación, traje y restricciones de salida, nombres del inventario con hover, toque en ambas orientaciones, iluminación, guardado y regreso.

Pasos manuales reproducibles:

1. Pasar por las tarjetas del inventario y enfocarlas con Tab: debe aparecer el nombre correcto.
2. Fabricar panel I: debe sumarse a la mochila sin aumentar las instalaciones. Elegir COLOCAR y probar un lugar libre, uno lejano y uno detrás de una pared.
3. Desbloquear II/III mediante ciencia y comparar producción usando la misma base.
4. Crear una lámpara, entrar en una cueva, observar el oscurecimiento gradual y colocarla para iluminar.
5. Quitar el traje dentro, comprobar su aspecto y el bloqueo de salida; equiparlo y salir.
6. Consumir una batería o botiquín con reservas bajas: debe desaparecer una unidad y respetar el máximo de 100.
7. Completar los tres descubrimientos y regresar; guardar y continuar debe conservar el informe final.

Si no se puede colocar, comprobar alcance, apoyo, línea de visión, separación y traje. Si el panel no produce, revisar que se haya desplegado, no solo fabricado. Si no se habilita el regreso, revisar baliza junto al sitio e informe del laboratorio. Si un mapa viejo tiene sus vetas anteriores, es la compatibilidad esperada. No abrir con `file://`; usar HTTP.

Se revisaron renders Canvas de ropa civil, piedra/vetas, lámparas y las fases del regreso. No hubo una nueva sesión gráfica de navegador ni pruebas en Android/iOS físicos; las pruebas de interfaz usan Happy DOM con Canvas real. La distribución CSS real y el rendimiento de un dispositivo deben comprobarse manualmente. Los tiempos de rasterizado CPU no son FPS de un navegador.
