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

const card = { background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.05)', overflow: 'hidden' };
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
function ActivityRow({ a, last, onOpen, open, extra, compact }) {
    const toggle = () => onOpen && onOpen(open ? null : a);
    const statusLabel = String(a.status || 'UPCOMING').charAt(0) + String(a.status || 'UPCOMING').slice(1).toLowerCase();
    return (
        <div style={{ borderBottom: last ? 'none' : '1px solid #f5f5f5', background: open ? '#fafafa' : 'transparent' }}>
        <div
            role="button"
            tabIndex={0}
            onClick={toggle}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
            style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={route('admin.activities.edit', a.id)} onClick={(e) => e.stopPropagation()} style={{ fontSize: '13px', fontWeight: '600', color: '#111', textDecoration: 'none' }}>{a.name}</Link>
                    <span style={{ ...tagBase, ...(STATUS_STYLES[a.status] || STATUS_STYLES.UPCOMING) }}>{statusLabel}</span>
                </div>
                {compact ? (<div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{a.date} &middot; {a.start} &ndash; {a.end}</div>) : (<div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{a.start} &ndash; {a.end} &middot; {a.location_name}</div>)}
                <div style={{ fontSize: '11.5px', color: '#CC0000', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{open ? 'Hide details' : 'Show details'}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" /></svg></div>
            </div>
            <div style={{ flexShrink: 0 }}>
                {a.volunteers_count > 0 ? (
                    <span style={{ fontSize: '12px', color: '#555' }}>{a.volunteers_count} assigned</span>
                ) : (
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#b91c1c', background: '#fee2e2', padding: '3px 10px', borderRadius: '20px' }}>No volunteers yet</span>
                )}
            </div>
        </div>
        {open && extra}
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

function StatCard({ href, title, sub, ring, lines = [], pill }) {
    const R = 20;
    const C = 2 * Math.PI * R;
    const frac = ring.max > 0 ? Math.min(1, Math.max(0, ring.value / ring.max)) : 0;
    const tone = ({
        good:    { background: '#e9f8ee', color: '#15803d' },
        warn:    { background: '#fff4e0', color: '#b45309' },
        neutral: { background: '#f1f2f4', color: '#555' },
    })[pill.tone] || { background: '#f1f2f4', color: '#555' };
    return (
        <Link href={href} className="ad-stat" style={{ display: 'block', position: 'relative', textDecoration: 'none', background: '#fff', border: '1px solid #ebebeb', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.04)', transition: 'box-shadow .15s' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', top: '12px', right: '12px' }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="52" height="52" viewBox="0 0 52 52" role="img" aria-label={`${title}: ${ring.center}`} style={{ flexShrink: 0 }}>
                    <circle cx="26" cy="26" r={R} fill="none" stroke="#eeeeee" strokeWidth="6" />
                    {frac > 0 && <circle cx="26" cy="26" r={R} fill="none" stroke={ring.color} strokeWidth="6" strokeLinecap={frac < 1 ? 'round' : 'butt'} strokeDasharray={`${frac * C} ${C}`} transform="rotate(-90 26 26)" />}
                    <text x="26" y="30" textAnchor="middle" fontSize={String(ring.center).length > 3 ? 11 : 14} fontWeight="600" fill="#111">{ring.center}</text>
                </svg>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', paddingRight: '14px' }}>{title}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{sub}</div>
                    {lines.map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#555', marginTop: i === 0 ? '6px' : '2px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: l.dot, flexShrink: 0 }} />{l.text}
                        </div>
                    ))}
                </div>
            </div>
            <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '999px', ...tone }}>{pill.text}</span>
        </Link>
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
    stats = null,
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
                .ad-next-spacer { height: 22px; }
                @media (max-width: 800px) { .ad-next-spacer { display: none; } }
            `}</style>

            {/* Stat cards */}
            <style>{`
                .ad-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
                .ad-stat:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.07), 0 8px 16px rgba(0,0,0,0.07) !important; }
                @media (max-width: 1100px) { .ad-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 520px) { .ad-stats { grid-template-columns: 1fr; } }
            `}</style>
            {stats && (() => {
                const sign = (n) => (n >= 0 ? '+' + n : String(n));
                const arrow = (n) => (n >= 0 ? '\u2191 ' : '\u2193 ');
                const a = stats.active, ac = stats.activities, p = stats.participation, ia = stats.inactive;
                return (
                    <div className="ad-stats">
                        <StatCard href={route('admin.volunteers')} title="Active volunteers" sub="Registered volunteers"
                            ring={{ value: Math.max(0, a.count - ia.count), max: a.count, color: '#2E9E5B', center: String(a.count) }}
                            lines={[{ dot: '#2E9E5B', text: Math.max(0, a.count - ia.count) + ' recently active' }, { dot: '#c4c7ce', text: ia.count + ' not active lately' }]}
                            pill={{ text: arrow(a.new_this_month) + sign(a.new_this_month) + ' this month', tone: a.new_this_month > 0 ? 'good' : 'neutral' }} />
                        <StatCard href={route('admin.activities.index')} title="Activities this month" sub="This month"
                            ring={{ value: ac.done, max: ac.this_month, color: '#CC0000', center: String(ac.this_month) }}
                            lines={[{ dot: '#CC0000', text: ac.done + ' done' }, { dot: '#c4c7ce', text: ac.left + ' left' }]}
                            pill={{ text: arrow(ac.diff) + sign(ac.diff) + ' vs last month', tone: ac.diff > 0 ? 'good' : 'neutral' }} />
                        <StatCard href={route('admin.attendance.index')} title="Volunteer participation" sub="This month"
                            ring={{ value: p.pct, max: 100, color: '#2E9E5B', center: p.pct + '%' }}
                            lines={[{ dot: '#2E9E5B', text: p.attended + ' attended' }, { dot: '#CC0000', text: p.missed + ' missed' }]}
                            pill={{ text: arrow(p.diff) + sign(p.diff) + '% vs last month', tone: p.diff > 0 ? 'good' : 'neutral' }} />
                        <StatCard href={route('admin.volunteers')} title="Inactive volunteers" sub="No attendance in 30 days"
                            ring={{ value: ia.count, max: a.count, color: '#E08A00', center: String(ia.count) }}
                            lines={[{ dot: '#E08A00', text: ia.count + ' of ' + a.count + ' volunteers' }, { dot: '#c4c7ce', text: ia.count > 0 ? 'Worth a follow-up' : 'Everyone is active' }]}
                            pill={{ text: ia.count > 0 ? 'Needs follow-up' : 'All good', tone: ia.count > 0 ? 'warn' : 'good' }} />
                    </div>
                );
            })()}

            {/* Attendance + Activities (left) and Reminders (right) */}
            <style>{`
                @media (max-width: 800px) { .ad-main { grid-template-columns: 1fr !important; } }
            `}</style>
            <div className="ad-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: '12px', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>

                    {/* Today tabs conn */}
                    <div role="tablist" style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', flexWrap: 'wrap', position: 'relative', zIndex: 2, marginBottom: '-13px' }}>
                        {[['attendance', "Today's attendance"], ['activities', "Today's activities"]].map(([k, label]) => {
                            const on = tdTab === k;
                            return (
                                <button key={k} type="button" role="tab" aria-selected={on} onClick={() => setTdTab(k)} style={{
                                    padding: '9px 16px', fontSize: '12.5px', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer',
                                    borderRadius: '10px 10px 0 0',
                                    background: on ? '#fff' : '#efefef',
                                    color: on ? '#4b4b4b' : '#a3a3a3',
                                    border: '1px solid ' + (on ? '#e3e3e3' : '#e8e8e8'),
                                    borderBottom: '1px solid ' + (on ? '#fff' : '#ececec'),
                                }}>{label}</button>
                            );
                        })}
                    </div>
                    {tdTab === 'attendance' && (
                    /* Attendance */
                    <div style={{ background: '#fff', border: '1px solid #ececec', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.05)', borderRadius: '0 12px 12px 12px', position: 'relative', zIndex: 1, padding: '12px 14px 8px' }}>
                        {/* att-ring */}
                        {(() => {
                            const present = attendance.present || 0;
                            const total = present + (attendance.absent || 0);
                            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                            return (
                                <div style={{ margin: '0 0 6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{present} of {total} checked in</span>
                                        <span style={{ fontSize: '11px', color: '#999' }}>{pct}%</span>
                                    </div>
                                    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Attendance: ${present} of ${total} present`} style={{ height: '3px', borderRadius: '999px', background: '#e8e6e0', overflow: 'hidden', marginTop: '5px' }}>
                                        <div style={{ width: pct + '%', height: '100%', background: '#15803d', borderRadius: '999px', transition: 'width .3s ease' }} />
                                    </div>
                                </div>
                            );
                        })()}
                        <div role="tablist" style={{ display: 'flex', justifyContent: 'flex-start', gap: '4px', margin: '0 0 2px' }}>
                            {[['present', 'Present', attendance.present || 0, '#e7f5ee', '#0F6E56'], ['absent', 'Absent', attendance.absent || 0, '#fdecec', '#C8102E']].map(([key, label, count, bg, fg]) => {
                                const on = cardTab === key;
                                return (
                                    <button key={key} type="button" role="tab" aria-selected={on} onClick={() => setCardTab(key)} style={{ padding: '2px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: on ? '600' : '500', background: on ? bg : 'transparent', color: on ? fg : '#8a8a85' }}>
                                        {label} {count}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ borderTop: '1px solid #f2f2f2', paddingTop: '8px', fontSize: '12px', fontWeight: '600', color: '#111' }}>{cardTab === 'present' ? 'Present today' : 'Absent today'}</div>

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
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '22px', height: '22px', borderRadius: '50%', background: isPresent ? '#e7f5ee' : '#fdecec', color: isPresent ? '#0F6E56' : '#C8102E', fontSize: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{initialsOf(r.volunteer)}</span>{r.volunteer}</span>
                                    <span style={{ color: isPresent ? '#555' : '#C8102E' }}>{isPresent ? r.time_in : 'Absent'}</span>
                                </div>
                            ));
                        })()}
                        {(cardTab === 'present' ? todayPresent.length : absentToday.length) > 3 && (
                            <button type="button" onClick={() => openAtt(cardTab)} style={{ background: 'none', border: 'none', padding: '6px 12px 2px', color: '#6b6b66', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Show all {cardTab === 'present' ? todayPresent.length : absentToday.length}</button>
                        )}
                    </div>
                    )}
                    {tdTab === 'activities' && (
                    /* Today's activities (Field and Branch together) */
                    <div style={card}>
                        {shownToday.length === 0 ? (
                            <p style={{ padding: '22px 18px', fontSize: '12.5px', color: '#bbb', textAlign: 'center', margin: 0 }}>
                                No activities today.
                            </p>
                        ) : (
                            shownToday.map((a, i) => {
                                const isOpen = !!actOpen && !!actOpen._dd && actOpen.id === a.id;
                                const vols = a.volunteers || [];
                                return (
                                    <ActivityRow key={a.id} a={a} last={i === shownToday.length - 1} onOpen={(x) => setActOpen(x ? { ...x, _dd: true } : null)} open={isOpen} compact extra={isOpen ? (
                                        <div style={{ padding: '2px 18px 14px' }}>
                                            <div style={{ position: 'relative', padding: '6px 0 0 22px' }}>
                                                <div style={{ position: 'absolute', left: '3px', top: '16px', bottom: '16px', width: '1px', background: '#ddd' }} />
                                                {[['Where', a.location_name || '-'], ['Assignment', a.name], ['Assigned by', a.assigned_by || '-']].map(([k, v]) => (
                                                    <div key={k} style={{ position: 'relative', padding: '0 0 12px' }}>
                                                        <span style={{ position: 'absolute', left: '-22px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#bbb' }} />
                                                        <div style={{ fontSize: '11.5px', color: '#999' }}>{k}</div>
                                                        <div style={{ fontSize: '12.5px', fontWeight: '500', color: '#111', marginTop: '1px', wordBreak: 'break-word' }}>{v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#A32D2D', margin: '10px 0 4px' }}>Assigned volunteers ({vols.length})</div>
                                            {vols.length === 0 ? (
                                                <p style={{ fontSize: '12.5px', color: '#bbb', margin: '6px 0 0' }}>No volunteers assigned yet.</p>
                                            ) : vols.map((v, vi) => {
                                                const b = ARRIVAL_EXT[v.arrival] || ARRIVAL_EXT.not_in;
                                                return (
                                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                                                        <span style={{ fontSize: '12px', color: '#999', minWidth: '16px' }}>{vi + 1}.</span>
                                                        <span style={{ flex: 1, minWidth: 0, fontSize: '12.5px', fontWeight: '500', color: '#111', wordBreak: 'break-word' }}>{v.name}</span>
                                                        {v.time_in && <span style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>in {v.time_in}</span>}
                                                        <span style={{ ...b.style, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{b.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null} />
                                );
                            })
                        )}
                        <div style={cardFoot}>
                            <Link href={route('admin.activities.index')} style={linkRed}>View all</Link>
                        </div>
                    </div>

                    )}
                </div>

                {/* Quick create + Reminders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                <div className="ad-next-spacer" aria-hidden="true" />
                <CreateActivityCard />
                <div style={{ ...card, borderLeft: '4px solid #A32D2D' }}>
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
            <div style={{ paddingBottom: '80px' }} />


            {/* Activity details + assigned volunteers */}
            {actOpen && !actOpen._dd && (
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
