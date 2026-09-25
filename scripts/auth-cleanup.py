#!/usr/bin/env python3
"""
auth-cleanup.py v1.0.0 — TypeThatBook: delete old sign-in accounts.

WHAT IT DOES
  Lists TypeThatBook sign-in accounts that are due for deletion, and — only when
  you ask, and only after you confirm — deletes them. A sign-in account is due
  when BOTH of these are true:
    1. its TypeThatBook records are already gone (run Retention... on the reports
       page first — until then this script finds nothing to delete), and
    2. it hasn't been used for 24 months. "Used" is the latest of when the account
       was created, last signed in, and last refreshed its sign-in. Students stay
       signed in on one machine for months without signing in again, so sign-in
       alone would make an active student look gone.
  Staff accounts are never listed or deleted.

RUN IT IN GOOGLE CLOUD SHELL
  console.cloud.google.com -> the >_ button at the top right. Nothing is installed
  on your own computer, and no key file is ever downloaded: it runs as your own
  Google account.

  First time only:
    pip install --user --quiet firebase-admin
    gcloud auth application-default login --no-launch-browser
    gcloud auth application-default set-quota-project typethatbook

  Every time:
    curl -sO https://typethatbook.misterwilson.org/scripts/auth-cleanup.py
    python3 auth-cleanup.py

  To delete what it lists:
    python3 auth-cleanup.py --delete

  One student (a deletion request, or a request to stop collecting):
    python3 auth-cleanup.py --email STUDENT_EMAIL
    python3 auth-cleanup.py --email STUDENT_EMAIL --delete
    python3 auth-cleanup.py --email STUDENT_EMAIL --disable

  The same commands, with Copy buttons, are in the How-to on the reports page.
"""

# ═══════════════════════════════════════════════════════════════════════════════
# Adapted for TypeThatBook in Round 145 from SpotOn's scripts/auth-cleanup.py,
# following Figgins' notes. What is DIFFERENT here, deliberately:
#   • "Records gone" is part of the rule. TypeThatBook's retention clock is its own
#     typing activity (the Retention panel), so a sign-in account waits until that
#     panel has removed the records — which also makes running this script first
#     harmless: it simply finds nothing.
#   • Staff come from the `staff` collection, and the check FAILS CLOSED: if the
#     staff list can't be read, nothing is deleted.
#   • A failed "do records still exist?" check counts as YES — never delete an
#     account whose records might still be there.
# ⚠️ NOT YET RUN AGAINST THE LIVE PROJECT. tests/auth-cleanup-test.py drives the
# real functions against fakes; the first real run in Cloud Shell is the first test
# of the credential steps. Watch it.
# ═══════════════════════════════════════════════════════════════════════════════

import argparse
import datetime
import sys

VERSION = '1.0.0'
PROJECT_ID = 'typethatbook'
# ⚠️ PINNED by tests/auth-cleanup-sync-test.mjs to RETENTION_MONTHS in reports.html,
# SECURITY.md and the privacy policy. Change one, change all.
RETENTION_MONTHS = 24
# ⚠️ MIRRORS ADMIN_EMAILS in firebase-config.js — checked by the same test.
PROTECTED_EMAILS = ['jacob.wilson@sumnerk12.net', 'jacob.v.wilson@gmail.com']
DELETE_BATCH = 1000


def norm(email):
    return (email or '').strip().lower()


def add_months(d, months):
    """A date `months` later (or earlier, if negative), clamped to the month's end."""
    y, m = divmod(d.month - 1 + months, 12)
    y, m = d.year + y, m + 1
    for day in (d.day, 30, 29, 28):
        try:
            return datetime.date(y, m, day)
        except ValueError:
            continue


def _ms_date(ms):
    if not ms:
        return None
    return datetime.datetime.fromtimestamp(int(ms) / 1000, tz=datetime.timezone.utc).date()


def last_used(user):
    """The latest of creation, last sign-in and last token refresh — see the docstring."""
    md = getattr(user, 'user_metadata', None)
    if md is None:
        return None
    dates = [_ms_date(getattr(md, k, None)) for k in
             ('creation_timestamp', 'last_sign_in_timestamp', 'last_refresh_timestamp')]
    dates = [d for d in dates if d]
    return max(dates) if dates else None


def is_protected(user, staff):
    return user.uid in staff['uids'] or norm(user.email) in staff['emails'] \
        or norm(user.email) in {norm(e) for e in PROTECTED_EMAILS}


