import { useForm, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import VolunteerShell from '../../Components/VolunteerShell';

const ADMIN_EMAIL = 'rizalmuntinlupa@redcross.org.ph';
const ADMIN_NAME = 'PRC Admin';

const lastActivity = (t) => {
    const times = (Array.isArray(t.messages) ? t.messages : []).map((m) => new Date(m.created_at).getTime());
    times.push(new Date(t.replied_at || t.created_at).getTime());
    const valid = times.filter((n) => !Number.isNaN(n));
    return valid.length ? Math.max(...valid) : 0;
};
const sameLocalDay = (ms) => new Date(ms).toDateString() === new Date().toDateString();
// Today = had activity today, or still unread (so nothing important gets buried)
const isTodayThread = (t) => sameLocalDay(lastActivity(t)) || !!t.unread;

export default function VolunteerCommunication({ auth, sentEmails, announcements }) {
    const emails = sentEmails || [];
    const announces = announcements || [];

    const myName = auth?.user?.name || 'You';
    const myEmail = auth?.user?.email || '';

    const [view, setView] = useState('inbox'); // 'inbox' | 'sent' | 'starred' | 'archive' | 'trash' | 'compose'
    const [folderOpen, setFolderOpen] = useState(false);
    const [openEmail, setOpenEmail] = useState(null);
    const [openBox, setOpenBox] = useState('inbox'); // which side of the email is open: 'inbox' | 'sent'
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showAdminOnlyWarning, setShowAdminOnlyWarning] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [annOpen, setAnnOpen] = useState(null); // announcement being read in the popup

    useEffect(() => {
        if (!annOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setAnnOpen(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [annOpen]);

    // live-poll: refresh messages every 5 seconds (only while this tab is visible)
    useEffect(() => {
        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['sentEmails'], preserveScroll: true, preserveState: true });
        };
        const id = setInterval(tick, 5000);
        return () => clearInterval(id);
    }, []);

    // keep the open thread in sync with fresh data
    useEffect(() => {
        setOpenEmail((cur) => {
            if (!cur) return cur;
            return (sentEmails || []).find((e) => e.id === cur.id) || cur;
        });
    }, [sentEmails]);

    const { data, setData, post, processing, reset, errors } = useForm({
        to: ADMIN_EMAIL,
        subject: '',
        message: '',
    });

    const MIXED_VIEWS = ['starred', 'archive', 'trash'];
    const isMixedView = MIXED_VIEWS.includes(view);
    const box = isMixedView ? null : (view === 'sent' ? 'sent' : 'inbox');

    const buildRow = (b, e) => ({
        key: e.id, box: b,
        sender: b === 'sent' ? `To: ${ADMIN_NAME}` : ADMIN_NAME,
        subject: e.subject, preview: b === 'sent' ? e.message : e.reply,
        date: b === 'sent' ? e.created_at : (e.replied_at || e.created_at),
        unread: b === 'inbox' ? !e.read_at : false,
        starred: !!e.starred_at,
        threadCount: e.reply ? 2 : 1,
        badge: b === 'sent' && e.reply ? { text: 'Replied', color: '#166534', bg: '#f0fdf4' } : null,
        raw: e,
    });

    // Inbox: emails with a reply from admin, whose inbox side is still active
    const inboxItems = useMemo(
        () => emails.filter(e => e.reply && e.inbox_status === 'active' && isTodayThread(e)),
        [emails]
    );
    const unreadCount = useMemo(
        () => inboxItems.filter(e => !e.read_at).length,
        [inboxItems]
    );

    // History: older inbox threads that are already read
    const historyItems = useMemo(
        () => emails.filter(e => e.reply && e.inbox_status === 'active' && !isTodayThread(e)),
        [emails]
    );

    // Sent: emails whose sent side is still active
    const sentItems = useMemo(
        () => emails.filter(e => e.sent_status === 'active'),
        [emails]
    );

    // Starred: any email starred on either side, as long as that side isn't trashed/purged
    const starredRows = useMemo(() => {
        const out = [];
        emails.forEach(e => {
            if (!e.starred_at) return;
            if (e.sent_status === 'active' || e.sent_status === 'archived') out.push(buildRow('sent', e));
            if (e.reply && (e.inbox_status === 'active' || e.inbox_status === 'archived')) out.push(buildRow('inbox', e));
        });
        return out.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [emails]);

    // Archive: emails archived on either side
    const archivedRows = useMemo(() => {
        const out = [];
        emails.forEach(e => {
            if (e.sent_status === 'archived') out.push(buildRow('sent', e));
            if (e.reply && e.inbox_status === 'archived') out.push(buildRow('inbox', e));
        });
        return out.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [emails]);

    // Trash: emails trashed on either side
    const trashRows = useMemo(() => {
        const out = [];
        emails.forEach(e => {
            if (e.sent_status === 'trashed') out.push(buildRow('sent', e));
            if (e.reply && e.inbox_status === 'trashed') out.push(buildRow('inbox', e));
        });
        return out.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [emails]);

    const rows = view === 'trash' ? trashRows
        : view === 'archive' ? archivedRows
        : view === 'starred' ? starredRows
        : view === 'sent' ? sentItems.map(e => buildRow('sent', e))
        : view === 'history' ? historyItems.map(e => buildRow('inbox', e))
        : inboxItems.map(e => buildRow('inbox', e));

    /* ---------- server actions ---------- */

    const postAction = (routeName, payload) => {
        router.post(route(routeName), payload, { preserveScroll: true, preserveState: true });
    };

    // groups selected rows by their origin box and fires one request per box,
    // since ids for "inbox side" vs "sent side" of the same email are updated separately
    const byBox = (rowsList) => {
        const groups = {};
        rowsList.forEach(r => { (groups[r.box] ||= []).push(r.key); });
        return groups;
    };

    const setRead = (keys, read) => postAction('volunteer.communication.read', { ids: keys, read });

    const toggleStar = (email) => {
        router.post(route('volunteer.communication.star', email.id), {}, { preserveScroll: true, preserveState: true });
    };

    const archiveRowsAction = (rowsList) => {
        const groups = byBox(rowsList);
        Object.entries(groups).forEach(([b, ids]) => postAction('volunteer.communication.archive', { ids, box: b }));
        setSelectedIds(new Set());
    };

    const trashRowsAction = (rowsList) => {
        const groups = byBox(rowsList);
        Object.entries(groups).forEach(([b, ids]) => postAction('volunteer.communication.trash', { ids, box: b }));
        setSelectedIds(new Set());
    };

    const restoreRows = (rowsList) => {
        const groups = byBox(rowsList);
        Object.entries(groups).forEach(([b, ids]) => postAction('volunteer.communication.restore', { ids, box: b }));
        setSelectedIds(new Set());
    };

    const purgeRows = (rowsList) => {
        const groups = byBox(rowsList);
        Object.entries(groups).forEach(([b, ids]) => postAction('volunteer.communication.purge', { ids, box: b }));
        setSelectedIds(new Set());
    };

    const switchView = (v) => {
        setView(v);
        setOpenEmail(null);
        setReplyBody('');
        setSelectedIds(new Set());
    };

    const openRow = (email, rowBox) => {
        if (rowBox === 'inbox' && !email.read_at) setRead([email.id], true);
        setReplyBody('');
        setOpenBox(rowBox);
        setOpenEmail(email);
    };

    // Keeps the open thread in sync with fresh data from the server —
    // without this, a newly-sent reply saves fine but never appears,
    // because `openEmail` stays pinned to the object it was opened with.
    useEffect(() => {
        if (!openEmail) return;
        const updated = emails.find(e => e.id === openEmail.id);
        if (updated) setOpenEmail(updated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emails]);

    const selectedKeys = rows.filter(r => selectedIds.has(r.key)).map(r => r.key);
    const selectedRows = rows.filter(r => selectedIds.has(r.key));
    const allSelected = rows.length > 0 && selectedKeys.length === rows.length;
    const anySelectedUnread = rows.some(r => selectedIds.has(r.key) && r.unread);

    const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(rows.map(r => r.key)));

    const toggleIn = (setter, key) => setter(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const startCompose = (prefill) => {
        reset();
        if (prefill?.subject) setData('subject', prefill.subject.startsWith('Re:') ? prefill.subject : `Re: ${prefill.subject}`);
        setOpenEmail(null);
        setView('compose');
    };

    const handleSend = (e) => {
        e.preventDefault();

        // Volunteers can only message the PRC admin — if the "To" field was
        // changed to anything else, block the send and show a warning instead.
        if (data.to.trim().toLowerCase() !== ADMIN_EMAIL) {
            setShowAdminOnlyWarning(true);
            return;
        }

        post(route('volunteer.communication.send'), {
            onSuccess: () => { reset(); setView('sent'); },
        });
    };

    // Builds the full back-and-forth for the open thread. Uses the
    // `messages` relation when the backend sent it; falls back to the
    // legacy single message/reply fields so older threads still render.
    const threadMessages = useMemo(() => {
        if (!openEmail) return [];
        if (Array.isArray(openEmail.messages) && openEmail.messages.length > 0) {
            return [...openEmail.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        const list = [{ sender_type: 'volunteer', body: openEmail.message, created_at: openEmail.created_at }];
        if (openEmail.reply) {
            list.push({ sender_type: 'admin', body: openEmail.reply, created_at: openEmail.replied_at || openEmail.created_at });
        }
        return list;
    }, [openEmail]);

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (!replyBody.trim() || !openEmail || sendingReply) return;
        setSendingReply(true);
        router.post(route('volunteer.communication.reply', openEmail.id), { body: replyBody }, {
            preserveScroll: true,
            onSuccess: () => setReplyBody(''),
            onFinish: () => setSendingReply(false),
        });
    };

    const fmtShort = (d) => {
        if (!d) return '';
        const date = new Date(d);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    };
    const fmtFull = (d) => d ? new Date(d).toLocaleString('en-PH', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    }) : '';

    // what bulk / row actions to show, per view
    const viewKind = view === 'trash' ? 'trash' : view === 'archive' ? 'archive' : 'normal';
    const viewTitle = view === 'trash' ? 'Trash' : view === 'archive' ? 'Archive' : view === 'starred' ? 'Starred' : view === 'sent' ? 'Sent' : 'Inbox';

    const paneOpen = view === 'compose' || !!openEmail;
    const openRowRef = openEmail ? [{ key: openEmail.id, box: openBox }] : [];

    const folders = [
        { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, count: unreadCount },
        { id: 'starred', label: 'Starred', icon: <StarIcon filled={false} />, count: starredRows.length },
        { id: 'sent', label: 'Sent', icon: <SentIcon />, count: 0 },
        { id: 'history', label: 'History', icon: <HistoryIcon />, count: 0 },
        { id: 'archive', label: 'Archive', icon: <ArchiveIcon />, count: archivedRows.length },
        { id: 'trash', label: 'Trash', icon: <TrashIcon />, count: trashRows.length },
    ];
    const currentFolder = folders.find(f => f.id === view) || folders[0];

    return (
        <VolunteerShell active="communication" title="Messages" notifications={[]}>

            <div className={`mc-shell${paneOpen ? ' pane-open' : ''}`}>

                {/* ============ TOP: title, compose, folder tabs ============ */}
                <div className="mc-head">
                    <div className="mc-top">
                        <div>
                        </div>
                        <button type="button" className="mc-compose" onClick={() => startCompose()}>
                            <PencilIcon /> <span className="mc-compose-label">Write a message</span>
                        </button>
                    </div>
                    <nav className="mc-tabs" aria-label="Folders">
                        {folders.map(f => (
                            <button
                                key={f.id}
                                type="button"
                                className={`mc-tab${view === f.id ? ' on' : ''}`}
                                aria-current={view === f.id ? 'page' : undefined}
                                onClick={() => switchView(f.id)}
                            >
                                {f.icon}
                                <span>{f.label}</span>
                                {!!f.count && <span className="mc-count">{f.count}</span>}
                            </button>
                        ))}
                    </nav>
                    <div className="mc-fdrop">
                        <button type="button" className="mc-fdrop-btn" aria-expanded={folderOpen} onClick={() => setFolderOpen(o => !o)}>
                            <span className="mc-fdrop-cur">
                                {currentFolder.icon}
                                <b>{currentFolder.label}</b>
                                {!!currentFolder.count && <span>{' \u00B7 '}{currentFolder.count}</span>}
                            </span>
                            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: folderOpen ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        {folderOpen && (
                            <div className="mc-fdrop-list">
                                {folders.map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={`mc-fdrop-item${view === f.id ? ' on' : ''}`}
                                        onClick={() => { switchView(f.id); setFolderOpen(false); }}
                                    >
                                        {f.icon}
                                        <span>{f.label}</span>
                                        {!!f.count && <span className="mc-count">{f.count}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ ANNOUNCEMENTS STRIP ============ */}
                {announces.length > 0 && (
                    <div className="mc-notice">
                        <span className="mc-notice-label">Announcements</span>
                        {announces.slice(0, 5).map((a, i) => (
                            <button key={i} type="button" className="mc-chip" title="Read announcement" onClick={() => setAnnOpen(a)}>{a.title}</button>
                        ))}
                    </div>
                )}

                <div className="mc-body">

                    {/* ============ LIST COLUMN ============ */}
                    <div className="mc-list-col">
                        <div className="mc-bar">
                            <input
                                type="checkbox"
                                aria-label="Select all"
                                checked={allSelected}
                                ref={el => { if (el) el.indeterminate = selectedKeys.length > 0 && !allSelected; }}
                                onChange={toggleAll}
                                disabled={rows.length === 0}
                                style={checkboxStyle}
                            />
                            {selectedKeys.length > 0 ? (
                                viewKind === 'trash' ? (
                                    <>
                                        <span style={selectedLabel}>{selectedKeys.length} selected</span>
                                        <IconBtn label="Restore" onClick={() => restoreRows(selectedRows)}><RestoreIcon /></IconBtn>
                                        <IconBtn label="Delete forever" onClick={() => purgeRows(selectedRows)}><TrashIcon /></IconBtn>
                                    </>
                                ) : viewKind === 'archive' ? (
                                    <>
                                        <span style={selectedLabel}>{selectedKeys.length} selected</span>
                                        <IconBtn label="Restore" onClick={() => restoreRows(selectedRows)}><RestoreIcon /></IconBtn>
                                        <IconBtn label="Delete" onClick={() => trashRowsAction(selectedRows)}><TrashIcon /></IconBtn>
                                    </>
                                ) : (
                                    <>
                                        <span style={selectedLabel}>{selectedKeys.length} selected</span>
                                        <IconBtn label="Archive" onClick={() => archiveRowsAction(selectedRows)}><ArchiveIcon /></IconBtn>
                                        <IconBtn label="Delete" onClick={() => trashRowsAction(selectedRows)}><TrashIcon /></IconBtn>
                                        {box === 'inbox' && (
                                            anySelectedUnread
                                                ? <IconBtn label="Mark as read" onClick={() => setRead(selectedKeys, true)}><MailOpenIcon /></IconBtn>
                                                : <IconBtn label="Mark as unread" onClick={() => setRead(selectedKeys, false)}><MailIcon /></IconBtn>
                                        )}
                                    </>
                                )
                            ) : (
                                <>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#231a1a' }}>{viewTitle}</span>
                                    <span style={{ fontSize: '12px', color: '#9a8585' }}>{rows.length} message{rows.length !== 1 ? 's' : ''}</span>
                                    {view === 'trash' && rows.length > 0 && (
                                        <button type="button" className="mc-link" onClick={() => purgeRows(rows)}>Empty trash</button>
                                    )}
                                </>
                            )}
                        </div>

                        {view === 'trash' && rows.length > 0 && (
                            <div className="mc-hint">Deleted messages stay here until restored or permanently deleted.</div>
                        )}
                        {view === 'archive' && rows.length > 0 && (
                            <div className="mc-hint">Archived messages are hidden from Inbox and Sent until restored.</div>
                        )}

                        <div className="mc-rows">
                            {rows.length === 0 ? (
                                <div className="mc-empty">
                                    {view === 'trash' ? 'Trash is empty.'
                                        : view === 'archive' ? 'No archived messages.'
                                        : view === 'starred' ? 'No starred messages.'
                                        : view === 'sent' ? 'You have not sent any messages yet. Use "Write a message" to contact the admin.'
                                        : 'Your inbox is empty. Replies from the admin will appear here.'}
                                </div>
                            ) : (
                                rows.map(row => {
                                    const selected = selectedIds.has(row.key);
                                    const active = !!openEmail && openEmail.id === row.key && openBox === row.box && view !== 'compose';
                                    return (
                                        <div
                                            key={`${row.box}:${row.key}`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => (viewKind === 'trash' ? null : openRow(row.raw, row.box))}
                                            onKeyDown={e => { if (viewKind !== 'trash' && e.target === e.currentTarget && e.key === 'Enter') openRow(row.raw, row.box); }}
                                            className={`mc-row ${row.unread ? 'unread' : 'read'}${selected ? ' sel' : ''}${active ? ' on' : ''}`}
                                            style={{ cursor: viewKind === 'trash' ? 'default' : 'pointer' }}
                                        >
                                            <input
                                                type="checkbox"
                                                aria-label={`Select "${row.subject}"`}
                                                checked={selected}
                                                onClick={e => e.stopPropagation()}
                                                onChange={() => toggleIn(setSelectedIds, row.key)}
                                                style={{ ...checkboxStyle, marginTop: '3px' }}
                                            />

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="mc-line1">
                                                    <span className="mc-from" style={{ fontWeight: row.unread ? 800 : 600 }}>{row.sender}</span>
                                                    {row.threadCount > 1 && <span className="mc-tc">{row.threadCount}</span>}
                                                    {isMixedView && <span className="mc-tag">{row.box === 'sent' ? 'Sent' : 'Inbox'}</span>}
                                                    {row.badge && (
                                                        <span className="mc-tag" style={{ color: row.badge.color, background: row.badge.bg, borderColor: 'transparent', fontWeight: 700 }}>
                                                            {row.badge.text}
                                                        </span>
                                                    )}
                                                    <span className="mc-right">
                                                        <span className="mc-date" style={{ color: row.unread ? '#CC0000' : '#9a8585', fontWeight: row.unread ? 700 : 400 }}>
                                                            {fmtShort(row.date)}
                                                        </span>
                                                        <span className="mc-actions">
                                                            {viewKind === 'trash' ? (
                                                                <>
                                                                    <IconBtn label="Restore" onClick={() => restoreRows([row])}><RestoreIcon /></IconBtn>
                                                                    <IconBtn label="Delete forever" onClick={() => purgeRows([row])}><TrashIcon /></IconBtn>
                                                                </>
                                                            ) : viewKind === 'archive' ? (
                                                                <>
                                                                    <IconBtn label="Restore" onClick={() => restoreRows([row])}><RestoreIcon /></IconBtn>
                                                                    <IconBtn label="Delete" onClick={() => trashRowsAction([row])}><TrashIcon /></IconBtn>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <IconBtn label="Archive" onClick={() => archiveRowsAction([row])}><ArchiveIcon /></IconBtn>
                                                                    <IconBtn label="Delete" onClick={() => trashRowsAction([row])}><TrashIcon /></IconBtn>
                                                                    {row.box === 'inbox' && (
                                                                        <IconBtn
                                                                            label={row.unread ? 'Mark as read' : 'Mark as unread'}
                                                                            onClick={() => setRead([row.key], row.unread)}
                                                                        >
                                                                            {row.unread ? <MailOpenIcon /> : <MailIcon />}
                                                                        </IconBtn>
                                                                    )}
                                                                </>
                                                            )}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="mc-subj" style={{ fontWeight: row.unread ? 700 : 500 }}>{row.subject}</div>
                                                <div className="mc-prev">{row.preview}</div>
                                            </div>

                                            {viewKind !== 'trash' && (
                                                <button
                                                    type="button"
                                                    className="row-btn"
                                                    aria-label={row.starred ? 'Remove star' : 'Add star'}
                                                    onClick={e => { e.stopPropagation(); toggleStar(row.raw); }}
                                                    style={{ ...iconBtnStyle, width: '24px', height: '24px' }}
                                                >
                                                    <StarIcon filled={row.starred} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ============ READING DESK ============ */}
                    <div className="mc-pane">

                        {view === 'compose' ? (
                            /* ---------- COMPOSE ---------- */
                            <>
                                <div className="mc-ptool">
                                    <span className="mc-back"><IconBtn label="Back to list" onClick={() => switchView('inbox')}><BackIcon /></IconBtn></span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#231a1a', padding: '0 6px' }}>New message</span>
                                    <button type="submit" form="mc-compose-form" className="mc-send-top" disabled={processing}>{processing ? 'Sending...' : 'Send'}</button>
                                </div>
                                <div className="mc-desk">
                                    <form id="mc-compose-form" onSubmit={handleSend} className="mc-paper">
                                        <Letterhead />
                                        <HeaderField label="From">
                                            <span style={{ fontSize: '13px', color: '#6b5555' }}>{myName}{myEmail ? ` <${myEmail}>` : ''}</span>
                                        </HeaderField>
                                        <HeaderField label="To">
                                            <input
                                                type="email"
                                                value={data.to}
                                                onChange={e => setData('to', e.target.value)}
                                                placeholder="recipient@redcross.org.ph"
                                                className="mc-line"
                                            />
                                            {errors.to && <ErrorText text={errors.to} />}
                                        </HeaderField>
                                        <HeaderField label="Subject">
                                            <input
                                                type="text"
                                                value={data.subject}
                                                onChange={e => setData('subject', e.target.value)}
                                                placeholder="What is this about?"
                                                className="mc-line"
                                            />
                                            {errors.subject && <ErrorText text={errors.subject} />}
                                        </HeaderField>

                                        <textarea
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                            placeholder="Write your message here."
                                            rows={13}
                                            aria-label="Message"
                                            className="mc-ta"
                                            style={{ marginTop: '18px' }}
                                        />
                                        {errors.message && <ErrorText text={errors.message} />}

                                        <div className="mc-actions-bottom" style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                            <button type="submit" disabled={processing} style={primaryBtn(processing)}>
                                                {processing ? 'Sending...' : 'Send'}
                                            </button>
                                            <button type="button" onClick={() => switchView('inbox')} style={secondaryBtn}>Discard</button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : openEmail ? (
                            /* ---------- OPEN THREAD ---------- */
                            <>
                                <div className="mc-ptool">
                                    <span className="mc-back"><IconBtn label="Back to list" onClick={() => setOpenEmail(null)}><BackIcon /></IconBtn></span>
                                    <div style={{ flex: 1 }} />
                                    {viewKind === 'archive' ? (
                                        <IconBtn label="Restore" onClick={() => { restoreRows(openRowRef); setOpenEmail(null); }}><RestoreIcon /></IconBtn>
                                    ) : (
                                        <IconBtn label="Archive" onClick={() => { archiveRowsAction(openRowRef); setOpenEmail(null); }}><ArchiveIcon /></IconBtn>
                                    )}
                                    <IconBtn label="Delete" onClick={() => { trashRowsAction(openRowRef); setOpenEmail(null); }}><TrashIcon /></IconBtn>
                                    <IconBtn label={openEmail.starred_at ? 'Remove star' : 'Add star'} onClick={() => toggleStar(openEmail)}>
                                        <StarIcon filled={!!openEmail.starred_at} />
                                    </IconBtn>
                                </div>

                                <div className="mc-desk">
                                    <div className="mc-paper">
                                        <Letterhead />
                                        <h2 className="mc-h2">{openEmail.subject}</h2>
                                        <div className="mc-count-line">
                                            {threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''} in this conversation
                                        </div>

                                        {threadMessages.map((m, i) => {
                                            const fromAdmin = m.sender_type === 'admin';
                                            const fromName = fromAdmin ? (m.admin?.name || ADMIN_NAME) : myName;
                                            const fromAddr = fromAdmin ? ADMIN_EMAIL : myEmail;
                                            const toName = fromAdmin ? myName : ADMIN_NAME;
                                            const toAddr = fromAdmin ? myEmail : ADMIN_EMAIL;
                                            return (
                                                <article key={i} className={`mc-msg${fromAdmin ? ' admin' : ''}`}>
                                                    <dl className="mc-mh">
                                                        <dt>From</dt>
                                                        <dd><strong>{fromName}</strong>{fromAddr && <span> &lt;{fromAddr}&gt;</span>}</dd>
                                                        <dt>To</dt>
                                                        <dd>{toName}{toAddr ? ` <${toAddr}>` : ''}</dd>
                                                        <dt>Sent</dt>
                                                        <dd>{fmtFull(m.created_at)}</dd>
                                                    </dl>
                                                    <div className="mc-text">{m.body}</div>
                                                </article>
                                            );
                                        })}

                                        {/* Reply slip */}
                                        <form onSubmit={handleReplySubmit} className="mc-reply">
                                            <div style={{ fontSize: '12.5px', color: '#6b5555', marginBottom: '8px' }}>
                                                Reply to <strong>{ADMIN_NAME}</strong> &lt;{ADMIN_EMAIL}&gt;
                                            </div>
                                            <textarea
                                                value={replyBody}
                                                onChange={e => setReplyBody(e.target.value)}
                                                placeholder="Write your reply here."
                                                rows={5}
                                                aria-label="Reply"
                                                className="mc-ta"
                                            />
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button
                                                    type="submit"
                                                    disabled={!replyBody.trim() || sendingReply}
                                                    style={primaryBtn(!replyBody.trim() || sendingReply)}
                                                >{sendingReply ? 'Sending...' : 'Send reply'}</button>
                                                {replyBody && (
                                                    <button type="button" onClick={() => setReplyBody('')} style={secondaryBtn}>Discard</button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* ---------- NOTHING OPEN ---------- */
                            <div className="mc-none">
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b5555', marginTop: '12px' }}>Pick a message to read it here</div>
                                <div style={{ fontSize: '12.5px', color: '#9a8585', marginTop: '4px' }}>Or write a new message to the admin.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ADMIN-ONLY WARNING MODAL */}
            {showAdminOnlyWarning && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div role="alertdialog" aria-modal="true" style={{
                        background: 'white', borderRadius: '8px', padding: '26px 26px 20px',
                        maxWidth: '400px', width: '90%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>
                            Messages can only go to the admin
                        </div>
                        <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: '0 0 20px' }}>
                            You can only send messages to the Philippine Red Cross – Muntinlupa
                            admin ({ADMIN_EMAIL}). Check that the "To" field has not been changed.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setData('to', ADMIN_EMAIL);
                                    setShowAdminOnlyWarning(false);
                                }}
                                style={primaryBtn(false)}
                            >Correct the address</button>
                            <button type="button" onClick={() => setShowAdminOnlyWarning(false)} style={secondaryBtn}>Keep editing</button>
                        </div>
                    </div>
                </div>
            )}

            {annOpen && (
                <div className="mc-modal-bg" onClick={() => setAnnOpen(null)}>
                    <div className="mc-modal" role="dialog" aria-modal="true" aria-label={annOpen.title} onClick={(e) => e.stopPropagation()}>
                        <div className="mc-modal-head">
                            <span className="mc-modal-kicker">Announcement</span>
                            <button type="button" className="mc-modal-x" aria-label="Close" onClick={() => setAnnOpen(null)}>&times;</button>
                        </div>
                        <div className="mc-modal-body">
                            <h3 className="mc-modal-title">{annOpen.title}</h3>
                            <div className="mc-modal-date">
                                {annOpen.created_at ? new Date(annOpen.created_at).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                            </div>
                            <div className="mc-modal-text">{annOpen.body}</div>
                        </div>
                        <div className="mc-modal-foot">
                            <button type="button" className="mc-modal-close" onClick={() => setAnnOpen(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .mc-chip{font:inherit;font-size:12px;cursor:pointer}
                .mc-chip:hover{border-color:#CC0000;color:#CC0000}
                .mc-chip:focus-visible{outline:2px solid #CC0000;outline-offset:2px}
                .mc-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
                .mc-modal{background:#fff;border-radius:14px;width:100%;max-width:520px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden}
                .mc-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f0f0}
                .mc-modal-kicker{font-size:11px;font-weight:700;color:#CC0000;letter-spacing:.6px;text-transform:uppercase}
                .mc-modal-x{background:none;border:none;font-size:22px;line-height:1;color:#999;cursor:pointer}
                .mc-modal-body{padding:18px;overflow-y:auto}
                .mc-modal-title{margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.25;color:#231a1a}
                .mc-modal-date{font-size:12px;color:#9a8585;margin-bottom:14px}
                .mc-modal-text{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#231a1a;white-space:pre-wrap;word-break:break-word}
                .mc-modal-foot{padding:12px 18px;border-top:1px solid #f0f0f0;text-align:right}
                .mc-modal-close{background:#fff;color:#555;border:1px solid #d9d9d9;border-radius:6px;padding:8px 18px;font:inherit;font-size:13px;font-weight:500;cursor:pointer}
            `}</style>

            <style>{`
                .mc-shell{background:#fff;border:1px solid #e6d9d9;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 150px);min-height:620px}

                /* top band */
                .mc-head{background:#fdf8f8;border-bottom:1px solid #e6d9d9;padding:16px 20px 0;flex-shrink:0}
                .mc-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
                .mc-top > div{flex:1;min-width:180px}
                .mc-title{font-size:20px;font-weight:800;color:#231a1a;letter-spacing:-.2px}
                .mc-sub{font-size:12.5px;color:#8a7474;margin-top:2px}
                .mc-compose{display:flex;align-items:center;gap:8px;background:#CC0000;color:#fff;border:none;border-radius:6px;padding:10px 18px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
                .mc-compose:hover{background:#a80000}
                .mc-tabs{display:flex;gap:2px;margin-top:12px;overflow-x:auto}
                .mc-tab{display:flex;align-items:center;gap:7px;border:none;background:none;padding:10px 14px;font:inherit;font-size:13px;font-weight:500;color:#5b4a4a;cursor:pointer;border-bottom:3px solid transparent;white-space:nowrap}
                .mc-tab:hover{color:#CC0000}
                .mc-tab.on{color:#CC0000;font-weight:700;border-bottom-color:#CC0000}
                .mc-count{font-size:11px;font-weight:700;min-width:17px;text-align:center;border-radius:9px;padding:0 6px;background:#eadede;color:#6b5555}
                .mc-tab.on .mc-count{background:#CC0000;color:#fff}

                /* announcements */
                .mc-notice{display:flex;align-items:center;gap:8px;padding:8px 20px;background:#fff8e6;border-bottom:1px solid #f0e2b6;overflow-x:auto;flex-shrink:0}
                .mc-notice-label{font-size:12px;font-weight:700;color:#8a5a00;flex-shrink:0}
                .mc-chip{font-size:12px;color:#5b4a12;background:#fff;border:1px solid #efdca0;border-radius:999px;padding:2px 12px;white-space:nowrap;flex-shrink:0}

                /* two panes */
                .mc-body{display:grid;grid-template-columns:minmax(300px,380px) 1fr;flex:1;min-height:0}
                .mc-list-col{display:flex;flex-direction:column;min-height:0;min-width:0;border-right:1px solid #e6d9d9;background:#fff}
                .mc-bar{display:flex;align-items:center;gap:8px;height:46px;padding:0 14px;border-bottom:1px solid #f0e6e6;flex-shrink:0}
                .mc-link{margin-left:auto;background:none;border:none;cursor:pointer;font:inherit;font-size:12px;font-weight:700;color:#CC0000}
                .mc-hint{padding:8px 14px;font-size:11.5px;color:#8a7474;background:#fbf7f7;border-bottom:1px solid #f0e6e6}
/* mc-clean-white */
@media (min-width: 901px) {
.mc-shell{position:relative;background:#fff;border:1px solid #e4e4e7;border-radius:12px;height:calc(100vh - 100px);min-height:420px}
.mc-shell .mc-head{background:#fff;border-bottom:1px solid #e4e4e7;padding:0 20px}
.mc-shell .mc-top{display:block;height:0;min-height:0;margin:0;padding:0;gap:0}
.mc-shell .mc-top > div{display:none}
.mc-shell .mc-compose{position:absolute;right:20px;bottom:20px;left:auto;top:auto;margin:0;z-index:20;border-radius:999px;padding:11px 20px;box-shadow:none}
.mc-shell .mc-tabs{margin-top:0;gap:8px}
.mc-shell .mc-tab{padding:14px 8px}
.mc-shell .mc-count{background:#f1f1f3;color:#666}
.mc-shell .mc-tab.on .mc-count{background:#CC0000;color:#fff}
.mc-shell .mc-list-col{background:#fff;border-right:1px solid #ececef}
.mc-shell .mc-bar{height:48px;padding:0 16px;border-bottom:1px solid #ececef}
.mc-shell .mc-hint{background:#fafafa;border-bottom:1px solid #ececef}
.mc-shell .mc-rows{padding-bottom:72px}
.mc-shell .mc-empty{padding:64px 28px;color:#8b8b92}
.mc-shell .mc-row{padding:14px 16px;border-bottom:1px solid #f1f1f3}
.mc-shell .mc-row.unread{background:#fff}
.mc-shell .mc-row.read{background:#fff}
.mc-shell .mc-row:hover{background:#fafafa}
.mc-shell .mc-row.sel,.mc-shell .mc-row.on{background:#fdf2f2}
.mc-shell .mc-from,.mc-shell .mc-subj{color:#18181b}
.mc-shell .mc-prev{color:#71717a}
.mc-shell .mc-tc,.mc-shell .mc-date{color:#a1a1aa}
.mc-shell .mc-pane{background:#fafafa}
.mc-shell .mc-ptool{border-bottom:1px solid #ececef}
.mc-shell .mc-desk{padding:28px 24px 96px}
.mc-shell .mc-paper{box-shadow:none;border:1px solid #ececef;border-radius:10px}
}
                .mc-rows{flex:1;overflow-y:auto}
                .mc-empty{padding:56px 24px;text-align:center;font-size:13px;line-height:1.6;color:#9a8585}

                .mc-row{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-bottom:1px solid #f0e6e6;border-left:4px solid transparent}
                .mc-row.unread{border-left-color:#CC0000;background:#fffbfb}
                .mc-row.read{background:#fff}
                .mc-row:hover{background:#f8f0f0}
                .mc-row.sel,.mc-row.on{background:#fdeaea}
                .mc-line1{display:flex;align-items:center;gap:6px;min-height:24px}
                .mc-from{font-size:13px;color:#231a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
                .mc-tc{font-size:11px;color:#9a8585;flex-shrink:0}
                .mc-tag{font-size:10.5px;color:#6b5555;border:1px solid #e6d9d9;border-radius:4px;padding:0 6px;flex-shrink:0}
                .mc-right{margin-left:auto;display:flex;align-items:center;flex-shrink:0}
                .mc-date{font-size:11.5px}
                .mc-actions{display:none;align-items:center;gap:2px}
                .mc-row:hover .mc-actions,.mc-row:focus-within .mc-actions{display:flex}
                .mc-row:hover .mc-date,.mc-row:focus-within .mc-date{display:none}
                .mc-subj{font-size:13px;color:#231a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .mc-prev{font-size:12.5px;color:#8f7f7f;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .row-btn:hover{background:#eadede !important}
                .row-btn:focus-visible,.mc-row:focus-visible,.mc-tab:focus-visible,.mc-compose:focus-visible{outline:2px solid #CC0000;outline-offset:-2px}

                /* reading desk */
                .mc-pane{display:flex;flex-direction:column;min-width:0;min-height:0;background:#f2ecec}
                .mc-ptool{display:flex;align-items:center;gap:2px;padding:6px 12px;background:#fff;border-bottom:1px solid #e6d9d9;flex-shrink:0}
                .mc-back{display:none}
                .mc-desk{flex:1;overflow-y:auto;padding:24px 20px 40px}
                .mc-paper{max-width:720px;margin:0 auto;background:#fff;border-radius:3px;padding:30px 40px 32px;box-shadow:0 1px 2px rgba(60,20,20,.14),0 10px 26px rgba(60,20,20,.08)}
                .mc-lh{display:flex;align-items:center;gap:10px;padding-bottom:14px;margin-bottom:20px;border-bottom:2px solid #CC0000;font-size:12px;line-height:1.4;color:#6b5555}
                .mc-lh strong{display:block;color:#231a1a;font-size:13px}
                .mc-h2{font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:700;color:#231a1a;margin:0 0 6px}
                .mc-count-line{font-size:12px;color:#9a8585;margin-bottom:8px}
                .mc-msg{padding:18px 0;border-top:1px dashed #d9c7c7}
                .mc-msg.admin{box-shadow:inset 3px 0 0 #CC0000;padding-left:16px}
                .mc-mh{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;margin:0 0 14px;font-size:12.5px;color:#6b5555}
                .mc-mh dt{color:#9a8585}
                .mc-mh dd{margin:0;min-width:0;word-break:break-word}
                .mc-mh strong{color:#231a1a}
                .mc-text{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:#231a1a;white-space:pre-wrap;word-break:break-word;max-width:66ch}
                .mc-reply{margin-top:6px;padding-top:18px;border-top:2px dashed #d9c7c7}
                .mc-ta{display:block;width:100%;box-sizing:border-box;border:1px solid #e0d2d2;border-radius:6px;padding:12px 14px;font:15px/1.7 Georgia,'Times New Roman',serif;color:#231a1a;resize:vertical;outline:none}
                .mc-ta:focus{border-color:#CC0000;box-shadow:0 0 0 3px rgba(204,0,0,.10)}
                .mc-line{width:100%;border:none;outline:none;padding:2px 0;font:inherit;font-size:13.5px;color:#231a1a;background:transparent}
                .mc-none{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}

                @media (max-width:860px){
                    .mc-shell{height:calc(100vh - 120px)}
                    .mc-body{grid-template-columns:1fr}
                    .mc-shell.pane-open .mc-list-col{display:none}
                    .mc-shell:not(.pane-open) .mc-pane{display:none}
                    .mc-back{display:flex}
                    .mc-desk{padding:14px 10px 28px}
                    .mc-paper{padding:20px 16px 24px}
                    .mc-h2{font-size:20px}
                }
                .mc-send-top{display:none}
                @media (max-width:600px){
                    .mc-shell.pane-open .mc-head,.mc-shell.pane-open .mc-notice{display:none}
                    .mc-head{padding:12px 12px 0}
                    .mc-sub{display:none}
                    .mc-title{font-size:18px}
                    .mc-top > div{min-width:0}
                    .mc-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;overflow:visible;margin-top:8px}
                    .mc-tab{position:relative;flex-direction:column;justify-content:center;gap:3px;padding:8px 0 7px;font-size:10.5px}
                    .mc-count{position:absolute;top:1px;right:4px;min-width:15px;padding:0 4px;font-size:10px}
                    .mc-compose{position:fixed;right:16px;bottom:18px;z-index:40;height:46px;padding:0 18px;border-radius:999px;justify-content:center;box-shadow:0 4px 14px rgba(204,0,0,.35)}
                    .mc-compose-label{font-size:13px;white-space:nowrap}
                    .mc-rows{padding-bottom:72px}
                    .mc-desk{padding:0}
                    .mc-paper{max-width:none;margin:0;padding:6px 14px 24px;border-radius:0;box-shadow:none}
                    .mc-lh{display:none}
                    .mc-hf-label{width:52px}
                    .mc-ta{margin-top:12px !important;min-height:45vh}
                    .mc-actions-bottom{display:none !important}
                    .mc-send-top{display:block;margin-left:auto;background:#CC0000;color:#fff;border:none;border-radius:6px;padding:7px 16px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
                    .mc-send-top:disabled{opacity:.6}
                }
                .mc-fdrop{display:none}
                @media (max-width:600px){
                    .mc-tabs{display:none}
                    .mc-fdrop{display:block;position:relative;margin:10px 0 12px;width:fit-content;max-width:100%}
                    .mc-fdrop-btn{width:auto;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e0e0e0;border-radius:10px;padding:11px 14px;font:inherit;font-size:13px;color:#231a1a;cursor:pointer}
                    .mc-fdrop-cur{display:flex;align-items:center;gap:8px}
                    .mc-fdrop-list{position:absolute;left:0;min-width:180px;top:calc(100% + 6px);z-index:30;background:#fff;border:1px solid #e6d9d9;border-radius:10px;overflow:hidden;box-shadow:0 8px 20px rgba(60,20,20,.12)}
                    .mc-fdrop-item{width:100%;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border:none;border-top:1px solid #f0e6e6;font:inherit;font-size:13px;color:#231a1a;text-align:left;cursor:pointer}
                    .mc-fdrop-item:first-child{border-top:none}
                    .mc-fdrop-item.on{background:#fdf8f8;font-weight:700;color:#CC0000}
                    .mc-fdrop-item .mc-count{position:static;margin-left:auto}
                }
                @media (prefers-reduced-motion:no-preference){
                    .mc-tab,.mc-row{transition:background .12s,color .12s}
                }
            `}</style>

        </VolunteerShell>
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

// Letterhead shown at the top of every open thread and new message
function Letterhead() {
    return (
        <div className="mc-lh">
            <CrossMark />
            <div>
                <strong>Philippine Red Cross – Muntinlupa Chapter</strong>
                Volunteer correspondence
            </div>
        </div>
    );
}

function IconBtn({ label, onClick, children }) {
    return (
        <button
            type="button"
            className="row-btn"
            title={label}
            aria-label={label}
            onClick={e => { e.stopPropagation(); onClick(); }}
            style={iconBtnStyle}
        >
            {children}
        </button>
    );
}

// One header line of an email: label on the left, value on the right, hairline underneath
function HeaderField({ label, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #efe6e6' }}>
            <label style={{ width: '58px', flexShrink: 0, fontSize: '13px', color: '#9a8585', paddingTop: '2px' }}>{label}</label>
            <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
    );
}
function ErrorText({ text }) { return <div style={{ fontSize: '12px', color: '#CC0000', marginTop: '4px' }}>{text}</div>; }

const primaryBtn = (disabled) => ({
    background: '#CC0000', color: 'white', border: 'none', borderRadius: '6px',
    padding: '9px 22px', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
});

const secondaryBtn = {
    background: 'white', color: '#555', border: '1px solid #d9d9d9', borderRadius: '6px',
    padding: '9px 18px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
};

const selectedLabel = { fontSize: '13px', fontWeight: '600', color: '#222', marginRight: '6px' };

const checkboxStyle = { width: '15px', height: '15px', accentColor: '#CC0000', cursor: 'pointer', flexShrink: 0, margin: 0 };

const iconBtnStyle = {
    background: 'transparent', border: 'none', borderRadius: '50%', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666',
    cursor: 'pointer', padding: 0, flexShrink: 0,
};

/* ---------------- icons ---------------- */

function StarIcon({ filled }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#f4b400' : 'none'} stroke={filled ? '#f4b400' : '#b5b5b5'} strokeWidth="2" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}
function HistoryIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>
    );
}

function ArchiveIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
}
function TrashIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function RestoreIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>;
}
function MailIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>;
}
function MailOpenIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>;
}
function PencilIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
}
function InboxIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}
function SentIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function BackIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
