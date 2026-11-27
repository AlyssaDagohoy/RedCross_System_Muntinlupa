import { Head, Link, router, usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  VolunteerShell — sidebar + topbar used by every volunteer page.    */
/*  Also shows the first-time face registration prompt and the toast.  */
/*  Pages can call openFace() / showToast() via useVolunteerShell().   */
/*                                                                     */
/*  Setup status comes from:                                           */
/*    - shared prop  volunteerSetup.profile_completed  (bool)          */
/*    - auth.user.face_status  ('none' | 'pending' | 'rejected' | ok)  */
/*  Face registration itself happens on the Attendance page            */
/*  (FaceAttendance + FaceRegistration components).                    */
/*                                                                     */
/*  Notifications come from the shared prop volunteerNotifications     */
/*  ({ unread, items }). A page can still pass its own list. Each      */
/*  item is rendered defensively — category, read, and action_url      */
/*  are all optional, so the dropdown degrades gracefully to the       */
/*  plain { id, title, body, time } shape if that's all the backend    */
/*  sends yet.                                                         */
/*                                                                     */
/*  Sidebar: white panel with Menu / General sections. On screens      */
/*  900px wide or less it becomes a slide-in drawer opened from the    */
/*  hamburger button in the top bar.                                   */
/* ------------------------------------------------------------------ */

// route() that does not crash the whole page when a new route is not defined yet.
export const safeRoute = (name, fallback = '#') => {
    try {
        return route(name);
    } catch {
        console.warn(`[Volunteer Portal] Route "${name}" is not defined yet.`);
        return fallback;
    }
};

const ShellContext = createContext({ setup: { profile_completed: false, face_status: 'none', face_done: false, face_pending: false, face_needed: true }, openFace: () => {}, showToast: () => {} });
export const useVolunteerShell = () => useContext(ShellContext);

// Text for the Face Registration status shown on Dashboard and Profile.
export const faceStatusLabel = (setup) => {
    if (setup.face_done) return 'Completed';
    if (setup.face_pending) return 'Pending Approval';
    if (setup.face_status === 'rejected') return 'Not Approved';
    return 'Not Yet Registered';
};

// Face prompt shows once per login session until face registration is completed.
const PROMPT_KEY = 'volunteer_face_prompt_dismissed';
const readDismissed = () => { try { return sessionStorage.getItem(PROMPT_KEY) === '1'; } catch { return false; } };
const writeDismissed = (on) => { try { if (on) sessionStorage.setItem(PROMPT_KEY, '1'); else sessionStorage.removeItem(PROMPT_KEY); } catch { /* ignore */ } };

const btnPrimary = { background: '#CC0000', color: 'white', border: '1px solid #CC0000', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost = { background: 'white', color: '#555', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' };

// Screens at or below this width use the drawer sidebar. Keep in sync with the @media rule in the <style> block.
const MOBILE_BREAKPOINT = 900;

const todayParts = () => {
    const d = new Date();
    return {
        weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    };
};
export default function VolunteerShell({ active, title, notifications = [], children }) {
    const { auth, volunteerSetup, volunteerNotifications } = usePage().props;
    const volunteer = auth?.user;

    // Real notifications come from the shared prop. A page can still pass its own list.
    const bellItems = volunteerNotifications?.items ?? notifications;
    const unreadCount = volunteerNotifications ? volunteerNotifications.unread : notifications.length;

    const faceStatus = volunteer?.face_status ?? 'none';
    const setup = {
        profile_completed: !!volunteerSetup?.profile_completed,
        face_status: faceStatus,
        face_needed: faceStatus === 'none' || faceStatus === 'rejected', // must register (or register again)
        face_pending: faceStatus === 'pending',                          // submitted, waiting for admin
        face_done: !['none', 'rejected', 'pending'].includes(faceStatus),
    };

    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showFacePrompt, setShowFacePrompt] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [sbHidden, setSbHidden] = useState(() => { try { return localStorage.getItem('vp_sidebar_hidden') === '1'; } catch { return false; } });
    const toggleSidebar = () => {
        const next = !sbHidden;
        setSbHidden(next);
        try { localStorage.setItem('vp_sidebar_hidden', next ? '1' : '0'); } catch { /* ignore */ }
    }; // mobile drawer
    const [isMac, setIsMac] = useState(false);
    const [logoFailed, setLogoFailed] = useState(false);
    const [toast, setToast] = useState('');
    const [newCount, setNewCount] = useState(0); // how many were unread when the bell was opened
    const notifRef = useRef(null);
    const userRef = useRef(null);
    const toastTimer = useRef(null);

    useEffect(() => {
        setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));

        const onDown = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
            if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') { setShowNotifications(false); setShowUserMenu(false); setNavOpen(false); }
        };
        const onResize = () => { if (window.innerWidth > MOBILE_BREAKPOINT) setNavOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    // Lock page scroll while the mobile drawer is open.
    useEffect(() => {
        if (!navOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [navOpen]);

    const showToast = (msg) => {
        setToast(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(''), 5000);
    };
    useEffect(() => () => clearTimeout(toastTimer.current), []);
    const vpUrl = usePage().url; useEffect(() => { const key = 'vp_scroll:' + vpUrl; const el = document.querySelector('.vp-content'); let saved = null; try { saved = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) {} let ready = false, tries = 0, raf = 0, t = 0; const save = () => { if (!ready) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { try { sessionStorage.setItem(key, JSON.stringify({ c: el ? el.scrollTop : 0, w: window.scrollY })); } catch (e) {} }); }; const restore = () => { if (!saved) { if (el) el.scrollTop = 0; ready = true; return; } if (el) el.scrollTop = saved.c || 0; window.scrollTo(0, saved.w || 0); const ok = (!saved.c || (el && Math.abs(el.scrollTop - saved.c) < 2)) && (!saved.w || Math.abs(window.scrollY - saved.w) < 2); if (!ok && tries++ < 20) { t = setTimeout(restore, 50); } else { ready = true; } }; restore(); if (el) el.addEventListener('scroll', save, { passive: true }); window.addEventListener('scroll', save, { passive: true }); return () => { clearTimeout(t); cancelAnimationFrame(raf); if (el) el.removeEventListener('scroll', save); window.removeEventListener('scroll', save); }; }, [vpUrl]);

    // Prompt on first access (and on later logins) until the face is registered.
    useEffect(() => {
        if (setup.face_needed && !readDismissed()) setShowFacePrompt(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dismissFace = () => {
        writeDismissed(true);
        setShowFacePrompt(false);
    };

    // Go to the Attendance page; FaceAttendance opens the registration by itself when it sees ?register=1.
    const openFace = () => {
        setShowFacePrompt(false);
        router.visit(route('volunteer.attendance', { register: 1 }));
    };

    const handleLogout = () => {
        writeDismissed(false);
        router.post(route('logout'));
    };

    // Opening the bell marks everything as read (only when the route exists on the backend).
    const toggleNotifications = () => {
        const opening = !showNotifications;
        setShowNotifications(opening);
        setShowUserMenu(false);
        if (opening) {
            setNewCount(unreadCount);
            const readUrl = safeRoute('volunteer.notifications.read-all', null);
            if (unreadCount > 0 && readUrl) {
                router.patch(readUrl, {}, { preserveScroll: true, preserveState: true, only: ['volunteerNotifications'] });
            }
        }
    };

    // A notification can carry its own link (e.g. to the activity or attendance record it's about).
    const handleNotificationClick = (n) => {
        setShowNotifications(false);
        const listUrl = safeRoute('volunteer.notifications', null); router.visit(listUrl || '/volunteer/notifications');
    };

    const navGroups = [
        {
            title: 'Menu',
            items: [
                { key: 'dashboard',     label: 'Dashboard',  href: route('volunteer.dashboard'),     icon: <DashIcon /> },
                { key: 'communication', label: 'Messages',   href: route('volunteer.communication'), icon: <MsgIcon /> },
            ],
        },
        {
            title: 'Attendance',
            items: [
                { key: 'schedule',      label: 'Schedule',   href: route('volunteer.schedule'),      icon: <CalIcon /> },
                { key: 'attendance',    label: 'Attendance', href: route('volunteer.attendance'),    icon: <ClockIcon /> },
            { key: 'dtr', label: 'DTR', href: route('volunteer.dtr'), icon: <RecordsIcon /> },
                { key: 'records',       label: 'My Records', href: safeRoute('volunteer.records'),   icon: <RecordsIcon /> },
            ],
        },
        {
            title: 'Profile',
            items: [
                { key: 'file201',       label: '201 File',   href: safeRoute('volunteer.file201'),   icon: <RecordsIcon /> },
            ],
        },
    ];

    const renderLink = (item) => {
        const isActive = item.key === active;
        return (
            <Link key={item.key} href={item.href} className={`nav-link${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined} onClick={() => setNavOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', textDecoration: 'none', borderRadius: '8px',
                marginBottom: '2px', fontSize: '12px',
                transition: 'background 0.15s',
                background: isActive ? '#CC0000' : 'transparent',
                color: isActive ? 'white' : '#555',
                fontWeight: isActive ? '600' : '500',
            }}>
                <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
            </Link>
        );
    };

    return (
        <ShellContext.Provider value={{ setup, openFace, showToast }}>
            <Head title={title} />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                :root { --rc-red: #B92F2F; }
                @keyframes rc-slide { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
                @keyframes rc-fade { from { opacity: 0; } to { opacity: 1; } }
                .vp-root .vp-main { animation: rc-slide 0.32s cubic-bezier(0.22, 0.8, 0.3, 1) backwards; }
                .vp-root .nav-link.active { animation: rc-fade 0.35s ease-out backwards; }
                .vp-root .vp-content { overflow-x: hidden; }
                @media (prefers-reduced-motion: reduce) { .vp-root .vp-main, .vp-root .nav-link.active { animation: none !important; } }
                body { background: var(--rc-red); }
                .vp-root { background: var(--rc-red) !important; }
                .vp-root .vp-sidebar { background: var(--rc-red) !important; border: 0 !important; box-shadow: none !important; }
                .vp-root .vp-sidebar svg { stroke-width: 1.5; }
                .vp-root .nav-link { color: rgba(255,255,255,0.9) !important; border-radius: 10px !important; }
                .vp-root .nav-link svg { width: 16px; height: 16px; }
                .vp-root .nav-link.active { background: #fff !important; color: var(--rc-red) !important; }
                .vp-root .nav-link:not(.active):hover { background: rgba(255,255,255,0.14) !important; color: #fff !important; }
                .vp-root .vp-sidebar nav > div { border-top-color: rgba(255,255,255,0.18) !important; }
                .vp-root .vp-sidebar nav > div > div:first-child { color: rgba(255,255,255,0.6) !important; }
                .vp-root .vp-sidebar .vp-desk-brand, .vp-root .vp-sidebar .vp-mobile-only { border-bottom-color: rgba(255,255,255,0.18) !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child { color: #fff !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:last-child, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:last-child { color: rgba(255,255,255,0.72) !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:first-child { background: #fff !important; border-radius: 50%; padding: 5px; }
                /* S2S-TAG: logo, name and tagline layout */
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:first-child { width: 40px !important; height: 40px !important; flex-shrink: 0 !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child { font-size: 15px !important; line-height: 1.1 !important; }
                .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child { font-size: 14px !important; line-height: 1.1 !important; }
                .vp-root .vp-sidebar .s2s-tag { color: rgba(255,255,255,0.88) !important; font-size: 9px !important; font-weight: 500 !important; letter-spacing: 0.02em !important; text-transform: none !important; white-space: nowrap !important; }
                /* S2S-WORDMARK2: logo slot + scan-bracket 2 */
                .vp-root .vp-sidebar .vp-desk-brand { gap: 8px !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:first-child { display: flex !important; width: 38px !important; height: 38px !important; flex-shrink: 0 !important; }
                .brand-chip > span:first-child { display: flex !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child { font-size: 16px !important; font-weight: 800 !important; letter-spacing: -0.02em !important; line-height: 1.15 !important; }
                .brand-chip > span:last-child > span:first-child { font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.02em !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child > span, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child > span { display: inline-block !important; padding: 0.06em 0.24em !important; margin: 0 0.06em !important; color: #ffffff !important; background: linear-gradient(#ffffff,#ffffff) 0 0/.32em 2px no-repeat, linear-gradient(#ffffff,#ffffff) 0 0/2px .32em no-repeat, linear-gradient(#ffffff,#ffffff) 100% 0/.32em 2px no-repeat, linear-gradient(#ffffff,#ffffff) 100% 0/2px .32em no-repeat, linear-gradient(#ffffff,#ffffff) 0 100%/.32em 2px no-repeat, linear-gradient(#ffffff,#ffffff) 0 100%/2px .32em no-repeat, linear-gradient(#ffffff,#ffffff) 100% 100%/.32em 2px no-repeat, linear-gradient(#ffffff,#ffffff) 100% 100%/2px .32em no-repeat !important; }
                .brand-chip > span:last-child > span:first-child > span { display: inline-block !important; padding: 0.06em 0.24em !important; margin: 0 0.06em !important; color: #dc2626 !important; background: linear-gradient(#dc2626,#dc2626) 0 0/.32em 2px no-repeat, linear-gradient(#dc2626,#dc2626) 0 0/2px .32em no-repeat, linear-gradient(#dc2626,#dc2626) 100% 0/.32em 2px no-repeat, linear-gradient(#dc2626,#dc2626) 100% 0/2px .32em no-repeat, linear-gradient(#dc2626,#dc2626) 0 100%/.32em 2px no-repeat, linear-gradient(#dc2626,#dc2626) 0 100%/2px .32em no-repeat, linear-gradient(#dc2626,#dc2626) 100% 100%/.32em 2px no-repeat, linear-gradient(#dc2626,#dc2626) 100% 100%/2px .32em no-repeat !important; }
                /* S2S-WORDMARK2-END */
                /* S2S-FIT: logo fills the white circle */
                /* S2S-WHITE: readable white brand name */
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child { color: #ffffff !important; font-weight: 800 !important; letter-spacing: 0.2px !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:first-child { padding: 3px !important; overflow: hidden !important; box-sizing: border-box !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child img, .vp-root .vp-sidebar .vp-mobile-only a > span:first-child img { width: 100% !important; height: 100% !important; max-width: none !important; object-fit: contain !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child > span, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child > span { color: #ffffff !important; }
                .vp-root .vp-content { position: absolute !important; top: 8px; right: 8px; bottom: 8px; left: 8px; margin: 0 !important; padding-top: 56px !important; min-height: 0 !important; overflow-y: auto; background: #fff; border-radius: 18px; }
                .vp-root .vp-header { top: 8px !important; left: 8px !important; right: 8px !important; height: 56px !important; background: #fff !important; border: 0 !important; box-shadow: none !important; border-radius: 18px 18px 0 0 !important; }
                @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
                    .vp-root .vp-sidebar { border-radius: 0 !important; }
                    .vp-root .vp-content { top: 10px; right: 10px; bottom: 10px; left: 200px; border-radius: 22px; }
                    .vp-root .nav-link.active { border-radius: 12px 0 0 12px !important; margin-right: -10px; position: relative; }
                    .vp-root .nav-link.active::before, .vp-root .nav-link.active::after { content: ''; position: absolute; right: 0; width: 14px; height: 14px; pointer-events: none; }
                    .vp-root .nav-link.active::before { top: -14px; background: radial-gradient(circle at 0 0, transparent 13.5px, #fff 14px); }
                    .vp-root .nav-link.active::after { bottom: -14px; background: radial-gradient(circle at 0 100%, transparent 13.5px, #fff 14px); }
                    .vp-root .vp-header { top: 10px !important; left: 200px !important; right: 10px !important; border-radius: 22px 22px 0 0 !important; }
                    .vp-root.sb-hidden .vp-content { left: 10px; }
                    .vp-root.sb-hidden .vp-header { left: 10px !important; border-radius: 22px 22px 0 0 !important; }
                }
                .nav-link:not(.active):hover { background: #f5f5f6 !important; color: #111 !important; }
                /* S2S-ORYNT-SIDEBAR: white sidebar (start) */
                body, .vp-root { background: #fff !important; }
                .vp-root .vp-sidebar { background: #f6f7f9 !important; border-right: 1px solid #eceef2 !important; }
                .vp-root .nav-link { color: #7a8090 !important; border-radius: 8px !important; font-weight: 500 !important; }
                .vp-root .nav-link.active { background: #B92F2F !important; color: #fff !important; font-weight: 500 !important; margin-right: 0 !important; border-radius: 8px !important; animation: none !important; }
                .vp-root .nav-link.active::before, .vp-root .nav-link.active::after { display: none !important; content: none !important; }
                .vp-root .nav-link:not(.active):hover { background: #eef0f3 !important; color: #15171c !important; }
                .vp-root .vp-sidebar nav > div { border-top-color: #eceef2 !important; }
                .vp-root .vp-sidebar nav > div > div:first-child { color: #a8adb9 !important; }
                .vp-root .vp-sidebar .vp-desk-brand, .vp-root .vp-sidebar .vp-mobile-only { border-bottom-color: #eceef2 !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:first-child { background: transparent !important; padding: 0 !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:last-child > span:first-child, .vp-root .vp-sidebar .vp-mobile-only a > span:last-child > span:first-child { color: #15171c !important; }
                .vp-root .vp-sidebar .s2s-tag { color: #7a8090 !important; }
                .vp-root .vp-sidebar img[src*="wordmark"] { filter: brightness(0) invert(47%) sepia(99%) saturate(391%) hue-rotate(311deg) brightness(66%) contrast(143%) !important; }
                .vp-root .vp-help-card { background: #fff !important; }
                .vp-root .vp-help-card a { background: #B92F2F !important; }
                .vp-root .vp-help-link { color: #7a8090 !important; }
                .vp-root .vp-help-link:hover { background: #eef0f3 !important; color: #15171c !important; }
                /* S2S-BRAND-RED */
                .vp-root .vp-sidebar .vp-desk-brand { background: #B92F2F !important; border-bottom: 0 !important; }
                .vp-root .vp-sidebar .vp-desk-brand > span:first-child { background: #fff !important; border-radius: 50% !important; padding: 3px !important; }
                .vp-root .vp-sidebar .vp-desk-brand img[src*="wordmark"] { filter: brightness(0) invert(1) !important; }
                .vp-root .vp-sidebar .vp-desk-brand { position: relative !important; }
                .vp-root .vp-sidebar .vp-desk-brand::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: 0; height: 1px; background: rgba(255,255,255,0.18); pointer-events: none; }
                /* S2S-RED-SIDEBAR */
                body, .vp-root { background: #B92F2F !important; }
                .vp-root .vp-sidebar { background: #B92F2F !important; border-right: 0 !important; }
                .vp-root .nav-link { color: rgba(255,255,255,0.9) !important; }
                .vp-root .nav-link.active { background: #fff !important; color: #7a4a4a !important; font-weight: 500 !important; }
                .vp-root .nav-link:not(.active):hover { background: rgba(255,255,255,0.14) !important; color: #fff !important; }
                .vp-root .vp-sidebar nav > div { border-top-color: rgba(255,255,255,0.18) !important; }
                .vp-root .vp-sidebar nav > div > div:first-child { color: rgba(255,255,255,0.6) !important; }
                .vp-root .vp-help-row { border-top-color: rgba(255,255,255,0.18) !important; }
                .vp-root .vp-help-link { color: rgba(255,255,255,0.9) !important; }
                .vp-root .vp-help-link:hover { background: rgba(255,255,255,0.14) !important; color: #fff !important; }
                .vp-root .vp-sidebar img[src*="wordmark"] { filter: brightness(0) invert(1) !important; }
                .vp-root .vp-sidebar .vp-mobile-only { border-bottom-color: rgba(255,255,255,0.18) !important; }
                .vp-root .vp-sidebar .vp-mobile-only a > span:first-child { background: #fff !important; border-radius: 50% !important; padding: 3px !important; }
                .vp-root .vp-sidebar .vp-mobile-only > span:nth-of-type(1) { background: #8F2222 !important; }
                .vp-root .vp-sidebar .vp-mobile-only > span:nth-of-type(2) > span:first-child { color: #fff !important; }
                .vp-root .vp-sidebar .vp-mobile-only > span:nth-of-type(2) > span:last-child { color: rgba(255,255,255,0.75) !important; }
                /* S2S-EXPAND-WHITE */
                @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
                    .vp-root .vp-content { top: 0 !important; right: 0 !important; bottom: 0 !important; border-radius: 22px 0 0 22px !important; }
                    .vp-root .vp-header { top: 0 !important; right: 0 !important; border-radius: 22px 0 0 0 !important; }
                    .vp-root.sb-hidden .vp-content { left: 0 !important; border-radius: 0 !important; }
                    .vp-root.sb-hidden .vp-header { left: 0 !important; border-radius: 0 !important; }
                }
                /* S2S-GRAY-CONTENT-START */
                .vp-root .vp-content { background: #F3F4F6 !important; }
                .vp-root .vp-header { background: #FFFFFF !important; border-bottom: 1px solid #E5E7EB !important; }
                /* S2S-GRAY-CONTENT-END */
                /* S2S-HEADER-PLAIN */
                /* S2S-HEADER-V2 */
                .vp-root .vp-hd-date { display: none !important; }
                @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
                    .vp-root .vp-page-title { display: flex !important; align-items: baseline; gap: 0; padding-left: 14px !important; }
                    .vp-root .vp-pt-main { font-size: 14px !important; font-weight: 500 !important; line-height: 1.2 !important; } /* S2S-TITLE-DOT */
                    .vp-root .vp-pt-main::after { content: ""; display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: #9CA3AF; margin: 0 10px; vertical-align: middle; }
                    .vp-root .vp-pt-date { display: block !important; margin-top: 0 !important; font-size: 12px !important; font-weight: 400 !important; color: #6B7280 !important; line-height: 1.2 !important; }
                    .vp-root .vp-pt-date b { color: #6B7280 !important; font-weight: 400 !important; }
                    .vp-root .vp-pt-date b::after { content: ","; }
                    .vp-root .vp-hd-right { gap: 14px !important; }
                    .vp-root .vp-hd-right .icon-btn[aria-label="Notifications"] { border: 0 !important; background: transparent !important; width: 34px !important; height: 34px !important; }
                    .vp-root .vp-hd-right .icon-btn[aria-label="Notifications"]:hover { background: #F3F4F6 !important; }
                    .vp-root .vp-hd-right .chip-btn { border: 0 !important; background: transparent !important; padding: 4px 6px 4px 4px !important; border-radius: 8px !important; }
                    .vp-root .vp-hd-right .chip-btn:hover { background: #F3F4F6 !important; }
                    .vp-root .vp-hd-right .vp-userinfo { max-width: 240px !important; }
                    .vp-root .vp-hd-right .vp-userinfo > span:first-child { font-size: 13px !important; font-weight: 500 !important; }
                }
                /* S2S-HEADER-PLAIN-END */
                /* S2S-ORYNT-SIDEBAR-END */
                .logout-btn:hover { background: #ffe3e3 !important; }
                .task-row:hover { background: #fafafa !important; }
                .notif-item:hover { background: #f9f9f9 !important; }
                .btn-view:hover { background: #aa0000 !important; }
                .icon-btn:hover, .chip-btn:hover { background: #f5f5f6 !important; }
                .brand-chip:hover { opacity: 0.8; }
                .menu-item:hover { background: #f7f7f8 !important; }
                .search-wrap:focus-within { border-color: #CC0000 !important; box-shadow: 0 0 0 3px rgba(204,0,0,0.1); }
                .vp-input:focus { border-color: #CC0000 !important; outline: none; box-shadow: 0 0 0 3px rgba(204,0,0,0.1); }
                button:focus-visible, a:focus-visible, [tabindex]:focus-visible { outline: 2px solid #1B5FD1; outline-offset: 2px; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

                /* Mobile drawer pieces are hidden on desktop */
                .vp-burger, .vp-backdrop, .vp-mobile-only { display: none; }

                @media (max-width: ${MOBILE_BREAKPOINT}px) {
                    .vp-burger { display: flex; }
                    .vp-mobile-only { display: flex; }
                    .vp-search, .vp-userinfo { display: none !important; }

                    .vp-sidebar {
                        top: 0 !important; bottom: 0 !important; left: 0 !important;
                        width: 264px !important; z-index: 260 !important;
                        border-radius: 0 16px 16px 0 !important;
                        transform: translateX(-105%); visibility: hidden;
                        transition: transform 0.2s ease, visibility 0s linear 0.2s;
                    }
                    .vp-sidebar.open {
                        transform: translateX(0); visibility: visible;
                        transition: transform 0.2s ease, visibility 0s;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
                    }
                    .vp-backdrop.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 250; }

                    .vp-content { margin-left: 0 !important; }
                    .vp-main { padding: 12px 16px 28px 16px !important; }
                }
                /* Phone only (600px and below): lighter header. Desktop is unchanged. */
                @media (max-width: 600px) {
                    .vp-brand-sub { display: none !important; }
                    .vp-brand-name { font-size: 13px !important; }
                    .brand-chip { gap: 6px !important; padding: 4px 4px 4px 2px !important; }
                    .vp-burger { border: none !important; width: 34px !important; }
                    .vp-hd-right { gap: 2px !important; }
                    .vp-hd-right .icon-btn[aria-label="Notifications"] { border: none !important; width: 34px !important; }
                    .vp-hd-right .chip-btn { position: relative; width: 34px; height: 34px; padding: 0 !important; gap: 0 !important; justify-content: center; border: none !important; background: transparent !important; border-radius: 50% !important; }
                    .vp-hd-right .vp-chev { position: absolute; right: -1px; bottom: -1px; width: 14px; height: 14px; background: #fff; border: 1px solid #ebebeb; border-radius: 50%; }
                }
                /* Phone only (600px and below): logo lives in the side menu, not the top bar. */
                .vp-dr-brand { display: none; }
                .vp-page-title { display: none; }
                @media (max-width: 600px) {
                    .brand-chip { display: none !important; }
                    .vp-dr-user { display: none !important; }
                    .vp-dr-brand { display: flex !important; align-items: center; gap: 10px; flex: 1; min-width: 0; text-decoration: none; }
                    .vp-page-title { display: block !important; font-size: 16px; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 46vw; padding-left: 2px; }
                }
                .vp-desk-brand { display: flex; align-items: center; gap: 10px; padding: 16px 14px 12px; border-bottom: 1px solid #f0f0f0; text-decoration: none; }
                @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
                    .brand-chip { display: none !important; }
                    .vp-page-title { display: block !important; font-size: 16px; font-weight: 600; color: #111; padding-left: 12px; }
                }
                @media (max-width: ${MOBILE_BREAKPOINT}px) {
                    .vp-desk-brand { display: none !important; }
                }
                @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
                    .vp-sidebar { top: 12px !important; }
                    header[style*="z-index: 150"] { left: 224px !important; }
                    .vp-desk-brand { height: 56px; padding: 0 14px !important; }
                }
                .vp-pt-main { display: block; font-size: 14px; font-weight: 600; color: #111; line-height: 1.2; }
                .vp-pt-date { display: block; font-size: 10px; color: #999; margin-top: 2px; line-height: 1.2; }
                .vp-pt-date b { color: #CC0000; font-weight: 600; }
                @media (max-width: 600px) { .vp-pt-date { display: none; } }
                /* layout v2: docked, rounded, collapsible sidebar */
                .vp-sb-toggle { /* sb-toggle v5 */ display: none; position: fixed; top: 16px; left: 188px; width: 24px; height: 24px; margin: 0; padding: 0; border: 1px solid #e4e4e7; border-radius: 50%; background: #fff; cursor: pointer; align-items: center; justify-content: center; z-index: 60; transition: left 0.2s ease, background 0.15s ease; }
                @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
                    .vp-sb-toggle { display: flex; } .vp-sb-toggle:hover { background: #f4f4f5; } .vp-header { z-index: 50 !important; } .vp-sidebar { z-index: 40 !important; } .sb-hidden .vp-sb-toggle { left: 8px; } .sb-hidden .vp-header { padding-left: 48px !important; }
                    .vp-sidebar { top: 0 !important; left: 0 !important; bottom: 0 !important; width: 200px !important; border: 1px solid #e4e4e7 !important; border-left-width: 0 !important; border-radius: 0 12px 12px 0 !important; box-shadow: none !important; transition: transform 0.2s ease !important; }
                    .vp-header { top: 0 !important; left: 212px !important; right: 0 !important; height: 56px !important; border: 1px solid #e4e4e7 !important; border-top-width: 0 !important; border-right-width: 0 !important; border-radius: 0 0 0 12px !important; box-shadow: none !important; transition: left 0.2s ease !important; }
                    .vp-desk-brand { height: 56px; padding: 0 14px !important; border-bottom-color: #e4e4e7 !important; }
                    .vp-content { margin-left: 212px !important; padding-top: 56px !important; transition: margin-left 0.2s ease !important; }
                    .vp-main { padding: 16px 20px 28px 20px !important; }
                    .sb-hidden .vp-sidebar { transform: translateX(-105%); visibility: hidden; transition: transform 0.2s ease, visibility 0s linear 0.2s !important; }
                    .sb-hidden .vp-header { left: 0 !important; border-left-width: 0 !important; border-radius: 0 !important; }
                    .sb-hidden .vp-content { margin-left: 0 !important; }
                    .sb-hidden .brand-chip { display: flex !important; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .vp-sidebar, .vp-sidebar.open { transition: none !important; }
                }
            `}</style>

            <div className={sbHidden ? 'vp-root sb-hidden' : 'vp-root'} style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f7f7f8' }}>

                {/* NAVBAR */}
                <header className="vp-header" style={{
                    position: 'fixed', top: '12px', left: '16px', right: '16px', height: '56px', zIndex: 150,
                    background: 'white', border: '1px solid #ebebeb', borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                        {/* Hamburger (mobile only) */}
                        <button type="button" className="icon-btn vp-sb-toggle" aria-label={sbHidden ? 'Show sidebar' : 'Hide sidebar'} aria-pressed={sbHidden} title={sbHidden ? 'Show sidebar' : 'Hide sidebar'} onClick={toggleSidebar}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points={sbHidden ? '9 6 15 12 9 18' : '15 6 9 12 15 18'} /></svg>
                        </button>
                        <button type="button" className="icon-btn vp-burger" aria-label="Open menu" aria-controls="vp-sidebar" aria-expanded={navOpen} onClick={() => setNavOpen(true)} style={{
                            width: '38px', height: '38px', borderRadius: '50%', background: 'white',
                            border: '1px solid #ebebeb', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                        </button>

                        {/* Brand */}
                        <Link href={route('volunteer.dashboard')} className="brand-chip" aria-label="Scan2Serve — go to dashboard" style={{
                            display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none',
                            padding: '4px 8px 4px 4px', borderRadius: '12px',
                        }}>
                            <span style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {LOGO_SRC && !logoFailed
                                    ? <img src={LOGO_SRC} alt="" onError={() => setLogoFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : <RedCrossMark />}
                            </span>
                            <span style={{ lineHeight: 1.2 }}>
                                <span className="vp-brand-name" style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#111' }}>Scan<span style={{ color: '#dc2626' }}>2</span>Serve</span>
                            </span>
                        </Link>
                        {/* Page title (phone only) */}
                        {title && (
                            <span className="vp-page-title">
                                <span className="vp-pt-main">{title}</span>
                                <span className="vp-pt-date"><b>{todayParts().weekday}</b>&nbsp; {todayParts().date}</span>
                            </span>
                        )}
                    </div>

                    {/* Search, notifications, user */}
                    <div className="vp-hd-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="vp-hd-date">{todayParts().weekday}, {todayParts().date}</span>
                        {/* Notifications */}
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button className="icon-btn" aria-label="Notifications" aria-expanded={showNotifications} onClick={toggleNotifications} style={{
                                width: '38px', height: '38px', borderRadius: '50%', background: showNotifications ? '#f5f5f6' : 'white',
                                border: '1px solid #ebebeb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                            }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                {unreadCount > 0 && (
                                    <span style={{ position: 'absolute', top: '8px', right: '9px', width: '7px', height: '7px', borderRadius: '50%', background: '#CC0000', border: '1.5px solid white' }} />
                                )}
                            </button>

                            {showNotifications && <NotifDropdown items={bellItems} newCount={newCount} onItemClick={handleNotificationClick} onClose={() => setShowNotifications(false)} viewAllHref={safeRoute('volunteer.notifications', '#')} />}
                        </div>

                        {/* User */}
                        <div ref={userRef} style={{ position: 'relative' }}>
                            <button className="chip-btn" aria-haspopup="menu" aria-expanded={showUserMenu} onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} style={{
                                display: 'flex', alignItems: 'center', gap: '9px', padding: '4px 10px 4px 5px', borderRadius: '12px',
                                border: '1px solid #ebebeb', background: showUserMenu ? '#f5f5f6' : 'white', cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                                    {volunteer?.photo ? <img src={'/storage/' + volunteer.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : volunteer?.name?.charAt(0).toUpperCase()}
                                </span>
                                <span className="vp-userinfo" style={{ textAlign: 'left', lineHeight: 1.2, maxWidth: '130px' }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.name}</span>
                                    <span style={{ display: 'block', fontSize: '10px', color: '#999' }}>Volunteer</span>
                                </span>
                                <svg className="vp-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>

                            {showUserMenu && (
                                <div role="menu" style={{ position: 'absolute', right: 0, top: '48px', width: '210px', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200, overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.name}</div>
                                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.email}</div>
                                    </div>
                                    <Link role="menuitem" href={safeRoute('volunteer.profile')} className="menu-item" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', fontSize: '12px', color: '#333', textDecoration: 'none' }}>
                                        <UserIcon /> My Profile
                                    </Link>
                                    <button role="menuitem" className="menu-item" onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', fontSize: '12px', color: '#CC0000', background: 'white', border: 'none', borderTop: '1px solid #f0f0f0', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                                        <LogoutIcon />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* SIDEBAR BACKDROP (mobile only) */}
                <div className={`vp-backdrop${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />

                {/* SIDEBAR */}
                <aside id="vp-sidebar" className={`vp-sidebar${navOpen ? ' open' : ''}`} style={{
                    width: '196px', position: 'fixed', left: '16px', top: '80px', bottom: '16px', zIndex: 100,
                    background: 'white', border: '1px solid #ebebeb', borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    {/* Signed-in user + close button (mobile drawer only) */}
                    <div className="vp-mobile-only" style={{ alignItems: 'center', gap: '10px', padding: '16px 14px 12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Link href={route('volunteer.dashboard')} className="vp-dr-brand" onClick={() => setNavOpen(false)} aria-label="Scan2Serve, go to dashboard">
                            <span style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {LOGO_SRC && !logoFailed
                                    ? <img src={LOGO_SRC} alt="" onError={() => setLogoFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : <RedCrossMark />}
                            </span>
                            <img src="/scan2serve-wordmark.png" alt="Scan2Serve Muntinlupa Branch" style={{ height: "36px", width: "auto", display: "block", alignSelf: "center", position: "relative", top: "-0.5px", marginLeft: "-4px" }} />
                        </Link>
                        <span className="vp-dr-user" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#CC0000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
                            {volunteer?.photo ? <img src={'/storage/' + volunteer.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : volunteer?.name?.charAt(0).toUpperCase()}
                        </span>
                        <span className="vp-dr-user" style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                            <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.name}</span>
                            <span style={{ display: 'block', fontSize: '10px', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.email}</span>
                        </span>
                        <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setNavOpen(false)} style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid #ebebeb',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    <Link href={route('volunteer.dashboard')} className="vp-desk-brand" aria-label="Scan2Serve, go to dashboard">
                        <span style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {LOGO_SRC && !logoFailed
                                ? <img src={LOGO_SRC} alt="" onError={() => setLogoFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                : <RedCrossMark />}
                        </span>
                        <img src="/scan2serve-wordmark.png" alt="Scan2Serve Muntinlupa Branch" style={{ height: "36px", width: "auto", display: "block", alignSelf: "center", position: "relative", top: "-0.5px", marginLeft: "-4px" }} />
                    </Link>
                    <nav aria-label="Volunteer portal" style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px' }}>
                        {navGroups.map((group, gi) => (
                            <div key={group.title} style={{ marginBottom: '12px', ...(gi > 0 ? { borderTop: '1px solid #f3f3f3', paddingTop: '12px' } : {}) }}>
                                <div style={{ fontSize: '10.5px', fontWeight: '500', color: '#aaa', padding: '0 12px', marginBottom: '6px' }}>{group.title}</div>
                                {group.items.map(renderLink)}
                            </div>
                        ))}
                    </nav>
          <div className="vp-help-row" style={{ padding: '10px 10px 12px', borderTop: '1px solid #eceef2' }}>
              <Link href={route('volunteer.communication')} onClick={() => setNavOpen(false)} className="vp-help-link" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5" /><line x1="12" y1="17.5" x2="12" y2="17.51" /></svg>
                <span style={{ flex: 1 }}>Help and support</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18" /></svg>
              </Link>
            </div>

                </aside>

                {/* CONTENT */}
                <div className="vp-content" style={{ marginLeft: '228px', paddingTop: '80px', minHeight: '100vh', minWidth: 0 }}>
                    <main className="vp-main" style={{ padding: '12px 16px 28px 0' }}>
                        {children}
                    </main>
                </div>
            </div>

            {toast && (
                <div role="status" style={{ position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', background: '#1f2a24', color: 'white', padding: '11px 20px', borderRadius: '10px', fontSize: '12px', zIndex: 400, maxWidth: 'calc(100% - 32px)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontFamily: "'Inter', sans-serif" }}>
                    {toast}
                </div>
            )}

            {showFacePrompt && <FacePrompt rejected={faceStatus === 'rejected'} onRegister={openFace} onLater={dismissFace} />}
        </ShellContext.Provider>
    );
}

/* ------------------------------ Face registration prompt ------------------------------ */

function FacePrompt({ rejected, onRegister, onLater }) {
    const dialogRef = useRef(null);

    useEffect(() => { dialogRef.current?.focus(); }, []);
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onLater(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onLater]);

    return (
        <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: '16px', zIndex: 300, overflowY: 'auto', fontFamily: "'Inter', sans-serif" }}>
            <div role="dialog" aria-modal="true" aria-labelledby="face-title" tabIndex={-1} ref={dialogRef} style={{ background: 'white', borderRadius: '14px', padding: '30px 28px 24px', width: '100%', maxWidth: '440px', textAlign: 'center', outline: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                <div style={{ width: '52px', height: '52px', color: '#111', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                </div>
                <h2 id="face-title" style={{ fontSize: '17px', fontWeight: '600', color: '#111', marginBottom: '10px' }}>
                    {rejected ? 'Please register your face again' : 'Welcome to the Volunteer Portal!'}
                </h2>
                <p style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.65 }}>
                    {rejected
                        ? 'Your face registration was not approved. Register again to use the biometric attendance system.'
                        : 'Since this is your first time accessing the portal, you need to register your face to use the biometric attendance system.'}
                </p>
                <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, marginTop: '12px' }}>
                    It takes about a minute. You need a camera and good lighting. You must register your face before you can use Time In and Time Out.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '22px' }}>
                    <button type="button" onClick={onRegister} style={btnPrimary}>Register My Face</button>
                    <button type="button" onClick={onLater} style={btnGhost}>Later</button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ Icons ------------------------------ */

// Official chapter logo. Put the image file in your `public` folder (for example public/images/redcross-logo.png)
// and set its path here. While this is null, a Red Cross emblem drawn in SVG is shown instead.
const LOGO_SRC = '/images/finallogo.png';

function RedCrossMark() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill="#CC0000" />
        </svg>
    );
}

// Small color-coded icon for a notification's category. Falls back to a neutral
// document icon when a notification doesn't carry a category yet.
function NotifCategoryIcon({ category }) {
    const bg = { activity: '#fdeaea', attendance: '#e9f8ee', system: '#f1ebfb' }[category] ?? '#f5f5f5';
    const stroke = { activity: '#CC0000', attendance: '#1a8a3d', system: '#8a5cd6' }[category] ?? '#888';
    return (
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {category === 'attendance' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            ) : category === 'system' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
            ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            )}
        </div>
    );
}

function DashIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function CalIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MsgIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function ClockIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function RecordsIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="14" y2="15"/></svg>;
}
function DocIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function UserIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function CameraIcon() {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>;
}

// NotifDropdown v2
function NotifDropdown({ items, newCount, onItemClick, onClose, viewAllHref }) {
  const [tab, setTab] = useState('all');
  const all = Array.isArray(items) ? items : [];
  const list = all.filter((n) => tab === 'all' || n.read === false);
  const fresh = list.filter((n) => n.read === false);
  const earlier = list.filter((n) => n.read !== false);
  const kind = (n) => {
    const t = String(n.title || '').toLowerCase();
    if (t.startsWith('timed out')) return 'out';
    if (t.startsWith('timed in')) return 'in';
    return 'other';
  };
  const BADGE = {
    in: { bg: '#2E9E6B', icon: (<g><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></g>) },
    out: { bg: '#B92F2F', icon: (<g><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></g>) },
    other: { bg: '#6b7280', icon: (<g><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></g>) },
  };
  const row = (n, i) => {
    const b = BADGE[kind(n)];
    const unread = n.read === false;
    return (
      <button key={n.id ?? i} type="button" className="notif-item" onClick={() => onItemClick(n)}
        style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit' }}>
        <span style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0, display: 'block' }}>
          <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
            <img src="/images/redcross_logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px', boxSizing: 'border-box' }} />
          </span>
          <span style={{ position: 'absolute', right: '-3px', bottom: '-3px', width: '18px', height: '18px', borderRadius: '50%', background: b.bg, border: '1.5px solid #fff', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{b.icon}</svg>
          </span>
        </span>
        <span style={{ minWidth: 0, flex: 1, display: 'block' }}>
          <span style={{ display: 'block', fontSize: '12px', lineHeight: 1.3, fontWeight: unread ? 600 : 400, color: unread ? '#111' : '#666' }}>{n.title}</span>
          {n.body && <span title={n.body} style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</span>}
          <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', color: unread ? '#B92F2F' : '#aaa', fontWeight: unread ? 600 : 400 }}>{n.time}</span>
        </span>
        {unread && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B92F2F', flexShrink: 0 }} />}
      </button>
    );
  };
  const head = (label) => (
    <div style={{ padding: '8px 10px 2px', fontSize: '12px', fontWeight: 600, color: '#111' }}>{label}</div>
  );
  const tabBtn = (key, label, count) => (
    <button type="button" onClick={() => setTab(key)}
      style={{ cursor: 'pointer', fontFamily: 'inherit', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', background: tab === key ? '#F3F4F6' : 'transparent', border: '1px solid transparent', color: tab === key ? '#111827' : '#888', fontWeight: tab === key ? 600 : 400 }}>
      {label}{count > 0 ? <span style={{ marginLeft: '5px', background: '#B92F2F', color: '#fff', borderRadius: '999px', padding: '0 6px', fontSize: '10px' }}>{count}</span> : null}
    </button>
  );
  return (
    <div style={{ position: 'absolute', right: 0, top: '46px', width: '320px', maxWidth: 'calc(100vw - 32px)', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 6px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>Notifications</span>
      </div>
      <div style={{ padding: '0 10px 8px', display: 'flex', gap: '4px' }}>
        {tabBtn('all', 'All', 0)}
        {tabBtn('unread', 'Unread', newCount || 0)}
      </div>
      <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0 4px 6px', borderTop: '1px solid #f0f0f0' }}>
        {list.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: '#bbb', fontSize: '12px' }}>{tab === 'unread' ? "You're all caught up" : 'No notifications'}</div>
        ) : (
          <>
            {fresh.length > 0 && head('New')}
            {fresh.map(row)}
            {earlier.length > 0 && head('Earlier')}
            {earlier.map(row)}
          </>
        )}
      </div>
      <div style={{ padding: '10px 18px', borderTop: '1px solid #f5f5f5', textAlign: 'center' }}>
        <Link href={viewAllHref} onClick={onClose} style={{ fontSize: '10.5px', color: '#333', fontWeight: 400, textDecoration: 'none' }}>View All</Link>
      </div>
    </div>
  );
}
