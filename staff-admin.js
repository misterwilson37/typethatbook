// staff-admin.js — Staff tab for admin.html
window.STAFF_ADMIN_VERSION = '1.0.0';
//
// Search a colleague by email, grant them a role, set how much of their building
// they can see, revoke them. Visible only to building_admin and super_admin.
//
// ── WHY THERE'S NO USER BROWSER ──
// Deliberately search-by-email rather than a browsable list. A browsable list
// means writing every student's name and email into a queryable collection — a
// district-wide student directory sitting in the database waiting to be queried.
// lookupStaffCandidate() takes one email, returns one person, stores nothing.
//
// ── super_admin ──
// Not grantable here, on purpose. The tier that can grant tiers shouldn't be
// reachable from the UI it governs. Use the bootstrap list in functions/index.js
// or the Firebase console.

import { getFunctions, httpsCallable }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";
import { collection, getDocs }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let _db = null, _auth = null, _fns = null;
let _scope = { role: null, schoolIds: [] };
let _schools = {};          // schoolId -> { name }
let _candidate = null;      // result of the last lookup
let _inited = false;

const ROLE_LABELS = {
    teacher: 'Teacher',
    building_admin: 'Building Admin',
    super_admin: 'Super Admin (console only)',
};

const SCOPE_LABELS = {
    own_classes: 'Own classes only',
    building: 'Whole building',
};

export function initStaffPanel(db, auth, scope) {
    _db = db; _auth = auth;
    _fns = getFunctions();
    if (scope) _scope = { role: scope.role || null, schoolIds: scope.schoolIds || [] };
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
    await refreshStaffList();
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
    document.getElementById('staff-lookup-btn').addEventListener('click', doLookup);
    document.getElementById('staff-email-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') doLookup();
    });
    document.getElementById('staff-grant-btn').addEventListener('click', doGrant);
    document.getElementById('staff-refresh-btn').addEventListener('click', refreshStaffList);

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

// ─── Lookup ──────────────────────────────────────────────────────────────────
async function doLookup() {
    const email = (document.getElementById('staff-email-input').value || '').trim();
    if (!email) return setStatus('Enter an email address.', true);

    setStatus('Looking up…');
    document.getElementById('staff-candidate').style.display = 'none';
    try {
        const res = await httpsCallable(_fns, 'lookupStaffCandidate')({ email });
        const d = res.data;
        if (!d.found) {
            _candidate = null;
            setStatus(`No account for ${email}. They need to sign in to ` +
                      `TypeThatBook once before you can give them a role.`, true);
            return;
        }
        _candidate = d;
        renderCandidate(d);
        setStatus('');
    } catch (e) {
        console.error(e);
        setStatus(e.message || 'Lookup failed.', true);
    }
}

function renderCandidate(d) {
    const box = document.getElementById('staff-candidate');
    const current = d.currentRole
        ? `${ROLE_LABELS[d.currentRole] || d.currentRole}` +
          (d.currentReadScope ? ` · ${SCOPE_LABELS[d.currentReadScope] || d.currentReadScope}` : '') +
          (d.currentSchoolIds?.length ? ` · ${d.currentSchoolIds.join(', ')}` : '')
        : 'Student (no staff role)';

    document.getElementById('staff-candidate-info').innerHTML = `
        <div style="font-weight:bold">${esc(d.displayName || '(no name set)')}</div>
        <div style="font-size:.85em;color:#888">${esc(d.email)}</div>
        <div style="font-size:.85em;margin-top:4px">
            Currently: <span style="color:${d.currentRole ? '#4B9CD3' : '#888'}">${esc(current)}</span>
        </div>
        ${d.lastSignIn ? `<div style="font-size:.75em;color:#666;margin-top:2px">Last sign-in: ${esc(new Date(d.lastSignIn).toLocaleString())}</div>` : ''}`;

    // Pre-select what they already have, so this reads as an edit not a reset.
    if (d.currentRole && d.currentRole !== 'super_admin') {
        const rs = document.getElementById('staff-role-select');
        if ([...rs.options].some(o => o.value === d.currentRole)) rs.value = d.currentRole;
    }
    if (d.currentReadScope) {
        document.getElementById('staff-scope-select').value = d.currentReadScope;
    }
    document.querySelectorAll('.staff-school-cb').forEach(cb => {
        cb.checked = (d.currentSchoolIds || []).includes(cb.value);
    });

    const revokeBtn = document.getElementById('staff-revoke-btn');
    revokeBtn.style.display = d.currentRole ? '' : 'none';
    revokeBtn.onclick = () => doRevoke(d);

    box.style.display = '';
}

