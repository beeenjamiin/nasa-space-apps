#!/usr/bin/env python3
"""Real Chromium acceptance checks. Mars scenarios use declared state fixtures.
Run a local server first, then: python3 tools/junior-browser.py
"""
import json,time,argparse,os
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://localhost:8765');args=parser.parse_args()
out=Path('test-results/junior-browser');out.mkdir(parents=True,exist_ok=True)
report={'status':'running','browser':'Chromium','checks':[],'errors':[],'scope':'Real desktop and emulated touch browser. Mars resource fixtures; physical campaign is covered by Node tests.'}
def check(name,value):
 if not value:raise AssertionError(name)
 report['checks'].append(name)
def state(page,code):return page.evaluate('()=>{const g=window.__FRONTIER_DEBUG__,sim=g.sim,s=sim.s;'+code+'}')
def start(page):
 page.goto(args.url+'/index.html?debug');page.wait_for_function('window.__FRONTIER_DEBUG__');page.locator('#new-game').click();page.locator('#creator-form [type=submit]').click();check('preflight training opens',page.locator('#training-screen').is_visible())
 page.locator('#training-answers button').nth(1).click();check('wrong answer stays in training',page.locator('#training-feedback').inner_text()!='')
 for answer in [0,1,0]:
  page.locator('#training-answers button').nth(answer).click()
  if page.locator('#training-answers button').count():page.locator('#training-answers button').click()
 page.locator('#training-launch').click();check('preflight starts cinema',state(page,'return g.phase')=='cinematic');page.locator('#skip-cinema').click();check('landed into playable mission',state(page,'return g.phase')=='playing')
