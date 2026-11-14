# Frontera 2D v4: cielo, escalones, pico y mapas

Esta actualización conserva la campaña, la ciencia y los sistemas de vida de v3. Cambia cinco partes ejecutables del juego: cielo, ascenso automático, mejoras del pico, fragmentos de minería y generación con semillas.

## Cielo pixelado

`src2d/sky.js` dibuja estrellas de distinto brillo/color, una franja tenue de la Vía Láctea, un Sol con contorno escalonado y una Tierra más grande y detallada. En Marte usa bruma de distintos tonos y pequeños satélites ilustrados. La Tierra del comienzo incluye un Sol con halo atmosférico.

La superficie y las escenas de vuelo comparten las funciones de cielo. El vuelo sigue sin terreno en el borde inferior. Las estrellas lunares no parpadean como si hubiera turbulencia atmosférica. La composición es una ilustración artística: no calcula efemérides, posiciones reales de satélites ni exposición de una cámara científica.

Las capas estelares se generan una vez por tamaño y tipo, se reutilizan al dibujar y tienen una caché máxima de diez entradas por documento. No se crean cientos de objetos o lienzos en cada cuadro. `renderer.js` y `cinematic.js` invocan este módulo.

## Subir exactamente un bloque

El método `Simulation.tryStep` de `src2d/simulation.js` se ejecuta cuando hay una colisión horizontal. Requiere contacto con el suelo y movimiento vertical no ascendente.

1. Calcula el borde de la celda inmediatamente bajo los pies.
2. Rechaza cualquier elevación superior a `TILE`, actualmente 8 píxeles, salvo una tolerancia numérica de 0,05 píxeles.
3. Comprueba que todo el cuerpo cabe en la posición elevada y que tampoco atraviesa un techo al subir.
4. Exige soporte real bajo el borde delantero y mueve el controlador al escalón.

Una pared de dos o más bloques queda bloqueada: hay que saltar o picar. El ascenso no dispara salto, no gasta el impulso del traje y funciona con el mismo eje de movimiento para teclado o botones táctiles. No se activa al caer o saltar.

Después del movimiento, una sonda de apoyo de 0,06 píxeles evita que la tolerancia del colisionador cambie el estado a caída durante un solo cuadro al caminar sobre el suelo o el escalón. No aplica mientras la velocidad vertical sea ascendente.

## Mejorar el pico

`data/pixel-config.json`, objeto `pickaxe`, define costes y multiplicadores. `Simulation.upgradePickaxe()` comprueba cercanía al banco, materiales, energía y nivel máximo antes de descontar nada.

| Nivel obtenido | Regolito | Hierro | Energía | Rapidez respecto al nivel I |
| --- | ---: | ---: | ---: | ---: |
| II | 6 | 2 | 6 | ×1,35 |
| III | 10 | 4 | 9 | ×1,8 |
| IV | 14 | 6 | 12 | ×2,4 |

Acercarse al banco de fabricación, pulsar E y usar **Mejorar pico**. La mochila muestra el nivel, la rapidez y el coste siguiente. El inventario rápido muestra I–IV. En el nivel IV el botón indica el máximo y no cobra más.

La duración de picado de cada material se divide por el multiplicador del nivel. Soltar o cambiar de objetivo sigue cancelando el trabajo. No hay rotura instantánea por un clic breve. El nivel se guarda en `equipment.pickaxe`; las partidas anteriores comienzan con I. El color de la cabeza del pico cambia durante la animación.

Para cambiar el equilibrio, editar `pickaxe.speed` y `pickaxe.upgrades` juntos. Son parámetros de diseño, no propiedades científicas de un pico o de los minerales.

## Rocas durante el picado

Antes solo había fragmentos cuando el bloque terminaba de romperse. Ahora `mine()` emite un impacto hasta ocho veces por segundo mientras se mantiene un objetivo válido. El punto está fuera de la cara golpeada para que los fragmentos no desaparezcan inmediatamente dentro del sólido.

`src2d/effects.js` dibuja pequeños fragmentos de silueta irregular, con borde, sombra y brillo. El hielo y el mineral tienen tonos distintos. Salen hacia el espacio libre, caen con la referencia gravitacional del planeta, se desvanecen y se retiran al tocar sólidos o agotar su vida, de 0,55 a 0,95 segundos. Romper el bloque produce una ráfaga adicional.

Son efectos visuales: no añaden materiales al inventario. Solo la rotura válida entrega una unidad. Se mantiene el máximo compartido de 112 partículas para evitar que golpear continuamente acumule objetos.

