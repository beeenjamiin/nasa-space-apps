# Mecánicas 2D: integración de Agente 1

> En `release/orbita-frontera-2d` las conexiones de interfaz descritas como
> pendientes en este documento ya están implementadas. Ver
> `LEEME-EXPORTACION.md` y `src2d/expedition-ui.js`. El resto de este documento
> conserva el contrato y alcance del commit original de mecánicas.

Rama `feature/gameplay-2d`, basada en `7204799`. Worktree propio en
`/workspace/nasa-space-apps-gameplay`; no se cambia la rama ni los archivos del
checkout compartido. No se integra automáticamente en `main`.

## Uso del rover

En Marte, acercarse al banco y fabricar **Rover terrestre de Marte**: 12 regolitos,
8 hierro y 18 energía. La receta utiliza el catálogo y la fabricación existentes.
El rover queda en la mochila; salir con traje y pulsar **USAR** para desplegarlo en
un lugar cercano libre. Se comprueban superficie, pendiente, edificios, paneles,
otros vehículos y espacio del astronauta. Un rechazo no gasta el objeto.

Acercarse y pulsar **E**, o el botón contextual táctil existente. A/D y las flechas
o botones laterales aceleran; soltar desacelera. Espacio/el botón de salto frena
inmediatamente; `tick(dt, {brake:true})` permite frenado continuo. E sale cuando hay
espacio junto al vehículo. No salta, impulsa ni mina mientras se conduce. El motor
consume la energía existente de la expedición. No tiene otro inventario ni una
reserva de combustible paralela.

Máximo tres rovers desplegados en Marte. Se guardan identidad, posición y sentido,
incluido el vehículo ocupado. Al cargar se detienen las velocidades para evitar
movimientos involuntarios; la gravedad restablece el contacto. El rover puede
subir un bloque de 8 px; paredes mayores requieren otra ruta. Las colisiones se
subdividen para no atravesar bloques finos. Rescate y regreso cancelan conducción.
Los gráficos y las caídas están en `gameplay-view.js`, con dos líneas de conexión
en `renderer.js`; no se modifica ningún HUD ni control.

## Materiales y guardado

`block-materials.js` define ocho identidades: `moon|mars` × `dust|rock|iron|ice`.
Cada una aporta procedencia, ID estable, dureza, tiempo de minería, capacidad de
soporte y semilla de textura. `world.materialAt(tx,ty)` devuelve esas propiedades.

Los IDs históricos 0–6 permanecen. El terreno generado conserva 1–4 y se interpreta
según su planeta natal. Los bloques colocados usan 7–14 y su paleta NO se calcula
con el planeta de destino. `world.get()` puede devolver esos IDs nuevos: consultar
`materialAt().baseBlock` para reconocer el tipo histórico. `world.set()` valida IDs
y coordenadas, actualiza cachés y el conjunto de construcciones.

Los contadores `s.inventory.regolith/iron/ice` siguen siendo la API existente.
`s.materials` añade el desglose por procedencia, sin crear una segunda reserva.
Los costes de taller, mejoras, soporte vital y rescate concilian ese desglose;
no se pueden gastar los mismos materiales dos veces. El orden de gasto es el
orden estable del catálogo (primero Luna). Polvo y roca comparten el total de
regolito pero conservan su tipo al volver a colocarse.

- `sim.materialInventory()`: lista de materiales disponibles y cantidades.
- `sim.place(tx,ty,materialId?)`: conserva la firma anterior; sin ID elige el primer
  material de regolito disponible. Con ID permite también colocar hierro/hielo.
- `sim.previewBlock(tx,ty,materialId?)`: `{ok, stable, reason, material, span}`;
  no cobra nada. `reason` explica falta de soporte, alcance, ocupación, etc.

Se mantienen `SAVE_KEY` y los esquemas 1/2, migraciones de celdas, semillas, misiones
y excavaciones. `restoreState` valida los nuevos campos `materials`, `vehicles`,
`driving` y `inventory.rovers`. Las partidas antiguas no registraban procedencia:
sus existencias se asignan una sola vez al planeta guardado; no es posible inferir
un origen lunar que nunca se guardó. Los bloques antiguos colocados tampoco se
distinguían del suelo: se conservan como anclajes heredados para no destruir esas
construcciones. Los nuevos bloques sí están sujetos a estabilidad. Las versiones
anteriores del juego no conocen los nuevos IDs: no usarlas para regrabar una partida
que ya contenga estas mecánicas.

## Estabilidad y daño

`structural-physics.js` recorre solo las celdas construidas, cuando cambia la
revisión del terreno. La compresión hacia arriba no añade vuelo horizontal;
las extensiones laterales y cargas suspendidas consumen capacidad. Una celda
requiere una ruta de apoyo hasta terreno natural inferior; los ciclos flotantes
no se sostienen entre sí. La capacidad se reduce con la gravedad: una roca admite
6 celdas de vuelo lunar y 3 marcianas. Son reglas de juego, no cálculos de ingeniería.

La colocación inestable se rechaza sin cobrar. Si se excava su apoyo, colapsan las
celdas dependientes: se retiran del terreno y del guardado. Hasta 128 fragmentos se
animan con gravedad local durante un máximo de 3 s. Son escombros visuales, no
material recuperable ni bloques físicos que puedan duplicarse. No hay recorrido
completo de la cuadrícula por fotograma; las previsualizaciones repetidas se cachean.

