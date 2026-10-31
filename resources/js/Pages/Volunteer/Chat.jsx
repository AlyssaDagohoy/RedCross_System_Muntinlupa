import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import VolunteerShell from '../../Components/VolunteerShell';

const ADMIN_EMAIL = 'rizalmuntinlupa@redcross.org.ph';

const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short' });
const dayKey = (d) => new Date(d).toDateString();
const initials = (n) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const IC = {
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
    back: 'M15 18l-6-6 6-6',
    archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
    restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
    pin: 'M12 17v5M9 3h6l-1 7 3 3H7l3-3z',
};
const Ic = ({ n, s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[n]} /></svg>
);

const CSS = `
.ch-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.ch-tab{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1px solid #e5e5e5;background:#fff;color:#555;font-size:12.5px;font-weight:500;cursor:pointer;font-family:inherit}
.ch-tab.on{background:#CC0000;border-color:#CC0000;color:#fff}
.ch-n{background:#CC0000;color:#fff;border-radius:10px;font-size:10.5px;min-width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}
.ch-tab.on .ch-n{background:#fff;color:#CC0000}
.ch-wrap{display:grid;grid-template-columns:320px minmax(0,1fr);grid-template-rows:minmax(0,1fr);background:#fff;border:1px solid #ebebeb;border-radius:14px;overflow:hidden;height:calc(100vh - 260px);min-height:440px}
.ch-list{border-right:1px solid #ebebeb;overflow-y:auto;min-width:0}
.ch-chat{display:flex;flex-direction:column;min-width:0;min-height:0}
.ch-search{display:flex;align-items:center;gap:8px;margin:10px 12px;padding:7px 12px;border-radius:999px;background:#f3f3f4;color:#888}
.ch-search input{border:none;background:transparent;outline:none;font-size:12.5px;flex:1;font-family:inherit;min-width:0}
.ch-sec{padding:8px 14px 4px;font-size:11px;color:#999}
.ch-row{display:flex;gap:10px;align-items:center;padding:10px 14px;cursor:pointer;border:none;background:transparent;width:100%;text-align:left;font-family:inherit}
.ch-row:hover{background:#f7f7f8}
.ch-row.on{background:#fdf1f1}
.ch-av{width:36px;height:36px;border-radius:50%;background:#fbeaea;color:#CC0000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none}
.ch-av.pv{background:#e6f1fb;color:#0c447c}
.ch-rt{min-width:0;flex:1}
.ch-rn{font-size:13px;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-rp{font-size:12px;color:#777;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-row.unread .ch-rn,.ch-row.unread .ch-rp{font-weight:600;color:#111}
.ch-rm{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11px;color:#999}
.ch-dot{width:8px;height:8px;border-radius:50%;background:#CC0000}
.ch-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #ebebeb;flex-shrink:0}
.ch-note{padding:6px 14px;font-size:12px;color:#777;background:#fafafa;border-bottom:1px solid #ebebeb;flex-shrink:0}
.ch-back{display:none}
.ch-ib{border:none;background:transparent;color:#666;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.ch-ib:hover{background:#f3f3f4}
.ch-scroll{flex:1;min-height:0;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;background:#fff}
.ch-day{text-align:center;margin:6px 0}
.ch-day span{font-size:11px;color:#888;background:#f3f3f4;padding:3px 10px;border-radius:999px}
.ch-msg{max-width:78%;display:flex;flex-direction:column}
.ch-msg.me{align-self:flex-end;align-items:flex-end}
.ch-msg.them{align-self:flex-start;align-items:flex-start}
.ch-who{font-size:11px;color:#777;margin:0 6px 2px}
.ch-bub{padding:8px 13px;border-radius:16px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.me .ch-bub{background:#CC0000;color:#fff;border-bottom-right-radius:4px}
.them .ch-bub{background:#f1f1f2;color:#222;border-bottom-left-radius:4px}
.ch-time{font-size:10.5px;color:#999;margin:2px 6px 0}
.ch-more{align-self:center;border:1px solid #e5e5e5;background:#fff;color:#555;border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:inherit}
.ch-comp{display:flex;gap:8px;align-items:flex-end;padding:10px 14px;border-top:1px solid #ebebeb;background:#fff;flex-shrink:0}
.ch-comp textarea{flex:1;resize:none;border:1px solid #e5e5e5;border-radius:18px;padding:9px 14px;font-size:13.5px;font-family:inherit;outline:none;background:#fafafa;max-height:110px}
.ch-comp textarea:focus{border-color:#CC0000}
.ch-clip{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;cursor:pointer;color:#777;flex-shrink:0}
.ch-clip:hover{background:#f1f1f2;color:#CC0000}
.ch-file{display:flex;align-items:center;gap:10px;padding:6px 14px;border-top:1px solid #ebebeb;font-size:12px;color:#555;background:#fafafa;flex-shrink:0}
.ch-file span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-file button{border:none;background:none;color:#CC0000;cursor:pointer;font-size:12px}
.ch-att{margin-top:4px}
.ch-att img{display:block;max-width:220px;max-height:220px;border-radius:12px}
.ch-att video{display:block;max-width:240px;max-height:260px;border-radius:12px;background:#000}
.ch-att .ch-doc{display:inline-block;padding:8px 13px;border-radius:12px;background:#f1f1f2;color:#222;font-size:13px;text-decoration:underline;word-break:break-all}
.ch-send{width:38px;height:38px;border-radius:50%;border:none;background:#CC0000;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.ch-empty{margin:auto;text-align:center;color:#888;font-size:13px;padding:24px}
.ch-card{margin:10px 14px;padding:12px 14px;border:1px solid #ebebeb;border-radius:12px;text-align:left}
@media (max-width:760px){.ch-wrap{grid-template-columns:1fr}.hide-m{display:none!important}.ch-back{display:inline-flex}}
`;

