// staff-admin.js v2.2.0 — Staff tab for admin.html
window.STAFF_ADMIN_VERSION = '2.2.0';
//
// v2.0.0 — REBUILT to need no command line. v1.0.0 called Cloud Functions to set
//          Auth custom claims, which requires `firebase deploy --only functions`.
//          Roles now live in staff/{uid} documents that firestore.rules reads
//          directly, so this panel is plain Firestore writes.
//
//          Side benefit: role changes are INSTANT. No "sign out and back in" —
//          rules read the live document every request.
//
// ── HOW PEOPLE ARE FOUND, AND WHY NOT BY SEARCH ──
// A colleague asks for access; their request lands in staffRequests/{uid} with
// their name and email. You approve or dismiss it.
//
// This replaces email search on purpose, and it's better in two ways. Searching
// by email needs either the Admin SDK (a Cloud Function) or a browsable
// collection of every user — a district-wide student directory sitting in the
// database. The request flow needs neither: only people who opted in by asking
// ever appear, so there's no student data at rest and nothing to search.
//
// ── super_admin ──
// Grantable only by editing staff/{uid} in the Firebase console. Rules also block
// ANYONE from editing their own record, including a super_admin — that's what
// stops an admin quietly widening their own reach.

import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
         query, where }
    from "./read-meter.js";   // ⚠️ METERED. read-meter.js re-exports the whole SDK
// with the billable calls wrapped, so this is a URL swap and nothing else.
// Jake, 2026-08-25, after a 138-student scan: "There's nothing in the console
// letting me know how many reads/writes it used." This file was one of THREE
// still importing Firestore directly and therefore invisible to the meter —
// the others were staff-admin.js and school-audit.html. ⚠️ A PAGE THAT IS NOT
// METERED IS A PAGE WHOSE COST NOBODY CAN SEE, and admin pages are where the
// expensive sweeps live. ttbMeter.report() in the console, any time.


let _db = null, _auth = null;
let _scope = { role: null, schoolIds: [] };
let _schools = {};          // schoolId -> { name }
let _candidate = null;      // the request currently being acted on
let _inited = false;

const ROLE_LABELS = {
    teacher: 'Teacher',
    building_admin: 'Building Admin',
    super_admin: 'Super Admin (Firebase console only)',
};

const SCOPE_LABELS = {
    own_classes: 'Own classes only',
    building: 'Whole building',
};

export function initStaffPanel(db, auth, scope) {
    _db = db; _auth = auth;
    if (scope) _scope = { role: scope.role || null,
                          schoolIds: scope.schoolIds || [],
                          bootstrap: !!scope.bootstrap };
}

function canManageStaff() {
    return _scope.role === 'super_admin' || _scope.role === 'building_admin';
}

