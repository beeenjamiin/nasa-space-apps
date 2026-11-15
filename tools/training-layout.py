#!/usr/bin/env python3
"""Responsive layout fixtures and English onboarding smoke checks."""
from pathlib import Path
import json,argparse,os
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:8766');args=parser.parse_args()
out=Path('test-results/training-layout');out.mkdir(parents=True,exist_ok=True)
checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(320,740),(844,390)]:
  page=b.new_page(viewport={'width':width,'height':height},has_touch=True)
  page.goto(args.url+'/index.html?debug');page.locator('#new-game').click();page.locator('#creator-form [type=submit]').click()
  for _ in range(3):page.locator('#intro-next').click()
  for index in range(8):
   page.evaluate('i=>{const t=window.__FRONTIER_DEBUG__.training;t.index=i;t.enter()}',index);page.wait_for_timeout(60)
   buttons=page.locator('#training-screen button:visible')
   boxes=[]
   for button in buttons.all():
    box=button.bounding_box();label=button.get_attribute('aria-label') or button.inner_text()
    assert box and box['x']>=-1 and box['y']>=-1 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1,(width,index,label,box)
    boxes.append((label,box))
   for i,(a,x) in enumerate(boxes):
    for c,y in boxes[i+1:]:
     overlap=x['x']<y['x']+y['width']-1 and x['x']+x['width']>y['x']+1 and x['y']<y['y']+y['height']-1 and x['y']+x['height']>y['y']+1
     assert not overlap,(width,index,a,c)
   checks.append(f'{width}x{height} stage {index+1}: all visible controls fit without overlap')
   if index in [0,7]:page.screenshot(path=str(out/f'{width}-stage-{index+1}.png'))
  page.close()
 page=b.new_page();page.goto(args.url+'/index.html?debug');page.locator('#title-screen .language-switch').click();page.locator('#new-game').click();page.locator('#creator-form [type=submit]').click();page.wait_for_timeout(100)
 assert 'PRESS CONFERENCE' in page.locator('#intro-title').inner_text()
 for _ in range(3):page.locator('#intro-next').click()
 assert page.locator('#training-heading').inner_text()=='Medical assessment'
 assert 'scanner' in page.locator('#training-instruction').inner_text()
 checks.append('English prologue, stage title and gameplay instructions verified')
 b.close()
(out/'report.json').write_text(json.dumps({'status':'passed','checks':checks,'scope':'Layout fixtures for all training stages at 320x740 and 844x390; English interface smoke check.'},indent=2))
print('Passed:',len(checks),'layout/language checks')
