/** Static export. Content hashes keep updated JS and CSS from using stale cache keys. */
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await build({entryPoints:['src2d/main.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'pixel-game.js',legalComments:'eof'});
let html=(await readFile('pixel.html','utf8')).replace(/\?v=[a-f0-9]+/g,'');
for(const path of ['pixel-game.js','css/pixel.css','css/expedition.css','css/junior.css','css/training.css','css/polish.css']){
 const hash=createHash('sha256').update(await readFile(path)).digest('hex').slice(0,12);html=html.replaceAll('"'+path+'"','"'+path+'?v='+hash+'"');
}
await writeFile('pixel.html',html);await writeFile('index.html',html);
console.log('Aventura 2D compilada: index.html y pixel-game.js, con versiones de caché por contenido.');
