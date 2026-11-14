#!/usr/bin/env python3
"""Export a portable static game + editable sources, excluding local/secret files."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--browser-report')
parser.add_argument('--unit-log')
parser.add_argument('--overwrite', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
destination = Path(args.output).resolve()
if destination.exists() and not args.overwrite:
    parser.error('Output already exists; use --overwrite only for your own previous export.')
destination.parent.mkdir(parents=True, exist_ok=True)
prefix = 'orbita-frontera-2d/'
files = {}
for name in ['assets', 'css', 'data', 'src2d', 'tests', 'tools', '.github', 'docs']:
    for path in (root/name).rglob('*'):
        if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(root):
            continue
        rel = path.relative_to(root)
        if any((part.startswith('.') and part!='.github') or part in ['__pycache__', 'node_modules'] for part in rel.parts) or path.suffix in ['.pyc', '.pem', '.key', '.zip']:
            continue
        files[rel.as_posix()] = path.read_bytes()
for path in root.iterdir():
    if path.is_file() and not path.is_symlink() and (path.suffix=='.md' or path.name in ['index.html', 'pixel.html', 'pixel-game.js', 'package.json', 'package-lock.json', 'LEEME.txt', 'INICIAR.py', 'INICIAR.bat', 'iniciar.sh', '.gitignore']):
        files[path.name] = path.read_bytes()
required = ['index.html', 'pixel-game.js', 'css/pixel.css', 'css/expedition.css', 'INICIAR.py', 'package-lock.json']
for name in required:
    if name not in files:
        parser.error('Missing required export file: '+name)
if args.browser_report:
    report_path = Path(args.browser_report)
    report = json.loads(report_path.read_text())
    if report.get('status') != 'passed':
        parser.error('Browser report must be a completed passing run.')
    files['validacion/navegador.json'] = report_path.read_bytes()
    for path in sorted(report_path.parent.glob('*.png')):
        if path.name != 'failure.png':
            files['validacion/'+path.name] = path.read_bytes()
if args.unit_log:
    files['validacion/npm-test.txt'] = Path(args.unit_log).read_bytes()
manifest = {'files': [{'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()} for name,data in sorted(files.items())]}
files['MANIFIESTO.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2)+'\n').encode()
temporary = destination.with_suffix('.partial.zip')
with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name,data in sorted(files.items()):
        info = zipfile.ZipInfo(prefix+name)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100755 if name=='iniciar.sh' else 0o100644) << 16
        archive.writestr(info, data)
with zipfile.ZipFile(temporary) as archive:
    bad = archive.testzip()
    if bad:
        raise RuntimeError('ZIP CRC failed: '+bad)
    for entry in manifest['files']:
        assert hashlib.sha256(archive.read(prefix+entry['path'])).hexdigest() == entry['sha256']
temporary.replace(destination)
checksum = hashlib.sha256(destination.read_bytes()).hexdigest()
destination.with_suffix('.zip.sha256').write_text(checksum+'  '+destination.name+'\n')
print(json.dumps({'zip': str(destination), 'files': len(files), 'bytes': destination.stat().st_size, 'sha256': checksum}, indent=2))
