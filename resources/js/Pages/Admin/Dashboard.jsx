import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AdminDashboard({ auth, pendingCount, totalVolunteers, activeToday }) {
    const admin = auth.user;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => router.post(route('logout'));

    const sidebarLinks = [
        { key: 'dashboard',  label: 'Dashboard',  href: route('admin.dashboard'),         icon: <DashIcon /> },
        { key: 'volunteers', label: 'Volunteers', href: route('admin.volunteers'),         icon: <PeopleIcon /> },
        { key: 'activities', label: 'Activities', href: route('admin.activities.index'),   icon: <CalIcon /> },
        { key: 'attendance', label: 'Attendance', href: route('admin.attendance.index'),   icon: <ClockIcon /> },
        { key: 'document-review', label: 'Document Review', href: route('admin.document-review.index'), icon: <DocIcon /> },
    ];

    const stats = [
        { label: 'Total Volunteers', value: totalVolunteers ?? 0 },
        { label: 'Active Today', value: activeToday ?? 0 },
        { label: 'Pending Approval', value: pendingCount ?? 0, highlight: true },
        { label: 'Total Admins', value: 1 },
    ];

    return (
        <>
            <Head title="Admin Dashboard" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .qa-primary:hover { background: #aa0000 !important; }
                .qa-blue:hover { background: #1741b0 !important; }
                .qa-green:hover { background: #128a3e !important; }
                .qa-ghost:hover { background: #f0f0f0 !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f7f7f8' }}>

                {/* SIDEBAR */}
                <aside style={{
                    width: '210px', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
                    background: '#CC0000', display: 'flex', flexDirection: 'column',
                    boxShadow: '4px 0 20px rgba(204,0,0,0.15)',
                }}>
                    <div style={{ padding: '28px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'white', letterSpacing: '0.3px' }}>Red Cross</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>Admin Panel</div>
                            </div>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '6px' }}>Menu</div>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'dashboard';
                            return (
                                <Link key={item.key} href={item.href} className="nav-link" style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 12px', textDecoration: 'none', borderRadius: '7px',
                                    marginBottom: '2px',
                                    background: isActive ? 'rgba(0,0,0,0.18)' : 'transparent',
                                    color: 'white', fontSize: '12px',
                                    fontWeight: isActive ? '600' : '400',
                                    borderLeft: isActive ? '3px solid white' : '3px solid transparent',
                                    transition: 'all 0.15s',
                                }}>
                                    <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px', padding: '0 4px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.name || 'Admin'}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Administrator</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{
                            width: '100%', padding: '7px 12px', borderRadius: '7px',
                            background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.75)', fontSize: '11px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '7px',
                        }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Sign out
                        </button>
                    </div>
                </aside>

                {/* MAIN */}
                <div style={{ marginLeft: '210px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

                    {/* Topbar */}
                    <header style={{
                        height: '54px', background: 'white', borderBottom: '1px solid #ebebeb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Dashboard</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {currentTime.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input placeholder="Search..." style={{ border: '1px solid #ebebeb', borderRadius: '8px', padding: '6px 12px 6px 28px', fontSize: '11px', width: '170px', outline: 'none', background: '#f9f9f9', color: '#333' }} />
                            </div>

                            <Link href={route('admin.volunteers')} style={{
                                width: '34px', height: '34px', borderRadius: '8px',
                                background: '#f7f7f8', border: '1px solid #ebebeb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                {pendingCount > 0 && (
                                    <span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', border: '1.5px solid white' }} />
                                )}
                            </Link>

                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

                        {/* Welcome Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #CC0000 0%, #990000 100%)',
                            borderRadius: '12px', padding: '22px 28px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                            <div style={{ position: 'absolute', right: 40, bottom: -80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>Admin Portal</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '3px' }}>
                                    Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {admin?.name?.split(' ')[0] || 'Admin'}.
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                                    {currentTime.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; {currentTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    padding: '6px 14px', borderRadius: '20px',
                                    background: pendingCount > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                                    border: `1px solid ${pendingCount > 0 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.5)'}`,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pendingCount > 0 ? '#f59e0b' : '#22C55E', display: 'inline-block' }} />
                                    <span style={{ fontSize: '11px', color: pendingCount > 0 ? '#fbbf24' : '#4ade80', fontWeight: '500' }}>
                                        {pendingCount > 0 ? `${pendingCount} pending review${pendingCount > 1 ? 's' : ''}` : 'All caught up'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* STATS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {stats.map(({ label, value, highlight }) => (
                                <div key={label} style={{
                                    background: 'white', borderRadius: '10px',
                                    border: highlight && value > 0 ? '1px solid #fde68a' : '1px solid #ebebeb',
                                    padding: '18px 20px',
                                }}>
                                    <div style={{
                                        fontSize: '26px', fontWeight: '700',
                                        color: highlight && value > 0 ? '#f59e0b' : '#111',
                                    }}>{value}</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: '500' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* PENDING ALERT */}
                        {pendingCount > 0 && (
                            <div style={{
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: '10px', padding: '14px 20px',
                                marginBottom: '20px', display: 'flex',
                                alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', color: '#92400e', fontWeight: '500' }}>
                                        You have <strong>{pendingCount}</strong> volunteer{pendingCount > 1 ? 's' : ''} waiting for approval.
                                    </span>
                                </div>
                                <Link href={route('admin.volunteers')} style={{
                                    background: '#f59e0b', color: 'white', padding: '7px 16px',
                                    borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                                    textDecoration: 'none',
                                }}>Review Now →</Link>
                            </div>
                        )}

                        {/* QUICK ACTIONS */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Quick Actions</span>
                            </div>
                            <div style={{ padding: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <Link href={route('admin.volunteers')} className="qa-primary" style={{
                                    background: '#CC0000', color: 'white',
                                    padding: '9px 18px', borderRadius: '7px', fontSize: '12px',
                                    fontWeight: '600', textDecoration: 'none', transition: 'background 0.15s',
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                }}><PeopleIcon light /> Manage Volunteers</Link>

                                <Link href={route('admin.activities.index')} className="qa-blue" style={{
                                    background: '#1d4ed8', color: 'white',
                                    padding: '9px 18px', borderRadius: '7px', fontSize: '12px',
                                    fontWeight: '600', textDecoration: 'none', transition: 'background 0.15s',
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                }}><CalIcon light /> Manage Activities</Link>

                                <Link href={route('admin.activities.create')} className="qa-green" style={{
                                    background: '#16a34a', color: 'white',
                                    padding: '9px 18px', borderRadius: '7px', fontSize: '12px',
                                    fontWeight: '600', textDecoration: 'none', transition: 'background 0.15s',
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                }}>+ New Activity</Link>

                                <Link href={route('admin.attendance.index')} className="qa-ghost" style={{
                                    background: '#f7f7f8', border: '1px solid #ebebeb',
                                    padding: '9px 18px', borderRadius: '7px',
                                    fontSize: '12px', fontWeight: '600', color: '#333',
                                    textDecoration: 'none', transition: 'background 0.15s',
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                }}><ClockIcon /> View Attendance</Link>

                                {['Manage Admins', 'View Reports'].map(action => (
                                    <button key={action} disabled style={{
                                        background: '#f7f7f8', border: '1px solid #ebebeb',
                                        padding: '9px 18px', borderRadius: '7px',
                                        fontSize: '12px', fontWeight: '600', color: '#ccc',
                                        cursor: 'not-allowed',
                                    }}>{action}</button>
                                ))}
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </>
    );
}

function DashIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function CalIcon({ light }) {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={light ? 'white' : 'currentColor'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ClockIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function PeopleIcon({ light }) {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={light ? 'white' : 'currentColor'} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function DocIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
