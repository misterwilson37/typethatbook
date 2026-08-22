// celebrate.js v1.1.0 — CONFETTI, FIREWORKS AND THE TOAST. ONE COPY.
//
// v1.1.0 — ⚠️ A VERSION CONSTANT, WHICH THIS MODULE SHIPPED WITHOUT.
//          It was extracted as a shared module and never wired into the
//          machinery that maintains shared modules, so versions.js could not
//          report it and the build footer could not see it — a stale cached
//          copy in a classroom was invisible from the chair. ROADMAP 9b;
//          HANDOFF §0.-15. No behaviour changed.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ WHY THIS FILE EXISTS: IT WAS THE FOURTH TWIN FOUND IN ONE DAY.
// ═════════════════════════════════════════════════════════════════════════════
//
// game.js and learn.js each carried their own createCelebrationCanvas(),
// launchConfetti(), launchFireworks() and showGoalToast(). learn.js's copy is
// even labelled "copied from game.js". On 2026-08-21 three other hand-maintained
// twins failed in exactly the way twins fail:
//
//   • mergeGuestStats()          — the same defect in both, fixed twice
//   • applyGoalCelebrationState() — open-coded twice IN learn.js alone, and the
//                                   two copies had to be found separately
//   • the ⚙ / ↺ furniture         — anchored differently on each page
//
// The celebration copies had drifted too, quietly and only in the details:
// School burst a fixed 80 particles where Library burst 60–100, and School's
// particles did not shrink as they faded (`p.size` against `p.size * p.life`).
// Nobody chose either difference. That is what drift looks like before it
// becomes a bug.
//
// ⚠️ THE POINT IS NOT TIDINESS. Jake's report was "not everyone got fireworks",
// and the first thing anyone would want to do about that is make the fireworks
// bigger. With two copies that is two edits, and the second one gets forgotten.
// It is now one number in one file.
//
// ⚠️ THIS MODULE IS DOM-ONLY AND STATE-FREE ON PURPOSE. It knows nothing about
// goals, totals, students or Firestore. WHETHER to celebrate is decided by the
// callers against hud.js's period latch; this file only knows HOW. Do not put a
// goal check in here, and do not let it import daylog.js.

// ─── Tuning ──────────────────────────────────────────────────────────────────
//
// ⚠️ SHELL_COUNT AND FRAME_CAP ARE "DOUBLE IT", AND THEY ARE THE WHOLE REASON
// ANYONE WILL OPEN THIS FILE. Jake, 2026-08-21, on students missing the weekly
// celebration: *"I'm not sure if they just didn't see it (so double it)."* Five
// shells over two seconds was a blink; ten over three, running twice as long,
// is hard to miss from across a classroom. The weekly goal is crossed ONCE PER
// WEEK per child — this is the single most-earned moment in the app and it
// should look like it.
const SHELL_COUNT   = 10;    // was 5
const SHELL_STAGGER = 300;   // ms between launches; was 400
const FIREWORK_FRAMES = 800; // was 400
const CONFETTI_PIECES = 150; // the DAILY goal, unchanged — it recurs, so it
const CONFETTI_FRAMES = 250; // should stay the smaller of the two celebrations.

const COLORS = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1','#fff'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ⚠️ pointer-events:none IS LOAD-BEARING. This canvas covers the whole viewport
// at z-index 9999 for several seconds. Without it, a full-screen transparent
// layer would swallow every click and keystroke target underneath — during
// Adventure, over the drill, on the settings gear. A celebration must never be
// able to interrupt typing.
function createCelebrationCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
                           'pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    return canvas;
}

// ⚠️ THIS CONSTANT IS THE VERSION — the comment at the top is decoration.
// versions.js parses THIS line to build the footer panel. Bump both in the
// same edit; tests/version-stamp-test.mjs fails the suite if they disagree.
export const CELEBRATE_VERSION = '1.1.0';