## Mapas con semilla

Al crear una expedición, `freshWorldSeed()` genera un entero de 32 bits. Se guarda junto con la versión del generador y se deriva una semilla diferente para Luna y Marte. Crear otra expedición produce otra semilla; continuar una partida reconstruye la misma.

- `world.js`: el relieve, los pequeños cráteres, las cuevas y la distribución de minerales dependen de la semilla. La zona nivelada de la base y algunos afloramientos de aprendizaje permanecen diseñados para que se pueda empezar y fabricar.
- `PixelWorld.surfaceAt()` y `PixelWorld.pointsOfInterest()`: consultan la semilla del mundo actual. Muestras, rocas, profundidad visual y apoyos se sitúan con esa geometría.
- `simulation.js`: conserva `worldSeed`, `worldVersion`, los cambios excavados de ambos planetas y el nivel de herramienta al guardar.
- `main.js`: usa una semilla nueva al terminar el selector. La mochila muestra el identificador de mapa para reproducir problemas.

Las partidas previas sin semilla conservan exactamente el generador original y sus excavaciones; no se regeneran sobre otro relieve. El guardado sigue siendo compatible con las celdas antiguas de 16 píxeles y las actuales de 8. Los mapas son ficticios, no reconstrucciones de un punto lunar o marciano real.

Para reproducir un mapa durante desarrollo: `new Simulation(createState(perfil, 134))`. Para inspeccionar el relieve de la partida, usar `sim.world.surfaceAt(x)` en lugar de la función global sin semilla. No modificar los valores guardados de semilla o versión en una partida excavada.

## Archivos y conexión

| Área | Archivos |
| --- | --- |
| Cielo | `sky.js`, integración en `renderer.js` y `cinematic.js` |
| Movimiento y herramienta | `simulation.js`, parámetros en `pixel-config.json` |
| Mapas | `world.js`, creación/restauración en `simulation.js` y `main.js` |
| Fragmentos | `effects.js`, impactos desde `simulation.js` |
| Interfaz | `pixel.html`, `main.js`, color de herramienta en `human.js` |
| Pruebas | `pixel-v4.test.js`, campaña ampliada y pruebas de interfaz |

La división de cuatro integrantes y los sistemas NASA de la entrega anterior se explican en `FRONTERA-V3.md`, incluida también en el ZIP como guía de soporte y animación.

## Ejecutar y comprobar

En VS Code: `npm ci`, `npm run build`, `npm run preview`; abrir `/pixel.html`. En el ZIP independiente, servir `index.html` con Live Server. Los archivos completos editables están en `source/src2d` y `source/data`.

Pruebas manuales:

1. Caminar contra un bloque de 8 píxeles: debe subir sin pulsar salto. Repetir hacia la izquierda.
2. Colocar dos bloques apilados: caminar debe detenerse. Con espacio se puede saltar si hay altura libre.
3. Repetir con techo bajo y estando en el aire: el ascenso automático debe rechazarse.
4. Reunir materiales, acercarse al banco, pulsar E y mejorar el pico. Comparar la barra de picado del mismo material antes y después.
5. Mantener el pico sobre un mineral: deben aparecer fragmentos antes de romperlo y desaparecer después; el inventario no debe aumentar por cada fragmento.
6. Guardar y continuar: comprobar semilla, nivel del pico y bloques excavados.
7. Crear dos expediciones y explorar al este: el relieve y el subsuelo deben variar. El área de aprendizaje de la base se conserva.
8. Observar cielo lunar, marciano y transferencia: más detalle, cielo marciano diferenciado y ausencia de suelo durante el viaje.

`npm test` incluye las nuevas pruebas de escalones en ambas direcciones/planetas y con pasos de 30, 60 y 144 Hz, bloqueos de altura, mejoras, fragmentos, semillas, guardados y cielo. La campaña completa se recorre físicamente en el mapa original y tres mapas sembrados. `node tools/pixel-raster-qa.mjs` genera imágenes de dos semillas y de los fragmentos, además de los renders anteriores.

Errores habituales: si no sube, revisar si hay dos bloques o poco espacio para la cabeza; si no mejora, comprobar cercanía al banco y costes; si el mundo no cambia al continuar, es correcto, la semilla persiste. Abrir el juego por HTTP, no con `file://`.

No se ejecutó una nueva sesión gráfica de navegador ni pruebas en Android/iOS físicos. Se ejecutaron pruebas funcionales con Canvas real/Happy DOM y renders CPU; esos tiempos no representan FPS de un navegador ni de un celular.