const threadMessages = (t) => {
    if (Array.isArray(t.messages) && t.messages.length > 0) return t.messages.map((m) => ({ ...m, threadId: t.id }));
    const list = [{ sender_type: 'volunteer', body: t.message, created_at: t.created_at, threadId: t.id }];
    if (t.reply) list.push({ sender_type: 'admin', body: t.reply, created_at: t.replied_at || t.created_at, threadId: t.id });
    return list;
};
const hasReplyOf = (t) => !!t.reply || (Array.isArray(t.messages) && t.messages.some((m) => m.sender_type === 'admin'));
const stOf = (t) => (hasReplyOf(t) ? t.inbox_status : t.sent_status) || 'active';
const TABS = [['inbox', 'Inbox'], ['pinned', 'Pinned'], ['history', 'History'], ['archive', 'Archive'], ['trash', 'Trash']];
const opts = { preserveScroll: true, preserveState: true };

export default function VolunteerChat({ auth, sentEmails, announcements, staff, groupChat = {} }) {
    const [tab, setTab] = useState('inbox');
    const [selectedId, setSelectedId] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [openAnn, setOpenAnn] = useState(null);
    const [text, setText] = useState('');
    const [q, setQ] = useState(''); const [draftKey, setDraftKey] = useState(null);
    const [sending, setSending] = useState(false);
    const [file, setFile] = useState(null);
    const scrollRef = useRef(null);
    const markedRef = useRef('');
    const today = new Date().toDateString();

    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['sentEmails', 'groupChat'], preserveScroll: true, preserveState: true });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const chatsBase = useMemo(() => {
        const map = {};
        (sentEmails || []).forEach((t) => {
            const st = stOf(t);
            if (st === 'purged') return;
            const key = t.chat_key || ''; if (!key) return;
            const id = key + '|' + st;
            (map[id] ||= { id, key, status: st, threads: [] }).threads.push(t);
        });
        if (!map['|active']) map['|active'] = { id: '|active', key: '', status: 'active', threads: [] }; if (draftKey) { const did = draftKey + '|active'; if (!map[did]) map[did] = { id: did, key: draftKey, status: 'active', threads: [] }; }
        return Object.values(map).map((c) => {
            const msgs = c.threads.flatMap(threadMessages).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return { ...c, msgs, unread: c.threads.some((t) => t.unread), pinned: c.threads.some((t) => !!t.starred_at), last: msgs[msgs.length - 1] };
        });
    }, [sentEmails, draftKey]);

    // Shared group chat: one chat for everybody (messages come from groupChat.messages)
    const gcAll = useMemo(() => (groupChat?.messages || []).map((m) => ({ ...m, threadId: 'g' })), [groupChat]);
    const gcMine = (m) => m.sender_type === 'volunteer' && m.user_id === auth?.user?.id;
    const gcReadAt = groupChat?.readAt ? new Date(groupChat.readAt).getTime() : 0;
    const gcUnread = gcAll.some((m) => !gcMine(m) && dayKey(m.created_at) === today && new Date(m.created_at).getTime() > gcReadAt);
    const chats = useMemo(() => chatsBase.map((c) => (c.key ? c : { ...c, msgs: gcAll, unread: gcUnread, pinned: false, last: gcAll[gcAll.length - 1] })), [chatsBase, gcAll, gcUnread]);
    const nameOf = (c) => (c.key ? 'Admin ' + c.key : (groupChat?.name || 'Group chat'));
    const rowName = (c) => nameOf(c) + (c.day && c.last ? ' \u00b7 ' + fmtDay(c.last.created_at) : '');
    // Group chat: one read-only row per earlier day, shown in History
    const gcDayRows = useMemo(() => {
        const g = chats.find((c) => c.id === '|active');
        if (!g) return [];
        const byDay = {};
        g.msgs.forEach((m) => { const dk = dayKey(m.created_at); if (dk !== today) (byDay[dk] ||= []).push(m); });
        return Object.keys(byDay).map((dk) => ({ id: '|day|' + dk, key: '', status: 'active', day: dk, threads: [], msgs: byDay[dk], unread: false, pinned: false, last: byDay[dk][byDay[dk].length - 1] }));
    }, [chats, today]);
    const isToday = (c) => !!c.last && dayKey(c.last.created_at) === today;
    const inInbox = (c) => c.status === 'active' && (!c.key || isToday(c) || c.unread || c.threads.length === 0);
    const match = (c) => {
        const s = q.trim().toLowerCase();
        return !s || nameOf(c).toLowerCase().includes(s) || (c.last?.body || '').toLowerCase().includes(s);
    };
    const newest = (a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0);
    const list = [...chats, ...(tab === 'history' ? gcDayRows : [])].filter((c) => {
        if (!match(c)) return false;
        if (tab === 'pinned') return c.status === 'active' && c.pinned;
        if (tab === 'inbox') return inInbox(c);
        if (tab === 'history') return c.status === 'active' && (!!c.day || !inInbox(c));
        return c.status === (tab === 'archive' ? 'archived' : 'trashed');
    }).sort(newest);
    const groupRows = list.filter((c) => !c.key);
    const privateRows = list.filter((c) => c.key); const sq = q.trim().toLowerCase(); const suggest = tab === 'inbox' && sq ? (staff || []).filter((s) => ('admin ' + s).toLowerCase().includes(sq) && !chats.some((c) => c.id === s + '|active')) : [];
    const inboxUnread = chats.filter((c) => inInbox(c) && c.unread).length;
    const emptyText = tab === 'pinned' ? 'No pinned chats. Tap the pin on a chat to keep it here.' : tab === 'archive' ? 'Nothing archived.' : tab === 'trash' ? 'Trash is empty.' : tab === 'history' ? 'No earlier chats.' : 'No matches.';

    const sel = [...chats, ...gcDayRows].find((c) => c.id === selectedId) || null;
    const todayMsgs = sel ? sel.msgs.filter((m) => dayKey(m.created_at) === today) : [];
    const showAll = !sel || expanded || (todayMsgs.length === 0 && !!sel.key) || tab !== 'inbox';
    const shown = sel ? (showAll ? sel.msgs : todayMsgs) : [];
    const earlier = sel ? sel.msgs.length - todayMsgs.length : 0;

    const gcMarked = useRef('');
    useEffect(() => {
        if (!sel || sel.key || sel.day || !gcUnread) return;
        const k = String(gcAll[gcAll.length - 1]?.id || '');
        if (gcMarked.current === k) return;
        gcMarked.current = k;
        router.post(route('groupchat.read'), {}, opts);
    }, [sel?.id, gcUnread, gcAll.length]);
    useEffect(() => { setExpanded(false); setText(''); setFile(null); }, [selectedId]); useEffect(() => { if (draftKey && (sentEmails || []).some((t) => t.chat_key === draftKey && stOf(t) === 'active')) setDraftKey(null); }, [sentEmails, draftKey]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [sel?.id, shown.length]);

    useEffect(() => {
        if (!sel || !sel.unread) return;
        const key = sel.id + ':' + (sel.last?.created_at || '');
        if (markedRef.current === key) return;
        markedRef.current = key;
        const ids = sel.threads.filter((t) => t.unread).map((t) => t.id);
        if (ids.length) router.post(route('volunteer.communication.read'), { ids, read: true }, opts);
    }, [sel?.id, sel?.unread, sel?.last?.created_at]);

    const move = (name, ts) => {
        const ids = ts.map((t) => t.id);
        if (!ids.length) return;
        router.post(route('volunteer.communication.' + name), { ids, box: 'inbox' }, { ...opts, onSuccess: () => router.post(route('volunteer.communication.' + name), { ids, box: 'sent' }, opts) });
    };
    const leave = (name, c) => { move(name, c.threads); setSelectedId(null); };
    const seqPost = (urls) => { if (!urls.length) return; const [u, ...rest] = urls; router.post(u, {}, { ...opts, onFinish: () => seqPost(rest) }); };
    const togglePin = (c) => seqPost(c.threads.filter((t) => !!t.starred_at === c.pinned).map((t) => route('volunteer.communication.star', t.id))); const startWith = (s) => { setDraftKey(s); setSelectedId(s + '|active'); setQ(''); };

    const send = () => {
        const body = text.trim();
        if ((!body && !file) || !sel || sending) return;
        setSending(true);
        const latest = [...sel.threads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const o = { ...opts, onSuccess: () => { setText(''); setFile(null); }, onError: (e) => { console.error(e); window.alert('Hindi na-send: ' + Object.values(e).join(' | ')); }, onFinish: () => setSending(false) };
        if (!sel.key) router.post(route('groupchat.send'), { body, attachment: file }, o);
        else if (latest) router.post(route('volunteer.communication.reply', latest.id), { body, attachment: file }, o);
        else router.post(route('volunteer.communication.send'), { to: ADMIN_EMAIL, subject: (body || 'Attachment').slice(0, 60), message: body, attachment: file, chat_key: sel.key || '' }, o);
    };

    const renderMsgs = (items) => {
        let prev = '';
        return items.map((m, i) => {
            const dk = dayKey(m.created_at);
            const showDay = dk !== prev;
            prev = dk;
            const admin = m.threadId === 'g' ? !gcMine(m) : m.sender_type === 'admin';
            return (
                <div key={m.threadId + '-' + (m.id ?? i)} style={{ display: 'contents' }}>
                    {showDay && <div className="ch-day"><span>{dk === today ? 'Today' : fmtDay(m.created_at)}</span></div>}
                    <div className={'ch-msg ' + (admin ? 'them' : 'me')}>
                        {admin && <div className="ch-who">{m.label || m.admin_label || m.admin?.name || 'Red Cross Admin'}</div>}
                        {m.body && <div className="ch-bub">{m.body}</div>}
                        {m.attachment_path && (() => { const u = m.threadId === 'g' ? route('groupchat.attachment', m.id) : route('volunteer.communication.attachment', m.id); const mt = m.attachment_mime || ''; return (
                            <div className="ch-att">
                                {mt.startsWith('image/') ? <a href={u} target="_blank" rel="noreferrer"><img src={u} alt={m.attachment_name || 'Picture'} /></a>
                                : mt.startsWith('video/') ? <video src={u} controls preload="metadata" />
                                : <a className="ch-doc" href={u} target="_blank" rel="noreferrer">{m.attachment_name || 'Open file'}</a>}
                            </div>); })()}
                        <div className="ch-time">{fmtTime(m.created_at)}</div>
                    </div>
                </div>
            );
        });
    };

    const renderRow = (c) => {
        const todays = tab === 'inbox' && !c.key ? c.msgs.filter((m) => dayKey(m.created_at) === today) : null;
        const last = todays ? todays[todays.length - 1] : c.last;
        const who = last ? (c.key ? (last.sender_type === 'admin' ? (last.admin_label || last.admin?.name || 'Red Cross Admin') : 'You') : (gcMine(last) ? 'You' : (last.label || 'Someone'))) + ': ' : '';
        return (
            <button key={c.id} type="button" onClick={() => setSelectedId(c.id)} className={'ch-row' + (c.id === selectedId ? ' on' : '') + (c.unread ? ' unread' : '')}>
                <div className={'ch-av' + (c.key ? ' pv' : '')}>{c.key ? initials('Admin ' + c.key) : (groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : 'RC')}</div>
                <div className="ch-rt">
                    <div className="ch-rn">{rowName(c)}</div>
                    <div className="ch-rp">{last ? who + (last.body || 'Attachment') : (c.msgs.length > 0 ? 'No messages today.' : 'Say hello to the Red Cross team.')}</div>
                </div>
                <div className="ch-rm">
                    <span>{last ? (dayKey(last.created_at) === today ? fmtTime(last.created_at) : fmtDay(last.created_at)) : ''}</span>
                    {c.unread ? <span className="ch-dot" /> : null}
                    {c.threads.length > 0 ? <span role="button" tabIndex={0} title={c.pinned ? 'Unpin chat' : 'Pin chat'} aria-label={c.pinned ? 'Unpin chat' : 'Pin chat'} onClick={(e) => { e.stopPropagation(); togglePin(c); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); togglePin(c); } }} style={{ cursor: 'pointer', display: 'inline-flex', color: c.pinned ? '#CC0000' : '#bbb' }}><Ic n="pin" s={13} /></span> : null}
                </div>
            </button>
        );
    };

    return (
        <VolunteerShell active="communication" title="Messages" notifications={[]}>
            <style>{CSS}</style>
            <div className="ch-tabs">
                {TABS.map(([id, label]) => (
                    <button key={id} type="button" className={'ch-tab' + (tab === id ? ' on' : '')} onClick={() => { setTab(id); setSelectedId(null); setOpenAnn(null); }}>
                        {label}{id === 'inbox' && inboxUnread > 0 ? <span className="ch-n">{inboxUnread}</span> : null}
                    </button>
                ))}
                <button type="button" className={'ch-tab' + (tab === 'announcements' ? ' on' : '')} onClick={() => { setTab('announcements'); setSelectedId(null); }}>
                    Announcements{(announcements || []).length > 0 ? <span className="ch-n">{(announcements || []).length}</span> : null}
                </button>
            </div>

            {tab === 'announcements' ? (
                <div className="ch-wrap" style={{ display: 'block', overflowY: 'auto' }}>
                    {(announcements || []).length === 0 && <div className="ch-empty">No announcements yet.</div>}
                    {(announcements || []).map((a) => (
                        <button key={a.id} type="button" className="ch-card" style={{ display: 'block', width: 'calc(100% - 28px)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setOpenAnn(openAnn === a.id ? null : a.id)}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>{a.title}</div>
                            <div style={{ fontSize: '11px', color: '#999', margin: '2px 0 6px' }}>{fmtDay(a.created_at)}</div>
                            <div style={{ fontSize: '12.5px', color: '#555', whiteSpace: 'pre-wrap' }}>{openAnn === a.id ? a.body : (a.body || '').slice(0, 90) + ((a.body || '').length > 90 ? '...' : '')}</div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="ch-wrap">
                    <div className={'ch-list' + (sel ? ' hide-m' : '')}>
                        <label className="ch-search"><Ic n="search" s={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" /></label>
                        {suggest.length > 0 && <div className="ch-sec">Start a private chat</div>}{suggest.map((s) => (<button key={'new-' + s} type="button" className="ch-row" onClick={() => startWith(s)}><div className="ch-av pv">{initials('Admin ' + s)}</div><div className="ch-rt"><div className="ch-rn">{'Admin ' + s}</div><div className="ch-rp">Start private chat</div></div></button>))}{list.length === 0 && suggest.length === 0 && <div className="ch-empty">{emptyText}</div>}
                        {tab === 'inbox' && groupRows.length > 0 && <div className="ch-sec">Group</div>}
                        {tab === 'inbox' ? groupRows.map(renderRow) : null}
                        {tab === 'inbox' && privateRows.length > 0 && <div className="ch-sec">Private chats</div>}
                        {(tab === 'inbox' ? privateRows : list).map(renderRow)}
                    </div>

                    <div className={'ch-chat' + (sel ? '' : ' hide-m')}>
                        {!sel ? (
                            <div className="ch-empty">Pick a conversation to read and reply.</div>
                        ) : (
                            <>
                                <div className="ch-head">
                                    <button type="button" className="ch-ib ch-back" aria-label="Back" onClick={() => setSelectedId(null)}><Ic n="back" s={18} /></button>
                                    <div className={'ch-av' + (sel.key ? ' pv' : '')}>{sel.key ? initials('Admin ' + sel.key) : (groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : 'RC')}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{rowName(sel)}</div>
                                        <div style={{ fontSize: '12px', color: '#777' }}>{sel.key ? 'Private chat' : 'Muntinlupa Branch'}</div>
                                    </div>
                                    {sel.status === 'active' && sel.threads.length > 0 && <button type="button" className="ch-ib" aria-label="Archive" title="Archive" onClick={() => leave('archive', sel)}><Ic n="archive" /></button>}
                                    {sel.status !== 'active' && <button type="button" className="ch-ib" aria-label="Restore" title="Restore" onClick={() => leave('restore', sel)}><Ic n="restore" /></button>}
                                    {sel.status !== 'trashed' && sel.threads.length > 0 && <button type="button" className="ch-ib" aria-label="Move to trash" title="Move to trash" onClick={() => { if (window.confirm('Move this conversation to Trash? You can restore it later.')) leave('trash', sel); }}><Ic n="trash" /></button>}
                                    {sel.status === 'trashed' && <button type="button" className="ch-ib" aria-label="Delete forever" title="Delete forever" onClick={() => { if (window.confirm('Delete this conversation forever? This cannot be undone.')) leave('purge', sel); }}><Ic n="trash" /></button>}
                                </div>
                                <div className="ch-note">{sel.day ? 'Messages from this day. To chat, go to Inbox.' : sel.key ? 'Chat with Admin ' + sel.key + '.' : 'Everyone in ' + (groupChat?.name || 'Group chat') + ' can read and reply here.'}</div>

                                <div className="ch-scroll" ref={scrollRef}>
                                    {!showAll && earlier > 0 && !!sel.key && (
                                        <button type="button" className="ch-more" onClick={() => setExpanded(true)}>Show earlier messages ({earlier})</button>
                                    )}
                                    {shown.length === 0 && <div className="ch-empty">{sel.status === 'active' ? (earlier > 0 && !sel.key ? 'No messages today. Earlier messages are in History.' : 'No messages yet. Say hello below.') : 'No messages.'}</div>}
                                    {renderMsgs(shown)}
                                </div>

                                {sel.status === 'active' && !sel.day && (
                                    <>
                                        {file && (<div className="ch-file"><span>{file.name}</span><button type="button" onClick={() => setFile(null)}>Remove</button></div>)}
                                        <div className="ch-comp">
                                            <label className="ch-clip" aria-label="Attach a file" title="Attach a picture, video or PDF">
                                                <input type="file" hidden accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const lim = f.type.startsWith('image/') ? 5 : f.type.startsWith('video/') ? 50 : 10; if (f.size / 1048576 > lim) { window.alert('File too large. Limits: pictures 5 MB, videos 50 MB, PDF 10 MB.'); return; } setFile(f); }} />
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                            </label>
                                            <textarea
                                                rows={1}
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                                placeholder={sel.key ? 'Message Admin ' + sel.key : 'Message ' + (groupChat?.name || 'Group chat')}
                                                aria-label="Message"
                                            />
                                            <button type="button" className="ch-send" aria-label="Send" onClick={send}><Ic n="send" /></button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </VolunteerShell>
    );
}