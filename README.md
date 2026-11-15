# Órbita: Frontera

Una aventura espacial 2D para niños de 7 a 12 años: crea tu astronauta, completa el entrenamiento, cuida una base lunar, prepara una expedición a Marte y trae tus descubrimientos a la Tierra. Interfaz en español e inglés, controles de teclado y joystick táctil.

## Gráficos 0.7.0

Tierra, Luna y Marte reciben arte procedural original, fondos de cinco capas, texturas conectadas e iluminación de equipos. Solo las expediciones nuevas usan el generador 4; los mapas antiguos mantienen sus celdas y excavaciones. Se conservan las misiones y controles. Consulta [cambios y compatibilidad](docs/RELEASE-v0.7.0.md) y [validación](docs/VALIDACION-GRAFICOS.json).

## Ejecutar y desarrollar

Requiere Node.js 24 o posterior. Desde Visual Studio Code, abre esta carpeta y ejecuta:

```sh
npm ci
npm test
npm run build
npm run preview
```

`npm run build` genera `pixel-game.js` e `index.html` desde `src2d/main.js` y `pixel.html`. No edites el bundle generado. Para jugar sin compilar, sirve esta carpeta con `python3 INICIAR.py` o `INICIAR.bat` / `iniciar.sh`.

## Un solo juego

La rama `main` reúne la historia de `feature/gameplay-2d`, `feature/interface-education-2d` y `release/orbita-frontera-2d`. La rama de lanzamiento ya incorporaba jugabilidad; se integró su historia completa, sin copiar sistemas duplicados. Conservamos las otras ramas como historial.

Para colaborar, crea una rama desde `main`, trabaja en ella y abre un pull request hacia `main`. Antes de integrarlo ejecuta las pruebas y recompila. No edites el mismo módulo a la vez sin coordinarte.

| Área | Archivos principales |
|---|---|
| Mundo y arte | `world.js`, `renderer.js`, `materials.js`, `decor.js`, `cinematic.js` |
| Movimiento e interacción | `input.js`, `animation.js`, `human.js`, `vehicles.js` |
| Simulación y misiones | `simulation.js`, `junior-mission.js`, `crafting.js`, `structural-physics.js` |
| Interfaz y ciencia | `junior-ui.js`, `expedition-ui.js`, `language.js`, `pixel.html`, `css/`, `data/` |

Todos los módulos JavaScript están en `src2d/`. El estado único es `Simulation.s`; los sistemas leen/escriben ese estado y el guardado usa LocalStorage. No hay cuentas infantiles ni envío de datos de jugadores.

## Controles

- A/D o flechas: caminar. Shift: correr. Espacio: saltar; otra pulsación puede gastar energía en un impulso ficticio.
- Mantener clic o F: picar. Clic derecho o B: colocar el bloque seleccionado.
- E: interactuar. T: ponerse o quitarse el traje dentro de una base con soporte vital.
- I o Tab: mochila. C: taller. J: bitácora. M: mapa. H: ocultar indicadores. Escape: cerrar menú o pausar.
- Celular: joystick izquierdo, botones de pico, interacción y salto a la derecha. Los menús se abren con botones. El mapa permite tocar un destino.

Los menús de equipo permiten seguir caminando; el mapa y la pausa detienen la simulación. Los avisos de acciones aparecen fuera de las listas y desaparecen tras siete segundos.

## Aprender y modificar

- `data/pixel-config.json`: gravedad aproximada, movilidad, energía y soporte vital.
- `data/pixel-items.json`: objetos, recetas y costes. Crear un panel lo añade a la mochila; su colocación es manual.
- `junior-mission.js`: entrenamiento, lista de preparación de Marte, medallas y tormenta de polvo. Cada medalla da 100 puntos una sola vez, sin recursos gratis.
- `data/pixel-en.json`: traducciones locales. `language.js` incluye plantillas para mensajes con números. El selector de idioma está en inicio y pausa y se guarda en el navegador.
- `structural-physics.js`: capacidad simplificada de puentes. Los bloques sin apoyo se colocan, consumen material y caen; no se bloquea artificialmente la acción.

Las partidas anteriores conservan mapas y recursos y omiten el tutorial. La receta de viaje ahora cuesta más y la preparación comprueba comida, agua, energía y una baliza además de la investigación y los paneles reparados. El rover solo se fabrica en Marte y necesita un exterior despejado para desplegarse.

## Ciencia y límites

La bitácora explica gravedad, aire, agua, plantas, refugios y polvo con enlaces a NASA. `data/pixel-science.json` distingue referencias, valores aproximados y parámetros ficticios. No usamos alertas DONKI actuales ni telemetría en vivo; OSDR es una referencia biológica, no una fuente de cosechas de doce segundos.

Las tormentas de polvo reducen la energía solar y aumentan la demanda del traje. No son huracanes terrestres: la salud baja por soporte vital sin energía. Se avisa 25 segundos de juego antes de una tormenta de 45 segundos; hay cinco minutos iniciales de calma y un ciclo de diez minutos. Son parámetros didácticos, no un pronóstico de Marte.

Fuentes nuevas: [entrenamiento NASA](https://www.nasa.gov/humans-in-space/astronauts/become-an-astronaut/) y [polvo en Marte](https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/). Las licencias de arte y fuentes están en `assets/` y las referencias ampliadas en `REFERENCIAS.md`.

## Verificación

`npm test` comprueba simulación, guardados, interfaces, procedencia de bloques, puentes, rover y campaña física completa Tierra–Luna–Marte–Tierra en cuatro mapas. Para las pruebas de navegador, instala Python Playwright y Chromium, sirve el proyecto y ejecuta:

```sh
python3 -m http.server 8765
# En otra terminal:
python3 tools/junior-browser.py --url http://localhost:8765
```

El script usa Chromium de `/usr/bin/chromium`; adapta esa ruta si tu sistema es distinto. Verifica entrenamiento, menús, avisos, mapa, idioma y multitouch en 320×740, 390×844 y 844×390. Los escenarios de tormenta usan estados de prueba explícitos. La emulación móvil no sustituye una prueba en dispositivos Android/iOS físicos.

## Publicar

Sirve `index.html`, `pixel-game.js`, `css/`, `assets/` y `data/` juntos. GitHub Pages puede servir esta carpeta; conserva las rutas relativas. El ZIP de `descargas/` contiene el juego compilado y el código editable.
