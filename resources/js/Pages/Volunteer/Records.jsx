import { useMemo, useState, useRef, useEffect } from 'react';
import VolunteerShell from '@/Components/VolunteerShell';
import StatusDonut from '@/Components/StatusDonut';
import SummaryStats from '@/Components/SummaryStats';

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
    { key: 'excused', label: 'Excused', dot: '#3b82f6' },
    { key: 'needs_review', label: 'Needs review', dot: '#f59e0b' },
];

const RECORD_COLUMNS = [
    { key: 'date', label: 'Date', essential: true },
    { key: 'activity', label: 'Activity' },
    { key: 'location', label: 'Location' },
    { key: 'assignment', label: 'Assignment' },
{ key: 'by', label: 'Assigned by' },
    { key: 'in', label: 'Time in', essential: true },
    { key: 'out', label: 'Time out', essential: true },
    { key: 'hours', label: 'Hours', essential: true },
    { key: 'status', label: 'Status', essential: true },
];
const ALL_COLUMN_KEYS = RECORD_COLUMNS.map((c) => c.key);
const DEFAULT_COLUMN_KEYS = ['date', 'activity', 'location', 'assignment', 'by', 'in', 'out', 'hours', 'status'];
const ESSENTIAL_COLUMN_KEYS = RECORD_COLUMNS.filter((c) => c.essential).map((c) => c.key);
const TIME_LOG_KEYS = ['date', 'in', 'out', 'hours'];

