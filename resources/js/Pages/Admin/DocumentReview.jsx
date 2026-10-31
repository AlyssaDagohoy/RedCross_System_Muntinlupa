import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminShell from '../../Components/AdminShell';

const DownloadIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);

const STATUS_STYLES = {
    pending:         { label: 'Pending Review',  bg: '#FFF7E0', color: '#96720B' },
    needs_revision:  { label: 'Needs Revision',  bg: '#FFF0E0', color: '#B45B0B' },
    approved:        { label: 'Approved',        bg: '#E6F7EC', color: '#128A3E' },
    rejected:        { label: 'Rejected',        bg: '#FDECEC', color: '#CC0000' },
};

const TYPE_LABELS = {
    nbi: 'NBI Clearance',
    medical: 'Medical Certificate',
    training: 'Training Certificate',
    barangay: 'Barangay Clearance',
};

/* Summarize a group's overall status from its individual files */
function summarizeStatus(files) {
    if (files.length === 0) return 'pending';
    if (files.every(f => f.status === 'approved')) return 'approved';
    if (files.some(f => f.status === 'rejected')) return 'rejected';
    if (files.some(f => f.status === 'needs_revision')) return 'needs_revision';
    return 'pending';
}

function rowStatus(row) {
    return row.is_group ? summarizeStatus(row.files) : row.status;
}

