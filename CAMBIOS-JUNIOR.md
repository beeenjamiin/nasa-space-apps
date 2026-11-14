# Integración y experiencia de astronautas junior

La base de integración es `release/orbita-frontera-2d` (`b1d500f`), descendiente de `feature/gameplay-2d` (`cab3b86`). `main` y `feature/interface-education-2d` compartían el commit inicial (`7204799`). Así se reúnen las cuatro ramas por ascendencia sin duplicar motores, inventarios o estados. Las ramas originales permanecen disponibles.

| Petición | Resultado y código |
|---|---|
| 1. Rover de Marte | Receta exclusiva de Marte, despliegue desde la mochila, conducción, freno y energía. Velocidad 125 frente a 65 al correr. `vehicles.js` |
| 2. Color de materiales | Bloques con procedencia persistente y paletas independientes del planeta actual. `block-materials.js`, `materials.js` |
| 3. Puentes | Dos celdas más de tolerancia; colocar sin apoyo consume material y produce caída visible. Vista previa ámbar para inestables. `structural-physics.js`, `simulation.js` |
| 4. Caídas | Umbral seguro 5 m/s y daño reducido. Sigue dependiendo de velocidad de impacto. `fall-damage.js` |
| 5. Ocultar HUD | H y botón ◉, reversible; mantiene controles y alertas importantes. `junior-ui.js` |
| 6. Celular | Joystick con zona muerta, captura de un dedo e independencia de salto/pico. Botones grandes y barra reducida. `input.js`, `junior.css` |
| 7. Introducción | Historia de la tripulación y tres preguntas guiadas en Tierra antes de la cinemática; caminar, saltar y abrir mapa al llegar. `junior-ui.js`, `junior-mission.js` |
| 8. NASA | Once lecciones sencillas con enlaces a fuentes. Gravedad aproximada; datos y parámetros ficticios diferenciados. `pixel-science.json` |
| 9. Consecuencias | Aviso fijo incluye cambios de reservas y materiales; colapsos, daños y medallas tienen mensajes. `junior-ui.js`, `expedition-ui.js` |
| 10. Mensajes sin scroll | Avisos independientes de las listas, desaparecen tras siete segundos. No pausan el mundo. `main.js`, `junior-ui.js` |
| 11. Mapa | Botón superior, leyenda, destinos, posición y marcadores más grandes. Panel adaptable. `expedition-ui.js`, `junior.css` |
| 12. Atajos | I/Tab mochila, C taller, J bitácora, M mapa, H HUD y T traje. `input.js` |
| 13. Tierra | Más capas de nubes, mar con profundidad, crestas y reflejo solar; detalle adicional del cohete. `cinematic.js`, `renderer.js` |
| 14. Menús | Mochila, taller, base y comida y bitácora tienen paneles distintos. Taller muestra existencias y disponibilidad. `pixel.html`, `junior-ui.js` |
| 15. Inglés | Selector en inicio/pausa, guardado local, textos de interfaz, ciencia, objetos, mensajes y rótulos del mundo. `language.js`, `pixel-en.json` |
| 16. Progreso | Seis medallas, 100 puntos por cada logro único. Aviso al desbloquear y colección en bitácora. No generan suministros gratis. `junior-mission.js` |
| 17. Viaje más exigente | Receta 16 suelo + 6 hierro + 25 energía; lista de investigación, reparación solar, baliza, dos comidas y reservas de agua/energía antes de partir. `crafting.js`, `junior-mission.js` |
| 18. Lenguaje claro | “Rocas para investigar”, “roca con capas”, explicaciones de regolito y paneles sin tasas decimales en sus descripciones. `pixel-items.json`, `world.js`, `expedition.js` |
| 19. Legibilidad | Textos explicativos de sistema más grandes, tarjetas amplias, botones táctiles y jerarquía visible. `junior.css` |
| 20. Cápsula y cohete | Juntas, ventanas, escotilla, escudo y motores. Fase explícita de separación a los 17–19 s de la cinemática. `cinematic.js`, `renderer.js` |
| 21. Orden visual | Fondo gris oscuro, secciones claras, botones de acción y estado de recetas. `junior.css` |
| 22. Polvo marciano | Aviso, visibilidad reducida, menor producción solar y demanda del traje. Salud en riesgo al agotarse la energía exterior. No hay polvo atmosférico lunar. `junior-mission.js`, `renderer.js` |
| 23. Bordes | El contorno del terreno usa tonos oscuros de la propia roca en lugar de negro intenso. Conserva una silueta de un píxel. `materials.js` |
| 24. Bitácora | Menú J con medallas, lecciones NASA, descubrimientos y decisiones recientes. `junior-ui.js` |

Los nombres abreviados de archivos JavaScript de esta tabla están dentro de `src2d/`. Los archivos JSON están dentro de `data/` y CSS dentro de `css/`.

## Pruebas reproducibles

- `npm ci`, `npm test`, `npm run build`.
- `npm test`: 87 casos. La campaña física completa se recorre en cuatro mapas; los casos de interfaz incluyen guardar, restaurar, rescate y regreso a la Tierra.
- `python3 tools/junior-browser.py`: 283 comprobaciones en Chromium, incluyendo límites y ausencia de superposición de controles en 320×740, 390×844 y 844×390; joystick y salto simultáneos; avisos de coste, inglés, medallas y tormenta.
- Las pruebas de interfaz marciana usan estados de prueba declarados. La campaña física se valida en la simulación, no se presenta como una partida completa manual en el navegador.
- No se han probado dispositivos Android/iOS físicos. El muestreo de renderizado corresponde a Chromium sin pantalla en esta máquina; no garantiza FPS en otros equipos.

## Guardados y diseño científico

El formato y la clave de LocalStorage se conservan. Se validan las nuevas propiedades. Las partidas antiguas omiten el tutorial y mantienen recursos, mapas y progreso. La procedencia perdida antes de introducirla no puede reconstruirse históricamente; se aplica la migración existente.

La preparación de Marte se exige en partidas nuevas y restauradas que pasan por la comprobación de salida; los desbloqueos ya conseguidos se conservan. Las tormentas, puntos, medallas, capacidades estructurales, recetas y tiempos son parámetros de jugabilidad. No representan telemetría NASA ni un diseño real de vehículo, traje o escudo.
