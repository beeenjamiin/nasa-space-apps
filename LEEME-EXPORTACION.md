# Órbita: Frontera 2D — entrega integrada

Este paquete contiene el juego compilado, todos sus recursos, las fuentes y las
pruebas. Funciona como sitio estático: para jugar no necesita npm, cuentas, claves
ni backend. Se conservan las licencias en `assets/`.

## Jugar

1. Extraer el ZIP completo, conservando sus carpetas.
2. Con Python 3 instalado, ejecutar `INICIAR.bat` en Windows o `sh iniciar.sh` en
   Linux/macOS. También se puede ejecutar `python3 INICIAR.py`.
3. El lanzador abre el navegador. Si el puerto está ocupado, usar
   `python3 INICIAR.py --port 8766`.

Otra opción es abrir la carpeta con Live Server en VS Code, o subir los archivos a
un hosting estático y servir `index.html`. No abrir con `file://`.

## Controles

- A/D o flechas: caminar; espacio: saltar y segundo impulso con energía.
- Mantener clic o F: picar. Clic derecho o B: colocar el material seleccionado.
- E: usar estaciones, entrar o salir del rover. T: cambiar traje dentro de la base.
- I o Tab: mochila. C: taller. J: bitácora. H: ocultar indicadores.
- M o botón MAPA: abrir/cerrar mapa. Tocar el terreno o una ubicación marca un
  destino; Escape cierra. El mapa pausa la exploración.
- Conduciendo: controles laterales para acelerar, espacio o botón ■ para frenar.
  También se puede salir con el botón del panel ROVER.
- En móvil: joystick izquierdo, botones de acción y accesos a mochila, taller, bitácora y mapa.

El rover se fabrica en el taller de Marte por 12 regolitos, 8 hierro y 18 energía.
Después se despliega con USAR desde la mochila, fuera del hábitat y con traje.
Los materiales lunares conservan su aspecto al transportarlos y colocarlos en
Marte. Los puentes requieren apoyo: retirar un soporte puede causar colapsos.

## Guardado y ciencia

Las partidas se guardan en el almacenamiento local del navegador. Se conservan al
continuar desde el mismo navegador y origen; cambiar de hosting o puerto utiliza
otro almacenamiento. No se incluyen partidas personales en el ZIP. Se mantienen
las migraciones de partidas anteriores. La procedencia que una partida antigua
nunca registró se asigna al planeta guardado.

La campaña incluye Luna, Marte y regreso a la Tierra con informe final. El paquete contiene el juego 2D integrado. Mapas, reservas, velocidades y eventos solares son parámetros educativos; las
fuentes NASA son referencias, no datos en vivo.

## Desarrollo y validación

Requiere Node.js 24 o posterior. Desde esta carpeta:

```sh
npm ci
npm test
npm run build
npm run test:raster
```

Editar `src2d/`, `data/`, `pixel.html` y `css/`; regenerar el bundle antes de
distribuir. `index.html` y `pixel-game.js` incluidos corresponden a esta integración.

Las pruebas de navegador usan Python Playwright y Chromium:

```sh
python3 -m pip install playwright
python3 INICIAR.py --no-browser --port 8765
# En otra terminal, con Chromium instalado:
python3 tools/junior-browser.py --url http://127.0.0.1:8765
```

La suite de Node recorre la campaña y valida físicas, guardado, minería y
construcción. La prueba de Chromium usa recursos y posiciones de prueba para
comprobar conexiones de interfaz en Marte; no se presenta como una campaña jugada
sin ayudas. Sus tamaños móviles son emulación en Chromium, no dispositivos físicos.
El ZIP incorpora los resultados ejecutados y capturas en `validacion/`, además de
un manifiesto de archivos con SHA-256. `tools/export-zip.py` permite repetir la
exportación sin incluir Git, dependencias instaladas ni archivos privados.

`GAMEPLAY-2D-INTEGRACION.md` documenta los contratos de simulación originales; las
conexiones de mapa, materiales y feedback que allí figuraban pendientes ya están
implementadas en `src2d/expedition-ui.js` en esta entrega.
