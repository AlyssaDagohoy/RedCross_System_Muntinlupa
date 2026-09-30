import { useMemo, useState, useRef, useEffect } from 'react';
import VolunteerShell from '@/Components/VolunteerShell';

/* ------------------------------------------------------------------ */
/*  My Records — attendance + activity history, most recent first.     */
/*  Grouped by month, with a month filter and a segmented              */
/*  attendance-status pill filter. Row view only; expanding a row      */
/*  shows all details in a single row.                                 */
/*                                                                      */
/*  Fed by RecordsController@index:                                    */
/*    attendances: [{ id, date, time_in, time_out, hours_rendered,     */
/*                     attendance_method, attendance_status,           */
/*                     activity_name, location_name, assignment,       */
/*                     assigned_by, activity_status }]                 */
/*    totalHours: number (no longer displayed)                         */
/* ------------------------------------------------------------------ */

const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatDateShort = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const methodLabel = (method) => {
    if (method === 'face') return 'Face Recognition';
    if (method === 'fingerprint') return 'Fingerprint';
    return 'Not recorded';
};

const monthLabel = (key) => {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

function groupByMonth(list) {
    const groups = [];
    let current = null;
    list.forEach((a) => {
        const key = String(a.date).slice(0, 7);
        if (!current || current.key !== key) {
            current = { key, label: monthLabel(key), items: [] };
            groups.push(current);
        }
        current.items.push(a);
    });
    return groups;
}

const STATUS_FILTERS = [
    { key: 'all', label: 'All', dot: null },
    { key: 'present', label: 'Present', dot: '#16a34a' },
    { key: 'absent', label: 'Absent', dot: '#b8860b' },
];

export default function Records({ attendances = [] }) {
    const [openId, setOpenId] = useState(null);
    const [month, setMonth] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const tabRefs = useRef({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const sortedAttendances = useMemo(() => {
        return [...attendances].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            if (dateA !== dateB) return dateB - dateA;

            const timeA = a.time_in ? new Date(a.time_in).getTime() : 0;
            const timeB = b.time_in ? new Date(b.time_in).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;

            return (b.id ?? 0) - (a.id ?? 0);
        });
    }, [attendances]);

    const currentMonthKey = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const monthOptions = useMemo(() => {
        const keys = new Set();
        sortedAttendances.forEach((a) => {
            if (a.date) keys.add(String(a.date).slice(0, 7));
        });
        return Array.from(keys).sort().reverse();
    }, [sortedAttendances]);

    // Month filter first, so pill counts reflect the selected month.
    const monthFiltered = useMemo(() => {
        return sortedAttendances.filter((a) => {
            const key = String(a.date).slice(0, 7);
            return month === 'all' || (month === 'this-month' ? key === currentMonthKey : key === month);
        });
    }, [sortedAttendances, month, currentMonthKey]);

    const statusCount = (key) => {
        if (key === 'all') return monthFiltered.length;
        return monthFiltered.filter((a) => (a.attendance_status ?? '').toLowerCase() === key).length;
    };

    const filtered = useMemo(() => {
        if (statusFilter === 'all') return monthFiltered;
        return monthFiltered.filter((a) => (a.attendance_status ?? '').toLowerCase() === statusFilter);
    }, [monthFiltered, statusFilter]);

    const groups = useMemo(() => groupByMonth(filtered), [filtered]);
    const hasFilters = month !== 'all' || statusFilter !== 'all';

    useEffect(() => {
        const el = tabRefs.current[statusFilter];
        if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }, [statusFilter, monthFiltered.length]);

    return (
        <VolunteerShell active="records" title="My Records">
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '18px' }}>
                    <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#111', letterSpacing: '-0.2px' }}>My Records</h1>
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '3px' }}>
                        Your complete volunteer activity history, most recent first
                    </p>
                </div>

                {/* Status pills + month filter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{
                        position: 'relative', display: 'inline-flex', alignItems: 'center',
                        background: '#f2f2f3', borderRadius: '11px', padding: '3px', gap: '2px',
                    }}>
                        <span style={{
                            position: 'absolute', top: '3px', bottom: '3px',
                            left: indicator.left, width: indicator.width,
                            background: 'white', borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                        {STATUS_FILTERS.map((f) => {
                            const active = statusFilter === f.key;
                            return (
                                <button
                                    key={f.key}
                                    ref={(el) => { tabRefs.current[f.key] = el; }}
                                    type="button"
                                    onClick={() => setStatusFilter(f.key)}
                                    style={{
                                        position: 'relative', zIndex: 1,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '7px 13px', border: 'none', background: 'transparent',
                                        cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {f.dot && (
                                        <span style={{
                                            width: '5px', height: '5px', borderRadius: '50%',
                                            background: f.dot, flexShrink: 0, opacity: active ? 1 : 0.55,
                                        }} />
                                    )}
                                    <span style={{
                                        fontSize: '11.5px', fontWeight: active ? '600' : '500',
                                        color: active ? '#111' : '#888', transition: 'color 0.15s',
                                    }}>{f.label}</span>
                                    <span style={{ fontSize: '10px', fontWeight: '600', color: active ? '#aaa' : '#bbb' }}>
                                        {statusCount(f.key)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            style={{
                                padding: '8px 12px', fontSize: '12px', fontFamily: 'inherit', fontWeight: '500',
                                border: '1px solid #ebebeb', borderRadius: '9px', background: 'white',
                                color: '#333', cursor: 'pointer',
                            }}
                        >
                            <option value="all">All months</option>
                            <option value="this-month">This month</option>
                            {monthOptions.map((key) => (
                                <option key={key} value={key}>{monthLabel(key)}</option>
                            ))}
                        </select>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={() => { setMonth('all'); setStatusFilter('all'); }}
                                style={{
                                    padding: '8px 14px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit',
                                    border: 'none', borderRadius: '9px', background: '#fdeaea', color: '#CC0000', cursor: 'pointer',
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <RecordGroups groups={groups} openId={openId} setOpenId={setOpenId} />
            </div>
        </VolunteerShell>
    );
}

/* ------------------------------ Record groups (by month) ------------------------------ */

function RecordGroups({ groups, openId, setOpenId }) {
    if (groups.length === 0) {
        return (
            <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '14px' }}>
                <EmptyState text="No matching records" />
            </div>
        );
    }

    return groups.map((group, gi) => (
        <div key={group.key} style={{ marginBottom: gi < groups.length - 1 ? '20px' : 0 }}>
            <MonthDivider label={group.label} count={group.items.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((a) => (
                    <RecordRow key={a.id} a={a} isOpen={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} />
                ))}
            </div>
        </div>
    ));
}