function RecordsColsPopover({ cols, setCols, toggleCol, onClose }) {
    const shown = RECORD_COLUMNS.filter((c) => cols.includes(c.key));
    const sameAs = (keys) => cols.length === keys.length && keys.every((k) => cols.includes(k));
    const presets = [
        { label: 'Essential', keys: ESSENTIAL_COLUMN_KEYS },
        { label: 'Time log', keys: TIME_LOG_KEYS },
        { label: 'All', keys: ALL_COLUMN_KEYS },
    ];

    return (
        <div role="dialog" aria-label="Customize columns" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20, width: '300px', maxWidth: 'calc(100vw - 48px)', boxSizing: 'border-box', background: 'white', border: '1px solid #e3e3e3', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Customize columns</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#f5f5f6', color: '#777', whiteSpace: 'nowrap' }}>{shown.length} of {RECORD_COLUMNS.length}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#777', margin: '2px 0 10px', lineHeight: 1.4 }}>Choose what you want to see in the table.</div>

            <div style={{ display: 'flex', background: '#f5f5f6', borderRadius: '6px', padding: '2px', marginBottom: '6px' }}>
                {presets.map((p) => {
                    const act = sameAs(p.keys);
                    return (
                        <button key={p.label} type="button" onClick={() => setCols(p.keys)} style={{ flex: 1, padding: '4px 0', fontSize: '11px', fontWeight: act ? '600' : '500', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '4px', border: act ? '1px solid #e3e3e3' : '1px solid transparent', background: act ? 'white' : 'transparent', color: act ? '#111' : '#777' }}>
                            {p.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                {RECORD_COLUMNS.map((c) => {
                    const on = cols.includes(c.key);
                    const toggle = () => toggleCol(c.key);
                    return (
                        <div key={c.key} role="checkbox" aria-checked={on} tabIndex={0}
                            onClick={toggle}
                            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 2px', cursor: 'pointer', outline: 'none' }}>
                            <span style={{ width: '15px', height: '15px', borderRadius: '4px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', border: on ? '1px solid #B92F2F' : '1px solid #c9c9ce', background: on ? '#B92F2F' : 'white' }}>
                                {on && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                )}
                            </span>
                            <span style={{ fontSize: '12px', color: on ? '#222' : '#777', whiteSpace: 'nowrap' }}>{c.label}</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ececec' }}>
                <button type="button" onClick={() => setCols(DEFAULT_COLUMN_KEYS)} style={{ border: 'none', background: 'none', padding: 0, fontSize: '11px', fontFamily: 'inherit', color: '#777', cursor: 'pointer' }}>Reset to default</button>
                <button type="button" onClick={onClose} style={{ padding: '5px 14px', border: 'none', borderRadius: '6px', background: '#B92F2F', color: 'white', fontSize: '11px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Done</button>
            </div>
        </div>
    );
}export default function Records({ attendances = [] }) {
    const [openId, setOpenId] = useState(null);
    const [month, setMonth] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [panelOpen, setPanelOpen] = useState(false);
    const panelRef = useRef(null);

    const [view, setView] = useState(() => {
        try { return 'table'; } catch (e) { return 'table'; }
    });
    const [cols, setCols] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('vr.cols2') || 'null');
            if (Array.isArray(saved)) {
                const ok = saved.filter((k) => ALL_COLUMN_KEYS.includes(k));
                if (ok.length) return ok;
            }
        } catch (e) { /* ignore */ }
        return DEFAULT_COLUMN_KEYS;
    });
    const [colsOpen, setColsOpen] = useState(false);
    const colsRef = useRef(null);

    useEffect(() => {
        try {
            localStorage.setItem('vr.view', view);
            localStorage.setItem('vr.cols2', JSON.stringify(cols));
        } catch (e) { /* ignore */ }
    }, [view, cols]);

    useEffect(() => {
        if (!colsOpen) return undefined;
        const onDown = (e) => {
            if (colsRef.current && !colsRef.current.contains(e.target)) setColsOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [colsOpen]);

    // Opened from a Dashboard row (?record=ID): show the card view, open that record, scroll to it.
    useEffect(() => {
        try {
            const id = new URLSearchParams(window.location.search).get('record');
            if (!id) return;
            setView('table');
            setOpenId(Number(id));
            setTimeout(() => {
                const el = document.getElementById('record-' + id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        } catch (e) { /* ignore */ }
    }, []);
    const toggleCol = (key) => {
        setCols((cur) => {
            if (cur.includes(key)) return cur.length <= 1 ? cur : cur.filter((k) => k !== key);
            return RECORD_COLUMNS.map((c) => c.key).filter((k) => k === key || cur.includes(k));
        });
    };

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

    const locationOptions = useMemo(() => {
        const names = new Set();
        sortedAttendances.forEach((a) => { if (a.location_name) names.add(a.location_name); });
        return Array.from(names).sort();
    }, [sortedAttendances]);

    // Everything except the status tabs, so the status counts reflect the other filters.
    const baseFiltered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return sortedAttendances.filter((a) => {
            if (q) {
                const hay = [a.activity_name, a.location_name, a.assignment, a.assigned_by].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            const day = String(a.date).slice(0, 10);
            if (dateFrom && day < dateFrom) return false;
            if (dateTo && day > dateTo) return false;
            if (locationFilter !== 'all' && a.location_name !== locationFilter) return false;
            return true;
        });
    }, [sortedAttendances, search, dateFrom, dateTo, locationFilter]);

    const statusCount = (key) => {
        if (key === 'all') return baseFiltered.length;
        return baseFiltered.filter((a) => (a.attendance_status ?? '').toLowerCase() === key).length;
    };

    const filtered = useMemo(() => {
        if (statusFilter === 'all') return baseFiltered;
        return baseFiltered.filter((a) => (a.attendance_status ?? '').toLowerCase() === statusFilter);
    }, [baseFiltered, statusFilter]);

    const groups = useMemo(() => groupByMonth(filtered), [filtered]);

    const shortDay = (value) => formatDateShort(`${value}T00:00:00`);

    const chips = [];
    if (search.trim()) chips.push({ key: 'search', label: `"${search.trim()}"`, remove: () => setSearch('') });
    if (statusFilter !== 'all') chips.push({ key: 'status', label: STATUS_FILTERS.find((f) => f.key === statusFilter)?.label ?? statusFilter, remove: () => setStatusFilter('all') });
    if (dateFrom || dateTo) {
        const range = dateFrom && dateTo ? `${shortDay(dateFrom)} - ${shortDay(dateTo)}` : dateFrom ? `From ${shortDay(dateFrom)}` : `Until ${shortDay(dateTo)}`;
        chips.push({ key: 'date', label: range, remove: () => { setDateFrom(''); setDateTo(''); } });
    }
    if (locationFilter !== 'all') chips.push({ key: 'location', label: locationFilter, remove: () => setLocationFilter('all') });

    const panelCount = (statusFilter !== 'all' ? 1 : 0) + (dateFrom || dateTo ? 1 : 0) + (locationFilter !== 'all' ? 1 : 0);

    const clearAll = () => {
        setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setLocationFilter('all');
    };

    useEffect(() => {
        if (!panelOpen) return undefined;
        const onDown = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setPanelOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [panelOpen]);

    const fieldLabel = { display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#999', letterSpacing: '0.3px', marginBottom: '6px' };
    const fieldInput = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', border: '1px solid #ebebeb', borderRadius: '9px', background: 'white', color: '#333' };

    return (
        <VolunteerShell active="records" title="My Records">
            {/* Search + filters */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', maxWidth: '400px', height: '38px', background: 'white', border: '1px solid #e3e3e3', borderRadius: '8px' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search activity, location..."
                                style={{ ...fieldInput, padding: '0 12px 0 34px', height: '100%', outline: 'none', border: 'none', background: 'transparent', borderRadius: '8px 0 0 8px' }}
                            />
                        </div>

                        <span aria-hidden="true" style={{ alignSelf: 'center', width: '1px', height: '18px', background: '#e3e3e3', flexShrink: 0 }} />
                        <div ref={panelRef} style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
                            <button
                                type="button"
                                onClick={() => setPanelOpen((v) => !v)} aria-label="Filters" title="Filters"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    padding: '0 14px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit',
                                    border: 'none',
                                    borderRadius: '0 8px 8px 0', cursor: 'pointer',
                                    background: panelOpen ? '#f5f5f5' : 'transparent',
                                    color: '#555',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="9" cy="6" r="2" fill="white" /><circle cx="15" cy="12" r="2" fill="white" /><circle cx="8" cy="18" r="2" fill="white" />
                                </svg>
                                {panelCount > 0 && (
                                    <span style={{
                                        minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 4px',
                                        background: '#CC0000', color: 'white', fontSize: '10px', fontWeight: '700',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
                                    }}>{panelCount}</span>
                                )}
                            </button>

                            {panelOpen && (
                                <div style={{
                                    position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20,
                                    width: '300px', maxWidth: 'calc(100vw - 48px)', boxSizing: 'border-box',
                                    background: 'white', border: '1px solid #ebebeb', borderRadius: '12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '14px',
                                }}>
                                    <span style={fieldLabel}>STATUS</span>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                                        {STATUS_FILTERS.map((f) => {
                                            const active = statusFilter === f.key;
                                            return (
                                                <button
                                                    key={f.key}
                                                    type="button"
                                                    onClick={() => setStatusFilter(f.key)}
                                                    style={{
                                                        flex: 1, padding: '7px 6px', fontSize: '11.5px', fontWeight: active ? '600' : '500',
                                                        fontFamily: 'inherit', borderRadius: '8px', cursor: 'pointer',
                                                        border: active ? '1px solid #CC0000' : '1px solid #ebebeb',
                                                        background: active ? '#CC0000' : 'white',
                                                        color: active ? 'white' : '#666',
                                                    }}
                                                >
                                                    {f.label} <span style={{ fontSize: '10px', opacity: 0.7 }}>{statusCount(f.key)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <span style={fieldLabel}>DATE RANGE</span>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                        <input type="date" aria-label="From date" value={dateFrom} max={dateTo || undefined}
                                            onChange={(e) => setDateFrom(e.target.value)} style={fieldInput} />
                                        <input type="date" aria-label="To date" value={dateTo} min={dateFrom || undefined}
                                            onChange={(e) => setDateTo(e.target.value)} style={fieldInput} />
                                    </div>

                                    <span style={fieldLabel}>LOCATION</span>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        style={{ ...fieldInput, cursor: 'pointer', marginBottom: '14px' }}
                                    >
                                        <option value="all">All locations</option>
                                        {locationOptions.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <button
                                            type="button"
                                            onClick={clearAll}
                                            style={{ border: 'none', background: 'transparent', color: '#CC0000', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', padding: '6px 2px' }}
                                        >
                                            Clear all
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPanelOpen(false)}
                                            style={{ border: 'none', borderRadius: '9px', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', padding: '8px 16px' }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                        {view === 'table' && (
                            <div ref={colsRef} style={{ position: 'relative', flexShrink: 0, marginLeft: 'auto' }}>
                                <button
                                    type="button"
                                    aria-expanded={colsOpen}
                                    onClick={() => setColsOpen((v) => !v)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 14px', background: colsOpen ? '#f5f5f5' : 'white', border: '1px solid #e3e3e3', borderRadius: '8px', color: '#555', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BE2A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" /><path d="M3 10h18" /><path d="M10 3v18" /></svg>
                                        Columns
                                    </button>
                                {colsOpen && (<RecordsColsPopover cols={cols} setCols={setCols} toggleCol={toggleCol} onClose={() => setColsOpen(false)} />)}
                            </div>
                        )}
                    </div>
                    {chips.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {chips.map((c) => (
                                <span key={c.key} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 6px 4px 10px', fontSize: '11px', fontWeight: '600',
                                    color: '#333', background: 'white', border: '1px solid #e3e3e3', borderRadius: '999px', maxWidth: '260px',
                                }}>
                                    <span title={c.label} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                                    <button
                                        type="button"
                                        onClick={c.remove}
                                        aria-label={`Remove ${c.label} filter`}
                                        style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer', padding: '0 4px', fontSize: '14px', lineHeight: 1, fontFamily: 'inherit' }}
                                    >&times;</button>
                                </span>
                            ))}
                            <button
                                type="button"
                                onClick={clearAll}
                                style={{ border: 'none', background: 'transparent', color: '#CC0000', fontSize: '11px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', padding: '4px 6px' }}
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ flex: '1.6 1 420px', minWidth: 0, display: 'flex' }}><StatusDonut records={attendances} noMargin /></div>
                <SummaryStats records={attendances} />
            </div>
            <div>

                {/* Header */}

                                {view === 'table' ? <RecordsTable rows={filtered} cols={cols} /> : <RecordGroups groups={groups} openId={openId} setOpenId={setOpenId} />}
            </div>
        </VolunteerShell>
    );
}

/* ------------------------------ Record groups (by month) ------------------------------ */

function RecordGroups({ groups, openId, setOpenId }) {
    if (groups.length === 0) {
        return (
            <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '12px' }}>
                <EmptyState text="No matching records" />
            </div>
        );
    }

    return groups.map((group, gi) => (
        <div key={group.key} style={{ marginBottom: gi < groups.length - 1 ? '20px' : 0 }}>
            <MonthDivider label={group.label} count={group.items.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((a) => (
                    <div key={a.id} id={`record-${a.id}`} style={{ scrollMarginTop: '80px' }}><RecordRow a={a} isOpen={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} /></div>
                ))}
            </div>
        </div>
    ));
}

/* ------------------------------ Table view ------------------------------ */

function recordCell(a, key, withLoc) {
    const dash = '\u2014';
    switch (key) {
        case 'date': return <span style={{ fontWeight: 600, color: '#111' }}>{a.date ? new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : dash}</span>;
        case 'activity': return (a.activity_name || (withLoc && a.location_name)) ? (
            <div style={{ maxWidth: '340px' }}>
                <div style={{ fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.activity_name || a.location_name}</div>
                {withLoc && a.activity_name && a.location_name && (
                    <div title={a.location_name} style={{ fontSize: '11px', color: '#999', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.location_name}</div>
                )}
            </div>
        ) : dash;
        case 'location': return a.location_name ? <div title={a.location_name} style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>{a.location_name}</div> : dash;
        case 'assignment': return a.assignment ? <div title={String(a.assignment)} style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>{String(a.assignment)}</div> : dash;
case 'by': return a.assigned_by || dash;
        case 'in': return a.time_in ? <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatTime(a.time_in)}</span> : <span style={{ color: '#bbb' }}>{dash}</span>;
        case 'out': return a.time_out ? <span style={{ color: '#CC0000', fontWeight: 600 }}>{formatTime(a.time_out)}</span> : <span style={{ color: '#bbb' }}>{dash}</span>;
        case 'hours': return Number.isFinite(Number(a.hours_rendered)) && a.hours_rendered !== null && a.hours_rendered !== '' ? Number(a.hours_rendered).toFixed(1) : dash;
        case 'method': return a.time_in ? methodLabel(a.attendance_method) : dash;
        case 'status': return <StatusPill status={a.attendance_status} />;
        default: return dash;
    }
}

function RecordsTable({ rows, cols }) {
    const mergeLoc = false;
    const order = ['date', 'activity', 'location', 'in', 'out', 'hours', 'assignment', 'by', 'status'];
    const rank = (k) => { const i = order.indexOf(k); return i < 0 ? order.length : i; };
    const shown = RECORD_COLUMNS.filter((c) => cols.includes(c.key)).sort((a, b) => rank(a.key) - rank(b.key));
    if (rows.length === 0) {
        return (
            <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '12px' }}>
                <EmptyState text="No matching records" />
            </div>
        );
    }
    const th = { fontSize: '10.5px', fontWeight: '600', color: '#999', textAlign: 'left', padding: '10px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' };
    const td = { fontSize: '12px', color: '#333', padding: '12px 16px', borderBottom: '1px solid #f5f5f5', whiteSpace: 'nowrap' };
    return (
        <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>{shown.map((c) => <th key={c.key} style={th}>{c.label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.map((a, i) => (
                            <tr key={a.id} id={'record-' + a.id}>
                                {shown.map((c) => (
                                    <td key={c.key} style={{ ...td, borderBottom: i === rows.length - 1 ? 'none' : td.borderBottom }}>{recordCell(a, c.key, mergeLoc)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f5f5f5', fontSize: '11px', color: '#999' }}>
                Showing {rows.length} record{rows.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
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
                        <ActivityStatusPill status={a.activity_status} compact />
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
