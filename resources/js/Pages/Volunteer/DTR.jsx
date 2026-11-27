import { useForm, usePage } from '@inertiajs/react';
import { useMemo, useRef } from 'react';
import VolunteerShell from '../../Components/VolunteerShell';

const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const niceDate = (s) => {
    if (!s) return '';
    const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PILL = {
    pending:  { bg: '#fff4e0', fg: '#b45309', label: 'Pending' },
    approved: { bg: '#e8f7ee', fg: '#16a34a', label: 'Approved' },
    rejected: { bg: '#fdecec', fg: '#CC0000', label: 'Rejected' },
};

const PROOF_HINT = {
    no_signal: 'No signal / remote area: a selfie at the location.',
    sick:      'Sick / medical: a medical certificate or doctor\'s note.',
    emergency: 'Emergency or other: any document or photo that supports it.',
    other:     'Emergency or other: any document or photo that supports it.',
};

const label = { display: 'block', fontSize: '11px', fontWeight: '600', color: '#777', marginBottom: '6px' };
const field = {
    width: '100%', boxSizing: 'border-box', height: '34px', padding: '0 12px',
    border: '1px solid #e3e3e3', borderRadius: '8px', fontSize: '13px',
    fontFamily: 'inherit', color: '#111', background: 'white', outline: 'none',
};

export default function DTR({ activities = [], submissions = [], reasons = {}, deadlineDays = 3 }) {
    const { flash } = usePage().props;
    const fileRef = useRef(null);
    const today = ymd(new Date());

    const form = useForm({
        filing_type: 'before', activity_id: '', reason_type: 'other',
        time_in: '', time_out: '', location: '', details: '', witness: '', proof: null,
    });
    const d = form.data;

    const options = useMemo(
        () => activities.filter((a) => (d.filing_type === 'before' ? a.date >= today : a.date <= today)),
        [activities, d.filing_type, today]
    );
    const chosen = activities.find((a) => String(a.id) === String(d.activity_id));

    const setType = (t) => {
        form.setData((prev) => ({ ...prev, filing_type: t, activity_id: '' }));
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('volunteer.dtr.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { form.reset(); if (fileRef.current) fileRef.current.value = ''; },
        });
    };

    const cf = { ...field, height: '34px' };
    const err = (k) => form.errors[k] && <div style={{ color: '#CC0000', fontSize: '11px', marginTop: '5px' }}>{form.errors[k]}</div>;

    const typeBtn = (t, text) => (
        <button type="button" onClick={() => setType(t)} style={{
            height: '34px', padding: '0 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
            fontFamily: 'inherit', cursor: 'pointer',
            background: d.filing_type === t ? '#e9e9ec' : '#f7f7f8',
            color: d.filing_type === t ? '#4a4a4a' : '#777',
            border: d.filing_type === t ? '1px solid #9a9a9f' : '1px solid #ebebeb',
        }}>{text}</button>
    );

    return (
        <VolunteerShell active="dtr" title="DTR">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px', alignItems: 'start', padding: '4px 0' }}>
                <form data-dtr-compact="1" onSubmit={submit} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>File a Daily Time Record</div>
                    <div style={{ fontSize: '12px', color: '#777', margin: '3px 0 10px' }}>
                        For any reason you cannot attend or scan: no signal, sickness, emergency and more. Once approved, you will be marked Excused instead of Absent.
                    </div>

                    {flash?.success && <div style={{ background: '#e8f7ee', color: '#16a34a', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' }}>{flash.success}</div>}
                    {flash?.error && <div style={{ background: '#fdecec', color: '#CC0000', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' }}>{flash.error}</div>}

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        {typeBtn('before', 'File before I leave')}
                        {typeBtn('after', 'File after I return')}
                    </div>
                    {err('filing_type')}

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={label}>Activity</label>
                            <select style={cf} value={d.activity_id} onChange={(e) => form.setData('activity_id', e.target.value)}>
                                <option value="">{options.length ? 'Select an activity' : 'No activities available for this option'}</option>
                                {options.map((a) => <option key={a.id} value={a.id}>{a.name} - {niceDate(a.date)}</option>)}
                            </select>
                            {err('activity_id')}
                        </div>
                        <div>
                            <label style={label}>Date</label>
                            <input style={{ ...cf, background: '#f9f9f9' }} value={chosen ? niceDate(chosen.date) : ''} placeholder="Pick an activity" readOnly />
                        </div>
                        <div>
                            <label style={label}>Time in</label>
                            <input type="time" style={cf} value={d.time_in} onChange={(e) => form.setData('time_in', e.target.value)} />
                            {err('time_in')}
                        </div>
                        <div>
                            <label style={label}>Time out</label>
                            <input type="time" style={cf} value={d.time_out} onChange={(e) => form.setData('time_out', e.target.value)} />
                            {err('time_out')}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={label}>{d.filing_type === 'before' ? 'Where I will be' : 'Where I was'}</label>
                            <textarea rows={2} style={{ ...field, height: '64px', padding: '8px 12px', resize: 'none' }}
                                value={d.location} onChange={(e) => form.setData('location', e.target.value)} />
                            {err('location')}
                        </div>
                        <div>
                            <label style={label}>Reason</label>
                            <textarea rows={2} style={{ ...field, height: '64px', padding: '8px 12px', resize: 'none' }}
                                value={d.details} onChange={(e) => form.setData('details', e.target.value)} />
                            {err('details')}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={label}>Proof <span style={{ color: '#CC0000' }}>(required)</span></label>
                            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => form.setData('proof', e.target.files[0] || null)}
                                style={{ ...cf, paddingTop: '6px', fontSize: '12px', background: d.proof ? '#f2faf5' : 'white' }} />
                            {err('proof')}
                        </div>
                        <div>
                            <label style={label}>Witness / team leader (optional)</label>
                            <input style={cf} value={d.witness} onChange={(e) => form.setData('witness', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '10px', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>Proof is required: a selfie, medical certificate or any supporting document. Must be filed within {deadlineDays} days after the activity.</span>
                        <button type="submit" disabled={form.processing || !d.proof} style={{
                            height: '34px', padding: '0 18px', border: 'none', borderRadius: '8px', background: '#CC0000', color: 'white',
                            fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', whiteSpace: 'nowrap',
                            cursor: form.processing || !d.proof ? 'not-allowed' : 'pointer', opacity: form.processing || !d.proof ? 0.55 : 1,
                        }}>{form.processing ? 'Submitting...' : 'Submit DTR'}</button>
                    </div>
                </form>

                <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#111', borderBottom: '1px solid #f0f0f0' }}>My DTR submissions</div>
                    {submissions.length === 0 && <div style={{ padding: '18px', fontSize: '12px', color: '#999' }}>No DTR filed yet.</div>}
                    {submissions.map((s) => {
                        const p = PILL[s.status] || PILL.pending;
                        return (
                            <div key={s.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{s.activity?.name || 'Activity'}</span>
                                    <span style={{ background: p.bg, color: p.fg, fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px' }}>{p.label}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
                                    {niceDate(s.date)} - {s.status === 'approved' ? (s.decision === 'present' ? 'Marked Present' : 'Marked Excused') : s.status === 'rejected' ? 'Remark: ' + (s.admin_remark || 'none') : 'Filed ' + s.filing_type}
                                </div>
                                {s.status === 'pending' && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Protected from Absent while pending</div>}
                                <a href={route('volunteer.dtr.proof', s.id)} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#CC0000', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}>View proof</a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </VolunteerShell>
    );
}