// ─── Grant ───────────────────────────────────────────────────────────────────
async function doGrant() {
    if (!_candidate) return setStatus('Look someone up first.', true);
    const role = document.getElementById('staff-role-select').value;
    const readScope = document.getElementById('staff-scope-select').value;
    const schoolIds = [...document.querySelectorAll('.staff-school-cb:checked')].map(cb => cb.value);

    if (!schoolIds.length) return setStatus('Pick at least one school.', true);

    if (_candidate.uid === _auth.currentUser?.uid) {
        return setStatus("That's you. Change your own role from the console instead — " +
                         "it's too easy to lock yourself out from here.", true);
    }

    setStatus('Saving…');
    try {
        const res = await httpsCallable(_fns, 'setStaffRole')({
            targetUid: _candidate.uid,
            role, schoolIds, readScope,
            displayName: _candidate.displayName,
            email: _candidate.email,
        });
        const d = res.data;
        setStatus(`${_candidate.displayName || _candidate.email} is now a ` +
                  `${ROLE_LABELS[d.role]} (${SCOPE_LABELS[d.readScope]}). ` +
                  `They must sign out and back in for it to take effect.`);
        await doLookup();          // re-read so "Currently:" is accurate
        await refreshStaffList();
    } catch (e) {
        console.error(e);
        setStatus(e.message || 'Could not save.', true);
    }
}

async function doRevoke(d) {
    if (!confirm(`Remove all staff access for ${d.displayName || d.email}?\n\n` +
                 `They'll go back to being a student. Their typing data is untouched.`)) return;
    setStatus('Revoking…');
    try {
        await httpsCallable(_fns, 'revokeStaffRole')({ targetUid: d.uid });
        setStatus(`Access removed for ${d.displayName || d.email}. Their existing ` +
                  `sessions were invalidated immediately.`);
        await doLookup();
        await refreshStaffList();
    } catch (e) {
        console.error(e);
        setStatus(e.message || 'Could not revoke.', true);
    }
}

// ─── Existing staff list ─────────────────────────────────────────────────────
async function refreshStaffList() {
    const el = document.getElementById('staff-list');
    if (!el) return;
    el.innerHTML = '<div style="color:#888;font-size:.85em">Loading…</div>';
    try {
        const res = await httpsCallable(_fns, 'listStaff')({});
        const rows = res.data.staff || [];
        if (!rows.length) {
            el.innerHTML = '<div style="color:#888;font-size:.85em">No staff yet.</div>';
            return;
        }
        el.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:.85em">
                <thead><tr style="color:#4B9CD3;text-align:left">
                    <th style="padding:4px 6px">Name</th>
                    <th style="padding:4px 6px">Role</th>
                    <th style="padding:4px 6px">Sees</th>
                    <th style="padding:4px 6px">School(s)</th>
                    <th style="padding:4px 6px">Classes</th>
                </tr></thead>
                <tbody>${rows.map(r => `
                    <tr style="border-top:1px solid #333;${r.active ? '' : 'opacity:.45'}">
                        <td style="padding:4px 6px">${esc(r.displayName || r.email)}
                            <div style="color:#666;font-size:.85em">${esc(r.email)}</div></td>
                        <td style="padding:4px 6px">${esc(ROLE_LABELS[r.role] || r.role || '—')}</td>
                        <td style="padding:4px 6px">${esc(SCOPE_LABELS[r.readScope] || r.readScope)}</td>
                        <td style="padding:4px 6px">${esc((r.schoolIds || []).map(s => _schools[s]?.name || s).join(', '))}</td>
                        <td style="padding:4px 6px">${r.role === 'teacher' && r.readScope === 'own_classes'
                            ? (r.classIds?.length || 0) : '—'}</td>
                    </tr>`).join('')}</tbody>
            </table>`;
    } catch (e) {
        console.error(e);
        el.innerHTML = `<div style="color:#ff5252;font-size:.85em">${esc(e.message || 'Could not load staff.')}</div>`;
    }
}

// ─── Claim refresh after class changes ───────────────────────────────────────
// A teacher's claim.classIds is derived from classes that list them in
// teacherUids, so creating a class leaves the claim stale — they wouldn't be able
// to read the class they just made. Call this after any class create/delete.
//
// Exported so lessons-admin.js can call it from the class and CSV-import paths.
export async function syncOwnClaimsAfterClassChange() {
    try {
        const fns = getFunctions();
        await httpsCallable(fns, 'syncMyClaims')({});
        // Force the new claim into the local token, or nothing changes until the
        // token happens to refresh on its own (up to an hour).
        if (_auth?.currentUser) await _auth.currentUser.getIdToken(true);
        return true;
    } catch (e) {
        console.warn('Claim resync failed — you may need to sign out and back in ' +
                     'before you can see this class\'s data.', e);
        return false;
    }
}
