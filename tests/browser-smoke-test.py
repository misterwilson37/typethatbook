"""browser-smoke-test.py — opens SpotOn's REAL pages in headless Chromium.

Firebase's own SDK files (the same ones www.gstatic.com serves, from the npm package)
are served locally; Firestore and Storage are pointed at the emulator and sign-in is
faked, via small shims (browser-shim-*.js). Nothing on any page is edited.
Every request to any other website is BLOCKED and counted — the policy says pages
contact no outside company but Google's Firebase.

Run inside the emulator (npm run test:browser). Needs: pip install playwright && playwright install chromium
Screenshots land in tests/.screens/ (git-ignored) for a human to look at."""
import json, os, re, subprocess, sys, threading, http.server, functools, time
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent
ROOT = HERE.parent
FB = HERE / 'node_modules' / 'firebase'
SHOTS = HERE / '.screens'; SHOTS.mkdir(exist_ok=True)
PORT = 8765
BASE = f'http://127.0.0.1:{PORT}'
ADMIN = {'uid': 'admin-jake', 'email': 'jacob.v.wilson@gmail.com', 'displayName': 'Admin', 'photoURL': None}
ADMIN_TOKEN = {'sub': 'admin-jake', 'email': 'jacob.v.wilson@gmail.com', 'email_verified': True}
KID = {'uid': 'kid1', 'email': 'kid1@stu.test', 'displayName': 'Kid', 'photoURL': None}
KID_TOKEN = {'sub': 'kid1', 'email': 'kid1@stu.test', 'email_verified': True}
passed = failed = 0

def check(name, cond, detail=''):
    global passed, failed
    if cond: passed += 1; print('  ✓', name)
    else: failed += 1; print('  ✗', name, ('— ' + str(detail)[:300]) if detail else '')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()

# A second origin serving a picture with NO CORS headers — like a Storage bucket with no
# CORS setting (the Sept 2026 Picture Perfect outage). data: URLs and the emulator both
# hide that problem, so the game's pictures come from here.
import base64, tempfile
IMGDIR = Path(tempfile.mkdtemp())
def tiny_png(w=80, h=60):
    import struct, zlib
    rows = b''.join(b'\x00' + b''.join(bytes([(x * 3) % 256, (y * 4) % 256, 160]) for x in range(w)) for y in range(h))
    chunk = lambda k, d: struct.pack('>I', len(d)) + k + d + struct.pack('>I', zlib.crc32(k + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + \
           chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
(IMGDIR / 'test.png').write_bytes(tiny_png())
img_srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8766), functools.partial(Quiet, directory=str(IMGDIR)))
threading.Thread(target=img_srv.serve_forever, daemon=True).start()

DEMO_CONFIG = 'export const firebaseConfig = { apiKey: "fake", authDomain: "demo-spoton.firebaseapp.com", projectId: "demo-spoton", storageBucket: "demo-spoton.appspot.com", appId: "1:1:web:1" };'
SHIM = {'firebase-firestore.js': 'browser-shim-firestore.js', 'firebase-storage.js': 'browser-shim-storage.js',
        'firebase-auth.js': 'browser-shim-auth.js'}
outside = []

def route(r):
    url = r.request.url
    m = re.match(r'https://www\.gstatic\.com/firebasejs/11\.6\.1/(REAL-)?(firebase-[a-z]+\.js)$', url)
    if m:
        real, name = m.group(1), m.group(2)
        path = HERE / SHIM[name] if (not real and name in SHIM) else FB / name
        return r.fulfill(path=str(path), content_type='application/javascript')
    if url == f'{BASE}/firebase-config.js':
        return r.fulfill(body=DEMO_CONFIG, content_type='application/javascript')
    if url.startswith(BASE) or url.startswith('http://127.0.0.1:8080') or url.startswith('http://127.0.0.1:9199') or url.startswith('http://127.0.0.1:8766') or url.startswith('data:'):
        return r.continue_()
    outside.append(url)
    return r.abort()

