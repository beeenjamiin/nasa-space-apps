#!/usr/bin/env python3
"""Acceptance checks for v0.9. Uses the save earned by training-browser.py.
Mobile is Chromium touch emulation, not an Android/iOS hardware benchmark.
"""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:8780');args=parser.parse_args()
out=Path('test-results/polish-browser');out.mkdir(parents=True,exist_ok=True)
saved=json.loads(Path('test-results/training-browser/expedition.json').read_text())
report={'status':'running','checks':[],'errors':[],'scope':'Chromium desktop and emulated touch; Mars/mining/zoom states are declared QA fixtures. Onboarding is played separately without stage fixtures.','measurements':[]}
def check(name,condition):
 if not condition:raise AssertionError(name)
 report['checks'].append(name)
def state(page,code):return page.evaluate('()=>{const g=window.__FRONTIER_DEBUG__,sim=g.sim,s=sim.s;'+code+'}')
def start(page):
 page.goto(args.url+'/pixel.html?debug');page.wait_for_function('window.__FRONTIER_DEBUG__');page.evaluate('s=>localStorage.setItem("orbita-frontier-save-v1",JSON.stringify(s))',saved);page.reload();page.locator('#continue').click();page.wait_for_timeout(220);page.evaluate('document.fonts.ready');page.locator('#craft-result .notice-close').click() if page.locator('#craft-result:not(.hidden)').count() else None

