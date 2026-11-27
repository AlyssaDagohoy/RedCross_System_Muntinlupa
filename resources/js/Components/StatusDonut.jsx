const SEGMENTS = [
    { key: 'present', label: 'Present', color: '#1D9E75' },
    { key: 'absent', label: 'Absent', color: '#E24B4A' },
    { key: 'excused', label: 'Excused', color: '#378ADD' },
    { key: 'needs_review', label: 'Needs review', color: '#BA7517' },
    { key: 'cancelled', label: 'Cancelled', color: '#888780' },
    { key: 'rejected', label: 'Rejected', color: '#D4537E' },
    { key: 'ongoing', label: 'Ongoing', color: '#7F77DD' },
];

export function recordStatusKey(r) {
    const s = String((r && (r.attendance_status || r.status)) || '').toLowerCase();
    if (String((r && r.activity_status) || '').toLowerCase() === 'cancelled') return 'cancelled';
    if (['present', 'absent', 'excused', 'needs_review', 'rejected', 'cancelled'].includes(s)) return s;
    if (r && r.time_out) return 'present';
    if (r && r.time_in) return 'ongoing';
    return s || 'assigned';
}

export default function StatusDonut({ records, title = 'All records by status', onSelect, activeKey, noMargin }) {
    const list = Array.isArray(records) ? records : [];
    const counts = {};
    list.forEach((r) => {
        const k = recordStatusKey(r);
        counts[k] = (counts[k] || 0) + 1;
    });
    const total = list.length;
    const segs = SEGMENTS.filter((s) => counts[s.key] > 0).map((s) => ({ ...s, count: counts[s.key] }));

    const R = 38;
    const C = 2 * Math.PI * R;
    let acc = 0;
    const clickable = typeof onSelect === 'function';

    return (
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '10px 14px', marginBottom: noMargin ? 0 : '14px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{title}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{total} record{total !== 1 ? 's' : ''}, all time</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '8px', flexWrap: 'wrap' }}>
                <svg viewBox="0 0 100 100" width="72" height="72" role="img" aria-label={'Records by status, ' + total + ' total'} style={{ flexShrink: 0 }}>
                    <g transform="rotate(-90 50 50)" fill="none" strokeWidth="14">
                        <circle cx="50" cy="50" r={R} stroke="#f0f0f0" />
                        {segs.map((s) => {
                            const len = (s.count / total) * C;
                            const el = (
                                <circle key={s.key} cx="50" cy="50" r={R} stroke={s.color}
                                    strokeDasharray={len + ' ' + (C - len)} strokeDashoffset={-acc} />
                            );
                            acc += len;
                            return el;
                        })}
                    </g>
                    <text x="50" y="52" textAnchor="middle" style={{ fill: '#111', fontSize: '18px', fontWeight: 600 }}>{total}</text>
                    <text x="50" y="65" textAnchor="middle" style={{ fill: '#888', fontSize: '10px' }}>records</text>
                </svg>
                <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px 24px' }}>
                    {segs.length === 0 && <div style={{ fontSize: '11px', color: '#bbb' }}>No records yet</div>}
                    {segs.map((s) => {
                        const on = clickable && activeKey === s.key;
                        return (
                            <div
                                key={s.key}
                                role={clickable ? 'button' : undefined}
                                tabIndex={clickable ? 0 : undefined}
                                onClick={clickable ? () => onSelect(on ? null : s.key) : undefined}
                                onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(on ? null : s.key); } } : undefined}
                                style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#555', cursor: clickable ? 'pointer' : 'default', fontWeight: on ? 600 : 400 }}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                                <span>{s.label}</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#111' }}>{s.count}</span>
                                <span style={{ color: '#aaa', minWidth: '34px', textAlign: 'right' }}>{Math.round((s.count / total) * 100)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}