function MonthDivider({ label, count }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#999', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{label}</span>
            <div style={{ flex: 1, height: '1px', background: '#ebebeb' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#bbb' }}>{count} record{count !== 1 ? 's' : ''}</span>
        </div>
    );
}

/* ------------------------------ Record row (click to expand) ------------------------------ */

function RecordRow({ a, isOpen, onToggle }) {
    return (
        <div style={{
            background: 'white', border: '1px solid #ebebeb', borderRadius: '12px',
            overflow: 'hidden', borderColor: isOpen ? '#f0d6d6' : '#ebebeb',
            boxShadow: isOpen ? '0 2px 10px rgba(204,0,0,0.06)' : 'none',
        }}>
            <button
                type="button"
                onClick={onToggle}
                className="record-row-btn"
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                }}
            >
                <div style={{
                    width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                    background: '#fdf2f2', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', lineHeight: '1',
                }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: '#CC0000', textTransform: 'uppercase' }}>
                        {formatDateShort(a.date).split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#111', marginTop: '1px' }}>
                        {formatDateShort(a.date).split(' ')[1]}
                    </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '650', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.activity_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#999', marginTop: '3px' }}>
                        <span>{formatTime(a.time_in)} – {formatTime(a.time_out)}</span>
                        {a.location_name && (
                            <>
                                <span style={{ color: '#ddd' }}>·</span>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.location_name}</span>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#111' }}>{Number(a.hours_rendered ?? 0).toFixed(1)}h</div>
                        <div style={{ marginTop: '3px' }}><ActivityStatusPill status={a.activity_status} compact /></div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div style={{ borderTop: '1px solid #f5f5f5', padding: '16px', background: '#fafafa' }}>
                    <DetailRow a={a} />
                </div>
            )}

            <style>{`.record-row-btn:hover{background:#fafafa}`}</style>
        </div>
    );
}

