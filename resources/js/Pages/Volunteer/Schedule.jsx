import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function VolunteerSchedule({ auth, activities }) {
    const volunteer = auth.user;
    const acts = activities || [];

    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

    const handleLogout = () => {
        document.getElementById('logout-form').submit();
    };

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarCells = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
    while (calendarCells.length % 7 !== 0) calendarCells.push(null);

    const actsByDate = {};
    acts.forEach(act => {
        const key = act.date?.substring(0, 10);
        if (!actsByDate[key]) actsByDate[key] = [];
        actsByDate[key].push(act);
    });

    const chipColors = ['#CC0000','#16a34a','#3B82F6','#8B5CF6','#F59E0B','#14B8A6'];
    const getColor = (id) => chipColors[id % chipColors.length];

    const handleChipClick = (e, act) => {
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top - 10;
        if (left + 280 > window.innerWidth) left = rect.left - 290;
        if (top + 380 > window.innerHeight) top = window.innerHeight - 390;
        if (top < 60) top = 60;
        setPopupPos({ top, left });
        setSelectedActivity(act);
    };

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',  href: route('volunteer.dashboard'),     icon: <DashIcon /> },
        { key: 'schedule',      label: 'Schedule',   href: route('volunteer.schedule'),      icon: <CalIcon /> },
        { key: 'communication', label: 'Messages',   href: route('volunteer.communication'), icon: <MsgIcon /> },
        { key: 'attendance',    label: 'Attendance', href: route('volunteer.attendance'),    icon: <ClockIcon /> },
        { key: 'documents',     label: '301 Docs',   href: route('volunteer.documents'),     icon: <DocIcon /> },
    ];

    return (
        <>
            <Head title="Schedule" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .cal-cell:hover { background: #fafafa !important; }
                .chip:hover { opacity: 0.85; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
            `}</style>

            <form id="logout-form" method="POST" action={route('logout')} style={{ display: 'none' }}>
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
            </form>

            <div
                style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f7f7f8' }}
                onClick={() => setSelectedActivity(null)}
            >
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
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Red Cross</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>Muntinlupa Branch</div>
                            </div>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '6px' }}>Menu</div>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'schedule';
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
                <div style={{ marginLeft: '210px', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                    {/* Topbar */}
                    <header style={{
                        height: '54px', background: 'white', borderBottom: '1px solid #ebebeb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Schedule</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input
                                    placeholder="Search activities..."
                                    style={{ border: '1px solid #ebebeb', borderRadius: '8px', padding: '6px 12px 6px 28px', fontSize: '11px', width: '180px', outline: 'none', background: '#f9f9f9', color: '#333' }}
                                />
                            </div>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>

                    {/* Calendar */}
                    <main style={{ flex: 1, padding: '20px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>

                            {/* Month Nav */}
                            <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
                                <button onClick={(e) => { e.stopPropagation(); prevMonth(); }} style={{ background: 'none', border: '1px solid #ebebeb', cursor: 'pointer', color: '#999', fontSize: '14px', width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>‹</button>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', minWidth: '130px' }}>
                                    {monthNames[currentMonth]} {currentYear}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); nextMonth(); }} style={{ background: 'none', border: '1px solid #ebebeb', cursor: 'pointer', color: '#999', fontSize: '14px', width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>›</button>
                                <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#aaa' }}>
                                    {acts.length} activit{acts.length !== 1 ? 'ies' : 'y'} this month
                                </div>
                            </div>

                            {/* Day Headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
                                {dayNames.map((d, i) => (
                                    <div key={d} style={{
                                        padding: '8px 10px', fontSize: '9px', fontWeight: '600',
                                        color: i === 0 ? '#CC0000' : '#bbb',
                                        textAlign: 'center', letterSpacing: '0.8px', textTransform: 'uppercase',
                                    }}>{d}</div>
                                ))}
                            </div>

                            {/* Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1 }}>
                                {calendarCells.map((day, idx) => {
                                    const dateKey = day
                                        ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                        : null;
                                    const dayActs = dateKey ? (actsByDate[dateKey] || []) : [];
                                    const isToday = day && today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
                                    const isSunday = idx % 7 === 0;

                                    return (
                                        <div key={idx} className="cal-cell" style={{
                                            minHeight: '80px',
                                            padding: '7px 8px',
                                            borderRight: (idx + 1) % 7 !== 0 ? '0.5px solid #f5f5f5' : 'none',
                                            borderBottom: idx < calendarCells.length - 7 ? '0.5px solid #f5f5f5' : 'none',
                                            background: day ? 'white' : '#fafafa',
                                            overflow: 'hidden',
                                            transition: 'background 0.1s',
                                        }}>
                                            {day && (
                                                <>
                                                    <div style={{
                                                        fontSize: '11px', fontWeight: isToday ? '700' : '400',
                                                        color: isToday ? 'white' : isSunday ? '#CC0000' : '#333',
                                                        width: '22px', height: '22px', borderRadius: '50%',
                                                        background: isToday ? '#CC0000' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        marginBottom: '4px',
                                                    }}>{day}</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        {dayActs.slice(0, 2).map(act => (
                                                            <div
                                                                key={act.id}
                                                                className="chip"
                                                                onClick={(e) => handleChipClick(e, act)}
                                                                style={{
                                                                    background: getColor(act.id), color: 'white',
                                                                    borderRadius: '3px', padding: '2px 5px',
                                                                    fontSize: '9px', fontWeight: '600', cursor: 'pointer',
                                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                    transition: 'opacity 0.1s',
                                                                }}
                                                                title={act.name}
                                                            >
                                                                {act.name}
                                                            </div>
                                                        ))}
                                                        {dayActs.length > 2 && (
                                                            <div style={{ fontSize: '9px', color: '#bbb', fontWeight: '500' }}>+{dayActs.length - 2} more</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* POPUP */}
            {selectedActivity && (
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed', top: popupPos.top, left: popupPos.left,
                        width: '268px', background: 'white', borderRadius: '10px',
                        border: '1px solid #ebebeb', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        zIndex: 300, overflow: 'hidden',
                    }}
                >
                    <div style={{
                        background: getColor(selectedActivity.id), padding: '11px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>
                            {new Date(selectedActivity.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button onClick={() => setSelectedActivity(null)} style={{
                            background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%',
                            color: 'white', fontSize: '10px', cursor: 'pointer',
                            width: '18px', height: '18px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: '700',
                        }}>✕</button>
                    </div>
                    <div style={{ padding: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '10px' }}>{selectedActivity.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span style={{ fontSize: '11px', color: '#555' }}>{selectedActivity.start_time?.substring(0,5)} – {selectedActivity.end_time?.substring(0,5)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '12px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span style={{ fontSize: '11px', color: '#555', lineHeight: '1.5' }}>{selectedActivity.location_name || '—'}</span>
                        </div>
                        <div style={{ borderTop: '0.5px solid #f5f5f5', paddingTop: '10px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Description</div>
                            <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.6' }}>{selectedActivity.description || 'No description provided.'}</div>
                        </div>
                        <div style={{ background: '#f9f9f9', borderRadius: '7px', padding: '8px 10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#CC0000' }}>Assigned by: </span>
                            <span style={{ fontSize: '10px', color: '#555' }}>{selectedActivity.assigned_by || 'Philippine Red Cross Admin'}</span>
                        </div>
                    </div>
                </div>
            )}
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