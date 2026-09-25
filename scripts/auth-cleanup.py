#!/usr/bin/env python3
"""auth-cleanup.py v1.0.1 — delete SpotOn sign-in accounts nobody has used in 24 months.

Written by Figgins, Sept 2026. Web pages aren't allowed to delete other people's
sign-in accounts, so this runs with your Google account's own permission instead.
It only touches Firebase AUTHENTICATION (the sign-in accounts). Scores and email
records are handled by admin.html → Privacy — run that tab's retention check first.

RUN IT IN GOOGLE CLOUD SHELL (a terminal in your browser — nothing to install,
no key file to keep safe):
  1. Go to console.cloud.google.com, pick the spot-on-games project at the top,
     then click the  >_  button (Activate Cloud Shell) at the top right.
  2. Paste these, one at a time. The first two are only needed the first time.
       pip install --user --quiet firebase-admin
       gcloud auth application-default login --no-launch-browser
         (open the link it prints, sign in as yourself, paste the code back)
       gcloud auth application-default set-quota-project spot-on-games
       curl -sO https://spoton.misterwilson.org/scripts/auth-cleanup.py
       python3 auth-cleanup.py
  3. That last line only LISTS. Nothing changes until you add --delete and type the
     confirmation it asks for.

COMMANDS  (STUDENT_EMAIL = the student's school email)
  python3 auth-cleanup.py                                accounts unused 24+ months, and who's next
  python3 auth-cleanup.py --delete                       delete those accounts (asks you to confirm)
  python3 auth-cleanup.py --email STUDENT_EMAIL          show one account
  python3 auth-cleanup.py --email STUDENT_EMAIL --delete   delete one account (a deletion request)
  python3 auth-cleanup.py --email STUDENT_EMAIL --disable  switch one account off (stop collection:
                                                         they can still play, nothing is saved)

⚠️ admin.html → Privacy → "How-to" shows these same commands with copy buttons.
tests/privacy-promises-test.mjs checks every command there appears in this docstring,
so change them in both places or the test fails.

"Last used" = the latest of: signing in, the browser silently renewing a sign-in
(students on the same MacBook stay signed in for months without "signing in"), and
account creation. The admin accounts below are never deleted.
"""
import argparse
import os
import sys
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import auth, credentials

PROJECT = 'spot-on-games'
RETENTION_MONTHS = 24          # ⚠️ must match privacy-tools.js, privacy.html, SECURITY.md
ADMIN_EMAILS = {               # ⚠️ must match isAdmin() in firestore.rules
    'jacob.wilson@sumnerk12.net',
    'jacob.v.wilson@gmail.com',
}


def add_months(dt, months):
    """Calendar months, same rule as privacy-tools.js (Jan 31 + 1 month → Mar 3 there;
    here clamped to the month's last day — a day's difference at most, on 5 dates a year)."""
    y, m = divmod(dt.month - 1 + months, 12)
    y, m = dt.year + y, m + 1
    days = [31, 29 if (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)) else 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
    return dt.replace(year=y, month=m, day=min(dt.day, days))


def last_used(user):
    meta = user.user_metadata
    stamps = [meta.last_sign_in_timestamp, getattr(meta, 'last_refresh_timestamp', None),
              meta.creation_timestamp]
    ms = max(s for s in stamps if s)
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def day(dt):
    return dt.astimezone().strftime('%b %d, %Y')


def all_users():
    page = auth.list_users()
    while page:
        for u in page.users:
            yield u
        page = page.get_next_page()


def confirm(word):
    typed = input(f'\nType  {word}  to go ahead (anything else cancels): ').strip()
    if typed != word:
        print('Cancelled. Nothing was changed.')
        sys.exit(0)


def one_account(args):
    try:
        u = auth.get_user_by_email(args.email.strip().lower())
    except auth.UserNotFoundError:
        print(f'No sign-in account for {args.email}.')
        return
    print(f'{u.email}  last used {day(last_used(u))}  {"(DISABLED)" if u.disabled else ""}')
    if u.email in ADMIN_EMAILS and (args.delete or args.disable):
        print('That is an admin account. Not touching it.')
        return
    if args.delete:
        print('\nDo this AFTER admin.html → Privacy → Delete a student, so their scores and')
        print('email record are gone too.')
        confirm('delete')
        auth.delete_user(u.uid)
        print(f'✓ Deleted the sign-in account for {u.email}.')
    elif args.disable:
        confirm('disable')
        auth.update_user(u.uid, disabled=True)
        print(f'✓ {u.email} can no longer sign in. They can still play; nothing is saved.')


def sweep(args, now):
    cutoff = add_months(now, -RETENTION_MONTHS)
    users = [u for u in all_users() if (u.email or '') not in ADMIN_EMAILS]
    expired = sorted((u for u in users if last_used(u) < cutoff), key=last_used)
    active = [u for u in users if last_used(u) >= cutoff]

    print(f'{len(users)} student sign-in accounts. Unused since before {day(cutoff)}: {len(expired)}')
    for u in expired:
        print(f'  {u.email or u.uid:40}  last used {day(last_used(u))}')
    if active:
        nxt = min(active, key=last_used)
        print(f'\nNext to expire: {nxt.email or nxt.uid} — last used {day(last_used(nxt))}, '
              f'due {day(add_months(last_used(nxt), RETENTION_MONTHS))}. Nothing new can expire before then.')

    if not args.delete:
        if expired:
            print('\nNothing was changed. To delete these, run:  python3 auth-cleanup.py --delete')
        return
    if not expired:
        print('\nNothing to delete.')
        return
    confirm(f'delete {len(expired)}')
    uids = [u.uid for u in expired]
    deleted = 0
    for i in range(0, len(uids), 1000):          # the API takes 1000 at a time
        result = auth.delete_users(uids[i:i + 1000])
        deleted += result.success_count
        for err in result.errors:
            print(f'  could not delete {uids[i + err.index]}: {err.reason}')
    print(f'✓ Deleted {deleted} sign-in accounts.')


def main():
    ap = argparse.ArgumentParser(description='Delete SpotOn sign-in accounts unused for 24 months.')
    ap.add_argument('--delete', action='store_true', help='actually delete (asks to confirm)')
    ap.add_argument('--disable', action='store_true', help='with --email: switch the account off')
    ap.add_argument('--email', help='act on one account')
    ap.add_argument('--now', help=argparse.SUPPRESS)   # tests only: pretend "today" is this ISO date
    args = ap.parse_args()
    if args.disable and not args.email:
        ap.error('--disable needs --email')

    if os.environ.get('FIREBASE_AUTH_EMULATOR_HOST'):
        firebase_admin.initialize_app(options={'projectId': os.environ.get('SPOTON_PROJECT', PROJECT)})
    else:
        firebase_admin.initialize_app(credentials.ApplicationDefault(), {'projectId': PROJECT})

    now = datetime.fromisoformat(args.now).replace(tzinfo=timezone.utc) if args.now else datetime.now(timezone.utc)
    try:
        one_account(args) if args.email else sweep(args, now)
    except Exception as e:  # the usual Cloud Shell problem gets a plain-English hint
        msg = str(e)
        print(f'\nError: {msg}')
        if 'quota project' in msg.lower() or 'x-goog-user-project' in msg.lower():
            print('Run:  gcloud auth application-default set-quota-project spot-on-games   then try again.')
        elif 'credentials' in msg.lower():
            print('Run:  gcloud auth application-default login --no-launch-browser   then try again.')
        sys.exit(1)


if __name__ == '__main__':
    main()