def classify(users, staff, records_exist, today):
    """Sort every account. `records_exist(uid)` is asked ONLY about accounts the
    sign-in clock has already expired, so a sweep costs a few reads, not hundreds."""
    cut = add_months(today, -RETENTION_MONTHS)
    out = {'cutoff': cut, 'protected': [], 'recent': [], 'has_records': [], 'due': [],
           'unknown': [], 'next_due': None}
    for u in users:
        if is_protected(u, staff):
            out['protected'].append(u)
            continue
        lu = last_used(u)
        if lu is None:
            out['unknown'].append(u)          # no dates at all: never delete on a guess
            continue
        if lu >= cut:
            out['recent'].append(u)
            # ⚠️ THE DAY AFTER the anniversary: on the anniversary itself it is still
            # exactly 24 months, which `lu >= cut` keeps. The first draft printed the
            # anniversary, a day early — caught by the test's edge-of-cutoff account.
            due_on = add_months(lu, RETENTION_MONTHS) + datetime.timedelta(days=1)
            if out['next_due'] is None or due_on < out['next_due'][0]:
                out['next_due'] = (due_on, u)
            continue
        try:
            has = records_exist(u.uid)
        except Exception:
            has = True                         # fail closed
        (out['has_records'] if has else out['due']).append(u)
    return out


def label(u):
    return norm(u.email) or f'(no email) {u.uid}'


def ask(prompt, expected, stdin, out):
    out.write(prompt)
    out.flush()
    line = stdin.readline()
    return line.strip().lower() == expected.strip().lower()


class RealDeps:
    """Every call to Google lives here, so the rest of the script can be tested."""

    def __init__(self):
        import firebase_admin
        from firebase_admin import auth, credentials, firestore
        self.auth = auth
        firebase_admin.initialize_app(credentials.ApplicationDefault(), {'projectId': PROJECT_ID})
        self.db = firestore.client()

    def list_users(self):
        page = self.auth.list_users()
        while page:
            for u in page.users:
                yield u
            page = page.get_next_page()

    def get_user_by_email(self, email):
        try:
            return self.auth.get_user_by_email(email)
        except self.auth.UserNotFoundError:
            return None

    def delete_users(self, uids):
        r = self.auth.delete_users(uids)
        return r.success_count, [(e.index, str(e.reason)) for e in r.errors]

    def disable(self, uid):
        self.auth.update_user(uid, disabled=True)

    def staff(self):
        uids, emails = set(), set()
        for d in self.db.collection('staff').stream():   # raises if unreadable: fail closed
            uids.add(d.id)
            e = (d.to_dict() or {}).get('email')
            if e:
                emails.add(norm(e))
        return {'uids': uids, 'emails': emails}

    def records_exist(self, uid):
        ref = self.db.collection('users').document(uid)
        if ref.get().exists:
            return True
        if any(True for _ in ref.collections()):        # subcollections outlive a missing parent
            return True
        for coll in ('typing_logs', 'typing_sessions'):
            if list(self.db.collection(coll).where('uid', '==', uid).limit(1).stream()):
                return True
        return False


def explain_error(e, out):
    msg = str(e)
    if 'quota project' in msg.lower():
        out.write('\nGoogle needs to know which project to bill this against. Run:\n'
                  f'    gcloud auth application-default set-quota-project {PROJECT_ID}\n'
                  'then try again.\n')
    elif 'default credentials' in msg.lower() or 'could not automatically determine' in msg.lower():
        out.write('\nCloud Shell isn\'t signed in for this yet. Run:\n'
                  '    gcloud auth application-default login --no-launch-browser\n'
                  'open the link it prints, paste the code back, then try again.\n')
    else:
        out.write(f'\nSomething went wrong: {msg}\nNothing was deleted.\n')


