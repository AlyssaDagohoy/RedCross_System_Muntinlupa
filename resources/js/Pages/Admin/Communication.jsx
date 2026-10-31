import { router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../Components/AdminShell';

const lastActivity = (t) => {
    const times = (Array.isArray(t.messages) ? t.messages : []).map((m) => new Date(m.created_at).getTime());
    times.push(new Date(t.replied_at || t.created_at).getTime());
    const valid = times.filter((n) => !Number.isNaN(n));
    return valid.length ? Math.max(...valid) : 0;
};
const sameLocalDay = (ms) => new Date(ms).toDateString() === new Date().toDateString();
// Today = had activity today, or still unread (so nothing important gets buried)
const isTodayThread = (t) => sameLocalDay(lastActivity(t)) || !!t.admin_unread;

export default function AdminCommunication({ messages = [], announcements = [] }) {
    const [view, setView] = useState('inbox');
    const [selectedKey, setSelectedKey] = useState(null);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [folderOpen, setFolderOpen] = useState(false);

    const replyForm = useForm({ reply: '' });

    // live-poll: refresh messages every 5 seconds (only while this tab is visible)
    useEffect(() => {
        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['messages'], preserveScroll: true, preserveState: true });
        };
        const id = setInterval(tick, 5000);
        return () => clearInterval(id);
    }, []);
    const announceForm = useForm({ title: '', body: '' });

    const onAnn = view === 'announce';

    /* ---------- rows for the current folder ---------- */
    const rows = useMemo(() => {
        const out = [];
        messages.forEach((t) => {
            const st = t.admin_inbox_status;
            const ss = t.admin_sent_status;
            if (view === 'inbox' && st === 'active' && isTodayThread(t)) out.push({ key: `${t.id}:inbox`, t, box: 'inbox' });
            if (view === 'history' && st === 'active' && !isTodayThread(t)) out.push({ key: `${t.id}:inbox`, t, box: 'inbox' });
            if (view === 'starred' && t.admin_starred_at && st !== 'trashed' && st !== 'purged') out.push({ key: `${t.id}:inbox`, t, box: 'inbox' });
            if (view === 'sent' && t.has_admin_reply && ss === 'active') out.push({ key: `${t.id}:sent`, t, box: 'sent' });
            if (view === 'archive') {
                if (st === 'archived') out.push({ key: `${t.id}:inbox`, t, box: 'inbox' });
                if (t.has_admin_reply && ss === 'archived') out.push({ key: `${t.id}:sent`, t, box: 'sent' });
            }
            if (view === 'trash') {
                if (st === 'trashed') out.push({ key: `${t.id}:inbox`, t, box: 'inbox' });
                if (t.has_admin_reply && ss === 'trashed') out.push({ key: `${t.id}:sent`, t, box: 'sent' });
            }
        });
        return out;
    }, [messages, view]);

    const selectedRow = rows.find((r) => r.key === selectedKey) || null;
    const selected = selectedRow ? selectedRow.t : null;
    const selectedRows = rows.filter((r) => selectedKeys.includes(r.key));
    const allSelected = rows.length > 0 && selectedKeys.length === rows.length;

    const inboxUnread = messages.filter((t) => t.admin_inbox_status === 'active' && t.admin_unread).length;
    const starredCount = messages.filter((t) => t.admin_starred_at && t.admin_inbox_status !== 'trashed' && t.admin_inbox_status !== 'purged').length;

    const folders = [
        { id: 'inbox', label: 'Inbox', count: inboxUnread, icon: <InboxIcon /> },
        { id: 'starred', label: 'Starred', count: starredCount, icon: <StarIcon /> },
        { id: 'sent', label: 'Sent', count: 0, icon: <SendIcon /> },
        { id: 'history', label: 'History', count: 0, icon: <HistoryIcon /> },
        { id: 'archive', label: 'Archive', count: 0, icon: <ArchiveIcon /> },
        { id: 'trash', label: 'Trash', count: 0, icon: <TrashIcon /> },
        { id: 'announce', label: 'Announcements', count: announcements.length, icon: <MegaphoneIcon /> },
    ];
    const currentFolder = folders.find((f) => f.id === view) || folders[0];

    const switchView = (id) => {
        setView(id);
        setSelectedKey(null);
        setSelectedKeys([]);
        setFolderOpen(false);
    };

    /* ---------- thread text ---------- */
    const threadMessages = useMemo(() => {
        if (!selected) return [];
        if (Array.isArray(selected.messages) && selected.messages.length > 0) {
            return [...selected.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        const list = [{ sender_type: 'volunteer', body: selected.message, created_at: selected.created_at }];
        if (selected.reply) {
            list.push({ sender_type: 'admin', body: selected.reply, created_at: selected.replied_at || selected.created_at });
        }
        return list;
    }, [selected]);

    const lastBody = (t) => {
        const list = Array.isArray(t.messages) && t.messages.length > 0 ? t.messages : null;
        return list ? list[list.length - 1].body : t.message;
    };
    const lastDate = (t) => {
        const list = Array.isArray(t.messages) && t.messages.length > 0 ? t.messages : null;
        return list ? list[list.length - 1].created_at : t.created_at;
    };

    const fmtFull = (d) => d ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    /* ---------- actions ---------- */
    const markRead = (ids, read) => {
        router.post(route('admin.communication.read'), { ids, read }, { preserveScroll: true, preserveState: true });
    };

    const toggleStar = (t) => {
        router.post(route('admin.communication.star', t.id), {}, { preserveScroll: true, preserveState: true });
    };

    // Sends one request per box (inbox / sent), one after the other.
    const runBatch = (routeName, list) => {
        if (list.length === 0) return;
        const boxes = [...new Set(list.map((r) => r.box))];
        const go = (i) => {
            if (i >= boxes.length) { setSelectedKeys([]); return; }
            const box = boxes[i];
            router.post(
                route(routeName),
                { ids: list.filter((r) => r.box === box).map((r) => r.t.id), box },
                { preserveScroll: true, preserveState: true, onFinish: () => go(i + 1) }
            );
        };
        if (list.some((r) => r.key === selectedKey)) setSelectedKey(null);
        go(0);
    };

    const purgeRows = (list) => {
        if (confirm('Delete forever? This cannot be undone.')) runBatch('admin.communication.purge', list);
    };

    const openRow = (r) => {
        setSelectedKey(r.key);
        if (r.box === 'inbox' && r.t.admin_unread) markRead([r.t.id], true);
    };

    const toggleRowSel = (key) => {
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };
    const toggleAll = () => setSelectedKeys(allSelected ? [] : rows.map((r) => r.key));

    const handleReply = (e) => {
        e.preventDefault();
        replyForm.post(route('admin.communication.reply', selected.id), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset(),
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

    const emptyText = {
        inbox: 'Your inbox is empty. Volunteer messages will appear here.',
        starred: 'No starred messages. Tap the star on a message to keep it here.',
        sent: 'Nothing sent yet. Your replies will appear here.',
        archive: 'No archived messages.',
        trash: 'Trash is empty.',
    };

    const BulkActions = ({ list }) => (
        view === 'trash' ? (
            <>
                <IconBtn label="Restore" onClick={() => runBatch('admin.communication.restore', list)}><RestoreIcon /></IconBtn>
                <IconBtn label="Delete forever" onClick={() => purgeRows(list)}><TrashIcon /></IconBtn>
            </>
        ) : view === 'archive' ? (
            <>
                <IconBtn label="Move to inbox" onClick={() => runBatch('admin.communication.restore', list)}><RestoreIcon /></IconBtn>
                <IconBtn label="Move to trash" onClick={() => runBatch('admin.communication.trash', list)}><TrashIcon /></IconBtn>
            </>
        ) : (
            <>
                <IconBtn label="Archive" onClick={() => runBatch('admin.communication.archive', list)}><ArchiveIcon /></IconBtn>
                <IconBtn label="Move to trash" onClick={() => runBatch('admin.communication.trash', list)}><TrashIcon /></IconBtn>
                {view !== 'sent' && (
                    <>
                        <IconBtn label="Mark as read" onClick={() => { markRead(list.map((r) => r.t.id), true); setSelectedKeys([]); }}><MailOpenIcon /></IconBtn>
                        <IconBtn label="Mark as unread" onClick={() => { markRead(list.map((r) => r.t.id), false); setSelectedKeys([]); }}><MailIcon /></IconBtn>
                    </>
                )}
            </>
        )
    );

    return (
        <AdminShell active="communication" title="Communication">
            <div className={`ac-shell${onAnn ? ' ann' : (selected ? ' pane-open' : '')}`}>

                {/* ============ TOP: folder tabs ============ */}
                <div className="ac-head">
                    <nav className="ac-tabs" aria-label="Folders">
                        {folders.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                className={`ac-tab${view === f.id ? ' on' : ''}`}
                                aria-current={view === f.id ? 'page' : undefined}
                                onClick={() => switchView(f.id)}
                            >
                                {f.icon}
                                <span>{f.label}</span>
                                {!!f.count && <span className="ac-count">{f.count}</span>}
                            </button>
                        ))}
                    </nav>

                    {/* Phone: tabs become a dropdown (gray when closed, red while open) */}
                    <div className="ac-fdrop">
                        <button type="button" className={`ac-fdrop-btn${folderOpen ? ' open' : ''}`} aria-expanded={folderOpen} onClick={() => setFolderOpen((o) => !o)}>
                            <span className="ac-fdrop-cur">
                                {currentFolder.icon}
                                <b>{currentFolder.label}</b>
                                {!!currentFolder.count && <span>{' \u00B7 '}{currentFolder.count}</span>}
                            </span>
                            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={folderOpen ? '#fff' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: folderOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        {folderOpen && (
                            <div className="ac-fdrop-list">
                                {folders.map((f) => (
                                    <button key={f.id} type="button" className={`ac-fdrop-item${view === f.id ? ' on' : ''}`} onClick={() => switchView(f.id)}>
                                        {f.icon}
                                        <span>{f.label}</span>
                                        {!!f.count && <span className="ac-count">{f.count}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ MAILBOX FOLDERS ============ */}
                {!onAnn && (
                    <div className="ac-body">

                        {/* List */}
                        <div className="ac-list-col">
                            <div className="ac-bar">
                                <input
                                    type="checkbox"
                                    aria-label="Select all"
                                    className="ac-check"
                                    checked={allSelected}
                                    ref={(el) => { if (el) el.indeterminate = selectedKeys.length > 0 && !allSelected; }}
                                    onChange={toggleAll}
                                    disabled={rows.length === 0}
                                />
                                {selectedRows.length > 0 ? (
                                    <>
                                        <span className="ac-sel">{selectedRows.length} selected</span>
                                        <BulkActions list={selectedRows} />
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#231a1a' }}>{currentFolder.label}</span>
                                        <span style={{ fontSize: '12px', color: '#9a8585', marginLeft: 'auto' }}>
                                            {rows.length} message{rows.length !== 1 ? 's' : ''}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="ac-rows">
                                {rows.length === 0 ? (
                                    <div className="ac-empty">{emptyText[view]}</div>
                                ) : (
                                    rows.map((r) => {
                                        const t = r.t;
                                        const unread = r.box === 'inbox' && t.admin_unread;
                                        const checked = selectedKeys.includes(r.key);
                                        return (
                                            <div
                                                key={r.key}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => openRow(r)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') openRow(r); }}
                                                className={`ac-row ${unread ? 'unread' : 'read'}${selectedKey === r.key ? ' on' : ''}${checked ? ' sel' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="ac-check"
                                                    aria-label="Select message"
                                                    checked={checked}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => toggleRowSel(r.key)}
                                                />
                                                <button
                                                    type="button"
                                                    className="ac-ibtn"
                                                    aria-label={t.admin_starred_at ? 'Remove star' : 'Add star'}
                                                    onClick={(e) => { e.stopPropagation(); toggleStar(t); }}
                                                >
                                                    <StarIcon filled={!!t.admin_starred_at} />
                                                </button>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="ac-line1">
                                                        <span className="ac-from" style={{ fontWeight: unread ? 800 : 600 }}>{t.user?.name || 'Volunteer'}</span>
                                                        {t.has_admin_reply && <span className="ac-tag ok">Replied</span>}
                                                        <span className="ac-date" style={{ color: unread ? '#CC0000' : '#9a8585', fontWeight: unread ? 700 : 400 }}>
                                                            {fmtDay(lastDate(t))}
                                                        </span>
                                                    </div>
                                                    <div className="ac-subj" style={{ fontWeight: unread ? 700 : 500 }}>{t.subject}</div>
                                                    <div className="ac-prev">{lastBody(t)}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Reading desk */}
                        <div className="ac-pane">
                            {!selected ? (
                                <div className="ac-none">
                                                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b5555' }}>Pick a message to read and reply</div>
                                    <div style={{ fontSize: '12.5px', color: '#9a8585', marginTop: '4px' }}>Unread messages have a red edge.</div>
                                </div>
                            ) : (
                                <>
                                    <div className="ac-ptool">
                                        <button type="button" className="ac-ibtn ac-back" aria-label="Back to list" onClick={() => setSelectedKey(null)}><BackIcon /></button>
                                        <div style={{ flex: 1 }} />
                                        <BulkActions list={[selectedRow]} />
                                        <button type="button" className="ac-ghost" onClick={() => setSelectedKey(null)}>Close</button>
                                    </div>
                                    <div className="ac-desk">
                                        <div className="ac-paper">
                                            <Letterhead />
                                            <h2 className="ac-h2">{selected.subject}</h2>
                                            <div className="ac-count-line">
                                                From {selected.user?.name || 'Volunteer'} &middot; {threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''} in this conversation
                                            </div>

                                            {threadMessages.map((m, i) => {
                                                const isAdmin = m.sender_type === 'admin';
                                                const volName = selected.user?.name || 'Volunteer';
                                                return (
                                                    <article key={i} className={`ac-msg${isAdmin ? ' admin' : ''}`}>
                                                        <dl className="ac-mh">
                                                            <dt>From</dt>
                                                            <dd><strong>{isAdmin ? (m.admin?.name || 'PRC Admin') : volName}</strong>{!isAdmin && selected.user?.email && <span> &lt;{selected.user.email}&gt;</span>}</dd>
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
                                                    Reply to <strong>{selected.user?.name || 'Volunteer'}</strong>
                                                </div>
                                                <textarea
                                                    value={replyForm.data.reply}
                                                    onChange={(e) => replyForm.setData('reply', e.target.value)}
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
                                                    <button type="button" onClick={() => setSelectedKey(null)} className="ac-secondary">Close</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ============ ANNOUNCEMENTS ============ */}
                {onAnn && (
                    <div className="ac-body">

                        {/* Posted list */}
                        <div className="ac-list-col">
                            <div className="ac-bar">
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#231a1a' }}>Posted announcements</span>
                                <span style={{ fontSize: '12px', color: '#9a8585', marginLeft: 'auto' }}>{announcements.length}</span>
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
                                        onChange={(e) => announceForm.setData('title', e.target.value)}
                                        placeholder="Schedule change for Saturday's blood drive"
                                        className="ac-input" />
                                    {announceForm.errors.title && <div className="ac-err">{announceForm.errors.title}</div>}

                                    <label className="ac-label" htmlFor="ann-body" style={{ marginTop: '16px' }}>Message</label>
                                    <textarea id="ann-body" value={announceForm.data.body}
                                        onChange={(e) => announceForm.setData('body', e.target.value)}
                                        placeholder="Write the announcement here."
                                        rows={8}
                                        className="ac-ta" />
                                    {announceForm.errors.body && <div className="ac-err">{announceForm.errors.body}</div>}

                                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <button type="submit" disabled={announceForm.processing} className="ac-primary">
                                            {announceForm.processing ? 'Posting...' : 'Post to all volunteers'}
                                        </button>
                                        <span style={{ fontSize: '12px', color: '#9a8585' }}>Every approved volunteer gets this as a notification and by email.</span>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .ac-shell{background:transparent;border:none;border-radius:0;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 130px);min-height:560px}
                .ac-head{background:transparent;border-bottom:none;padding:0 0 12px;flex-shrink:0}
                .ac-tabs{display:flex;gap:2px;margin-top:0;padding:0;overflow-x:auto;border-bottom:1px solid #e5e5e5}
                .ac-tab{display:flex;align-items:center;gap:7px;border:none;border-bottom:2px solid transparent;background:transparent;border-radius:0;margin-bottom:-1px;padding:8px 14px;font:inherit;font-size:13px;font-weight:500;color:#777;cursor:pointer;white-space:nowrap}
                .ac-tab:hover{color:#222}
                .ac-tab.on{background:transparent;border-bottom-color:#CC0000;color:#222;font-weight:600}.ac-tab.on svg{stroke:#222}
                .ac-count{font-size:11px;font-weight:700;min-width:17px;text-align:center;border-radius:9px;padding:0 6px;background:#eadede;color:#6b5555}
                .ac-tab.on .ac-count{background:#CC0000;color:#fff}

                .ac-body{display:grid;grid-template-columns:minmax(300px,380px) 1fr;flex:1;min-height:0;background:#fff;border:1px solid #e6d9d9;border-radius:12px;overflow:hidden}
                .ac-list-col{display:flex;flex-direction:column;min-height:0;min-width:0;border-right:1px solid #e6d9d9;background:#fff}
                .ac-bar{display:flex;align-items:center;gap:8px;height:46px;padding:0 14px;border-bottom:1px solid #f0e6e6;flex-shrink:0}
                .ac-sel{font-size:13px;font-weight:600;color:#222;margin-right:6px}
                .ac-check{width:15px;height:15px;accent-color:#CC0000;cursor:pointer;flex-shrink:0;margin:0}
                .ac-rows{flex:1;overflow-y:auto}
                .ac-empty{padding:56px 24px;text-align:center;font-size:13px;line-height:1.6;color:#9a8585}
                .ac-row{display:flex;gap:8px;align-items:flex-start;padding:12px 14px;border-bottom:1px solid #f0e6e6;border-left:4px solid transparent;cursor:pointer}
                .ac-row.unread{border-left-color:#CC0000;background:#fffbfb}
                .ac-row.read{background:#fff}
                .ac-row:hover{background:#f8f0f0}
                .ac-row.sel,.ac-row.on{background:#fdeaea}
                .ac-row .ac-check{margin-top:5px}
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
                .ac-ptool{display:flex;align-items:center;gap:2px;padding:6px 12px;background:#fff;border-bottom:1px solid #e6d9d9;flex-shrink:0}
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
                .ac-fdrop{display:none}

                /* clean white look, same as the volunteer Messages page */
                @media (min-width:901px){
                    .ac-shell{position:relative;background:transparent;border:none;border-radius:0;min-height:420px}
                    .ac-shell .ac-head{background:transparent;border-bottom:none;padding:0 0 12px}
                    .ac-shell .ac-tabs{margin-top:0;gap:2px}
                    .ac-shell .ac-tab{padding:8px 14px}
                    .ac-shell .ac-count{background:#f1f1f3;color:#666}
                    .ac-shell .ac-tab.on .ac-count{background:#CC0000;color:#fff}
                    .ac-shell .ac-list-col{background:#fff;border-right:1px solid #ececef}
                    .ac-shell .ac-bar{height:48px;padding:0 16px;border-bottom:1px solid #ececef}
                    .ac-shell .ac-empty{padding:64px 28px;color:#8b8b92}
                    .ac-shell .ac-row{padding:14px 16px;border-bottom:1px solid #f1f1f3}
                    .ac-shell .ac-row.unread{background:#fff}
                    .ac-shell .ac-row.read{background:#fff}
                    .ac-shell .ac-row:hover{background:#fafafa}
                    .ac-shell .ac-row.sel,.ac-shell .ac-row.on{background:#fdf2f2}
                    .ac-shell .ac-from,.ac-shell .ac-subj{color:#18181b}
                    .ac-shell .ac-prev,.ac-shell .ac-clamp{color:#71717a}
                    .ac-shell .ac-pane{background:#fafafa}
                    .ac-shell .ac-ptool{border-bottom:1px solid #ececef}
                    .ac-shell .ac-desk{padding:28px 24px 40px}
                    .ac-shell .ac-paper{box-shadow:none;border:1px solid #ececef;border-radius:10px}
                }

                @media (max-width:860px){
                    .ac-shell{height:calc(100vh - 120px)}
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

                @media (max-width:600px){
                    .ac-shell.pane-open .ac-head{display:none}
                    .ac-head{padding:0 0 12px}
                    .ac-tabs{display:none}
                    .ac-fdrop{display:block;position:relative;margin:0 0 12px;width:fit-content;max-width:100%}
                    .ac-fdrop-btn{width:auto;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e0e0e0;border-radius:10px;padding:11px 14px;font:inherit;font-size:13px;color:#231a1a;cursor:pointer}
                    .ac-fdrop-btn.open{background:#CC0000;border-color:#CC0000;color:#fff}
                    .ac-fdrop-cur{display:flex;align-items:center;gap:8px}
                    .ac-fdrop-list{position:absolute;left:0;min-width:200px;top:calc(100% + 6px);z-index:30;background:#fff;border:1px solid #e6d9d9;border-radius:10px;overflow:hidden;box-shadow:0 8px 20px rgba(60,20,20,.12)}
                    .ac-fdrop-item{width:100%;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border:none;border-top:1px solid #f0e6e6;font:inherit;font-size:13px;color:#231a1a;text-align:left;cursor:pointer}
                    .ac-fdrop-item:first-child{border-top:none}
                    .ac-fdrop-item.on{background:#fdf8f8;font-weight:700;color:#CC0000}
                    .ac-fdrop-item .ac-count{margin-left:auto}
                    .ac-desk{padding:0}
                    .ac-paper{max-width:none;margin:0;padding:6px 14px 24px;border-radius:0;box-shadow:none;border:none}
                    .ac-lh{display:none}
                }
                @media (prefers-reduced-motion:no-preference){
                    .ac-tab,.ac-row{transition:background .12s,color .12s}
                }
            `}</style>
        </AdminShell>
    );
}

/* ---------------- pieces ---------------- */

function IconBtn({ label, onClick, children }) {
    return (
        <button
            type="button"
            className="ac-ibtn"
            title={label}
            aria-label={label}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {children}
        </button>
    );
}

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
                <strong>Philippine Red Cross &ndash; Muntinlupa Chapter</strong>
                Volunteer correspondence
            </div>
        </div>
    );
}

const ico = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

function BackIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" {...ico}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function StarIcon({ filled }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#f4b400' : 'none'} stroke={filled ? '#f4b400' : '#b5b5b5'} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}
function InboxIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}
function SendIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function HistoryIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>
    );
}

function ArchiveIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
}
function TrashIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function RestoreIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>;
}
function MailIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>;
}
function MailOpenIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>;
}
function MegaphoneIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" {...ico}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>;
}