/* Details laid out in a single row (scrolls sideways on narrow screens). */
function DetailRow({ a }) {
    const fields = [
        { icon: <CalendarIcon size={13} />, label: 'Date', value: formatDate(a.date) },
        { icon: <FingerprintIcon size={13} />, label: 'Method', value: methodLabel(a.attendance_method) },
        { icon: <ClockIcon size={13} />, label: 'Time In', value: formatTime(a.time_in) },
        { icon: <ClockIcon size={13} />, label: 'Time Out', value: formatTime(a.time_out) },
        { icon: <PinIcon size={13} />, label: 'Location', value: a.location_name },
        { icon: <ClipboardIcon size={13} />, label: 'Assignment', value: a.assignment },
        { icon: <UserIcon size={13} />, label: 'Assigned By', value: a.assigned_by },
    ];

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                {fields.map((f) => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ color: '#bbb', marginTop: '2px', flexShrink: 0 }}>{f.icon}</div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{f.label}</div>
                            <div style={{ fontSize: '12.5px', color: '#222', marginTop: '2px', wordBreak: 'break-word' }}>{f.value ?? '—'}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#999' }}>Attendance:</span>
                <StatusPill status={a.attendance_status} />
                <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', marginLeft: '10px' }}>Activity:</span>
                <ActivityStatusPill status={a.activity_status} />
            </div>
        </div>
    );
}

function StatusPill({ status }) {
    const present = status === 'Present';
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
            fontSize: '10.5px', fontWeight: '650',
            background: present ? '#e9f8ee' : '#fff7e6',
            color: present ? '#1a8a3d' : '#b8860b',
        }}>
            {status ?? '—'}
        </span>
    );
}

function ActivityStatusPill({ status, compact }) {
    const label = (status ?? '—').toString().toUpperCase();
    const completed = label === 'COMPLETED';
    return (
        <span style={{
            display: 'inline-block', padding: compact ? '2px 8px' : '3px 10px', borderRadius: '999px',
            fontSize: compact ? '9px' : '10.5px', fontWeight: '650',
            background: completed ? '#e9f8ee' : '#f0f0f1',
            color: completed ? '#1a8a3d' : '#666',
        }}>
            {label}
        </span>
    );
}

function EmptyState({ text }) {
    return (
        <div style={{ padding: '56px 16px', textAlign: 'center' }}>
            <div style={{ color: '#ddd', marginBottom: '10px' }}><ListIcon size={30} /></div>
            <div style={{ color: '#bbb', fontSize: '12.5px' }}>{text}</div>
        </div>
    );
}

/* ------------------------------ Icons ------------------------------ */

function ClockIcon({ size = 16 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function CalendarIcon({ size = 16 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ListIcon({ size = 16 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function PinIcon({ size = 13 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function ClipboardIcon({ size = 13 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6v4H9z"/><rect x="4" y="4" width="16" height="18" rx="2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg>;
}
function UserIcon({ size = 13 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function FingerprintIcon({ size = 13 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5"/><path d="M7 15a5 5 0 0 1 5-5"/><path d="M4 12a8 8 0 0 1 15-4"/><path d="M20 12a8 8 0 0 1-3 6.3"/></svg>;
}