`fall-damage.js` usa velocidad de impacto en m/s (16 px por unidad de metro) y
energía cinética específica por encima de 4,25 m/s. Los saltos normales no dañan;
la gravedad determina la velocidad alcanzada desde una misma altura. Se cobra
salud una vez por contacto, con máximo 100. `sim.lastFallImpact` contiene velocidad,
gravedad, daño real y salud resultante. El techo y el pequeño escalón no causan daño.

La minería mantiene la lógica existente de mantener/cancelar, alcance, línea de
visión y recompensas; los tiempos base son polvo .38 s, hielo .50 s, roca .55 s,
hierro .70 s, divididos por el multiplicador del pico I–IV.
`sim.mining` conserva `elapsed/needed/tx/ty` para el renderizador existente;
`sim.miningSnapshot()` añade `active`, `progress` (0–1) y `material`.

## Contrato del mapa para Agente 2

No se añade interfaz visual, atajo de teclado ni modal de mapa: pertenecen al
Agente 2. La lógica está conectada a cada `Simulation`:

```js
sim.openMap();                 // abre lógicamente; devuelve snapshot
sim.closeMap();
sim.toggleMap();               // devuelve booleano
const view = sim.mapSnapshot();
sim.setMapWaypoint(worldX, worldY); // solo navega, nunca teletransporta
sim.setMapWaypoint(null);      // quita el marcador del planeta actual
```

El snapshot incluye `open`, `planet`, `revision`, `bounds`, `player`, `markers`,
`terrain`, `waypoint` y `navigation`. `terrain.tiles` es una copia `Uint8Array`
de 160 × 43 celdas; cada celda representa 4 × 4 bloques (32 px). Se conserva el
primer sólido de cada grupo como silueta simplificada, no todas sus capas. Usar
`materialForBlock(id, view.planet)` para obtener la paleta correspondiente. Se
reconstruye al cambiar mundo/revisión, no al mover al jugador.

Jugador y marcadores llevan `x/y` en píxeles del mundo y `mapX/mapY` en celdas
del mapa. `player.meters` divide por 16; el eje Y crece hacia abajo. Hay hábitat,
nave, estaciones, muestras (con `collected`), descubrimientos (con `visited`) y
rovers. Las coordenadas se actualizan al consultar. Las rutas exponen distancia
en metros de juego y ángulo en radianes (`navigation.heading`). Los waypoints
son independientes por planeta. Apertura y waypoints son estado transitorio de
interfaz, no cambian la partida guardada.

## Eventos compartidos

```js
const unsubscribe = sim.on('fall:damage', event => hud.showDamage(event.damage));
// desmontar UI: unsubscribe();
const recent = sim.drainEvents(); // alternativa al listener; vacía la cola
```

Cada evento lleva `type`, `sequence`, `planet`, `time`. La cola está limitada a
128 entradas. Los errores de un listener se aíslan y quedan en `integration:error`.

| Evento | Datos relevantes |
| --- | --- |
| `fall:damage` | `speed` (m/s), `gravity`, `damage`, `health`, `x`, `y` |
| `mining:progress` | `tx`, `ty`, `material`, `elapsed`, `needed`, `progress` |
| `mining:complete` / `mining:cancelled` | celda; `complete` también material/recompensa |
| `structure:placed` | resultado de previsualización estable |
| `structure:collapse` | `count`, `blocks: [{tx,ty,material}]` |
| `vehicle:deployed` | copia de `vehicle` |
| `vehicle:entered` / `vehicle:exited` / `vehicle:recovered` | `id` |
| `map:visibility` / `map:waypoint` | `open` / `waypoint` |

`sim.vehicleState()` devuelve copias de vehículos, el ID conducido y la energía.
También están disponibles `enterVehicle(id)` y `exitVehicle()` para controles
futuros. La posición durante conducción se lee desde ese snapshot o desde
`s.player`, que sigue representando al único astronauta.

## Integración y comprobación

El Agente 2 puede conectar mapa, avisos de caída/colapso, selector de material e
icono de rover usando estos contratos. Las tarjetas actuales ya muestran el nombre
del rover y permiten USAR; su icono específico queda para la interfaz.

`main.js`, `input.js`, HTML, CSS, cinemáticas y contenido NASA permanecen intactos.
`renderer.js` solo añade el import y la llamada a `drawGameplayWorld` antes de la
iluminación. Conservar ese hook al integrar cualquier cambio simultáneo del Agente 2.
El catálogo JSON añade una receta y un objeto sin alterar los anteriores.

Validación: `npm test`, `npm run build` y `npm run test:raster`. Para validar build
sin tocar los bundles compartidos, copiar `package.json`, `pixel.html`, `src2d/`,
`data/` y `tools/` a un directorio temporal, enlazar `node_modules` y ejecutar allí
`npm run build`. Regenerar `index.html` y `pixel-game.js` DESPUÉS de integrar ambos
agentes; los bundles no se incluyen en este commit para evitar pisar su trabajo.

Las pruebas nuevas cubren mecánicas, Canvas real, el flujo existente de fabricar/
usar/conducir con Happy DOM, mapas y persistencia. Generan
`test-results/pixel/gameplay-mars-rover.png`. No sustituyen una sesión de prueba
visual en navegador ni pruebas de rendimiento en dispositivos móviles físicos.

Resultados ejecutados en esta entrega: **79/79 pruebas aprobadas**, cero omitidas;
`npm run build` aprobado en copia temporal; `npm run test:raster` aprobado con 360
cuadros CPU. Una estructura sintética de 10 000 celdas apoyadas se analizó sin
colapsos falsos. El checkout compartido permaneció en `main`, sin modificaciones
de código. Solo se incluyen los archivos propios enumerados por el commit.
