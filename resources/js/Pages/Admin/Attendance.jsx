import { router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import ReviewPanel from '../../Components/AttendanceReviewPanel';
import DtrReviewPanel from '../../Components/DtrReviewPanel';
import AdminShell from '../../Components/AdminShell';

const fieldStyle = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px',
    background: '#f9f9f9', color: '#333', outline: 'none',
};
const labelStyle = { fontSize: '10px', fontWeight: '700', color: '#999', display: 'block', marginBottom: '7px', letterSpacing: '0.5px' };

const STATUS_PILLS = [
    { value: '', label: 'All', key: 'all' },
    { value: 'present', label: 'Present', key: 'present' },
    { value: 'absent', label: 'Absent', key: 'absent' },
    { value: 'excused', label: 'Excused', key: 'excused' },
];

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Volunteer name (A-Z)' },
    { value: 'hours', label: 'Most hours' },
];

const TONES = {
    green:  { bg: '#e8f7ee', fg: '#16a34a' },
    orange: { bg: '#fff4e0', fg: '#d97706' },
    red:    { bg: '#fdecec', fg: '#CC0000' },
    gray:   { bg: '#f1f1f3', fg: '#666' },
    blue:   { bg: '#e8f0fe', fg: '#2563eb' },
};

const normKey = (s) => String(s).toLowerCase().replace(/[_-]+/g, ' ').trim();
const pretty = (s) => {
    const t = normKey(s);
    return t.charAt(0).toUpperCase() + t.slice(1);
};
const locationLabel = (name) => {
    const s = String(name || '').trim();
    if (!s) return '';
    return s;
};
const methodLabel = (m) => {
    const k = normKey(m || '');
    if (/finger/.test(k)) return 'Fingerprint';
    if (/fallback/.test(k)) return 'Face + email code';
    if (/face|facial/.test(k)) return 'Facial recognition';
    return '';
};
const tagLabel = (v, suffix) => {
    const t = pretty(v);
    return new RegExp('\\b' + suffix + '$', 'i').test(t) ? t : t + ' ' + suffix;
};
const uniqueOptions = (list) => {
    const seen = new Set();
    return (list || []).filter((v) => {
        const k = normKey(v);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

const inTone = (v) => /late/i.test(v) ? 'orange' : /early|on.?time/i.test(v) ? 'green' : 'gray';
const outTone = (v) => /early/i.test(v) ? 'orange' : /on.?time/i.test(v) ? 'green' : 'gray';
const statusTone = (label) => ({
    'Present': 'green', 'Ongoing': 'blue', 'Absent': 'red',
    'Excused': 'gray', 'Needs Review': 'orange', 'Rejected': 'red',
}[label] || 'gray');

const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const presetRange = (name) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (name === 'today') return [ymd(today), ymd(today)];
    if (name === 'week') {
        const offset = (today.getDay() + 6) % 7; // week starts on Monday
        const start = new Date(today);
        start.setDate(today.getDate() - offset);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return [ymd(start), ymd(end)];
    }
    if (name === 'month') {
        return [
            ymd(new Date(today.getFullYear(), today.getMonth(), 1)),
            ymd(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
        ];
    }
    return ['', ''];
};
const PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
];
const detectPreset = (from, to) => {
    if (!from && !to) return '';
    const hit = PRESETS.find((p) => {
        const [a, b] = presetRange(p.value);
        return a === from && b === to;
    });
    return hit ? hit.value : 'custom';
};

const COLS = [
    { key: 'date', label: 'Date', essential: true },
    { key: 'name', label: 'Name', essential: true, locked: true },
    { key: 'activity', label: 'Activity', essential: true },
    { key: 'atime', label: 'Activity time', essential: false },
    { key: 'location', label: 'Location', essential: false },
    { key: 'assigned', label: 'Assigned by', essential: false },
    { key: 'in', label: 'Time in', essential: true },
    { key: 'out', label: 'Time out', essential: true },
    { key: 'method', label: 'Method', essential: false },
    { key: 'hours', label: 'Hours', essential: true },
    { key: 'status', label: 'Status', essential: true },
];
const COLS_KEY = 'attendance_columns_v1';
const essentialCols = () => Object.fromEntries(COLS.map(c => [c.key, !!c.essential]));
const loadCols = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(COLS_KEY) || 'null');
        if (saved && typeof saved === 'object') {
            return Object.fromEntries(COLS.map(c => [c.key, c.locked ? true : (c.key in saved ? !!saved[c.key] : !!c.essential)]));
        }
    } catch (e) {}
    return essentialCols();
};
const fromFilters = (f) => ({
    search: f?.search || '',
    status: f?.status || '',
    volunteer_id: f?.volunteer_id || '',
    activity_id: f?.activity_id || '',
    location: f?.location || '',
    date_from: f?.date_from || f?.date || '',
    date_to: f?.date_to || '',
    time_in_status: f?.time_in_status || '',
    time_out_status: f?.time_out_status || '',
    method: f?.method || '',
    manual: (f?.manual === '1' || f?.manual === 'true' || f?.manual === 1 || f?.manual === true) ? '1' : '',
    sort: f?.sort || '',
});

