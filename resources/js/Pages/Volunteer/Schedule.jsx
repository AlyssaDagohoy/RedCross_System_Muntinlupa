import { useEffect as useEffectAutoRefresh } from 'react';
import { router as routerAutoRefresh } from '@inertiajs/react';
import { Link, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import VolunteerShell, { useVolunteerShell } from '../../Components/VolunteerShell';
import { AttendanceCapture } from '../../Components/FaceAttendance';

const FILTERS = [
    { key: 'assigned', label: 'Assigned', dot: '#3b82f6' },
    { key: 'ongoing', label: 'Ongoing', dot: '#f59e0b' },
    { key: 'upcoming', label: 'Upcoming', dot: '#8b5cf6' },
    { key: 'completed', label: 'Completed', dot: '#22c55e' },
    { key: 'missed', label: 'Missed', dot: '#9ca3af' },
    { key: 'cancelled', label: 'Cancelled', dot: '#ef4444' },
];

const VALID_TABS = FILTERS.map(f => f.key);

function useIsMobile(breakpoint = 768) {
    const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth <= breakpoint);
    useEffect(() => {
        const on = () => setM(window.innerWidth <= breakpoint);
        on();
        window.addEventListener('resize', on);
        return () => window.removeEventListener('resize', on);
    }, [breakpoint]);
    return m;
}

function getInitialTab() {
    if (typeof window === 'undefined') return 'assigned';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (VALID_TABS.includes(tab)) { try { sessionStorage.setItem('sched_filter', tab); } catch (e) {} return tab; } try { const s = sessionStorage.getItem('sched_filter'); if (VALID_TABS.includes(s)) return s; } catch (e) {} return 'assigned';
}

function isActivityDue(dateStr) {
    const activityDate = new Date(dateStr);
    activityDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activityDate <= today;
}

function getBucket(act) {
    const status = (act.status || 'assigned').toLowerCase();
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'ongoing' || (status === 'assigned' && act.phase === 'ongoing')) return 'ongoing';
    if (status === 'missed') return 'missed';
    return isActivityDue(act.date) ? 'assigned' : 'upcoming';
}

// Groups a sorted activity list into [{ label: 'September 2026', items: [...] }, ...]
// preserving whatever order the activities already came in.
function groupByMonth(list) {
    const groups = [];
    let current = null;
    for (const act of list) {
        const d = new Date(act.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!current || current.key !== key) {
            current = {
                key,
                label: d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
                items: [],
            };
            groups.push(current);
        }
        current.items.push(act);
    }
    return groups;
}

