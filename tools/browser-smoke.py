#!/usr/bin/env python3
"""Compatibility entry point. Current acceptance checks live in junior-browser.py."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('junior-browser.py')),run_name='__main__')