def open_page(ctx, path, user=None, token=None, wait=1500):
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script(f'window.__USER__ = {json.dumps(user)}; window.__TOKEN__ = {json.dumps(token)};')
    page.goto(BASE + '/' + path)
    page.wait_for_timeout(wait)
    return page, errors

subprocess.run(['node', str(HERE / 'browser-seed.mjs')], check=True, cwd=HERE)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, accept_downloads=True)
    ctx.route('**/*', route)

    print('\nEvery page loads, with no script errors and no outside requests')
    pages = sorted(f.name for f in ROOT.glob('*.html'))
    for name in pages:
        outside.clear()
        page, errors = open_page(ctx, name)
        check(f'{name}: no script errors', not errors, errors)
        check(f'{name}: contacted no outside website', not outside, outside)
        page.screenshot(path=str(SHOTS / f'{name}.png'), full_page=False)
        if name != 'privacy.html':
            check(f'{name}: has a visible Privacy link', page.locator('a[href="privacy.html"]').first.is_visible()
                  or name == 'admin.html')   # admin's link sits behind the sign-in overlay until signed in
        page.close()

    print('\nFonts and built Tailwind actually apply')
    page, _ = open_page(ctx, 'findthecenter.html')
    page.evaluate('document.fonts.ready')
    check('Inter is loaded from fonts/', page.evaluate("document.fonts.check('600 16px Inter')"))
    check('a Tailwind class takes effect (.hidden → display:none)',
          page.evaluate("(() => { const d = document.createElement('div'); d.className='hidden'; document.body.appendChild(d); return getComputedStyle(d).display; })()") == 'none')
    page.close()
    page, _ = open_page(ctx, 'formattrainer.html')
    check('Format Trainer body font is now Inter', 'Inter' in page.evaluate("getComputedStyle(document.body).fontFamily"))
    page.close()

    page, _ = open_page(ctx, 'sweetspot.html', wait=2500)
    check('Sweet Spot with no levels: spinner stops, message shown',
          'No levels found' in page.inner_text('body') and not page.locator('#loadingScreen .spinner').is_visible())
    page.close()

    print('\nleaderboard.html — Format Trainer boards')
    page, errs = open_page(ctx, 'leaderboard.html', wait=2000)
    check('All Games leaves Format Trainer out', 'Format Trainer' not in page.inner_text('#leaderboardBody'))
    check('mode row hidden until Format Trainer is picked', not page.locator('#ftModes').is_visible())
    page.click('.filter-btn[data-game="format-trainer"]'); page.wait_for_timeout(1500)
    check('mode row appears', page.locator('#ftModes').is_visible())
    check('speed board: column says Time', page.text_content('#scoreHeader') == 'Time')
    firsts = [page.inner_text(f'#leaderboardBody tr:nth-child({i}) td:nth-child(2)') for i in (1, 2, 3)]
    check('speed board: fastest first', firsts == ['FST', 'MID', 'SLW'], firsts)
    check('speed board: m:ss times', page.inner_text('#leaderboardBody tr:nth-child(1) td:nth-child(4)') == '0:42')
    fb = page.locator('.filter-btn[data-game="all"]').bounding_box(); mb = page.locator('.mode-btn').first.bounding_box()
    check('mode buttons are the same height as the game buttons', abs(fb['height'] - mb['height']) < 0.5, (fb['height'], mb['height']))
    page.screenshot(path=str(SHOTS / 'leaderboard-format-trainer.png'))
    page.click('.mode-btn[data-mode="ft-streak"]'); page.wait_for_timeout(1500)
    check('streak board: column says Score, highest first',
          page.text_content('#scoreHeader') == 'Score' and page.inner_text('#leaderboardBody tr:nth-child(1) td:nth-child(2)') == 'TOP')
    page.click('.filter-btn[data-game="all"]'); page.wait_for_timeout(500)
    check('back to All Games: mode row hidden, column says Score',
          not page.locator('#ftModes').is_visible() and page.text_content('#scoreHeader') == 'Score')
    check('leaderboard: no script errors', not errs, errs)
    page.close()

    print('\npictureperfect.html — stopwatch and speed bonus')
    page, errs = open_page(ctx, 'pictureperfect.html', wait=2500)
    page.click('#startGameBtn')
    try:
        page.wait_for_function("!document.querySelector('.btn-choice').disabled", timeout=10000)
        loaded = True
    except Exception:
        loaded = False
    check('pictures load from a server that sends no CORS header', loaded, page.inner_text('#gameScreen')[:200])
    if not loaded:
        raise SystemExit(f'\nbrowser-smoke-test: {passed} passed, {failed + 1} failed — Picture Perfect could not load pictures')
    page.wait_for_timeout(600)
    running = page.inner_text('#stopwatch')
    check('stopwatch runs while the picture is up', running != '⏱ 0:00.0' and 'paused' not in page.get_attribute('#stopwatch', 'class'), running)
    correct = 0
    for r in range(10):
        if r: page.wait_for_function("!document.querySelector('.btn-choice').disabled", timeout=10000)
        page.click('.btn-choice[data-choice="correct"]')
        fb_text = page.inner_text('#feedbackText')
        if r == 0:
            t1 = page.inner_text('#stopwatch'); page.wait_for_timeout(500)
            check('stopwatch stops once answered', page.inner_text('#stopwatch') == t1 and 'paused' in page.get_attribute('#stopwatch', 'class'))
        if fb_text.startswith('✓'):
            correct += 1
            check_bonus = re.search(r'speed \+(\d+) \(([\d.]+)s\)', fb_text)
        page.click('#nextButton')
    page.wait_for_selector('#gameOverScreen.active', timeout=5000)
    final = int(page.inner_text('#finalScore'))
    detail = page.inner_text('#averageScore')
    m = re.match(r'(\d+) for accuracy \+ (\d+) speed bonus · time (\d+:\d\d\.\d)', detail)
    check('game-over line shows accuracy + speed bonus + time', bool(m), detail)
    check('accuracy part = 100 per correct answer', m and int(m.group(1)) == 100 * correct, (detail, correct))
    check('final score = accuracy + bonus', m and final == int(m.group(1)) + int(m.group(2)), (final, detail))
    check('fast answers earn close to the full bonus', m and int(m.group(2)) >= 45 * correct, detail)
    page.wait_for_timeout(2000)
    lb = page.inner_text('#gameOverScreen')
    check('game-over leaderboard finishes loading', 'Loading...' not in lb, lb[-200:])
    page.screenshot(path=str(SHOTS / 'pictureperfect-gameover.png'))
    check('picture perfect: no script errors', not errs, errs)
    page.close()

    print('\nadmin.html — the admin gate')
    page, errs = open_page(ctx, 'admin.html', KID, KID_TOKEN, wait=2500)
    check('a student account is signed out', page.evaluate('window.__SIGNED_OUT__ === true'))
    check('...and told why', "isn't a SpotOn admin account" in page.inner_text('#loginMessage'))
    page.close()

    page, errs = open_page(ctx, 'admin.html', ADMIN, ADMIN_TOKEN, wait=2500)
    check('the admin gets in (sign-in overlay hidden)', not page.locator('#loginOverlay').is_visible())

    print('\nadmin.html — Leaderboards tab')
    page.click('.tab-btn[data-tab="leaderboards"]'); page.wait_for_timeout(1500)
    rows = page.locator('#scoresTableBody tr')
    check('shows the 50-score limit', rows.count() == 50, rows.count())
    check('no Name column', 'Name' not in page.inner_text('#leaderboardsTab thead') if page.locator('#leaderboardsTab thead').count() else True)
    page.select_option('#scoresGameFilter', 'find-the-center'); page.wait_for_timeout(800)
    page.fill('#scoresPlayerSearch', 'low'); page.wait_for_timeout(1500)
    txt = page.inner_text('#scoresTableBody')
    check('search finds a student ranked BELOW the limit (was "No matching scores")', 'LOW' in txt and 'low.student@stu.test' in txt, txt[:200])
    page.fill('#scoresPlayerSearch', 'lo'); page.fill('#scoresPlayerSearch', 'lowx'); page.wait_for_timeout(1500)
    check('rapid typing: only the newest search draws', 'No matching scores' in page.inner_text('#scoresTableBody'))
    page.fill('#scoresPlayerSearch', ''); page.select_option('#scoresGameFilter', 'ft-basic-speed'); page.wait_for_timeout(1500)
    ft = [page.inner_text(f'#scoresTableBody tr:nth-child({i}) td:nth-child(3)') for i in (1, 2, 3)]
    check('Format Trainer speed: fastest first', ft == ['FST', 'MID', 'SLW'], ft)
    check('...shown as m:ss', page.inner_text('#scoresTableBody tr:nth-child(1) td:nth-child(4)') == '0:42')
    check('...with a readable game name', 'Format Trainer — Basic Speed' in page.inner_text('#scoresTableBody'))
    page.select_option('#scoresGameFilter', 'find-the-center'); page.select_option('#scoresFilter', 'flagged'); page.wait_for_timeout(1500)
    check('flagged filter works across the whole game', '=1+' in page.inner_text('#scoresTableBody'))
    page.click('#scoresTableBody .flag-btn'); page.wait_for_timeout(1500)
    check('unflagging works (list refreshes empty)', 'No matching scores' in page.inner_text('#scoresTableBody'))
    page.select_option('#scoresFilter', 'all'); page.fill('#scoresPlayerSearch', '=1'); page.wait_for_timeout(1500)
    with page.expect_download() as dl:
        page.click('#exportScoresBtn')
    csv = Path(dl.value.path()).read_text()
    check('CSV export downloads', csv.startswith('Rank,Game,Initials'))
    check('toast says "1 score", not "1 scores"', 'Exported 1 score!' in page.inner_text('body'))
    check('CSV neutralises formula-like initials', "\"'=1+\"" in csv, csv)
    page.screenshot(path=str(SHOTS / 'admin-leaderboards.png'))

    print('\nadmin.html — Privacy tab and How-to')
    page.click('.tab-btn[data-tab="privacy"]'); page.wait_for_timeout(500)
    check('How-to starts closed', not page.locator('#privacyHowTo .howto').is_visible())
    page.click('#privacyHowTo summary'); page.wait_for_timeout(300)
    check('How-to opens', page.locator('#privacyHowTo .howto').is_visible())
    btn = page.locator('#privacyHowTo .copy-cmd').nth(6)
    widths = set(page.evaluate("[...document.querySelectorAll('#privacyHowTo .copy-cmd')].map(b => b.getBoundingClientRect().width)"))
    btn.click(); page.wait_for_timeout(200)
    check('Copy on a STUDENT_EMAIL command reminds you to replace it', 'replace STUDENT_EMAIL' in page.inner_text('body'))
    after = page.evaluate("[...document.querySelectorAll('#privacyHowTo .copy-cmd')].map(b => b.getBoundingClientRect().width)")
    check('every Copy button is the same width, before and after clicking', len(widths) == 1 and set(after) == widths, (widths, set(after)))
    page.screenshot(path=str(SHOTS / 'admin-privacy-howto.png'), full_page=True)
    page.click('#retentionCheckBtn'); page.wait_for_timeout(2500)
    check('retention check runs and names the next student due', 'Next to expire' in page.inner_text('#retentionResult'), page.inner_text('#retentionResult')[:200])
    check('admin page: no script errors', not errs, errs)
    page.close()
    browser.close()

srv.shutdown()
print(f'\nbrowser-smoke-test: {passed} passed, {failed} failed  (screenshots: tests/.screens/)')
sys.exit(1 if failed else 0)
