/** Build script included in the independent 2D export. */
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['src2d/main.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'pixel-game.js',legalComments:'eof'});
const html=(await readFile('pixel.html','utf8')).replace(/\?v=[a-f0-9]+/g,'');
await writeFile('index.html',html);
console.log('Aventura 2D compilada: index.html y pixel-game.js.');
