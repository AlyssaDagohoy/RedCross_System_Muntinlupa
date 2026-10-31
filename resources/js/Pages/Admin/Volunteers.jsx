import { router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminShell from '../../Components/AdminShell';

const STATUS = {
    pending:  { label: 'Pending',  color: '#b45309', bg: '#fef3c7' },
    approved: { label: 'Approved', color: '#15803d', bg: '#dcfce7' },
    rejected: { label: 'Rejected', color: '#b91c1c', bg: '#fee2e2' },
};

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

export default function Volunteers({ volunteers }) {
    const { flash } = usePage().props;

    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [statusOpen, setStatusOpen] = useState(false);
    const [fOpen, setFOpen] = useState(false);
    const [fDate, setFDate] = useState('');
    const [fFace, setFFace] = useState('');
    const [fDocs, setFDocs] = useState('');
    const fCount = [fDate, fFace, fDocs].filter(Boolean).length;
    const fClear = () => { setFDate(''); setFFace(''); setFDocs(''); };
    const fChip = (val, cur, set, label) => (
        <button key={val} type="button" onClick={() => set(cur === val ? '' : val)} style={{ border: '1px solid ' + (cur === val ? '#CC0000' : '#e0e0e0'), background: cur === val ? '#CC0000' : '#fff', color: cur === val ? '#fff' : '#333', borderRadius: '999px', padding: '6px 13px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{label}</button>
    );
    const [profilesView, setProfilesView] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [highlight, setHighlight] = useState(false);
    const playHighlight = () => {
        if (!document.getElementById('vol-flash-css')) {
            const s = document.createElement('style');
            s.id = 'vol-flash-css';
            s.textContent =
                '@keyframes vol-lift{0%,100%{transform:scale(1)}25%{transform:scale(1.01)}}' +
                '@keyframes vol-ring{0%{box-shadow:0 0 0 0 rgba(204,0,0,.35)}70%{box-shadow:0 0 0 7px rgba(204,0,0,0)}100%{box-shadow:0 0 0 0 rgba(204,0,0,0)}}' +
                '@keyframes vol-bd{0%,70%{border-color:#CC0000}}';
            document.head.appendChild(s);
        }
        clearTimeout(window.__volHl);
        setHighlight(false);
        window.setTimeout(() => setHighlight(true), 30);
        window.__volHl = window.setTimeout(() => setHighlight(false), 2300);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('filter') !== 'pending') return;
        setFilter('pending');
        setHighlight(true);
        if (!document.getElementById('vol-flash-css')) {
            const s = document.createElement('style');
            s.id = 'vol-flash-css';
            s.textContent =
                '@keyframes vol-lift{0%,100%{transform:scale(1)}25%{transform:scale(1.01)}}' +
                '@keyframes vol-ring{0%{box-shadow:0 0 0 0 rgba(204,0,0,.35)}70%{box-shadow:0 0 0 7px rgba(204,0,0,0)}100%{box-shadow:0 0 0 0 rgba(204,0,0,0)}}' +
                '@keyframes vol-bd{0%,70%{border-color:#CC0000}}';
            document.head.appendChild(s);
        }
        window.history.replaceState(window.history.state, '', window.location.pathname);
        const t = setTimeout(() => setHighlight(false), 3000);
        return () => clearTimeout(t);
    }, []);

    const [requestModal, setRequestModal] = useState(null);
    const [removeTarget, setRemoveTarget] = useState(null);
    const [preview, setPreview] = useState(null);
    const [rejecting, setRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectErr, setRejectErr] = useState(false);

    useEffect(() => {
        setRejecting(false);
        setRejectReason('');
        setRejectErr(false);
    }, [preview]);

    useEffect(() => {
        if (!preview) return;
        const onKey = (e) => { if (e.key === 'Escape') setPreview(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [preview]);
    const [requestForm, setRequestForm] = useState({ document_name: '', instructions: '', due_date: '' });

    const approve = (id) => router.patch(route('admin.volunteers.approve', id));
    const reject = (id) => router.patch(route('admin.volunteers.reject', id));
    const confirmRemove = () => {
        if (!removeTarget) return;
        router.delete(route('admin.volunteers.destroy', removeTarget.id), {
            preserveScroll: true,
            onFinish: () => setRemoveTarget(null),
        });
    };

    const openRequestModal = (id) => {
        setRequestForm({ document_name: '', instructions: '', due_date: '' });
        setRequestModal(id);
    };

    const submitRequest = (e) => {
        e.preventDefault();
        const reqCount = requestForm.document_name.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).length;
        if (reqCount > 10) { alert('Hanggang 10 files lang ang pwedeng hilingin. Bawasan ang mga pangalan (paghiwalayin ng comma).'); return; }
        router.post(route('admin.volunteers.request-document', requestModal), requestForm, {
            onSuccess: () => setRequestModal(null),
        });
    };

    const count = (s) => volunteers.filter(v => v.status === s).length;
    const pendingCount = count('pending');

    const q = search.trim().toLowerCase();
    const visible = volunteers
        .filter(v => profilesView ? v.status === 'approved' : (filter === 'all' || v.status === filter))
        .filter(v => !q || [v.name, v.email, v.badge_number].some(x => (x || '').toLowerCase().includes(q)))
        .filter(v => {
            if (fFace === 'yes' && !v.biometric_id) return false;
            if (fFace === 'no' && v.biometric_id) return false;
            const done = (v.documents_submitted ?? 0) >= (v.documents_required ?? 4);
            if (fDocs === 'complete' && !done) return false;
            if (fDocs === 'incomplete' && done) return false;
            if (fDate) {
                const d = new Date(v.created_at);
                const now = new Date();
                const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekStart = new Date(day0);
                weekStart.setDate(day0.getDate() - ((day0.getDay() + 6) % 7));
                if (fDate === 'today' && d < day0) return false;
                if (fDate === 'week' && d < weekStart) return false;
                if (fDate === 'month' && (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth())) return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const cards = [
        { key: 'all', label: 'Total volunteers', value: volunteers.length, color: '#111' },
        { key: 'pending', label: 'Pending', value: pendingCount, color: '#f59e0b' },
        { key: 'approved', label: 'Approved', value: count('approved'), color: '#16a34a' },
        { key: 'rejected', label: 'Rejected', value: count('rejected'), color: '#CC0000' },
    ];

    const REQUIRED_DOCS = [
        { key: 'nbi', label: 'NBI Clearance' },
        { key: 'medical', label: 'Medical Certificate' },
        { key: 'training', label: 'Training Certificate' },
        { key: 'barangay', label: 'Barangay Clearance' },
    ];

    const DOC_STATUS = {
        pending:        { label: 'Waiting for review', color: '#92400e', bg: '#fef3c7' },
        approved:       { label: 'Approved', color: '#15803d', bg: '#dcfce7' },
        rejected:       { label: 'Rejected', color: '#b91c1c', bg: '#fee2e2' },
        needs_revision: { label: 'Needs revision', color: '#9a3412', bg: '#ffedd5' },
    };

    const docReport = (v) => {
        const docs = v.submitted_docs || [];
        const keys = REQUIRED_DOCS.map((r) => r.key);
        const required = REQUIRED_DOCS.map((r) => {
            const mine = docs.filter((d) => !d.is_requested && d.type === r.key);
            return { ...r, doc: mine.find((d) => d.status === 'approved') || mine[0] || null };
        });
        const others = docs.filter((d) => d.is_requested || !keys.includes(d.type));
        const all = [...required.map((r) => r.doc), ...others];
        const approvedCount = all.filter((d) => d && d.status === 'approved').length;
        const total = REQUIRED_DOCS.length + others.length;
        return { required, others, approvedCount, total, allApproved: approvedCount === total };
    };

    const approvePending = (v) => {
        if (!docReport(v).allApproved && !window.confirm('Not all of this volunteer\'s documents are approved yet. Approve anyway?')) return;
        approve(v.id);
    };

    const btn = (bg, color, border) => ({
        background: bg, color, border: border || 'none',
        padding: '7px 16px', borderRadius: '6px', fontSize: '11.5px',
        fontWeight: '600', cursor: 'pointer',
    });

    const actionsFor = (v) => {
        if (v.status === 'pending') return (
            <>
                <button onClick={() => approve(v.id)} style={btn('#16a34a', 'white')}>Approve</button>
                <button onClick={() => reject(v.id)} style={btn('white', '#CC0000', '1px solid #CC0000')}>Reject</button>
            </>
        );
        if (v.status === 'approved') return (
            <>
                <button onClick={() => setRemoveTarget(v)} style={btn('#CC0000', 'white')}>Delete</button>
            </>
        );
        return (
            <>
                <button onClick={() => approve(v.id)} style={btn('#16a34a', 'white')}>Re-approve</button>
                <button onClick={() => setRemoveTarget(v)} style={btn('#CC0000', 'white')}>Delete</button>
                <button onClick={() => openRequestModal(v.id)} style={btn('white', '#333', '1px solid #ddd')}>Request Document</button>
            </>
        );
    };

    return (
        <AdminShell active="volunteers" title="Volunteers">
            <style>{`
                .vol-head:hover { background: #fafafa; }
                .stat-card:hover { border-color: #ccc !important; }
            `}</style>

            {/* Header */}

            {/* Flash message */}
            {flash?.success && (
                <div style={{
                    marginBottom: '18px', padding: '11px 16px',
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '8px', fontSize: '12.5px', color: '#16a34a', fontWeight: '500',
                }}>{flash.success}</div>
            )}

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, or ID"
                    style={{ ...inputStyle, flex: '1 1 200px', paddingLeft: '36px', backgroundImage: "url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23999%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Ccircle%20cx=%2711%27%20cy=%2711%27%20r=%277%27/%3E%3Cpath%20d=%27m21%2021-4.3-4.3%27/%3E%3C/svg%3E)", backgroundRepeat: 'no-repeat', backgroundPosition: '12px center', backgroundSize: '16px 16px' }}
                />
                <div style={{ position: 'relative', flex: '0 0 auto' }}>
                    <button type="button" aria-label="Filters" aria-expanded={fOpen} onClick={() => setFOpen((o) => !o)} style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '9px', background: '#CC0000', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" /></svg>
                        {fCount > 0 && <span style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#fff', color: '#CC0000', border: '1px solid #CC0000', borderRadius: '10px', fontSize: '10px', fontWeight: '600', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fCount}</span>}
                    </button>
                    {fOpen && (
                        <>
                            <div onClick={() => setFOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '290px', maxWidth: '88vw', background: '#fff', border: '1px solid #ebebeb', borderRadius: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: '16px', zIndex: 21, boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', margin: '0 0 6px' }}>DATE JOINED</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                                    {fChip('today', fDate, setFDate, 'Today')}
                                    {fChip('week', fDate, setFDate, 'This week')}
                                    {fChip('month', fDate, setFDate, 'This month')}
                                </div>
                                <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', margin: '0 0 6px' }}>FACE REGISTRATION</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                                    {fChip('yes', fFace, setFFace, 'Registered')}
                                    {fChip('no', fFace, setFFace, 'Not registered')}
                                </div>
                                <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', margin: '0 0 6px' }}>DOCUMENTS</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {fChip('complete', fDocs, setFDocs, 'Complete')}
                                    {fChip('incomplete', fDocs, setFDocs, 'Incomplete')}
                                </div>
                                <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#999', letterSpacing: '0.05em', margin: '0 0 6px' }}>SORT BY</div>
                                <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: '100%', height: '34px', marginBottom: '16px', fontSize: '12px', fontFamily: 'inherit', color: '#333', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '9px', padding: '0 10px' }}>
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="name">Name (A-Z)</option>
                                </select>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button type="button" onClick={fClear} style={{ background: 'none', border: 'none', padding: 0, color: '#CC0000', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>
                                    <button type="button" onClick={() => setFOpen(false)} style={{ background: '#CC0000', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <button type="button" onClick={() => setProfilesView((p) => !p)} style={{ height: '38px', display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: '9px', border: '1px solid ' + (profilesView ? '#CC0000' : '#e5e5e5'), background: profilesView ? '#CC0000' : '#fff', color: profilesView ? '#fff' : '#555', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>Volunteer profiles</button>
            </div>

            {/* Tabs */}
            {(() => {
                const opts = [
                    { key: 'all', label: 'All', count: volunteers.length },
                    { key: 'pending', label: 'Pending', count: pendingCount },
                    { key: 'approved', label: 'Approved', count: count('approved') },
                    { key: 'rejected', label: 'Rejected', count: count('rejected') },
                ];
                return (
                    <div role="tablist" style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '1px solid #e5e5e5' }}>
                        {opts.map((o) => {
                            const on = !profilesView && o.key === filter;
                            return (
                                <button key={o.key} type="button" role="tab" aria-selected={on} onClick={() => { setFilter(o.key); setProfilesView(false); }} style={{ border: 'none', borderBottom: '2px solid ' + (on ? '#CC0000' : 'transparent'), marginBottom: '-1px', background: 'transparent', color: on ? '#222' : '#777', fontWeight: on ? '600' : '500', borderRadius: '0', padding: '8px 14px', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {o.label}<span style={{ marginLeft: '6px', fontWeight: '400', color: on ? '#CC0000' : '#999' }}>{o.count}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            })()}
            {/* Total volunteers card (inside Approved tab) */}
            {filter === 'approved' && (
                <div style={{ background: '#CC0000', color: 'white', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '44px', fontWeight: '700', lineHeight: 1 }}>{volunteers.length}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>Total volunteers</div>
                </div>
            )}
            {/* Pending banner */}
            {pendingCount > 0 && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setFilter('pending'); playHighlight(); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('pending'); playHighlight(); } }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#fff5f5', border: '1px solid #fecaca', borderLeft: '4px solid #CC0000',
                        borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>
                        Pending approval
                        <span style={{ fontSize: '12px', fontWeight: '400', color: '#999', marginLeft: '8px' }}>
                            {pendingCount} {pendingCount === 1 ? 'volunteer' : 'volunteers'} waiting
                        </span>
                    </span>
                </div>
            )}
            {/* Search + sort */}


            {/* Volunteer cards */}
            {visible.length === 0 ? (
                <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', padding: '36px', textAlign: 'center', color: '#bbb', fontSize: '12.5px' }}>No volunteers found</div>
            ) : visible.map((v) => {
                const st = STATUS[v.status] || STATUS.pending;
                const open = expanded === v.id;
                const docsDone = (v.documents_submitted ?? 0) >= (v.documents_required ?? 4);
                return (
                    <div key={v.id} style={{
                        background: 'white', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px',
                        border: open ? '1px solid #f5c2c2' : '1px solid #ebebeb',
                        ...(highlight && v.status === 'pending' ? { position: 'relative', zIndex: 1, animation: 'vol-lift 1.2s ease, vol-ring 1s ease-out 2, vol-bd 2s ease' } : {}),
                    }}>
                        {/* Card header */}
                        <div className="vol-head" onClick={() => setExpanded(open ? null : v.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', cursor: 'pointer',
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#111' }}>{v.name}</div>
                                {v.status === 'rejected' && <div style={{ fontSize: '11.5px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.email}</div>}
                            </div>
                            {v.status === 'rejected' && (<span style={{
                                background: st.bg, color: st.color, fontSize: '10px', fontWeight: '700',
                                padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.4px',
                            }}>{st.label}</span>)}
                            <span style={{ color: '#aaa', fontSize: '12px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
                        </div>

                        {/* Details (inside the card) */}
                        {open && (
                            <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '18px 18px 14px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <Detail icon={ICONS.id} label="Volunteer ID" value={v.badge_number || 'Created on approval'} strong={!!v.badge_number} />
                                    <Detail icon={ICONS.mail} label="Email" value={v.email} />
                                    <Detail icon={ICONS.calendar} label="Registered" value={new Date(v.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
                                    {profilesView && (
                                        <>
                                            <Detail icon={ICONS.id} label="Face recognition" value={v.biometric_id ? 'Registered' : 'Not registered yet'} />
                                            <Detail icon={ICONS.clock} label="Biometric device" value="ZKTeco F22" />
                                        </>
                                    )}                                </div>

                                {/* Submitted documents (dropdown) */}
                                {(() => {
                                    if (v.status !== 'rejected') return null;
                                    const rep = docReport(v);
                                    const statusChip = (s) => {
                                        const i = DOC_STATUS[s] || DOC_STATUS.pending;
                                        return <span style={{ ...chip, background: i.bg, color: i.color }}>{i.label}</span>;
                                    };
                                    const line = (key, title, d) => {
                                        const base = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', textDecoration: 'none', color: 'inherit' };
                                        const inner = (
                                            <>
                                                <div style={{ flex: 1, minWidth: '160px' }}>
                                                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#222' }}>{title}</div>
                                                    {d && <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.original_name}</div>}
                                                    {d && d.admin_remarks && (d.status === 'rejected' || d.status === 'needs_revision') && (
                                                        <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px' }}>{d.admin_remarks}</div>
                                                    )}
                                                </div>
                                                {d ? statusChip(d.status) : <span style={{ ...chip, background: '#f1f1f1', color: '#777' }}>Not submitted</span>}
                                            </>
                                        );
                                        return d ? (
                                            <div key={key} role="button" tabIndex={0} title="Preview" onClick={() => setPreview(d)} onKeyDown={(e) => { if (e.key === 'Enter') setPreview(d); }} style={{ ...base, cursor: 'pointer' }}>{inner}</div>
                                        ) : (
                                            <div key={key} style={base}>{inner}</div>
                                        );
                                    };
                                    return (
                                        <details style={{ marginTop: '18px', background: 'white', border: '1px solid #ececec', borderRadius: '10px', overflow: 'hidden' }}>
                                            <summary style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#111' }}>Submitted documents</span>
                                                <span style={{ ...chip, background: rep.allApproved ? '#dcfce7' : '#f1f1f1', color: rep.allApproved ? '#15803d' : '#555' }}>{rep.approvedCount} of {rep.total} approved</span>
                                                <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                                            </summary>
                                            {rep.required.map((r) => line(r.key, r.label, r.doc))}
                                            {rep.others.map((d) => line('d' + d.id, d.label || d.type, d))}
                                            <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 14px' }}>
                                                <a href={route('admin.document-review.index')} style={{ fontSize: '12px', fontWeight: '600', color: '#CC0000', textDecoration: 'none' }}>Open Document Review</a>
                                            </div>
                                        </details>
                                    );
                                })()}

                                {/* Footer strip */}
                                <div style={{
                                    borderTop: '1px solid #ececec', marginTop: '18px', paddingTop: '12px',
                                    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                                }}>
                                    <span style={footLabel}>Status:</span>
                                    <span style={{ ...chip, background: st.bg, color: st.color }}>{st.label}</span>
                                    {v.status === 'rejected' && (<><span style={{ ...footLabel, marginLeft: '8px' }}>Documents:</span>
                                    <span style={{ ...chip, background: docsDone ? '#dcfce7' : '#f1f1f1', color: docsDone ? '#15803d' : '#555' }}>
                                        {docsDone ? 'Complete' : 'Incomplete'}
                                    </span></>)}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {actionsFor(v)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div style={{ padding: '6px 4px', fontSize: '11.5px', color: '#999' }}>
                Showing {visible.length} of {volunteers.length} volunteers
            </div>

            {/* Document preview */}
            {preview && (() => {
                const ext = (preview.original_name || '').split('.').pop().toLowerCase();
                const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
                const isPdf = ext === 'pdf';
                const viewUrl = route('admin.document-review.view', preview.id);
                const downloadUrl = route('admin.document-review.download', preview.id);
                const pdfUrl = viewUrl + '#view=FitH&navpanes=0&pagemode=none';
                const linkStyle = { fontSize: '12px', fontWeight: '600', color: '#CC0000', textDecoration: 'none' };
                const info = DOC_STATUS[preview.status] || DOC_STATUS.pending;
                const actBtn = (bg, color, border) => ({ padding: '8px 18px', borderRadius: '6px', border: border || 'none', background: bg, color, fontSize: '12px', fontWeight: '600', cursor: 'pointer' });
                const decide = (action, data) => {
                    router.patch(route('admin.document-review.' + action, preview.id), data || {}, {
                        preserveScroll: true,
                        onSuccess: () => setPreview(null),
                    });
                };
                const sendReject = () => {
                    if (!rejectReason.trim()) { setRejectErr(true); return; }
                    decide('reject', { remarks: rejectReason.trim() });
                };
                return (
                    <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
                        <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', width: '1100px', maxWidth: '100%', height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderBottom: '1px solid #eee', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.original_name}</div>
                                <a href={downloadUrl} style={linkStyle}>Download</a>
                                <a href={viewUrl} target="_blank" rel="noreferrer" style={linkStyle}>Open in new tab</a>
                                <button type="button" onClick={() => setPreview(null)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                            </div>
                            <div style={{ flex: 1, minHeight: 0, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isImg && <img src={viewUrl} alt={preview.original_name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                                {isPdf && <iframe src={pdfUrl} title={preview.original_name} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} />}
                                {!isImg && !isPdf && (
                                    <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
                                        This file type can't be previewed here.<br />
                                        <a href={downloadUrl} style={linkStyle}>Download it instead</a>
                                    </div>
                                )}
                            </div>
                            <div style={{ borderTop: '1px solid #eee', padding: '12px 16px' }}>
                                {!rejecting ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '12px', color: '#777' }}>Status:</span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', background: info.bg, color: info.color }}>{info.label}</span>
                                        {preview.admin_remarks && preview.status !== 'approved' && (
                                            <span style={{ fontSize: '12px', color: '#b91c1c' }}>{preview.admin_remarks}</span>
                                        )}
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                            <button type="button" onClick={() => setRejecting(true)} style={actBtn('white', '#CC0000', '1px solid #CC0000')}>Reject document</button>
                                            <button type="button" onClick={() => (preview.status === 'approved' ? setPreview(null) : decide('approve'))} style={actBtn('#16a34a', 'white')}>Approve document</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Reason for rejecting (the volunteer will see this)</label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => { setRejectReason(e.target.value); setRejectErr(false); }}
                                            rows={2}
                                            placeholder="e.g. The photo is blurry. Upload a clearer copy."
                                            style={{ display: 'block', width: '100%', margin: '6px 0', padding: '8px 10px', border: rejectErr ? '1px solid #CC0000' : '1px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                        />
                                        {rejectErr && <div style={{ fontSize: '11.5px', color: '#CC0000', marginBottom: '6px' }}>Enter a reason first.</div>}
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button type="button" onClick={() => setRejecting(false)} style={actBtn('white', '#333', '1px solid #ddd')}>Cancel</button>
                                            <button type="button" onClick={sendReject} style={actBtn('#CC0000', 'white')}>Reject document</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Delete volunteer confirm */}
            {removeTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '22px', width: '380px', maxWidth: '90%' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Delete {removeTarget.name}?</h3>
                        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, margin: '0 0 8px' }}>
                            They will get an email saying their account was removed, and they will no longer be able to log in to the portal.
                        </p>
                        <p style={{ fontSize: '12px', color: '#9a8585', lineHeight: 1.6, margin: '0 0 18px' }}>
                            Their attendance records are kept for reports.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setRemoveTarget(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={confirmRemove} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Delete volunteer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Document modal */}
            {requestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={submitRequest} style={{ background: 'white', borderRadius: '12px', padding: '22px', width: '360px', maxWidth: '90%' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Request Document</h3>
                        <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Document Name</label>
                        <input required value={requestForm.document_name} onChange={(e) => setRequestForm({ ...requestForm, document_name: e.target.value })} placeholder="e.g. Valid ID, Passport (comma = 1 file each, max 10)" style={{ ...inputStyle, margin: '5px 0 12px' }} />
                        <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Instructions</label>
                        <textarea value={requestForm.instructions} onChange={(e) => setRequestForm({ ...requestForm, instructions: e.target.value })} rows={3} style={{ ...inputStyle, margin: '5px 0 12px', fontFamily: 'inherit' }} />
                        <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Due Date</label>
                        <input type="date" value={requestForm.due_date} onChange={(e) => setRequestForm({ ...requestForm, due_date: e.target.value })} style={{ ...inputStyle, margin: '5px 0 16px' }} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setRequestModal(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Send Request</button>
                        </div>
                    </form>
                </div>
            )}
        </AdminShell>
    );
}

function Detail({ icon, label, value, strong = false }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#aaa', display: 'flex', marginTop: '1px' }}>{icon}</span>
            <div>
                <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#aaa', marginBottom: '2px' }}>{label}</div>
                <div style={{
                    fontSize: '13px', color: strong ? '#CC0000' : '#111',
                    fontWeight: strong ? '700' : '500', fontFamily: strong ? 'monospace' : 'inherit',
                }}>{value}</div>
            </div>
        </div>
    );
}

const svg = (children) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const ICONS = {
    id: svg(<><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>),
    mail: svg(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>),
    calendar: svg(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
    file: svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>),
    clock: svg(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
};

const footLabel = { fontSize: '11px', fontWeight: '600', color: '#999' };
const chip = { fontSize: '10.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px' };

const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '9px 10px',
    borderRadius: '6px', border: '1px solid #ddd', fontSize: '12.5px', background: 'white',
};
