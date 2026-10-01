// trusted-key.mjs v1.0.0 — Round 150 (Nesmith). A TEST FIXTURE, NOT A HARNESS.
//
// ⚠️⚠️ WHY THIS EXISTS. Round 150 made every typing handler ignore key events a
// script made (`e.isTrusted !== true`), because a `javascript:` bookmark can fire
// fake keys at the page with the developer console removed. jsdom's
// dispatchEvent() is, correctly, a script — every event it delivers says
// isTrusted false — so the arcade harnesses that play a game by dispatching keys
// would see nothing land and go red for a reason that is not a defect.
//
// ⭐ This builds a real jsdom KeyboardEvent and delivers it through jsdom's
// INTERNAL dispatch with the trusted flag set, which is what jsdom itself does
// for events the "browser" originates. Listeners, capture, bubbling and
// preventDefault() all behave exactly as with dispatchEvent().
//
// ⚠️ USE IT FOR KEYS A STUDENT PRESSES. A harness that wants to prove a
// script-made key is REFUSED must keep using plain dispatchEvent() — see
// tests/retype-farm-test.mjs Part E.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const idl = require('jsdom/lib/jsdom/living/generated/utils.js');

export function trustedKeyDispatcher(win) {
    return (key, init = {}) => {
        const ev = new win.KeyboardEvent('keydown',
            { key, bubbles: true, cancelable: true, ...init });
        const impl = idl.implForWrapper(ev);
        impl.isTrusted = true;
        const target = win.document.activeElement || win.document.body || win;
        idl.implForWrapper(target)._dispatch(impl);
        return !ev.defaultPrevented;
    };
}
