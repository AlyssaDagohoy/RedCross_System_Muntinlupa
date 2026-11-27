import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

const KEY = 'rc_welcome';
const IN_MS = 300;
const FILL_MS = 2000;
const HOLD_MS = 150;
const OUT_MS = 600;

const S = { phase: 'off', shown: false, bar: false, instant: false, confirmed: false, t0: 0 };
let booted = false;
let authed = null;
let lastEnd = 0;
let guard = null;
const subs = new Set();
const notify = () => { subs.forEach((f) => f()); };
const set = (p) => { Object.assign(S, p); notify(); };

const readFlag = () => { try { return !!sessionStorage.getItem(KEY); } catch (err) { return false; } };
const clearFlag = () => { try { sessionStorage.removeItem(KEY); } catch (err) {} };
const markGuest = () => { try { sessionStorage.setItem(KEY, '1'); } catch (err) {} };
const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const needsPick = (props) => !!props && Array.isArray(props.staffList) && props.staffList.length > 0 && !props.adminProfile;

const initialPage = () => {
    try {
        const el = document.getElementById('app');
        let raw = el && el.dataset ? el.dataset.page : null;
        if (!raw) {
            const s = document.querySelector('script[data-page]');
            raw = s ? s.textContent : null;
        }
        if (!raw) return null;
        const page = JSON.parse(raw);
        if (!page || !page.props) return null;
        return page;
    } catch (err) { return null; }
};

const initialAuth = () => {
    const page = initialPage();
    if (!page) return null;
    const a = page.props.auth;
    if (a && typeof a === 'object') return !!a.user;
    return null;
};

const finishAll = () => {
    set({ phase: 'off', shown: false, bar: false, instant: false, confirmed: false });
    lastEnd = Date.now();
};

const drop = () => {
    clearTimeout(guard);
    set({ phase: 'off', shown: false, bar: false, instant: false, confirmed: false });
};

const cancel = () => {
    if (S.phase === 'off' || S.confirmed) return;
    clearTimeout(guard);
    set({ phase: 'out' });
    setTimeout(finishAll, OUT_MS + 60);
};

const startPending = () => {
    if (S.phase !== 'off' || reduced()) return;
    S.t0 = Date.now();
    set({ phase: 'in', shown: false, bar: false, instant: false, confirmed: false });
    guard = setTimeout(cancel, 8000);
};

const confirm = () => {
    if (S.confirmed) return;
    if (S.phase === 'off') {
        if (reduced() || Date.now() - lastEnd < 4000) return;
        set({ phase: 'run', shown: true, instant: true, confirmed: true });
    } else if (S.phase === 'in') {
        clearTimeout(guard);
        S.confirmed = true;
    } else {
        return;
    }
    const wait = S.instant ? 60 : Math.max(0, IN_MS - (Date.now() - S.t0)) + 40;
    setTimeout(() => set({ phase: 'run', shown: true, bar: true }), wait);
    setTimeout(() => set({ phase: 'out' }), wait + FILL_MS + HOLD_MS);
    setTimeout(finishAll, wait + FILL_MS + HOLD_MS + OUT_MS + 60);
};

export const showPreparing = () => {
    if (!readFlag() || S.phase !== 'off') return;
    clearFlag();
    confirm();
};

if (typeof window !== 'undefined') window.__rcPreparing = showPreparing;

const init = () => {
    if (booted) return;
    booted = true;
    authed = initialAuth();
    if (authed === false) markGuest();
    else if (authed === true && readFlag()) {
        const page = initialPage();
        if (!needsPick(page && page.props)) { clearFlag(); confirm(); }
    }
    try {
        router.on('start', (e) => {
            try {
                const v = e && e.detail && e.detail.visit;
                if (!v || String(v.method).toLowerCase() !== 'post' || !readFlag()) return;
                const path = new URL(String(v.url), window.location.origin).pathname;
                if (/\/login\/?$/.test(path)) startPending();
            } catch (err) {}
        });
        router.on('navigate', (e) => {
            const p = e && e.detail && e.detail.page;
            if (!p || !p.props) return;
            const a = p.props.auth;
            authed = (a && typeof a === 'object') ? !!a.user : null;
            if (authed === false) {
                markGuest();
                if (S.phase === 'in') cancel();
            } else if (authed === true) {
                if (needsPick(p.props)) {
                    if (S.phase === 'in') drop();
                } else if (readFlag() || S.phase === 'in') { clearFlag(); confirm(); }
            } else if (S.phase === 'in') {
                clearFlag();
                confirm();
            }
        });
        router.on('error', () => { if (S.phase === 'in' && !S.confirmed) cancel(); });
        router.on('finish', () => { if (S.phase === 'in' && !S.confirmed) cancel(); });
    } catch (err) {}
};

export default function WelcomeBack() {
    if (typeof window !== 'undefined') init();
    const [, force] = useState(0);

    useEffect(() => {
        const f = () => force((n) => n + 1);
        subs.add(f);
        f();
        return () => { subs.delete(f); };
    }, []);

    if (S.phase === 'off') return null;
    const out = S.phase === 'out';

    return (
        <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#b92f2f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: "'Montserrat','Open Sans',sans-serif", opacity: S.shown && !out ? 1 : 0, pointerEvents: out ? 'none' : 'auto', transition: out ? 'opacity ' + OUT_MS + 'ms ease-in-out' : (S.instant ? 'none' : 'opacity ' + IN_MS + 'ms ease-in-out'), willChange: 'opacity' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '24px', textAlign: 'center', opacity: S.shown ? 1 : 0, transform: !S.shown ? 'translateY(8px)' : (out ? 'translateY(-6px)' : 'none'), transition: S.instant && !out ? 'none' : 'opacity 450ms ease, transform 450ms ease' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>
                    <img src="/images/finallogo.png" alt="" style={{ width: '90px', height: '90px', maxWidth: 'none', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 500 }}>Preparing your dashboard</div>
                <div style={{ width: '160px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#fff', transformOrigin: 'left center', transform: S.bar ? 'scaleX(1)' : 'scaleX(0)', transition: S.bar ? 'transform ' + FILL_MS + 'ms cubic-bezier(.45,.05,.35,1)' : 'none', willChange: 'transform' }} />
                </div>
            </div>
        </div>
    );
}