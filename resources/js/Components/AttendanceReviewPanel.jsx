import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

/*
  Needs Review tab (Attendance page). Approve / Adjust / Reject post to
  admin.attendance.review and the page reloads in place.
*/
export default function ReviewPanel({ records }) {
    const [active, setActive] = useState(null);
    const [remark, setRemark] = useState('');
    const [adjTime, setAdjTime] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [menu, setMenu] = useState(null);

    useEffect(() => {
        if (!menu) return;
        const closeMenu = () => setMenu(null);
        window.addEventListener('scroll', closeMenu, true);
        window.addEventListener('resize', closeMenu);
        return () => {
            window.removeEventListener('scroll', closeMenu, true);
            window.removeEventListener('resize', closeMenu);
        };
    }, [menu]);

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

    const openMenu = (e, id) => {
        if (menu && menu.id === id) { setMenu(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenu({ id, top: rect.bottom + 6, right: window.innerWidth - rect.right });
    };

    const titles = { approve: 'Approve attendance', adjust: 'Adjust Time Out', reject: 'Reject attendance' };
    const btn = { padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: '1px solid #ebebeb', background: 'white', color: '#444' };

    const th = { padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#aaa', whiteSpace: 'nowrap' };
    const td = { padding: '12px 16px', fontSize: '12px', color: '#555', borderTop: '1px solid #f5f5f5', verticalAlign: 'middle' };
    const clip = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
    const tag = { display: 'inline-block', background: '#fff4e0', color: '#b45309', borderRadius: '6px', padding: '3px 8px', fontSize: '10.5px', fontWeight: '700', whiteSpace: 'nowrap' };

    const reasonCell = (r) => {
        const isFallback = r.attendance_method === 'face_fallback';
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isFallback && r.fallback_photo_path && (
                    <a href={route('admin.attendance.fallback-photo', r.id)} target="_blank" rel="noreferrer" style={{ flex: 'none' }}>
                        <img src={route('admin.attendance.fallback-photo', r.id)} alt="Fallback selfie" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ebebeb', display: 'block' }} />
                    </a>
                )}
                <div style={{ minWidth: 0 }}>
                    <span style={tag}>
                        {isFallback ? 'Face + email code' : r.review_reason ? 'Review requested' : (r.time_out ? 'Waiting for decision' : 'Missing time out')}
                    </span>
                    {isFallback && (
                        <div style={{ fontSize: '10.5px', color: '#999', marginTop: '3px' }}>
                            {r.fallback_distance != null ? 'Distance ' + Number(r.fallback_distance).toFixed(2) : ''}
                            {!r.fallback_photo_path ? (r.fallback_distance != null ? ' \u00B7 ' : '') + 'No selfie' : ''}
                        </div>
                    )}
                    {r.review_reason && (
                        <div title={r.review_reason} style={{ fontSize: '10.5px', color: '#777', marginTop: '3px', maxWidth: '220px', ...clip }}>{r.review_reason}</div>
                    )}
                </div>
            </div>
        );
    };

    const menuRecord = menu ? records.find(x => x.id === menu.id) : null;

    return (
        <div>
            <p style={{ fontSize: '12px', color: '#777', margin: '0 0 10px' }}>
                Records waiting for your decision. Check the selfie before approving a fallback scan.
            </p>

            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '820px' }}>
                        <colgroup>
                            <col style={{ width: '12%' }} /><col style={{ width: '18%' }} /><col style={{ width: '14%' }} />
                            <col style={{ width: '10%' }} /><col style={{ width: '10%' }} /><col style={{ width: '24%' }} /><col style={{ width: '12%' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={th}>Date</th><th style={th}>Name</th><th style={th}>Activity</th>
                                <th style={th}>Time in</th><th style={th}>Time out</th><th style={th}>Reason</th><th style={th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id} style={{ transition: 'background 0.1s' }}>
                                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                                    <td style={{ ...td, fontSize: '12.5px', fontWeight: '600', color: '#111', ...clip }} title={r.user?.name ?? ''}>{r.user?.name ?? '-'}</td>
                                    <td style={{ ...td, ...clip }} title={r.activity?.name ?? ''}>{r.activity?.name ?? '-'}</td>
                                    <td style={{ ...td, color: '#16a34a', fontWeight: '600', whiteSpace: 'nowrap' }}>{fmtTime(r.time_in)}</td>
                                    <td style={{ ...td, color: r.time_out ? '#CC0000' : '#999', fontWeight: '600', whiteSpace: 'nowrap' }}>{fmtTime(r.time_out)}</td>
                                    <td style={td}>{reasonCell(r)}</td>
                                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button type="button" onClick={(e) => openMenu(e, r.id)} style={{ ...btn, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            Action <span aria-hidden="true">{'\u25BE'}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {menu && menuRecord && (
                <>
                    <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{ position: 'fixed', top: menu.top + 'px', right: menu.right + 'px', minWidth: '130px', background: 'white', border: '1px solid #ebebeb', borderRadius: '8px', padding: '4px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                        {[['approve', 'Approve', '#16a34a'], ['adjust', 'Adjust', '#444'], ['reject', 'Reject', '#CC0000']].map(([act, label, color]) => (
                            <button key={act} type="button" onClick={() => { setMenu(null); open(menuRecord, act); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: color, cursor: 'pointer' }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </>
            )}

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