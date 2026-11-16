Órbita: Frontera v0.9 mejora los diez puntos revisados sobre el release v0.8.0 y conserva el entrenamiento jugable y la campaña.

- Carro asentado en el suelo, ruedas animadas, frenado, puerta y bajada del personaje.
- Encendido y aceleración del cohete, seguimiento de cámara y efectos sincronizados.
- Dieciséis sonidos originales mediante Web Audio, con licencia CC0, volumen y silencio.
- Placas opacas con letras gruesas e iconos propios para estaciones de Luna y Marte, sin logotipos reales.
- Zoom de 75 a 200 % mediante rueda, botones y pellizco. El HUD conserva su tamaño y la minería mantiene su precisión.
- Mochila de escala equilibrada: iconos de 42–48 px, nombres más claros y rejillas adaptables.
- Treinta y dos glifos SVG originales, animaciones breves y controles de mapa, HUD, zoom y pausa agrupados.
- Notificaciones visuales con costes, límites de líneas, detalles opcionales y cierre.

El ZIP incluye juego compilado, código, datos, licencias, instrucciones y evidencias de validación. Extrae la carpeta completa y abre `INICIAR.bat` o ejecuta `python3 INICIAR.py`. Para desarrollar: Node.js 24, `npm ci`, `npm test` y `npm run build`.

Se verifican 99 pruebas Node, matrices de transporte/lanzamiento/proyección, entrenamiento real en Chromium, regresiones de campaña e interfaz y seis resoluciones con zoom, rotación y controles táctiles. Las pruebas móviles son emulación, no dispositivos físicos. Las valoraciones antes/después son una revisión técnica propia; no representan un estudio con niños. Consulta `docs/EXPERIENCIA-0.9.md` y `docs/VALIDACION-JUNIOR.json`.
