import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function VolunteerDashboard({ auth, totalHours, totalDays, monthDays, assignedActivities, recentAttendance }) {
    const volunteer = auth.user;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [availability, setAvailability] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const activities = assignedActivities || [];
    const attendance = recentAttendance || [];

    const todayActivities = activities.filter(a =>
        new Date(a.date).toDateString() === new Date().toDateString()
    );

    const upcomingActivities = activities.filter(a => new Date(a.date) > new Date()).slice(0, 5);

    const hoursToday = attendance
        .filter(r => new Date(r.date).toDateString() === new Date().toDateString())
        .reduce((sum, r) => sum + parseFloat(r.hours_rendered || 0), 0);

    const isCheckedIn = attendance.some(r =>
        new Date(r.date).toDateString() === new Date().toDateString() && r.time_in && !r.time_out
    );

    const handleLogout = () => router.post(route('logout'));

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',     href: route('volunteer.dashboard'),     icon: <GridIcon /> },
        { key: 'schedule',      label: 'Schedule',      href: route('volunteer.schedule'),      icon: <CalIcon /> },
        { key: 'communication', label: 'Communication', href: route('volunteer.communication'), icon: <ChatIcon /> },
        { key: 'attendance',    label: 'Attendance',    href: route('volunteer.attendance'),    icon: <CheckIcon /> },
        { key: 'documents',     label: '301',           href: route('volunteer.documents'),     icon: <FolderIcon /> },
    ];

    return (
        <>
            <Head title="Volunteer Dashboard" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#F3F4F6' }}>

                {/* SIDEBAR */}
                <aside style={{
                    width: '160px', minHeight: '100vh', background: '#CC0000',
                    display: 'flex', flexDirection: 'column', flexShrink: 0,
                    position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
                }}>
                    <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'white', lineHeight: '1.4' }}>
                            Rizal Chapter<br />
                            <span style={{ fontWeight: '400', opacity: 0.85 }}>Muntinlupa City Branch</span>
                        </div>
                    </div>

                    <nav style={{ flex: 1, paddingTop: '8px' }}>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'dashboard';
                            return (
                                <Link key={item.key} href={item.href} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '11px 16px', textDecoration: 'none',
                                    background: isActive ? 'rgba(0,0,0,0.18)' : 'transparent',
                                    color: 'white', fontSize: '13px',
                                    fontWeight: isActive ? '600' : '400',
                                    borderLeft: isActive ? '3px solid white' : '3px solid transparent',
                                }}>
                                    <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                        <button onClick={handleLogout} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.75)', fontSize: '12px', padding: 0, width: '100%'
                        }}>
                            <span style={{ fontSize: '16px' }}>⏻</span> Log out
                        </button>
                    </div>
                </aside>

                {/* MAIN */}
                <div style={{ marginLeft: '160px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Topbar */}
                    <header style={{
                        background: 'white', padding: '0 28px', height: '56px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 50
                    }}>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>
                            {currentTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <input placeholder="Search" style={{
                                border: '1px solid #E5E7EB', borderRadius: '20px',
                                padding: '6px 16px', fontSize: '13px', width: '180px',
                                outline: 'none', background: '#F9FAFB', color: '#374151'
                            }} />
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: '#CC0000', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700'
                            }}>
                                {volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>

                    {/* Body */}
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                        {/* Center */}
                        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

                            {/* Welcome Banner */}
                            <div style={{
                                background: '#CC0000', borderRadius: '12px',
                                padding: '24px 28px', marginBottom: '20px',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                                <div style={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                                    Welcome, {volunteer?.name}!
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Here's what's happening today</div>
                            </div>

                            {/* Status Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>

                                <div style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E5E7EB' }}>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Status</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isCheckedIn ? '#22C55E' : '#9CA3AF', display: 'inline-block' }} />
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{isCheckedIn ? 'Checked in' : 'Not checked in'}</span>
                                    </div>
                                </div>

                                <div style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E5E7EB' }}>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability</div>
                                    <div style={{ fontSize: '12px', color: availability ? '#22C55E' : '#6B7280', marginBottom: '6px' }}>{availability ? 'Available' : 'Not Available'}</div>
                                    <div onClick={() => setAvailability(!availability)} style={{
                                        width: '40px', height: '22px', borderRadius: '11px',
                                        background: availability ? '#22C55E' : '#D1D5DB',
                                        position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: '3px',
                                            left: availability ? '21px' : '3px',
                                            width: '16px', height: '16px', borderRadius: '50%',
                                            background: 'white', transition: 'left 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                </div>

                                <div style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E5E7EB' }}>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hours this day</div>
                                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>
                                        {hoursToday.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: '400', color: '#6B7280' }}>hrs</span>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Tasks */}
                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Today's Task</div>
                                </div>

                                {todayActivities.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                                        No tasks scheduled for today
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {todayActivities.map((act, i) => (
                                            <div key={act.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '14px 20px',
                                                borderBottom: i < todayActivities.length - 1 ? '1px solid #F9FAFB' : 'none',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🅰</div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{act.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                                            {new Date(act.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                            {act.start_time ? ` · ${act.start_time.substring(0, 5)}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '3px 10px' }}>Done</span>
                                                    <Link href={route('volunteer.attendance')} style={{
                                                        fontSize: '11px', fontWeight: '600', color: 'white',
                                                        background: '#CC0000', borderRadius: '4px', padding: '4px 12px', textDecoration: 'none'
                                                    }}>View task</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </main>

                        {/* Right Panel */}
                        <aside style={{ width: '260px', background: 'white', borderLeft: '1px solid #E5E7EB', padding: '20px 16px', flexShrink: 0, overflowY: 'auto' }}>

                            {/* Upcoming Tasks */}
                            <div style={{ marginBottom: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '14px' }}>Upcoming Task</div>
                                {upcomingActivities.length === 0 ? (
                                    <div style={{ fontSize: '12px', color: '#D1D5DB', textAlign: 'center', padding: '12px 0' }}>No upcoming tasks</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {upcomingActivities.map(act => (
                                            <div key={act.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', flexShrink: 0, marginTop: '5px' }} />
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#111' }}>{act.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                        {new Date(act.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Notifications */}
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '14px' }}>Recent Notifications</div>
                                {attendance.length === 0 ? (
                                    <div style={{ fontSize: '12px', color: '#D1D5DB', textAlign: 'center', padding: '12px 0' }}>No recent activity</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {attendance.slice(0, 3).map((rec, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0, marginTop: '5px' }} />
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#374151' }}>
                                                        Attendance recorded — {rec.hours_rendered ? `${parseFloat(rec.hours_rendered).toFixed(1)}h` : 'ongoing'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                                        {new Date(rec.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Link href={route('volunteer.attendance')} style={{ display: 'block', fontSize: '12px', color: '#CC0000', marginTop: '12px', textDecoration: 'none', fontWeight: '500' }}>
                                    View all Notifications →
                                </Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

function GridIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function CalIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ChatIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function CheckIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
}
function FolderIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}