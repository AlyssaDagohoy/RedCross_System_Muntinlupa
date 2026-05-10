import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function VolunteerDashboard({ auth, totalHours, totalDays, monthDays, assignedActivities, recentAttendance }) {
    const volunteer = auth.user;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target))
                setShowNotifications(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activitiesList = assignedActivities || [];
    const attendance = recentAttendance || [];

    const todayActivities = activitiesList.filter(a =>
        new Date(a.date).toDateString() === new Date().toDateString()
    );
    const upcomingActivities = activitiesList.filter(a => new Date(a.date) > new Date()).slice(0, 5);
    const isCheckedIn = attendance.some(r =>
        new Date(r.date).toDateString() === new Date().toDateString() && r.time_in && !r.time_out
    );

    const handleLogout = () => router.post(route('logout'));

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',  href: route('volunteer.dashboard'),     icon: <DashIcon /> },
        { key: 'schedule',      label: 'Schedule',   href: route('volunteer.schedule'),      icon: <CalIcon /> },
        { key: 'communication', label: 'Messages',   href: route('volunteer.communication'), icon: <MsgIcon /> },
        { key: 'attendance',    label: 'Attendance', href: route('volunteer.attendance'),    icon: <ClockIcon /> },
        { key: 'documents',     label: '301 Docs',   href: route('volunteer.documents'),     icon: <DocIcon /> },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .task-row:hover { background: #fafafa !important; }
                .notif-item:hover { background: #f9f9f9 !important; }
                .btn-view:hover { background: #aa0000 !important; }
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
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>Muntinlupa Branch</div>
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
                                {volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.name}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Volunteer</div>
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

                            <div ref={notifRef} style={{ position: 'relative' }}>
                                <button onClick={() => setShowNotifications(!showNotifications)} style={{
                                    width: '34px', height: '34px', borderRadius: '8px',
                                    background: showNotifications ? '#f0f0f0' : '#f7f7f8',
                                    border: '1px solid #ebebeb', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                    {attendance.length > 0 && (
                                        <span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#CC0000', border: '1.5px solid white' }} />
                                    )}
                                </button>

                                {showNotifications && (
                                    <div style={{ position: 'absolute', right: 0, top: '42px', width: '300px', background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200, overflow: 'hidden' }}>
                                        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Notifications</span>
                                            <span style={{ fontSize: '10px', color: '#CC0000', fontWeight: '500', background: '#fff0f0', padding: '2px 7px', borderRadius: '10px' }}>{attendance.slice(0, 5).length} new</span>
                                        </div>
                                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                            {attendance.length === 0 ? (
                                                <div style={{ padding: '28px', textAlign: 'center', color: '#bbb', fontSize: '12px' }}>No notifications</div>
                                            ) : (
                                                attendance.slice(0, 5).map((rec, i) => (
                                                    <div key={i} className="notif-item" style={{ padding: '11px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: '11px', cursor: 'pointer' }}>
                                                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '11px', fontWeight: '500', color: '#222' }}>
                                                                Attendance — {rec.hours_rendered ? `${parseFloat(rec.hours_rendered).toFixed(1)}h recorded` : 'check-in ongoing'}
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>
                                                                {new Date(rec.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                                            <Link href={route('volunteer.attendance')} onClick={() => setShowNotifications(false)} style={{ fontSize: '11px', color: '#CC0000', fontWeight: '500', textDecoration: 'none' }}>View all →</Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                                {volunteer?.name?.charAt(0).toUpperCase()}
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
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>Volunteer Portal</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '3px' }}>
                                    Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {volunteer?.name?.split(' ')[0]}.
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                                    {currentTime.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; {currentTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    padding: '6px 14px', borderRadius: '20px',
                                    background: isCheckedIn ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.2)',
                                    border: `1px solid ${isCheckedIn ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isCheckedIn ? '#22C55E' : 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
                                    <span style={{ fontSize: '11px', color: isCheckedIn ? '#22C55E' : 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                                        {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tasks + Upcoming */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Today's Tasks</span>
                                    <span style={{ fontSize: '10px', color: '#bbb', background: '#f5f5f5', padding: '2px 8px', borderRadius: '10px' }}>
                                        {todayActivities.length} task{todayActivities.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {todayActivities.length === 0 ? (
                                    <div style={{ padding: '36px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: '#ccc' }}>No tasks scheduled for today</div>
                                    </div>
                                ) : (
                                    todayActivities.map((act, i) => (
                                        <div key={act.id} className="task-row" style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 18px',
                                            borderBottom: i < todayActivities.length - 1 ? '1px solid #f5f5f5' : 'none',
                                            transition: 'background 0.1s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '6px', height: '32px', borderRadius: '3px', background: '#CC0000', flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#111' }}>{act.name}</div>
                                                    <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>
                                                        {new Date(act.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                                        {act.start_time ? ` · ${act.start_time.substring(0, 5)}` : ''}
                                                        {act.location_name ? ` · ${act.location_name}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '7px' }}>
                                                <span style={{ fontSize: '10px', color: '#999', border: '1px solid #ebebeb', borderRadius: '5px', padding: '3px 10px', cursor: 'pointer' }}>Done</span>
                                                <Link href={route('volunteer.attendance')} className="btn-view" style={{
                                                    fontSize: '10px', fontWeight: '500', color: 'white',
                                                    background: '#CC0000', borderRadius: '5px',
                                                    padding: '3px 12px', textDecoration: 'none',
                                                    transition: 'background 0.15s',
                                                }}>View</Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Upcoming</span>
                                </div>
                                {upcomingActivities.length === 0 ? (
                                    <div style={{ padding: '32px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: '#ccc' }}>No upcoming tasks</div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '8px 0' }}>
                                        {upcomingActivities.map((act, i) => (
                                            <div key={act.id} style={{ padding: '10px 18px', borderBottom: i < upcomingActivities.length - 1 ? '1px solid #f8f8f8' : 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#CC0000', flexShrink: 0, marginTop: '6px' }} />
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#222' }}>{act.name}</div>
                                                    <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>
                                                        {new Date(act.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Recent Activity</span>
                                <Link href={route('volunteer.attendance')} style={{ fontSize: '10px', color: '#CC0000', fontWeight: '500', textDecoration: 'none' }}>View all →</Link>
                            </div>
                            {attendance.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#ccc' }}>No recent activity</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                    {attendance.slice(0, 4).map((rec, i) => (
                                        <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid #f5f5f5' : 'none' }}>
                                            <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '6px' }}>
                                                {new Date(rec.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>
                                                {rec.hours_rendered ? `${parseFloat(rec.hours_rendered).toFixed(1)}h` : '—'}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#bbb' }}>
                                                {rec.time_in ? new Date(rec.time_in).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                                {rec.time_out ? ` → ${new Date(rec.time_out).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
                                            </div>
                                            <div style={{
                                                display: 'inline-block', marginTop: '8px',
                                                fontSize: '9px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px',
                                                background: rec.hours_rendered ? '#f0fdf4' : '#fffbeb',
                                                color: rec.hours_rendered ? '#16a34a' : '#b45309',
                                            }}>
                                                {rec.hours_rendered ? 'Complete' : 'Ongoing'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
function CalIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MsgIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function ClockIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function DocIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}