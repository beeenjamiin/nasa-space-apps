#!/usr/bin/env python3
"""Playable onboarding acceptance: real keys/buttons; never patches training state."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright

def complete_training(page,check,out=None):
    mobile=page.viewport_size['width']<600
    cdp=page.context.new_cdp_session(page) if mobile else None
    def hold(code,ms):
        if not mobile:
            page.keyboard.down(code);page.wait_for_timeout(ms);page.keyboard.up(code);return
        name={'KeyA':'left','KeyD':'right','Space':'jump','KeyF':'mine'}[code]
        box=page.locator('#training-screen [data-hold='+name+']').bounding_box()
        point={'x':box['x']+box['width']/2,'y':box['y']+box['height']/2,'id':1}
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point]});page.wait_for_timeout(ms);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    def command(code):
        if not mobile:page.keyboard.press(code);return
        if code=='Space':hold(code,60);return
        action={'KeyE':'interact','KeyI':'inventory','KeyC':'craft','KeyM':'map','KeyT':'suit'}[code]
        page.locator('#training-screen [data-training-action='+action+']').tap()
    def state(expr): return page.evaluate('()=>{const t=window.__FRONTIER_DEBUG__.training;return '+expr+'}')
    def walk(x):
        for _ in range(160):
            p=state('({x:t.sim.s.player.x+6,vx:t.sim.s.player.vx,passed:t.passed})')
            if p['passed']:break
            dx=x-p['x']
            if abs(dx)<6:break
            direction='KeyD' if dx>0 else 'KeyA'
            hold(direction,70)
        else:raise AssertionError('Cannot walk to '+str(x))
        page.wait_for_timeout(350)
    def interact():command('KeyE');page.wait_for_timeout(100)
    for n in range(8):
        page.wait_for_function('n=>window.__FRONTIER_DEBUG__.training?.index===n',arg=n)
        stage=state('t.stage.id');check('training stage '+stage,not state('t.passed'))
        if out:page.screenshot(path=str(out/(stage+'.png')))
        if stage=='medical':walk(480);interact();page.wait_for_timeout(2300)
        elif stage=='psych':
            for x in [480,640,528]:walk(x);interact()
        elif stage=='centrifuge':
            walk(560);interact()
            for _ in range(90):
                if state('t.passed'):break
                direction='KeyA' if state('t.force()')>0 else 'KeyD'
                hold(direction,80)
        elif stage=='pool':
            for i in range(3):
                if state('t.step')>i:continue
                walk(state('t.target().x'))
                if state('t.step')>i:continue
                command('Space')
                page.wait_for_function('i=>window.__FRONTIER_DEBUG__.training.step>i',arg=i,timeout=10000)
        elif stage=='survival':
            command('KeyI');page.locator('#training-ration').click();walk(672);interact()
        elif stage=='pressure':
            command('KeyT')
            for x in [528,672,528]:walk(x);interact()
        elif stage=='navigation':
            command('KeyM');page.locator('#training-waypoint').click();walk(704);interact()
        elif stage=='technical':
            walk(480);hold('KeyF',1600);check('held pick mines practice block',state('t.mineDone'))
            walk(560);command('KeyC');page.locator('#training-craft-button').click();check('recipe creates carried lamp',state('t.sim.s.inventory.lamps')==1);page.locator('#training-deploy').click()
        page.wait_for_function('window.__FRONTIER_DEBUG__.training.passed',timeout=5000)
        check(stage+' completed through gameplay',state('t.passed'))
        if out:page.screenshot(path=str(out/(stage+'-passed.png')))
        page.locator('#training-next').click()
    check('approval connects to existing launch',page.evaluate('window.__FRONTIER_DEBUG__.phase')=='cinematic')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:8766');parser.add_argument('--width',type=int,default=1366);parser.add_argument('--height',type=int,default=850);args=parser.parse_args()
    out=Path('test-results/training-browser' if args.width==1366 else 'test-results/training-browser-'+str(args.width));out.mkdir(parents=True,exist_ok=True)
    report={'status':'running','checks':[],'errors':[],'scope':'Real keyboard/button play through all eight training stages. No training-state fixtures.'}
    def check(name,value):
        if not value:raise AssertionError(name)
        report['checks'].append(name)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':args.width,'height':args.height},is_mobile=args.width<600,has_touch=args.width<600);page.on('pageerror',lambda e:report['errors'].append(str(e)))
        try:
            page.goto(args.url+'/index.html?debug');page.locator('#new-game').click();page.locator('#astronaut-name').fill('Vega');page.locator('[data-color="2"]').click();page.select_option('#skin','#805138');page.select_option('#hair','#ddd8c9');page.locator('#creator-form [type=submit]').click()
            for scene in ['conference','news','transport']:
                page.wait_for_function('id=>window.__FRONTIER_DEBUG__.intro?.id===id',arg=scene);page.wait_for_timeout(350);page.screenshot(path=str(out/(scene+'.png')));check(scene+' scene visible',page.locator('#intro-ui').is_visible());page.locator('#intro-next').click()
            check('quiz removed',page.locator('#training-answers').count()==0)
            check('custom avatar reaches training',page.evaluate('window.__FRONTIER_DEBUG__.training.sim.s.profile.name')=='Vega')
            complete_training(page,check,out)
            page.locator('#skip-cinema').click();page.wait_for_timeout(500)
            check('lunar gameplay starts',page.evaluate('window.__FRONTIER_DEBUG__.phase')=='playing')
            check('training did not spend expedition supplies',page.evaluate('window.__FRONTIER_DEBUG__.sim.s.inventory.rations')==3)
            (out/'expedition.json').write_text(page.evaluate('JSON.stringify(window.__FRONTIER_DEBUG__.sim.s)'));check('no page errors',not report['errors']);report['status']='passed'
        except Exception as error:
            report['status']='failed';report['failure']=str(error);page.screenshot(path=str(out/'failure.png'));raise
        finally:
            (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False));browser.close()