def run_sweep(args, deps, today, stdin, out):
    try:
        staff = deps.staff()
    except Exception as e:
        out.write('Could not read the staff list, so nothing will be deleted — '
                  'staff accounts must never be at risk.\n')
        explain_error(e, out)
        return 2
    users = list(deps.list_users())
    r = classify(users, staff, deps.records_exist, today)
    out.write(f'TypeThatBook sign-in account cleanup — v{VERSION} — {today.isoformat()}\n')
    out.write(f'Due when: records already removed AND not used since {r["cutoff"].isoformat()} '
              f'({RETENTION_MONTHS} months).\n\n')
    out.write(f'  Accounts checked:                 {len(users)}\n')
    out.write(f'  Staff and admin (never touched):  {len(r["protected"])}\n')
    out.write(f'  Used within {RETENTION_MONTHS} months:          {len(r["recent"])}\n')
    out.write(f'  Unused, but records still there:  {len(r["has_records"])}'
              + ('   <- run Retention... on the reports page first' if r['has_records'] else '') + '\n')
    if r['unknown']:
        out.write(f'  No dates at all (left alone):     {len(r["unknown"])}\n')
    out.write(f'  Due for deletion:                 {len(r["due"])}\n')
    for u in r['due']:
        out.write(f'      {label(u)}   last used {last_used(u).isoformat()}\n')
    if r['next_due']:
        d, u = r['next_due']
        out.write(f'\nNext account comes due: {d.isoformat()} ({label(u)})\n')
    if not args.delete:
        if r['due']:
            out.write(f'\nNothing was changed. To delete these {len(r["due"])}, run:\n'
                      '    python3 auth-cleanup.py --delete\n')
        else:
            out.write('\nNothing is due. Nothing was changed.\n')
        return 0
    n = len(r['due'])
    if not n:
        out.write('\nNothing is due. Nothing was deleted.\n')
        return 0
    if not ask(f'\nType  delete {n}  to delete these {n} sign-in accounts: ', f'delete {n}', stdin, out):
        out.write('Cancelled. Nothing was deleted.\n')
        return 1
    uids = [u.uid for u in r['due']]
    done, errors = 0, []
    for i in range(0, len(uids), DELETE_BATCH):
        ok_count, errs = deps.delete_users(uids[i:i + DELETE_BATCH])
        done += ok_count
        errors += [(i + idx, reason) for idx, reason in errs]
    out.write(f'Deleted {done} of {n}.\n')
    for idx, reason in errors:
        out.write(f'  could not delete {uids[idx]}: {reason}\n')
    return 0 if not errors else 3


def run_one(args, deps, today, stdin, out):
    email = norm(args.email)
    try:
        staff = deps.staff()
    except Exception as e:
        out.write('Could not read the staff list, so nothing will be changed.\n')
        explain_error(e, out)
        return 2
    u = deps.get_user_by_email(email)
    if u is None:
        out.write(f'No sign-in account for {email}.\n')
        return 1
    try:
        has = deps.records_exist(u.uid)
    except Exception:
        has = True
    lu = last_used(u)
    out.write(f'{email}\n  uid:          {u.uid}\n'
              f'  last used:    {lu.isoformat() if lu else "unknown"}\n'
              f'  records:      {"still in TypeThatBook" if has else "already removed"}\n'
              f'  disabled:     {"yes" if getattr(u, "disabled", False) else "no"}\n')
    if is_protected(u, staff):
        out.write('  This is a staff account. It is never deleted or disabled by this script.\n')
        return 1 if (args.delete or args.disable) else 0
    if args.delete:
        if has:
            out.write('\nTheir TypeThatBook records still exist. Delete those first with\n'
                      'Delete student... on the reports page, then run this again.\n')
            return 1
        if not ask(f'\nType their email to delete this sign-in account: ', email, stdin, out):
            out.write('Cancelled. Nothing was deleted.\n')
            return 1
        _, errs = deps.delete_users([u.uid])
        out.write('Deleted.\n' if not errs else f'Could not delete: {errs[0][1]}\n')
        return 0 if not errs else 3
    if args.disable:
        if not ask(f'\nType their email to stop this account signing in: ', email, stdin, out):
            out.write('Cancelled. Nothing was changed.\n')
            return 1
        deps.disable(u.uid)
        out.write('Disabled. They can no longer sign in, so nothing new is saved;\n'
                  'they can still type as a guest, which saves nothing to the server.\n')
        return 0
    return 0


def main(argv=None, deps=None, stdin=None, out=None):
    stdin = stdin or sys.stdin
    out = out or sys.stdout
    p = argparse.ArgumentParser(description='Delete old TypeThatBook sign-in accounts.')
    p.add_argument('--delete', action='store_true')
    p.add_argument('--disable', action='store_true')
    p.add_argument('--email')
    p.add_argument('--now', help=argparse.SUPPRESS)      # tests pin "today"
    args = p.parse_args(argv)
    if args.disable and not args.email:
        out.write('--disable needs --email.\n')
        return 1
    today = datetime.date.fromisoformat(args.now) if args.now else datetime.date.today()
    try:
        deps = deps or RealDeps()
        return run_one(args, deps, today, stdin, out) if args.email else run_sweep(args, deps, today, stdin, out)
    except Exception as e:
        explain_error(e, out)
        return 2


if __name__ == '__main__':
    sys.exit(main())
