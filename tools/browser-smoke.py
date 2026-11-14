#!/usr/bin/env python3
"""Exercise the compiled game in real Chromium. Requires Python playwright + Chromium.
The campaign itself is tested by npm test. Mars UI scenarios below use explicit fixtures.
"""
import argparse
import json
from pathlib import Path
import shutil
import time
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:8765')
parser.add_argument('--output', default='test-results/browser')
parser.add_argument('--boot-only', action='store_true')
args = parser.parse_args()
output = Path(args.output)
output.mkdir(parents=True, exist_ok=True)
report = {'status': 'running', 'browser': 'Chromium', 'checks': [], 'errors': [],
          'scope': 'Real browser UI smoke; Mars resources/position are test fixtures, not a natural campaign completion.'}
started = time.monotonic()

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    report['checks'].append(name)

def game(page, code):
    return page.evaluate('() => {const g=window.__FRONTIER_DEBUG__,s=g.sim;'+code+'}')

def start_game(page):
    page.goto(args.url.rstrip('/')+'/index.html?debug', wait_until='networkidle')
    page.wait_for_function('window.__FRONTIER_DEBUG__ && !document.getElementById("new-game").disabled')
    page.locator('#new-game').click()
    page.locator('#astronaut-name').fill('Vega QA')
    page.locator('#creator-form [type=submit]').click()
    page.locator('#skip-cinema').click()
    page.wait_for_function('window.__FRONTIER_DEBUG__.phase === "playing"')