function whenLine(act) {
    if (!act || !act.date) return '';
    const d = new Date(String(act.date).slice(0, 10) + 'T00:00:00');
    const dateText = d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const t12 = (t) => {
        if (!t) return '';
        const parts = String(t).split(':');
        const x = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1] || 0));
        return x.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s/g, ' ').toUpperCase();
    };
    const timeText = act.start_time
        ? (act.end_time ? t12(act.start_time) + ' \u2013 ' + t12(act.end_time) : t12(act.start_time))
        : '';
    return [dateText, timeText].filter(Boolean).join(' \u00B7 ');
}
export default function VolunteerSchedule({ auth, activities }) {
    const acts = activities || [];
    const [filter, setFilterRaw] = useState(getInitialTab); const setFilter = (v) => { setFilterRaw(v); try { sessionStorage.setItem('sched_filter', v); } catch (e) {} };
    const [viewMode, setViewMode] = useState('row'); // 'row' | 'card'
    const isMobile = useIsMobile();
    const [dropOpen, setDropOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState('any'); // any | today | week | month
    const [assignedBy, setAssignedBy] = useState('any');
    // auto-refresh schedule
    useEffectAutoRefresh(() => {
        const tick = () => {
            if (document.visibilityState === 'visible') routerAutoRefresh.reload({ only: ['activities', 'attendance', 'fieldActivities', 'branchActivities'], preserveScroll: true });
        };
        const id = setInterval(tick, 60000);
        document.addEventListener('visibilitychange', tick);
        return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
    }, []);
    const [dayFilter, setDayFilter] = useState(null); // 'YYYY-MM-DD' picked in the week card
    const [weekOffset, setWeekOffset] = useState(0);

    const assignedOptions = useMemo(() => {
        const set = new Set();
        (activities || []).forEach(a => { if (a.assigned_by) set.add(a.assigned_by); });
        return [...set];
    }, [activities]);

    const matchesSearch = (a) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const hay = [a.name, a.location_name, a.description]
            .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
    };

    const matchesDate = (a) => {
        if (dateFilter === 'any' || !a.date) return true;
        const d = new Date(String(a.date).slice(0, 10) + 'T00:00:00');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') return d.getTime() === today.getTime();
        if (dateFilter === 'week') {
            const start = new Date(today);
            start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return d >= start && d <= end;
        }
        if (dateFilter === 'month') {
            return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
        }
        return true;
    };

    const matchesAssigned = (a) => assignedBy === 'any' || a.assigned_by === assignedBy;

    const activeFilterCount = (dateFilter !== 'any' ? 1 : 0) + (assignedBy !== 'any' ? 1 : 0);
    const clearFilters = () => { setDateFilter('any'); setAssignedBy('any'); };
    const [requestOpen, setRequestOpen] = useState(false);
    const [reqActivity, setReqActivity] = useState('');
    const [reqType, setReqType] = useState('reschedule');
    const [reqDate, setReqDate] = useState('');
    const [reqTime, setReqTime] = useState('');
    const [reqReason, setReqReason] = useState('');
    const [openId, setOpenIdRaw] = useState(() => { try { const v = sessionStorage.getItem('sched_open_id'); return v === null ? null : JSON.parse(v); } catch (e) { return null; } }); const setOpenId = (v) => setOpenIdRaw((cur) => { const n = typeof v === 'function' ? v(cur) : v; try { if (n === null || n === undefined) sessionStorage.removeItem('sched_open_id'); else sessionStorage.setItem('sched_open_id', JSON.stringify(n)); } catch (e) {} return n; }); // expanded row/card (inline details)
    const tabRefs = useRef({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const [activeCapture, setActiveCapture] = useState(null); // { activityId, mode }

    const toggleOpen = (id) => setOpenId((cur) => (cur === id ? null : id));

    const filteredActs = useMemo(() => {
        return acts.filter(a => getBucket(a) === filter && matchesSearch(a) && matchesDate(a) && matchesAssigned(a) && (!dayFilter || String(a.date).slice(0, 10) === dayFilter));
    }, [acts, filter, search, dateFilter, assignedBy, dayFilter]);

    const sorted = useMemo(() => {
        return [...filteredActs].sort((a, b) => {
            if (a.date !== b.date) {
                return a.date > b.date ? -1 : 1;
            }
            const aTime = a.time_out ? new Date(a.time_out).getTime() : 0;
            const bTime = b.time_out ? new Date(b.time_out).getTime() : 0;
            return bTime - aTime;
        });
    }, [filteredActs]);

    const monthGroups = useMemo(() => groupByMonth(sorted), [sorted]);

    const filterCount = (f) => acts.filter(a => getBucket(a) === f).length;
    const currentFilter = FILTERS.find(x => x.key === filter) || FILTERS[0];

    useEffect(() => {
        const el = tabRefs.current[filter];
        if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }, [filter, acts.length]);

    return (
        <VolunteerShell active="schedule" title="My Schedule" notifications={[]}>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'stretch', background: 'white', border: '1px solid #e3e3e3', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setOpenId(null); }}
                        placeholder="Search activity, location..."
                        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '10px 10px', fontSize: '13px', fontFamily: 'inherit', color: '#111', background: 'transparent' }}
                    />
                    <span aria-hidden="true" style={{ alignSelf: 'center', width: '1px', height: '18px', background: '#e3e3e3', flexShrink: 0 }} />
                    <button
                        type="button"
                        onClick={() => setFilterOpen(o => !o)}
                        aria-expanded={filterOpen}
                        aria-label="Filter"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 14px', background: filterOpen ? '#f5f5f5' : 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2" fill="white" /><line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2" fill="white" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="8" cy="18" r="2" fill="white" /></svg>
                        {activeFilterCount > 0 && (
                            <span style={{ background: '#CC0000', color: 'white', borderRadius: '9px', fontSize: '10px', padding: '1px 6px' }}>{activeFilterCount}</span>
                        )}
                    </button>
                </div>
                {filterOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', width: '260px', maxWidth: '100%', zIndex: 50, background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px' }}>Date</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                            {[['any', 'Any'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month']].map(([k, label]) => (
                                <button key={k} type="button" onClick={() => setDateFilter(k)} style={{
                                    padding: '6px 10px', fontSize: '11.5px', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '8px',
                                    border: dateFilter === k ? '1.5px solid #CC0000' : '1.5px solid #e0e0e0',
                                    background: dateFilter === k ? '#fff5f5' : 'white',
                                    color: dateFilter === k ? '#CC0000' : '#111', fontWeight: dateFilter === k ? '600' : '400',
                                }}>{label}</button>
                            ))}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px' }}>Assigned by</div>
                        <select
                            value={assignedBy}
                            onChange={(e) => setAssignedBy(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#111' }}
                        >
                            <option value="any">Anyone</option>
                            {assignedOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f5f5f5' }}>
                            <button type="button" onClick={clearFilters} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#888' }}>Clear all</button>
                            <button type="button" onClick={() => setFilterOpen(false)} style={{ background: '#CC0000', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600' }}>Done</button>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                    type="button"
                    onClick={() => setRequestOpen((o) => !o)}
                    aria-expanded={requestOpen}
                    aria-label="Request schedule change"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: isMobile ? '0 11px' : '0 14px', background: requestOpen ? '#f5f5f5' : 'white', border: '1px solid #e3e3e3', borderRadius: '8px', color: '#555', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BE2A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10h14l-4 -4" /><path d="M17 14h-14l4 4" /></svg>
                    {!isMobile && 'Change schedule'}
                </button>
                {requestOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', width: '300px', maxWidth: '90vw', zIndex: 50, background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Request schedule change</div>
                        <div style={{ fontSize: '11px', color: '#999', margin: '1px 0 12px' }}>Your request goes to your coordinator for approval.</div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '6px' }}>Activity</div>
                        <select value={reqActivity} onChange={(e) => setReqActivity(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#111', marginBottom: '12px' }}>
                            <option value="">Choose an activity</option>
                            {acts.filter((a) => ['assigned', 'upcoming', 'ongoing'].includes(getBucket(a))).map((a) => (
                                <option key={a.id} value={a.id}>{(a.title || a.name || a.activity_name || 'Activity #' + a.id) + ' \u00B7 ' + String(a.date).slice(0, 10)}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '6px' }}>Request</div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            {[['reschedule', 'Reschedule'], ['cant', "Can't attend"]].map(([k, label]) => (
                                <button key={k} type="button" onClick={() => setReqType(k)} style={{ padding: '6px 10px', fontSize: '11.5px', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '8px', border: reqType === k ? '1.5px solid #555' : '1.5px solid #e0e0e0', background: reqType === k ? '#f1f1f2' : 'white', color: '#111', fontWeight: reqType === k ? '600' : '400' }}>{label}</button>
                            ))}
                        </div>
                        {reqType === 'reschedule' && (
                            <>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '6px' }}>New date and time</div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    <input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '7px 8px', fontSize: '12px', fontFamily: 'inherit', border: '1.5px solid #e0e0e0', borderRadius: '8px', color: '#111' }} />
                                    <input type="time" value={reqTime} onChange={(e) => setReqTime(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '7px 8px', fontSize: '12px', fontFamily: 'inherit', border: '1.5px solid #e0e0e0', borderRadius: '8px', color: '#111' }} />
                                </div>
                            </>
                        )}
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '6px' }}>Reason</div>
                        <textarea value={reqReason} onChange={(e) => setReqReason(e.target.value)} rows={3} placeholder="Tell your coordinator why..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', border: '1.5px solid #e0e0e0', borderRadius: '8px', resize: 'none', color: '#111' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f5f5f5' }}>
                            <button type="button" onClick={() => setRequestOpen(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#888' }}>Cancel</button>
                            <button type="button" onClick={() => { setRequestOpen(false); setReqActivity(''); setReqDate(''); setReqTime(''); setReqReason(''); }} style={{ background: '#CC0000', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600' }}>Send request</button>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#b0b0b0', marginTop: '8px' }}>Preview only. Sending is not connected yet.</div>
                    </div>
                )}
            </div>
            </div>
            <WeekOverview acts={acts} weekOffset={weekOffset} onWeek={(n) => { setWeekOffset(n); setDayFilter(null); }} selectedDay={dayFilter} onPick={(key, items) => { if (dayFilter === key) { setDayFilter(null); return; } setDayFilter(key); setSearch(''); setDateFilter('any'); setAssignedBy('any'); setOpenId(null); if (!items.some((a) => getBucket(a) === filter)) setFilter(getBucket(items[0])); }} onClear={() => setDayFilter(null)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '0', flexWrap: 'wrap' }}>
                {/* Segmented filter control */}
                {isMobile ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button type="button" aria-expanded={dropOpen} onClick={() => setDropOpen(o => !o)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '12px 14px', background: 'white', border: dropOpen ? '1.5px solid #CC0000' : '1.5px solid #e0e0e0', borderRadius: '10px',
                            cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', color: '#111',
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentFilter.dot, flexShrink: 0 }} />
                                <span style={{ fontWeight: '600' }}>{currentFilter.label}</span>
                                <span style={{ color: '#888' }}>{'\u00B7'} {filterCount(filter)}</span>
                            </span>
                            <Chevron open={dropOpen} />
                        </button>
                        {dropOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', minWidth: '170px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
                                {FILTERS.map((f, i) => (
                                    <button key={f.key} type="button" onClick={() => { setFilter(f.key); setOpenId(null); setDropOpen(false); }} style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                        padding: '12px 14px', background: filter === f.key ? '#fafafa' : 'white',
                                        borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                                        borderTop: i > 0 ? '1px solid #f5f5f5' : 'none',
                                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', color: '#111', textAlign: 'left',
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: f.dot, flexShrink: 0 }} />
                                            <span style={{ fontWeight: filter === f.key ? '600' : '400' }}>{f.label}</span>
                                        </span>
                                        <span style={{ color: '#888', fontSize: '12px' }}>{filterCount(f.key)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', boxSizing: 'border-box', padding: '0', marginBottom: (viewMode === 'row') ? '0' : '12px' }}>
                                        {FILTERS.map(f => {
                        const active = filter === f.key;
                        const count = filterCount(f.key); const joined = viewMode === 'row';
                        return (
                            <button
                                key={f.key}
                                ref={(el) => { tabRefs.current[f.key] = el; }}
                                type="button"
                                onClick={() => { setFilter(f.key); setOpenId(null); }}
                                style={{
                                    padding: active ? '9px 14px' : '8px 14px', fontSize: '12px', fontWeight: '600',
                                    color: active ? '#555' : '#999', whiteSpace: 'nowrap',
                                    background: active ? 'white' : '#f7f7f8',
                                    border: '1px solid #ebebeb',
                                    borderBottom: joined ? (active ? '1px solid white' : 'none') : '1px solid #ebebeb',
                                    borderRadius: joined ? '8px 8px 0 0' : '8px',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    position: 'relative', zIndex: active ? 2 : 1, marginBottom: (active && joined) ? '-1px' : '0', display: 'inline-flex', alignItems: 'center', gap: '7px',
                                }}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
                )}

                </div>


            {sorted.length === 0 ? (
                <div style={{ background: 'white', borderRadius: (viewMode === 'row' && !isMobile) ? '0 0 10px 10px' : '10px', border: '1px solid #ebebeb', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#ccc' }}>No activities found</div>
                </div>
            ) : (viewMode === 'row' && !isMobile) ? (
                /* ---------------- Row view — grouped per month, click a row to expand details inline ---------------- */
                monthGroups.map((group, gi) => (
                    <div key={group.key} style={{ marginBottom: gi < monthGroups.length - 1 ? '18px' : 0 }}>
                        <div style={{ background: 'white', borderRadius: gi === 0 ? '0 0 10px 10px' : '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '9px 14px', borderBottom: '1px solid #f5f5f5' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '2px', height: '16px', borderRadius: '1px', background: '#BE2A2E', flexShrink: 0 }} />
                                    {(() => { const m = String(group.label).match(/^(\S+)\s+(\d{4})$/); return m ? (<span style={{ fontSize: '12px', color: '#999' }}><span style={{ fontWeight: '500', color: '#333' }}>{m[1]}</span>{' ' + m[2]}</span>) : (<span style={{ fontSize: '11.5px', fontWeight: '400', color: '#999' }}>{group.label}</span>); })()}
                                </span>
                                <span style={{ fontSize: '11px', color: '#777', background: '#f3f3f3', borderRadius: '9px', padding: '2px 9px', whiteSpace: 'nowrap' }}>
                                    {group.items.length} {group.items.length === 1 ? 'activity' : 'activities'}
                                </span>
                            </div>
                            {group.items.map((act, i) => {
                                const isOpen = openId === act.id;
                                return (
                                    <div
                                        key={act.id}
                                        style={{ borderBottom: i < group.items.length - 1 ? '1px solid #f5f5f5' : 'none' }}
                                    >
                                        <div
                                            className="task-row"
                                            onClick={() => toggleOpen(act.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', gap: '12px',
                                                transition: 'background 0.1s', cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#111', lineHeight: 1.35 }}>{act.name}</div>
                                                    {whenLine(act) && (
                                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px', lineHeight: 1.4 }}>{whenLine(act)}</div>
                                                    )}

                                                    <div style={{ fontSize: '11.5px', color: '#CC0000', fontWeight: '400', padding: '6px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {isOpen ? 'Hide details' : 'Show details'}
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="6 9 12 15 18 9" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <QuickAttendanceButton
                                                    act={act}
                                                    onStart={(activity, mode) => setActiveCapture({ activityId: activity.id, mode })}
                                                />
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div style={{ padding: '4px 14px 16px', background: 'white' }}>
                                                <ScheduleDetails act={act} bucket={getBucket(act)} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                /* ---------------- Card view — grouped per month, click a card to expand details inline ---------------- */
                monthGroups.map((group, gi) => (
                    <div key={group.key} style={{ marginBottom: gi < monthGroups.length - 1 ? '18px' : 0 }}>
                        <MonthDivider label={group.label} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', alignItems: 'start' }}>
                            {group.items.map((act) => {
                                const bucket = getBucket(act);
                                const isOpen = openId === act.id;
                                return (
                                    <div
                                        key={act.id}
                                        onClick={() => toggleOpen(act.id)}
                                        className="task-row"
                                        style={{
                                            background: 'white', borderRadius: '10px',
                                            border: `1px solid ${isOpen ? '#f0d6d6' : '#ebebeb'}`,
                                            boxShadow: isOpen ? '0 2px 10px rgba(204,0,0,0.06)' : 'none',
                                            padding: '14px 16px 14px 18px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                            display: 'flex', flexDirection: 'column', gap: '8px',
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#CC0000' }} />

                                        {/* Header: title + status badge */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#111', lineHeight: '1.35' }}>{act.name}</div>
                                            <StatusBadge bucket={bucket} />
                                        </div>

                                        {/* Date / time */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#999' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span>
                                                {new Date(act.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {act.start_time ? ` · ${act.start_time.substring(0, 5)}` : ''}
                                                {act.end_time ? `–${act.end_time.substring(0, 5)}` : ''}
                                            </span>
                                        </div>

                                        {/* Location */}
                                        {act.location_name && !isMobile && (
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10.5px', color: '#999' }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                <span>{act.location_name}</span>
                                            </div>
                                        )}

                                        {isMobile ? null : isOpen ? (
                                            /* Expanded: full details in a column */
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ borderTop: '1px solid #f5f5f5', paddingTop: '10px', marginTop: '2px', cursor: 'default' }}
                                            >
                                                <ScheduleDetails act={act} bucket={bucket} compact />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Assignment preview */}
                                                {act.assignment && (
                                                    <div style={{ fontSize: '10.5px', color: '#888', lineHeight: '1.5', paddingTop: '2px', borderTop: '1px solid #f5f5f5', marginTop: '2px' }}>
                                                        <span style={{ fontWeight: '600', color: '#aaa' }}>Assignment: </span>{act.assignment}
                                                    </div>
                                                )}

                                                {/* Description preview — truncated to 2 lines */}
                                                {act.description && (
                                                    <div style={{
                                                        fontSize: '10.5px', color: '#999', lineHeight: '1.5',
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    }}>
                                                        {act.description}
                                                    </div>
                                                )}

                                                {/* Assigned by */}
                                                {act.assigned_by && (
                                                    <div style={{ fontSize: '10px', color: '#bbb' }}>
                                                        <span style={{ fontWeight: '600', color: '#CC0000' }}>By: </span>{act.assigned_by}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '2px' }}>
                                            <QuickAttendanceButton
                                                act={act}
                                                onStart={(activity, mode) => setActiveCapture({ activityId: activity.id, mode })}
                                            />
                                        </div>
                                        {isMobile && (
                                            <div data-mobile-details="1" onClick={(e) => e.stopPropagation()}>
                                                <button type="button" aria-expanded={isOpen} onClick={() => toggleOpen(act.id)} style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '10px 0 0', marginTop: '2px', background: 'none', border: 'none',
                                                    borderTop: '1px solid #f5f5f5', cursor: 'pointer', fontFamily: 'inherit',
                                                    fontSize: '11px', fontWeight: '600', color: '#888',
                                                }}>
                                                    <span>{isOpen ? 'Hide details' : 'Details'}</span>
                                                    <Chevron open={isOpen} />
                                                </button>
                                                {isOpen && (
                                                    <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {act.location_name && (
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                                <div style={{ color: '#bbb', marginTop: '2px', flexShrink: 0 }}><PinIcon /></div>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Location</div>
                                                                    <div style={{ fontSize: '12.5px', color: '#222', marginTop: '2px', lineHeight: '1.5', wordBreak: 'break-word' }}>{act.location_name}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <ScheduleDetails act={act} bucket={bucket} compact />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Face-scan overlay — opened directly from a row/card's Time In/Out button */}
            {activeCapture && (
                <AttendanceCapture
                    mode={activeCapture.mode}
                    activityId={activeCapture.activityId}
                    onClose={() => setActiveCapture(null)}
                    onSuccess={() => {
                        setActiveCapture(null);
                        router.reload({ only: ['activities'] });
                    }}
                />
            )}

        </VolunteerShell>
    );
}

/* ---------------- Month divider — a labeled line separating activity groups by month ---------------- */

function MonthDivider({ label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 10px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#999', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{label}</span>
            <div style={{ flex: 1, height: '1px', background: '#ebebeb' }} />
        </div>
    );
}

/* ---------------- Inline details — stacked in a single column ---------------- */

function ScheduleDetails({ act, bucket, compact }) {
    const fmtDate = new Date(act.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = act.start_time || act.end_time
        ? `${act.start_time ? act.start_time.substring(0, 5) : '—'} – ${act.end_time ? act.end_time.substring(0, 5) : '—'}`
        : '—';

    const fmt12 = (t) => {
        const [h, m] = String(t).split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
    };
    const timeText = act.start_time
        ? (act.end_time ? `${fmt12(act.start_time)} \u2013 ${fmt12(act.end_time)}` : fmt12(act.start_time))
        : null;
    const whenText = [fmtDate, timeText].filter(Boolean).join(' \u00B7 ');

    const fields = [
        ...(compact ? [] : [{ label: 'Where', value: act.location_name }]),
        { label: 'Assignment', value: act.description || act.assignment || 'No assignment specified.' },
        { label: 'Assigned by', value: act.assigned_by || 'Philippine Red Cross Admin' },
    ].filter((f) => f.value);

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {fields.map((f, i) => (
                    <div key={f.label} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '8px', flexShrink: 0 }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#bbb', marginTop: '5px', flexShrink: 0 }} />
                            {i < fields.length - 1 && <div style={{ width: '1px', flex: 1, background: '#e5e5e5', marginTop: '3px' }} />}
                        </div>
                        <div style={{ paddingBottom: i < fields.length - 1 ? '12px' : 0, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>{f.label}</div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', lineHeight: '1.5', wordBreak: 'break-word' }}>{f.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            {!compact && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '12px', marginTop: '14px', borderTop: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#999' }}>Status:</span>
                    <StatusBadge bucket={bucket} />
                </div>
            )}
        </div>
    );
}

function Chevron({ open }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

/* ---------------- Status badge ---------------- */

function StatusBadge({ bucket }) {
    const map = {
        assigned:  { label: 'Assigned',  bg: '#eff6ff', color: '#3b82f6' },
        ongoing:   { label: 'Ongoing',   bg: '#fffbeb', color: '#b45309' },
        upcoming:  { label: 'Upcoming',  bg: '#f5f3ff', color: '#8b5cf6' },
        completed: { label: 'Completed', bg: '#f0fdf4', color: '#16a34a' },
        missed:    { label: 'Missed',    bg: '#f4f4f5', color: '#71717a' },
        cancelled: { label: 'Cancelled', bg: '#fef2f2', color: '#DC2626' },
    };
    const s = map[bucket] || map.assigned;
    return (
        <span style={{
            fontSize: '9px', fontWeight: '600', padding: '3px 8px', borderRadius: '10px',
            background: s.bg, color: s.color, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
            {s.label}
        </span>
    );
}

/* ---------------- Time In / Time Out button on a schedule row/card ---------------- */

function QuickAttendanceButton({ act, onStart }) {
    const { setup } = useVolunteerShell();
    const faceReady = !!setup.face_done;
    const status = (act.status || 'assigned').toLowerCase();

    const base = {
        fontSize: '10px', fontWeight: '600', borderRadius: '5px', padding: '5px 12px',
        fontFamily: 'inherit', whiteSpace: 'nowrap', border: '1px solid #CC0000', cursor: 'pointer',
    };

    if (status === 'completed' || status === 'cancelled' || status === 'missed') {
        return null;
    }

    const timedIn = status === 'ongoing';
    const label = timedIn ? 'Time Out' : 'Time In';

    if (!timedIn && !isActivityDue(act.date)) {
        return null;
    }

    const toM = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
    const f12 = (m) => { const h = Math.floor(m / 60) % 24; return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
    const nowD = new Date();
    const nowM = nowD.getHours() * 60 + nowD.getMinutes();
    const todayStr = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(nowD.getDate()).padStart(2, '0')}`;
    const actDay = /^\d{4}-\d{2}-\d{2}/.test(String(act?.date || '')) ? String(act.date).slice(0, 10) : '';
    const sM = toM(act?.start_time);
    const eM = toM(act?.end_time);
    let blocked = null;
    if (actDay && actDay < todayStr) blocked = timedIn ? 'Time out closed' : 'Time in closed';
    else if (actDay && actDay > todayStr) blocked = 'Not open yet';
    else if (sM != null && eM != null) {
        if (timedIn) { if (nowM > eM + 15) blocked = 'Time out closed'; }
        else if (nowM > eM) blocked = 'Time in closed';
        else if (nowM < sM - 60) blocked = `Opens ${f12((sM - 60 + 1440) % 1440)}`;
    }
    if (blocked) {
        return (
            <span aria-disabled="true" title={blocked} style={{ ...base, background: '#f5f5f5', color: '#999', border: '1px solid #f0f0f0', cursor: 'not-allowed' }}>
                {blocked}
            </span>
        );
    }
    if (!faceReady) {
        return (
            <span
                aria-disabled="true"
                title={setup.face_pending ? 'Waiting for admin approval of your face registration' : 'Register your face to use Time In and Time Out'}
                style={{ ...base, background: '#f5f5f5', color: '#bbb', border: '1px solid #f0f0f0', cursor: 'not-allowed' }}
            >
                {label}
            </span>
        );
    }

    return (
        <button
            type="button"
            className={timedIn ? '' : 'btn-view'}
            onClick={(e) => { e.stopPropagation(); onStart(act, timedIn ? 'checkout' : 'checkin'); }}
            style={{ ...base, background: timedIn ? 'white' : '#CC0000', color: timedIn ? '#CC0000' : 'white' }}
        >
            {label}
        </button>
    );
}

/* ---------------- Icons ---------------- */

const iconProps = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function ClockIcon() {
    return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function CalendarIcon() {
    return <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function PinIcon() {
    return <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function ClipboardIcon() {
    return <svg {...iconProps}><path d="M9 2h6v4H9z"/><rect x="4" y="4" width="16" height="18" rx="2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg>;
}
function UserIcon() {
    return <svg {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function TextIcon() {
    return <svg {...iconProps}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>;
}

/* ---------------- Next activity card -- shown above the search box ---------------- */

function NextActivityCard({ acts, onView }) {
    const isMobile = useIsMobile(600);
    const list = acts || [];
    const dayKey = (d) => String(d || '').slice(0, 10);
    const toDate = (d) => new Date(dayKey(d) + 'T00:00:00');
    const startAt = (a) => new Date(dayKey(a.date) + 'T' + (a.start_time ? String(a.start_time).slice(0, 5) : '00:00') + ':00');
    const endAt = (a) => {
        if (!a.end_time) return null;
        const e = new Date(dayKey(a.date) + 'T' + String(a.end_time).slice(0, 5) + ':00');
        if (e <= startAt(a)) e.setDate(e.getDate() + 1);
        return e;
    };
    const t12 = (t) => {
        if (!t) return '';
        const p = String(t).split(':');
        const h = parseInt(p[0], 10);
        if (isNaN(h)) return '';
        return ((h % 12) || 12) + ':' + (p[1] || '00').slice(0, 2) + ' ' + (h >= 12 ? 'PM' : 'AM');
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const ongoing = list.find((a) => getBucket(a) === 'ongoing');
    const coming = list
        .filter((a) => {
            const b = getBucket(a);
            if (!(b === 'assigned' || b === 'upcoming') || !a.date) return false;
            if (toDate(a.date) < today) return false;
            const e = endAt(a);
            return !e || e > now;
        })
        .sort((a, b) => startAt(a) - startAt(b));
    const act = ongoing || coming[0];

    let label = 'Next activity';
    let when = '';
    let place = '';
    let chip = '';

    if (act) {
        const diffDays = Math.round((toDate(act.date) - today) / 86400000);
        const dayText = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : toDate(act.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' });
        const range = act.start_time
            ? (act.end_time ? t12(act.start_time) + ' \u2013 ' + t12(act.end_time) : t12(act.start_time))
            : '';
        when = [dayText, range].filter(Boolean).join(' \u00B7 ');
        place = act.location_name || '';

        if (ongoing) {
            label = 'Ongoing now';
            chip = act.end_time ? 'Time Out by ' + t12(act.end_time) : 'Time Out when you leave';
        } else if (diffDays === 0) {
            const mins = Math.round((startAt(act) - now) / 60000);
            chip = mins <= 0 ? 'Started' : mins < 60 ? 'in ' + mins + ' min' : 'in ' + Math.floor(mins / 60) + 'h' + (mins % 60 ? ' ' + (mins % 60) + 'm' : '');
        } else {
            chip = diffDays === 1 ? 'in 1 day' : 'in ' + diffDays + ' days';
        }
    }

    return (
        <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: '10px', background: '#a30000',
            padding: '10px 14px', marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '12px',
        }}>
            <img
                src="/images/banner.jpg"
                alt=""
                aria-hidden="true"
                style={{ position: 'absolute', top: 0, right: 0, width: isMobile ? '45%' : '68%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }}
            />
            <div style={{
                position: 'absolute', inset: 0,
                background: isMobile
                    ? 'linear-gradient(90deg, #b80000 0%, rgba(184,0,0,0.97) 55%, rgba(150,0,0,0.8) 100%)'
                    : 'linear-gradient(90deg, #b80000 0%, rgba(184,0,0,0.96) 34%, rgba(170,0,0,0.72) 62%, rgba(150,0,0,0.55) 100%)',
            }} />
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: 'white', letterSpacing: '0.8px', fontWeight: '600', textTransform: 'uppercase' }}>{label}</span>
                    {act && chip && (
                        <span style={{ fontSize: '10px', fontWeight: '600', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: '9px', whiteSpace: 'nowrap' }}>{chip}</span>
                    )}
                </div>
                {act ? (
                    <>
                        <div style={{ width: '24px', height: '2px', background: 'white', margin: '4px 0 5px' }} />
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'white', lineHeight: 1.3 }}>{act.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.92)', marginTop: '2px', lineHeight: 1.35 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                            <span>{when}</span>
                        </div>
                        {place && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.92)', marginTop: '2px', lineHeight: 1.35 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                <span>{place}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.95)', marginTop: '2px' }}>Nothing scheduled right now</div>
                )}
            </div>
            {act && onView && (
                <button
                    type="button"
                    onClick={() => onView(act)}
                    style={{ position: 'relative', background: 'white', color: '#CC0000', border: 'none', borderRadius: '14px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                    View details
                </button>
            )}
        </div>
    );
}

/* ---------------- Week overview -- shown below the Next activity card ---------------- */

function WeekOverview({ acts, weekOffset, onWeek, selectedDay, onPick, onClear }) {
    const isMobile = useIsMobile(600);
    const list = acts || [];
    const pad = (n) => String(n).padStart(2, '0');
    const keyOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const now = new Date();
    const todayKey = keyOf(now);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + weekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const KINDS = {
        ongoing: { color: '#f59e0b', label: 'Ongoing' },
        scheduled: { color: '#3b82f6', label: 'Scheduled' },
        done: { color: '#22c55e', label: 'Done' },
        missed: { color: '#dc2626', label: 'Missed' },
        cancelled: { color: '#9ca3af', label: 'Cancelled' },
        none: { color: '#d4d4d8', label: 'No activity' },
    };
    const kindOf = (items) => {
        if (!items.length) return 'none';
        const b = items.map(getBucket);
        if (b.includes('ongoing')) return 'ongoing';
        if (b.includes('assigned') || b.includes('upcoming')) return 'scheduled';
        if (b.includes('missed')) return 'missed';
        if (b.includes('completed')) return 'done';
        return 'cancelled';
    };

    const days = NAMES.map((name, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = keyOf(d);
        const items = list
            .filter((a) => a.date && String(a.date).slice(0, 10) === key)
            .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
        const kind = kindOf(items);
        const uniq = [...new Set(items.map(getBucket))];
        let note = '';
        if (items.length) {
            if (uniq.length === 1 && uniq[0] === 'missed') note = items.length + ' missed';
            else if (uniq.length === 1 && uniq[0] === 'completed') note = items.length + ' done';
            else note = items.length + (items.length === 1 ? ' activity' : ' activities');
        }
        return { name, num: d.getDate(), key, items, kind, note, isToday: key === todayKey };
    });

    const withActs = days.filter((d) => d.items.length).length;
    const counts = {};
    days.forEach((d) => { counts[d.kind] = (counts[d.kind] || 0) + 1; });
    const legendOrder = ['ongoing', 'scheduled', 'done', 'missed', 'cancelled', 'none'];

    const m1 = monday.toLocaleDateString('en-PH', { month: 'short' });
    const m2 = sunday.toLocaleDateString('en-PH', { month: 'short' });
    const range = m1 + ' ' + monday.getDate() + ' \u2013 ' + (m1 === m2 ? '' : m2 + ' ') + sunday.getDate() + ', ' + sunday.getFullYear();
    const title = weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : 'Week of ' + m1 + ' ' + monday.getDate();

    const arrow = {
        width: '22px', height: '22px', border: '1px solid #e3e3e3', borderRadius: '6px', background: 'white',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#777', padding: 0, flexShrink: 0,
    };
    const pickedLabel = selectedDay
        ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
        : '';

    return (
        <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', padding: isMobile ? '10px 12px' : '12px 14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#111' }}>{title}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>Your activities from Monday to Sunday</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {weekOffset !== 0 && (
                        <button type="button" onClick={() => onWeek(0)} style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: '600', color: '#555' }}>Today</button>
                    )}
                    <button type="button" aria-label="Previous week" onClick={() => onWeek(weekOffset - 1)} style={arrow}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <span style={{ fontSize: '11.5px', color: '#555', whiteSpace: 'nowrap' }}>{range}</span>
                    <button type="button" aria-label="Next week" onClick={() => onWeek(weekOffset + 1)} style={arrow}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px', color: withActs ? '#111' : '#c4c4c4', whiteSpace: 'nowrap', paddingRight: '12px', borderRight: '1px solid #ebebeb' }}>
                    {withActs} / 7
                    <span style={{ fontSize: '11px', fontWeight: 400, color: '#999', letterSpacing: 0, marginLeft: '6px' }}>days with activities</span>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                        {days.map((d) => (
                            <span key={d.key} style={{ height: '5px', borderRadius: '3px', background: d.kind === 'none' ? '#eee' : KINDS[d.kind].color, display: 'block' }} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '11px', color: '#777', flexWrap: 'wrap' }}>
                        {legendOrder.filter((k) => counts[k]).map((k) => (
                            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: KINDS[k].color }} />
                                {KINDS[k].label} ({counts[k]})
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', margin: '6px 0 3px', paddingTop: '5px', borderTop: '1px solid #f0f0f0' }}>Weekly breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: isMobile ? '2px' : '4px' }}>
                {days.map((d) => {
                    const sel = selectedDay === d.key;
                    const has = d.items.length > 0;
                    return (
                        <button
                            key={d.key}
                            type="button"
                            disabled={!has}
                            aria-pressed={sel}
                            onClick={() => onPick(d.key, d.items)}
                            style={{
                                minWidth: 0, textAlign: 'center', fontFamily: 'inherit',
                                border: sel ? '1px solid #d0d1d4' : d.isToday ? '1px solid #e4e5e7' : '1px solid #ebebeb',
                                background: sel ? '#f1f1f2' : d.isToday ? '#f7f7f8' : 'white', borderRadius: '8px',
                                padding: sel ? '2.5px 1.5px 2.5px' : '3px 2px 3px', cursor: has ? 'pointer' : 'default',
                            }}
                        >
                            <div style={{ fontSize: '10px', color: '#999', letterSpacing: '0.3px' }}>{d.name}</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: d.isToday ? '#BE2A2E' : sel ? '#555' : '#111', marginTop: '1px' }}>{d.num}</div>
                            <span style={{ display: 'block', width: '5px', height: '5px', borderRadius: '50%', background: KINDS[d.kind].color, margin: '4px auto 0' }} />
                            {d.isToday && (
                                <span style={{ display: 'inline-block', marginTop: '3px', fontSize: '9px', fontWeight: 600, background: '#BE2A2E', color: 'white', borderRadius: '7px', padding: '0 6px' }}>Today</span>
                            )}
                            {!isMobile && d.note && (
                                <div style={{ fontSize: '9.5px', color: '#777', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.note}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {selectedDay && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f5f5f5', fontSize: '11.5px', color: '#777' }}>
                    <span>Showing <span style={{ fontWeight: 600, color: '#111' }}>{pickedLabel}</span></span>
                    <button type="button" onClick={onClear} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Clear</button>
                </div>
            )}
        </div>
    );
}