function Toggle({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick} style={{
            padding: '6px 12px', borderRadius: '7px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer',
            background: active ? '#CC0000' : 'white', color: active ? 'white' : '#555',
            border: '1px solid ' + (active ? '#CC0000' : '#e3e3e6'),
        }}>{children}</button>
    );
}

function Tag({ tone, children }) {
    const t = TONES[tone] || TONES.gray;
    return (
        <span style={{ background: t.bg, color: t.fg, borderRadius: '6px', padding: '3px 8px', fontSize: '10.5px', fontWeight: '700', whiteSpace: 'nowrap' }}>{children}</span>
    );
}

const dragPosKey = '__attFilterPos';
function applyDrag(el, x, y) {
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    const r = el.getBoundingClientRect();
    if (r.left < 0) x -= r.left; else if (r.right > window.innerWidth) x -= r.right - window.innerWidth;
    if (r.top < 0) y -= r.top; else if (r.bottom > window.innerHeight) y -= r.bottom - window.innerHeight;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    window[dragPosKey] = { x, y };
}
function dragRef(el) {
    const p = window[dragPosKey];
    if (el && p) applyDrag(el, p.x, p.y);
}
function dragDown(e) {
    if (e.target.closest('select,button,input,textarea,a,label,option')) return;
    const el = e.currentTarget;
    const p = window[dragPosKey] || { x: 0, y: 0 };
    el._d = { sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
}
function dragMove(e) {
    const el = e.currentTarget;
    const d = el._d;
    if (!d) return;
    applyDrag(el, d.ox + e.clientX - d.sx, d.oy + e.clientY - d.sy);
}
function dragUp(e) { e.currentTarget._d = null; }
const COL_PATHS = {
    date: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    name: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    activity: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    atime: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    assigned: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    in: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    hours: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    method: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    status: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};
const COL_GROUPS = [
    { title: 'Basics', keys: ['date', 'name', 'activity', 'atime'] },
    { title: 'Place and people', keys: ['location', 'assigned'] },
    { title: 'Attendance', keys: ['in', 'out', 'hours', 'method', 'status'] },
];
const COL_HELP = {
    name: 'Always shown',
    atime: 'Scheduled start and end',
    assigned: 'Who created the activity',
    method: 'Face, or face + email code',
};
const TIME_LOG_KEYS = ['name', 'activity', 'in', 'out', 'hours'];

function ColIcon({ name, size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: COL_PATHS[name] }} />;
}

