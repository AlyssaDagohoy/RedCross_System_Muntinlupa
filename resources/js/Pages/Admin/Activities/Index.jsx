import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AdminShell from '../../../Components/AdminShell';

const STATUS_STYLE = {
    upcoming:  { bg: '#eaf1fd', color: '#1d4ed8' },
    ongoing:   { bg: '#e9f8ee', color: '#1a8a3d' },
    completed: { bg: '#f0f0f1', color: '#666' },
    cancelled: { bg: '#fdeaea', color: '#CC0000' },
};

const STATUS_OPTS = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
];

const dateKey = (d) => String(d || '').slice(0, 10);

const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(dateKey(d) + 'T00:00:00');
    return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const dayParts = (d) => {
    const dt = new Date(dateKey(d) + 'T00:00:00');
    if (isNaN(dt)) return { weekday: '', day: '' };
    return { weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }), day: dt.getDate() };
};

const monthLabel = (d) => {
    const dt = new Date(dateKey(d) + 'T00:00:00');
    return isNaN(dt) ? 'No date' : dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = String(t).split(':');
    const hh = parseInt(h, 10);
    if (isNaN(hh)) return t;
    return (hh % 12 || 12) + ':' + (m || '00') + ' ' + (hh >= 12 ? 'PM' : 'AM');
};

const labelStyle = { fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.3px' };

const fieldStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #eee', fontSize: '12.5px', background: '#f7f7f7', fontFamily: 'inherit', color: '#1a1a1a',
};

const fmtShortDay = (d) => {
    const dt = new Date(dateKey(d) + 'T00:00:00');
    return isNaN(dt) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fieldLabel = { display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#999', letterSpacing: '0.3px', marginBottom: '6px' };

const fieldInput = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit',
    border: '1px solid #ebebeb', borderRadius: '9px', background: 'white', color: '#333',
};

const DATE_PRESETS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'custom', label: 'Custom' },
];

const SORT_OPTS = [
    { key: 'nearest', label: 'Nearest date first' },
    { key: 'newest', label: 'Newest first' },
    { key: 'oldest', label: 'Oldest first' },
];

const toKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

const presetRange = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === 'today') return { from: toKey(today), to: toKey(today) };
    if (preset === 'week') {
        const mondayOffset = (today.getDay() + 6) % 7;
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        return { from: toKey(start), to: toKey(end) };
    }
    if (preset === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: toKey(start), to: toKey(end) };
    }
    return { from: '', to: '' };
};

function DetailRow({ icon, label, children }) {
    return (
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, display: 'flex', marginTop: '2px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
            </span>
            <div style={{ minWidth: 0 }}>
                <div style={labelStyle}>{label}</div>
                {children}
            </div>
        </div>
    );
}

