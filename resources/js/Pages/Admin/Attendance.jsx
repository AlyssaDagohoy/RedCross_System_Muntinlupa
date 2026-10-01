import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminAttendance({ auth, attendances, volunteers, activities, filters }) {
    const admin = auth?.user;
    const [volunteerFilter, setVolunteerFilter] = useState(filters?.volunteer_id || '');
    const [activityFilter, setActivityFilter] = useState(filters?.activity_id || '');
    const [dateFilter, setDateFilter] = useState(filters?.date || '');

    const applyFilters = () => {
        router.get(route('admin.attendance.index'), {
            volunteer_id: volunteerFilter,
            activity_id: activityFilter,
            date: dateFilter,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setVolunteerFilter('');
        setActivityFilter('');
        setDateFilter('');
        router.get(route('admin.attendance.index'));
    };

    const handleLogout = () => router.post(route('logout'));

    const formatTime = (datetime) => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleTimeString('en-PH', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const totalHours = attendances.reduce((sum, a) => sum + parseFloat(a.hours_rendered || 0), 0);
    const volunteersWithRecords = [...new Set(attendances.map(a => a.user_id))].length;

    const exportUrl = route('admin.attendance.export.pdf') + '?' + new URLSearchParams({
        volunteer_id: volunteerFilter,
        activity_id: activityFilter,
        date: dateFilter,
    }).toString();

    const hasActiveFilters = volunteerFilter || activityFilter || dateFilter;

    const sidebarLinks = [
        { key: 'dashboard',  label: 'Dashboard',  href: route('admin.dashboard'),       icon: <DashIcon /> },
        { key: 'volunteers', label: 'Volunteers', href: route('admin.volunteers'),       icon: <PeopleIcon /> },
        { key: 'activities', label: 'Activities', href: route('admin.activities.index'), icon: <CalIcon /> },
        { key: 'attendance', label: 'Attendance', href: route('admin.attendance.index'), icon: <ClockIcon /> },
        { key: 'document-review', label: 'Document Review', href: route('admin.document-review.index'), icon: <DocIcon /> },
    ];

    return (
        <>
            <Head title="Attendance Records" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .row-hover:hover { background: #fafafa !important; }
                .btn-export:hover { background: #aa0000 !important; }
                .btn-filter:hover { background: #aa0000 !important; }
                .btn-clear:hover { background: #ececec !important; }
                select, input[type="date"] { font-family: 'Inter', sans-serif; }
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
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Attendance</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {attendances.length} record{attendances.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <a href={exportUrl} target="_blank" rel="noreferrer" className="btn-export" style={{
                                background: '#CC0000', color: 'white', padding: '8px 16px',
                                borderRadius: '7px', fontSize: '11.5px', fontWeight: '600',
                                textDecoration: 'none', transition: 'background 0.15s',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Export PDF
                            </a>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

                        {/* Header */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#CC0000', marginBottom: '5px' }}>Admin Panel</div>
                            <h1 style={{ fontSize: '22px', color: '#111', fontWeight: '700', margin: 0 }}>Attendance Records</h1>
                        </div>

                        {/* STATS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Total Records', value: attendances.length },
                                { label: 'Total Hours Rendered', value: totalHours.toFixed(2) },
                                { label: 'Volunteers with Records', value: volunteersWithRecords },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '18px 20px' }}>
                                    <div style={{ fontSize: '26px', fontWeight: '700', color: '#111' }}>{value}</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: '500' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* FILTERS */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '18px 20px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '14px' }}>Filter Records</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>VOLUNTEER</label>
                                    <select value={volunteerFilter} onChange={e => setVolunteerFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px', background: '#f9f9f9', color: '#333', outline: 'none' }}>
                                        <option value="">All Volunteers</option>
                                        {volunteers.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>ACTIVITY</label>
                                    <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px', background: '#f9f9f9', color: '#333', outline: 'none' }}>
                                        <option value="">All Activities</option>
                                        {activities.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} ({a.date})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>DATE</label>
                                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px', background: '#f9f9f9', color: '#333', outline: 'none' }} />
                                </div>
                                <button onClick={applyFilters} className="btn-filter" style={{ padding: '9px 20px', background: '#CC0000', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', transition: 'background 0.15s' }}>Filter</button>
                                <button onClick={clearFilters} className="btn-clear" style={{ padding: '9px 20px', background: '#f7f7f8', color: '#555', border: '1px solid #ebebeb', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', transition: 'background 0.15s' }}>Clear</button>
                            </div>
                            {hasActiveFilters && (
                                <div style={{ marginTop: '10px', fontSize: '10.5px', color: '#bbb' }}>Filters active — showing a subset of records.</div>
                            )}
                        </div>

                        <ReviewPanel records={attendances.filter(a => a.status === 'needs_review')} />

                        {/* TABLE */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>All Attendance Records ({attendances.length})</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fafafa' }}>
                                            {['Volunteer', 'Activity', 'Date', 'Time In', 'Time Out', 'Hours'].map(h => (
                                                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#aaa' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendances.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>No attendance records found.</td>
                                            </tr>
                                        ) : attendances.map((record) => (
                                            <tr key={record.id} className="row-hover" style={{ borderTop: '1px solid #f5f5f5', transition: 'background 0.1s' }}>
                                                <td style={{ padding: '13px 18px' }}>
                                                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#111' }}>{record.user?.name ?? '-'}</div>
                                                    <div style={{ fontSize: '10.5px', color: '#bbb', marginTop: '1px' }}>{record.user?.email ?? ''}</div>
                                                    {record.status && record.status !== 'present' && (
                                                        <span style={{
                                                            display: 'inline-block', marginTop: '5px', padding: '2px 8px', borderRadius: '8px',
                                                            fontSize: '10px', fontWeight: '700',
                                                            background: record.status === 'needs_review' ? '#fffbeb' : '#fef2f2',
                                                            color: record.status === 'needs_review' ? '#b45309' : '#CC0000',
                                                        }}>
                                                            {record.status === 'absent' ? 'Absent' : record.status === 'needs_review' ? 'Needs Review' : 'Rejected'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#555' }}>{record.activity?.name ?? '-'}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#555' }}>{formatDate(record.date)}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>{formatTime(record.time_in)}<TimeInBadge record={record} /></td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#CC0000', fontWeight: '600' }}>{formatTime(record.time_out)}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#111', fontWeight: '600' }}>
                                                    {record.hours_rendered ? record.hours_rendered + ' hrs' : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </>
    );
}

function ReviewPanel({ records }) {
    const [active, setActive] = useState(null);
    const [remark, setRemark] = useState('');
    const [adjTime, setAdjTime] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    if (!records || records.length === 0) return null;

    const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

    const open = (record, action) => {
        setActive({ record, action });
        setRemark('');
        setAdjTime(record.activity?.end_time ? record.activity.end_time.slice(0, 5) : '');
        setErr('');
    };
    const close = () => { setActive(null); setErr(''); };

    const submit = () => {
        setBusy(true);
        router.post(route('admin.attendance.review', active.record.id), {
            action: active.action,
            remark: remark,
            time_out: active.action === 'adjust' ? adjTime : null,
        }, {
            preserveScroll: true,
            onSuccess: () => close(),
            onError: (e) => setErr(Object.values(e)[0] || 'Something went wrong.'),
            onFinish: () => setBusy(false),
        });
    };

    const titles = { approve: 'Approve attendance', adjust: 'Adjust Time Out', reject: 'Reject attendance' };
    const btn = { padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: '1px solid #ebebeb', background: 'white', color: '#444' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>Needs Review ({records.length})</span>
                <span style={{ fontSize: '11px', color: '#b45309', marginLeft: '8px' }}>Missing Time Outs and review requests waiting for your decision.</span>
            </div>

            {records.map(r => (
                <div key={r.id} style={{ padding: '14px 18px', borderTop: '1px solid #f5f5f5', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#111' }}>{r.user?.name ?? '-'}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                            {r.activity?.name ?? '-'} · {fmtDate(r.date)} · Time In {fmtTime(r.time_in)} · Time Out {fmtTime(r.time_out)}
                        </div>
                        <div style={{ fontSize: '11px', color: r.review_reason ? '#444' : '#b45309', marginTop: '4px' }}>
                            {r.review_reason ? 'Volunteer\'s reason: ' + r.review_reason : 'Missing Time Out (closed automatically)'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={() => open(r, 'approve')} style={{ ...btn, background: '#16a34a', border: 'none', color: 'white' }}>Approve</button>
                        <button type="button" onClick={() => open(r, 'adjust')} style={btn}>Adjust</button>
                        <button type="button" onClick={() => open(r, 'reject')} style={{ ...btn, color: '#CC0000' }}>Reject</button>
                    </div>
                </div>
            ))}

            {active && (
                <div role="presentation" onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: '16px', zIndex: 3000 }}>
                    <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '380px', padding: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{titles[active.action]}</div>
                        <div style={{ fontSize: '11.5px', color: '#888', margin: '4px 0 14px' }}>
                            {active.record.user?.name} · {active.record.activity?.name}
                        </div>

                        {active.action === 'approve' && (
                            <div style={{ fontSize: '12px', color: '#555', marginBottom: '12px', lineHeight: '1.6' }}>
                                Time Out is set to the scheduled end of the activity, so hours are counted only until then.
                            </div>
                        )}

                        {active.action === 'adjust' && (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px' }}>NEW TIME OUT</label>
                                <input type="time" value={adjTime} onChange={e => setAdjTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px' }} />
                            </div>
                        )}

                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px' }}>
                            ADMIN REMARK {active.action === 'approve' ? '(optional)' : '(required)'}
                        </label>
                        <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical' }} />

                        {err && <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#991b1b' }}>{err}</div>}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button type="button" onClick={close} style={{ ...btn, flex: 1, padding: '10px' }}>Cancel</button>
                            <button type="button" onClick={submit} disabled={busy} style={{ ...btn, flex: 1, padding: '10px', background: '#CC0000', border: 'none', color: 'white' }}>
                                {busy ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Late = timed in more than 15 minutes after the activity start (same rule as the running timer).
function isLate(record) {
    const start = record.activity?.start_time;
    if (!record.time_in || record.status === 'absent') return false;
    if (record.time_in_status) return record.time_in_status === 'late';
    if (!start) return false;
    const inDate = new Date(record.time_in);
    const [h, m] = start.split(':').map(Number);
    const scheduled = new Date(inDate);
    scheduled.setHours(h, m, 0, 0);
    return (inDate - scheduled) / 60000 > 15;
}

function TimeInBadge({ record }) {
    if (!record.time_in || record.status === 'absent') return null;
    const s = record.time_in_status || (isLate(record) ? 'late' : null);
    if (!s) return null;
    const palette = {
        early:   { color: '#1d4ed8', background: '#eff6ff' },
        on_time: { color: '#15803d', background: '#f0fdf4' },
        late:    { color: '#CC0000', background: '#fef2f2' },
    };
    const p = palette[s] || { color: '#4b5563', background: '#f3f4f6' };
    const label = s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return <span style={{ marginLeft: '6px', fontSize: '9.5px', fontWeight: '700', color: p.color, background: p.background, padding: '2px 6px', borderRadius: '8px' }}>{label}</span>;
}
function DashIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function CalIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ClockIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function PeopleIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function DocIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
