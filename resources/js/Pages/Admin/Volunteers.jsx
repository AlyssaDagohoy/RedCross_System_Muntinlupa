import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Volunteers({ auth, volunteers }) {
    const { flash } = usePage().props;
    const admin = auth?.user;

    const approve = (id) => {
        router.patch(route('admin.volunteers.approve', id));
    };

    const reject = (id) => {
        router.patch(route('admin.volunteers.reject', id));
    };

    const handleLogout = () => router.post(route('logout'));

    const [requestModal, setRequestModal] = useState(null); // volunteer id or null
    const [requestForm, setRequestForm] = useState({ document_name: '', instructions: '', due_date: '' });

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

    const pending = volunteers.filter(v => v.status === 'pending');
    const approved = volunteers.filter(v => v.status === 'approved');
    const rejected = volunteers.filter(v => v.status === 'rejected');

    const sidebarLinks = [
        { key: 'dashboard',  label: 'Dashboard',  href: route('admin.dashboard'),       icon: <DashIcon /> },
        { key: 'volunteers', label: 'Volunteers', href: route('admin.volunteers'),       icon: <PeopleIcon /> },
        { key: 'activities', label: 'Activities', href: route('admin.activities.index'), icon: <CalIcon /> },
        { key: 'attendance', label: 'Attendance', href: route('admin.attendance.index'), icon: <ClockIcon /> },
        { key: 'document-review', label: 'Document Review', href: route('admin.document-review.index'), icon: <DocIcon /> },
    ];

    const tableHeaders = ['Name', 'Email', 'Registered', 'Actions'];

    return (
        <>
            <Head title="Manage Volunteers" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                .row-hover:hover { background: #fafafa !important; }
                .btn-approve:hover { background: #128a3e !important; }
                .btn-reject:hover { background: #fef2f2 !important; }
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
                            const isActive = item.key === 'volunteers';
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
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Volunteers</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {volunteers.length} total
                            </span>
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
                            <h1 style={{ fontSize: '22px', color: '#111', fontWeight: '700', margin: 0 }}>Manage Volunteers</h1>
                        </div>

                        {/* Flash message */}
                        {flash?.success && (
                            <div style={{
                                marginBottom: '18px', padding: '11px 16px',
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: '8px', fontSize: '12.5px', color: '#16a34a', fontWeight: '500',
                            }}>{flash.success}</div>
                        )}

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Pending Approval', value: pending.length, color: '#f59e0b' },
                                { label: 'Approved', value: approved.length, color: '#16a34a' },
                                { label: 'Rejected', value: rejected.length, color: '#CC0000' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '18px 20px' }}>
                                    <div style={{ fontSize: '26px', fontWeight: '700', color }}>{value}</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: '500' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Pending Table */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', marginBottom: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Pending Approval ({pending.length})</span>
                            </div>
                            {pending.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>No pending volunteers</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fafafa' }}>
                                            {tableHeaders.map(h => (
                                                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map((v) => (
                                            <tr key={v.id} className="row-hover" style={{ borderTop: '1px solid #f5f5f5', transition: 'background 0.1s' }}>
                                                <td style={{ padding: '13px 18px', fontSize: '12.5px', color: '#111', fontWeight: '600' }}>{v.name}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#777' }}>{v.email}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#aaa' }}>
                                                    {new Date(v.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '13px 18px' }}>
                                                    <div style={{ display: 'flex', gap: '7px' }}>
                                                        <button onClick={() => approve(v.id)} className="btn-approve" style={{
                                                            background: '#16a34a', color: 'white', border: 'none',
                                                            padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                                                            fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s',
                                                        }}>Approve</button>
                                                        <button onClick={() => reject(v.id)} className="btn-reject" style={{
                                                            background: 'white', color: '#CC0000', border: '1px solid #CC0000',
                                                            padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                                                            fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s',
                                                        }}>Reject</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Approved Table */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', marginBottom: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Approved Volunteers ({approved.length})</span>
                            </div>
                            {approved.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>No approved volunteers yet</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fafafa' }}>
                                            {tableHeaders.map(h => (
                                                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approved.map((v) => (
                                            <tr key={v.id} className="row-hover" style={{ borderTop: '1px solid #f5f5f5', transition: 'background 0.1s' }}>
                                                <td style={{ padding: '13px 18px', fontSize: '12.5px', color: '#111', fontWeight: '600' }}>{v.name}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#777' }}>{v.email}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#aaa' }}>
                                                    {new Date(v.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '13px 18px' }}>
                                                    <button onClick={() => reject(v.id)} className="btn-reject" style={{
                                                        background: 'white', color: '#CC0000', border: '1px solid #CC0000',
                                                        padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                                                        fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s',
                                                    }}>Revoke</button>
                                                    <button onClick={() => openRequestModal(v.id)} style={{
                                                        background: 'white', color: '#333', border: '1px solid #ddd',
                                                        padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                                                        fontWeight: '600', cursor: 'pointer', marginLeft: '7px',
                                                    }}>Request Document</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Rejected Table */}
                        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#CC0000', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Rejected Volunteers ({rejected.length})</span>
                            </div>
                            {rejected.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>No rejected volunteers</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fafafa' }}>
                                            {tableHeaders.map(h => (
                                                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rejected.map((v) => (
                                            <tr key={v.id} className="row-hover" style={{ borderTop: '1px solid #f5f5f5', transition: 'background 0.1s' }}>
                                                <td style={{ padding: '13px 18px', fontSize: '12.5px', color: '#111', fontWeight: '600' }}>{v.name}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#777' }}>{v.email}</td>
                                                <td style={{ padding: '13px 18px', fontSize: '12px', color: '#aaa' }}>
                                                    {new Date(v.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '13px 18px' }}>
                                                    <button onClick={() => approve(v.id)} className="btn-approve" style={{
                                                        background: '#16a34a', color: 'white', border: 'none',
                                                        padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                                                        fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s',
                                                    }}>Re-approve</button>
                                                    <button onClick={() => openRequestModal(v.id)} style={{
                                                        background: 'white', color: '#333', border: '1px solid #ddd',
                                                        padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                                                        fontWeight: '600', cursor: 'pointer', marginLeft: '7px',
                                                    }}>Request Document</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </main>
                </div>
            </div>

                {requestModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <form onSubmit={submitRequest} style={{ background: 'white', borderRadius: '12px', padding: '22px', width: '360px', maxWidth: '90%' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Request Document</h3>
                            <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Document Name</label>
                            <input required value={requestForm.document_name} onChange={(e) => setRequestForm({ ...requestForm, document_name: e.target.value })} placeholder="e.g. Valid ID, Passport (comma = 1 file each, max 10)" style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12.5px', margin: '5px 0 12px' }} />
                            <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Instructions</label>
                            <textarea value={requestForm.instructions} onChange={(e) => setRequestForm({ ...requestForm, instructions: e.target.value })} rows={3} style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12.5px', margin: '5px 0 12px', fontFamily: 'inherit' }} />
                            <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#555' }}>Due Date</label>
                            <input type="date" value={requestForm.due_date} onChange={(e) => setRequestForm({ ...requestForm, due_date: e.target.value })} style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12.5px', margin: '5px 0 16px' }} />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setRequestModal(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Send Request</button>
                            </div>
                        </form>
                    </div>
                )}
        </>
    );
}

function DashIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function CalIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ClockIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function PeopleIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function DocIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}