// teach-data-test.mjs v1.0.0 — Round 167. THE NEW STAFF PAGE'S NUMBERS ARE REPORTS' NUMBERS.
//
// teach.html will replace reports.html for Jake's weekly grades, so its CSV must be the CSV he
// already uses, and its totals must be the student's own (daylog.js totalsOf()).
//   A  totals: the student's reader, Arcade INCLUDED (the Round 167 Reports fix)
//   B  roll-up: one row per student, roster students with no days get a zero row, a day
//      found twice (query + by id) counts once, Days Active counted as Reports counts it
//   C  ⚠️ the CSV: Reports' nine columns in Reports' order and format; Class APPENDED for a
//      multi-class export, sorted class → name
//   D  ranges and flags
import { readFileSync } from 'node:fs';
const T = await import('../teach-data.js');
const D = await import('../daylog.js');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

console.log('\nA — TOTALS ARE THE STUDENT\'S, ARCADE INCLUDED');
{
    const doc = { secondsSchool: 300, secondsArcade: 240, charsSchool: 500, charsArcade: 410,
                  mistakesSchool: 9, mistakesArcade: 12, secondsLibrary: 60, charsLibrary: 90 };
    const r = T.dayRow(doc, '2026-11-12');
    const s = D.totalsOf(doc, '2026-11-12');
    ok(r.seconds === 600 && r.seconds === s.seconds && r.chars === s.chars, '⭐ A1 a day is totalsOf() — Library + School + Arcade');
    ok(r.arcade === 240 && r.school === 300 && r.library === 60, 'A2 and its three sources are kept apart for "Where"');
    ok(T.rates(1000, 0, 600).wpm === 20 && T.rates(90, 10, 60).accuracy === 90, 'A3 WPM and accuracy are Reports\' arithmetic');
    const src = readFileSync(new URL('../teach-data.js', import.meta.url), 'utf8');
    ok(/import \{ totalsOf, weekStartOf \} from '\.\/daylog\.js'/.test(src) && !/secondsLibrary\s*\|\|\s*0\)\s*\+/.test(src),
       '⚠️ A4 no local copy of the totals rule — the copy Reports kept is how Arcade went missing');
}

console.log('\nB — ROLL-UP');
{
    const people = new Map([['a', { name: 'Ann', email: 'a@x', classId: 'c1' }],
                            ['b', { name: 'Ben', email: 'b@x', classId: 'c1' }]]);
    const docs = [
        { uid: 'a', date: '2026-11-10', data: { uid: 'a', secondsSchool: 600, charsSchool: 1000, mistakesSchool: 10 } },
        { uid: 'a', date: '2026-11-10', data: { uid: 'a', secondsSchool: 600, charsSchool: 1000, mistakesSchool: 10 } },
        { uid: 'a', date: '2026-11-11', data: { uid: 'a', secondsArcade: 300, charsArcade: 500, mistakesArcade: 0 } },
        { uid: 'z', date: '2026-11-11', data: { uid: 'z', displayName: 'Zed', secondsSchool: 60, charsSchool: 50 } },
    ];
    const rows = T.rollUp(docs, people);
    const a = rows.find(r => r.uid === 'a'), b = rows.find(r => r.uid === 'b'), z = rows.find(r => r.uid === 'z');
    ok(a.seconds === 900 && a.days === 2, '⚠️ B1 a day found twice (query AND by id) counts ONCE; Arcade adds in');
    ok(b && b.seconds === 0 && b.days === 0, 'B2 a roster student who never typed gets a zero row (Reports shows them too)');
    ok(z && z.name === 'Zed', 'B3 a student found only by their days is kept, named from the day');
    ok(a.wpm === Math.round((1500 / 5) / 15) && a.dailyLogs[0].date === '2026-11-10', 'B4 rates over the range; days in order');
    const zeroDay = T.rollUp([{ uid: 'a', date: '2026-11-12', data: { uid: 'a', secondsSchool: 0 } }], new Map());
    ok(zeroDay[0].days === 1, 'B5 Days Active counts a day whose record exists, exactly as Reports does');
}

console.log('\nC — ⚠️ THE CSV IS REPORTS\' CSV');
{
    const rows = [
        { uid: 'b', name: 'Ben', email: 'b@x', classId: 'c2', seconds: 3725, chars: 5000, wpm: 16, accuracy: 95, days: 3, adjusted: '' },
        { uid: 'a', name: 'Ann, Jr.', email: 'a@x', classId: 'c1', seconds: 750, chars: 900, wpm: 14, accuracy: 88, days: 2, adjusted: 'speed 70%' },
    ];
    const one = T.toCsv(rows, { adjustedOf: r => r.adjusted }).trim().split('\n');
    ok(one[0] === 'Name,Email,Total Seconds,Total Time,Characters,Avg WPM,Accuracy %,Days Active,Adjusted',
       '⭐⭐ C1 the header is Reports\' header, column for column');
    const r = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');
    ok(r.includes("const headers = ['Name', 'Email', 'Total Seconds', 'Total Time', 'Characters', 'Avg WPM', 'Accuracy %', 'Days Active', 'Adjusted'];"),
       'C2 …and Reports still has that header (if Reports changes, this must too)');
    ok(one[1] === '"Ann, Jr.",a@x,750,12m 30s,900,14,88,2,speed 70%', 'C3 a comma is quoted; time is Reports\' "12m 30s"');
    ok(one[2].startsWith('Ben,b@x,3725,1h 2m,'), 'C4 "1h 2m" for an hour and over, as Reports writes it');
    const names = { c1: 'Period 1', c2: 'Period 2' };
    const many = T.toCsv(rows, { classNameOf: id => names[id], adjustedOf: r => r.adjusted }).trim().split('\n');
    ok(many[0].endsWith(',Adjusted,Class'), '⭐ C5 several classes → ONE file, with Class APPENDED (the first nine never move)');
    ok(many[1].endsWith(',Period 1') && many[2].endsWith(',Period 2'), 'C6 …sorted by class, then name');
}

console.log('\nD — RANGES AND FLAGS');
{
    const w = T.rangePreset('week', '2026-11-12', 6);   // a Thursday; week starts Saturday
    ok(w.start === '2026-11-07' && w.end === '2026-11-12', 'D1 "This week" runs from the class\'s anchor to today');
    const l = T.rangePreset('last', '2026-11-12', 6);
    ok(l.start === '2026-10-31' && l.end === '2026-11-06', 'D2 "Last week" is the seven days before that');
    ok(T.rangePreset('week', '2026-11-12', 1).start === '2026-11-09', 'D3 a Monday class gets a Monday week');
    ok(T.datesInRange('2026-11-10', '2026-11-12').length === 3, 'D4 dates are inclusive');
    ok(T.idleSuspect(600, 50) && !T.idleSuspect(600, 2000) && !T.idleSuspect(30, 0), 'D5 Reports\' idle rule, same thresholds');
    ok(T.formatTime(0) === '0m 0s' && T.formatTime(65) === '1m 5s', 'D6 Reports\' time format');
    ok(T.agoText(Date.now() - 5 * 60000) === '5 min ago' && T.agoText(null) === '', 'D7 "last active"');
}

console.log(fail ? `\nteach-data-test: ${pass} passed, ${fail} FAILED` : `\nteach-data-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