const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function setStatus(msg, isError) {
    const el = document.getElementById('staff-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#ff5252' : '#888';
}

// ─── Entry point, called on tab switch ───────────────────────────────────────
export async function initStaffPanelContent() {
    if (!canManageStaff()) {
        const wrap = document.getElementById('staff-panel');
        if (wrap) wrap.innerHTML =
            '<div style="padding:20px;color:#888">Staff management requires ' +
            'building admin or super admin access.</div>';
        return;
    }
    if (!_inited) {
        _inited = true;
        bindUI();
        await loadSchools();
    }
    await loadRequests();
    await refreshStaffList();
    await loadPendingGrants();
    if (_scope.role === 'super_admin') await refreshSchoolsList();
}

async function loadSchools() {
    try {
        const snap = await getDocs(collection(_db, 'schools'));
        _schools = {};
        snap.forEach(d => { _schools[d.id] = d.data(); });
    } catch (e) {
        console.warn('Could not load schools:', e);
    }

    // A building_admin can only assign their own buildings.
    const ids = _scope.role === 'super_admin'
        ? Object.keys(_schools)
        : Object.keys(_schools).filter(id => _scope.schoolIds.includes(id));

    const box = document.getElementById('staff-schools-box');
    if (!box) return;
    if (!ids.length) {
        box.innerHTML = '<div style="color:#ff8a65;font-size:.85em">' +
            'No schools available. A super admin needs to create them first ' +
            '(Firestore console → <code>schools</code> collection).</div>';
        return;
    }
    box.innerHTML = ids.map(id => `
        <label style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:.85em">
            <input type="checkbox" class="staff-school-cb" value="${esc(id)}">
            ${esc(_schools[id].name || id)}
        </label>`).join('');
}

function bindUI() {
    document.getElementById('staff-grant-btn').addEventListener('click', doGrant);
    document.getElementById('staff-email-grant-btn').addEventListener('click', openGrantByEmail);
    document.getElementById('staff-email-grant-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') openGrantByEmail();
    });

    // Schools panel is super_admin only.
    const schoolsBox = document.getElementById('schools-section');
    if (schoolsBox) {
        schoolsBox.style.display = _scope.role === 'super_admin' ? '' : 'none';
        // v2.2.0: in bootstrap mode the role is granted by JavaScript only and
        // rules will reject every write. Say so rather than offering a form that
        // fails — this is the exact confusion that cost an evening.
        if (_scope.bootstrap) {
            const st = document.getElementById('school-status');
            if (st) {
                st.innerHTML = 'Create your own <code>staff</code> document first — ' +
                    'see the orange banner at the top of this page. Until then ' +
                    'Firestore will reject this.';
                st.style.color = '#ffaa00';
            }
            const addBtn0 = document.getElementById('school-add-btn');
            if (addBtn0) addBtn0.disabled = true;
        }
        const addBtn = document.getElementById('school-add-btn');
        if (addBtn) addBtn.addEventListener('click', addSchool);
    }
    const helpToggle = document.getElementById('staff-help-toggle');
    if (helpToggle) helpToggle.addEventListener('click', () => {
        const h = document.getElementById('staff-help');
        h.style.display = h.style.display === 'none' ? '' : 'none';
    });
    document.getElementById('staff-refresh-btn').addEventListener('click', async () => {
        await loadRequests();
        await refreshStaffList();
    });

    // A building_admin can only create teachers.
    const roleSel = document.getElementById('staff-role-select');
    roleSel.innerHTML = '';
    const allowed = _scope.role === 'super_admin'
        ? ['teacher', 'building_admin']
        : ['teacher'];
    allowed.forEach(r => {
        roleSel.innerHTML += `<option value="${r}">${ROLE_LABELS[r]}</option>`;
    });

    const scopeSel = document.getElementById('staff-scope-select');
    scopeSel.innerHTML = Object.entries(SCOPE_LABELS)
        .map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
}

