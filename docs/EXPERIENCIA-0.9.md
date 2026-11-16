# v0.9 — Experiencia visual, controles y sonido

Base exacta: release `v0.8.0` (`c1be221`). Se conservan sus tres escenas iniciales, las ocho pruebas jugables de entrenamiento, los guardados y la campaña Luna–Marte–Tierra. No se añade ningún framework ni dependencia de ejecución.

## Los diez puntos

| Punto | Implementación | Comprobación |
|---|---|---|
| 1. Carro e introducción | `prologue.js` usa el suelo que devuelve el paisaje. Ruedas en contacto, pasajero visible, aceleración/freno, puerta y descenso del personaje. Frases más breves. | Recorrido inicial real en Chromium y 4.242 poses de transporte en la matriz Node. |
| 2. Despegue | Encendido progresivo, subida acelerada, seguimiento de cámara, vibración pequeña, humo y fuego sincronizados. Conserva separación, órbita, transferencia y aterrizaje. | 4.008 poses, renderizado de las fases y pruebas de continuidad de la línea temporal. |
| 3. Sonidos | 16 efectos originales sintetizados con Web Audio. Botones, pico, pasos, equipo, fabricación, motores, avisos y logros. Volumen y silencio persistentes. | Buffers finitos, distintos y sin saturación en tres frecuencias; renderizado OfflineAudioContext de cada efecto; controles en navegador. |
| 4. Rótulos | Placas opacas, letras gruesas y señalética original. LAB con matraz en Luna y Marte; las señales se convierten en iconos si el texto invadiría otra placa. | Comparación de límites de todas las señales en ambos planetas a cinco niveles de zoom y seis tamaños. |
| 5. Zoom | Rueda, botones y pellizco; 75–200 %, restablecimiento y HUD independiente. La proyección del pico y los bloques usa el tamaño real del canvas. | 9.600 puntos proyectados, minería real a diferentes aumentos, pellizco sin colocar accidentalmente y giro de pantalla. |
| 6. Mochila y proporciones | Iconos de 42–48 px; nombres de 14–15 px y mayor grosor. Rejilla adaptable, cantidades separadas y ayuda desplegable. Tamaño reducido respecto al primer ajuste, que resultó excesivo. | Tarjetas, nombres, iconos y cantidades de tres dígitos dentro de sus límites, sin superposición. |
| 7. Iconos | 32 glifos SVG originales y coherentes, además de los iconos pixelados de objetos. Los botones no dependen de símbolos de la fuente. | Formas válidas, nombres accesibles, presencia de los glifos esperados y revisión visual. |
| 8. Animaciones | Apertura, cierre y respuesta de botones. El cierre usa una copia visual inerte de vida acotada. Al cambiar de menú no se superponen los textos de dos paneles. Respeta movimiento reducido. | El panel real se oculta inmediatamente; las copias desaparecen y no interceptan controles. |
| 9. Notificaciones | Tarjeta con icono, título corto, costes visuales, cierre y detalle opcional. Máximo de líneas y altura en horizontal; el mensaje completo sigue disponible. | Mensajes cortos/largos, consumo visible, límites de pantalla y separación respecto a controles. |
| 10. Barra de controles | Mapa, visibilidad, zoom y pausa agrupados. Icono claro de mochila en la barra inferior. | Botones dentro de pantalla, mapa/HUD adyacentes y ausencia de colisiones en escritorio y móvil emulado. |

Las ilustraciones y señales no usan logotipos reales. Las menciones y enlaces a NASA se conservan como referencias científicas. El edificio y la conferencia tienen señalética ficticia de Órbita.

## Escala y densidad

El primer ajuste de 64–68 px para objetos fue reducido tras la observación del usuario. La entrega utiliza 46 px en escritorio, 44–48 en vertical y 42 en horizontal. Los nombres tienen más grosor, sin convertir las tarjetas en paneles gigantes. En pantallas muy pequeñas la mochila puede desplazarse; sus botones de cierre permanecen visibles.

Los rótulos del mundo mantienen su escala visual al hacer zoom. No se dibujan palabras donde no hay separación suficiente: se utiliza un icono y el nombre contextual al acercarse. El tamaño del personaje y la física no cambian al variar el zoom.

## Código y contratos

- `scene-motion.js`: trayectorias puras y deterministas del transporte y lanzamiento; sus parámetros son de animación, no telemetría.
- `camera-view.js`: dimensiones del mundo y conversión de coordenadas de pantalla. El canvas mantiene su proporción; el HUD sigue en CSS.
- `input.js`: rueda y gesto de dos dedos. Un pellizco o una cancelación no se interpretan como colocación.
- `audio.js`: síntesis, buffers reutilizados, máximo de doce efectos simultáneos y parada de motores al cambiar de fase o silenciar.
- `ui-icons.js`: formas SVG originales con `aria-hidden` y nombres accesibles en los botones.
- `notices.js`: resumen visual con detalles conservados y variaciones de recursos/materiales.
- `panel-motion.js`: cierre no bloqueante, copia inerte y limpieza acotada.
- `css/polish.css`: capa visual sobre los estilos de v0.8, con reglas explícitas de orientación y reducción de movimiento.

Los sonidos son originales y se ofrecen bajo CC0: `assets/audio/LICENSE.md`. No se descargan muestras o música de terceros. Los pasos exteriores lunares representan vibración transmitida por el traje, y el motor ambiental de despegue se usa en la Tierra.

## Ejecutar y probar

```sh
npm ci
npm test
npm run build
npm run test:raster
python3 -m http.server 8780
```

En otra terminal, con Python Playwright y Chromium instalados:

```sh
python3 tools/training-browser.py --url http://127.0.0.1:8780
python3 tools/training-browser.py --url http://127.0.0.1:8780 --width 390 --height 844
python3 tools/training-layout.py --url http://127.0.0.1:8780
python3 tools/junior-browser.py --url http://127.0.0.1:8780
python3 tools/polish-browser.py --url http://127.0.0.1:8780
```

El recorrido de entrenamiento se juega mediante teclas y botones reales. Las pruebas de interfaz posteriores reutilizan ese guardado aprobado; los escenarios de Marte, minería y cantidades máximas están identificados como estados de prueba. La campaña física completa se prueba aparte en Node.

Resoluciones revisadas: 1366×850, 1024×768, 390×844, 320×740, 844×390 y 740×320. Las pruebas de navegador son Chromium y emulación táctil: no son pruebas en teléfonos Android/iOS físicos ni una evaluación con niños. La medición de cuadros del entorno no garantiza FPS en otro equipo. Los sonidos se verifican como señales y fuentes de Web Audio; no se presenta una prueba de altavoces físicos.

## Valoración antes/después

Valoración técnica y visual propia respecto de v0.8.0, no una puntuación obtenida de usuarios ni una certificación.

| Punto | Antes | Ahora |
|---|---:|---:|
| Carro e introducción | 4/10 | 8/10 |
| Animación de despegue | 5/10 | 8,5/10 |
| Sonidos | 2/10 | 8/10 |
| Rótulos y señalética | 3/10 | 8,5/10 |
| Zoom | 1/10 | 9/10 |
| Mochila y escala | 4/10 | 8,5/10 |
| Iconos | 3/10 | 9/10 |
| Animaciones de interfaz | 3/10 | 8,5/10 |
| Notificaciones | 4/10 | 8,5/10 |
| Controles agrupados y mochila | 3/10 | 9/10 |
