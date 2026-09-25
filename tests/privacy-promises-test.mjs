// privacy-promises-test.mjs — every promise in privacy.html and SECURITY.md, checked
// against the code that keeps it. Static: no emulator needed.
import { check, section, finish, read, rootFiles, stripAll, stripHtmlComments, GAMES } from './harness.mjs';

const rules = read('firestore.rules');
const storageRules = read('storage.rules');
const scoreSave = stripAll(read('score-save.js'));
const tools = read('privacy-tools.js');
const policy = stripHtmlComments(read('privacy.html'));
const policyText = policy.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const security = read('SECURITY.md');
const PERSONAL = ['email', 'displayName', 'photoURL', 'userId'];

const listFrom = s => (s.match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)).sort();
const block = (src, startRe) => {   // the {...} block after a match
    const m = src.match(startRe); if (!m) return '';
    let i = src.indexOf('{', m.index + m[0].length), depth = 0, j = i;
    for (; j < src.length; j++) { if (src[j] === '{') depth++; if (src[j] === '}' && --depth === 0) break; }
    return src.slice(i, j + 1);
};

section('Scores hold no personal information (policy: "never include an email, a name or a photo")');
const codeFields = listFrom(scoreSave.match(/SCORE_FIELDS = \[([\s\S]*?)\]/)[1]);
const vns = block(rules, /function validNewScore\(\)/);
const ruleFields = listFrom(vns.match(/hasOnly\(\[([\s\S]*?)\]\)/)[1]);
check('score-save.js SCORE_FIELDS == rules hasOnly list', JSON.stringify(codeFields) === JSON.stringify(ruleFields),
      `${codeFields} vs ${ruleFields}`);
check('neither list contains a personal field', PERSONAL.every(f => !codeFields.includes(f) && !ruleFields.includes(f)));
check('rules require uid == the signed-in user', /d\.uid == request\.auth\.uid/.test(vns));
check('rules cap initials at 3 characters', /d\.initials\.size\(\) <= 3/.test(vns));
const scoresBlock = block(rules, /match \/scores\/\{scoreId\}/);
check('scores create goes through validNewScore()', /allow create: if signedIn\(\) && validNewScore\(\);/.test(scoresBlock));
check('only admin can update/delete scores', /allow update, delete: if isAdmin\(\);/.test(scoresBlock));
check('scores are publicly readable (policy says anyone can see the boards)', /allow read: if true;/.test(scoresBlock));

section('Every game saves through score-save.js');
for (const g of GAMES) {
    const s = stripAll(read(g));
    check(`${g}: imports score-save.js`, /from "\.\/score-save\.js"/.test(s));
    check(`${g}: no direct addDoc/setDoc`, !/\baddDoc\b|\bsetDoc\b/.test(s));
    check(`${g}: writes no email/name/photo`, !/(email|displayName|photoURL)\s*:\s*currentUser/.test(s));
}
check('score-save.js writes the email only to players/', /doc\(db, 'players', user\.uid\)/.test(scoreSave)
      && (scoreSave.match(/email:/g) || []).length === 1);

section('Only the admin can see emails (policy: "Nobody else can see a student\'s email")');
const playersBlock = block(rules, /match \/players\/\{uid\}/);
const readLines = playersBlock.split('\n').filter(l => /allow[^:]*\bread\b/.test(l));
check('players: exactly one read grant, admin only', readLines.length === 1 && /allow read: if isAdmin\(\);/.test(readLines[0]), readLines.join(' | '));
check('players: a student may write only their own uid and sign-in email',
      /request\.auth\.uid == uid/.test(rules) && /d\.email == request\.auth\.token\.email/.test(rules));
const adminList = s => listFrom(block(s, /function isAdmin\(\)/));
check('isAdmin() requires a verified email (firestore)', /email_verified == true/.test(block(rules, /function isAdmin\(\)/)));
check('isAdmin() requires a verified email (storage)', /email_verified == true/.test(block(storageRules, /function isAdmin\(\)/)));
check('the admin lists in firestore.rules and storage.rules match',
      JSON.stringify(adminList(rules)) === JSON.stringify(adminList(storageRules)) && adminList(rules).length === 2);
check('storage uploads admin-only', /allow write: if isAdmin\(\);/.test(storageRules) && !/request\.auth != null;/.test(block(storageRules, /match \/game-images/)));
check('admin.html keeps no admin list of its own', !/jacob\.(v\.)?wilson@/.test(stripAll(read('admin.html'))));
check('leaderboard.html never touches an email', !/email/i.test(stripAll(read('leaderboard.html'))));
for (const g of GAMES) {
    check(`${g}: leaderboard shows no email/name`, !/\b(s|score|d)\.(email|displayName|photoURL)\b/.test(stripAll(read(g))));
}

