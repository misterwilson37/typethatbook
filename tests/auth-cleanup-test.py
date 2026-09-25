"""auth-cleanup-test.py v1.0.0 — Round 145. Drives the REAL scripts/auth-cleanup.py.

No Firebase needed: the script keeps every Google call in RealDeps, so these tests
hand main() a FakeDeps with the same methods. ⚠️ This proves the LOGIC. It does not
prove the Cloud Shell credential steps — only a first live run can do that.
"""
import datetime, importlib.util, io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ac', os.path.join(HERE, '..', 'scripts', 'auth-cleanup.py'))
ac = importlib.util.module_from_spec(spec); spec.loader.exec_module(ac)

passed, failed = 0, []
def ok(c, m):
    global passed
    if c: passed += 1; print('  ok    ' + m)
    else: failed.append(m); print('  FAIL  ' + m)

def ms(ymd): return int(datetime.datetime.fromisoformat(ymd).replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)
class MD:
    def __init__(s, created, signin=None, refresh=None):
        s.creation_timestamp, s.last_sign_in_timestamp, s.last_refresh_timestamp = ms(created), signin and ms(signin), refresh and ms(refresh)
class U:
    def __init__(s, uid, email, created, signin=None, refresh=None, disabled=False):
        s.uid, s.email, s.user_metadata, s.disabled = uid, email, MD(created, signin, refresh), disabled

TODAY = '2026-09-24'           # cutoff 2024-09-24
class FakeDeps:
    def __init__(s, users, staff_uids=(), with_records=(), staff_fails=False, records_fails=()):
        s.users, s.staff_uids, s.with_records = users, set(staff_uids), set(with_records)
        s.staff_fails, s.records_fails = staff_fails, set(records_fails)
        s.deleted, s.disabled, s.records_asked = [], [], []
    def staff(s):
        if s.staff_fails: raise RuntimeError('permission denied')
        return {'uids': s.staff_uids, 'emails': set()}
    def list_users(s): return iter(s.users)
    def get_user_by_email(s, e): return next((u for u in s.users if ac.norm(u.email) == ac.norm(e)), None)
    def records_exist(s, uid):
        s.records_asked.append(uid)
        if uid in s.records_fails: raise RuntimeError('read failed')
        return uid in s.with_records
    def delete_users(s, uids): s.deleted.extend(uids); return len(uids), []
    def disable(s, uid): s.disabled.append(uid)

def run(argv, deps, typed=''):
    out = io.StringIO()
    code = ac.main(argv + ['--now', TODAY], deps=deps, stdin=io.StringIO(typed), out=out)
    return code, out.getvalue()

def world():
    return [
        U('gone',    'gone@stu.org',    '2023-08-10', '2024-05-01'),                   # records removed, unused 28 mo
        U('macbook', 'macbook@stu.org', '2023-08-10', '2023-08-10', refresh='2026-09-20'),
        U('teacher', 'teacher@k12.net', '2022-01-01', '2024-01-01'),                   # staff, quiet for 2+ years
        U('admin',   'Jacob.Wilson@sumnerk12.net ', '2022-01-01', '2023-01-01'),       # admin email, odd case/space
        U('stillrec','stillrec@stu.org','2023-08-10', '2024-06-01'),                   # unused, but records remain
        U('soon',    'soon@stu.org',    '2024-10-01', '2024-10-01'),                   # due 2026-10-01
        U('edge',    'edge@stu.org',    '2024-09-24', '2024-09-24'),                   # used exactly on the cutoff
    ]

print('\nA — THE RULE')
ok(ac.last_used(U('m','m','2023-01-01','2023-01-01', refresh='2026-09-20')) == datetime.date(2026,9,20),
   '⚠️⚠️ A1 last used counts TOKEN REFRESH — a kid signed in on one MacBook for months is not "gone"')
ok(ac.add_months(datetime.date(2026,3,31), -24) == datetime.date(2024,3,31), 'A2 24 months back, at a month end')
ok(ac.add_months(datetime.date(2028,2,29), -24) == datetime.date(2026,2,28), 'A3 and from a leap day')