// ─── Pending requests ────────────────────────────────────────────────────────
async function loadRequests() {
    const el = document.getElementById('staff-requests');
    if (!el) return;
    el.innerHTML = '<div style="color:#888;font-size:.85em">Loading…</div>';
    try {
        const snap = await getDocs(collection(_db, 'staffRequests'));
        const rows = [];
        snap.forEach(d => rows.push({ uid: d.id, ...d.data() }));
        if (!rows.length) {
            el.innerHTML = '<div style="color:#888;font-size:.85em">' +
                'No pending requests. A colleague asks for access by signing in and ' +
                'opening the admin page.</div>';
            return;
        }
        rows.sort((a, b) => String(a.displayName || a.email).localeCompare(String(b.displayName || b.email)));
        el.innerHTML = rows.map(r => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #333;border-radius:4px;margin-bottom:6px;background:#1a1a1a">
                <div style="flex:1">
                    <div style="font-weight:bold">${esc(r.displayName || '(no name)')}</div>
                    <div style="font-size:.8em;color:#888">${esc(r.email || '')}</div>
                    ${r.note ? `<div style="font-size:.8em;color:#aaa;margin-top:3px">“${esc(r.note)}”</div>` : ''}
                </div>
                <button class="lbtn lbtn-primary req-approve" data-uid="${esc(r.uid)}"
                        style="width:auto;padding:4px 14px;font-size:.85em">Set up…</button>
                <button class="lbtn lbtn-secondary req-dismiss" data-uid="${esc(r.uid)}"
                        style="width:auto;padding:4px 12px;font-size:.85em">Dismiss</button>
            </div>`).join('');

        el.querySelectorAll('.req-approve').forEach(b => b.addEventListener('click', () => {
            const r = rows.find(x => x.uid === b.dataset.uid);
            if (r) openGrantFor(r);
        }));
        el.querySelectorAll('.req-dismiss').forEach(b => b.addEventListener('click', async () => {
            if (!confirm('Dismiss this request? They can ask again.')) return;
            try {
                await deleteDoc(doc(_db, 'staffRequests', b.dataset.uid));
                await loadRequests();
            } catch (e) { setStatus(e.message, true); }
        }));
    } catch (e) {
        console.error(e);
        el.innerHTML = `<div style="color:#ff5252;font-size:.85em">${esc(e.message)}</div>`;
    }
}

// ─── Grant ───────────────────────────────────────────────────────────────────
async function openGrantFor(person) {
    _candidate = person;

    // What do they have already?
    let current = null;
    try {
        const snap = await getDoc(doc(_db, 'staff', person.uid));
        if (snap.exists()) current = snap.data();
    } catch (e) { /* none yet */ }

    const label = current && current.active !== false
        ? `${ROLE_LABELS[current.role] || current.role}` +
          (current.readScope ? ` · ${SCOPE_LABELS[current.readScope] || current.readScope}` : '') +
          (current.schoolIds?.length ? ` · ${current.schoolIds.join(', ')}` : '')
        : 'Student (no staff role)';

    document.getElementById('staff-candidate-info').innerHTML = `
        <div style="font-weight:bold">${esc(person.displayName || '(no name set)')}</div>
        <div style="font-size:.85em;color:#888">${esc(person.email || '')}</div>
        <div style="font-size:.85em;margin-top:4px">Currently:
            <span style="color:${current ? '#4B9CD3' : '#888'}">${esc(label)}</span></div>`;

    if (current?.role && current.role !== 'super_admin') {
        const rs = document.getElementById('staff-role-select');
        if ([...rs.options].some(o => o.value === current.role)) rs.value = current.role;
    }
    if (current?.readScope) document.getElementById('staff-scope-select').value = current.readScope;
    document.querySelectorAll('.staff-school-cb').forEach(cb => {
        cb.checked = (current?.schoolIds || []).includes(cb.value);
    });

    const revokeBtn = document.getElementById('staff-revoke-btn');
    revokeBtn.style.display = current && current.active !== false ? '' : 'none';
    revokeBtn.onclick = () => doRevoke(person);

    document.getElementById('staff-candidate').style.display = '';
    document.getElementById('staff-candidate').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function doGrant() {
    if (!_candidate) return setStatus('Pick someone from the list first.', true);
    const role = document.getElementById('staff-role-select').value;
    const readScope = document.getElementById('staff-scope-select').value;
    const schoolIds = [...document.querySelectorAll('.staff-school-cb:checked')].map(cb => cb.value);

    if (!schoolIds.length) return setStatus('Pick at least one school.', true);

    // Granting to an email with no account yet: write the pending authorisation.
    if (_candidate.byEmail && !_candidate.uid) {
        setStatus('Saving…');
        try {
            await setDoc(doc(_db, 'pendingStaffRoles', _candidate.email), {
                email: _candidate.email,
                role, schoolIds, readScope,
                createdAt: serverTimestamp(),
                createdBy: _auth.currentUser?.email || '',
            });
            setStatus(`${_candidate.email} will become a ${ROLE_LABELS[role]} ` +
                      `(${SCOPE_LABELS[readScope]}) the first time they sign in.`);
            document.getElementById('staff-candidate').style.display = 'none';
            document.getElementById('staff-email-grant-input').value = '';
            _candidate = null;
            await loadPendingGrants();
        } catch (e) {
            console.error(e);
            setStatus(permissionHint(e), true);
        }
        return;
    }

    if (_candidate.uid === _auth.currentUser?.uid) {
        return setStatus("That's you. Nobody can edit their own record — including " +
                         "super admins. Use the Firebase console.", true);
    }

    setStatus('Saving…');
    try {
        await setDoc(doc(_db, 'staff', _candidate.uid), {
            email: _candidate.email || '',
            displayName: _candidate.displayName || '',
            role, schoolIds, readScope,
            active: true,
            updatedAt: serverTimestamp(),
            updatedBy: _auth.currentUser?.email || '',
        }, { merge: true });

        // Request handled — clear it.
        try { await deleteDoc(doc(_db, 'staffRequests', _candidate.uid)); } catch (e) {}

        setStatus(`${_candidate.displayName || _candidate.email} is now a ` +
                  `${ROLE_LABELS[role]} (${SCOPE_LABELS[readScope]}). ` +
                  `Effective immediately — no sign-out needed.`);
        document.getElementById('staff-candidate').style.display = 'none';
        _candidate = null;
        await loadRequests();
        await refreshStaffList();
        await loadPendingGrants();
    } catch (e) {
        console.error(e);
        setStatus(permissionHint(e), true);
    }
}

async function doRevoke(person) {
    if (!confirm(`Remove all staff access for ${person.displayName || person.email}?\n\n` +
                 `They go back to being a student. Their typing data is untouched.`)) return;
    setStatus('Revoking…');
    try {
        await setDoc(doc(_db, 'staff', person.uid), {
            active: false,
            schoolIds: [],
            updatedAt: serverTimestamp(),
            updatedBy: _auth.currentUser?.email || '',
        }, { merge: true });
        setStatus(`Access removed for ${person.displayName || person.email}. ` +
                  `Effective immediately.`);
        document.getElementById('staff-candidate').style.display = 'none';
        _candidate = null;
        await refreshStaffList();
    } catch (e) {
        console.error(e);
        setStatus(permissionHint(e), true);
    }
}

// Firestore's permission errors are opaque; point at the likely cause.
function permissionHint(e) {
    const msg = e?.message || String(e);
    if (/permission|insufficient/i.test(msg)) {
        if (_scope.bootstrap) {
            return 'Denied because you have no staff document yet. The rules identify ' +
                   'admins by a staff/{your-uid} document, not by email — see the ' +
                   'orange banner at the top of this page.';
        }
        return 'Permission denied. Most likely causes, in order: role misspelled in ' +
               'your staff document (must be exactly teacher / building_admin / ' +
               'super_admin), active stored as the string "true" instead of the ' +
               'boolean, or something your role disallows (a building admin can only ' +
               'create teachers in their own building, and nobody — including a super ' +
               'admin — can edit their own record).';
    }
    return msg;
}

// ─── Existing staff list ─────────────────────────────────────────────────────
async function refreshStaffList() {
    const el = document.getElementById('staff-list');
    if (!el) return;
    el.innerHTML = '<div style="color:#888;font-size:.85em">Loading…</div>';
    try {
        const snap = await getDocs(collection(_db, 'staff'));
        const rows = [];
        snap.forEach(d => {
            const s = d.data();
            // A building_admin only sees their own building's staff. Rules allow
            // staff to read all staff records, so this is a courtesy filter, not a
            // security boundary — worth being clear about.
            if (_scope.role !== 'super_admin') {
                const theirs = Array.isArray(s.schoolIds) ? s.schoolIds : [];
                if (!theirs.some(x => _scope.schoolIds.includes(x))) return;
            }
            rows.push({ uid: d.id, ...s });
        });
        if (!rows.length) {
            el.innerHTML = '<div style="color:#888;font-size:.85em">No staff yet.</div>';
            return;
        }
        rows.sort((a, b) => String(a.displayName || a.email).localeCompare(String(b.displayName || b.email)));
        el.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:.85em">
                <thead><tr style="color:#4B9CD3;text-align:left">
                    <th style="padding:4px 6px">Name</th>
                    <th style="padding:4px 6px">Role</th>
                    <th style="padding:4px 6px">Sees</th>
                    <th style="padding:4px 6px">School(s)</th>
                    <th style="padding:4px 6px">Classes</th>
                    <th></th>
                </tr></thead>
                <tbody>${rows.map(r => `
                    <tr style="border-top:1px solid #333;${r.active === false ? 'opacity:.45' : ''}">
                        <td style="padding:4px 6px">${esc(r.displayName || r.email)}
                            <div style="color:#666;font-size:.85em">${esc(r.email || '')}</div></td>
                        <td style="padding:4px 6px">${esc(ROLE_LABELS[r.role] || r.role || '—')}</td>
                        <td style="padding:4px 6px">${esc(SCOPE_LABELS[r.readScope] || r.readScope || 'own_classes')}</td>
                        <td style="padding:4px 6px">${esc((r.schoolIds || []).map(x => _schools[x]?.name || x).join(', '))}</td>
                        <td style="padding:4px 6px">${(r.readScope || 'own_classes') === 'own_classes'
                            ? '<span style="color:#666">from class list</span>' : '—'}</td>
                        <td style="padding:4px 6px">${r.uid === _auth.currentUser?.uid ? '<span style="color:#666">you</span>'
                            : `<button class="lbtn lbtn-secondary staff-edit" data-uid="${esc(r.uid)}"
                                 style="width:auto;padding:2px 10px;font-size:.85em">Edit</button>`}</td>
                    </tr>`).join('')}</tbody>
            </table>`;
        el.querySelectorAll('.staff-edit').forEach(b => b.addEventListener('click', () => {
            const r = rows.find(x => x.uid === b.dataset.uid);
            if (r) openGrantFor(r);
        }));
    } catch (e) {
        console.error(e);
        el.innerHTML = `<div style="color:#ff5252;font-size:.85em">${esc(permissionHint(e))}</div>`;
    }
}

// ─── Grant by email (person may never have signed in) ────────────────────────
//
// The two paths differ in one way worth understanding:
//   - If they ALREADY have a staff record, we edit it and it's live immediately.
//   - If they don't (never signed in, or signed in but never granted anything),
//     we write pendingStaffRoles/{email}. Their next sign-in converts it into a
//     real staff record automatically.
// Either way you type an email and pick a role; the panel tells you which
// happened.
async function openGrantByEmail() {
    const raw = (document.getElementById('staff-email-grant-input').value || '').trim();
    const email = raw.toLowerCase();
    if (!email || !email.includes('@')) return setStatus('Enter a valid email address.', true);

    setStatus('Checking…');
    try {
        // Do they already have a staff record? staff docs carry an email field, so
        // this is a normal query — no directory of users needed.
        const existing = await getDocs(query(collection(_db, 'staff'), where('email', '==', email)));
        if (!existing.empty) {
            const d = existing.docs[0];
            setStatus('Already has a staff record — editing it directly. Changes are immediate.');
            await openGrantFor({ uid: d.id, email, displayName: d.data().displayName || '' });
            return;
        }
        // Not known yet. Grant by email; it applies on their first sign-in.
        _candidate = { uid: null, email, displayName: '', byEmail: true };
        document.getElementById('staff-candidate-info').innerHTML = `
            <div style="font-weight:bold">${esc(email)}</div>
            <div style="font-size:.85em;color:#ffaa00;margin-top:4px">
                No account found yet. The role will be waiting for them and applies
                automatically the first time they sign in.
            </div>`;
        document.querySelectorAll('.staff-school-cb').forEach(cb => { cb.checked = false; });
        document.getElementById('staff-revoke-btn').style.display = 'none';
        document.getElementById('staff-candidate').style.display = '';
        setStatus('');
    } catch (e) {
        console.error(e);
        setStatus(permissionHint(e), true);
    }
}

// ─── Pending grants list ─────────────────────────────────────────────────────
async function loadPendingGrants() {
    const el = document.getElementById('staff-pending-grants');
    if (!el) return;
    try {
        const snap = await getDocs(collection(_db, 'pendingStaffRoles'));
        const rows = [];
        snap.forEach(d => rows.push({ email: d.id, ...d.data() }));
        if (!rows.length) { el.innerHTML = ''; return; }
        el.innerHTML = `
            <div style="font-size:.8em;color:#ffaa00;font-weight:bold;margin:14px 0 6px">
                Waiting for first sign-in (${rows.length})</div>
            ${rows.map(r => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;
                            border:1px dashed #555;border-radius:4px;margin-bottom:4px;font-size:.85em">
                    <div style="flex:1">${esc(r.email)}
                        <span style="color:#888"> → ${esc(ROLE_LABELS[r.role] || r.role)}
                        · ${esc(SCOPE_LABELS[r.readScope] || r.readScope)}</span></div>
                    <button class="lbtn lbtn-secondary pending-cancel" data-email="${esc(r.email)}"
                            style="width:auto;padding:2px 10px;font-size:.9em">Cancel</button>
                </div>`).join('')}`;
        el.querySelectorAll('.pending-cancel').forEach(b => b.addEventListener('click', async () => {
            try {
                await deleteDoc(doc(_db, 'pendingStaffRoles', b.dataset.email));
                await loadPendingGrants();
            } catch (e) { setStatus(permissionHint(e), true); }
        }));
    } catch (e) {
        console.warn('Could not load pending grants:', e);
        el.innerHTML = '';
    }
}

// ─── Schools ─────────────────────────────────────────────────────────────────
// Buildings are super_admin-only to WRITE, but that's a role check, not a
// console-only limitation. This panel is why you never need the Firestore console
// for them.
async function addSchool() {
    const idRaw = (document.getElementById('school-id-input').value || '').trim().toLowerCase();
    const name  = (document.getElementById('school-name-input').value || '').trim();
    const st = document.getElementById('school-status');

    // The ID goes into staff records and every log document, so keep it clean.
    const id = idRaw.replace(/[^a-z0-9_-]/g, '');
    if (!id)   { st.textContent = 'Short ID is required (letters, numbers, dashes).'; st.style.color = '#ff6666'; return; }
    if (!name) { st.textContent = 'Full name is required.'; st.style.color = '#ff6666'; return; }
    if (id !== idRaw) {
        st.textContent = `ID cleaned to "${id}" — only letters, numbers, - and _.`;
        st.style.color = '#ffaa00';
    }

    try {
        const existing = await getDoc(doc(_db, 'schools', id));
        if (existing.exists() &&
            !confirm(`A school with ID "${id}" already exists (${existing.data().name}). Overwrite its name?`)) return;
        await setDoc(doc(_db, 'schools', id), { name, active: true }, { merge: true });
        st.textContent = `Saved "${name}" as ${id}.`;
        st.style.color = '#00ff41';
        document.getElementById('school-id-input').value = '';
        document.getElementById('school-name-input').value = '';
        await loadSchools();
        await refreshSchoolsList();
    } catch (e) {
        console.error(e);
        st.textContent = permissionHint(e);
        st.style.color = '#ff6666';
    }
}

async function refreshSchoolsList() {
    const el = document.getElementById('schools-list');
    if (!el) return;
    const ids = Object.keys(_schools);
    el.innerHTML = ids.length
        ? ids.map(id => `<div style="font-size:.85em;padding:3px 0">
              <code style="color:#4B9CD3">${esc(id)}</code> — ${esc(_schools[id].name || '')}</div>`).join('')
        : '<div style="font-size:.85em;color:#888">No schools yet. Add one above — ' +
          'nothing else works until at least one exists.</div>';
}

// ─── Class changes ───────────────────────────────────────────────────────────
// Nothing to do. firestore.rules reads class membership from the class document's
// teacherUids, not from a list on the staff record, so there is no cache, no
// token, and nothing to keep in sync. A teacher can read a class the instant it
// exists.
//
// Kept as a no-op so lessons-admin.js doesn't need a special case.
export async function syncOwnClaimsAfterClassChange() {
    return true;
}