export default function DocumentReview({ documents, volunteers = [] }) {
    const { flash } = usePage().props;

    const [filter, setFilter] = useState('all');
    const [remarksModal, setRemarksModal] = useState(null); // { id, action: 'needs-revision' | 'reject' }
    const [remarksText, setRemarksText] = useState('');
    const [filesModal, setFilesModal] = useState(null); // the group row being viewed
    const [reqOpen, setReqOpen] = useState(false);
    const [reqForm, setReqForm] = useState({ user_id: '', document_name: '', instructions: '', due_date: '' });
    const [reqErr, setReqErr] = useState('');
    const reqInput = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '12.5px', fontFamily: 'inherit', background: 'white', color: '#111' };
    const reqLabel = { display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#555', marginBottom: '5px' };
    const reqReady = !!reqForm.user_id && !!reqForm.document_name.trim();

    const closeReq = () => { setReqOpen(false); setReqErr(''); };
    const submitReq = (e) => {
        e.preventDefault();
        if (!reqForm.user_id) { setReqErr('Choose a volunteer first.'); return; }
        setReqErr('');
        router.post(route('admin.volunteers.request-document', reqForm.user_id), {
            document_name: reqForm.document_name,
            instructions: reqForm.instructions,
            due_date: reqForm.due_date,
        }, {
            preserveScroll: true,
            onSuccess: () => { setReqOpen(false); setReqForm({ user_id: '', document_name: '', instructions: '', due_date: '' }); },
            onError: (errs) => setReqErr(Object.values(errs)[0] || 'Could not send the request.'),
        });
    };
    const [q, setQ] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const [fDate, setFDate] = useState('any');
    const [fFrom, setFFrom] = useState('');
    const [fTo, setFTo] = useState('');
    const [fType, setFType] = useState('');
    const [fVol, setFVol] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const approve = (id) => {
        if (!confirm('Approve this document? It will become an official record.')) return;
        router.patch(route('admin.document-review.approve', id));
    };

    const openRemarksModal = (id, action) => {
        setRemarksModal({ id, action });
        setRemarksText('');
    };

    const downloadAllFiles = (files) => {
        files.forEach((f, i) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = route('admin.document-review.download', f.id);
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, i * 500);
        });
    };

    const submitRemarks = () => {
        if (!remarksText.trim()) return;
        const routeName = remarksModal.action === 'reject'
            ? 'admin.document-review.reject'
            : 'admin.document-review.needs-revision';
        router.patch(route(routeName, remarksModal.id), { remarks: remarksText }, {
            onSuccess: () => setRemarksModal(null),
        });
    };

    const counts = {
        all: documents.length,
        pending: documents.filter(d => rowStatus(d) === 'pending').length,
        needs_revision: documents.filter(d => rowStatus(d) === 'needs_revision').length,
        approved: documents.filter(d => rowStatus(d) === 'approved').length,
        rejected: documents.filter(d => rowStatus(d) === 'rejected').length,
    };

    const docLabel = (d) => d.is_group ? d.document_name : (TYPE_LABELS[d.type] || d.type);
    const typeOptions = Array.from(new Set(documents.map(docLabel))).filter(Boolean).sort();
    const volOptions = Array.from(new Set(documents.map(d => d.volunteer && d.volunteer.name))).filter(Boolean).sort();
    const activeFilters = (fDate !== 'any' ? 1 : 0) + (fType ? 1 : 0) + (fVol ? 1 : 0);

    const inDate = (iso) => {
        if (fDate === 'any') return true;
        const t = new Date(iso);
        const now = new Date();
        const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (fDate === 'today') return t >= sod;
        if (fDate === 'week') { const s = new Date(sod); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return t >= s; }
        if (fDate === 'month') return t >= new Date(now.getFullYear(), now.getMonth(), 1);
        if (fDate === 'custom') {
            if (fFrom && t < new Date(fFrom + 'T00:00:00')) return false;
            if (fTo && t > new Date(fTo + 'T23:59:59')) return false;
        }
        return true;
    };

    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (d) => {
        const hay = [d.volunteer && d.volunteer.name, d.volunteer && d.volunteer.badge_number, docLabel(d)].join(' ').toLowerCase();
        return words.every(w => hay.includes(w));
    };

    const base = documents.filter(d =>
        matches(d) && inDate(d.created_at) &&
        (!fType || docLabel(d) === fType) &&
        (!fVol || (d.volunteer && d.volunteer.name) === fVol)
    );
    const byStatus = filter === 'all' ? base : base.filter(d => rowStatus(d) === filter);
    const filtered = byStatus.slice().sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'name') return ((a.volunteer && a.volunteer.name) || '').localeCompare((b.volunteer && b.volunteer.name) || '');
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const lblStyle = { fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#888', margin: '0 0 6px' };
    const selStyle = { width: '100%', border: '1px solid #e5e5e5', borderRadius: '6px', padding: '7px 8px', fontSize: '12px', background: '#fff', color: '#222' };
    const chipStyle = (on) => ({ border: '1px solid ' + (on ? '#CC0000' : '#d9d9d9'), background: on ? '#CC0000' : '#fff', color: on ? '#fff' : '#333', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' });
    const clearAll = () => { setFDate('any'); setFFrom(''); setFTo(''); setFType(''); setFVol(''); setSortBy('newest'); };

    // Keep the files modal's data in sync if the underlying documents prop refreshes after an action
    const liveFilesModal = filesModal
        ? documents.find(d => d.is_group && d.document_request_id === filesModal.document_request_id) || null
        : null;

    return (
        <AdminShell active="document-review" title="Document Review">
            <style>{`
                .row-hover:hover { background: #fafafa !important; }
                .filter-tab { cursor: pointer; }
                .btn-approve:hover { background: #128a3e !important; }
                .btn-revision:hover { background: #b45b0b !important; }
                .btn-reject:hover { background: #fef2f2 !important; }
                .file-name-link:hover { text-decoration: underline !important; }
                .icon-btn:hover { background: #f2f2f2 !important; }
            `}</style>

            {(flash?.success || flash?.message) && (
                <div style={{ background: '#E6F7EC', color: '#128A3E', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
                    {flash.success || flash.message}
                </div>
            )}

            {/* Attendance records waiting for an admin decision */}

            {/* Search and filters */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 260px', maxWidth: '380px', minWidth: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', height: '34px' }}>
                        <label style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '100%' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search volunteer, document, badge no..." aria-label="Search documents" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '12.5px' }} />
                    </label>
                    <button type="button" onClick={() => setPanelOpen(o => !o)} aria-label="Filters" style={{ position: 'relative', width: '38px', height: '100%', borderRadius: '0 5px 5px 0', border: 'none', borderLeft: '1px solid #e5e5e5', background: '#f7f7f7', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><g strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="6" r="2"/><line x1="4" y1="6" x2="12" y2="6"/><line x1="16" y1="6" x2="20" y2="6"/><circle cx="8" cy="12" r="2"/><line x1="4" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="20" y2="12"/><circle cx="17" cy="18" r="2"/><line x1="4" y1="18" x2="15" y2="18"/><line x1="19" y1="18" x2="20" y2="18"/></g></svg>
                        {activeFilters > 0 && (
                            <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '1px solid #CC0000', color: '#CC0000', fontSize: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>
                        )}
                    </button>
                    </div>
                    <button type="button" onClick={() => setReqOpen(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', borderRadius: '6px', border: 'none', background: '#CC0000', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Request document
                    </button>
                </div>
                {panelOpen && (
                    <>
                        <div onClick={() => setPanelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                        <div style={{ position: 'absolute', top: '42px', left: 'clamp(0px, calc(min(100%, 380px) - 164px), calc(100% - 290px))', width: '290px', maxWidth: '100%', zIndex: 40, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 18px rgba(0,0,0,.12)' }}>
                            <div style={lblStyle}>Date submitted</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: fDate === 'custom' ? '8px' : '14px' }}>
                                {[['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['custom', 'Custom']].map(([k, l]) => (
                                    <button key={k} type="button" onClick={() => setFDate(fDate === k ? 'any' : k)} style={chipStyle(fDate === k)}>{l}</button>
                                ))}
                            </div>
                            {fDate === 'custom' && (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                    <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={selStyle} aria-label="From date" />
                                    <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={selStyle} aria-label="To date" />
                                </div>
                            )}
                            <div style={lblStyle}>Document type</div>
                            <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ ...selStyle, marginBottom: '14px' }}>
                                <option value="">All types</option>
                                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div style={lblStyle}>Volunteer</div>
                            <select value={fVol} onChange={(e) => setFVol(e.target.value)} style={{ ...selStyle, marginBottom: '14px' }}>
                                <option value="">Anyone</option>
                                {volOptions.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <div style={lblStyle}>Sort by</div>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...selStyle, marginBottom: '16px' }}>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="name">Volunteer A to Z</option>
                            </select>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button type="button" onClick={clearAll} style={{ background: 'none', border: 'none', color: '#CC0000', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Clear all</button>
                                <button type="button" onClick={() => setPanelOpen(false)} style={{ background: '#CC0000', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 26px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Done</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '18px', flexWrap: 'wrap', borderBottom: '1px solid #e5e5e5' }}>
                {[
                    ['all', 'All'],
                    ['pending', 'Pending Review'],
                    ['needs_revision', 'Needs Revision'],
                    ['approved', 'Approved'],
                    ['rejected', 'Rejected'],
                ].map(([key, label]) => (
                    <div key={key} className="filter-tab" onClick={() => setFilter(key)} style={{
                        padding: '8px 14px', borderRadius: '0', fontSize: '12.5px', fontWeight: filter === key ? '600' : '500',
                        background: 'transparent',
                        color: filter === key ? '#222' : '#777',
                        border: 'none', borderBottom: '2px solid ' + (filter === key ? '#CC0000' : 'transparent'), marginBottom: '-1px',
                    }}>
                        {label} ({counts[key]})
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '880px' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #ebebeb' }}>
                                {['Volunteer', 'Document', 'Submitted', 'Status', 'Reviewed By', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '10.5px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>No documents in this category.</td></tr>
                            )}
                            {filtered.map(row => {
                                if (row.is_group) {
                                    const st = STATUS_STYLES[summarizeStatus(row.files)] || STATUS_STYLES.pending;
                                    return (
                                        <tr key={row.id} className="row-hover" style={{ borderBottom: '1px solid #f2f2f2' }}>
                                            <td style={{ padding: '13px 16px', fontSize: '12.5px', color: '#111' }}>
                                                <div style={{ fontWeight: '600' }}>{row.volunteer.name}</div>
                                                {row.volunteer.badge_number && (
                                                    <div style={{ fontSize: '10.5px', color: '#999' }}>{row.volunteer.badge_number}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '13px 16px', fontSize: '12px', color: '#333' }}>
                                                <div>{row.document_name}</div>
                                                <div style={{ fontSize: '10.5px', color: '#aaa' }}>{row.files.length} file{row.files.length !== 1 ? 's' : ''}</div>
                                            </td>
                                            <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888', whiteSpace: 'nowrap' }}>
                                                {new Date(row.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '13px 16px' }}>
                                                <span style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>{st.label}</span>
                                            </td>
                                            <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888' }}>&mdash;</td>
                                            <td style={{ padding: '13px 16px' }}>
                                                <button onClick={() => setFilesModal(row)} style={{
                                                    fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                    background: '#CC0000', color: 'white', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                                                }}>
                                                    View {row.files.length} File{row.files.length !== 1 ? 's' : ''}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }

                                const doc = row;
                                const s = STATUS_STYLES[doc.status] || STATUS_STYLES.pending;
                                return (
                                    <tr key={doc.id} className="row-hover" style={{ borderBottom: '1px solid #f2f2f2' }}>
                                        <td style={{ padding: '13px 16px', fontSize: '12.5px', color: '#111' }}>
                                            <div style={{ fontWeight: '600' }}>{doc.volunteer.name}</div>
                                            {doc.volunteer.badge_number && (
                                                <div style={{ fontSize: '10.5px', color: '#999' }}>{doc.volunteer.badge_number}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '13px 16px', fontSize: '12px', color: '#333' }}>
                                            <div>{TYPE_LABELS[doc.type] || doc.type}</div>
                                            <a href={route('admin.document-review.view', doc.id)} target="_blank" rel="noreferrer" className="file-name-link" style={{ fontSize: '10.5px', color: '#aaa', textDecoration: 'none' }}>
                                                {doc.original_name}
                                            </a>
                                        </td>
                                        <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888', whiteSpace: 'nowrap' }}>
                                            {new Date(doc.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>{s.label}</span>
                                            {doc.admin_remarks && (
                                                <div style={{ fontSize: '10.5px', color: '#999', marginTop: '4px', maxWidth: '200px' }}>&quot;{doc.admin_remarks}&quot;</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888' }}>
                                            {doc.reviewer ? doc.reviewer.name : '\u2014'}
                                        </td>
                                        <td style={{ padding: '13px 16px' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <a href={route('admin.document-review.download', doc.id)} title="Download" className="icon-btn" style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e0e0e0',
                                                    color: '#333', textDecoration: 'none',
                                                }}><DownloadIcon /></a>
                                                {doc.status !== 'approved' && (
                                                    <button className="btn-approve" onClick={() => approve(doc.id)} style={{
                                                        fontSize: '11px', padding: '6px 10px', borderRadius: '6px', border: 'none',
                                                        background: '#16A34A', color: 'white', fontWeight: '600', cursor: 'pointer',
                                                    }}>Approve</button>
                                                )}
                                                {doc.status !== 'needs_revision' && (
                                                    <button className="btn-revision" onClick={() => openRemarksModal(doc.id, 'needs-revision')} style={{
                                                        fontSize: '11px', padding: '6px 10px', borderRadius: '6px', border: 'none',
                                                        background: '#E67E22', color: 'white', fontWeight: '600', cursor: 'pointer',
                                                    }}>Needs Revision</button>
                                                )}
                                                {doc.status !== 'rejected' && (
                                                    <button className="btn-reject" onClick={() => openRemarksModal(doc.id, 'reject')} style={{
                                                        fontSize: '11px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FCA5A5',
                                                        background: 'white', color: '#CC0000', fontWeight: '600', cursor: 'pointer',
                                                    }}>Reject</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Files modal for a grouped document request -- shows each submitted file individually */}
            {liveFilesModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={() => setFilesModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '620px',
                        maxHeight: '85vh', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>{liveFilesModal.document_name}</h3>
                                <div style={{ fontSize: '11.5px', color: '#888', marginTop: '2px' }}>{liveFilesModal.volunteer.name}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                <button onClick={() => downloadAllFiles(liveFilesModal.files)} className="icon-btn" style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 10px',
                                    borderRadius: '6px', border: '1px solid #e0e0e0', color: '#333', fontWeight: '600',
                                    cursor: 'pointer', background: 'white',
                                }}>
                                    <DownloadIcon /> Download All
                                </button>
                                <button onClick={() => setFilesModal(null)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '18px', lineHeight: 1 }}>&times;</button>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                            {liveFilesModal.files.map((f, i) => {
                                const s = STATUS_STYLES[f.status] || STATUS_STYLES.pending;
                                return (
                                    <div key={f.id} style={{ padding: '12px 14px', borderBottom: i < liveFilesModal.files.length - 1 ? '1px solid #f2f2f2' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                            <div style={{ minWidth: '0' }}>
                                                <a href={route('admin.document-review.view', f.id)} target="_blank" rel="noreferrer" className="file-name-link" style={{
                                                    fontSize: '12px', color: '#111', fontWeight: '600', textDecoration: 'none',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px', display: 'block',
                                                }}>{f.original_name}</a>
                                                <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', display: 'inline-block', marginTop: '5px' }}>{s.label}</span>
                                                {f.admin_remarks && (
                                                    <div style={{ fontSize: '10.5px', color: '#999', marginTop: '4px', maxWidth: '260px' }}>&quot;{f.admin_remarks}&quot;</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <a href={route('admin.document-review.download', f.id)} title="Download" className="icon-btn" style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e0e0e0',
                                                    color: '#333', textDecoration: 'none',
                                                }}><DownloadIcon /></a>
                                                <select
                                                    value=""
                                                    onChange={(e) => {
                                                        const action = e.target.value;
                                                        if (action === 'approve') approve(f.id);
                                                        if (action === 'needs-revision') openRemarksModal(f.id, 'needs-revision');
                                                        if (action === 'reject') openRemarksModal(f.id, 'reject');
                                                        e.target.value = '';
                                                    }}
                                                    style={{
                                                        fontSize: '10.5px', padding: '5px 9px', borderRadius: '6px', border: '1px solid #e0e0e0',
                                                        color: '#333', fontWeight: '600', cursor: 'pointer', background: 'white', fontFamily: 'inherit',
                                                    }}
                                                >
                                                    <option value="" disabled>Actions</option>
                                                    {f.status !== 'approved' && <option value="approve">Approve</option>}
                                                    {f.status !== 'needs_revision' && <option value="needs-revision">Request Revision</option>}
                                                    {f.status !== 'rejected' && <option value="reject">Reject</option>}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Remarks modal -- required for Needs Revision / Reject */}
            {remarksModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={() => setRemarksModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px',
                    }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '6px' }}>
                            {remarksModal.action === 'reject' ? 'Reject Document' : 'Request Revision'}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px' }}>
                            Please explain why, so the volunteer knows what to fix or expect. This is required.
                        </p>
                        <textarea
                            value={remarksText}
                            onChange={e => setRemarksText(e.target.value)}
                            placeholder="e.g. Please upload a clearer copy. The ID information is not readable."
                            rows={4}
                            style={{
                                width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0',
                                fontSize: '12.5px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '16px',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setRemarksModal(null)} style={{
                                padding: '9px 16px', borderRadius: '8px', border: '1px solid #e0e0e0',
                                background: 'white', color: '#555', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={submitRemarks} disabled={!remarksText.trim()} style={{
                                padding: '9px 16px', borderRadius: '8px', border: 'none',
                                background: remarksText.trim() ? '#CC0000' : '#f0a0a0',
                                color: 'white', fontSize: '12px', fontWeight: '600',
                                cursor: remarksText.trim() ? 'pointer' : 'not-allowed',
                            }}>
                                {remarksModal.action === 'reject' ? 'Reject' : 'Send for Revision'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {reqOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={closeReq}>
                    <form onClick={e => e.stopPropagation()} onSubmit={submitReq} style={{
                        background: 'white', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '460px',
                        maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>Request Document</h3>
                            <button type="button" onClick={closeReq} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '18px', lineHeight: 1 }}>&times;</button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>
                            Choose a volunteer and tell them what to submit.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '14px' }}>
                            <div style={{ minWidth: 0 }}>
                                <label style={reqLabel}>Volunteer</label>
                                <select value={reqForm.user_id} onChange={(e) => setReqForm({ ...reqForm, user_id: e.target.value })} style={reqInput}>
                                    <option value="">{volunteers.length === 0 ? 'No approved volunteers yet' : 'Choose a volunteer'}</option>
                                    {volunteers.map(v => <option key={v.id} value={v.id}>{v.name}{v.badge_number ? ' (' + v.badge_number + ')' : ''}</option>)}
                                </select>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <label style={reqLabel}>Due Date</label>
                                <input type="date" value={reqForm.due_date} onChange={(e) => setReqForm({ ...reqForm, due_date: e.target.value })} style={reqInput} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={reqLabel}>Document Name</label>
                            <input value={reqForm.document_name} onChange={(e) => setReqForm({ ...reqForm, document_name: e.target.value })} placeholder="e.g. Valid ID, Passport (comma = 1 file each, max 10)" style={reqInput} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={reqLabel}>Instructions</label>
                            <textarea value={reqForm.instructions} onChange={(e) => setReqForm({ ...reqForm, instructions: e.target.value })} rows={3} placeholder="e.g. Please upload a clear copy of both sides." style={{ ...reqInput, resize: 'vertical' }} />
                        </div>
                        {reqErr && <div style={{ color: '#CC0000', fontSize: '12px', marginBottom: '12px' }}>{reqErr}</div>}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={closeReq} style={{
                                padding: '9px 16px', borderRadius: '8px', border: '1px solid #e0e0e0',
                                background: 'white', color: '#555', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            }}>Cancel</button>
                            <button type="submit" disabled={!reqReady} style={{
                                padding: '9px 16px', borderRadius: '8px', border: 'none',
                                background: reqReady ? '#CC0000' : '#f0a0a0',
                                color: 'white', fontSize: '12px', fontWeight: '600',
                                cursor: reqReady ? 'pointer' : 'not-allowed',
                            }}>Send Request</button>
                        </div>
                    </form>
                </div>
            )}
        </AdminShell>
    );
}