print('\nB — ⚠️⚠️⚠️ THE SWEEP LISTS EXACTLY THE RIGHT ACCOUNT')
d = FakeDeps(world(), staff_uids={'teacher'}, with_records={'stillrec'})
code, out = run([], d)
ok(code == 0 and 'gone@stu.org' in out, 'B1 the long-gone student whose records are removed is listed')
ok('macbook@stu.org' not in out.split('Due for deletion')[1].split('Next account')[0], '⚠️⚠️ B2 the refreshing MacBook student is NOT')
ok('teacher@k12.net' not in out and 'sumnerk12' not in out, '⚠️⚠️⚠️ B3 a quiet teacher and the admin are never listed')
ok('stillrec' not in out.split('Due for deletion')[1], '⚠️⚠️ B4 an unused account whose RECORDS REMAIN is not due — Retention first')
ok('run Retention... on the reports page first' in out, 'B5 and the script says so')
ok('edge@stu.org' not in out.split('Due for deletion')[1].split('Next account')[0], 'B6 used exactly on the cutoff day is still in')
ok('Next account comes due: 2026-09-25 (edge@stu.org)' in out,
   '⭐ B7 it names the next account due — the day AFTER its anniversary, when it actually becomes due')
ok(d.deleted == [], 'B8 listing changes nothing')
ok(set(d.records_asked) == {'gone', 'stillrec'}, '⭐ B9 records are checked only for the accounts the clock already expired')

print('\nC — ⚠️⚠️ CONFIRMATION')
d = FakeDeps(world(), staff_uids={'teacher'}, with_records={'stillrec'})
code, out = run(['--delete'], d, 'delete 2\n')
ok(d.deleted == [] and 'Cancelled' in out, 'C1 the wrong number cancels — nothing deleted')
d = FakeDeps(world(), staff_uids={'teacher'}, with_records={'stillrec'})
code, out = run(['--delete'], d, '  DELETE 1 \n')
ok(d.deleted == ['gone'], '⚠️⚠️⚠️ C2 "delete 1" deletes exactly the one due account — case and spaces forgiven')

print('\nD — ⚠️⚠️⚠️ IT FAILS CLOSED')
d = FakeDeps(world(), staff_fails=True)
code, out = run(['--delete'], d, 'delete 1\n')
ok(code == 2 and d.deleted == [] and 'nothing will be deleted' in out, 'D1 an unreadable staff list deletes NOTHING')
d = FakeDeps(world(), staff_uids={'teacher'}, records_fails={'gone'})
code, out = run(['--delete'], d, 'delete 0\n')
ok(d.deleted == [], 'D2 a failed "records still there?" check counts as YES — the account is kept')

print('\nE — ONE STUDENT: DELETION REQUESTS AND "STOP COLLECTING"')
d = FakeDeps(world(), staff_uids={'teacher'}, with_records={'stillrec'})
code, out = run(['--email', '  GONE@stu.org '], d)
ok(code == 0 and 'already removed' in out, 'E1 one account is looked up, case and spaces forgiven')
code, out = run(['--email', 'stillrec@stu.org', '--delete'], d, 'stillrec@stu.org\n')
ok(d.deleted == [] and 'Delete student' in out, '⚠️⚠️ E2 it refuses while their records still exist, and says to delete those first')
code, out = run(['--email', 'gone@stu.org', '--delete'], d, 'wrong@x\n')
ok(d.deleted == [], 'E3 a mistyped email cancels')
code, out = run(['--email', 'gone@stu.org', '--delete'], d, 'Gone@Stu.org\n')
ok(d.deleted == ['gone'], 'E4 the right email deletes it')
code, out = run(['--email', 'teacher@k12.net', '--delete'], d, 'teacher@k12.net\n')
ok(code == 1 and 'teacher' not in d.deleted, '⚠️⚠️⚠️ E5 it refuses to delete a staff account')
code, out = run(['--email', 'jacob.wilson@sumnerk12.net', '--disable'], d, 'jacob.wilson@sumnerk12.net\n')
ok(d.disabled == [], 'E6 or disable an admin')
code, out = run(['--email', 'macbook@stu.org', '--disable'], d, 'macbook@stu.org\n')
ok(d.disabled == ['macbook'] and 'guest' in out, 'E7 "stop collecting" disables the account and explains what that means')

print('\nF — SCALE')
many = [U(f'u{i}', f'u{i}@stu.org', '2022-01-01', '2022-02-01') for i in range(2500)]
class Batched(FakeDeps):
    def __init__(s, u): super().__init__(u); s.calls = []
    def delete_users(s, uids): s.calls.append(len(uids)); return super().delete_users(uids)
d = Batched(many)
run(['--delete'], d, 'delete 2500\n')
ok(d.calls == [1000, 1000, 500] and len(d.deleted) == 2500, 'F1 deletions go in batches of 1000, the API\u2019s limit')

print(f'\nFAIL — {passed} ok, {len(failed)} failed' if failed else f'\nPASS — {passed} ok, 0 failed')
sys.exit(1 if failed else 0)