def overlaps(a,b):return a['x']<b['x']+b['width']-1 and a['x']+a['width']>b['x']+1 and a['y']<b['y']+b['height']-1 and a['y']+a['height']>b['y']+1
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1366,'height':850});page.on('pageerror',lambda e:report['errors'].append(str(e)));start(page)
  page.keyboard.down('KeyD');page.wait_for_timeout(950);page.keyboard.up('KeyD');check('walking advances tutorial',state(page,'return s.junior.training')==1)
  page.keyboard.press('Space');page.wait_for_timeout(200);check('real jump advances tutorial',state(page,'return s.junior.training')==2)
  page.keyboard.press('KeyM');check('map advances tutorial',state(page,'return s.junior.training')==3);check('map opens',page.locator('#map-dialog').is_visible());page.screenshot(path=str(out/'map.png'));page.keyboard.press('Escape')
  page.keyboard.press('KeyH');check('HUD hides',page.locator('#play-ui').evaluate("el=>el.classList.contains('hud-hidden')"));page.locator('#hud-toggle').click();check('HUD restores',not page.locator('#play-ui').evaluate("el=>el.classList.contains('hud-hidden')"))
  page.keyboard.press('KeyI');check('backpack has no recipes',page.locator('#inventory-panel [data-recipe]').count()==0);page.screenshot(path=str(out/'backpack.png'))
  page.keyboard.press('KeyC');check('workshop opens exclusively',page.locator('#workshop-panel').is_visible() and not page.locator('#inventory-panel').is_visible())
  state(page,"Object.assign(s.player,{x:35*16,y:33*16-34,vx:0,vy:0});s.inventory.regolith=50;s.inventory.iron=40;s.resources.energy=80;");page.wait_for_timeout(160)
  page.locator('[data-recipe=panel]').click();check('craft item is carried instead of auto-placed',state(page,'return s.inventory.panels===1&&s.solarPanels.length===0'));check('craft feedback is fixed and visible',page.locator('#craft-result').is_visible());check('cost consequences shown', '−' in page.locator('#craft-result').inner_text());page.screenshot(path=str(out/'workshop.png'))
  page.keyboard.press('KeyJ');check('dedicated logbook and medal',page.locator('#journal-panel').is_visible() and page.locator('.medal:not(.locked)').count()>0);page.screenshot(path=str(out/'logbook.png'));page.keyboard.press('Escape')
  page.keyboard.press('Escape');page.locator('#pause-screen .language-switch').click();page.wait_for_timeout(100);check('English document language',page.locator('html').get_attribute('lang')=='en');check('English pause menu',page.locator('#pause-title').inner_text()=='Adventure paused');page.locator('#resume').click();page.keyboard.press('KeyJ');page.wait_for_timeout(150);check('English science lessons', 'Astronauts train' in page.locator('#junior-science').inner_text());page.screenshot(path=str(out/'english-logbook.png'));page.keyboard.press('Escape')
  # Explicit Mars fixture: both physics and full unassisted campaign have separate unit coverage.
  state(page,"s.flags.marsUnlocked=true;sim.arriveMars();s.flags.marsOnline=true;s.junior.dustClock=299.99;");page.wait_for_timeout(180);check('dust advance warning visible', 'DUST' in page.locator('#alert').inner_text());state(page,"s.junior.dustClock=325.1;");page.wait_for_timeout(180);page.screenshot(path=str(out/'mars-dust.png'));check('dust active warning visible','DUST STORM' in page.locator('#alert').inner_text())
  # Render stage separation deterministically without advancing the campaign.
  page.evaluate("()=>{const g=window.__FRONTIER_DEBUG__;window.__qaRender=g.renderer.render;g.renderer.render=()=>{};g.renderer.cinematic(g.sim.s.profile,18,'moon');}");page.locator('#frontier').screenshot(path=str(out/'capsule-separation.png'));page.evaluate('()=>window.__FRONTIER_DEBUG__.renderer.render=window.__qaRender')
  for width,height in [(320,740),(390,844),(844,390)]:
   context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=1);mobile=context.new_page();mobile.on('pageerror',lambda e:report['errors'].append(str(e)));start(mobile)
   controls=['#joystick','#touch-interact','[data-hold=mine]','[data-hold=jump]','#inventory-button','[data-slot="0"]','[data-slot="1"]','#craft-button','#journal-button','#hud-toggle','#map-button','#pause-button-2d']
   boxes={q:mobile.locator(q).bounding_box() for q in controls}
   for selector,box in boxes.items():check(f'{width} {selector} inside viewport',box is not None and box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1)
   for i,a in enumerate(controls):
    for b in controls[i+1:]:check(f'{width} no overlap {a} / {b}',not overlaps(boxes[a],boxes[b]))
   stick=boxes['#joystick'];sx=stick['x']+stick['width']/2;sy=stick['y']+stick['height']/2;cdp=context.new_cdp_session(mobile)
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':sx,'y':sy,'id':1}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':sx+stick['width']*.3,'y':sy,'id':1}]});before=state(mobile,'return s.player.x');mobile.wait_for_timeout(400)
   jump=boxes['[data-hold=jump]'];jx=jump['x']+jump['width']/2;jy=jump['y']+jump['height']/2;cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':sx+stick['width']*.3,'y':sy,'id':1},{'x':jx,'y':jy,'id':2}]});mobile.wait_for_timeout(100)
   check(f'{width} joystick plus simultaneous jump',state(mobile,'return s.player.x')>before and state(mobile,'return !s.player.grounded'))
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});mobile.wait_for_timeout(800);x=state(mobile,'return s.player.x');mobile.wait_for_timeout(500);check(f'{width} release stops movement',abs(state(mobile,'return s.player.x')-x)<1)
   mobile.screenshot(path=str(out/f'play-{width}.png'));mobile.locator('#craft-button').tap();check(f'{width} touch workshop',mobile.locator('#workshop-panel').is_visible());mobile.screenshot(path=str(out/f'workshop-{width}.png'));mobile.locator('#workshop-panel [data-close-panel]').tap();mobile.locator('#map-button').tap();check(f'{width} touch map',mobile.locator('#map-dialog').is_visible());check(f'{width} map fits',mobile.locator('#map-dialog').evaluate('el=>el.scrollWidth<=el.clientWidth+1'));context.close()
  report['renderSample']=page.evaluate('''async()=>{const times=[];let previous=performance.now();for(let i=0;i<60;i++)await new Promise(resolve=>requestAnimationFrame(now=>{times.push(now-previous);previous=now;resolve();}));times.sort((a,b)=>a-b);return {frames:times.length,medianMs:times[30],p95Ms:times[57],scope:'Headless Chromium desktop sample, not a device benchmark'};}''')
  check('no JavaScript page errors',not report['errors']);report['status']='passed'
 except Exception as error:
  report['status']='failed';report['failure']=str(error);raise
 finally:
  (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));browser.close();print(json.dumps({'status':report['status'],'checks':len(report['checks']),'errors':report['errors'],'failure':report.get('failure')},ensure_ascii=False))
