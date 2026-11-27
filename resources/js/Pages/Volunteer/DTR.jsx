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
                <form data-dtr-compact="1" data-dtr-v2="1" className="dtr2" onSubmit={submit} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', padding: '24px 26px' }}>
                    <style>{`
                        .dtr2 *, .dtr2 { box-sizing: border-box; font-family: inherit; }
                        .dtr2 .lb { display: block; font-size: 11px; font-weight: 600; color: #777; margin-bottom: 6px; }
                        .dtr2 .f { width: 100%; height: 38px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-size: 12px; color: #666; background-color: #fff; padding: 0 12px; outline: none; }
                        .dtr2 .f::placeholder { color: #999; opacity: 1; }
                        .dtr2 .f.ro { background-color: #f9f9f9; }
                        .dtr2 input[type=time]::-webkit-calendar-picker-indicator { opacity: .45; }
                        .dtr2 textarea.f { height: 72px; padding: 10px 12px; resize: none; display: block; }
                        .dtr2 select.f { appearance: none; -webkit-appearance: none; padding-right: 32px; background-repeat: no-repeat; background-position: right 12px center; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>"); }
                        .dtr2 .g { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
                    `}</style>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>File a Daily Time Record</div>
                    <div style={{ fontSize: '12px', color: '#777', margin: '4px 0 16px', lineHeight: 1.5 }}>
                        For any reason you cannot attend or scan: no signal, sickness, emergency and more. Once approved, you will be marked Excused instead of Absent.
                    </div>

                    {flash?.success && <div style={{ background: '#e8f7ee', color: '#16a34a', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{flash.success}</div>}
                    {flash?.error && <div style={{ background: '#fdecec', color: '#CC0000', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{flash.error}</div>}

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                        {typeBtn('before', 'File before I leave')}
                        {typeBtn('after', 'File after I return')}
                    </div>
                    {err('filing_type')}

                    <div className="g">
                        <div>
                            <label className="lb">Activity</label>
                            <select className="f" value={d.activity_id} onChange={(e) => form.setData('activity_id', e.target.value)}>
                                <option value="">{options.length ? 'Select an activity' : 'No activities available for this option'}</option>
                                {options.map((a) => <option key={a.id} value={a.id}>{a.name} - {niceDate(a.date)}</option>)}
                            </select>
                            {err('activity_id')}
                        </div>
                        <div>
                            <label className="lb">Date</label>
                            <input className="f ro" value={chosen ? niceDate(chosen.date) : ''} placeholder="Pick an activity" readOnly />
                        </div>
                    </div>

                    <div className="g">
                        <div>
                            <label className="lb">Time in</label>
                            <input className="f" type="time" value={d.time_in} onChange={(e) => form.setData('time_in', e.target.value)} />
                            {err('time_in')}
                        </div>
                        <div>
                            <label className="lb">Time out</label>
                            <input className="f" type="time" value={d.time_out} onChange={(e) => form.setData('time_out', e.target.value)} />
                            {err('time_out')}
                        </div>
                    </div>

                    <div className="g">
                        <div>
                            <label className="lb">{d.filing_type === 'before' ? 'Where I will be' : 'Where I was'}</label>
                            <textarea className="f" rows={2} value={d.location} onChange={(e) => form.setData('location', e.target.value)} />
                            {err('location')}
                        </div>
                        <div>
                            <label className="lb">Reason</label>
                            <textarea className="f" rows={2} value={d.details} onChange={(e) => form.setData('details', e.target.value)} />
                            {err('details')}
                        </div>
                    </div>

                    <div className="g">
                        <div>
                            <label className="lb">Proof <span style={{ color: '#CC0000' }}>(required)</span></label>
                            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => form.setData('proof', e.target.files[0] || null)}
                                style={{ display: 'none' }} />
                            <div className="f" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 6px' }}>
                                <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={{ background: 'white', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '0 12px', height: '26px', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>Choose file</button>
                                <span style={{ fontSize: '12px', color: d.proof ? '#444' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.proof ? d.proof.name : 'No file chosen'}</span>
                            </div>
                            {err('proof')}
                        </div>
                        <div>
                            <label className="lb">Witness / team leader (optional)</label>
                            <input className="f" value={d.witness} onChange={(e) => form.setData('witness', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '4px', gap: '16px' }}>
                        <span style={{ fontSize: '11px', color: '#888', lineHeight: 1.5 }}>Proof is required: a selfie, medical certificate or any supporting document. Must be filed within {deadlineDays} days after the activity.</span>
                        <button type="submit" disabled={form.processing || !d.proof} style={{
                            height: '38px', padding: '0 22px', border: 'none', borderRadius: '8px', background: '#CC0000', color: 'white',
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