def overlap(a,b):return a['x']<b['x']+b['width']-1 and a['x']+a['width']>b['x']+1 and a['y']<b['y']+b['height']-1 and a['y']+a['height']>b['y']+1
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width,height,touch in [(1366,850,False),(1024,768,False),(390,844,True),(320,740,True),(844,390,True),(740,320,True)]:
   ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=touch,is_mobile=touch,device_scale_factor=1);page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)));start(page)
   prefix=f'{width}x{height}';controls=['#map-button','#hud-toggle','#zoom-toggle','#pause-button-2d','#inventory-button','#craft-button','#journal-button']+(['#joystick','#touch-interact','#play-ui [data-hold=mine]','#play-ui [data-hold=jump]'] if touch else [])
   boxes={q:page.locator(q).bounding_box() for q in controls}
   for q,r in boxes.items():check(prefix+' visible and in bounds '+q,r and r['x']>=-1 and r['y']>=-1 and r['x']+r['width']<=width+1 and r['y']+r['height']<=height+1)
   for i,a in enumerate(controls):
    for b in controls[i+1:]:check(prefix+' controls separate '+a+'/'+b,not overlap(boxes[a],boxes[b]))
   check(prefix+' map and HUD adjacent',0<=boxes['#hud-toggle']['x']-(boxes['#map-button']['x']+boxes['#map-button']['width'])<=10)
   check(prefix+' backpack glyph',page.locator('#inventory-button svg[data-icon=backpack]').count()==1)
   check(prefix+' pause glyph',page.locator('#pause-button-2d svg[data-icon=pause]').count()==1)
   page.locator('#inventory-button').click();page.wait_for_timeout(260)
   check(prefix+' backpack no horizontal overflow',page.locator('#inventory-panel').evaluate('el=>el.scrollWidth<=el.clientWidth+1'))
   cards=page.locator('#inventory-items .inventory-item').evaluate_all("els=>els.map(el=>{const box=e=>e.getBoundingClientRect().toJSON();return {card:box(el),icon:box(el.querySelector('canvas')),name:box(el.querySelector('span')),amount:box(el.querySelector('b')),font:parseFloat(getComputedStyle(el.querySelector('span')).fontSize)};})")
   for i,card in enumerate(cards):
    check(prefix+f' balanced icon {i}',40<=card['icon']['width']<=50)
    check(prefix+f' readable type {i}',14<=card['font']<=16.5)
    check(prefix+f' icon/name no collision {i}',not overlap(card['icon'],card['name']))
    check(prefix+f' icon/count no collision {i}',not overlap(card['icon'],card['amount']))
    check(prefix+f' name fits card {i}',card['name']['x']>=card['card']['x'] and card['name']['x']+card['name']['width']<=card['card']['x']+card['card']['width']+1)
   report['measurements'].append({'viewport':[width,height],'itemIconPx':cards[0]['icon']['width'],'itemFontPx':cards[0]['font']})
   page.screenshot(path=str(out/f'backpack-{width}.png'))
   original=state(page,'return {...s.inventory}')
   state(page,'for(const key of ["regolith","iron","ice","samples","rations"])s.inventory[key]=999;');page.wait_for_timeout(180)
   high=page.locator('#inventory-items .inventory-item').evaluate_all("els=>els.map(el=>({a:el.querySelector('b').getBoundingClientRect().toJSON(),b:el.querySelector('canvas').getBoundingClientRect().toJSON()}))")
   for i,r in enumerate(high):check(prefix+f' three-digit quantity clear {i}',not overlap(r['a'],r['b']))
   page.evaluate('v=>Object.assign(window.__FRONTIER_DEBUG__.sim.s.inventory,v)',original);page.locator('#close-inventory').click();page.wait_for_timeout(180)
   page.wait_for_function("document.querySelectorAll('.panel-ghost').length===0",timeout=1000);check(prefix+' closing snapshot released',page.locator('.panel-ghost').count()==0)
   page.locator('#craft-button').click();page.wait_for_timeout(220)
   check(prefix+' workshop no horizontal overflow',page.locator('#workshop-panel').evaluate('el=>el.scrollWidth<=el.clientWidth+1'))
   recipes=page.locator('#inventory-recipes .recipe').evaluate_all("els=>els.map(el=>{const box=e=>e.getBoundingClientRect().toJSON();return {card:box(el),icon:box(el.firstElementChild),body:box(el.querySelector('span')),action:box(el.querySelector('b'))};})")
   for i,r in enumerate(recipes):
    check(prefix+f' recipe icon/body separate {i}',not overlap(r['icon'],r['body']))
    check(prefix+f' recipe action/body separate {i}',not overlap(r['action'],r['body']))
    check(prefix+f' recipe action fits {i}',r['action']['x']>=r['card']['x']-1 and r['action']['x']+r['action']['width']<=r['card']['x']+r['card']['width']+1)
   page.screenshot(path=str(out/f'workshop-{width}.png'));page.locator('#workshop-panel [data-close-panel]').click();page.wait_for_timeout(180)
   page.locator('#hud-toggle').click();check(prefix+' HUD hides',page.locator('#play-ui').evaluate('e=>e.classList.contains("hud-hidden")'));page.locator('#hud-toggle').click()
   for planet in ['moon','mars']:
    if planet=='mars':state(page,'s.flags.marsUnlocked=true;sim.arriveMars();')
    for zoom in [.75,1,1.25,1.5,2]:
     state(page,f'g.changeZoom({zoom});');page.wait_for_timeout(55)
     check(prefix+f' zoom value {planet} {zoom}',abs(state(page,'return g.renderer.zoom')-zoom)<.001)
     signs=state(page,'return g.renderer.stationSigns')
     check(prefix+f' LAB sign {planet} {zoom}',any(s['id']=='lab' for s in signs))
     for i,a in enumerate(signs):
      for b in signs[i+1:]:check(prefix+f' no plaque collision {planet} {zoom} '+a['id']+'/'+b['id'],not overlap(a,b))
    state(page,'g.changeZoom(1);')
   page.locator('#zoom-toggle').click();page.locator('#zoom-in').click();check(prefix+' zoom button',state(page,'return g.renderer.zoom')==1.25);page.locator('#zoom-reset').click();check(prefix+' zoom reset',state(page,'return g.renderer.zoom')==1);page.locator('#zoom-toggle').click()
   if touch:
    # Two screen fingers on the world zoom; their release must never place a block.
    state(page,'s.inventory.regolith=20;g.action("slot",1);');before=state(page,'return {n:s.inventory.regolith,r:sim.world.revision,z:g.renderer.zoom}')
    cdp=ctx.new_cdp_session(page);y=height*.48;a=width*.4;b=width*.6
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':a,'y':y,'id':4},{'x':b,'y':y,'id':5}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':a-25,'y':y,'id':4},{'x':b+25,'y':y,'id':5}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(100)
    check(prefix+' real pinch zoom',state(page,'return g.renderer.zoom')>before['z']);check(prefix+' pinch spends no blocks',state(page,'return s.inventory.regolith')==before['n']);check(prefix+' pinch edits no terrain',state(page,'return sim.world.revision')==before['r'])
   else:
    page.mouse.move(width*.45,height*.5);before=state(page,'return g.renderer.zoom');page.mouse.wheel(0,-120);page.wait_for_timeout(100);check(prefix+' mouse wheel zoom',state(page,'return g.renderer.zoom')>before)
    # A real hold must hit the projected block at each zoom, not a neighbouring cell.
    state(page,'Object.assign(s.player,{x:56*16,y:sim.world.groundY(56*16)-34,vx:0,vy:0});g.action("slot",0);')
    for zoom in [.75,1,1.5,2]:
     state(page,f'g.changeZoom({zoom});');page.wait_for_timeout(100)
     target=state(page,'for(let y=Math.floor(s.player.y/8)-2;y<Math.floor(s.player.y/8)+9;y++)for(let x=Math.floor(s.player.x/8)-7;x<Math.floor(s.player.x/8)+8;x++)if(sim.canMine(x,y)){const r=document.getElementById("frontier").getBoundingClientRect();return {tx:x,ty:y,x:r.left+((x+.5)*8-g.renderer.cam.x)/g.renderer.width*r.width,y:r.top+((y+.5)*8-g.renderer.cam.y)/g.renderer.height*r.height};}return null;')
     check(prefix+f' mine target available {zoom}',target is not None);page.mouse.move(target['x'],target['y']);page.mouse.down();page.wait_for_timeout(90);hit=state(page,'return sim.miningSnapshot()');page.mouse.up();check(prefix+f' mining exact zoom projection {zoom}',hit.get('tx')==target['tx'] and hit.get('ty')==target['ty'])
   state(page,'g.changeZoom(1);Object.assign(s.player,{x:35*16,y:33*16-34,vx:0,vy:0});s.inventory.regolith=50;s.inventory.iron=30;s.resources.energy=90;')
   page.locator('#craft-button').click();page.wait_for_timeout(180);page.locator('[data-recipe=panel]').click();check(prefix+' tooltip clears after action',not page.locator('#item-tooltip').is_visible());check(prefix+' visible cost notice',page.locator('#craft-result').is_visible());check(prefix+' material and energy icons',page.locator('#craft-result .notice-deltas svg,#craft-result .notice-deltas canvas').count()>=2)
   notice=page.locator('#craft-result').bounding_box();check(prefix+' notice fits viewport',notice['x']>=0 and notice['y']>=0 and notice['x']+notice['width']<=width+1 and notice['y']+notice['height']<=height+1)
   for selector in ['#inventory-button','#hud-toggle','#map-button','#pause-button-2d']:check(prefix+' notice avoids '+selector,not overlap(notice,page.locator(selector).bounding_box()))
   page.screenshot(path=str(out/f'notice-{width}.png'))
   state(page,'sim.tell("SIMULACRO SOLAR: busca el hábitat. Las partículas energéticas pueden elevar el riesgo de radiación. Puedes reforzar el refugio con materiales.");');page.wait_for_timeout(220)
   long=page.locator('#craft-result').bounding_box();check(prefix+' long notice inside viewport',long['y']>=0 and long['y']+long['height']<=height)
   check(prefix+' long notice avoids backpack',not overlap(long,page.locator('#inventory-button').bounding_box()))
   page.screenshot(path=str(out/f'long-notice-{width}.png'));page.locator('#workshop-panel [data-close-panel]').click();page.locator('#craft-result .notice-close').click();page.wait_for_timeout(180)
   page.locator('#pause-button-2d').click();page.locator('#sound-button').click();check(prefix+' mute',state(page,'return g.audio.stats().muted'));page.locator('#sound-button').click();page.locator('#effects-volume').evaluate("el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));}");check(prefix+' volume applies',state(page,'return g.audio.stats().volume')==.25)
   page.locator('#pause-screen .language-switch').click();page.wait_for_timeout(100);check(prefix+' English pause',page.locator('#pause-title').inner_text()=='Adventure paused');page.locator('#resume').click();page.locator('#inventory-button').click();page.wait_for_timeout(220);check(prefix+' English backpack',page.locator('#inventory-title').inner_text()=='Backpack');page.screenshot(path=str(out/f'english-{width}.png'))
   if touch:
    zoom=state(page,'return g.renderer.zoom');page.set_viewport_size({'width':height,'height':width});page.wait_for_timeout(230)
    check(prefix+' rotation keeps zoom',state(page,'return g.renderer.zoom')==zoom)
    check(prefix+' rotation keeps playable phase',state(page,'return g.phase')=='playing')
    r=page.locator('#close-inventory').bounding_box();check(prefix+' rotated close remains visible',r and r['x']>=0 and r['y']>=0 and r['x']+r['width']<=height+1 and r['y']+r['height']<=width+1)
    page.locator('#close-inventory').click()
   ctx.close()
  # Render actual Web Audio buffers offline, then sample stable gameplay render timings.
  page=browser.new_page(viewport={'width':1366,'height':850});page.on('pageerror',lambda e:report['errors'].append(str(e)));start(page)
  audio=page.evaluate('''async()=>{const {synthesizeCue,SOUND_CUES}=await import('/src2d/audio.js');const results=[];for(const kind of Object.keys(SOUND_CUES)){const context=new OfflineAudioContext(1,48000,48000),data=synthesizeCue(kind,48000),buffer=context.createBuffer(1,data.length,48000);buffer.copyToChannel(data,0);const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);source.start();const rendered=await context.startRendering(),samples=rendered.getChannelData(0);let peak=0,sum=0;for(const x of samples){peak=Math.max(peak,Math.abs(x));sum+=x*x;}results.push({kind,peak,rms:Math.sqrt(sum/samples.length)});}return results;}''')
  for a in audio:check('Web Audio finite audible buffer '+a['kind'],.001<a['peak']<.75 and a['rms']>0)
  report['audio']=audio
  before=state(page,'return g.audio.stats().events');state(page,'sim.tell("★ Medalla: prueba de sonido del logro");');check('medal notification plays actual Web Audio cue',state(page,'return g.audio.stats().events')>before)
  report['renderSample']=page.evaluate('''async()=>{const t=[];let old=performance.now();for(let i=0;i<90;i++)await new Promise(resolve=>requestAnimationFrame(now=>{t.push(now-old);old=now;resolve();}));t.sort((a,b)=>a-b);return {frames:t.length,medianMs:t[45],p95Ms:t[85],scope:'Headless Chromium, not a hardware benchmark'};}''')
  check('no JavaScript exceptions',not report['errors']);report['status']='passed'
 except Exception as error:
  report['status']='failed';report['failure']=str(error)
  try:page.screenshot(path=str(out/'failure.png'))
  except Exception:pass
  raise
 finally:
  (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'status':report['status'],'checks':len(report['checks']),'failure':report.get('failure'),'errors':report['errors']}));browser.close()
