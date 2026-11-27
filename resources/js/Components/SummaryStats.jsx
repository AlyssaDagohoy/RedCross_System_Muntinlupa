import { recordStatusKey } from './StatusDonut';

const toMs = (a, v) => {
    if (!v) return NaN;
    const s = String(v);
    if (/\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.replace(' ', 'T')).getTime();
    return new Date(String(a.date || '').slice(0, 10) + 'T' + s.slice(0, 8)).getTime();
};

function hoursOf(a) {
    const raw = a.hours ?? a.total_hours ?? a.duration_hours;
    if (raw !== null && raw !== undefined && raw !== '' && isFinite(Number(raw))) return Number(raw);
    const start = toMs(a, a.time_in);
    const end = toMs(a, a.time_out);
    if (isNaN(start) || isNaN(end)) return 0;
    let diff = end - start;
    if (diff < 0) diff += 24 * 3600000;
    const h = diff / 3600000;
    return h > 24 ? 0 : h;
}

function Ring({ pct, text, color = '#1D9E75' }) {
    const R = 18;
    const C = 2 * Math.PI * R;
    const len = pct > 0 ? (Math.min(pct, 100) / 100) * C : 0;
    return (
        <svg viewBox="0 0 44 44" width="46" height="46" style={{ flexShrink: 0 }} aria-hidden="true">
            <g transform="rotate(-90 22 22)" fill="none" strokeWidth="5">
                <circle cx="22" cy="22" r={R} stroke="#f0f0f0" />
                {len > 0 && <circle cx="22" cy="22" r={R} stroke={color} strokeLinecap="round" strokeDasharray={len + ' ' + (C - len)} />}
            </g>
            <text x="22" y="26" textAnchor="middle" style={{ fill: '#111', fontSize: '11px', fontWeight: 700 }}>{text}</text>
        </svg>
    );
}

function Row({ dot, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#666', lineHeight: 1.5 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <span>{children}</span>
        </div>
    );
}

export default function SummaryStats({ records }) {
    const list = Array.isArray(records) ? records : [];
    let present = 0;
    let hours = 0;
    let total = 0;
    let first = null;

    list.forEach((a) => {
        const k = recordStatusKey(a);
        if (k !== 'cancelled') {
            total += 1;
            const t = new Date(String(a.date || '').slice(0, 10) + 'T00:00:00').getTime();
            if (!isNaN(t) && (first === null || t < first)) first = t;
        }
        if (k === 'present') {
            present += 1;
            hours += hoursOf(a);
        }
    });

    const hrs = Math.round(hours * 10) / 10;
    const firstLabel = first === null ? '\u2014' : new Date(first).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const box = { background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', padding: '10px 14px', minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' };
    const title = { fontSize: '12.5px', fontWeight: 600, color: '#111', marginBottom: '2px' };

    return (
        <div className="ss-grid" style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridAutoRows: '1fr', gap: '8px', minWidth: 0 }}>
            <div style={box}>
                <Ring pct={0} text={hrs + 'h'} />
                <div style={{ minWidth: 0 }}>
                    <div style={title}>Total hours</div>
                    <Row dot="#1D9E75">{hrs} hrs served</Row>
                    <Row dot="#c4c4c4">{present} attended</Row>
                </div>
            </div>
            <div style={box}>
                <Ring pct={total > 0 ? 100 : 0} text={String(total)} color="#B92F2F" />
                <div style={{ minWidth: 0 }}>
                    <div style={title}>Total activities</div>
                    <Row dot="#B92F2F">{total} since joining</Row>
                    <Row dot="#c4c4c4">First: {firstLabel}</Row>
                </div>
            </div>
        </div>
    );
}