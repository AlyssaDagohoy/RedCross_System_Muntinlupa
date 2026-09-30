import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function AdminCommunication({ messages, announcements }) {
    const [activeTab, setActiveTab] = useState('messages');
    const [selectedMessage, setSelectedMessage] = useState(null);

    const replyForm = useForm({ reply: '' });
    const announceForm = useForm({ title: '', body: '' });

    // Keeps the open thread in sync with fresh data from the server —
    // without this, a newly-sent reply saves fine but the panel keeps
    // showing the stale object it was opened with.
    useEffect(() => {
        if (!selectedMessage) return;
        const updated = messages.find(m => m.id === selectedMessage.id);
        if (updated) setSelectedMessage(updated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    // Full back-and-forth for the open thread. Uses the `messages` relation
    // (communication_messages table) when present; falls back to the legacy
    // single message/reply columns so older threads still render.
    const threadMessages = useMemo(() => {
        if (!selectedMessage) return [];
        if (Array.isArray(selectedMessage.messages) && selectedMessage.messages.length > 0) {
            return [...selectedMessage.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        const list = [{ sender_type: 'volunteer', body: selectedMessage.message, created_at: selectedMessage.created_at }];
        if (selectedMessage.reply) {
            list.push({ sender_type: 'admin', body: selectedMessage.reply, created_at: selectedMessage.replied_at || selectedMessage.created_at });
        }
        return list;
    }, [selectedMessage]);

    const hasReply = (msg) => !!msg.reply || (msg.messages || []).some(m => m.sender_type === 'admin');

    const fmtFull = (d) => d ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    const handleReply = (e) => {
        e.preventDefault();
        replyForm.post(route('admin.communication.reply', selectedMessage.id), {
            preserveScroll: true,
            onSuccess: () => {
                replyForm.reset();
            },
        });
    };

    const handleAnnounce = (e) => {
        e.preventDefault();
        announceForm.post(route('admin.communication.announce'), {
            onSuccess: () => announceForm.reset(),
        });
    };

    const handleDeleteAnnouncement = (id) => {
        if (confirm('Delete this announcement?')) {
            router.delete(route('admin.communication.announcement.delete', id));
        }
    };

    const sidebarLinks = [
        { key: 'dashboard',     label: 'Dashboard',     href: route('admin.dashboard') },
        { key: 'volunteers',    label: 'Volunteers',    href: route('admin.volunteers') },
        { key: 'activities',    label: 'Activities',    href: route('admin.activities.index') },
        { key: 'attendance',    label: 'Attendance',    href: route('admin.attendance.index') },
        { key: 'communication', label: 'Communication', href: route('admin.communication') },
        { key: 'document-review', label: 'Document Review', href: route('admin.document-review.index') },
    ];

    const awaitingCount = messages.filter(m => !hasReply(m)).length;
    const onMessages = activeTab === 'messages';

    return (
        <>
            <Head title="Communication" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#F3F4F6' }}>

                {/* SIDEBAR */}
                <aside style={{
                    width: '160px', minHeight: '100vh', background: '#CC0000',
                    display: 'flex', flexDirection: 'column', flexShrink: 0,
                    position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
                }}>
                    <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'white', lineHeight: '1.4' }}>
                            Rizal Chapter<br />
                            <span style={{ fontWeight: '400', opacity: 0.85 }}>Muntinlupa City Branch</span>
                        </div>
                    </div>
                    <nav style={{ flex: 1, paddingTop: '8px' }}>
                        {sidebarLinks.map(item => {
                            const isActive = item.key === 'communication';
                            return (
                                <Link key={item.key} href={item.href} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '11px 16px', textDecoration: 'none',
                                    background: isActive ? 'rgba(0,0,0,0.18)' : 'transparent',
                                    color: 'white', fontSize: '13px',
                                    fontWeight: isActive ? '600' : '400',
                                    borderLeft: isActive ? '3px solid white' : '3px solid transparent',
                                }}>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                        <button onClick={() => router.post(route('logout'))} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.75)', fontSize: '12px', padding: 0, width: '100%'
                        }}>
                            <span style={{ fontSize: '16px' }}>⏻</span> Log out
                        </button>
                    </div>
                </aside>

                {/* MAIN */}
                <div style={{ marginLeft: '160px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

                    {/* Topbar */}
                    <header style={{
                        background: 'white', padding: '0 28px', height: '52px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Communication</div>
                    </header>

                    <main style={{ flex: 1, padding: '20px 28px' }}>
                        <div className={`ac-shell${onMessages ? (selectedMessage ? ' pane-open' : '') : ' ann'}`}>

                            {/* ============ TOP: title + tabs ============ */}
                            <div className="ac-head">
                                <div className="ac-title">Communication</div>
                                <div className="ac-sub">Read and answer volunteer messages, and post announcements to every volunteer</div>
                                <nav className="ac-tabs" aria-label="Sections">
                                    <button type="button" className={`ac-tab${onMessages ? ' on' : ''}`}
                                        aria-current={onMessages ? 'page' : undefined}
                                        onClick={() => setActiveTab('messages')}>
                                        Volunteer messages
                                        {messages.length > 0 && <span className="ac-count">{messages.length}</span>}
                                    </button>
                                    <button type="button" className={`ac-tab${!onMessages ? ' on' : ''}`}
                                        aria-current={!onMessages ? 'page' : undefined}
                                        onClick={() => setActiveTab('announce')}>
                                        Announcements
                                        {announcements.length > 0 && <span className="ac-count">{announcements.length}</span>}
                                    </button>
                                </nav>
                            </div>

                            {/* ============ MESSAGES TAB ============ */}
                            {onMessages && (
                                <div className="ac-body">

                                    {/* List */}
                                    <div className="ac-list-col">
                                        <div className="ac-bar">
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#231a1a' }}>All messages</span>
                                            <span style={{ fontSize: '12px', color: '#9a8585' }}>
                                                {awaitingCount > 0 ? `${awaitingCount} awaiting reply` : 'All answered'}
                                            </span>
                                        </div>
                                        <div className="ac-rows">
                                            {messages.length === 0 ? (
                                                <div className="ac-empty">No messages yet. Volunteer messages will appear here.</div>
                                            ) : (
                                                messages.map((msg, i) => {
                                                    const active = selectedMessage?.id === msg.id;
                                                    const replied = hasReply(msg);
                                                    return (
                                                        <div
                                                            key={i}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => setSelectedMessage(msg)}
                                                            onKeyDown={e => { if (e.key === 'Enter') setSelectedMessage(msg); }}
                                                            className={`ac-row ${replied ? 'read' : 'unread'}${active ? ' on' : ''}`}
                                                        >
                                                            <div className="ac-line1">
                                                                <span className="ac-from" style={{ fontWeight: replied ? 600 : 800 }}>{msg.user?.name || 'Volunteer'}</span>
                                                                {replied && <span className="ac-tag ok">Replied</span>}
                                                                <span className="ac-date" style={{ color: replied ? '#9a8585' : '#CC0000', fontWeight: replied ? 400 : 700 }}>
                                                                    {fmtDay(msg.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="ac-subj" style={{ fontWeight: replied ? 500 : 700 }}>{msg.subject}</div>
                                                            <div className="ac-prev">{msg.message}</div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Reading desk */}
                                    <div className="ac-pane">
                                        {!selectedMessage ? (
                                            <div className="ac-none">
                                                <CrossMark size={64} color="#e4d4d4" />
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b5555', marginTop: '12px' }}>Pick a message to read and reply</div>
                                                <div style={{ fontSize: '12.5px', color: '#9a8585', marginTop: '4px' }}>Messages without a reply have a red edge.</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="ac-ptool">
                                                    <button type="button" className="ac-ibtn ac-back" aria-label="Back to list" onClick={() => setSelectedMessage(null)}><BackIcon /></button>
                                                    <div style={{ flex: 1 }} />
                                                    <button type="button" className="ac-ghost" onClick={() => setSelectedMessage(null)}>Close</button>
                                                </div>
                                                <div className="ac-desk">
                                                    <div className="ac-paper">
                                                        <Letterhead />
                                                        <h2 className="ac-h2">{selectedMessage.subject}</h2>
                                                        <div className="ac-count-line">
                                                            From {selectedMessage.user?.name || 'Volunteer'} · {threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''} in this conversation
                                                        </div>

                                                        {threadMessages.map((m, i) => {
                                                            const isAdmin = m.sender_type === 'admin';
                                                            const volName = selectedMessage.user?.name || 'Volunteer';
                                                            return (
                                                                <article key={i} className={`ac-msg${isAdmin ? ' admin' : ''}`}>
                                                                    <dl className="ac-mh">
                                                                        <dt>From</dt>
                                                                        <dd><strong>{isAdmin ? 'PRC Admin (you)' : volName}</strong>{!isAdmin && selectedMessage.user?.email && <span> &lt;{selectedMessage.user.email}&gt;</span>}</dd>
                                                                        <dt>To</dt>
                                                                        <dd>{isAdmin ? volName : 'PRC Admin'}</dd>
                                                                        <dt>Sent</dt>
                                                                        <dd>{fmtFull(m.created_at)}</dd>
                                                                    </dl>
                                                                    <div className="ac-text">{m.body}</div>
                                                                </article>
                                                            );
                                                        })}

                                                        {/* Reply slip */}
                                                        <form onSubmit={handleReply} className="ac-reply">
                                                            <div style={{ fontSize: '12.5px', color: '#6b5555', marginBottom: '8px' }}>
                                                                Reply to <strong>{selectedMessage.user?.name || 'Volunteer'}</strong>
                                                            </div>
                                                            <textarea
                                                                value={replyForm.data.reply}
                                                                onChange={e => replyForm.setData('reply', e.target.value)}
                                                                placeholder="Type your reply..."
                                                                rows={5}
                                                                aria-label="Reply"
                                                                className="ac-ta"
                                                            />
                                                            {replyForm.errors.reply && <div className="ac-err">{replyForm.errors.reply}</div>}
                                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                                <button type="submit" disabled={replyForm.processing} className="ac-primary">
                                                                    {replyForm.processing ? 'Sending...' : 'Send reply'}
                                                                </button>
                                                                <button type="button" onClick={() => setSelectedMessage(null)} className="ac-secondary">Close</button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ============ ANNOUNCEMENTS TAB ============ */}
                            {!onMessages && (
                                <div className="ac-body">

                                    {/* Posted list */}
                                    <div className="ac-list-col">
                                        <div className="ac-bar">
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#231a1a' }}>Posted announcements</span>
                                            <span style={{ fontSize: '12px', color: '#9a8585' }}>{announcements.length}</span>
                                        </div>
                                        <div className="ac-rows">
                                            {announcements.length === 0 ? (
                                                <div className="ac-empty">No announcements posted yet. Write one and it goes to every volunteer.</div>
                                            ) : (
                                                announcements.map((a, i) => (
                                                    <div key={i} className="ac-row read" style={{ cursor: 'default' }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div className="ac-line1">
                                                                <span className="ac-from" style={{ fontWeight: 700 }}>{a.title}</span>
                                                                <span className="ac-date" style={{ color: '#9a8585' }}>{fmtDay(a.created_at)}</span>
                                                            </div>
                                                            <div className="ac-clamp">{a.body}</div>
                                                        </div>
                                                        <button type="button" className="ac-ibtn" title="Delete" aria-label={`Delete "${a.title}"`}
                                                            onClick={() => handleDeleteAnnouncement(a.id)}
                                                            style={{ color: '#CC0000' }}>
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* New announcement paper */}
                                    <div className="ac-pane">
                                        <div className="ac-desk">
                                            <form onSubmit={handleAnnounce} className="ac-paper">
                                                <Letterhead />
                                                <div className="ac-h2" style={{ fontSize: '20px', marginBottom: '14px' }}>New announcement</div>

                                                <label className="ac-label" htmlFor="ann-title">Title</label>
                                                <input id="ann-title" type="text" value={announceForm.data.title}
                                                    onChange={e => announceForm.setData('title', e.target.value)}
                                                    placeholder="Schedule change for Saturday's blood drive"
                                                    className="ac-input" />
                                                {announceForm.errors.title && <div className="ac-err">{announceForm.errors.title}</div>}

                                                <label className="ac-label" htmlFor="ann-body" style={{ marginTop: '16px' }}>Message</label>
                                                <textarea id="ann-body" value={announceForm.data.body}
                                                    onChange={e => announceForm.setData('body', e.target.value)}
                                                    placeholder="Write the announcement here."
                                                    rows={8}
                                                    className="ac-ta" />
                                                {announceForm.errors.body && <div className="ac-err">{announceForm.errors.body}</div>}

                                                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                    <button type="submit" disabled={announceForm.processing} className="ac-primary">
                                                        {announceForm.processing ? 'Posting...' : 'Post to all volunteers'}
                                                    </button>
                                                    <span style={{ fontSize: '12px', color: '#9a8585' }}>Every volunteer sees this in their Messages page.</span>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <style>{`
                .ac-shell{background:#fff;border:1px solid #e6d9d9;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 92px);min-height:560px}
                .ac-head{background:#fdf8f8;border-bottom:1px solid #e6d9d9;padding:16px 20px 0;flex-shrink:0}
                .ac-title{font-size:20px;font-weight:800;color:#231a1a;letter-spacing:-.2px}
                .ac-sub{font-size:12.5px;color:#8a7474;margin-top:2px}
                .ac-tabs{display:flex;gap:2px;margin-top:12px;overflow-x:auto}
                .ac-tab{display:flex;align-items:center;gap:7px;border:none;background:none;padding:10px 14px;font:inherit;font-size:13px;font-weight:500;color:#5b4a4a;cursor:pointer;border-bottom:3px solid transparent;white-space:nowrap}
                .ac-tab:hover{color:#CC0000}
                .ac-tab.on{color:#CC0000;font-weight:700;border-bottom-color:#CC0000}
                .ac-count{font-size:11px;font-weight:700;min-width:17px;text-align:center;border-radius:9px;padding:0 6px;background:#eadede;color:#6b5555}
                .ac-tab.on .ac-count{background:#CC0000;color:#fff}

                .ac-body{display:grid;grid-template-columns:minmax(300px,380px) 1fr;flex:1;min-height:0}
                .ac-list-col{display:flex;flex-direction:column;min-height:0;min-width:0;border-right:1px solid #e6d9d9;background:#fff}
                .ac-bar{display:flex;align-items:center;gap:8px;height:46px;padding:0 16px;border-bottom:1px solid #f0e6e6;flex-shrink:0}
                .ac-rows{flex:1;overflow-y:auto}
                .ac-empty{padding:56px 24px;text-align:center;font-size:13px;line-height:1.6;color:#9a8585}
                .ac-row{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-bottom:1px solid #f0e6e6;border-left:4px solid transparent;cursor:pointer}
                .ac-row.unread{border-left-color:#CC0000;background:#fffbfb}
                .ac-row.read{background:#fff}
                .ac-row:hover{background:#f8f0f0}
                .ac-row.on{background:#fdeaea}
                .ac-row > div{min-width:0}
                .ac-line1{display:flex;align-items:center;gap:6px;min-height:22px}
                .ac-from{font-size:13px;color:#231a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
                .ac-tag{font-size:10.5px;font-weight:700;border-radius:4px;padding:0 6px;flex-shrink:0}
                .ac-tag.ok{color:#166534;background:#f0fdf4}
                .ac-date{margin-left:auto;font-size:11.5px;flex-shrink:0}
                .ac-subj{font-size:13px;color:#231a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .ac-prev{font-size:12.5px;color:#8f7f7f;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .ac-clamp{font-size:12.5px;line-height:1.5;color:#6b5555;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
                .ac-row:focus-visible,.ac-tab:focus-visible,.ac-ibtn:focus-visible,.ac-ghost:focus-visible{outline:2px solid #CC0000;outline-offset:-2px}

                .ac-pane{display:flex;flex-direction:column;min-width:0;min-height:0;background:#f2ecec}
                .ac-ptool{display:flex;align-items:center;gap:6px;padding:6px 12px;background:#fff;border-bottom:1px solid #e6d9d9;flex-shrink:0}
                .ac-ibtn{background:none;border:none;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:#666;cursor:pointer;padding:0;flex-shrink:0}
                .ac-ibtn:hover{background:#eadede}
                .ac-back{display:none}
                .ac-ghost{background:none;border:none;font:inherit;font-size:12.5px;font-weight:600;color:#6b5555;cursor:pointer;padding:6px 10px;border-radius:6px}
                .ac-ghost:hover{background:#eadede}
                .ac-desk{flex:1;overflow-y:auto;padding:24px 20px 40px}
                .ac-paper{max-width:720px;margin:0 auto;background:#fff;border-radius:3px;padding:30px 40px 32px;box-shadow:0 1px 2px rgba(60,20,20,.14),0 10px 26px rgba(60,20,20,.08)}
                .ac-lh{display:flex;align-items:center;gap:10px;padding-bottom:14px;margin-bottom:20px;border-bottom:2px solid #CC0000;font-size:12px;line-height:1.4;color:#6b5555}
                .ac-lh strong{display:block;color:#231a1a;font-size:13px}
                .ac-h2{font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:700;color:#231a1a;margin:0 0 6px}
                .ac-count-line{font-size:12px;color:#9a8585;margin-bottom:8px}
                .ac-msg{padding:18px 0;border-top:1px dashed #d9c7c7}
                .ac-msg.admin{box-shadow:inset 3px 0 0 #CC0000;padding-left:16px}
                .ac-mh{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;margin:0 0 14px;font-size:12.5px;color:#6b5555}
                .ac-mh dt{color:#9a8585}
                .ac-mh dd{margin:0;min-width:0;word-break:break-word}
                .ac-mh strong{color:#231a1a}
                .ac-text{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:#231a1a;white-space:pre-wrap;word-break:break-word;max-width:66ch}
                .ac-reply{margin-top:6px;padding-top:18px;border-top:2px dashed #d9c7c7}
                .ac-label{display:block;font-size:13px;color:#9a8585;margin-bottom:6px}
                .ac-input{width:100%;box-sizing:border-box;border:none;border-bottom:1px solid #e0d2d2;outline:none;padding:6px 0;font:inherit;font-size:14px;color:#231a1a;background:transparent}
                .ac-input:focus{border-bottom-color:#CC0000}
                .ac-ta{display:block;width:100%;box-sizing:border-box;border:1px solid #e0d2d2;border-radius:6px;padding:12px 14px;font:15px/1.7 Georgia,'Times New Roman',serif;color:#231a1a;resize:vertical;outline:none}
                .ac-ta:focus{border-color:#CC0000;box-shadow:0 0 0 3px rgba(204,0,0,.10)}
                .ac-err{font-size:12px;color:#CC0000;margin-top:4px}
                .ac-primary{background:#CC0000;color:#fff;border:none;border-radius:6px;padding:9px 22px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
                .ac-primary:hover{background:#a80000}
                .ac-primary:disabled{opacity:.55;cursor:not-allowed}
                .ac-secondary{background:#fff;color:#555;border:1px solid #d9d9d9;border-radius:6px;padding:9px 18px;font:inherit;font-size:13px;font-weight:500;cursor:pointer}
                .ac-none{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}

                @media (max-width:860px){
                    .ac-body{grid-template-columns:1fr}
                    .ac-shell.pane-open .ac-list-col{display:none}
                    .ac-shell:not(.pane-open):not(.ann) .ac-pane{display:none}
                    .ac-back{display:flex}
                    .ac-shell.ann .ac-body{overflow-y:auto}
                    .ac-shell.ann .ac-list-col{max-height:300px;border-right:none;border-bottom:1px solid #e6d9d9}
                    .ac-desk{padding:14px 10px 28px}
                    .ac-paper{padding:20px 16px 24px}
                    .ac-h2{font-size:20px}
                }
            `}</style>
        </>
    );
}

/* ---------------- pieces ---------------- */

function CrossMark({ size = 22, color = '#CC0000' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
        </svg>
    );
}

function Letterhead() {
    return (
        <div className="ac-lh">
            <CrossMark />
            <div>
                <strong>Philippine Red Cross – Muntinlupa Chapter</strong>
                Volunteer correspondence
            </div>
        </div>
    );
}

function BackIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function TrashIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
