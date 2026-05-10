import { Head, Link, usePage } from '@inertiajs/react';
import FaceAttendance from '@/Components/FaceAttendance';
import { useState } from 'react';

export default function VolunteerAttendance({ auth, attendances, todayRecord, totalHours, todayHours, weekHours, monthHours, activities }) {
    const { flash } = usePage().props;
    const volunteer = auth.user;
    const [search, setSearch] = useState('');

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',  href: route('volunteer.dashboard'),     icon: <DashIcon /> },
        { key: 'schedule',      label: 'Schedule',   href: route('volunteer.schedule'),      icon: <CalIcon /> },
        { key: 'communication', label: 'Messages',   href: route('volunteer.communication'), icon: <MsgIcon /> },
        { key: 'attendance',    label: 'Attendance', href: route('volunteer.attendance'),    icon: <ClockIcon /> },
        { key: 'documents',     label: '301 Docs',   href: route('volunteer.documents'),     icon: <DocIcon /> },
    ];

    const formatTime = (datetime) => {
        if (!datetime) return '—';
        return new Date(datetime).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getWeekRange = () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`;
    };

    const getStatus = (record) => {
        if (!record.time_in) return 'absent';
        const timeIn = new Date(record.time_in);
        const hour = timeIn.getHours();
        const minute = timeIn.getMinutes();
        if (hour < 8 || (hour === 8 && minute === 0)) return 'early';
        if (hour === 8 && minute <= 15) return 'ontime';
        if (!record.time_out) return 'ontime';
        return 'late';
    };

    const filtered = attendances.filter(r =>
        formatDate(r.date).toLowerCase().includes(search.toLowerCase()) ||
        (r.activity?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleLogout = () => {
        document.getElementById('logout-form').submit();
    };

    return (
        <>
            <Head title="Attendance" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
                table { border-collapse: collapse; width: 100%; }
                th { font-size: 11px; font-weight: 600; color: white; text-align: left; padding: 11px 16px; background: #CC0000; }
                td { font-size: 12px; color: #333; padding: 11px 16px; border-bottom: 0.5px solid #f5f5f5; }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: #fafafa; }
            `}</style>

            <form id="logout-form" method="POST" action={route('logout')} style={{ display: 'none' }}>
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
            </form>

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
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Red Cross</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>Muntinlupa Branch</div>
                            </div>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '6px' }}>Menu</div>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'attendance';
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
                <div style={{ marginLeft: '210px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Topbar */}
                    <header style={{
                        height: '54px', background: 'white', borderBottom: '1px solid #ebebeb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Attendance</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input
                                    placeholder="Search records..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ border: '1px solid #ebebeb', borderRadius: '8px', padding: '6px 12px 6px 28px', fontSize: '11px', width: '180px', outline: 'none', background: '#f9f9f9', color: '#333' }}
                                />
                            </div>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: '28px' }}>

                        {/* Flash */}
                        {flash?.success && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '11px 16px', marginBottom: '20px', fontSize: '12px', color: '#166534' }}>
                                {flash.success}
                            </div>
                        )}
                        {flash?.error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '11px 16px', marginBottom: '20px', fontSize: '12px', color: '#991b1b' }}>
                                {flash.error}
                            </div>
                        )}

                        {/* Face Check-in */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '20px' }}>
                            <div style={{ padding: '13px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Check In / Check Out</span>
                                <span style={{
                                    fontSize: '9px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px',
                                    background: (todayRecord?.time_in && !todayRecord?.time_out) ? '#f0fdf4' : todayRecord?.time_out ? '#f0f9ff' : '#f5f5f5',
                                    color: (todayRecord?.time_in && !todayRecord?.time_out) ? '#16a34a' : todayRecord?.time_out ? '#0369a1' : '#999',
                                }}>
                                    {(todayRecord?.time_in && !todayRecord?.time_out) ? 'Ongoing' : todayRecord?.time_out ? 'Completed' : 'Not Started'}
                                </span>
                            </div>
                            <div style={{ padding: '16px 18px' }}>
                                <FaceAttendance todayRecord={todayRecord} activities={activities} />
                            </div>
                        </div>

                        {/* Hours Summary */}
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Hours Summary</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Today', sub: new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }), value: parseFloat(todayHours || 0).toFixed(1) },
                                { label: 'This Week', sub: getWeekRange(), value: parseFloat(weekHours || 0).toFixed(1) },
                                { label: 'This Month', sub: new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }), value: parseFloat(monthHours || 0).toFixed(1) },
                            ].map(({ label, sub, value }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '18px 20px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#111', marginBottom: '3px' }}>{label}</div>
                                    <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '10px' }}>{sub}</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>{value}</span>
                                        <span style={{ fontSize: '10px', color: '#aaa' }}>hrs</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Records Table */}
                        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Records</span>
                            <span style={{ fontSize: '10px', color: '#aaa' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Hours</th>
                                        <th style={{ textAlign: 'center' }}>On Time</th>
                                        <th style={{ textAlign: 'center' }}>Early</th>
                                        <th style={{ textAlign: 'center' }}>Late</th>
                                        <th style={{ textAlign: 'center' }}>Absent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', color: '#ccc', padding: '32px' }}>No records found</td>
                                        </tr>
                                    ) : (
                                        filtered.map((record, i) => {
                                            const status = getStatus(record);
                                            return (
                                                <tr key={record.id || i}>
                                                    <td style={{ fontWeight: '500', color: '#111' }}>{formatDate(record.date)}</td>
                                                    <td style={{ color: '#16a34a' }}>{formatTime(record.time_in)}</td>
                                                    <td style={{ color: '#CC0000' }}>{formatTime(record.time_out)}</td>
                                                    <td style={{ fontWeight: '600', color: '#111' }}>{record.hours_rendered ? `${parseFloat(record.hours_rendered).toFixed(1)}h` : '—'}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {status === 'ontime' && <CheckMark color="#CC0000" />}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {status === 'early' && <CheckMark color="#3B82F6" />}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {status === 'late' && <XMark />}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {status === 'absent' && <XMark />}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </main>
                </div>
            </div>
        </>
    );
}

function CheckMark({ color = '#CC0000' }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
}

function XMark() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
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