def map_checks(page, label):
    page.locator('#map-button').click()
    check(label+' map opens', page.locator('#map-dialog').is_visible())
    before = game(page, 'return s.s.elapsed;')
    page.wait_for_timeout(180)
    check(label+' map pauses simulation', game(page, 'return s.s.elapsed;') == before)
    box = page.locator('#map-canvas').bounding_box()
    page.locator('#map-canvas').click(position={'x': box['width']*.65, 'y': box['height']*.45})
    check(label+' waypoint click', game(page, 'return !!s.mapSnapshot().waypoint;'))
    page.locator('#clear-waypoint').click()
    check(label+' clear waypoint', game(page, 'return s.mapSnapshot().waypoint === null;'))
    page.locator('#map-locations button').first.click()
    check(label+' location navigation', game(page, 'return !!s.mapSnapshot().navigation;'))
    check(label+' no horizontal overflow', page.locator('#map-dialog').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1'))
    page.screenshot(path=str(output/(label+'-map.png')))
    page.keyboard.press('Escape')
    check(label+' Escape closes map', not page.locator('#map-dialog').is_visible())
    page.wait_for_function('(n)=>window.__FRONTIER_DEBUG__.sim.s.elapsed > n', arg=before)

def desktop_checks(page):
    page.keyboard.press('e')
    check('desktop habitat control', game(page, 'return s.s.flags.baseOnline;'))
    page.keyboard.press('m')
    check('desktop M opens map', page.locator('#map-dialog').is_visible())
    page.keyboard.press('m')
    check('desktop M closes map', not page.locator('#map-dialog').is_visible())
    map_checks(page, 'desktop')
    # Explicit Mars fixture: the natural Luna→Mars→Earth campaign runs in npm test.
    game(page, "s.s.flags.marsUnlocked=true;s.arriveMars();s.s.flags.marsOnline=true;s.s.inventory.regolith=2;s.s.materials={'moon-rock':2};Object.assign(s.s.player,{x:112*8-14,y:s.world.surfaceAt(112)*8-34,vx:0,vy:0});")
    page.keyboard.press('i')
    page.locator('[data-material="moon-rock"]').click()
    check('material selector closes backpack', not page.locator('#inventory-panel').is_visible())
    page.wait_for_timeout(100)
    target = page.evaluate('''() => {const g=window.__FRONTIER_DEBUG__,r=document.getElementById('frontier').getBoundingClientRect(),c=document.getElementById('frontier'),y=g.sim.world.surfaceAt(112)-1;return {x:r.left+((112.5*8)-g.renderer.cam.x)/c.width*r.width,y:r.top+((y+.5)*8-g.renderer.cam.y)/c.height*r.height,ty:y};}''')
    page.mouse.move(target['x'], target['y'])
    page.mouse.click(target['x'], target['y'], button='right')
    check('UI places lunar rock on Mars with original material', game(page, 'return s.world.materialAt(112,'+str(target['ty'])+').id === "moon-rock";'))
    game(page, 'Object.assign(s.s.player,{x:35*16,y:33*16-34,vx:0,vy:0});Object.assign(s.s.inventory,{regolith:30,iron:10});s.s.resources.energy=100;')
    page.keyboard.press('i')
    page.locator('[data-recipe=rover]').click()
    check('rover UI crafting', game(page, 'return s.s.inventory.rovers === 1;'))
    deployed = False
    for x in range(1280, 2304, 32):
        game(page, f'Object.assign(s.s.player,{{x:{x},y:s.world.groundY({x})-34,vx:0,vy:0}});')
        page.locator('#inventory-items [data-item=rovers]').click()
        if game(page, 'return s.s.vehicles.length === 1;'):
            deployed = True
            break
    check('rover UI deployment', deployed)
    page.locator('#close-inventory').click()
    game(page, 'const v=s.s.vehicles[0];Object.assign(s.s.player,{x:v.x-14,y:v.y+24-34,vx:0,vy:0});')
    page.keyboard.press('e')
    page.wait_for_function('!!window.__FRONTIER_DEBUG__.sim.s.driving')
    page.wait_for_selector('#rover-status:not(.hidden)')
    check('rover HUD and enter', game(page, 'return !!s.s.driving;'))
    x = game(page, 'return s.s.vehicles[0].x;')
    page.keyboard.down('d')
    page.wait_for_timeout(500)
    page.keyboard.up('d')
    if abs(game(page, 'return s.s.vehicles[0].x;')-x) < .1:
        page.keyboard.down('a');page.wait_for_timeout(500);page.keyboard.up('a')
    check('rover moves with real keyboard', abs(game(page, 'return s.s.vehicles[0].x;')-x) > .1)
    page.keyboard.press('Space')
    page.wait_for_function('Math.abs(window.__FRONTIER_DEBUG__.sim.s.vehicles[0].vx)<.01')
    check('rover braking', game(page, 'return Math.abs(s.s.vehicles[0].vx)<.01;'))
    page.screenshot(path=str(output/'desktop-rover.png'))
    page.locator('#pause-button-2d').click();page.locator('#save-button').click()
    page.reload(wait_until='networkidle')
    page.locator('#continue').click()
    check('save reload retains rover and driver', game(page, 'return s.s.vehicles.length === 1 && !!s.s.driving;'))
    page.wait_for_selector('#rover-status:not(.hidden)')
    page.locator('#exit-rover').click()
    check('rover exit button', game(page, 'return s.s.driving === null;'))
    game(page, 'const x=80*16;Object.assign(s.s.player,{x,y:s.world.groundY(x)-34-100,vx:0,vy:0,grounded:false});s.s.resources.health=100;')
    page.wait_for_function('!!window.__FRONTIER_DEBUG__.sim.lastFallImpact', timeout=10000)
    page.wait_for_function('document.getElementById("gameplay-feedback").textContent.includes("CAÍDA")')
    check('physical fall updates HUD', game(page, 'return s.s.resources.health<100 && s.lastFallImpact.damage>0;'))
    page.screenshot(path=str(output/'desktop-fall.png'))
    game(page, "const x=200,y=s.world.surfaceAt(x);s.world.set(x,y-1,7);s.world.set(x,y,0);")
    page.wait_for_function('document.getElementById("gameplay-feedback").textContent.includes("COLAPSO")')
    check('support removal shows collapse feedback', 'COLAPSO' in page.locator('#gameplay-feedback').inner_text())

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        for label, viewport, mobile in [('desktop', {'width':1280,'height':800}, False), ('mobile-portrait', {'width':390,'height':844}, True), ('mobile-landscape', {'width':844,'height':390}, True)]:
            context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
            page = context.new_page()
            page.on('pageerror', lambda error: report['errors'].append(str(error)))
            page.on('console', lambda msg: report['errors'].append(msg.text) if msg.type=='error' else None)
            start_game(page)
            check(label+' compiled game boots', game(page, 'return g.phase === "playing";'))
            if not args.boot_only:
                if mobile:
                    map_checks(page, label)
                    game(page, "s.s.inventory.regolith=1;s.s.materials={'moon-rock':1};Object.assign(s.s.player,{x:112*8-14,y:s.world.surfaceAt(112)*8-34,vx:0,vy:0});")
                    page.locator('#inventory-button').click()
                    page.locator('[data-material="moon-rock"]').click()
                    page.wait_for_timeout(100)
                    target=page.evaluate('''() => {const g=window.__FRONTIER_DEBUG__,c=document.getElementById('frontier'),r=c.getBoundingClientRect(),ty=g.sim.world.surfaceAt(112)-1;return{x:r.left+(112.5*8-g.renderer.cam.x)/c.width*r.width,y:r.top+((ty+.5)*8-g.renderer.cam.y)/c.height*r.height,ty};}''')
                    page.touchscreen.tap(target['x'], target['y'])
                    check(label+' touch places selected material', game(page, 'return s.world.materialAt(112,'+str(target['ty'])+').id === "moon-rock";'))
                    x = game(page, 'return s.s.player.x;')
                    box = page.locator('[data-hold=right]').bounding_box()
                    cdp = context.new_cdp_session(page)
                    cdp.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}]})
                    page.wait_for_timeout(300)
                    cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
                    check(label+' real touch movement', game(page, 'return s.s.player.x;') > x)
                else:
                    desktop_checks(page)
            check(label+' viewport fits', page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
            page.screenshot(path=str(output/(label+'-game.png')))
            context.close()
        browser.close()
    check('no browser runtime or console errors', not report['errors'])
    report['status'] = 'passed'
except Exception as exc:
    report['status'] = 'failed'
    report['failure'] = str(exc)
    try:
        page.screenshot(path=str(output/'failure.png'))
    except Exception:
        pass
    raise
finally:
    report['duration_seconds'] = round(time.monotonic()-started, 2)
    (output/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