/* ColsPopover: two-column checklist */
function ColsPopover({ visible, saveCols, toggleCol, onClose }) {
    const shown = COLS.filter(c => visible[c.key]);
    const sameAs = (keys) => shown.length === keys.length && shown.every(c => keys.includes(c.key));
    const setKeys = (keys) => saveCols(Object.fromEntries(COLS.map(c => [c.key, c.locked ? true : keys.includes(c.key)])));
    const essKeys = COLS.filter(c => c.essential).map(c => c.key);
    const allKeys = COLS.map(c => c.key);

    const presets = [
        { label: 'Essential', keys: essKeys },
        { label: 'Time log', keys: TIME_LOG_KEYS },
        { label: 'Everything', keys: allKeys },
    ];

    return (
        <div style={{ position: 'absolute', right: 0, top: '34px', width: '340px', maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto', background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: '16px', zIndex: 20, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>Customize columns</div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>Choose what you want to see in the table.</div>
                </div>
                <span style={{ fontSize: '11px', color: '#777', whiteSpace: 'nowrap', paddingTop: '3px' }}>{shown.length} of {COLS.length} shown</span>
            </div>

            <div style={{ display: 'flex', background: '#f5f5f6', borderRadius: '8px', padding: '2px', margin: '12px 0' }}>
                {presets.map(p => {
                    const act = sameAs(p.keys);
                    return (
                        <button key={p.label} type="button" onClick={() => setKeys(p.keys)} style={{ flex: 1, padding: '6px', fontSize: '11.5px', fontWeight: act ? '600' : '500', cursor: 'pointer', borderRadius: '6px', border: act ? '1px solid #ebebeb' : '1px solid transparent', background: act ? 'white' : 'transparent', color: act ? '#111' : '#666' }}>
                            {p.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                {COLS.map(c => {
                    const on = !!visible[c.key];
                    const toggle = () => { if (!c.locked) toggleCol(c.key); };
                    return (
                        <div key={c.key} role="checkbox" aria-checked={on} aria-disabled={!!c.locked} tabIndex={c.locked ? -1 : 0}
                            onClick={toggle}
                            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }}
                            title={c.locked ? 'Always shown' : undefined}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: c.locked ? 'default' : 'pointer', opacity: c.locked ? 0.7 : 1, outline: 'none' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', border: on ? '1.5px solid #CC0000' : '1.5px solid #c9c9ce', background: on ? '#CC0000' : 'white' }}>
                                {on && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                )}
                            </span>
                            <span style={{ fontSize: '12.5px', color: '#222', whiteSpace: 'nowrap' }}>{c.label}</span>
                            {c.locked && <span style={{ color: '#aaa', display: 'flex' }}><ColIcon name="lock" size={12} /></span>}
                        </div>
                    );
                })}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '10px', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px' }}>Your table will show</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {shown.map(c => (
                        <span key={c.key} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#f5f5f6', color: '#555', border: '1px solid #ececec' }}>{c.label}</span>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <button type="button" onClick={() => saveCols(essentialCols())} style={{ border: 'none', background: 'none', padding: 0, fontSize: '12px', color: '#777', cursor: 'pointer', textDecoration: 'underline' }}>Reset to default</button>
                <button type="button" onClick={onClose} style={{ padding: '7px 22px', border: 'none', borderRadius: '8px', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Done</button>
            </div>
        </div>
    );
}

export default function AdminAttendance({ attendances, volunteers, activities, options, counts, total, filters, attendanceReviews = [], dtrSubmissions = [] }) {
    const applied = fromFilters(filters);
    const [f, setF] = useState(applied);
    const [customOpen, setCustomOpen] = useState(detectPreset(applied.date_from, applied.date_to) === 'custom');
    const [showFilters, setShowFilters] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showCols, setShowCols] = useState(false);
    const [visible, setVisible] = useState(loadCols);
    const saveCols = (next) => {
        setVisible(next);
        try { localStorage.setItem(COLS_KEY, JSON.stringify(next)); } catch (e) {}
    };
    const toggleCol = (key) => saveCols({ ...visible, [key]: !visible[key] });
    const colOn = (label) => { const c = COLS.find(x => x.label === label); return !c || visible[c.key]; };
    const show = (key) => visible[key];
    const visibleCount = COLS.filter(c => visible[c.key]).length;
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ status: 'present', time_in: '', time_out: '', remark: '' });
    const [errs, setErrs] = useState({});
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('records');

    const deleteSelfie = (r) => {
        if (window.confirm('Delete this selfie? The attendance record stays, but the photo cannot be recovered.')) {
            router.delete(route('admin.attendance.fallback-photo.delete', r.id), { preserveScroll: true });
        }
    };
    const selfieBtnStyle = { padding: '5px 12px', background: '#f7f7f8', border: '1px solid #ebebeb', borderRadius: '7px', fontWeight: '600', fontSize: '11px', cursor: 'pointer', marginRight: '6px', textDecoration: 'none', display: 'inline-block' };
    const selfieBtns = (r) => (r.fallback_photo_path && r.status !== 'needs_review') ? (
        <>
            <a href={route('admin.attendance.fallback-photo', r.id)} target="_blank" rel="noreferrer" style={{ ...selfieBtnStyle, color: '#555' }}>View selfie</a>
            <button type="button" onClick={() => deleteSelfie(r)} style={{ ...selfieBtnStyle, color: '#CC0000' }}>Delete selfie</button>
        </>
    ) : null;

    const apply = (next) => {
        router.get(route('admin.attendance.index'), clean(next), {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    // Search applies by itself shortly after typing stops.
    const first = useRef(true);
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => apply({ ...applied, search: f.search }), 400);
        return () => clearTimeout(t);
    }, [f.search]);

    const firstPanel = useRef(true);
    const panelKey = JSON.stringify([f.volunteer_id, f.activity_id, f.location, f.date_from, f.date_to, f.time_in_status, f.time_out_status, f.method, f.sort]);
    useEffect(() => {
        if (firstPanel.current) { firstPanel.current = false; return; }
        apply(f);
    }, [panelKey]);

    const pickStatus = (value) => {
        setF((prev) => ({ ...prev, status: value }));
        apply({ ...applied, status: value });
    };

    const done = () => {
        apply(f);
        setShowFilters(false);
    };

    const clearAll = () => {
        setF(fromFilters({}));
        setCustomOpen(false);
        setShowFilters(false);
        router.get(route('admin.attendance.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const removeChip = (clear) => {
        setF((prev) => ({ ...prev, ...clear }));
        if ('date_from' in clear) setCustomOpen(false);
        apply({ ...applied, ...clear });
    };

    const draftPreset = customOpen ? 'custom' : detectPreset(f.date_from, f.date_to);

    const pickPreset = (value) => {
        setCustomOpen(false);
        if (draftPreset === value) {
            setF({ ...f, date_from: '', date_to: '' });
        } else {
            const [a, b] = presetRange(value);
            setF({ ...f, date_from: a, date_to: b });
        }
    };

    const pickCustom = () => {
        if (draftPreset === 'custom') {
            setCustomOpen(false);
            setF({ ...f, date_from: '', date_to: '' });
        } else {
            setCustomOpen(true);
            setF({ ...f, date_from: '', date_to: '' });
        }
    };

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

    const formatSchedule = (activity) => {
        if (!activity?.start_time || !activity?.end_time) return '-';
        const fmt = (t) => {
            const m = String(t).match(/(\d{1,2}):(\d{2})/);
            if (!m) return '-';
            let h = parseInt(m[1], 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return h + ':' + m[2] + ' ' + ampm;
        };
        return fmt(activity.start_time) + ' - ' + fmt(activity.end_time);
    };
    const statusLabel = (r) => r.status === 'absent' ? 'Absent'
        : r.status === 'excused' ? 'Excused'
        : r.status === 'needs_review' ? 'Needs Review'
        : r.status === 'rejected' ? 'Rejected'
        : !r.time_out ? 'Ongoing'
        : 'Present';

    const toHHMM = (dt) => {
        if (!dt) return '';
        const d = new Date(dt);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };

    const openEdit = (r) => {
        setErrs({});
        setForm({
            status: ['present', 'absent', 'excused'].includes(r.status) ? r.status : 'present',
            time_in: toHHMM(r.time_in),
            time_out: toHHMM(r.time_out),
            remark: '',
        });
        setEditing(r);
    };

    const saveEdit = () => {
        setSaving(true);
        router.post(route('admin.attendance.correct', editing.id), form, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
            onError: (e) => setErrs(e),
            onFinish: () => setSaving(false),
        });
    };

    // Exports always follow what is currently shown on the page.
    const colsParam = COLS.filter(c => visible[c.key]).map(c => c.key).join(',');
    const qs = new URLSearchParams({ ...clean(applied), cols: colsParam }).toString();
    const pdfUrl = route('admin.attendance.export.pdf') + (qs ? '?' + qs : '');
    const excelUrl = route('admin.attendance.export.excel') + (qs ? '?' + qs : '');

    const timeInOptions = uniqueOptions(options?.time_in_status);
    const timeOutOptions = uniqueOptions(options?.time_out_status);
    const methodOptions = uniqueOptions(options?.method).filter(o => methodLabel(o));
const matchOpt = (list, v) => list.find(o => normKey(o) === normKey(v)) || '';
const timeInValue = matchOpt(timeInOptions, f.time_in_status);
const timeOutValue = f.time_out_status === 'none' ? 'none' : matchOpt(timeOutOptions, f.time_out_status);
    const locationOptions = options?.location || [];

    const panelCount = [
        applied.date_from || applied.date_to, applied.activity_id, applied.volunteer_id, applied.location,
        applied.time_in_status, applied.time_out_status, applied.method, applied.sort,
    ].filter(Boolean).length;

    const chips = [];
    if (applied.date_from || applied.date_to) {
        const p = detectPreset(applied.date_from, applied.date_to);
        const label = p && p !== 'custom'
            ? PRESETS.find(x => x.value === p).label
            : applied.date_from && applied.date_to ? formatDate(applied.date_from) + ' to ' + formatDate(applied.date_to)
            : applied.date_from ? 'From ' + formatDate(applied.date_from) : 'Until ' + formatDate(applied.date_to);
        chips.push({ label, clear: { date_from: '', date_to: '' } });
    }
    if (applied.activity_id) {
        const a = activities.find(x => String(x.id) === String(applied.activity_id));
        chips.push({ label: a?.name || 'Activity', clear: { activity_id: '' } });
    }
    if (applied.volunteer_id) {
        const v = volunteers.find(x => String(x.id) === String(applied.volunteer_id));
        chips.push({ label: v?.name || 'Volunteer', clear: { volunteer_id: '' } });
    }
    if (applied.location) chips.push({ label: applied.location, clear: { location: '' } });
    if (applied.time_in_status) chips.push({ label: 'Time in: ' + pretty(applied.time_in_status), clear: { time_in_status: '' } });
    if (applied.time_out_status) chips.push({ label: applied.time_out_status === 'none' ? 'No time out' : 'Time out: ' + pretty(applied.time_out_status), clear: { time_out_status: '' } });
    if (applied.method) chips.push({ label: methodLabel(applied.method) || pretty(applied.method), clear: { method: '' } });

    if (applied.sort) chips.push({ label: SORTS.find(s => s.value === applied.sort)?.label || applied.sort, clear: { sort: '' } });

    chips.splice(0, chips.length, ...chips.filter(ch => ch && ch.label));
    const anyFilter = chips.length > 0 || applied.status || applied.search;

    return (
        <AdminShell active="attendance" title="Attendance">
            <style>{`
                .row-hover:hover { background: #fafafa !important; }
                .btn-export:hover { background: #aa0000 !important; }
                .btn-filter:hover { background: #aa0000 !important; } .btn-filter-group:hover { background: #ececec !important; } .drag-card select, .drag-card button, .drag-card input, .drag-card label, .drag-card a { cursor: pointer; } div:has(> .btn-export) { margin-left: auto; }
                .btn-clear:hover { background: #ececec !important; }
                .btn-cols:hover { background: #f7f7f8 !important; }
                .menu-item:hover { background: #f7f7f8 !important; }
                .chip-x:hover { color: #CC0000 !important; }
            `}</style>

            {/* TOP BAR: search, filters, export */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', position: 'relative' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px', minWidth: 0, height: '38px', marginRight: '-10px', background: 'white', border: '1px solid #e3e3e3', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                        type="text"
                        value={f.search}
                        onChange={e => setF({ ...f, search: e.target.value })}
                        placeholder="Search volunteer, activity, location..."
                        style={{ ...fieldStyle, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', borderRadius: '0', height: '100%', padding: '0 12px 0 34px', fontSize: '13px', fontFamily: 'inherit', color: '#111' }}
                    />
                </div>

                <div style={{ position: 'static' }}>
                    <button onClick={() => { setShowFilters(!showFilters); setShowExport(false); }} className="btn-filter-group" aria-label="Filters" title="Filters" style={{
                        position: 'relative', padding: '0 14px', height: '38px', background: 'white', color: '#555', border: '1px solid #e3e3e3', borderLeft: 'none', borderRadius: '0 8px 8px 0',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.15s',
                    }}>
                        <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '1px', height: '18px', background: '#e3e3e3' }} /><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="6" r="2"/><line x1="4" y1="6" x2="12" y2="6"/><line x1="16" y1="6" x2="20" y2="6"/><circle cx="8" cy="12" r="2"/><line x1="4" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="20" y2="12"/><circle cx="17" cy="18" r="2"/><line x1="4" y1="18" x2="15" y2="18"/><line x1="19" y1="18" x2="20" y2="18"/></svg>
                        
                    </button>

                    {showFilters && (
                        <>
                            
                            <div className="drag-card" ref={dragRef} onPointerDown={dragDown} onPointerMove={dragMove} onPointerUp={dragUp} onPointerCancel={dragUp} style={{ cursor: 'grab', touchAction: 'none', position: 'absolute', left: 'clamp(0px, calc(min(100%, 380px) - 194px), calc(100% - 350px))', top: '46px', width: '350px', maxWidth: '88vw', maxHeight: '78vh', overflowY: 'auto', background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: '16px', zIndex: 20, boxSizing: 'border-box' }}>

                                <label style={labelStyle}>DATE</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: customOpen ? '10px' : '16px' }}>
                                    {PRESETS.map(p => (
                                        <Toggle key={p.value} active={draftPreset === p.value} onClick={() => pickPreset(p.value)}>{p.label}</Toggle>
                                    ))}
                                    <Toggle active={draftPreset === 'custom'} onClick={pickCustom}>Custom</Toggle>
                                </div>
                                {customOpen && (
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <input type="date" value={f.date_from} onChange={e => setF({ ...f, date_from: e.target.value })} style={fieldStyle} />
                                        <input type="date" value={f.date_to} onChange={e => setF({ ...f, date_to: e.target.value })} style={fieldStyle} />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>ACTIVITY</label>
                                        <select value={f.activity_id} onChange={e => setF({ ...f, activity_id: e.target.value })} style={fieldStyle}>
                                            <option value="">All activities</option>
                                            {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>LOCATION</label>
                                        <select value={f.location} onChange={e => setF({ ...f, location: e.target.value })} style={fieldStyle}>
                                            <option value="">All locations</option>
                                            {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <label style={labelStyle}>VOLUNTEER</label>
                                <select value={f.volunteer_id} onChange={e => setF({ ...f, volunteer_id: e.target.value })} style={{ ...fieldStyle, marginBottom: '16px' }}>
                                    <option value="">Anyone</option>
                                    {volunteers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>TIME IN</label>
                                        <select value={timeInValue} onChange={e => setF({ ...f, time_in_status: e.target.value })} style={fieldStyle}>
                                            <option value="">Any</option>
                                            {timeInOptions.map(o => <option key={o} value={o}>{pretty(o)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>TIME OUT</label>
                                        <select value={timeOutValue} onChange={e => setF({ ...f, time_out_status: e.target.value })} style={fieldStyle}>
                                            <option value="">Any</option>
                                            {timeOutOptions.map(o => <option key={o} value={o}>{pretty(o)}</option>)}
                                            <option value="none">No time out</option>
                                        </select>
                                    </div>
                                </div>



                                <label style={labelStyle}>METHOD</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    {methodOptions.map(o => (
                                        <Toggle key={o} active={normKey(f.method) === normKey(o)} onClick={() => setF({ ...f, method: normKey(f.method) === normKey(o) ? '' : o })}>{methodLabel(o)}</Toggle>
                                    ))}
                                </div>

                                <label style={labelStyle}>SORT BY</label>
                                <select value={f.sort || 'newest'} onChange={e => setF({ ...f, sort: e.target.value === 'newest' ? '' : e.target.value })} style={{ ...fieldStyle, marginBottom: '16px' }}>
                                    {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#CC0000', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Clear all</button>
                                    <button onClick={done} className="btn-filter" style={{ padding: '8px 22px', background: '#CC0000', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', transition: 'background 0.15s' }}>Done</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                {tab === 'records' && (
                    <div style={{ position: 'relative' }}>
                        <button type="button" className="btn-cols" onClick={() => { setShowCols(!showCols); setShowExport(false); setShowFilters(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 14px', background: 'white', border: '1px solid #e3e3e3', borderRadius: '8px', color: '#555', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/></svg>
                            Columns
                        </button>
                        {showCols && (
                            <>
                                <div onClick={() => setShowCols(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                                <ColsPopover visible={visible} saveCols={saveCols} toggleCol={toggleCol} onClose={() => setShowCols(false)} />
                            </>
                        )}
                    </div>
                )}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setShowExport(!showExport); setShowFilters(false); }} className="btn-export" style={{
                background: '#CC0000', color: 'white', padding: '0 14px', height: '38px', border: 'none',
                borderRadius: '8px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {showExport && (
                        <>
                            <div onClick={() => setShowExport(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                            <div style={{ position: 'absolute', right: 0, top: '46px', background: 'white', border: '1px solid #ebebeb', borderRadius: '9px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', width: '230px', zIndex: 20, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 14px', fontSize: '10.5px', color: '#999', borderBottom: '1px solid #f5f5f5' }}>
                                    Exports the current view ({attendances.length} records)
                                </div>
                                <a href={pdfUrl} target="_blank" rel="noreferrer" onClick={() => setShowExport(false)} className="menu-item" style={{ display: 'block', padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#333', textDecoration: 'none' }}>Export as PDF</a>
                                <a href={excelUrl} onClick={() => setShowExport(false)} className="menu-item" style={{ display: 'block', padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#333', textDecoration: 'none', borderTop: '1px solid #f5f5f5' }}>Export as Excel</a>
                            </div>
                        </>
                    )}
                </div>
            </div>
            </div>

            {/* STATUS TABS WITH COUNTS */}
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {[...STATUS_PILLS, { value: '__review', label: 'Needs Review', key: 'review' }].map(p => {
                    const active = p.key === 'review' ? tab === 'review' : (tab === 'records' && applied.status === p.value);
                    return (
                        <button key={p.key} onClick={() => { if (p.key === 'review') { setTab('review'); } else { setTab('records'); pickStatus(p.value); } }} style={{
                            padding: active ? '9px 14px' : '8px 14px', borderRadius: '8px 8px 0 0', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: active ? 'white' : '#f7f7f8', color: active ? '#555' : '#999',
                            border: '1px solid #ebebeb', borderBottom: active ? '1px solid white' : 'none',
                            marginBottom: active ? '-1px' : '0', position: 'relative', zIndex: active ? 2 : 1,
                        }}>
                            {p.label} <span style={{ opacity: 0.7, fontSize: '12px', fontWeight: '500' }}>{p.key === 'review' ? attendanceReviews.length + dtrSubmissions.length : (counts?.[p.key] ?? 0)}{p.key === 'review' && (attendanceReviews.length + dtrSubmissions.length) > 0 && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#CC0000', marginLeft: '5px', verticalAlign: 'middle' }} />}</span>
                        </button>
                    );
                })}
                {tab === 'records' && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#999', paddingBottom: '8px' }}>Showing {attendances.length} of {total ?? attendances.length} records</span>
                )}
            </div>

            {/* NEEDS REVIEW BOX */}
            {tab === 'review' && (dtrSubmissions.length > 0 ? <DtrReviewPanel dtrs={dtrSubmissions} attendanceCount={attendanceReviews.length}><ReviewPanel records={attendanceReviews} /></DtrReviewPanel> : <ReviewPanel records={attendanceReviews} />)}
            {tab === 'review' && attendanceReviews.length === 0 && dtrSubmissions.length === 0 && (
                <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#bbb', fontSize: '12px' }}>Nothing is waiting for review.</div>
            )}

            {tab === 'records' && (<>
            {/* TABLE */}
            <div style={{ background: 'white', borderRadius: '0 10px 10px 10px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
                {anyFilter && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                        {chips.map((c, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff1f1', color: '#CC0000', border: '1px solid #f5c2c2', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600' }}>
                                {c.label}
                                <span onClick={() => removeChip(c.clear)} className="chip-x" style={{ cursor: 'pointer', color: '#e57373', fontSize: '13px', lineHeight: 1 }}>&times;</span>
                            </span>
                        ))}
                        <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Clear all</button>
                    </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: (visibleCount * 100 + 80) + 'px' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                {['Date', 'Name', 'Activity', 'Activity time', 'Location', 'Assigned by', 'Time in', 'Time out', 'Method', 'Hours', 'Status', ''].filter(colOn).map((h, i) => (
                                    <th key={i} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#999', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {attendances.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleCount + 1} style={{ padding: '48px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>No attendance records found.</td>
                                </tr>
                            ) : attendances.map((record) => {
                                const label = statusLabel(record);
                                return (
                                    <tr key={record.id} className="row-hover" style={{ borderTop: '1px solid #f5f5f5', transition: 'background 0.1s' }}>
                                        {show('date') && <td style={{ padding: '11px 18px', fontSize: '13px', fontWeight: '500', color: '#111', whiteSpace: 'nowrap' }}>{formatDate(record.date)}</td>}
                                        <td style={{ padding: '11px 18px', fontSize: '13px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap' }}>{record.user?.name ?? '-'}</td>
                                        {show('activity') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#555' }}><div title={record.activity?.name ?? ''} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.activity?.name ?? '-'}</div></td>}
                                        {show('atime') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>{formatSchedule(record.activity)}</td>}
                                        {show('location') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#555' }}><div title={record.activity?.type === 'branch' ? 'Branch' : (locationLabel(record.activity?.location_name) || '')} style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(record.activity?.type === 'branch' ? 'Branch' : locationLabel(record.activity?.location_name)) || '-'}</div></td>}
                                        {show('assigned') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>{record.activity?.assigned_by || '-'}</td>}
                                        
                                        {show('in') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#16a34a', fontWeight: '400', whiteSpace: 'nowrap' }}>{formatTime(record.time_in)}</td>}
                                        {show('out') && <td style={{ padding: '11px 18px', fontSize: '13px', color: record.time_out ? '#CC0000' : '#666', fontWeight: '400', whiteSpace: 'nowrap' }}>{formatTime(record.time_out)}</td>}
                                        {show('method') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>{methodLabel(record.attendance_method) || '-'}</td>}
                                        {show('hours') && <td style={{ padding: '11px 18px', fontSize: '13px', color: '#111', fontWeight: '600', whiteSpace: 'nowrap' }}>{record.hours_rendered ? record.hours_rendered + ' hrs' : '-'}</td>}
                                        {show('status') && <td style={{ padding: '11px 18px' }}><Tag tone={statusTone(label)}>{label}</Tag></td>}
                                        <td style={{ padding: '11px 18px', whiteSpace: 'nowrap' }}>
                                            {selfieBtns(record)}<button onClick={() => openEdit(record)} style={{ padding: '5px 12px', background: '#f7f7f8', color: '#555', border: '1px solid #ebebeb', borderRadius: '7px', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            </>)}

            {editing && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: 'white', borderRadius: '10px', padding: '22px', width: '380px', maxWidth: '92vw' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Edit Attendance</div>
                        <div style={{ fontSize: '11px', color: '#888', margin: '4px 0 14px' }}>
                            {editing.user?.name} &middot; {editing.activity?.name} &middot; {formatDate(editing.date)}
                        </div>

                        <label style={labelStyle}>STATUS</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...fieldStyle, marginBottom: '12px' }}>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="excused">Excused</option>
                        </select>

                        {form.status === 'present' && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>TIME IN</label>
                                    <input type="time" value={form.time_in} onChange={e => setForm({ ...form, time_in: e.target.value })} style={fieldStyle} />
                                    {errs.time_in && <div style={{ color: '#CC0000', fontSize: '10.5px', marginTop: '4px' }}>{errs.time_in}</div>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>TIME OUT</label>
                                    <input type="time" value={form.time_out} onChange={e => setForm({ ...form, time_out: e.target.value })} style={fieldStyle} />
                                    {errs.time_out && <div style={{ color: '#CC0000', fontSize: '10.5px', marginTop: '4px' }}>{errs.time_out}</div>}
                                </div>
                            </div>
                        )}

                        <label style={labelStyle}>REASON (REQUIRED)</label>
                        <textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} placeholder="Why is this being changed?" />
                        {errs.remark && <div style={{ color: '#CC0000', fontSize: '10.5px', marginTop: '4px' }}>{errs.remark}</div>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                            <button onClick={() => setEditing(null)} style={{ padding: '8px 16px', background: '#f7f7f8', color: '#555', border: '1px solid #ebebeb', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveEdit} disabled={saving} style={{ padding: '8px 16px', background: '#CC0000', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