export default function Index({ activities }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(() => { try { const s = new URLSearchParams(window.location.search).get('status'); return ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(s) ? s : 'all'; } catch { return 'all'; } });
    const [datePreset, setDatePreset] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [assignedByFilter, setAssignedByFilter] = useState('all');
    const [volunteerFilter, setVolunteerFilter] = useState('all');
    const [sortBy, setSortBy] = useState('nearest');
    const [panelOpen, setPanelOpen] = useState(false);
    const [openId, setOpenId] = useState(() => { try { const o = parseInt(new URLSearchParams(window.location.search).get('open'), 10); return Number.isNaN(o) ? null : o; } catch { return null; } });
    const [highlightId] = useState(() => { try { const h = parseInt(new URLSearchParams(window.location.search).get('highlight'), 10); return Number.isNaN(h) ? null : h; } catch { return null; } });
    const panelRef = useRef(null);

    // Galing sa Dashboard: i-scroll papunta sa activity na binuksan
    useEffect(() => {
        if (openId === null) return undefined;
        const timer = setTimeout(() => {
            const el = document.getElementById(`act-${openId}`);
            if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 200);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const q = search.trim().toLowerCase();

    const range = datePreset === 'custom' ? { from: dateFrom, to: dateTo } : presetRange(datePreset);

    const locations = Array.from(new Set(activities.map((a) => a.location_name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const assigners = Array.from(new Set(activities.map((a) => a.assigned_by).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const volunteerOptions = (() => {
        const map = new Map();
        activities.forEach((a) => (a.volunteers || []).forEach((v) => map.set(String(v.id), v.name)));
        return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    })();

    // Lahat ng filter maliban sa status, para tama ang bilang sa status pills
    const baseFiltered = activities.filter((a) => {
        if (q) {
            const hay = [a.name, a.location_name, a.description, a.assigned_by, ...(a.volunteers || []).map((v) => v.name)];
            if (!hay.some((x) => (x || '').toLowerCase().includes(q))) return false;
        }
        const day = dateKey(a.date);
        if (range.from && day < range.from) return false;
        if (range.to && day > range.to) return false;
        if (locationFilter !== 'all' && a.location_name !== locationFilter) return false;
        if (assignedByFilter !== 'all' && a.assigned_by !== assignedByFilter) return false;
        if (volunteerFilter !== 'all' && !(a.volunteers || []).some((v) => String(v.id) === volunteerFilter)) return false;
        return true;
    });

    const statusCount = (key) => (key === 'all' ? baseFiltered.length : baseFiltered.filter((a) => a.status === key).length);

    const todayMs = new Date(toKey(new Date()) + 'T00:00:00').getTime();
    const dayMs = (a) => {
        const ms = new Date(dateKey(a.date) + 'T00:00:00').getTime();
        return isNaN(ms) ? null : ms;
    };
    const byTime = (x, y) => String(x.start_time || '').localeCompare(String(y.start_time || ''));
    const byDate = (x, y, dir) => {
        const dx = dayMs(x);
        const dy = dayMs(y);
        if (dx === null && dy === null) return 0;
        if (dx === null) return 1;
        if (dy === null) return -1;
        return dir * (dx - dy) || byTime(x, y);
    };
    const byNearest = (x, y) => {
        const dx = dayMs(x);
        const dy = dayMs(y);
        const ax = dx === null ? Infinity : Math.abs(dx - todayMs);
        const ay = dy === null ? Infinity : Math.abs(dy - todayMs);
        if (ax === ay) return byTime(x, y);
        return ax < ay ? -1 : 1;
    };

    const statusFiltered = statusFilter === 'all' ? baseFiltered : baseFiltered.filter((a) => a.status === statusFilter);
    const visible = [...statusFiltered].sort((x, y) => {
        if (sortBy === 'newest') return byDate(x, y, -1);
        if (sortBy === 'oldest') return byDate(x, y, 1);
        return byNearest(x, y);
    });

    const dateActive = datePreset === 'custom' ? Boolean(dateFrom || dateTo) : datePreset !== 'all';
    const panelCount = (dateActive ? 1 : 0) + (locationFilter !== 'all' ? 1 : 0) + (assignedByFilter !== 'all' ? 1 : 0) + (volunteerFilter !== 'all' ? 1 : 0);
    const filtersOn = panelOpen || panelCount > 0;

    const clearAll = () => {
        setSearch('');
        setStatusFilter('all');
        setDatePreset('all');
        setDateFrom('');
        setDateTo('');
        setLocationFilter('all');
        setAssignedByFilter('all');
        setVolunteerFilter('all');
    };

    const chips = [];
    if (dateActive) {
        const label = datePreset === 'custom'
            ? (dateFrom && dateTo ? `${fmtShortDay(dateFrom)} - ${fmtShortDay(dateTo)}` : dateFrom ? `From ${fmtShortDay(dateFrom)}` : `Until ${fmtShortDay(dateTo)}`)
            : DATE_PRESETS.find((p) => p.key === datePreset)?.label;
        chips.push({ key: 'date', label, remove: () => { setDatePreset('all'); setDateFrom(''); setDateTo(''); } });
    }
    if (locationFilter !== 'all') chips.push({ key: 'location', label: locationFilter, remove: () => setLocationFilter('all') });
    if (assignedByFilter !== 'all') chips.push({ key: 'by', label: `By ${assignedByFilter}`, remove: () => setAssignedByFilter('all') });
    if (volunteerFilter !== 'all') chips.push({ key: 'vol', label: volunteerOptions.find((v) => v.id === volunteerFilter)?.name ?? 'Volunteer', remove: () => setVolunteerFilter('all') });

    const anyFilter = chips.length > 0 || statusFilter !== 'all' || q !== '';

    // Isara ang panel kapag nag-click sa labas
    useEffect(() => {
        if (!panelOpen) return undefined;
        const onDown = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setPanelOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [panelOpen]);

    // Group by month, keeping the order the activities came in
    const groups = [];
    visible.forEach((a) => {
        const key = dateKey(a.date).slice(0, 7) || 'none';
        let g = groups.find((x) => x.key === key);
        if (!g) {
            g = { key, label: monthLabel(a.date), items: [] };
            groups.push(g);
        }
        g.items.push(a);
    });

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this activity?')) {
            router.delete(route('admin.activities.destroy', id));
        }
    };

    return (
        <AdminShell active="activities" title="Activities">
            <style>{`
                .act-card:hover { border-color: #d8d8d8 !important; }
                @keyframes act-today-flash { 0% { background: #ffffff; } 13%, 47% { background: #F5BDBD; } 100% { background: #ffffff; } }
                .act-today { animation: act-today-flash 1.2s ease-out 1; }
                .act-edit-btn:hover { background: #eeeeee !important; }
                .act-delete-btn:hover { background: #fbdada !important; }
                .act-new-btn:hover { background: #aa0000 !important; }
                .act-filter-btn:hover { background: #aa0000 !important; }
                .act-clear-btn:hover { background: #ececec !important; }
                .act-filter-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
                .act-filter-actions { display: flex; gap: 10px; margin-top: 14px; }
                @media (max-width: 720px) {
                    .act-filter-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <Link
                href={route('admin.activities.create')}
                className="act-new-btn"
                style={{
                    position: 'fixed', right: '24px', bottom: '24px', zIndex: 50,
                    background: '#CC0000', color: 'white', padding: '12px 20px', borderRadius: '999px',
                    textDecoration: 'none', fontWeight: '600', fontSize: '12.5px', whiteSpace: 'nowrap',
                    boxShadow: '0 6px 18px rgba(204, 0, 0, 0.35)',
                }}
            >
                + New Activity
            </Link>

            {activities.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search activity, location, assignment, volunteer..."
                                style={{ ...fieldInput, padding: '9px 12px 9px 34px', outline: 'none' }}
                            />
                        </div>

                        <div ref={panelRef} style={{ position: 'relative', flexShrink: 0 }}>
                            <button
                                type="button"
                                onClick={() => setPanelOpen((v) => !v)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    padding: '9px 14px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit',
                                    border: '1px solid ' + (filtersOn ? '#CC0000' : '#ebebeb'),
                                    borderRadius: '9px', cursor: 'pointer',
                                    background: filtersOn ? '#CC0000' : 'white',
                                    color: filtersOn ? 'white' : '#333',
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                Filters
                                {panelCount > 0 && (
                                    <span style={{
                                        minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 4px',
                                        background: 'white', color: '#CC0000', fontSize: '10px', fontWeight: '700',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
                                    }}>{panelCount}</span>
                                )}
                            </button>

                            {panelOpen && (
                                <div style={{
                                    position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20,
                                    width: '380px', maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto',
                                    boxSizing: 'border-box', background: 'white', border: '1px solid #ebebeb', borderRadius: '12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '14px',
                                }}>
                                    <span style={fieldLabel}>DATE</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: datePreset === 'custom' ? '8px' : '14px' }}>
                                        {DATE_PRESETS.map((p) => {
                                            const active = datePreset === p.key;
                                            return (
                                                <button
                                                    key={p.key}
                                                    type="button"
                                                    onClick={() => setDatePreset(active ? 'all' : p.key)}
                                                    style={{
                                                        padding: '6px 11px', fontSize: '12px', fontWeight: active ? '600' : '500',
                                                        fontFamily: 'inherit', borderRadius: '8px', cursor: 'pointer',
                                                        border: active ? '1px solid #CC0000' : '1px solid #ebebeb',
                                                        background: active ? '#CC0000' : 'white',
                                                        color: active ? 'white' : '#666',
                                                    }}
                                                >
                                                    {p.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {datePreset === 'custom' && (
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                            <input type="date" aria-label="From date" value={dateFrom} max={dateTo || undefined}
                                                onChange={(e) => setDateFrom(e.target.value)} style={fieldInput} />
                                            <input type="date" aria-label="To date" value={dateTo} min={dateFrom || undefined}
                                                onChange={(e) => setDateTo(e.target.value)} style={fieldInput} />
                                        </div>
                                    )}

                                    <span style={fieldLabel}>LOCATION</span>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        style={{ ...fieldInput, cursor: 'pointer', marginBottom: '14px' }}
                                    >
                                        <option value="all">All locations</option>
                                        {locations.map((l) => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={fieldLabel}>ASSIGNED BY</span>
                                            <select
                                                value={assignedByFilter}
                                                onChange={(e) => setAssignedByFilter(e.target.value)}
                                                style={{ ...fieldInput, cursor: 'pointer' }}
                                            >
                                                <option value="all">Anyone</option>
                                                {assigners.map((n) => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={fieldLabel}>VOLUNTEER</span>
                                            <select
                                                value={volunteerFilter}
                                                onChange={(e) => setVolunteerFilter(e.target.value)}
                                                style={{ ...fieldInput, cursor: 'pointer' }}
                                            >
                                                <option value="all">Anyone</option>
                                                {volunteerOptions.map((v) => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <span style={fieldLabel}>SORT BY</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        style={{ ...fieldInput, cursor: 'pointer', marginBottom: '14px' }}
                                    >
                                        {SORT_OPTS.map((o) => (
                                            <option key={o.key} value={o.key}>{o.label}</option>
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

                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '4px', borderBottom: '1px solid #e5e5e5' }}>
                        {STATUS_OPTS.map((o) => {
                            const active = statusFilter === o.key;
                            return (
                                <button
                                    key={o.key}
                                    type="button"
                                    onClick={() => setStatusFilter(o.key)}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 14px', fontSize: '12.5px', fontWeight: active ? '600' : '500',
                                        fontFamily: 'inherit', borderRadius: '0', cursor: 'pointer', whiteSpace: 'nowrap',
                                        border: 'none', borderBottom: '2px solid ' + (active ? '#CC0000' : 'transparent'), marginBottom: '-1px',
                                        background: 'transparent',
                                        color: active ? '#222' : '#777',
                                    }}
                                >
                                    {o.label} <span style={{ fontSize: '11px', opacity: 0.75 }}>{statusCount(o.key)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {anyFilter && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                            {chips.map((c) => (
                                <span key={c.key} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 6px 4px 10px', fontSize: '11px', fontWeight: '600',
                                    color: '#CC0000', background: '#fdeaea', borderRadius: '999px',
                                }}>
                                    {c.label}
                                    <button
                                        type="button"
                                        onClick={c.remove}
                                        aria-label={`Remove ${c.label} filter`}
                                        style={{ border: 'none', background: 'transparent', color: '#CC0000', cursor: 'pointer', padding: '0 4px', fontSize: '14px', lineHeight: 1, fontFamily: 'inherit' }}
                                    >&times;</button>
                                </span>
                            ))}
                            <button
                                type="button"
                                onClick={clearAll}
                                style={{ border: 'none', background: 'transparent', color: '#888', fontSize: '11px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', padding: '4px 6px' }}
                            >
                                Clear all
                            </button>
                            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
                                Showing {visible.length} of {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                            </span>
                        </div>
                    )}
                </div>
            )}            {activities.length > 0 && visible.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', color: '#bbb', fontSize: '12.5px' }}>No activities found</div>
            )}

            {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 16px', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>No activities yet</p>
                    <Link href={route('admin.activities.create')} style={{ color: '#CC0000', fontSize: '13px', fontWeight: '500' }}>Create your first activity</Link>
                </div>
            ) : (
                <div>
                    {groups.map((g) => (
                        <div key={g.key} style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2px 0 10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#999', whiteSpace: 'nowrap' }}>{g.label}</span>
                                <span style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {g.items.map((activity) => {
                                    const statusStyle = STATUS_STYLE[activity.status] ?? STATUS_STYLE.completed;
                                    const isOpen = openId === activity.id;
                                    return (
                                        <div key={activity.id} id={`act-${activity.id}`} className={'act-card' + ((highlightId !== null ? activity.id === highlightId : dateKey(activity.date) === toKey(new Date())) ? ' act-today' : '')} style={{
                                            background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', overflow: 'hidden',
                                        }}>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                aria-expanded={isOpen}
                                                onClick={() => setOpenId(isOpen ? null : activity.id)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(isOpen ? null : activity.id); } }}
                                                style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <h2 style={{ fontSize: '13.5px', fontWeight: '600', color: '#141414', margin: 0, wordBreak: 'break-word' }}>
                                                        {activity.name}
                                                        {statusFilter === 'all' && (
                                                            <span style={{ marginLeft: '8px', fontSize: '10.5px', fontWeight: '600', padding: '2px 9px', borderRadius: '999px', background: statusStyle.bg, color: statusStyle.color, whiteSpace: 'nowrap', verticalAlign: '1px' }}>
                                                                {String(activity.status || '').charAt(0).toUpperCase() + String(activity.status || '').slice(1).toLowerCase()}
                                                            </span>
                                                        )}
                                                    </h2>
                                                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#888' }}>
                                                        {fmtDate(activity.date)}{(activity.start_time || activity.end_time) && <>{' \u00B7 '}{fmtTime(activity.start_time)} &ndash; {fmtTime(activity.end_time)}</>}
                                                    </div>
                                                </div>
                                                <span style={{ flexShrink: 0, display: 'flex' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                                                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </span>
                                            </div>

                                            {isOpen && (
                                                <div className="act-panel" style={{ borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
                                                    <div className="act-list" style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        <DetailRow label="Date" icon={<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}>
                                                            <div style={{ fontSize: '13px', color: '#222', marginTop: '2px' }}>{fmtDate(activity.date)}</div>
                                                        </DetailRow>
                                                        <DetailRow label="Time" icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}>
                                                            <div style={{ fontSize: '13px', color: '#222', marginTop: '2px' }}>{fmtTime(activity.start_time)} &ndash; {fmtTime(activity.end_time)}</div>
                                                        </DetailRow>
                                                        <DetailRow label="Location" icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>}>
                                                            <div style={{ fontSize: '13px', color: '#222', marginTop: '2px', wordBreak: 'break-word' }}>{activity.location_name}</div>
                                                        </DetailRow>
                                                        <DetailRow label="Assignment" icon={<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>}>
                                                            <div style={{ fontSize: '13px', color: '#222', marginTop: '2px', lineHeight: '1.5', wordBreak: 'break-word' }}>{activity.description || 'No assignment specified.'}</div>
                                                        </DetailRow>
                                                        <DetailRow label="Assigned By" icon={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}>
                                                            <div style={{ fontSize: '13px', color: '#222', marginTop: '2px' }}>{activity.assigned_by || '\u2014'}</div>
                                                        </DetailRow>
                                                        <DetailRow label={`Volunteers (${activity.volunteers?.length ?? 0})`} icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}>
                                                            {(activity.volunteers?.length ?? 0) === 0 ? (
                                                                <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>No volunteers assigned.</div>
                                                            ) : (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                                    {activity.volunteers.map((v) => (
                                                                        <span key={v.id} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '999px', padding: '3px 10px', fontSize: '12px', color: '#333' }}>{v.name}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </DetailRow>
                                                    </div>

                                                    <div style={{ margin: '0 20px', borderTop: '1px solid #ececec', padding: '14px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#aaa' }}>Status:</span>
                                                            <span style={{
                                                                background: statusStyle.bg, color: statusStyle.color,
                                                                padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize',
                                                            }}>
                                                                {activity.status}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <Link
                                                                href={route('admin.activities.edit', activity.id)}
                                                                className="act-edit-btn"
                                                                style={{
                                                                    background: '#f0f0f0', color: '#333', padding: '8px 16px', borderRadius: '9px',
                                                                    textDecoration: 'none', fontSize: '12.5px', fontWeight: '500',
                                                                }}
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(activity.id)}
                                                                className="act-delete-btn"
                                                                style={{
                                                                    background: '#fdeaea', color: '#CC0000', padding: '8px 16px', borderRadius: '9px',
                                                                    border: 'none', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminShell>
    );
}
