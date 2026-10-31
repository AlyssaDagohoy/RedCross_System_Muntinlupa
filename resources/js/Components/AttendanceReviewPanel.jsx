import { router } from '@inertiajs/react';
import { useState } from 'react';

/*
  Attendance records that need an admin decision (moved here from the
  Attendance page). Approve / Adjust / Reject post to
  admin.attendance.review and the page reloads in place.
*/
export default function ReviewPanel({ records }) {
    const [active, setActive] = useState(null);
    const [remark, setRemark] = useState('');
    const [adjTime, setAdjTime] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [folded, setFolded] = useState(false);
    const [menuFor, setMenuFor] = useState(null);

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
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '20px', overflow: 'visible' }}>
            <div onClick={() => { setFolded(!folded); setMenuFor(null); }} style={{ padding: '14px 18px', background: '#fffbeb', borderBottom: folded ? 'none' : '1px solid #fde68a', borderRadius: folded ? '10px' : '10px 10px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>Needs Review ({records.length})</span>
                <span style={{ fontSize: '11px', color: '#b45309', marginLeft: '8px' }}>Missing Time Outs and review requests waiting for your decision.</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', whiteSpace: 'nowrap' }}>{folded ? 'Show' : 'Hide'} {folded ? '\u25BE' : '\u25B4'}</span>
            </div>

            {!folded && records.map(r => (
                <div key={r.id} style={{ padding: '14px 18px', borderTop: '1px solid #f5f5f5', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#111' }}>{r.user?.name ?? '-'}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                            {r.activity?.name ?? '-'} &middot; {fmtDate(r.date)} &middot; Time In {fmtTime(r.time_in)} &middot; Time Out {fmtTime(r.time_out)}
                        </div>
                        <div style={{ fontSize: '11px', color: r.review_reason ? '#444' : '#b45309', marginTop: '4px' }}>
                            {r.review_reason ? 'Volunteer\'s reason: ' + r.review_reason : 'Missing Time Out (closed automatically)'}
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button type="button" onClick={() => setMenuFor(menuFor === r.id ? null : r.id)} style={{ ...btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Action <span aria-hidden="true">{'\u25BE'}</span>
                        </button>
                        {menuFor === r.id && (
                            <>
                                <div onClick={() => setMenuFor(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: '130px', background: 'white', border: '1px solid #ebebeb', borderRadius: '8px', padding: '4px', zIndex: 50 }}>
                                    {[['approve', 'Approve', '#16a34a'], ['adjust', 'Adjust', '#444']].map(([act, label, color]) => (
                                        <button key={act} type="button" onClick={() => { setMenuFor(null); open(r, act); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: color, cursor: 'pointer' }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}

            {active && (
                <div role="presentation" onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: '16px', zIndex: 3000 }}>
                    <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '380px', padding: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{titles[active.action]}</div>
                        <div style={{ fontSize: '11.5px', color: '#888', margin: '4px 0 14px' }}>
                            {active.record.user?.name} &middot; {active.record.activity?.name}
                        </div>

                        {active.action === 'approve' && (
                            <div style={{ fontSize: '12px', color: '#555', marginBottom: '12px', lineHeight: '1.6' }}>
                                Time Out is set to the scheduled end of the activity, so hours are counted only until then.
                            </div>
                        )}

                        {active.action === 'adjust' && (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px' }}>NEW TIME OUT</label>
                                <input type="time" value={adjTime} onChange={e => setAdjTime(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px' }} />
                            </div>
                        )}

                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px' }}>
                            ADMIN REMARK {active.action === 'approve' ? '(optional)' : '(required)'}
                        </label>
                        <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical' }} />

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
