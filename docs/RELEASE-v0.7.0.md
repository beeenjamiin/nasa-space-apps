# Órbita: Frontera 0.7.0 — Tierra, Luna y Marte en pixel art

Renovación visual de la aventura 2D existente. Conserva el entrenamiento, la introducción terrestre, las fases y duraciones del viaje, la historia bilingüe, el rover, el mapa, las recetas, el movimiento y los costes de recursos de la versión 0.6.

- **Tierra:** cielo y nubes originales cacheadas, cuatro planos de paisaje y vegetación, suelo estratificado con hierba, raíces y piedra, detalles de la instalación existente y torre/cohete. Globo terrestre con costa irregular, nubes, iluminación y atmósfera; océano con profundidad de color y reflejos.
- **Luna:** espacio oscuro sin bruma atmosférica, cinco planos de montañas y cráteres, regolito granular y roca fracturada, luz direccional con contraste y nuevos tamaños de cantos/bloques decorativos.
- **Marte:** cielo salmón, mesas y estratos de fondo propios, tonos sedimentarios, dunas y erosión ilustradas, roca oxidada y polvo ambiental existente. No es una recoloración de la Luna.
- **Terreno:** campos de detalle deterministas, bordes/corners conectados, transiciones granuladas entre polvo y roca y paredes de cueva. Versionado del generador nuevo: cráteres adicionales lunares, terrazas/ondulaciones marcianas y variación de cuevas después de la zona inicial.
- **Iluminación y objetos:** sombras en los bordes expuestos, cavidades más profundas, brillo de lámparas y equipo con energía; paneles del hábitat, tornillería, acabados de la nave y detalles del traje sin alterar sus siluetas funcionales.
- **Rendimiento:** chunks de terreno de 128 px con invalidación por excavación, máximo 64 chunks activos; fondos periódicos de cinco velocidades, sprites y texturas cacheados. No se añaden dependencias de ejecución ni motores 3D.

## Compatibilidad

Los mapas guardados con generadores 1, 2 y 3 mantienen exactamente sus celdas, minerales y excavaciones. Se comprueban sus hashes de referencia. Su aspecto mejora al dibujarlos. Solo las expediciones nuevas creadas por la interfaz usan el generador 4; su versión y semilla se guardan y restauran juntas. El corredor de aprendizaje y sus recursos accesibles se mantienen. No se cambian reglas, costes ni valores de física.

No se agregaron escenas, misiones o diálogos. Se conservaron las fases existentes de separación, órbita, transferencia, descenso y regreso. Los paisajes y mapas son arte original de una simulación educativa, no cartografía NASA ni recursos de Terraria.

## Jugar y editar

El ZIP contiene el juego compilado, fuentes, datos, pruebas, herramientas, licencias y lanzadores. Extraer la carpeta completa y ejecutar `INICIAR.bat` en Windows, `sh iniciar.sh` o `python3 INICIAR.py`. Requiere Python 3 o un servidor HTTP estático; no abrir `index.html` con `file://`.

Para desarrollar: Node >=24, `npm ci`, `npm test`, `npm run build`. Para revisar arte: `npm run test:raster` y `node tools/graphics-qa.mjs`. Las dependencias de desarrollo se instalan con el lockfile; no se incluyen cachés ni `node_modules`. Las partidas pertenecen al navegador y origen donde se guardaron.

El SHA-256 adjunto y el manifiesto interno permiten verificar el archivo. `python3 tools/verify-export.py archivo.zip` comprueba CRC, hashes, integridad de fuentes y referencias locales. El flujo de publicación reconstruye y prueba el código antes de generar y verificar el ZIP final.
