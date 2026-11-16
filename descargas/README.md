# Descargar Órbita: Frontera — Experiencia Junior 0.9

## [Descargar ZIP completo](https://github.com/beeenjamiin/nasa-space-apps/raw/refs/heads/main/descargas/orbita-frontera-2d.zip)

Juego 2D compilado, código fuente, recursos, pruebas, documentación y capturas de validación. Si GitHub muestra el archivo, usa **Download raw file**.

Extrae el ZIP y ejecuta `INICIAR.bat` o `python3 INICIAR.py`. Para desarrollar: Node 24, `npm ci`, `npm test`, `npm run build`. Consulta `README.md` dentro del paquete.

La rama `main` integra las ramas de jugabilidad y lanzamiento y la experiencia junior: entrenamiento, rover, materiales con origen, puentes que colapsan, mochila/taller/bitácora independientes, español e inglés, joystick, medallas, avisos, polvo marciano y regreso a la Tierra.

Validación: **99 pruebas de Node y más de 1900 comprobaciones en Chromium**, sin errores JavaScript en ese recorrido. El ZIP se extrae, instala con `npm ci` y recompila; el resultado coincide byte a byte con el juego incluido. Las comprobaciones móviles usan emulación; los escenarios de tormenta usan estados de prueba explícitos. El recorrido físico de campaña se valida en la simulación en cuatro mapas.

[Código en main](https://github.com/beeenjamiin/nasa-space-apps/tree/main) · [SHA-256 del ZIP](orbita-frontera-2d.zip.sha256) · [Cambios](../CAMBIOS-JUNIOR.md)

La versión 0.9 incorpora las mejoras de introducción, despegue, audio CC0, zoom y densidad de interfaz. [Detalle de los diez puntos](../docs/EXPERIENCIA-0.9.md).
