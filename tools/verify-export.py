#!/usr/bin/env python3
"""Verify complete portable game CRC, manifest, local references and optional source parity."""
import argparse,hashlib,json,posixpath,zipfile
from pathlib import Path,PurePosixPath
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
p=argparse.ArgumentParser();p.add_argument('archive');p.add_argument('--against-checkout',action='store_true');a=p.parse_args()
archive=Path(a.archive);prefix='orbita-frontera-2d/'
class References(HTMLParser):
    def __init__(self):super().__init__();self.paths=[]
    def handle_starttag(self,tag,attrs):
        fields=dict(attrs)
        if tag=='script' and fields.get('src'):self.paths.append(fields['src'])
        if tag=='link' and fields.get('rel') in ['stylesheet','icon']:self.paths.append(fields['href'])
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None,'ZIP CRC failed'
    names=z.namelist();assert len(set(names))==len(names),'Duplicate archive entries'
    for name in names:
        path=PurePosixPath(name);assert name.startswith(prefix) and not path.is_absolute() and '..' not in path.parts
        assert not any(part in ['node_modules','.git','__pycache__','.env'] for part in path.parts)
    manifest=json.loads(z.read(prefix+'MANIFIESTO.json'))
    listed={entry['path'] for entry in manifest['files']}
    assert set(names)=={prefix+name for name in listed|{'MANIFIESTO.json'}},'Unlisted files'
    for entry in manifest['files']:
        data=z.read(prefix+entry['path']);assert len(data)==entry['bytes'];assert hashlib.sha256(data).hexdigest()==entry['sha256'],entry['path']
        if a.against_checkout and not entry['path'].startswith('validacion/'):
            current=Path(__file__).resolve().parents[1]/entry['path'];assert current.is_file() and current.read_bytes()==data,'Stale source: '+entry['path']
    for name in ['index.html','pixel-game.js','css/pixel.css','css/expedition.css','css/junior.css','INICIAR.py','INICIAR.bat','iniciar.sh','package-lock.json','src2d/main.js','assets/pixel/humans/astro.png','assets/fonts/Silkscreen-Regular.ttf']:
        assert name in listed,'Missing '+name
    parser=References();parser.feed(z.read(prefix+'index.html').decode())
    for reference in parser.paths:
        path=urlsplit(reference);assert path.scheme=='' and path.netloc=='','Runtime must use local assets'
        assert unquote(path.path).lstrip('/') in listed,'Missing runtime asset: '+reference
    version=json.loads(z.read(prefix+'package.json'))['version']
checksum=hashlib.sha256(archive.read_bytes()).hexdigest();sidecar=archive.with_suffix('.zip.sha256')
if sidecar.exists():assert sidecar.read_text().split()[0]==checksum,'Archive checksum mismatch'
print(json.dumps({'status':'passed','version':version,'files':len(names),'bytes':archive.stat().st_size,'sha256':checksum}))
