import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function VolunteerDocuments({ auth, documents }) {
    const volunteer = auth.user;
    const [showUpload, setShowUpload] = useState(false);
    const [filterType, setFilterType] = useState('all');

    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'nbi',
        file: null,
    });

    const docs = documents || [];

    const docTypes = {
        nbi:      { label: 'NBI Clearance',       color: '#3B82F6' },
        medical:  { label: 'Medical Certificate',  color: '#16a34a' },
        training: { label: 'Training Certificate', color: '#8B5CF6' },
        barangay: { label: 'Barangay Clearance',   color: '#F59E0B' },
    };

    const statusStyle = {
        pending:  { background: '#fef9c3', color: '#854d0e', label: 'Pending Review' },
        approved: { background: '#f0fdf4', color: '#166534', label: 'Approved' },
        rejected: { background: '#fef2f2', color: '#991b1b', label: 'Rejected' },
    };

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',  href: route('volunteer.dashboard'),     icon: <DashIcon /> },
        { key: 'schedule',      label: 'Schedule',   href: route('volunteer.schedule'),      icon: <CalIcon /> },
        { key: 'communication', label: 'Messages',   href: route('volunteer.communication'), icon: <MsgIcon /> },
        { key: 'attendance',    label: 'Attendance', href: route('volunteer.attendance'),    icon: <ClockIcon /> },
        { key: 'documents',     label: '301 Docs',   href: route('volunteer.documents'),     icon: <DocIcon /> },
    ];

    const handleLogout = () => {
        document.getElementById('logout-form').submit();
    };

    const handleUpload = (e) => {
        e.preventDefault();
        post(route('volunteer.documents.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setShowUpload(false); },
        });
    };

    const handleDelete = (id) => {
        if (confirm('Delete this document?')) {
            router.delete(route('volunteer.documents.destroy', id));
        }
    };

    const filtered = filterType === 'all' ? docs : docs.filter(d => d.type === filterType);

    const counts = {
        all:      docs.length,
        nbi:      docs.filter(d => d.type === 'nbi').length,
        medical:  docs.filter(d => d.type === 'medical').length,
        training: docs.filter(d => d.type === 'training').length,
        barangay: docs.filter(d => d.type === 'barangay').length,
    };

    const getFileExt = (name) => {
        if (!name) return 'FILE';
        return name.split('.').pop().toUpperCase();
    };

    return (
        <>
            <Head title="301 - Documents" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .doc-card:hover { border-color: #ddd !important; background: #fafafa !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
                input:focus, select:focus, textarea:focus { border-color: #CC0000 !important; outline: none; }
            `}</style>

            <form id="logout-form" method="POST" action={route('logout')} style={{ display: 'none' }}>
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
            </form>

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
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Scan<span style={{ color: '#fecaca' }}>2</span>Serve</div>
                            </div>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '6px' }}>Menu</div>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'documents';
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
                                {volunteer?.photo ? <img src={'/storage/' + volunteer.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{volunteer?.name}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Volunteer</div>
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
                <div style={{ marginLeft: '210px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Topbar */}
                    <header style={{
                        height: '54px', background: 'white', borderBottom: '1px solid #ebebeb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>301 Documents</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => setShowUpload(!showUpload)} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#CC0000', color: 'white', border: 'none',
                                borderRadius: '7px', padding: '7px 14px',
                                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                            }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Upload Document
                            </button>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {volunteer?.photo ? <img src={'/storage/' + volunteer.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

                        {/* Upload Form */}
                        {showUpload && (
                            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '20px' }}>
                                <div style={{ padding: '13px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Upload New Document</span>
                                    <button onClick={() => { setShowUpload(false); reset(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '14px' }}>✕</button>
                                </div>
                                <div style={{ padding: '18px' }}>
                                    <form onSubmit={handleUpload}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Document Type</label>
                                                <select value={data.type} onChange={e => setData('type', e.target.value)}
                                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ebebeb', borderRadius: '8px', fontSize: '12px', background: 'white', color: '#111' }}>
                                                    <option value="nbi">NBI Clearance</option>
                                                    <option value="medical">Medical Certificate</option>
                                                    <option value="training">Training Certificate</option>
                                                    <option value="barangay">Barangay Clearance</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                                                    File <span style={{ color: '#ccc', fontWeight: '400', textTransform: 'none' }}>(PDF, JPG, PNG — max 5MB)</span>
                                                </label>
                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={e => setData('file', e.target.files[0])}
                                                    style={{ width: '100%', padding: '7px 0', fontSize: '12px' }} />
                                                {errors.file && <div style={{ fontSize: '10px', color: '#CC0000', marginTop: '4px' }}>{errors.file}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="submit" disabled={processing} style={{
                                                background: '#CC0000', color: 'white', border: 'none',
                                                borderRadius: '7px', padding: '8px 18px',
                                                fontSize: '11px', fontWeight: '600', cursor: 'pointer', opacity: processing ? 0.7 : 1,
                                            }}>
                                                {processing ? 'Uploading...' : 'Upload'}
                                            </button>
                                            <button type="button" onClick={() => { setShowUpload(false); reset(); }} style={{
                                                background: 'white', color: '#555', border: '1px solid #ebebeb',
                                                borderRadius: '7px', padding: '8px 18px',
                                                fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                                            }}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {Object.entries(docTypes).map(([key, val]) => {
                                const count = counts[key];
                                const hasDoc = count > 0;
                                const docOfType = docs.find(d => d.type === key);
                                const st = docOfType ? statusStyle[docOfType.status] : null;
                                return (
                                    <div key={key} onClick={() => setFilterType(filterType === key ? 'all' : key)} style={{
                                        background: 'white', borderRadius: '10px',
                                        border: filterType === key ? `1.5px solid ${val.color}` : '1px solid #ebebeb',
                                        padding: '16px 16px', cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: `${val.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={val.color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                            </div>
                                            {st && (
                                                <span style={{ background: st.background, color: st.color, padding: '2px 7px', borderRadius: '10px', fontSize: '9px', fontWeight: '600' }}>
                                                    {st.label}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#111', marginBottom: '2px' }}>{val.label}</div>
                                        <div style={{ fontSize: '10px', color: hasDoc ? '#aaa' : '#ddd' }}>
                                            {hasDoc ? `${count} file${count > 1 ? 's' : ''} uploaded` : 'Not uploaded'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', padding: '4px', borderRadius: '8px', border: '1px solid #ebebeb', width: 'fit-content' }}>
                            {[['all', 'All'], ['nbi', 'NBI'], ['medical', 'Medical'], ['training', 'Training'], ['barangay', 'Barangay']].map(([key, label]) => (
                                <button key={key} onClick={() => setFilterType(key)} style={{
                                    padding: '5px 12px', borderRadius: '6px', border: 'none',
                                    background: filterType === key ? '#CC0000' : 'transparent',
                                    color: filterType === key ? 'white' : '#aaa',
                                    fontSize: '11px', fontWeight: filterType === key ? '600' : '400',
                                    cursor: 'pointer',
                                }}>
                                    {label}{counts[key] > 0 ? ` (${counts[key]})` : ''}
                                </button>
                            ))}
                        </div>

                        {/* Document Grid */}
                        {filtered.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '60px', textAlign: 'center' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>No documents yet</div>
                                <div style={{ fontSize: '11px', color: '#bbb', marginBottom: '18px' }}>Upload your clearances and certificates to get started.</div>
                                <button onClick={() => setShowUpload(true)} style={{
                                    background: '#CC0000', color: 'white', border: 'none',
                                    borderRadius: '7px', padding: '8px 18px',
                                    fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                }}>Upload your first document</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                {filtered.map(doc => {
                                    const ext = getFileExt(doc.original_name);
                                    const typeInfo = docTypes[doc.type];
                                    const st = statusStyle[doc.status];
                                    const isPdf = ext === 'PDF';
                                    return (
                                        <div key={doc.id} className="doc-card" style={{
                                            background: 'white', borderRadius: '10px',
                                            border: '1px solid #ebebeb', overflow: 'hidden',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}>
                                            {/* File Preview Area */}
                                            <div style={{
                                                height: '110px', background: '#f9f9f9',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                borderBottom: '0.5px solid #f0f0f0', position: 'relative',
                                            }}>
                                                <div style={{
                                                    width: '48px', height: '60px', borderRadius: '4px',
                                                    background: 'white', border: '0.5px solid #e0e0e0',
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={typeInfo?.color || '#aaa'} strokeWidth="1.5" style={{ marginBottom: '4px' }}>
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                        <polyline points="14 2 14 8 20 8"/>
                                                    </svg>
                                                    <span style={{ fontSize: '7px', fontWeight: '700', color: typeInfo?.color || '#aaa', letterSpacing: '0.3px' }}>{ext}</span>
                                                </div>
                                                {/* Delete button */}
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} style={{
                                                    position: 'absolute', top: '8px', right: '8px',
                                                    background: 'white', border: '0.5px solid #ebebeb',
                                                    borderRadius: '5px', padding: '3px 6px',
                                                    cursor: 'pointer', color: '#CC0000', fontSize: '10px',
                                                    fontWeight: '600',
                                                }}>✕</button>
                                            </div>

                                            {/* File Info */}
                                            <div style={{ padding: '10px 12px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#111', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {doc.original_name}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '8px' }}>
                                                    {new Date(doc.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <span style={{ background: st?.background, color: st?.color, padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '600' }}>
                                                    {st?.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

function DashIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function CalIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MsgIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function ClockIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function DocIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
