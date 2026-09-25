"""auth-cleanup-test.py — runs the REAL scripts/auth-cleanup.py against the Auth emulator.
Run inside the emulator: npm run test:emulator (needs: pip install firebase-admin)."""
import json, os, subprocess, sys, urllib.request
from datetime import datetime, timezone

HOST = os.environ.get('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:9099')
PROJECT = 'demo-spoton'
BASE = f'http://{HOST}/identitytoolkit.googleapis.com/v1/projects/{PROJECT}'
SCRIPT = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'auth-cleanup.py')
NOW = '2026-09-24'
passed = failed = 0

def check(name, cond, detail=''):
    global passed, failed
    if cond: passed += 1; print('  ✓', name)
    else: failed += 1; print('  ✗', name, ('— ' + detail) if detail else '')

def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': 'Bearer owner', 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read() or b'{}')

def ms(iso): return str(int(datetime.fromisoformat(iso).replace(tzinfo=timezone.utc).timestamp() * 1000))

def reset():
    urllib.request.urlopen(urllib.request.Request(
        f'http://{HOST}/emulator/v1/projects/{PROJECT}/accounts', method='DELETE'))
    users = [
        dict(localId='old1', email='old1@stu.test', createdAt=ms('2023-01-01'), lastLoginAt=ms('2024-03-01')),
        dict(localId='mid', email='mid@stu.test', createdAt=ms('2024-01-01'), lastLoginAt=ms('2025-01-24')),
        dict(localId='new', email='new@stu.test', createdAt=ms('2026-08-01'), lastLoginAt=ms('2026-08-24')),
        dict(localId='adm', email='jacob.v.wilson@gmail.com', createdAt=ms('2022-01-01'), lastLoginAt=ms('2022-05-01')),
    ]
    call('POST', '/accounts:batchCreate', {'users': users})

def run(*args, stdin=''):
    env = {**os.environ, 'FIREBASE_AUTH_EMULATOR_HOST': HOST, 'SPOTON_PROJECT': PROJECT}
    r = subprocess.run([sys.executable, SCRIPT, '--now', NOW, *args], input=stdin,
                       capture_output=True, text=True, env=env)
    return r.stdout + r.stderr

def exists(uid):
    return bool(call('POST', '/accounts:lookup', {'localId': [uid]}).get('users'))

def disabled(uid):
    return call('POST', '/accounts:lookup', {'localId': [uid]})['users'][0].get('disabled', False)

print('\n"Last used" counts a silent sign-in renewal')
# The emulator can't store a renewal time, so this calls the script's own last_used().
import importlib.util, types
spec = importlib.util.spec_from_file_location('ac', SCRIPT); ac = importlib.util.module_from_spec(spec); spec.loader.exec_module(ac)
fake = types.SimpleNamespace(user_metadata=types.SimpleNamespace(
    creation_timestamp=int(ms('2023-01-01')), last_sign_in_timestamp=int(ms('2024-03-01')),
    last_refresh_timestamp=int(ms('2026-08-20'))))
check('old sign-in + recent renewal → last used = the renewal', ac.last_used(fake).date().isoformat() == '2026-08-20')
check('24 months back from Sep 24, 2026 is Sep 24, 2024',
      ac.add_months(datetime(2026, 9, 24, tzinfo=timezone.utc), -24).date().isoformat() == '2024-09-24')

print('\nList only')
reset()
out = run()
check('lists the 30-month-old account', 'old1@stu.test' in out, out)
check('the admin account is never listed', 'jacob.v.wilson' not in out)
check('names the next account due and its date', 'Next to expire: mid@stu.test' in out and 'Jan 24, 2027' in out, out)
check('listing changed nothing', exists('old1'))

print('\nDelete sweep')
out = run('--delete', stdin='nope\n')
check('wrong confirmation cancels', 'Cancelled' in out and exists('old1'))
out = run('--delete', stdin='delete 1\n')
check('deletes exactly the expired account', not exists('old1') and exists('mid') and exists('new'), out)
check('admin untouched', exists('adm'))

print('\nOne account')
out = run('--email', 'MID@stu.test ', '--disable', stdin='disable\n')
check('disable one account (case/space-insensitive)', disabled('mid'), out)
out = run('--email', 'new@stu.test', '--delete', stdin='delete\n')
check('delete one account', not exists('new'), out)
out = run('--email', 'jacob.v.wilson@gmail.com', '--delete', stdin='delete\n')
check('refuses to delete an admin', exists('adm') and 'admin account' in out, out)
out = run('--email', 'ghost@stu.test')
check('unknown email reported plainly', 'No sign-in account' in out)

print(f'\nauth-cleanup-test: {passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
