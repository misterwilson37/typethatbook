// goal-ladder-test.mjs v1.0.0 — Round 161. A TARGET EXISTS ONLY WHEN SOMEONE SET ONE.
//
// Jake, 2026-11-02: a student was not in his class and nothing on screen said so —
// `Daily 9:22 / 10:00` looked exactly like his own students' HUD, because the 10:00
// was the site-wide settings/goals fallback. Rulings: class wins → else the
// student's OWN goals → else NO target. See goal-ladder.js.
//
//   A  the ladder itself (pure)
//   B  ⚠️ every surface uses it, and NOTHING reads minutes from settings/goals
//   C  the ⚙ "Your goals" row, driven for real in jsdom
//   D  reports.html no longer offers site-wide minutes
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { resolveMinuteGoals, ownGoalsPatch, cleanGoalSeconds, describeGoals,
         OWN_DAILY_MAX_MIN, OWN_WEEKLY_MAX_MIN } from '../goal-ladder.js';
import { hudStrings } from '../hud.js';

let pass = 0, fail = 0;
const ok = (name, cond, why = '') => {
    if (cond) { pass++; console.log('  ok   ' + name); }
    else { fail++; console.log('  FAIL ' + name + (why ? ' — ' + why : '')); }
};
const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ─── A ───────────────────────────────────────────────────────────────────────
console.log('\nA — THE LADDER');
{
    const own = { ownDailySeconds: 900, ownWeeklySeconds: 3600 };
    let g = resolveMinuteGoals({ classDoc: { dailySeconds: 600, weeklySeconds: 3000 }, userDoc: own });
    ok('A1 a class wins over the student\'s own goals', g.source === 'class' && g.dailySeconds === 600 && g.weeklySeconds === 3000);
    g = resolveMinuteGoals({ classDoc: { dailySeconds: 0, weeklySeconds: 0 }, userDoc: own });
    ok('A2 ⚠️ a class that sets NO goals still wins — the teacher chose none', g.source === 'class' && g.dailySeconds === 0 && g.weeklySeconds === 0);
    g = resolveMinuteGoals({ classDoc: null, userDoc: own });
    ok('A3 no class → the student\'s own goals', g.source === 'own' && g.dailySeconds === 900 && g.weeklySeconds === 3600);
    g = resolveMinuteGoals({ classDoc: null, userDoc: { classId: 'gone' } });
    ok('A4 ⚠️ no class and no own goals → NO target (the whole point)', g.source === 'none' && g.dailySeconds === 0 && g.weeklySeconds === 0);
    g = resolveMinuteGoals({});
    ok('A5 nothing at all → no target', g.source === 'none' && g.dailySeconds === 0);
    g = resolveMinuteGoals({ userDoc: { ownDailySeconds: 'x', ownWeeklySeconds: -5 } });
    ok('A6 junk own goals are no goals, never NaN', g.source === 'none' && g.dailySeconds === 0 && g.weeklySeconds === 0);
    g = resolveMinuteGoals({ userDoc: { ownDailySeconds: 999999 } });
    ok('A7 own goals are clamped', g.dailySeconds === OWN_DAILY_MAX_MIN * 60);
    const p = ownGoalsPatch('15', 9999);
    ok('A8 ownGoalsPatch: minutes in, clamped seconds out',
       p.ownDailySeconds === 900 && p.ownWeeklySeconds === OWN_WEEKLY_MAX_MIN * 60);
    const z = ownGoalsPatch('', 0);
    ok('A9 blank clears both halves', z.ownDailySeconds === 0 && z.ownWeeklySeconds === 0);
    ok('A10 whole minutes only', cleanGoalSeconds(95, 120) === 120);
    ok('A11 describeGoals', describeGoals(600, 3000) === '10 min a day · 50 min a week' && describeGoals(0, 0) === '');
    const h = hudStrings({ todaySeconds: 562, dailyGoal: 0, weekSeconds: 900, weeklyGoal: 0 });
    ok('A12 with no target the HUD shows the bare count — no "/"', !/\//.test(h.lead) && !/\//.test(h.right) && !h.dailyDone);
}

// ─── B ───────────────────────────────────────────────────────────────────────
console.log('\nB — EVERY SURFACE USES IT');
for (const f of ['game.js', 'learn.js', 'learn2.js', 'index.html']) {
    const src = read(f);
    ok(`B1 ${f} imports resolveMinuteGoals from goal-ladder.js`,
       /import\s*\{[^}]*resolveMinuteGoals[^}]*\}\s*from\s*["']\.\/goal-ladder\.js["']/.test(src));
    ok(`B2 ${f} calls it`, /resolveMinuteGoals\(\{/.test(src));
    // ⚠️ THE DEFECT, ASSERTED ABSENT: no read of settings/goals may hand minutes on.
    const reads = [...src.matchAll(/settings['"],\s*['"]goals/g)].map(m => m.index);
    ok(`B3 ⚠️ ${f}: no settings/goals read supplies daily/weekly minutes`,
       reads.every(at => {
           // The read's own block: up to the first line that closes back to the
           // enclosing indentation — 450 chars covers every shape on record.
           const blk = src.slice(at, at + 450);
           return !/\b(data|d|gd)\.(daily|weekly)Seconds\b/.test(blk) &&
                  !/goals\.(daily|weekly)Seconds\s*=/.test(blk);
       }));
}
for (const f of ['learn.js', 'learn2.js', 'game.js']) {
    ok(`B4 ${f} shares the ttb_goalsCache_v3 key`, /['"]ttb_goalsCache_v3['"]/.test(read(f)));
}
ok('B5 index.html reads the shared v3 key', /IDX_GOALS_CACHE_KEY\s*=\s*['"]ttb_goalsCache_v3['"]/.test(read('index.html')));
for (const f of ['learn.js', 'learn2.js']) {
    const src = read(f);
    ok(`B6 ${f}: Settings offers the "goals" row only when there is no class`,
       /if\s*\(\s*classInfo\s*&&\s*classInfo\.id\s*\)\s*\{[\s\S]{0,400}?set by your teacher[\s\S]{0,200}?\}\s*else\s*\{[\s\S]{0,80}?kind:\s*'goals'/.test(src));
    ok(`B7 ${f}: saveOwnGoals refuses when a class exists, and drops the cache`,
       /async function saveOwnGoals[\s\S]{0,400}?classInfo\.id\)\s*return false[\s\S]{0,900}?removeItem\(LEARN_GOALS_KEY\)/.test(src));
}
{
    const g = read('game.js');
    ok('B8 game.js: Settings states the class, or "No class assigned"', /No class assigned/.test(g) && /ttbClassName/.test(g));
    ok('B9 game.js: saveOwnGoals refuses when the class won', /async function saveOwnGoals[\s\S]{0,300}?goals\.source === 'class'\)\s*return false/.test(g));
}

// ─── C ───────────────────────────────────────────────────────────────────────
console.log('\nC — THE ⚙ "YOUR GOALS" ROW, DRIVEN');
{
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.org/' });
    const doc = dom.window.document;
    globalThis.document = doc;
    globalThis.localStorage = { _v: {}, getItem(k) { return this._v[k] ?? null; }, setItem(k, v) { this._v[k] = v; } };
    const api = await import('../settings-panel.js');
    let saved = null, closed = false;
    api.openSettingsPanel({
        rows: [{ kind: 'goals', dailyMinutes: 10, weeklyMinutes: 0,
                 onSave: async (v) => { saved = v; return true; } }],
        onClose: () => { closed = true; },
    });
    const d = doc.getElementById('own-goal-daily'), w = doc.getElementById('own-goal-weekly');
    ok('C1 the row renders two boxes and a Save button', !!d && !!w && !!doc.getElementById('own-goal-save'));
    ok('C2 the existing goal is filled in, an unset one is blank', d && d.value === '10' && w && w.value === '');
    let bubbled = 0;
    doc.addEventListener('keydown', () => { bubbled++; });
    d.focus();
    d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '5', bubbles: true }));
    ok('C3 ⚠️ a digit typed in the box does NOT reach document listeners (learn.js would steal focus)', bubbled === 0);
    d.value = '20'; w.value = '90';
    doc.getElementById('own-goal-save').click();
    await new Promise(r => setTimeout(r, 0));
    ok('C4 Save hands the page the numbers — the panel saves nothing itself',
       saved && saved.dailyMinutes === 20 && saved.weeklyMinutes === 90);
    ok('C5 …and says it saved', /Saved/.test(doc.getElementById('own-goal-status').textContent));
    d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ok('C6 Esc in the box still closes the dialog (and runs onClose)', closed && !doc.querySelector('.settings-overlay'));
}

// ─── D ───────────────────────────────────────────────────────────────────────
console.log('\nD — reports.html');
{
    const r = read('reports.html');
    ok('D1 no site-wide Daily/Weekly minute inputs', !/id="daily-goal"/.test(r) && !/id="weekly-goal"/.test(r));
    ok('D2 the week anchor is still there', /id="weekstart-goal"/.test(r));
    ok('D3 Save writes no minutes into settings/goals',
       !/setDoc\(doc\(db,\s*"settings",\s*"goals"\),\s*\{[^}]*dailySeconds/.test(r));
}

console.log(`\n${fail ? '✗ FAIL' : '✓ PASS'} — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
