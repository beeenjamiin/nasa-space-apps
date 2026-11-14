#!/usr/bin/env python3
"""Start the packaged game locally using only Python's standard library."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser

parser = argparse.ArgumentParser(description='Órbita: Frontera 2D — servidor local')
parser.add_argument('--port', type=int, default=8765)
parser.add_argument('--no-browser', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(root)))
except OSError as error:
    parser.exit(1, f'No se pudo abrir el puerto {args.port}: {error}. Prueba --port 8766.\n')
url = f'http://127.0.0.1:{server.server_port}/index.html'
print(f'Órbita: Frontera 2D\nAbre {url}\nCtrl+C para detener.\n', flush=True)
if not args.no_browser:
    threading.Timer(.3, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