export function showGoalToast(message, color) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: ${color}; color: #000; font-family: 'Courier Prime', monospace;
        font-weight: 700; font-size: 1.2rem; padding: 14px 28px;
        border-radius: 8px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        animation: toastIn 0.4s ease-out;
    `;
    // Injected once per page. learn.js's copy of this function had no animation
    // at all — the toast simply appeared — which is one of the drifts this
    // module closes.
    if (!document.getElementById('toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'toast-keyframes';
        style.textContent = `
            @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
            @keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-20px); } }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.5s ease-in forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// THE DAILY GOAL. Recurs every morning, so it stays the modest one.
export function launchConfetti() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const palette = COLORS.slice(0, 8);   // no white — it vanishes on pale pages
    const pieces = [];

    for (let i = 0; i < CONFETTI_PIECES; i++) {
        pieces.push({
            x: W * 0.5 + (Math.random() - 0.5) * W * 0.6,
            y: -20 - Math.random() * 100,
            w: 6 + Math.random() * 6,
            h: 10 + Math.random() * 8,
            color: pick(palette),
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 3,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.03 + Math.random() * 0.05,
        });
    }

    showGoalToast('🎉 Daily Goal Reached!', '#22c55e');

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, W, H);
        let alive = false;
        pieces.forEach(p => {
            p.x += p.vx + Math.sin(p.wobble) * 0.5;
            p.y += p.vy;
            p.vy += 0.04;               // gravity
            p.rotation += p.rotSpeed;
            p.wobble += p.wobbleSpeed;
            p.vx *= 0.99;
            if (p.y < H + 50) {
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - (frame / (CONFETTI_FRAMES - 50)));
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
        });
        ctx.globalAlpha = 1;
        frame++;
        if (alive && frame < CONFETTI_FRAMES) requestAnimationFrame(animate);
        else canvas.remove();
    }
    requestAnimationFrame(animate);
}

// THE WEEKLY GOAL. Crossed once a week. See the tuning block above.
export function launchFireworks() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const shells = [];
    const particles = [];

    for (let i = 0; i < SHELL_COUNT; i++) {
        setTimeout(() => {
            shells.push({
                x: W * (0.12 + Math.random() * 0.76),
                y: H,
                vy: -(8 + Math.random() * 4),
                targetY: H * (0.12 + Math.random() * 0.4),
                color: pick(COLORS),
                exploded: false,
            });
        }, i * SHELL_STAGGER);
    }

    showGoalToast('🎆 Weekly Goal Reached!', '#FFD700');

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, W, H);

        shells.forEach(s => {
            if (s.exploded) return;
            s.y += s.vy;
            s.vy += 0.12;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            if (s.y <= s.targetY || s.vy >= 0) {
                s.exploded = true;
                const count = 60 + Math.floor(Math.random() * 40);
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
                    const speed = 2 + Math.random() * 4;
                    particles.push({
                        x: s.x, y: s.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: Math.random() > 0.3 ? s.color : pick(COLORS),
                        life: 1.0,
                        decay: 0.008 + Math.random() * 0.012,
                        size: 1.5 + Math.random() * 2,
                    });
                }
            }
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.vx *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.beginPath();
            // ⚠️ `* p.life` — particles SHRINK as they fade. learn.js's copy had
            // lost this and drew every particle at full size until it vanished.
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        frame++;
        // ⚠️ THE `shells.length >= SHELL_COUNT` TERM IS NOT REDUNDANT. Shells are
        // pushed by staggered timeouts, so early in the run the array is short
        // and `every(exploded)` is vacuously true on an empty array — without
        // this, the whole display would tear itself down before the second
        // shell had even launched. Doubling SHELL_COUNT lengthens that window,
        // which is exactly when a latent version of this bites.
        const allDone = shells.length >= SHELL_COUNT && shells.every(s => s.exploded);
        if (frame < FIREWORK_FRAMES && !(allDone && particles.length === 0)) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    requestAnimationFrame(animate);
}
