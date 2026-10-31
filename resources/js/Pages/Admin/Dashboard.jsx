import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminShell from '../../Components/AdminShell';
import CreateActivityCard from '../../Components/CreateActivityCard';

const STATUS_STYLES = {
    UPCOMING:  { background: '#e0f2fe', color: '#0369a1' },
    ONGOING:   { background: '#dcfce7', color: '#15803d' },
    COMPLETED: { background: '#f0f0f0', color: '#666' },
};

const ARRIVAL = {
    early:   { label: 'Early',   style: { background: '#e0f2fe', color: '#0369a1' } },
    on_time: { label: 'On time', style: { background: '#dcfce7', color: '#15803d' } },
    late:    { label: 'Late',    style: { background: '#fef3c7', color: '#b45309' } },
};

const ARRIVAL_EXT = {
    ...ARRIVAL,
    absent: { label: 'Absent',    style: { background: '#fee2e2', color: '#b91c1c' } },
    not_in: { label: 'Not in yet', style: { background: '#f0f0f0', color: '#666' } },
};

const card = { background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', borderLeft: '4px solid #A32D2D', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.05)', overflow: 'hidden' };
const cardHead = { padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' };
const cardTitle = { fontSize: '12px', fontWeight: '600', color: '#111' };
const cardFoot = { padding: '10px 18px', borderTop: '1px solid #f5f5f5', textAlign: 'center' };
const cardMeta = { fontSize: '11px', color: '#999' };
const linkRed = { fontSize: '11px', color: '#CC0000', textDecoration: 'none', fontWeight: '600' };
const rowText = { fontSize: '12px', color: '#555' };
const tagBase = { fontSize: '10.5px', fontWeight: '600', padding: '2px 9px', borderRadius: '20px', whiteSpace: 'nowrap' };

function UpDetail({ label, icon, children }) {
    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: '1px', flexShrink: 0 }}>{icon}</svg>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#222', marginTop: '2px', lineHeight: 1.5, wordBreak: 'break-word' }}>{children}</div>
            </div>
        </div>
    );
}
function ActivityRow({ a, last, onOpen }) {
    const statusLabel = String(a.status || 'UPCOMING').charAt(0) + String(a.status || 'UPCOMING').slice(1).toLowerCase();
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen && onOpen(a)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen && onOpen(a); } }}
            style={{ padding: '12px 18px', borderBottom: last ? 'none' : '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={route('admin.activities.edit', a.id)} onClick={(e) => e.stopPropagation()} style={{ fontSize: '13px', fontWeight: '600', color: '#111', textDecoration: 'none' }}>{a.name}</Link>
                    <span style={{ ...tagBase, ...(STATUS_STYLES[a.status] || STATUS_STYLES.UPCOMING) }}>{statusLabel}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{a.start} &ndash; {a.end} &middot; {a.location_name}</div>
            </div>
            <div style={{ flexShrink: 0 }}>
                {a.volunteers_count > 0 ? (
                    <span style={{ fontSize: '12px', color: '#555' }}>{a.volunteers_count} assigned</span>
                ) : (
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#b91c1c', background: '#fee2e2', padding: '3px 10px', borderRadius: '20px' }}>No volunteers yet</span>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', padding: '9px 0', borderBottom: '1px solid #f5f5f5', fontSize: '12.5px' }}>
            <span style={{ color: '#999' }}>{label}</span>
            <span style={{ color: '#111', fontWeight: '500', textAlign: 'right' }}>{value}</span>
        </div>
    );
}

export default function AdminDashboard({
    attendance = { present: 0, late: 0, absent: 0 },
    todayPresent = [],
    absentToday = [],
    todayActivities = [],
    fieldActivities = [],
    branchActivities = [],
    reminders = [],
    upcoming = [],
}) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [actOpen, setActOpen] = useState(null);
    const [attTab, setAttTab] = useState('present');
    const [cardTab, setCardTab] = useState('present');
    const [tdTab, setTdTab] = useState('attendance');
    const [upOpen, setUpOpen] = useState(null);

    useEffect(() => {
        if (!actOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setActOpen(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [actOpen]);

    const closePanel = () => { setOpen(false); setSelected(null); };

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') closePanel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const arrivalOf = (r) => (attTab === 'absent' ? (ARRIVAL.absent || { label: 'Absent', style: { background: '#fee2e2', color: '#b91c1c' } }) : (ARRIVAL[r.arrival] || ARRIVAL.on_time));
    const lateList = todayPresent.filter((r) => r.arrival === 'late');
    const attList = attTab === 'late' ? lateList : attTab === 'absent' ? absentToday : todayPresent;
    const attCount = { present: todayPresent.length, late: lateList.length, absent: Math.max(attendance.absent || 0, absentToday.length) };
    const ATT_LABEL = { present: 'Present today', late: 'Late today', absent: 'Absent today' };
    const attEmpty = { present: 'No one is present yet today.', late: 'No one is late today.', absent: (attendance.absent || 0) > 0 ? 'Absent names are not available yet.' : 'No one is absent today.' };
    const openAtt = (t) => { setAttTab(t); setOpen(true); };
    const initialsOf = (name) =>
        String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

    const todays = todayActivities.length > 0 ? todayActivities : [...fieldActivities, ...branchActivities];
    const shownToday = todays.slice(0, 3);
    const shownUpcoming = upcoming.slice(0, 3);

    return (
        <AdminShell active="dashboard" title="Dashboard">
            <style>{`
                .qa-ghost:hover { background: #f5f5f6 !important; }
                .att-row:hover { background: #fafafa; }
                .rem-row:hover { background: #fafafa; }
                .fab-wrap { position: fixed; right: 24px; bottom: 24px; z-index: 50; display: flex; align-items: center; gap: 10px; }
                .fab-label { background: #222; color: white; font-size: 12px; padding: 6px 10px; border-radius: 8px; opacity: 0; transition: opacity .15s; pointer-events: none; white-space: nowrap; }
                .fab-wrap:hover .fab-label { opacity: 1; }
                .fab-btn { width: 54px; height: 54px; border-radius: 50%; background: #CC0000; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(204,0,0,0.35); text-decoration: none; transition: background .15s, transform .15s; }
                .fab-btn:hover { background: #aa0000; transform: scale(1.06); }
                @media (max-width: 800px) { .ad-split { grid-template-columns: 1fr !important; } }
                .ad-next-spacer { height: 31px; }
                @media (max-width: 800px) { .ad-next-spacer { display: none; } }
            `}</style>

            {/* Attendance + Activities (left) and Reminders (right) */}
            <style>{`
                @media (max-width: 800px) { .ad-main { grid-template-columns: 1fr !important; } }
            `}</style>
            <div className="ad-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: '12px', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>

                    {/* Today tabs */}
                    <div role="tablist" style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', borderBottom: '1px solid #e5e5e5' }}>
                        {[['attendance', "Today's attendance"], ['activities', "Today's activities"]].map(([k, label]) => (
                            <button key={k} type="button" role="tab" aria-selected={tdTab === k} onClick={() => setTdTab(k)} style={{ border: 'none', borderBottom: '2px solid ' + (tdTab === k ? '#CC0000' : 'transparent'), marginBottom: '-1px', background: 'transparent', color: tdTab === k ? '#222' : '#777', fontWeight: tdTab === k ? '600' : '500', borderRadius: '0', padding: '8px 14px', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
                        ))}
                    </div>
                    {tdTab === 'attendance' && (
                    /* Attendance */
                    <div style={{ background: '#fff', border: '1px solid #ececec', borderLeft: '4px solid #A32D2D', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.05)', borderRadius: '12px', padding: '12px 14px 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Today&apos;s attendance</span>
                            <span style={{ fontSize: '18px', fontWeight: '600', color: '#111', lineHeight: 1 }}>
                                {attendance.present}
                                <span style={{ fontSize: '12px', fontWeight: '400', color: '#999' }}> / {attendance.present + attendance.absent}</span>
                            </span>
                        </div>

                        <div role="tablist" style={{ display: 'flex', margin: '10px 0 2px', border: '1px solid #e4e4e4', borderRadius: '7px', overflow: 'hidden' }}>
                            {[['present', 'Present', attendance.present, '#15803d'], ['absent', 'Absent', attendance.absent, '#C8102E']].map(([key, label, count, color]) => (
                                <button key={key} type="button" role="tab" aria-selected={cardTab === key} onClick={() => setCardTab(key)} style={{ flex: 1, padding: '6px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: cardTab === key ? '600' : '400', background: cardTab === key ? color : '#fff', color: cardTab === key ? '#fff' : '#555' }}>
                                    {label} {count}
                                </button>
                            ))}
                        </div>

                        {(() => {
                            const mins = (s) => {
                                const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s || '');
                                if (!m) return 0;
                                return ((Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]);
                            };
                            const isPresent = cardTab === 'present';
                            const all = isPresent ? todayPresent : absentToday;
                            const rows = (isPresent ? [...all].sort((a, b) => mins(b.time_in) - mins(a.time_in)) : all).slice(0, 3);
                            if (rows.length === 0) {
                                return <div style={{ padding: '10px 0', fontSize: '12px', color: '#777' }}>{isPresent ? 'No one is present yet today.' : 'No one is absent today.'}</div>;
                            }
                            return rows.map((r, i) => (
                                <div key={r.id} role="button" tabIndex={0} onClick={() => { if (isPresent) { setAttTab('present'); setSelected(r); setOpen(true); } else { setAttTab('absent'); setSelected(r); setOpen(true); } }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click(); }} onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '30px', padding: '0 12px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #f2f2f2', fontSize: '12px', color: isPresent ? '#111' : '#C8102E' }}>
                                    <span><span style={{ color: '#999', marginRight: '6px' }}>{i + 1}.</span>{r.volunteer}</span>
                                    <span style={{ color: isPresent ? '#555' : '#C8102E' }}>{isPresent ? r.time_in : 'Absent'}</span>
                                </div>
                            ));
                        })()}

                    </div>

                    )}
                    {tdTab === 'activities' && (
                    /* Today's activities (Field and Branch together) */
                    <div style={card}>
                        <div style={cardHead}>
                            <span style={cardTitle}>Today&apos;s Activities</span>
                            <span style={cardMeta}>{todays.length > 3 ? `3 of ${todays.length}` : `${todays.length} today`}</span>
                        </div>
                        {shownToday.length === 0 ? (
                            <p style={{ padding: '22px 18px', fontSize: '12.5px', color: '#bbb', textAlign: 'center', margin: 0 }}>
                                No activities today.
                            </p>
                        ) : (
                            shownToday.map((a, i) => <ActivityRow key={a.id} a={a} last={i === shownToday.length - 1} onOpen={setActOpen} />)
                        )}
                        <div style={cardFoot}>
                            <Link href={route('admin.activities.index')} style={linkRed}>View all</Link>
                        </div>
                    </div>

                    )}
                    {/* Upcoming this week */}
                    <div style={card}>
                        <div style={cardHead}>
                            <span style={cardTitle}>Upcoming this week</span>
                            <span style={cardMeta}>{shownUpcoming.length} {shownUpcoming.length === 1 ? 'activity' : 'activities'}</span>
                        </div>
                        {shownUpcoming.length === 0 ? (
                            <p style={{ padding: '22px 18px', fontSize: '12.5px', color: '#bbb', textAlign: 'center', margin: 0 }}>
                                No activities scheduled for the next 7 days.
                            </p>
                        ) : (
                            shownUpcoming.map((u, i) => (
                                <div key={u.id} style={{ borderBottom: i === shownUpcoming.length - 1 ? 'none' : '1px solid #f5f5f5' }}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={upOpen === u.id}
                                        onClick={() => setUpOpen(upOpen === u.id ? null : u.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUpOpen(upOpen === u.id ? null : u.id); } }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = upOpen === u.id ? '#fafafa' : 'transparent'; }}
                                        style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', cursor: 'pointer', transition: 'background 0.15s', background: upOpen === u.id ? '#fafafa' : 'transparent' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{u.name}</div>
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{u.date_label} &middot; {u.time_range}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {u.volunteers_count > 0 ? (
                                                <span style={{ fontSize: '12px', color: '#555' }}>{u.volunteers_count} assigned</span>
                                            ) : (
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#b91c1c', background: '#fee2e2', padding: '3px 10px', borderRadius: '20px' }}>
                                                    No volunteers yet
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {upOpen === u.id && (
                                        <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <UpDetail label="Date" icon={<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}>{u.date_label}</UpDetail>
                                            <UpDetail label="Time" icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}>{u.time_range}</UpDetail>
                                            <UpDetail label="Location" icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>}>{u.location_name}</UpDetail>
                                            <UpDetail label="Assignment" icon={<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>}>{u.description || 'No assignment specified.'}</UpDetail>
                                            <UpDetail label="Assigned by" icon={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}>{u.assigned_by || '\u2014'}</UpDetail>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div style={cardFoot}>
                            <Link href={route('admin.activities.index', { status: 'upcoming' })} style={linkRed}>View all</Link>
                        </div>
                    </div>
                </div>

                {/* Quick create + Reminders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                <div className="ad-next-spacer" aria-hidden="true" />
                <CreateActivityCard />
                <div style={card}>
                    <div style={cardHead}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" /><path d="M9 15l-4.5 4.5" /><path d="M14.5 4l5.5 5.5" /></svg><span style={{ ...cardTitle, color: '#A32D2D' }}>Reminders</span></span>
                        {reminders.length > 0 && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>{reminders.length} need{reminders.length === 1 ? 's' : ''} your attention</span>}
                    </div>
                    {reminders.length === 0 ? (
                        <p style={{ padding: '20px 18px', fontSize: '12.5px', color: '#15803d', margin: 0 }}>
                            &#10003; You&apos;re all caught up. No pending reminders.
                        </p>
                    ) : (
                        reminders.map((r, i) => (
                            <Link
                                key={i}
                                href={r.href}
                                className="rem-row"
                                style={{ padding: '12px 18px', borderBottom: i === reminders.length - 1 ? 'none' : '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', textDecoration: 'none' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#333' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.level === 'high' ? '#CC0000' : '#BA7517', flexShrink: 0 }} />
                                    {r.text}
                                </span>
                                <span aria-hidden="true" style={{ color: '#bbb', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>&rsaquo;</span>
                            </Link>
                        ))
                    )}
                </div>
                </div>
            </div>
            <div style={{ paddingBottom: '80px' }} />


            {/* Activity details + assigned volunteers */}
            {actOpen && (
                <div
                    onClick={() => setActOpen(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#111', wordBreak: 'break-word' }}>{actOpen.name}</span>
                            <button type="button" onClick={() => setActOpen(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', lineHeight: 1, color: '#999', cursor: 'pointer', padding: 0 }}>&times;</button>
                        </div>

                        <div style={{ overflowY: 'auto' }}>
                            <div data-act-matched="1" style={{ padding: '12px 18px 16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#A32D2D', marginBottom: '2px' }}>Activity</div>
                                <DetailRow label="Type" value={actOpen.type === 'branch' ? 'Branch Activity' : 'Field Activity'} />
                                <DetailRow label="Date" value={actOpen.date} />
                                <DetailRow label="Schedule" value={`${actOpen.start} \u2013 ${actOpen.end}`} />
                                <DetailRow label="Location" value={actOpen.location_name || '-'} />
                                <DetailRow label="Status" value={String(actOpen.status || '-').charAt(0).toUpperCase() + String(actOpen.status || '-').slice(1).toLowerCase()} />
                                <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '6px', paddingTop: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#A32D2D', marginBottom: '4px' }}>
                                        Assigned volunteers ({(actOpen.volunteers || []).length})
                                    </div>
                                    {(actOpen.volunteers || []).length === 0 ? (
                                        <p style={{ fontSize: '12.5px', color: '#bbb', margin: '8px 0 0' }}>No volunteers assigned yet.</p>
                                    ) : (
                                        actOpen.volunteers.map((v, i) => {
                                            const b = ARRIVAL_EXT[v.arrival] || ARRIVAL_EXT.not_in;
                                            return (
                                                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 0', borderBottom: i === actOpen.volunteers.length - 1 ? 'none' : '1px solid #f5f5f5' }}>
                                                    <span style={{ fontSize: '12px', color: '#999', minWidth: '16px' }}>{i + 1}.</span>
                                                    <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: '600', color: '#111', wordBreak: 'break-word' }}>{v.name}</span>
                                                    {v.time_in && <span style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>in {v.time_in}</span>}
                                                    <span style={{ ...b.style, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{b.label}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Today's attendance panel */}
            {open && (
                <div
                    onClick={closePanel}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        <div style={selected ? { padding: '14px 18px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' } : { padding: '16px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            {selected ? (
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#111', wordBreak: 'break-word' }}>{selected.volunteer}</span>
                                        {selected.arrival === 'absent' && <span style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>Absent today</span>}
                                    </div>
                                </div>
                            ) : (
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>
                                    {ATT_LABEL[attTab]} ({attCount[attTab]})
                                </span>
                            )}
                            <button type="button" onClick={closePanel} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', lineHeight: 1, color: '#999', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {!selected && (
                            <div style={{ display: 'flex', gap: '6px', padding: '10px 18px', borderBottom: '1px solid #f5f5f5' }}>
                                {[['present', 'Present'], ['absent', 'Absent']].map(([k, label]) => (
                                    <button key={k} type="button" onClick={() => setAttTab(k)} style={{ border: '1px solid ' + (attTab === k ? '#CC0000' : '#e0e0e0'), background: attTab === k ? '#CC0000' : 'white', color: attTab === k ? 'white' : '#555', borderRadius: '8px', padding: '5px 12px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {label} ({attCount[k]})
                                    </button>
                                ))}
                            </div>
                        )}
                        <div style={{ overflowY: 'auto' }}>
                            {!selected ? (
                                attList.length === 0 ? (
                                    <p style={{ padding: '28px 18px', fontSize: '12.5px', color: '#bbb', textAlign: 'center', margin: 0 }}>
                                        {attEmpty[attTab]}
                                    </p>
                                ) : (
                                    attList.map((r, i) => (
                                        <div key={r.id} className="att-row" style={{ padding: '12px 18px', borderBottom: i === attList.length - 1 ? 'none' : '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{r.volunteer}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <span style={{ ...arrivalOf(r).style, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' }}>
                                                        {arrivalOf(r).label}
                                                    </span>
                                                    {r.time_in && <span style={{ fontSize: '11px', color: '#999' }}>in {r.time_in}</span>}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelected(r)} hidden={attTab === 'absent'}
                                                className="qa-ghost"
                                                style={{ background: 'white', color: '#555', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '7px 12px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
                                            >
                                                View their activity
                                            </button>
                                        </div>
                                    ))
                                )
                            ) : selected.arrival === 'absent' ? (
<div data-absent-detail="1" style={{ padding: '14px 18px 16px' }}>
                                    {selected.activity ? (
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#A32D2D', marginBottom: '2px' }}>Activity</div>
                                            <DetailRow label="Name" value={selected.activity.name} />
                                            <DetailRow label="Type" value={selected.activity.type === 'branch' ? 'Branch Activity' : 'Field Activity'} />
                                            <DetailRow label="Date" value={selected.activity.date} />
                                            <DetailRow label="Schedule" value={`${selected.activity.start} \u2013 ${selected.activity.end}`} />
                                            <DetailRow label="Location" value={selected.activity.location_name || '-'} />
                                            <DetailRow label="Status" value={String(selected.activity.status || '-').charAt(0).toUpperCase() + String(selected.activity.status || '-').slice(1).toLowerCase()} />
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '12.5px', color: '#bbb', margin: 0 }}>No activity assigned.</p>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '14px 18px 16px' }}>
                                    <div data-att-timeline="1" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3px' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: selected.time_in ? '#15803d' : '#fff', border: selected.time_in ? 'none' : '2px solid #ccc', boxSizing: 'border-box' }} />
                                            <span style={{ width: '2px', flex: 1, background: '#e4e4e4', margin: '3px 0' }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: selected.time_out ? '#15803d' : '#fff', border: selected.time_out ? 'none' : '2px solid #ccc', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Time in</div>
                                                    <div style={{ fontSize: '11.5px', color: '#888', marginTop: '2px' }}>{selected.time_in || '-'}</div>
                                                </div>
                                                <span style={{ ...arrivalOf(selected).style, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' }}>{arrivalOf(selected).label}</span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: selected.time_out ? '#111' : '#999' }}>Time out</div>
                                                <div style={{ fontSize: '11.5px', color: '#888', marginTop: '2px' }}>{selected.time_out || 'Not yet'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {selected.activity ? (
                                        <div data-att-activity="1" style={{ borderTop: '1px solid #f0f0f0', marginTop: '14px', paddingTop: '12px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#A32D2D', marginBottom: '2px' }}>Activity</div>
                                            <DetailRow label="Name" value={selected.activity.name} />
                                            <DetailRow label="Type" value={selected.activity.type === 'branch' ? 'Branch Activity' : 'Field Activity'} />
                                            <DetailRow label="Date" value={selected.activity.date} />
                                            <DetailRow label="Schedule" value={`${selected.activity.start} \u2013 ${selected.activity.end}`} />
                                            <DetailRow label="Location" value={selected.activity.location_name || '-'} />
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '12.5px', color: '#bbb', margin: '14px 0 0' }}>Activity details are not available.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {!selected && (
                            <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                                <Link href={route('admin.attendance.index')} style={linkRed}>Open full attendance page &rarr;</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
