import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function VolunteerCommunication({ auth, sentEmails, announcements }) {
    const volunteer = auth.user;
    const emails = sentEmails || [];
    const announces = announcements || [];
    const [activeTab, setActiveTab] = useState('compose');

    const { data, setData, post, processing, reset, errors } = useForm({
        to: 'rizalmuntinlupa@redcross.org.ph',
        subject: '',
        message: '',
    });

    const handleLogout = () => {
        document.getElementById('logout-form').submit();
    };

    const handleSend = (e) => {
        e.preventDefault();
        post(route('volunteer.communication.send'), {
            onSuccess: () => { reset('subject', 'message'); setActiveTab('sent'); },
        });
    };

    const repliedEmails = emails.filter(e => e.reply);
    const unreadReplies = repliedEmails.length;

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',  href: route('volunteer.dashboard'),     icon: <DashIcon /> },
        { key: 'schedule',      label: 'Schedule',   href: route('volunteer.schedule'),      icon: <CalIcon /> },
        { key: 'communication', label: 'Messages',   href: route('volunteer.communication'), icon: <MsgIcon /> },
        { key: 'attendance',    label: 'Attendance', href: route('volunteer.attendance'),    icon: <ClockIcon /> },
        { key: 'documents',     label: '301 Docs',   href: route('volunteer.documents'),     icon: <DocIcon /> },
    ];

    const tabs = [
        { key: 'compose',       label: 'Compose' },
        { key: 'inbox',         label: 'Inbox',         badge: unreadReplies > 0 ? unreadReplies : null,  badgeColor: '#CC0000' },
        { key: 'announcements', label: 'Announcements', badge: announces.length > 0 ? announces.length : null, badgeColor: '#F59E0B' },
        { key: 'sent',          label: 'Sent' },
    ];

    return (
        <>
            <Head title="Communication" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f7f7f8; }
                .nav-link:hover { background: rgba(0,0,0,0.12) !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
                input:focus, textarea:focus { border-color: #CC0000 !important; }
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
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>Red Cross</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>Muntinlupa Branch</div>
                            </div>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '6px' }}>Menu</div>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'communication';
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
                                {volunteer?.name?.charAt(0).toUpperCase()}
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
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Messages</span>
                            <span style={{ fontSize: '11px', color: '#bbb', margin: '0 6px' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input
                                    placeholder="Search messages..."
                                    style={{ border: '1px solid #ebebeb', borderRadius: '8px', padding: '6px 12px 6px 28px', fontSize: '11px', width: '180px', outline: 'none', background: '#f9f9f9', color: '#333' }}
                                />
                            </div>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                                {volunteer?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>

                    {/* Tabs */}
                    <div style={{ background: 'white', borderBottom: '1px solid #ebebeb', padding: '0 28px', display: 'flex', gap: '2px' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '12px 16px', fontSize: '11px', fontWeight: activeTab === tab.key ? '600' : '400',
                                    color: activeTab === tab.key ? '#CC0000' : '#aaa',
                                    borderBottom: activeTab === tab.key ? '2px solid #CC0000' : '2px solid transparent',
                                    background: 'none', border: 'none', borderRadius: 0,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'color 0.15s',
                                }}
                            >
                                {tab.label}
                                {tab.badge && (
                                    <span style={{
                                        background: tab.badgeColor, color: 'white',
                                        borderRadius: '10px', padding: '1px 6px',
                                        fontSize: '9px', fontWeight: '600',
                                    }}>{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

                        {/* COMPOSE */}
                        {activeTab === 'compose' && (
                            <div style={{ maxWidth: '560px' }}>
                                <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                                    <div style={{ padding: '13px 18px', borderBottom: '1px solid #f5f5f5' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Send a Message to Admin</span>
                                    </div>
                                    <div style={{ padding: '20px 18px' }}>
                                        <form onSubmit={handleSend}>
                                            <div style={{ marginBottom: '14px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>To</label>
                                                <input type="text" value={data.to} onChange={e => setData('to', e.target.value)}
                                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ebebeb', borderRadius: '8px', fontSize: '12px', outline: 'none', background: '#f9f9f9', color: '#333' }} />
                                                {errors.to && <div style={{ fontSize: '10px', color: '#CC0000', marginTop: '4px' }}>{errors.to}</div>}
                                            </div>
                                            <div style={{ marginBottom: '14px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Subject</label>
                                                <input type="text" value={data.subject} onChange={e => setData('subject', e.target.value)}
                                                    placeholder="e.g. Schedule Conflict"
                                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ebebeb', borderRadius: '8px', fontSize: '12px', outline: 'none', color: '#333' }} />
                                                {errors.subject && <div style={{ fontSize: '10px', color: '#CC0000', marginTop: '4px' }}>{errors.subject}</div>}
                                            </div>
                                            <div style={{ marginBottom: '18px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Message</label>
                                                <textarea value={data.message} onChange={e => setData('message', e.target.value)}
                                                    placeholder="Type your message here..." rows={6}
                                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ebebeb', borderRadius: '8px', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#333' }} />
                                                {errors.message && <div style={{ fontSize: '10px', color: '#CC0000', marginTop: '4px' }}>{errors.message}</div>}
                                            </div>
                                            <button type="submit" disabled={processing}
                                                style={{ background: '#CC0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 22px', fontSize: '11px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                                                {processing ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* INBOX */}
                        {activeTab === 'inbox' && (
                            <div style={{ maxWidth: '640px' }}>
                                <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                                    <div style={{ padding: '13px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Admin Replies</span>
                                        <span style={{ fontSize: '10px', color: '#aaa' }}>{repliedEmails.length} message{repliedEmails.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {repliedEmails.length === 0 ? (
                                        <div style={{ padding: '48px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: '#ccc' }}>No replies yet</div>
                                        </div>
                                    ) : (
                                        repliedEmails.map((email, i) => (
                                            <div key={i} style={{ padding: '16px 18px', borderBottom: i < repliedEmails.length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '3px' }}>{email.subject}</div>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>Your message: {email.message}</div>
                                                <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', padding: '11px 14px' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#CC0000', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin replied</div>
                                                    <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.6' }}>{email.reply}</div>
                                                    <div style={{ fontSize: '10px', color: '#bbb', marginTop: '6px' }}>
                                                        {email.replied_at ? new Date(email.replied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ANNOUNCEMENTS */}
                        {activeTab === 'announcements' && (
                            <div style={{ maxWidth: '640px' }}>
                                <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                                    <div style={{ padding: '13px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Announcements from Admin</span>
                                        <span style={{ fontSize: '10px', color: '#aaa' }}>{announces.length} announcement{announces.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {announces.length === 0 ? (
                                        <div style={{ padding: '48px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: '#ccc' }}>No announcements yet</div>
                                        </div>
                                    ) : (
                                        announces.map((a, i) => (
                                            <div key={i} style={{ padding: '16px 18px', borderBottom: i < announces.length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ background: '#fef2f2', color: '#CC0000', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px' }}>ANNOUNCEMENT</span>
                                                    <span style={{ fontSize: '10px', color: '#bbb' }}>
                                                        {new Date(a.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '6px' }}>{a.title}</div>
                                                <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.6' }}>{a.body}</div>
                                                <div style={{ fontSize: '10px', color: '#bbb', marginTop: '8px' }}>Posted by: {a.admin?.name || 'Admin'}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SENT */}
                        {activeTab === 'sent' && (
                            <div style={{ maxWidth: '640px' }}>
                                <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                                    <div style={{ padding: '13px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Sent Messages</span>
                                        <span style={{ fontSize: '10px', color: '#aaa' }}>{emails.length} message{emails.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {emails.length === 0 ? (
                                        <div style={{ padding: '48px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: '#ccc' }}>No sent messages yet</div>
                                        </div>
                                    ) : (
                                        emails.map((email, i) => (
                                            <div key={i} style={{ padding: '14px 18px', borderBottom: i < emails.length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '3px' }}>{email.subject}</div>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.message}</div>
                                                        <div style={{ fontSize: '10px', color: '#bbb' }}>
                                                            {new Date(email.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    {email.reply && (
                                                        <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '9px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', flexShrink: 0, marginLeft: '12px' }}>Replied</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
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