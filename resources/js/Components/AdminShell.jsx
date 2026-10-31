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
    const { auth, adminProfile, staffList = [], profilePinned = [], staffPhotos = {} } = usePage().props;
    const admin = auth?.user; const needPick = staffList.length > 0 && !adminProfile; const [pinFor, setPinFor] = useState(null); const [addOpen, setAddOpen] = useState(false);

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

    const handleLogout = () => router.post(route('logout'));

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                    {staffList.length > 0 && (<div style={{ borderBottom: '1px solid #f0f0f0', padding: '6px 0' }}><div style={{ padding: '4px 14px', fontSize: '10px', color: '#999' }}>Switch profile</div>{staffList.map((s, i) => (<button key={s} role="menuitem" className="menu-item" onClick={() => { setShowUserMenu(false); if (s !== adminProfile) setPinFor(s); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px', fontSize: '12px', color: '#333', background: s === adminProfile ? '#f5f5f6' : 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}><span style={{ width: '22px', height: '22px', borderRadius: '50%', background: ['#CC0000', '#1d6fb8', '#2e8b57', '#8a5cc2'][i % 4], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>{staffPhotos[s] ? <img src={`/storage/${staffPhotos[s]}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : s.charAt(0).toUpperCase()}</span><span style={{ flex: 1 }}>{s}</span>{s === adminProfile && <span style={{ color: '#2e8b57', fontSize: '12px' }}>{'\u2713'}</span>}</button>))}<button type="button" role="menuitem" className="menu-item" onClick={() => { setShowUserMenu(false); setAddOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px', fontSize: '12px', color: '#CC0000', background: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>+ Add admin</button></div>)}<Link role="menuitem" href={route('admin.profile')} className="menu-item" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', fontSize: '12px', color: '#333', textDecoration: 'none' }}>
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

                {needPick && (<div role="dialog" aria-label="Choose profile" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#b92f2f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}><div style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>Who is using this?</div><div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>{staffList.map((s, i) => (<button key={s} type="button" onClick={() => setPinFor(s)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}><span style={{ width: '72px', height: '72px', borderRadius: '50%', background: ['#CC0000', '#1d6fb8', '#2e8b57', '#8a5cc2'][i % 4], color: '#fff', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 600, margin: '0 auto 8px' }}>{staffPhotos[s] ? <img src={`/storage/${staffPhotos[s]}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : s.charAt(0).toUpperCase()}</span><span style={{ fontSize: '14px', color: '#fff' }}>{s}</span></button>))}</div></div>)}{addOpen && (<AddAdminGate onClose={() => setAddOpen(false)} />)}{pinFor && (<PinGate key={pinFor} name={pinFor} hasPin={profilePinned.includes(pinFor)} color={['#CC0000', '#1d6fb8', '#2e8b57', '#8a5cc2'][Math.max(0, staffList.indexOf(pinFor)) % 4]} onClose={() => setPinFor(null)} />)}{/* SIDEBAR */}
                <aside id="vp-sidebar" className={`vp-sidebar${navOpen ? ' open' : ''}`} style={{
                    width: '196px', position: 'fixed', left: '16px', top: '80px', bottom: '16px', zIndex: 100,
                    background: 'white', border: '1px solid #ebebeb', borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    <div className="vp-mobile-only" style={{ alignItems: 'center', gap: '10px', padding: '16px 14px 12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Link href={route('admin.dashboard')} onClick={() => setNavOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, textDecoration: 'none' }}>
                            <Logo />
                            <span style={{ lineHeight: 1.2 }}>
                                <span style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#111' }}>Scan<span style={{ color: '#dc2626' }}>2</span>Serve</span>
                                <span className="s2s-tag" style={{ display: 'block', fontSize: '9px', marginTop: '3px', whiteSpace: 'nowrap' }}>Muntinlupa Branch</span>
                            </span>
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
                        <span style={{ lineHeight: 1.2 }}>
                            <span style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#111' }}>Scan<span style={{ color: '#dc2626' }}>2</span>Serve</span>
                            <span className="s2s-tag" style={{ display: 'block', fontSize: '9px', marginTop: '3px', whiteSpace: 'nowrap' }}>Muntinlupa Branch</span>
                        </span>
                    </Link>
                    <nav aria-label="Admin portal" style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px' }}>
                        {navGroups.map((group, gi) => (
                            <div key={group.title} style={{ marginBottom: '12px', ...(gi > 0 ? { borderTop: '1px solid #f3f3f3', paddingTop: '12px' } : {}) }}>
                                <div style={{ fontSize: '10.5px', fontWeight: '500', color: '#aaa', padding: '0 12px', marginBottom: '6px' }}>{group.title}</div>
                                {group.items.map(renderLink)}
                            </div>
                        ))}
                    </nav>
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

function AddAdminGate({ onClose }) {
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
            <span style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#2e8b57', color: '#fff', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 600 }}>{initial}</span>
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
    const done = () => router.reload({ onFinish: onClose });

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
            <span style={{ width: '60px', height: '60px', borderRadius: '50%', background: color, color: '#fff', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 600 }}>{name.charAt(0).toUpperCase()}</span>
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
