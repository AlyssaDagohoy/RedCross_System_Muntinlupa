import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/* AdminShell: sidebar + topbar for every admin page. Mirrors VolunteerShell. */

const MOBILE_BREAKPOINT = 900;
const LOGO_SRC = '/images/finallogo.png';

const todayParts = () => {
    const d = new Date();
    return {
        weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    };
};
export default function AdminShell({ active, title, children }) {
    const { auth, isAdminUser, isSuperAdmin, profileSetupRequired, adminProfile, staffList = [], profilePinned = [], staffPhotos = {} } = usePage().props;
    const admin = auth?.user; const needPick = false; const [pinFor, setPinFor] = useState(null); const [addOpen, setAddOpen] = useState(false); const [manageOpen, setManageOpen] = useState(false); useEffect(() => { /* pickerBackLogout */ if (!needPick) return; window.history.pushState({ pickerGuard: true }, "", window.location.href); const onBack = (e) => { e.stopImmediatePropagation(); const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || ''); fetch(route('logout'), { method: 'POST', credentials: 'same-origin', headers: { 'X-XSRF-TOKEN': xsrf, 'X-Requested-With': 'XMLHttpRequest' } }).finally(() => window.location.replace('/login')); }; window.addEventListener('popstate', onBack, true); return () => window.removeEventListener('popstate', onBack, true); }, [needPick]);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [sbHidden, setSbHidden] = useState(() => { try { return localStorage.getItem('vp_sidebar_hidden') === '1'; } catch { return false; } });
    const toggleSidebar = () => {
        const next = !sbHidden;
        setSbHidden(next);
        try { localStorage.setItem('vp_sidebar_hidden', next ? '1' : '0'); } catch { /* ignore */ }
    };
    const [logoFailed, setLogoFailed] = useState(false);
    const userRef = useRef(null);

    useEffect(() => {
        const onDown = (e) => {
            if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') { setShowUserMenu(false); setNavOpen(false); }
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

    useEffect(() => {
        if (!navOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [navOpen]);

    const handleLogout = () => router.post(route('logout'), {}, { replace: true });

    const items = [
        { key: 'dashboard',       label: 'Dashboard',     href: route('admin.dashboard'),             icon: <DashIcon /> },
        { key: 'volunteers',      label: 'Volunteers',    href: route('admin.volunteers'),            icon: <PeopleIcon /> },
        { key: 'activities',      label: 'Activities',    href: route('admin.activities.index'),      icon: <CalIcon /> },
        { key: 'attendance',      label: 'Attendance',    href: route('admin.attendance.index'),      icon: <ClockIcon /> },
        { key: 'document-review', label: 'Documents',     href: route('admin.document-review.index'), icon: <DocIcon /> },
        { key: 'communication',   label: 'Communication', href: route('admin.communication'),         icon: <MsgIcon /> },
    ];

    const itemByKey = (k) => items.find(i => i.key === k);
    const navGroups = [
        { title: 'Menu',       items: ['dashboard', 'communication'].map(itemByKey) },
        { title: 'Management', items: ['volunteers', 'activities'].map(itemByKey) },
        { title: 'Records',    items: ['attendance', 'document-review'].map(itemByKey) },
    ];

    const renderLink = (item) => {
        const isActive = item.key === active;
        return (
            <Link key={item.key} href={item.href} className={`nav-link${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined} onClick={() => setNavOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', textDecoration: 'none', borderRadius: '8px',
                marginBottom: '2px', fontSize: '12px', transition: 'background 0.15s',
                background: isActive ? '#CC0000' : 'transparent',
                color: isActive ? 'white' : '#555',
                fontWeight: isActive ? '600' : '500',
            }}>
                <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
            </Link>
        );
    };

    const Logo = () => (
        <span style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {!logoFailed
                ? <img src={LOGO_SRC} alt="" onError={() => setLogoFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill="#CC0000" /></svg>}
        </span>
    );

    return (
        <>
            <Head title={title ? `${title} - Admin` : 'Admin'} />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
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
                .icon-btn:hover, .chip-btn:hover { background: #f5f5f6 !important; }
                .brand-chip:hover { opacity: 0.8; }
                .menu-item:hover { background: #f7f7f8 !important; }
                button:focus-visible, a:focus-visible, [tabindex]:focus-visible { outline: 2px solid #1B5FD1; outline-offset: 2px; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

                .vp-burger, .vp-backdrop, .vp-mobile-only { display: none; }

                @media (max-width: ${MOBILE_BREAKPOINT}px) {
                    .vp-burger { display: flex; }
                    .vp-mobile-only { display: flex; }
                    .vp-userinfo { display: none !important; }
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
                @media (max-width: 600px) {
                    .vp-brand-sub { display: none !important; }
                    .brand-chip { display: none !important; }
                    .vp-page-title { display: block !important; }
                }
                .vp-page-title { display: none; }
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

                {/* HEADER */}
                <header className="vp-header" style={{
                    position: 'fixed', top: '12px', left: '16px', right: '16px', height: '56px', zIndex: 150,
                    background: 'white', border: '1px solid #ebebeb', borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                        <button type="button" className="icon-btn vp-sb-toggle" aria-label={sbHidden ? 'Show sidebar' : 'Hide sidebar'} aria-pressed={sbHidden} title={sbHidden ? 'Show sidebar' : 'Hide sidebar'} onClick={toggleSidebar}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points={sbHidden ? '9 6 15 12 9 18' : '15 6 9 12 15 18'} /></svg>
                        </button>
                        <button type="button" className="icon-btn vp-burger" aria-label="Open menu" aria-controls="vp-sidebar" aria-expanded={navOpen} onClick={() => setNavOpen(true)} style={{
                            width: '38px', height: '38px', borderRadius: '50%', background: 'white',
                            border: '1px solid #ebebeb', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                        </button>
                        <Link href={route('admin.dashboard')} className="brand-chip" aria-label="Scan2Serve, go to dashboard" style={{
                            display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', padding: '4px 8px 4px 4px', borderRadius: '12px',
                        }}>
                            <Logo />
                            <span style={{ lineHeight: 1.2 }}>
                                <span style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#111' }}>Scan<span style={{ color: '#dc2626' }}>2</span>Serve</span>
                            </span>
                        </Link>
                        {title && (
                            <span className="vp-page-title">
                                <span className="vp-pt-main">{title}</span>
                                <span className="vp-pt-date"><b>{todayParts().weekday}</b>&nbsp; {todayParts().date}</span>
                            </span>
                        )}
                    </div>

                    <div className="vp-hd-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" className="icon-btn" aria-label="Notifications" title="No new notifications" style={{
                            width: '38px', height: '38px', borderRadius: '50%', background: 'white',
                            border: '1px solid #ebebeb', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </button>
                        <div ref={userRef} style={{ position: 'relative' }}>
                            <button className="chip-btn" aria-haspopup="menu" aria-expanded={showUserMenu} onClick={() => setShowUserMenu(!showUserMenu)} style={{
                                display: 'flex', alignItems: 'center', gap: '9px', padding: '4px 10px 4px 5px', borderRadius: '12px',
                                border: '1px solid #ebebeb', background: showUserMenu ? '#f5f5f6' : 'white', cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                                    {staffPhotos[adminProfile] ? <img src={`/storage/${staffPhotos[adminProfile]}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : (adminProfile || admin?.name || 'A').charAt(0).toUpperCase()}
                                </span>
                                <span className="vp-userinfo" style={{ textAlign: 'left', lineHeight: 1.2, maxWidth: '130px' }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminProfile || admin?.name}</span>
                                    <span style={{ display: 'block', fontSize: '10px', color: '#999' }}>Administrator</span>
                                </span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>

                            {showUserMenu && (
                                <div role="menu" style={{ position: 'absolute', right: 0, top: '48px', width: '210px', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200, overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminProfile || admin?.name}</div>
                                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.email}</div>
                                    </div>
                                    {isSuperAdmin && (<div style={{ borderBottom: '1px solid #f0f0f0', padding: '6px 0' }}><div style={{ padding: '4px 14px', fontSize: '10px', color: '#999' }}>Admin tools</div>{[].map((s, i) => (<button key={s} role="menuitem" className="menu-item" onClick={() => { setShowUserMenu(false); if (s !== adminProfile) setPinFor(s); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px', fontSize: '12px', color: '#333', background: s === adminProfile ? '#f5f5f6' : 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}><span style={{ width: '22px', height: '22px', borderRadius: '50%', background: ['#CC0000', '#1d6fb8', '#2e8b57', '#8a5cc2'][i % 4], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>{staffPhotos[s] ? <img src={`/storage/${staffPhotos[s]}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : s.charAt(0).toUpperCase()}</span><span style={{ flex: 1 }}>{s}</span>{s === adminProfile && <span style={{ color: '#2e8b57', fontSize: '12px' }}>{'\u2713'}</span>}</button>))}<button type="button" role="menuitem" className="menu-item" onClick={() => { setShowUserMenu(false); setAddOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px', fontSize: '12px', color: '#CC0000', background: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>+ Add admin</button><button type="button" role="menuitem" className="menu-item" onClick={() => { setShowUserMenu(false); setManageOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px', fontSize: '12px', color: '#333', background: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>Manage admins</button></div>)}<Link role="menuitem" href={route('admin.profile')} className="menu-item" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', fontSize: '12px', color: '#333', textDecoration: 'none' }}>
                                        <UserIcon /> My Profile
                                    </Link>
                                    <button role="menuitem" className="menu-item" onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', fontSize: '12px', color: '#CC0000', background: 'white', border: 'none', borderTop: '1px solid #f0f0f0', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                                        <LogoutIcon /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className={`vp-backdrop${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />

                {needPick && (<ProfilePicker staffList={staffList} staffPhotos={staffPhotos} logo={LOGO_SRC} onPick={setPinFor} onAdd={() => setAddOpen(true)} />)}{profileSetupRequired && (<div role="status" style={{ position: 'fixed', left: '50%', bottom: '20px', transform: 'translateX(-50%)', zIndex: 1000, background: '#fff', border: '1px solid #f3c4c4', borderLeft: '4px solid #b92f2f', borderRadius: '10px', padding: '10px 16px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', fontSize: '12px', color: '#333', maxWidth: '340px', textAlign: 'left' }}><strong style={{ display: 'block', color: '#b92f2f', marginBottom: '2px' }}>Complete your profile</strong>Add your title, phone number and photo, then press Save to continue.</div>)}{manageOpen && (<ManageAdmins onClose={() => setManageOpen(false)} />)}{addOpen && (<AddAdminGate onClose={() => setAddOpen(false)} />)}{pinFor && (<PinGate key={pinFor} name={pinFor} hasPin={profilePinned.includes(pinFor)} color={['#CC0000', '#1d6fb8', '#2e8b57', '#8a5cc2'][Math.max(0, staffList.indexOf(pinFor)) % 4]} onClose={() => setPinFor(null)} />)}{/* SIDEBAR */}
                <aside id="vp-sidebar" className={`vp-sidebar${navOpen ? ' open' : ''}`} style={{
                    width: '196px', position: 'fixed', left: '16px', top: '80px', bottom: '16px', zIndex: 100,
                    background: 'white', border: '1px solid #ebebeb', borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    <div className="vp-mobile-only" style={{ alignItems: 'center', gap: '10px', padding: '16px 14px 12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Link href={route('admin.dashboard')} onClick={() => setNavOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, textDecoration: 'none' }}>
                            <Logo />
                            <img src="/scan2serve-wordmark.png" alt="Scan2Serve Muntinlupa Branch" style={{ height: "36px", width: "auto", display: "block", alignSelf: "center", position: "relative", top: "-0.5px", marginLeft: "-4px" }} />
                        </Link>
                        <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setNavOpen(false)} style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid #ebebeb',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <Link href={route('admin.dashboard')} className="vp-desk-brand" aria-label="Scan2Serve, go to dashboard">
                        <Logo />
                        <img src="/scan2serve-wordmark.png" alt="Scan2Serve Muntinlupa Branch" style={{ height: "36px", width: "auto", display: "block", alignSelf: "center", position: "relative", top: "-0.5px", marginLeft: "-4px" }} />
                    </Link>
                    <nav aria-label="Admin portal" style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px' }}>
                        {navGroups.map((group, gi) => (
                            <div key={group.title} style={{ marginBottom: '12px', ...(gi > 0 ? { borderTop: '1px solid #f3f3f3', paddingTop: '12px' } : {}) }}>
                                <div style={{ fontSize: '10.5px', fontWeight: '500', color: '#aaa', padding: '0 12px', marginBottom: '6px' }}>{group.title}</div>
                                {group.items.map(renderLink)}
                            </div>
                        ))}
                    </nav>
                    <div className="vp-help-row" style={{ padding: '10px 10px 12px', borderTop: '1px solid #eceef2' }}>
                        <Link href={route('admin.communication')} onClick={() => setNavOpen(false)} className="vp-help-link" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
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
        </>
    );
}

const svg = (children) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
function DashIcon() { return svg(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>); }
function PeopleIcon() { return svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>); }
function CalIcon() { return svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>); }
function ClockIcon() { return svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>); }
function DocIcon() { return svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>); }
function MsgIcon() { return svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>); }
function UserIcon() { return svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>); }
function LogoutIcon() { return svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>); }

function ProfilePicker({ staffList, staffPhotos, logo, onPick, onAdd }) {
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);
    const colors = ['#CC0000', '#1d6fb8', '#2e8b57', '#8a5cc2'];
    const KEY = 's2s_last_profile';
    const { staffActive = {} } = usePage().props;
    const photos = staffPhotos || {};
    const hasActivity = Object.keys(staffActive).length > 0;
    const [last] = useState(() => {
        try { const v = window.localStorage.getItem(KEY); return v && staffList.includes(v) ? v : null; } catch { return null; }
    });
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    const colorOf = (s) => colors[Math.max(0, staffList.indexOf(s)) % 4];
    const face = (s) => (photos[s]
        ? <img src={`/storage/${photos[s]}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
        : s.charAt(0).toUpperCase());
    const pick = (s) => {
        try { window.localStorage.setItem(KEY, s); } catch { /* ignore */ }
        onPick(s);
    };

    const ts = (s) => Date.parse(staffActive[s]) || 0;
    const ago = (s) => {
        if (!ts(s)) return { text: 'Not active yet', live: false };
        const mins = Math.max(0, Math.floor((now.getTime() - ts(s)) / 60000));
        if (mins < 5) return { text: 'Active now', live: true };
        if (mins < 60) return { text: `${mins} minutes ago`, live: false };
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return { text: hrs === 1 ? '1 hour ago' : `${hrs} hours ago`, live: false };
        const days = Math.floor(hrs / 24);
        if (days === 1) return { text: 'Yesterday', live: false };
        if (days < 7) return { text: `${days} days ago`, live: false };
        const weeks = Math.floor(days / 7);
        if (weeks === 1) return { text: 'Last week', live: false };
        if (days < 30) return { text: `${weeks} weeks ago`, live: false };
        const months = Math.floor(days / 30);
        if (months === 1) return { text: 'Last month', live: false };
        if (months < 12) return { text: `${months} months ago`, live: false };
        return { text: 'Over a year ago', live: false };
    };

    const q = query.trim().toLowerCase();
    const hit = (s) => !q || String(s).toLowerCase().includes(q);
    const others = staffList.filter((s) => s !== last && hit(s));
    if (hasActivity) others.sort((a, b) => ts(b) - ts(a));
    const onlineN = hasActivity ? staffList.filter((s) => { const a = ago(s); return a && a.live; }).length : 0;
    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const el = e.target;
            if (el === searchRef.current) { if (e.key === 'Escape') { setQuery(''); el.blur(); } return; }
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
            if (e.key === '/') { e.preventDefault(); if (searchRef.current) searchRef.current.focus(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const row = (s) => {
        const a = hasActivity ? ago(s) : null;
        return (
            <button key={s} type="button" className="wp-fr" onClick={() => pick(s)}>
                <span className="wp-fa" style={{ background: colorOf(s) }}>{face(s)}{a && <span className={'wp-dot' + (a.live ? '' : ' off')} />}</span>
                <span className="wp-fn"><b>{s}</b>{a && <span className={a.live ? 'wp-on' : ''}>{a.text}</span>}</span>
                {s === last ? <span className="wp-cont">Continue</span> : <span className="wp-fc">{'\u203A'}</span>}
            </button>
        );
    };

    return (
        <div data-picker="welcome" role="dialog" aria-label="Choose profile" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#b92f2f', display: 'flex', flexDirection: 'column', overflow: 'auto', fontFamily: 'inherit' }}>
            <style>{`
.wp-bd{flex:1;display:flex;align-items:center;justify-content:center;padding:64px 16px 24px}
.wp-card{width:100%;max-width:360px;background:#fff;border-radius:20px;padding:24px 20px 14px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.wp-t{font-size:17px;font-weight:500;color:#111;text-align:center;margin:0}
.wp-s{font-size:12px;color:#777;text-align:center;margin:2px 0 12px}
.wp-lb{font-size:10px;color:#888;letter-spacing:.05em;text-transform:uppercase;margin:0 0 2px 6px}
.wp-lb.gap{margin-top:10px}
.wp-fl{border-top:1px solid #eee}
.wp-list{max-height:34vh;overflow:auto}
button.wp-fr{width:100%;display:flex;align-items:center;gap:10px;padding:8px 6px;border:none;border-bottom:1px solid #eee;background:#fff;text-align:left;cursor:pointer;font-family:inherit;color:#111;transition:background .15s ease}
button.wp-fr:hover,button.wp-fr:focus-visible{background:#f3f4f6 !important;color:#111 !important;outline:none}
.wp-fa{position:relative;flex:none;width:34px;height:34px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500}
.wp-dot{position:absolute;right:-1px;bottom:-1px;width:9px;height:9px;border-radius:50%;background:#16a34a;border:2px solid #fff}
.wp-fn{flex:1;min-width:0;display:flex;flex-direction:column}
.wp-fn b{font-size:13px;font-weight:500;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wp-fn span{font-size:11px;color:#6b7280}
.wp-fn span.wp-on{color:#15803d}
.wp-fc{font-size:20px;line-height:1;color:#9ca3af}
.wp-pl{width:34px;height:34px;border-radius:50%;border:1.5px dashed #bbb;display:flex;align-items:center;justify-content:center;font-size:16px;color:#777;flex:none}
@media (max-width:1024px){.wp-card{max-width:440px;padding:28px 28px 16px}}
.wp-pillw{text-align:center;margin:-4px 0 12px}
.wp-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#15803d;background:#f0fdf4;border-radius:999px;padding:3px 10px}
.wp-pd{width:7px;height:7px;border-radius:50%;background:#16a34a}
.wp-dot.off{background:#b8bdc9}
.wp-cont{font-size:11px;font-weight:600;color:#fff;background:#dc2626;border-radius:999px;padding:5px 12px}
.wp-slash{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:#5b6170;border:1px solid #d8dbe2;border-radius:6px;padding:1px 7px;pointer-events:none}
.wp-ft{margin:10px 0 0;text-align:center;font-size:11px;color:#5b6170}
`}</style>
            <div className="wb-brandtl" style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#fff", borderRadius: "50%", padding: "3px", overflow: "hidden", boxSizing: "border-box" }}><img src={logo} alt="" style={{ width: "100%", height: "100%", maxWidth: "none", objectFit: "contain" }} /></span><img src="/scan2serve-wordmark.png" alt="Scan2Serve Muntinlupa Branch" style={{ height: "36px", width: "auto", display: "block", alignSelf: "center", position: "relative", top: "-0.5px", marginLeft: "-4px" }} /></div>
            <div className="wp-bd">
                <div className="wp-card">
                    <h2 className="wp-t">Who's using this?</h2>
                    <p className="wp-s">Select your profile to continue</p>
                    {onlineN > 0 && <div className="wp-pillw"><span className="wp-pill"><span className="wp-pd" />{onlineN} {onlineN === 1 ? 'admin' : 'admins'} online now</span></div>}
                    <div style={{ position: 'relative', margin: '0 0 10px' }}><input ref={searchRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search admins" aria-label="Search admins" style={{ width: '100%', boxSizing: 'border-box', height: '38px', padding: '0 36px 0 12px', border: '1px solid #e2e4ea', borderRadius: '10px', background: '#f7f7f9', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} /><span className="wp-slash">/</span></div>
                    {last && hit(last) && (
                        <>
                            <p className="wp-lb">Last used</p>
                            <div className="wp-fl">{row(last)}</div>
                        </>
                    )}
                    {others.length > 0 && (
                        <>
                            <p className={'wp-lb' + (last ? ' gap' : '')}>{last ? 'Other admins' : 'All admins'}</p>
                            <div className="wp-fl wp-list">{others.map((s) => row(s))}</div>
                        </>
                    )}
                    <div className={others.length > 0 || last ? '' : 'wp-fl'}>
                        <button type="button" className="wp-fr" onClick={onAdd}>
                            <span className="wp-pl">+</span>
                            <span className="wp-fn"><b>Add admin</b></span>
                        </button>
                    </div>
                    <p className="wp-ft">Secure session &middot; Philippine Red Cross</p>
                </div>
            </div>
        </div>
    );
}

function AddAdminGate({ onClose }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const tidy = (s) => s.trim().replace(/\s+/g, ' ');
    const nameError = (s) => {
        const words = tidy(s).split(' ').filter(Boolean);
        const bad = 'Enter first and last name, like Maria Santos.';
        if (words.length < 2) return bad;
        if (!words.every((w) => /^\p{L}[\p{L}.'-]*$/u.test(w))) return 'Use letters only in the name.';
        if (words[0].length < 2 || words[words.length - 1].length < 2) return bad;
        return '';
    };

    const post = async (url, body) => {
        const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
        const res = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': m ? decodeURIComponent(m[1]) : '' }, body: JSON.stringify(body) });
        let data = {};
        try { data = await res.json(); } catch { /* ignore */ }
        return { ok: res.ok, data };
    };

    const submit = async () => {
        if (busy) return;
        const e = nameError(fullName);
        if (e) { setMsg(e); return; }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg('Enter a valid email address.'); return; }
        if (pw.length < 8) { setMsg('Temporary password must be at least 8 characters.'); return; }
        setBusy(true);
        const r = await post(route('admin.accounts.store'), { name: tidy(fullName), email: email.trim(), password: pw });
        setBusy(false);
        if (r.ok) { setDone(true); return; }
        const firstErr = r.data && r.data.errors ? Object.values(r.data.errors)[0] : null;
        setMsg((firstErr && firstErr[0]) || (r.data && r.data.message) || 'Something went wrong. Try again.');
    };

    const finish = () => { router.reload({ onFinish: onClose }); };
    const inputStyle = { width: '260px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px' };
    const linkBtn = { border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '6px' };
    const initial = (tidy(fullName).charAt(0) || '+').toUpperCase();

    return (
        <div role="dialog" aria-label="Add admin" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#b92f2f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#2e8b57', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 600 }}>{initial}</span>
            {done ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Admin account created</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: '280px' }}>{tidy(fullName)} can log in with {email.trim()} and the temporary password you set.</div>
                    <button type="button" onClick={finish} style={{ border: 'none', background: '#fff', color: '#b92f2f', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', marginTop: '6px' }}>Done</button>
                </div>
            ) : (
                <>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Add admin</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>Enter their name, email and a temporary password</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <input type="text" autoFocus value={fullName} onChange={(e) => { setFullName(e.target.value); setMsg(''); }} placeholder="Full name, e.g. Maria Santos" aria-label="Full name" style={inputStyle} />
                        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setMsg(''); }} placeholder="Email address" aria-label="Email address" autoComplete="off" style={inputStyle} />
                        <input type="text" value={pw} onChange={(e) => { setPw(e.target.value); setMsg(''); }} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="Temporary password (min. 8 characters)" aria-label="Temporary password" autoComplete="off" style={inputStyle} />
                        <button type="button" onClick={submit} disabled={busy} style={{ border: 'none', background: '#fff', color: '#b92f2f', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', opacity: busy ? 0.6 : 1 }}>{busy ? 'Creating...' : 'Create admin'}</button>
                    </div>
                    <div style={{ minHeight: '18px', fontSize: '12px', color: '#ffe3e3', marginTop: '4px', textAlign: 'center', maxWidth: '280px' }}>{msg}</div>
                    <button type="button" onClick={onClose} style={linkBtn}>Cancel</button>
                </>
            )}
        </div>
    );
}

function ManageAdmins({ onClose }) {
    const [rows, setRows] = useState(null);
    const [msg, setMsg] = useState('');
    const [okMsg, setOkMsg] = useState('');
    const [pick, setPick] = useState(null);
    const [pw, setPw] = useState('');
    const [busy, setBusy] = useState(false);

    const call = async (method, url, body) => {
        const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
        const res = await fetch(url, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': m ? decodeURIComponent(m[1]) : '' }, body: body ? JSON.stringify(body) : undefined });
        let data = {};
        try { data = await res.json(); } catch { /* ignore */ }
        return { ok: res.ok, data };
    };

    const load = async () => {
        const r = await call('GET', route('admin.accounts.index'));
        if (r.ok) setRows(r.data.admins || []);
        else { setRows([]); setMsg('Could not load the admin list.'); }
    };

    useEffect(() => { load(); }, []);

    const run = async () => {
        if (!pick || busy) return;
        if (pick.mode === 'reset' && pw.length < 8) { setMsg('Temporary password must be at least 8 characters.'); return; }
        setBusy(true); setMsg(''); setOkMsg('');
        const r = pick.mode === 'edit'
            ? await call('PUT', route('admin.accounts.update', pick.id), { name: pick.name, email: pick.email })
            : pick.mode === 'reset'
            ? await call('POST', route('admin.accounts.reset', pick.id), { password: pw })
            : pick.mode === 'deactivate'
                ? await call('POST', route('admin.accounts.deactivate', pick.id))
                : pick.mode === 'reactivate'
                    ? await call('POST', route('admin.accounts.reactivate', pick.id))
                    : await call('DELETE', route('admin.accounts.destroy', pick.id));
        setBusy(false);
        if (r.ok) {
            setOkMsg(pick.mode === 'reset' ? 'Password reset and emailed. They must change it the next time they log in.' : pick.mode === 'edit' ? 'Admin details updated.' : pick.mode === 'deactivate' ? 'Admin deactivated. They can no longer log in.' : pick.mode === 'reactivate' ? 'Admin reactivated.' : 'Admin removed.');
            setPick(null); setPw(''); load();
            return;
        }
        const fe = r.data && r.data.errors ? Object.values(r.data.errors)[0] : null;
        setMsg((fe && fe[0]) || (r.data && r.data.message) || 'Something went wrong. Try again.');
    };

    const small = { border: '1px solid #ddd', background: '#fff', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', color: '#333' };

    return (
        <div role="dialog" aria-label="Manage admins" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#b92f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '86vh', overflowY: 'auto', padding: '22px 22px 16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#111', textAlign: 'center' }}>Manage admins</div>
                <div style={{ fontSize: '12px', color: '#777', textAlign: 'center', margin: '4px 0 12px' }}>Edit, reset a password, deactivate, or remove an admin</div>

                {rows === null && <div style={{ fontSize: '12px', color: '#777', textAlign: 'center', padding: '14px 0' }}>Loading...</div>}
                {rows && rows.length === 0 && !msg && <div style={{ fontSize: '12px', color: '#777', textAlign: 'center', padding: '14px 0' }}>No other admins yet.</div>}

                {rows && rows.map((a) => (
                    <div key={a.id} style={{ borderTop: '1px solid #f0f0f0', padding: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                                <div style={{ fontSize: '11px', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}{a.must_change_password ? ' \u00b7 temporary password' : ''}{a.active === false ? ' \u00b7 inactive' : ''}</div>
                            </div>
                            <button type="button" style={small} onClick={() => { setPick({ id: a.id, mode: 'edit', name: a.name, email: a.email }); setMsg(''); setOkMsg(''); }}>Edit</button>
                            <button type="button" style={small} onClick={() => { setPick({ id: a.id, mode: 'reset' }); setPw(''); setMsg(''); setOkMsg(''); }}>Reset password</button>
                            <button type="button" style={small} onClick={() => { setPick({ id: a.id, mode: a.active === false ? 'reactivate' : 'deactivate' }); setMsg(''); setOkMsg(''); }}>{a.active === false ? 'Reactivate' : 'Deactivate'}</button>
                            <button type="button" style={{ ...small, color: '#c62828', borderColor: '#f3c4c4' }} onClick={() => { setPick({ id: a.id, mode: 'remove' }); setMsg(''); setOkMsg(''); }}>Remove</button>
                        </div>

                        {pick && pick.id === a.id && pick.mode === 'edit' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                <input type="text" value={pick.name} onChange={(e) => setPick({ ...pick, name: e.target.value })} placeholder="Full name" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '7px 10px', fontFamily: 'inherit', fontSize: '12px' }} />
                                <input type="email" value={pick.email} onChange={(e) => setPick({ ...pick, email: e.target.value })} placeholder="Active email" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '7px 10px', fontFamily: 'inherit', fontSize: '12px' }} />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button type="button" style={small} onClick={() => setPick(null)}>Cancel</button>
                                    <button type="button" disabled={busy} onClick={run} style={{ border: 'none', background: '#c62828', color: '#fff', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving...' : 'Save'}</button>
                                </div>
                            </div>
                        )}

                        {pick && pick.id === a.id && pick.mode === 'reset' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New temporary password (min 8)" style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '7px 10px', fontFamily: 'inherit', fontSize: '12px' }} />
                                <button type="button" disabled={busy} onClick={run} style={{ border: 'none', background: '#c62828', color: '#fff', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving...' : 'Reset'}</button>
                                <button type="button" style={small} onClick={() => setPick(null)}>Cancel</button>
                            </div>
                        )}

                        {pick && pick.id === a.id && (pick.mode === 'deactivate' || pick.mode === 'reactivate') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <span style={{ flex: 1, fontSize: '12px', color: '#555' }}>{pick.mode === 'deactivate' ? `Deactivate ${a.name}? They cannot log in, but their history stays.` : `Reactivate ${a.name}? They can log in again.`}</span>
                                <button type="button" disabled={busy} onClick={run} style={{ border: 'none', background: '#c62828', color: '#fff', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving...' : 'Yes'}</button>
                                <button type="button" style={small} onClick={() => setPick(null)}>Cancel</button>
                            </div>
                        )}

                        {pick && pick.id === a.id && pick.mode === 'remove' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <span style={{ flex: 1, fontSize: '12px', color: '#c62828' }}>Remove {a.name}? They will no longer be able to log in.</span>
                                <button type="button" disabled={busy} onClick={run} style={{ border: 'none', background: '#c62828', color: '#fff', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', opacity: busy ? 0.6 : 1 }}>{busy ? 'Removing...' : 'Yes, remove'}</button>
                                <button type="button" style={small} onClick={() => setPick(null)}>Cancel</button>
                            </div>
                        )}
                    </div>
                ))}

                <div style={{ minHeight: '18px', fontSize: '12px', marginTop: '8px', textAlign: 'center', color: msg ? '#c62828' : '#2e8b57' }}>{msg || okMsg}</div>
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                    <button type="button" onClick={onClose} style={{ ...small, padding: '7px 22px' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

function AddAdminGateOld({ onClose }) {
    const [step, setStep] = useState('name');
    const [fullName, setFullName] = useState('');
    const [buf, setBuf] = useState('');
    const [first, setFirst] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);

    const tidy = (s) => s.trim().replace(/\s+/g, ' ');
    const nameError = (s) => {
        const words = tidy(s).split(' ').filter(Boolean);
        const bad = 'Enter first and last name, like Maria Santos.';
        if (words.length < 2) return bad;
        if (!words.every((w) => /^\p{L}[\p{L}.'-]*$/u.test(w))) return 'Use letters only in the name.';
        if (words[0].length < 2 || words[words.length - 1].length < 2) return bad;
        return '';
    };

    const post = async (url, body) => {
        const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
        const res = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': m ? decodeURIComponent(m[1]) : '' }, body: JSON.stringify(body) });
        let data = {};
        try { data = await res.json(); } catch { /* ignore */ }
        return { ok: res.ok, data };
    };

    const next = () => {
        const e = nameError(fullName);
        if (e) { setMsg(e); return; }
        setMsg('');
        setStep('create');
    };

    useEffect(() => {
        if (buf.length !== 4 || busy) return;
        const run = async () => {
            if (step === 'create') { setFirst(buf); setBuf(''); setStep('confirm'); setMsg(''); return; }
            if (step === 'confirm') {
                if (buf !== first) { setMsg('PINs did not match. Start again.'); setFirst(''); setBuf(''); setStep('create'); return; }
                setBusy(true);
                const r = await post(route('admin.who.add'), { name: tidy(fullName), pin: buf });
                setBusy(false);
                if (r.ok) { router.reload({ onFinish: onClose }); return; }
                setMsg(r.data.message || 'Something went wrong. Try again.');
                setBuf(''); setFirst(''); setStep('name');
            }
        };
        run();
    }, [buf]);

    const press = (k) => {
        if (busy) return;
        setMsg('');
        if (k === '<') setBuf((b) => b.slice(0, -1));
        else setBuf((b) => (b.length < 4 ? b + k : b));
    };

    const linkBtn = { border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '10px' };
    const initial = (tidy(fullName).charAt(0) || '+').toUpperCase();

    return (
        <div role="dialog" aria-label="Add admin" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#b92f2f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#2e8b57', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 600 }}>{initial}</span>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{step === 'name' ? 'Add admin' : tidy(fullName)}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{step === 'name' ? 'Enter their full name' : step === 'create' ? 'Create a 4-digit PIN' : 'Enter it again to confirm'}</div>
            {step === 'name' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <input type="text" autoFocus value={fullName} onChange={(e) => { setFullName(e.target.value); setMsg(''); }} onKeyDown={(e) => { if (e.key === 'Enter') next(); }} placeholder="e.g. Maria Santos" aria-label="Full name" style={{ width: '230px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px' }} />
                    <button type="button" onClick={next} style={{ border: 'none', background: '#fff', color: '#b92f2f', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Next</button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '12px', margin: '14px 0 6px' }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < buf.length ? '#fff' : 'rgba(255,255,255,0.35)' }} />)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: '8px', marginTop: '10px' }}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'].map((k, i) => k === '' ? <span key={i} /> : (
                            <button key={i} type="button" onClick={() => press(k)} aria-label={k === '<' ? 'Delete' : k} style={{ height: '44px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>{k === '<' ? '\u232B' : k}</button>
                        ))}
                    </div>
                </>
            )}
            <div style={{ minHeight: '18px', fontSize: '12px', fontWeight: 500, color: '#fff', marginTop: '6px' }}>{msg}</div>
            {step !== 'name' && <button type="button" onClick={() => { setStep('name'); setBuf(''); setFirst(''); setMsg(''); }} style={linkBtn}>Back to name</button>}
            <button type="button" onClick={onClose} style={linkBtn}>Cancel</button>
        </div>
    );
}

function PinGate({ name, hasPin, color, onClose }) {
    const [mode, setMode] = useState(hasPin ? 'enter' : 'create');
    const [buf, setBuf] = useState('');
    const [first, setFirst] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);
    const [pw, setPw] = useState('');

    const post = async (url, body) => {
        const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
        const res = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': m ? decodeURIComponent(m[1]) : '' }, body: JSON.stringify(body) });
        let data = {};
        try { data = await res.json(); } catch { /* ignore */ }
        return { ok: res.ok, data };
    };
    const done = () => { if (window.__rcPreparing) window.__rcPreparing(); router.reload({ onFinish: onClose }); };

    useEffect(() => {
        if (buf.length !== 4 || busy) return;
        const run = async () => {
            if (mode === 'create') { setFirst(buf); setBuf(''); setMode('confirm'); setMsg(''); return; }
            if (mode === 'confirm' && buf !== first) { setMsg('PINs did not match. Start again.'); setFirst(''); setBuf(''); setMode('create'); return; }
            setBusy(true);
            const r = await post(mode === 'enter' ? route('admin.who.pin') : route('admin.who.create'), { name, pin: buf });
            setBusy(false);
            if (r.ok) { done(); return; }
            setMsg(r.data.message || 'Something went wrong. Try again.');
            setBuf('');
        };
        run();
    }, [buf]);

    const press = (k) => {
        if (busy) return;
        setMsg('');
        if (k === '<') setBuf((b) => b.slice(0, -1));
        else setBuf((b) => (b.length < 4 ? b + k : b));
    };

    const doReset = async () => {
        if (!pw) { setMsg('Enter the shared account password.'); return; }
        setBusy(true);
        const r = await post(route('admin.who.reset'), { name, password: pw });
        setBusy(false);
        if (r.ok) { setPw(''); setBuf(''); setMode('create'); setMsg('PIN cleared. Create a new one.'); router.reload({ only: ['profilePinned'] }); }
        else setMsg(r.data.message || 'Could not reset the PIN.');
    };

    const title = mode === 'enter' ? 'Enter your 4-digit PIN' : mode === 'create' ? 'Create your 4-digit PIN' : mode === 'confirm' ? 'Enter it again to confirm' : 'Reset PIN';
    const linkBtn = { border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '10px' };

    return (
        <div role="dialog" aria-label="Enter PIN" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#b92f2f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ width: '60px', height: '60px', borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 600 }}>{name.charAt(0).toUpperCase()}</span>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{title}</div>
            {mode === 'reset' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setMsg(''); }} placeholder="Shared account password" aria-label="Shared account password" style={{ width: '230px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px' }} />
                    <button type="button" onClick={doReset} disabled={busy} style={{ border: 'none', background: '#fff', color: '#b92f2f', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Reset PIN</button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '12px', margin: '14px 0 6px' }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < buf.length ? '#fff' : 'rgba(255,255,255,0.35)' }} />)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: '8px', marginTop: '10px' }}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'].map((k, i) => k === '' ? <span key={i} /> : (
                            <button key={i} type="button" onClick={() => press(k)} aria-label={k === '<' ? 'Delete' : k} style={{ height: '44px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>{k === '<' ? '\u232B' : k}</button>
                        ))}
                    </div>
                </>
            )}
            <div style={{ minHeight: '18px', fontSize: '12px', fontWeight: 500, color: '#fff', marginTop: '6px' }}>{msg}</div>
            {mode === 'enter' && <button type="button" onClick={() => { setMode('reset'); setMsg(''); setBuf(''); }} style={linkBtn}>Forgot PIN?</button>}
            {mode === 'reset' && <button type="button" onClick={() => { setMode(hasPin ? 'enter' : 'create'); setMsg(''); }} style={linkBtn}>Back to PIN</button>}
            <button type="button" onClick={onClose} style={linkBtn}>Cancel</button>
        </div>
    );
}
