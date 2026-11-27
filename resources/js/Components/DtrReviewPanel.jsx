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

const th = { padding: '10px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#999' };
const td = { padding: '11px 18px', fontSize: '13px', color: '#333', verticalAlign: 'middle' };

const chip = (on) => ({
    height: '32px', padding: '0 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer',
    background: on ? '#CC0000' : '#f7f7f8', color: on ? 'white' : '#555',
    border: on ? '1px solid #CC0000' : '1px solid #ebebeb',
});

export default function DtrReviewPanel({ dtrs = [], attendanceCount = 0, children }) {
    const [filter, setFilter] = useState('all');
    const [sel, setSel] = useState(null);        // { dtr, mode: 'approve' | 'reject' }
    const [decision, setDecision] = useState('excused');
    const [remark, setRemark] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const open = (dtr, mode) => {
        setSel({ dtr, mode });
        setDecision('excused');
        setRemark('');
        setError('');
    };

    const confirm = () => {
        if (!sel) return;
        if (sel.mode === 'reject' && !remark.trim()) { setError('Please add a remark when rejecting a DTR.'); return; }
        setBusy(true);
        router.post(route('admin.dtr.review', sel.dtr.id),
            { decision: sel.mode === 'reject' ? 'reject' : decision, remark },
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
            <div style={{ display: 'flex', gap: '8px', padding: '14px 18px', flexWrap: 'wrap' }}>
                <button style={chip(filter === 'all')} onClick={() => setFilter('all')}>All requests</button>
                <button style={chip(filter === 'dtr')} onClick={() => setFilter('dtr')}>DTR submissions {dtrs.length}</button>
                <button style={chip(filter === 'attendance')} onClick={() => setFilter('attendance')}>Attendance reviews {attendanceCount}</button>
            </div>

            {showDtr && dtrs.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={th}>Volunteer</th><th style={th}>Type</th><th style={th}>Activity</th>
                                <th style={th}>Date</th><th style={th}>Reason</th><th style={th}>Proof</th><th style={th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {dtrs.map((r) => (
                                <tr key={r.id} style={{ borderTop: '1px solid #f0f0f0', background: sel?.dtr.id === r.id ? '#fffaf5' : 'transparent' }}>
                                    <td style={{ ...td, fontWeight: '600', color: '#111' }}>{r.user?.name}</td>
                                    <td style={td}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap',
                                            background: r.filing_type === 'before' ? '#e8f0fe' : '#fff4e0',
                                            color: r.filing_type === 'before' ? '#2563eb' : '#b45309',
                                        }}>DTR - {r.filing_type}</span>
                                    </td>
                                    <td style={td}>{r.activity?.name}</td>
                                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{niceDate(r.date)}</td>
                                    <td style={td}>{r.reason_label}</td>
                                    <td style={td}>
                                        <a href={route('admin.dtr.proof', r.id)} target="_blank" rel="noreferrer" style={{ color: '#CC0000', textDecoration: 'none', fontWeight: '500' }}>
                                            {r.proof_name || 'View proof'}
                                        </a>
                                    </td>
                                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                        <button onClick={() => open(r, 'approve')} style={{ height: '30px', padding: '0 12px', border: 'none', borderRadius: '8px', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', marginRight: '6px' }}>Approve</button>
                                        <button onClick={() => open(r, 'reject')} style={{ height: '30px', padding: '0 12px', border: '1px solid #e3e3e3', borderRadius: '8px', background: 'white', color: '#555', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showDtr && sel && (
                <div style={{ margin: '16px 18px', padding: '16px 18px', border: '1px solid #ebebeb', borderRadius: '12px', background: 'white', maxWidth: '640px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>
                        {sel.mode === 'reject' ? 'Reject' : 'Approve'} DTR: {sel.dtr.user?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#777', margin: '4px 0 12px', lineHeight: 1.6 }}>
                        {niceDate(sel.dtr.date)}{sel.dtr.time_in && sel.dtr.time_out ? ', ' + to12(sel.dtr.time_in) + ' to ' + to12(sel.dtr.time_out) : ''}. Reason: {sel.dtr.reason_label}.
                        {sel.dtr.location ? ' Place: ' + sel.dtr.location + '.' : ''}
                        {sel.dtr.witness ? ' Witness: ' + sel.dtr.witness + '.' : ''}
                        <br />{sel.dtr.details}
                    </div>

                    {sel.mode === 'approve' && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <button onClick={() => setDecision('excused')} style={chip(decision === 'excused')}>Mark Excused</button>
                            <button onClick={() => setDecision('present')} style={chip(decision === 'present')}>Present with hours</button>
                        </div>
                    )}

                    <textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)}
                        placeholder={sel.mode === 'reject' ? 'Remark (required)' : 'Remark (optional)'}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e3e3e3', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />

                    {error && <div style={{ color: '#CC0000', fontSize: '12px', marginTop: '8px' }}>{error}</div>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                        <button onClick={() => setSel(null)} style={{ height: '36px', padding: '0 14px', border: '1px solid #e3e3e3', borderRadius: '8px', background: 'white', color: '#555', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={confirm} disabled={busy} style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: '8px', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                            {sel.mode === 'reject' ? 'Confirm rejection' : 'Confirm approval'}
                        </button>
                    </div>
                </div>
            )}

            {showAtt && children}
        </div>
    );
}