section('Pictures stay in SpotOn (policy: game pictures are stored in Firebase)');
const adminSrc = stripAll(read('admin.html'));
const pictureSaves = (adminSrc.match(/(addDoc|updateDoc)\(\s*(collection|doc)\(db, '(picture-perfect-images|bp2-content)'[^)]*\)[^;]*?imageUrl/gs) || []).length;
const copyIns = (adminSrc.match(/await keepPictureInSpotOn\(/g) || []).length;
check('every admin save that sets a picture address copies it in', pictureSaves === 4 && copyIns === 4, `${pictureSaves} saves, ${copyIns} copy-ins`);

section('Retention and deletion numbers agree everywhere');
const months = Number(tools.match(/export const RETENTION_MONTHS = (\d+);/)[1]);
check('RETENTION_MONTHS is 24', months === 24);
check('policy says 24 months', policyText.includes(`${months} months`));
check('SECURITY.md says 24 months', security.includes(`${months} months`));
const otherMonths = s => (s.match(/\b(\d+) months\b/g) || []).filter(m => m !== `${months} months`);
check('no other month count in the policy', otherMonths(policyText).length === 0, otherMonths(policyText));
check('no other month count in SECURITY.md', otherMonths(security).length === 0, otherMonths(security));
const script = read('scripts/auth-cleanup.py');
check('auth-cleanup.py uses the same retention period', new RegExp(`RETENTION_MONTHS = ${months}\\b`).test(script));
check('auth-cleanup.py protects exactly the rules\' admin accounts',
      JSON.stringify(listFrom((script.match(/ADMIN_EMAILS = \{([\s\S]*?)\}/) || [,''])[1])) === JSON.stringify(adminList(rules)));
const Q3 = '"' + '""', dsStart = script.indexOf(Q3) + 3;
const docstring = script.slice(dsStart, script.indexOf(Q3, dsStart));   // the script's instructions block
const howTo = stripHtmlComments(read('admin.html')).match(/<details id="privacyHowTo"[\s\S]*?<\/details>/);
const cmds = howTo ? [...howTo[0].matchAll(/<code data-cmd>([^<]+)<\/code>/g)].map(m => m[1].trim()) : [];
check('admin How-to shows the Cloud Shell commands (at least 9)', cmds.length >= 9, cmds.length);
for (const c of cmds) check(`How-to command matches the script's own instructions: ${c}`, docstring.includes(c));
check('the curl step points at the live site', cmds.includes('curl -sO https://' + read('CNAME').trim() + '/scripts/auth-cleanup.py'));
check('"within 30 days" in both', /within 30\s+days/.test(policyText) && /within 30 days/.test(security));
check('retention removes the account link LAST (players deleted after scores)',
      tools.indexOf("batch.delete(doc(db, 'players', s.uid))") > tools.indexOf("change = { uid: deleteField() }"));
check('delete-a-student removes the email record LAST',
      tools.indexOf("batch.delete(doc(db, 'players', id))") > tools.indexOf("batch.delete(doc(db, 'scores', id))"));

section('No analytics, no passwords, no anonymous sign-in');
const code = [...rootFiles('.html'), ...rootFiles('.js')].map(f => [f, stripAll(read(f))]);
for (const [f, s] of code) {
    check(`${f}: no analytics`, !/getAnalytics|gtag\(|googletagmanager|measurementId|firebase-analytics/.test(s));
    check(`${f}: no password or anonymous sign-in`, !/signInAnonymously|EmailAndPassword/.test(s));
}

section('The policy is findable, and never overclaims');
for (const f of rootFiles('.html').filter(f => f !== 'privacy.html')) {
    check(`${f}: links privacy.html`, /href="(\.\/)?privacy\.html"/.test(stripHtmlComments(read(f))));
}
check('policy has a Children\'s privacy (COPPA) section', /<h2>Children's privacy \(COPPA\)<\/h2>/.test(policy));
for (const [f, s] of [...code, ['privacy.html (text)', policyText], ['SECURITY.md', security], ['README.md', read('README.md')]]) {
    check(`${f}: never says "COPPA compliant"`, !/coppa[\s-]+complian/i.test(s));
}
check('policy says the database is in the United States', /located in the United States/.test(policyText));
check('SECURITY.md names the verified region', /us-east1/.test(security));
const ADDRESS = '4501 Charlotte Ave, PO Box 90096, Nashville, TN 37209';
check('mailing address in the policy contact list (COPPA 312.4(d)(1))', policyText.includes(`Mail: Jake Wilson, ${ADDRESS}`));
check('mailing address in the parents\' rights section', policyText.includes(`write to Jake Wilson, ${ADDRESS.replace(', PO', ', PO')}`) || policyText.includes('write to Jake Wilson, 4501 Charlotte Ave, PO Box 90096'));
check('mailing address in SECURITY.md', security.includes(ADDRESS));
check('contact email and phone in the policy', policyText.includes('privacy@misterwilson.org') && policyText.includes('(615) 379-7226'));
check('no personal email address anywhere in the policy', !/@(gmail|sumnerk12)\./i.test(read('privacy.html')));
check('policy lists no analytics company', !/analytics \(|Google Analytics \(/i.test(policyText));

finish('privacy-promises-test');

