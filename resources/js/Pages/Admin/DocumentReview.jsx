import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const DashIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const PeopleIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const CalIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const DocIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
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

export default function DocumentReview({ auth, documents }) {
    const { flash } = usePage().props;
    const admin = auth?.user;

    const [filter, setFilter] = useState('all');
    const [remarksModal, setRemarksModal] = useState(null); // { id, action: 'needs-revision' | 'reject' }
    const [remarksText, setRemarksText] = useState('');
    const [filesModal, setFilesModal] = useState(null); // the group row being viewed

    const handleLogout = () => router.post(route('logout'));

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

    const filtered = filter === 'all' ? documents : documents.filter(d => rowStatus(d) === filter);

    const sidebarLinks = [
        { key: 'dashboard',  label: 'Dashboard',  href: route('admin.dashboard'),       icon: <DashIcon /> },
        { key: 'volunteers', label: 'Volunteers', href: route('admin.volunteers'),       icon: <PeopleIcon /> },
        { key: 'activities', label: 'Activities', href: route('admin.activities.index'), icon: <CalIcon /> },
        { key: 'attendance', label: 'Attendance', href: route('admin.attendance.index'), icon: <ClockIcon /> },
        { key: 'document-review', label: 'Document Review', href: route('admin.document-review.index'), icon: <DocIcon /> },
    ];

    // Keep the files modal's data in sync if the underlying documents prop refreshes after an action
    const liveFilesModal = filesModal
        ? documents.find(d => d.is_group && d.document_request_id === filesModal.document_request_id) || null
        : null;

    return (
        <>
            <Head title="Document Review" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .row-hover:hover { background: #fafafa !important; }
                .filter-tab { cursor: pointer; }
                .btn-approve:hover { background: #128a3e !important; }
                .btn-revision:hover { background: #b45b0b !important; }
                .btn-reject:hover { background: #fef2f2 !important; }
                .file-name-link:hover { text-decoration: underline !important; }
                .icon-btn:hover { background: #f2f2f2 !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f7f7f8' }}>

                {/* SIDEBAR */}
                <aside style={{
                    width: '210px', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
                    background: '#CC0000', display: 'flex', flexDirection: 'column',
                    boxShadow: '4px 0 20px rgba(204,0,0,0.15)',
                }}>
                    <div style={{ padding: '28px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'white', letterSpacing: '0.3px' }}>Red Cross</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>Admin Panel</div>
                            </div>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '6px' }}>Menu</div>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'document-review';
                            return (
                                <Link key={item.key} href={item.href} className="nav-link" style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 12px', textDecoration: 'none', borderRadius: '7px',
                                    marginBottom: '2px',
                                    background: isActive ? 'rgba(0,0,0,0.18)' : 'transparent',
                                    color: 'white', fontSize: '12px',
                                    fontWeight: isActive ? '600' : '400',
                                    borderLeft: isActive ? '3px solid white' : '3px solid transparent',
                                    transition: 'all 0.15s',
                                }}>
                                    <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px', padding: '0 4px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.name || 'Admin'}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Administrator</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{
                            width: '100%', padding: '7px 12px', borderRadius: '7px',
                            background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.75)', fontSize: '11px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '7px',
                        }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Sign out
                        </button>
                    </div>
                </aside>

                {/* MAIN */}
                <div style={{ marginLeft: '210px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

                    {/* Topbar */}
                    <header style={{
                        height: '54px', background: 'white', borderBottom: '1px solid #ebebeb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Document Review</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>&middot;</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>{documents.length} total</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

                        {/* Header */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#CC0000', marginBottom: '5px' }}>Admin Panel</div>
                            <h1 style={{ fontSize: '22px', color: '#111', fontWeight: '700', margin: 0 }}>Compliance Document Review</h1>
                        </div>

                        {flash?.success && (
                            <div style={{ background: '#E6F7EC', color: '#128A3E', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
                                {flash.success}
                            </div>
                        )}

                        {/* Filter tabs */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
                            {[
                                ['all', 'All'],
                                ['pending', 'Pending Review'],
                                ['needs_revision', 'Needs Revision'],
                                ['approved', 'Approved'],
                                ['rejected', 'Rejected'],
                            ].map(([key, label]) => (
                                <div key={key} className="filter-tab" onClick={() => setFilter(key)} style={{
                                    padding: '7px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
                                    background: filter === key ? '#CC0000' : 'white',
                                    color: filter === key ? 'white' : '#555',
                                    border: filter === key ? 'none' : '1px solid #e5e5e5',
                                }}>
                                    {label} ({counts[key]})
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                                    <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888' }}>
                                                        {new Date(row.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <span style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: '600' }}>{st.label}</span>
                                                    </td>
                                                    <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888' }}>&mdash;</td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <button onClick={() => setFilesModal(row)} style={{
                                                            fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                            background: '#CC0000', color: 'white', fontWeight: '600', cursor: 'pointer',
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
                                                <td style={{ padding: '13px 16px', fontSize: '11.5px', color: '#888' }}>
                                                    {new Date(doc.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '13px 16px' }}>
                                                    <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: '600' }}>{s.label}</span>
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
                    </main>
                </div>
            </div>

            {/* Files modal for a grouped document request -- shows each submitted file individually */}
            {liveFilesModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={() => setFilesModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '620px',
                        maxHeight: '85vh', overflowY: 'auto', fontFamily: "'Inter', sans-serif",
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
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={() => setRemarksModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px',
                        fontFamily: "'Inter', sans-serif",
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
                                width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0',
                                fontSize: '12.5px', fontFamily: "'Inter', sans-serif", resize: 'vertical', marginBottom: '16px',
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
        </>
    );
}
