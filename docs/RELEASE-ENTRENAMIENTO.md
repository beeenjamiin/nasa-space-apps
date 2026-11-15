Órbita: Frontera incorpora un prólogo cinematográfico y un entrenamiento jugable sin preguntas de opción múltiple.

- Conferencia NASA con periodistas y cámaras, transición por flash, noticiero y traslado del personaje personalizado.
- Ocho pruebas: evaluación médica, coordinación psicológica, centrifugadora, piscina, supervivencia, presión, orientación y capacitación técnica.
- Movimiento, salto, traje, raciones, mapa, minería, fabricación y colocación reutilizan los sistemas del juego. El entrenamiento no consume las provisiones de la expedición.
- La aprobación conecta directamente con el lanzamiento existente. Las partidas anteriores conservan su progreso y las rutas Luna–Marte–Tierra.
- Cápsula con un diseño compartido en las cinemáticas y el mundo; conductos de la base detrás de pantallas y mobiliario, y juntas de casco continuas.
- Interfaz en español e inglés, teclado y controles táctiles.

El ZIP incluye el juego compilado, código editable, assets, pruebas, instrucciones y un manifiesto SHA-256. Extrae la carpeta completa y ejecuta `python3 INICIAR.py` (o `INICIAR.bat` / `iniciar.sh`). Para desarrollar se requiere Node.js 24 o posterior: `npm ci`, `npm test` y `npm run build`.

Validado con 92 pruebas Node, recorrido completo del entrenamiento en Chromium de escritorio y móvil con controles reales, regresiones de interfaz y campaña, y renderizado raster. Las pruebas móviles son emulación, no dispositivos físicos. Las escenas y evaluaciones son una aventura educativa ficticia; no representan un proceso de selección o diagnóstico médico real de NASA.
