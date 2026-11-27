// dtr-review-v2
import { router } from '@inertiajs/react';
import { useState } from 'react';

const niceDate = (s) => {
    if (!s) return '';
    const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const to12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM');
};

const tab = (on) => ({
    height: on ? '38px' : '32px', padding: '0 18px', marginBottom: on ? '-1px' : '0',
    border: '1px solid #e6e6e6', borderBottom: on ? '1px solid white' : '1px solid #e6e6e6',
    borderRadius: '8px 8px 0 0', background: on ? 'white' : '#f1f1f2', color: on ? '#444' : '#999',
    fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer',
});
const pill = (on) => ({
    height: '30px', padding: '0 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer',
    background: on ? '#e9e9ec' : 'white', color: '#444', border: '1px solid #e0e0e0',
});
const lbl = { display: 'block', fontSize: '11px', fontWeight: '600', color: '#777', marginBottom: '4px' };
const val = { fontSize: '12px', color: '#555', lineHeight: 1.5 };
const tag = { fontSize: '11px', fontWeight: '600', color: '#666', background: '#f1f1f2', borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap' };
const btnGhost = { height: '32px', padding: '0 16px', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#555', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' };
const btnRedLine = { height: '32px', padding: '0 16px', border: '1px solid #CC0000', borderRadius: '8px', background: 'white', color: '#CC0000', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' };

export default function DtrReviewPanel({ dtrs = [], attendanceCount = 0, children }) {
    const [filter, setFilter] = useState('all');
    const [sel, setSel] = useState(null);        // { dtr, mode: null | 'approve' | 'reject' }
    const [decision, setDecision] = useState('excused');
    const [remark, setRemark] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const cur = dtrs.find((x) => x.id === sel?.dtr.id) || dtrs[0] || null;
    const mode = sel && cur && sel.dtr.id === cur.id ? sel.mode : null;

    const pick = (dtr) => { setSel({ dtr, mode: null }); setDecision('excused'); setRemark(''); setError(''); };
    const open = (dtr, m) => { setSel({ dtr, mode: m }); setDecision('excused'); setRemark(''); setError(''); };

    const confirm = () => {
        if (!cur || !mode) return;
        if (mode === 'reject' && !remark.trim()) { setError('Please add a remark when rejecting a DTR.'); return; }
        setBusy(true);
        router.post(route('admin.dtr.review', cur.id),
            { decision: mode === 'reject' ? 'reject' : decision, remark },
            {
                preserveScroll: true,
                onSuccess: () => { setSel(null); setRemark(''); },
                onError: (e) => setError(e.review || Object.values(e)[0] || 'Something went wrong.'),
                onFinish: () => setBusy(false),
            });
    };

    const showDtr = filter !== 'attendance';
    const showAtt = filter !== 'dtr';

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '12px 18px 0', borderBottom: '1px solid #e6e6e6' }}>
                <button style={tab(filter === 'all')} onClick={() => setFilter('all')}>All requests</button>
                <button style={tab(filter === 'dtr')} onClick={() => setFilter('dtr')}>DTR submissions {dtrs.length}</button>
                <button style={tab(filter === 'attendance')} onClick={() => setFilter('attendance')}>Attendance reviews {attendanceCount}</button>
            </div>

            {showDtr && dtrs.length === 0 && filter === 'dtr' && (
                <div style={{ padding: '28px 18px', fontSize: '12px', color: '#999' }}>No DTR submissions to review.</div>
            )}

            {showDtr && cur && (
                <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)', alignItems: 'start' }}>
                    <div style={{ borderRight: '1px solid #f0f0f0', maxHeight: '480px', overflowY: 'auto' }}>
                        {dtrs.map((r) => (
                            <div key={r.id} onClick={() => pick(r)} style={{
                                padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                                background: cur.id === r.id ? '#e9e9ec' : 'white',
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#111' }}>{r.user?.name}</div>
                                <div style={{ fontSize: '11px', color: '#888', margin: '2px 0 6px' }}>{r.activity?.name} · {niceDate(r.date)}</div>
                                <span style={tag}>DTR - {r.filing_type}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{cur.user?.name}</div>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{cur.activity?.name} · {niceDate(cur.date)} · DTR - {cur.filing_type}</div>
                            </div>
                            {!mode && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => open(cur, 'reject')} style={btnGhost}>Reject</button>
                                    <button onClick={() => open(cur, 'approve')} style={btnRedLine}>Approve</button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                                <span style={lbl}>Time</span>
                                <div style={val}>{cur.time_in && cur.time_out ? to12(cur.time_in) + ' – ' + to12(cur.time_out) : '-'}</div>
                            </div>
                            <div>
                                <span style={lbl}>{cur.filing_type === 'before' ? 'Where I will be' : 'Where I was'}</span>
                                <div style={val}>{cur.location || '-'}</div>
                            </div>
                            <div>
                                <span style={lbl}>Proof</span>
                                <a href={route('admin.dtr.proof', cur.id)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#CC0000', textDecoration: 'none', fontWeight: '500' }}>
                                    {cur.proof_name || 'View proof'}
                                </a>
                            </div>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <span style={lbl}>Reason</span>
                            <div style={val}>{cur.reason_label}{cur.details ? ' - ' + cur.details : ''}</div>
                        </div>

                        {cur.witness && (
                            <div style={{ marginBottom: '14px' }}>
                                <span style={lbl}>Witness / team leader</span>
                                <div style={val}>{cur.witness}</div>
                            </div>
                        )}

                        {mode && (
                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111', marginBottom: '10px' }}>
                                    {mode === 'reject' ? 'Reject this DTR' : 'Approve this DTR'}
                                </div>

                                {mode === 'approve' && (
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <button onClick={() => setDecision('excused')} style={pill(decision === 'excused')}>Mark Excused</button>
                                        <button onClick={() => setDecision('present')} style={pill(decision === 'present')}>Present with hours</button>
                                    </div>
                                )}

                                <span style={lbl}>{mode === 'reject' ? 'Remark (required)' : 'Remark (optional)'}</span>
                                <textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box', height: '64px', padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '12px', color: '#666', fontFamily: 'inherit', resize: 'none', outline: 'none', display: 'block' }} />

                                {error && <div style={{ color: '#CC0000', fontSize: '12px', marginTop: '8px' }}>{error}</div>}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                    <button onClick={() => setSel({ dtr: cur, mode: null })} style={btnGhost}>Cancel</button>
                                    <button onClick={confirm} disabled={busy} style={{ height: '32px', padding: '0 18px', border: 'none', borderRadius: '8px', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                                        {mode === 'reject' ? 'Confirm rejection' : 'Confirm approval'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAtt && children}
        </div>
    );
}
