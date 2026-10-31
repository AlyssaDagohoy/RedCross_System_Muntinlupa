import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminShell from '../../Components/AdminShell';

const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short' });
const dayKey = (d) => new Date(d).toDateString();
const initials = (n) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const IC = {
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
    pin: 'M12 17v5M9 3h6l-1 7 3 3H7l3-3-1-7z',
    archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
    back: 'M15 18l-6-6 6-6',
    restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
};
const Ic = ({ n, s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[n]} /></svg>
);

const CSS = `
.ch-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.ch-tab{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1px solid #e5e5e5;background:#fff;color:#555;font-size:12.5px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none}
.ch-tab.on{background:#CC0000;border-color:#CC0000;color:#fff}
.ch-n{background:#CC0000;color:#fff;border-radius:10px;font-size:10.5px;min-width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}
.ch-tab.on .ch-n{background:#fff;color:#CC0000}
.ch-wrap{display:grid;grid-template-columns:320px minmax(0,1fr);grid-template-rows:minmax(0,1fr);background:#fff;border:1px solid #ebebeb;border-radius:14px;overflow:hidden;height:calc(100vh - 170px);min-height:440px}
.ch-list{border-right:1px solid #ebebeb;overflow-y:auto;min-width:0}
.ch-chat{display:flex;flex-direction:column;min-width:0;min-height:0}
.ch-search{display:flex;align-items:center;gap:8px;margin:10px 12px;padding:7px 12px;border-radius:999px;background:#f3f3f4;color:#888}
.ch-search input{border:none;background:transparent;outline:none;font-size:12.5px;flex:1;font-family:inherit;min-width:0}
.ch-sec{padding:8px 14px 4px;font-size:11px;color:#999}
.ch-row{display:flex;gap:10px;align-items:center;padding:10px 14px;cursor:pointer;border:none;background:transparent;width:100%;text-align:left;font-family:inherit}
.ch-row:hover{background:#f7f7f8}
.ch-row.on{background:#fdf1f1}
.ch-av{width:36px;height:36px;border-radius:50%;background:#fbeaea;color:#CC0000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none}
.ch-rt{min-width:0;flex:1}
.ch-av.pv{background:#e6f1fb;color:#0c447c}
.ch-rn{font-size:13px;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-rp{font-size:12px;color:#777;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-row.unread .ch-rn,.ch-row.unread .ch-rp{font-weight:600;color:#111}
.ch-rm{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11px;color:#999}
.ch-dot{width:8px;height:8px;border-radius:50%;background:#CC0000}
.ch-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #ebebeb}
.ch-back{display:none}
.ch-ib{border:none;background:transparent;color:#666;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.ch-ib:hover{background:#f3f3f4}
.ch-ib.on{color:#CC0000}
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
.ch-comp{display:flex;gap:8px;align-items:flex-end;padding:10px 14px;border-top:1px solid #ebebeb;background:#fff}
.ch-comp textarea{flex:1;resize:none;border:1px solid #e5e5e5;border-radius:18px;padding:9px 14px;font-size:13.5px;font-family:inherit;outline:none;background:#fafafa;max-height:110px}
.ch-comp textarea:focus{border-color:#CC0000}
.ch-comp,.ch-as,.ch-file,.ch-head{flex-shrink:0}
.ch-clip{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;cursor:pointer;color:#777;flex-shrink:0}
.ch-clip:hover{background:#f1f1f2;color:#CC0000}
.ch-file{display:flex;align-items:center;gap:10px;padding:6px 14px;border-top:1px solid #ebebeb;font-size:12px;color:#555;background:#fafafa}
.ch-file span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-file button{border:none;background:none;color:#CC0000;cursor:pointer;font-size:12px}
.ch-att{margin-top:4px}
.ch-att img{display:block;max-width:220px;max-height:220px;border-radius:12px}
.ch-att video{display:block;max-width:240px;max-height:260px;border-radius:12px;background:#000}
.ch-att .ch-doc{display:inline-block;padding:8px 13px;border-radius:12px;background:#f1f1f2;color:#222;font-size:13px;text-decoration:underline;word-break:break-all}
.ch-send{width:38px;height:38px;border-radius:50%;border:none;background:#CC0000;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.ch-empty{margin:auto;text-align:center;color:#888;font-size:13px;padding:24px}
.ch-as{display:flex;align-items:center;gap:8px;padding:6px 14px;border-top:1px solid #ebebeb;font-size:12px;color:#777}
.ch-as input{border:1px solid #e5e5e5;border-radius:8px;padding:4px 8px;font-size:12.5px;font-family:inherit;outline:none;width:190px}
.ch-as input:focus{border-color:#CC0000}
.ch-as + .ch-comp{border-top:none}
@media (max-width:760px){.ch-wrap{grid-template-columns:1fr}.hide-m{display:none!important}.ch-back{display:inline-flex}}
`;

const threadMessages = (t) => {
    if (Array.isArray(t.messages) && t.messages.length > 0) return t.messages.map((m) => ({ ...m, threadId: t.id }));
    const list = [{ sender_type: 'volunteer', body: t.message, created_at: t.created_at, threadId: t.id }];
    if (t.reply) list.push({ sender_type: 'admin', body: t.reply, created_at: t.replied_at || t.created_at, threadId: t.id });
    return list;
};

const TABS = [['inbox', 'Inbox'], ['pinned', 'Pinned'], ['history', 'History'], ['archive', 'Archive'], ['trash', 'Trash']];
const opts = { preserveScroll: true, preserveState: true };

export default function AdminChat({ messages = [], announcements = [], volunteers = [], staff = [], groupChat = {} }) {
    const [tab, setTab] = useState('inbox');
    const [annTitle, setAnnTitle] = useState('');
    const [annBody, setAnnBody] = useState('');
    const [annBusy, setAnnBusy] = useState(false);
    const [annErr, setAnnErr] = useState({});
    const [annOpen, setAnnOpen] = useState(null);
    const [annView, setAnnView] = useState('active');
    const [annEdit, setAnnEdit] = useState(false);
    const [annEt, setAnnEt] = useState('');
    const [annEb, setAnnEb] = useState('');
    const [annMenu, setAnnMenu] = useState(null);
    const [srchOpen, setSrchOpen] = useState(false);
    useEffect(() => { const c = () => setSrchOpen(false); const k = (e) => { if (e.key === 'Escape') setSrchOpen(false); }; window.addEventListener('click', c); window.addEventListener('keydown', k); return () => { window.removeEventListener('click', c); window.removeEventListener('keydown', k); }; }, []);
    const [rowMenu, setRowMenu] = useState(null);
    useEffect(() => { const c = () => setRowMenu(null); const k = (e) => { if (e.key === 'Escape') setRowMenu(null); }; window.addEventListener('click', c); window.addEventListener('keydown', k); return () => { window.removeEventListener('click', c); window.removeEventListener('keydown', k); }; }, []);
    useEffect(() => { const c = () => setAnnMenu(null); window.addEventListener('click', c); return () => window.removeEventListener('click', c); }, []);
    const [selectedId, setSelectedId] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [text, setText] = useState('');
    const [q, setQ] = useState('');
    const [sending, setSending] = useState(false);
    const [file, setFile] = useState(null);
    const prof = usePage().props.adminProfile; const [asNameState, setAsName] = useState(() => { try { return sessionStorage.getItem('rc_admin_name') || ''; } catch { return ''; } }); const asName = prof || asNameState;
    const changeName = (v) => { setAsName(v); try { sessionStorage.setItem('rc_admin_name', v); } catch {} };
    const scrollRef = useRef(null); const [gOpen, setGOpen] = useState(false); const [gName, setGName] = useState(''); const [gFile, setGFile] = useState(null); const [gSaving, setGSaving] = useState(false);
    const saveGroup = () => { const nm = gName.trim(); if (!nm) { window.alert('Type a group name.'); return; } setGSaving(true); router.post(route('admin.communication.group'), { name: nm, picture: gFile }, { ...opts, forceFormData: true, onSuccess: () => { setGOpen(false); setGFile(null); }, onError: (e) => window.alert(Object.values(e).join(' | ')), onFinish: () => setGSaving(false) }); };
    const [draft, setDraft] = useState(null); const [renaming, setRenaming] = useState(null); const [closedAdm, setClosedAdm] = useState({});
    const fullLabel = (n) => { const nm = (n || '').trim(); return nm ? (/^admin\b/i.test(nm) ? nm : 'Admin ' + nm) : ''; };
    const renameSender = (m) => { setRenaming((r) => (r && r.id === m.id ? null : m)); };
    const pickName = (m, s) => { router.patch(route('admin.communication.relabel', m.id), { admin_label: fullLabel(s).slice(0, 60) }, opts); setRenaming(null); };
    const markedRef = useRef('');
    const today = new Date().toDateString();

    // live-poll: refresh messages every 5 seconds (only while this tab is visible)
    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['messages', 'groupChat'], preserveScroll: true, preserveState: true });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const convsBase = useMemo(() => {
        const byUser = {};
        messages.forEach((t) => {
            if (t.admin_inbox_status === 'purged') return;
            if (!t.chat_key) return;
            (byUser[t.user_id + '|' + (t.chat_key || '')] ||= { id: t.user_id + '|' + (t.chat_key || ''), userId: t.user_id, key: t.chat_key || '', user: t.user, threads: [] }).threads.push(t);
        });
        return Object.values(byUser).map((c) => {
            const msgs = c.threads.flatMap(threadMessages).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const sts = c.threads.map((t) => t.admin_inbox_status);
            const status = sts.includes('active') ? 'active' : sts.includes('archived') ? 'archived' : 'trashed';
            const newest = [...c.threads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            return { ...c, msgs, status, newest, pinned: c.threads.some((t) => t.admin_starred_at), unread: c.threads.some((t) => t.admin_unread), last: msgs[msgs.length - 1] };
        }).sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0));
    }, [messages]);

    // Shared group chat: one chat for everybody (messages come from groupChat.messages)
    const gcAll = useMemo(() => (groupChat?.messages || []).map((m) => ({ ...m, threadId: 'g' })), [groupChat]);
    const myKey = staff.find((s) => s.toLowerCase() === (asName || '').trim().toLowerCase()) || '';
    const meLabel = 'Admin ' + (myKey || (asName || '').trim());
    const gcReadAt = groupChat?.readAt ? new Date(groupChat.readAt).getTime() : 0;
    const gcUnread = gcAll.some((m) => !(m.sender_type === 'admin' && m.label === meLabel) && dayKey(m.created_at) === today && new Date(m.created_at).getTime() > gcReadAt);
    const convs = useMemo(() => {
        const base = { gc: true, userId: null, key: '', user: { name: groupChat?.name || 'Group chat', email: '' }, threads: [], status: 'active', pinned: false, newest: { id: null, created_at: new Date(0).toISOString(), admin_starred_at: null } };
        const byDay = {};
        gcAll.forEach((m) => { const dk = dayKey(m.created_at); if (dk !== today) (byDay[dk] ||= []).push(m); });
        const days = Object.keys(byDay).map((dk) => ({ ...base, id: '|day|' + dk, day: dk, msgs: byDay[dk], unread: false, last: byDay[dk][byDay[dk].length - 1] })).reverse();
        return [...convsBase, { ...base, id: '|group', msgs: gcAll, unread: gcUnread, last: gcAll[gcAll.length - 1] }, ...days];
    }, [convsBase, gcAll, gcUnread, groupChat]);

    const isToday = (c) => !!c.last && dayKey(c.last.created_at) === today;
    const inToday = (c) => c.status === 'active' && (isToday(c) || c.unread);
    const match = (c) => {
        const s = ''; // the list no longer filters while typing; search lives in the popup
        if (prof && c.key && c.key.toLowerCase() !== prof.toLowerCase()) return false; return !s || s.split(/\s+/).every((w) => (c.user?.name || '').toLowerCase().includes(w)) || (c.last?.body || '').toLowerCase().includes(s);
    };
    const list = convs.filter((c) => {
        if (!match(c)) return false;
        if (tab === 'inbox') return c.status === 'active' && (c.pinned || inToday(c) || (c.gc && !c.day));
        if (tab === 'pinned') return c.pinned && c.status === 'active';
        if (tab === 'history') return c.status === 'active' && (!!c.day || (!c.gc && !inToday(c) && !c.pinned));
        return c.status === (tab === 'archive' ? 'archived' : 'trashed');
    });
    const pinnedRows = tab === 'inbox' ? list.filter((c) => c.pinned) : [];
    const restRows = tab === 'inbox' ? list.filter((c) => !c.pinned) : list;
    const inboxUnread = convs.filter((c) => inToday(c) && c.unread).length;
    const newPeople = false
        ? volunteers.filter((v) => !convs.some((c) => c.userId === v.id && !c.gc && (c.key || '').toLowerCase() === myKey.toLowerCase()) && q.trim().toLowerCase().split(/\s+/).every((w) => (v.name || '').toLowerCase().includes(w))).slice(0, 20)
        : [];

    const realSel = convs.find((c) => c.id === selectedId) || null;
    const sel = realSel || (draft ? { id: draft.id, draft: true, userId: draft.userId, key: draft.key || '', user: { id: draft.userId, name: draft.name }, threads: [], msgs: [], status: 'active', newest: { id: null, created_at: new Date().toISOString(), admin_starred_at: null }, pinned: false, unread: false, last: null } : null);

    useEffect(() => {
        if (draft && convs.some((c) => c.id === draft.id)) { setSelectedId(draft.id); setDraft(null); }
    }, [convs, draft]);
    useEffect(() => { if (selectedId !== null) setDraft(null); }, [selectedId]);
    const todayMsgs = sel ? sel.msgs.filter((m) => dayKey(m.created_at) === today) : [];
    const showAll = !sel || expanded || (todayMsgs.length === 0 && !sel.gc && sel.last?.sender_type === 'volunteer') || !['inbox', 'pinned'].includes(tab);
    const shown = sel ? (showAll ? sel.msgs : todayMsgs) : [];
    const earlier = sel ? sel.msgs.length - todayMsgs.length : 0;

    const gcMarked = useRef('');
    useEffect(() => {
        if (!sel || !sel.gc || sel.day || !gcUnread) return;
        const k = String(gcAll[gcAll.length - 1]?.id || '');
        if (gcMarked.current === k) return;
        gcMarked.current = k;
        router.post(route('groupchat.read'), {}, opts);
    }, [sel?.id, gcUnread, gcAll.length]);
    useEffect(() => { setExpanded(false); setText(''); }, [selectedId]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [sel?.id, shown.length]);

    useEffect(() => {
        if (!sel || !sel.unread) return;
        const key = sel.id + ':' + (sel.last?.created_at || '');
        if (markedRef.current === key) return;
        markedRef.current = key;
        const ids = sel.threads.filter((t) => t.admin_unread).map((t) => t.id);
        if (ids.length) router.post(route('admin.communication.read'), { ids, read: true }, opts);
    }, [sel?.id, sel?.unread, sel?.last?.created_at]);

    const batch = (name, c) => router.post(route('admin.communication.' + name), { ids: c.threads.map((t) => t.id), box: 'inbox' }, opts);
    const seq = (urls) => {
        if (!urls.length) return;
        const [u, ...rest] = urls;
        router.post(u, {}, { ...opts, onFinish: () => seq(rest) });
    };
    const togglePin = (c) => seq(c.threads.filter((t) => !!t.admin_starred_at === c.pinned).map((t) => route('admin.communication.star', t.id)));
    const leave = (name, c) => { batch(name, c); setSelectedId(null); };
    const purge = (c) => { if (window.confirm('Delete this conversation forever?')) leave('purge', c); };
    const popPeople = q.trim() ? volunteers.filter((v) => q.trim().toLowerCase().split(/\s+/).every((w) => (v.name || '').toLowerCase().includes(w))).slice(0, 20) : [];
    const pickPerson = (v) => {
        setSrchOpen(false);
        if (!myKey) { window.alert('Choose your name in "Replying as" first, so the private chat is with the right person.'); return; }
        const ex = convs.find((c) => c.userId === v.id && !c.gc && !c.day && (c.key || '').toLowerCase() === myKey.toLowerCase());
        if (ex) {
            setTab(ex.status === 'archived' ? 'archive' : ex.status === 'trashed' ? 'trash' : 'inbox');
            setSelectedId(ex.id);
        } else {
            setTab('inbox');
            setDraft({ id: v.id + '|' + myKey, userId: v.id, name: v.name, key: myKey });
            setSelectedId(null);
        }
        setQ('');
    };
    const openRowMenu = (e, c) => { if (c.gc || c.draft) return; e.preventDefault(); setRowMenu({ id: c.id, x: e.clientX, y: e.clientY }); };
    const rowAct = (k, c) => {
        setRowMenu(null);
        if (k === 'pin') { togglePin(c); return; }
        if (k === 'purge' && !window.confirm('Delete this conversation forever?')) return;
        batch(k, c);
        if (selectedId === c.id) setSelectedId(null);
    };
    const rowItems = (c) => (c.status === 'active' ? [[c.pinned ? 'Unpin' : 'Pin', 'pin'], ['Archive', 'archive'], ['Move to trash', 'trash', true]] : c.status === 'archived' ? [['Restore', 'restore'], ['Move to trash', 'trash', true]] : [['Restore', 'restore'], ['Delete forever', 'purge', true]]);

    const startPrivate = () => {
        const nm = staff.find((s) => s.toLowerCase() === asName.trim().toLowerCase());
        if (!nm) { window.alert('Choose your name in "Replying as" first, so the private chat is with the right person.'); return; }
        const id = sel.userId + '|' + nm;
        if (convs.some((c) => c.id === id)) { setSelectedId(id); return; }
        setDraft({ id, userId: sel.userId, name: sel.user?.name, key: nm });
        setSelectedId(null);
    };

    const send = () => {
        const body = text.trim();
        if ((!body && !file) || !sel || sending) return;
        if (sel.draft && !body) { window.alert('Type a message to start the conversation. You can attach files after.'); return; }
        const nm = sel.key ? sel.key : (staff.length > 0 ? (staff.find((s) => s.toLowerCase() === asName.trim().toLowerCase()) || '') : asName.trim());
        if (!nm) { window.alert('Choose your name in "Replying as" first, so the volunteer knows who answered.'); return; }
        const label = /^admin\b/i.test(nm) ? nm : 'Admin ' + nm;
        setSending(true);
        router.post(sel.gc ? route('groupchat.send') : sel.draft ? route('admin.communication.start') : route('admin.communication.reply', sel.newest.id), sel.gc ? { body, admin_label: label, attachment: file } : sel.draft ? { user_id: sel.userId, message: body, admin_label: label, chat_key: sel.key || '' } : { reply: body, admin_label: label, attachment: file }, {
            ...opts,
            onSuccess: () => { setText(''); setFile(null); setTab('inbox'); },
            onError: (e) => { console.error(e); window.alert('Hindi na-send: ' + Object.values(e).join(' | ')); },
            onFinish: () => setSending(false),
        });
    };

    const renderRow = (c, mode) => {
        const last = c.last;
        const who = c.gc ? (last ? (last.label || 'Someone') + ': ' : '') : last?.sender_type === 'admin' ? (last.admin_label || last.admin?.name || 'Admin') + ': ' : '';
        return (
            <button onContextMenu={(e) => openRowMenu(e, c)} key={c.id} type="button" onClick={() => setSelectedId(c.id)} className={'ch-row' + (c.id === selectedId ? ' on' : '') + (c.unread ? ' unread' : '')}>
                <div className={'ch-av' + (c.key ? ' pv' : '')}>{!c.key && groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(c.user?.name)}</div>
                <div className="ch-rt">
                    <div className="ch-rn">{!c.key ? (groupChat?.name || 'Group chat') + (c.day && c.last ? ' \u00b7 ' + fmtDay(c.last.created_at) : '') : (c.user?.name || 'Volunteer') + (mode === 'g' ? '' : ' (private: ' + c.key + ')')}</div>
                    <div className="ch-rp">{['inbox', 'pinned'].includes(tab) && !c.day && !c.unread && !isToday(c) && (c.gc || last?.sender_type !== 'volunteer') ? 'No messages today' : <>{who}{last?.body}</>}</div>
                </div>
                <div className="ch-rm">
                    <span>{last && !(['inbox', 'pinned'].includes(tab) && !c.day && !c.unread && !isToday(c) && (c.gc || last?.sender_type !== 'volunteer')) ? (dayKey(last.created_at) === today ? fmtTime(last.created_at) : fmtDay(last.created_at)) : ''}</span>
                    {c.unread ? <span className="ch-dot" /> : c.pinned ? <Ic n="pin" s={12} /> : null}
                </div>
            </button>
        );
    };

    let prevDay = '';
    return (
        <AdminShell active="communication" title="Communication">
            <style>{CSS}</style>
            <style>{`.ch-tabs{display:flex;align-items:center;gap:2px;flex-wrap:wrap;padding:0;background:none;border-bottom:1px solid #e5e5e5;margin-bottom:14px}.ch-tabs .ch-tab{background:transparent;border:none;border-bottom:2px solid transparent;border-radius:0;padding:8px 14px;margin-bottom:-1px;color:#777;box-shadow:none}.ch-tabs .ch-tab:hover{background:transparent;color:#222}.ch-tabs .ch-tab.on{background:transparent;color:#222;font-weight:600;border-bottom-color:#CC0000}.ch-tabs .cm-sep{background:#ddd!important}`}</style>
            <div className="ch-tabs">
                {TABS.map(([id, label]) => (
                    <button key={id} type="button" className={'ch-tab' + (tab === id ? ' on' : '')} onClick={() => { setTab(id); setSelectedId(null); }}>
                        {label}{id === 'inbox' && inboxUnread > 0 ? <span className="ch-n">{inboxUnread}</span> : null}
                    </button>
                ))}
                <span className="cm-sep" style={{ width: 1, height: 22, background: '#ddd', margin: '0 4px' }} />
                <button type="button" className={'ch-tab' + (tab === 'announcements' ? ' on' : '')} onClick={() => { setTab('announcements'); setSelectedId(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
                    Announcements{announcements.filter((a) => !a.deleted_at && !a.archived_at).length > 0 ? <span className="ch-n">{announcements.filter((a) => !a.deleted_at && !a.archived_at).length}</span> : null}
                </button>
                
            </div>

            {tab === 'announcements' && (() => {
                const st = (a) => (a.deleted_at ? 'trash' : a.archived_at ? 'arc' : 'active');
                const cnt = (k) => announcements.filter((a) => st(a) === k).length;
                const rows = announcements.filter((a) => st(a) === annView).sort((a, b) => (b.pinned_at ? 1 : 0) - (a.pinned_at ? 1 : 0));
                const cur = announcements.find((a) => a.id === annOpen) || null;
                const R = (n, id) => route('admin.communication.announcement.' + n, id);
                const act = (k, a) => {
                    setAnnMenu(null);
                    const o = { preserveScroll: true };
                    if (k === 'pin') router.post(R('pin', a.id), {}, o);
                    else if (k === 'edit') { setAnnOpen(a.id); setAnnEdit(true); setAnnEt(a.title); setAnnEb(a.body); setAnnErr({}); }
                    else if (k === 'archive') { router.post(R('archive', a.id), {}, o); if (annOpen === a.id) setAnnOpen(null); }
                    else if (k === 'delete') { router.delete(R('delete', a.id), o); if (annOpen === a.id) setAnnOpen(null); }
                    else if (k === 'restore') { router.post(R('restore', a.id), {}, o); if (annOpen === a.id) setAnnOpen(null); }
                    else if (k === 'purge') { if (window.confirm("Delete this announcement forever? This can't be undone.")) { router.delete(R('purge', a.id), o); if (annOpen === a.id) setAnnOpen(null); } }
                };
                const menuFor = (a) => {
                    const s = st(a);
                    if (s === 'active') return [[a.pinned_at ? 'Unpin' : 'Pin', 'pin'], ['Edit', 'edit'], ['Archive', 'archive'], ['Delete', 'delete', true]];
                    if (s === 'arc') return [['Unarchive', 'archive'], ['Delete', 'delete', true]];
                    return [['Restore', 'restore'], ['Delete forever', 'purge', true]];
                };
                const menuAnn = annMenu ? announcements.find((a) => a.id === annMenu.id) : null;
                const back = <button type="button" className="an-back" onClick={() => { setAnnOpen(null); setAnnEdit(false); }}>{'\u2190'} Back</button>;
                const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px' };
                const redBtn = (dis) => ({ padding: '8px 14px', border: 'none', borderRadius: '8px', background: '#CC0000', color: '#fff', fontWeight: 600, fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer', opacity: dis ? 0.5 : 1 });
                return (
                    <div className={'an-wrap' + (annOpen !== null ? ' open' : '')}>
                        <style>{`.an-wrap{position:relative;display:grid;grid-template-columns:minmax(0,250px) minmax(0,1fr);border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;background:#fff;height:calc(100vh - 220px);min-height:420px}.an-list{border-right:1px solid #eee;overflow-y:auto}.an-new{display:block;width:calc(100% - 20px);margin:10px;padding:7px 10px;border:none;border-radius:8px;background:#CC0000;color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer}.an-new:hover{background:#b30000}.an-seg{display:flex;gap:12px;padding:0 14px 8px}.an-seg button{border:none;background:none;padding:0 0 3px;font-family:inherit;font-size:12px;color:#999;cursor:pointer;border-bottom:2px solid transparent}.an-seg button.on{color:#222;border-bottom-color:#CC0000}.an-row{display:block;width:100%;text-align:left;background:transparent;border:none;border-top:1px solid #eee;padding:9px 14px;cursor:pointer;font-family:inherit}.an-row:hover{background:#fafafa}.an-row.on{background:#fafafa;box-shadow:inset 3px 0 0 #CC0000}.an-view{padding:20px 24px;overflow-y:auto}.an-empty{display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px}.an-back{display:none;margin-bottom:10px;border:none;background:none;color:#CC0000;cursor:pointer;font-family:inherit;font-size:12.5px;padding:0}.an-menu{position:absolute;z-index:5;min-width:160px;background:#fff;border:1px solid #ddd;border-radius:10px;padding:4px;box-shadow:0 6px 18px rgba(0,0,0,.12)}.an-menu button{display:block;width:100%;border:none;background:transparent;border-radius:6px;padding:7px 10px;font-family:inherit;font-size:12.5px;color:#222;cursor:pointer;text-align:left}.an-menu button:hover{background:#f4f4f4}.an-note{font-size:12px;color:#666;background:#f6f6f6;border-radius:8px;padding:8px 10px;margin:0 0 12px}@media(max-width:700px){.an-wrap{grid-template-columns:1fr}.an-back{display:inline-block}.an-wrap.open .an-list{display:none}.an-wrap:not(.open) .an-view{display:none}.an-view{padding:16px}}`}</style>
                        <div className="an-list">
                            <button type="button" className="an-new" onClick={() => { setAnnOpen('new'); setAnnEdit(false); setAnnErr({}); }}>+ New announcement</button>
                            <div className="an-seg">
                                <button type="button" className={annView === 'active' ? 'on' : ''} onClick={() => { setAnnView('active'); setAnnOpen(null); }}>Active</button>
                                <button type="button" className={annView === 'arc' ? 'on' : ''} onClick={() => { setAnnView('arc'); setAnnOpen(null); }}>{'Archived (' + cnt('arc') + ')'}</button>
                                <button type="button" className={annView === 'trash' ? 'on' : ''} onClick={() => { setAnnView('trash'); setAnnOpen(null); }}>{'Trash (' + cnt('trash') + ')'}</button>
                            </div>
                            {rows.length === 0 && <div style={{ padding: '20px 14px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>{annView === 'trash' ? 'Trash is empty.' : annView === 'arc' ? 'Nothing archived.' : 'No announcements.'}</div>}
                            {rows.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    className={'an-row' + (a.id === annOpen ? ' on' : '')}
                                    onClick={() => { setAnnOpen(a.id); setAnnEdit(false); }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        const r = e.currentTarget.closest('.an-wrap').getBoundingClientRect();
                                        setAnnMenu({ id: a.id, x: Math.min(e.clientX - r.left, r.width - 170), y: Math.min(e.clientY - r.top, r.height - 170) });
                                    }}
                                >
                                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#222', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {a.pinned_at && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: '-1px' }}><path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3z" /></svg>}
                                        {a.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{fmtDay(a.created_at)}</div>
                                    <div style={{ fontSize: '11.5px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(a.body || '').replace(/\s+/g, ' ')}</div>
                                </button>
                            ))}
                        </div>
                        <div className="an-view">
                            {annOpen === 'new' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (annBusy) return;
                                        router.post(route('admin.communication.announce'), { title: annTitle, body: annBody }, {
                                            preserveScroll: true,
                                            onStart: () => { setAnnBusy(true); setAnnErr({}); },
                                            onSuccess: () => { setAnnTitle(''); setAnnBody(''); setAnnOpen(null); },
                                            onError: (er) => setAnnErr(er),
                                            onFinish: () => setAnnBusy(false),
                                        });
                                    }}
                                >
                                    {back}
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#222', marginBottom: '3px' }}>New announcement</div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '14px' }}>Sends a notification and an email to every approved volunteer.</div>
                                    <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" aria-label="Announcement title" style={{ ...inp, marginBottom: '4px' }} />
                                    {annErr.title && <div style={{ color: '#CC0000', fontSize: '12px', marginBottom: '6px' }}>{annErr.title}</div>}
                                    <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Write the announcement here." aria-label="Announcement body" rows={9} style={{ ...inp, marginTop: '6px', resize: 'vertical' }} />
                                    {annErr.body && <div style={{ color: '#CC0000', fontSize: '12px', marginTop: '2px' }}>{annErr.body}</div>}
                                    <div style={{ marginTop: '10px' }}>
                                        <button type="submit" disabled={annBusy || !annTitle.trim() || !annBody.trim()} style={redBtn(annBusy || !annTitle.trim() || !annBody.trim())}>{annBusy ? 'Posting...' : 'Post to all volunteers'}</button>
                                    </div>
                                </form>
                            ) : cur && annEdit && st(cur) === 'active' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        router.patch(R('update', cur.id), { title: annEt, body: annEb }, { preserveScroll: true, onSuccess: () => setAnnEdit(false), onError: (er) => setAnnErr(er) });
                                    }}
                                >
                                    {back}
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#222', marginBottom: '10px' }}>Edit announcement</div>
                                    <div className="an-note">Saving changes the text only. Volunteers are not notified again.</div>
                                    <input value={annEt} onChange={(e) => setAnnEt(e.target.value)} aria-label="Announcement title" style={{ ...inp, marginBottom: '4px' }} />
                                    {annErr.title && <div style={{ color: '#CC0000', fontSize: '12px', marginBottom: '6px' }}>{annErr.title}</div>}
                                    <textarea value={annEb} onChange={(e) => setAnnEb(e.target.value)} aria-label="Announcement body" rows={9} style={{ ...inp, marginTop: '6px', resize: 'vertical' }} />
                                    {annErr.body && <div style={{ color: '#CC0000', fontSize: '12px', marginTop: '2px' }}>{annErr.body}</div>}
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                        <button type="submit" disabled={!annEt.trim() || !annEb.trim()} style={redBtn(!annEt.trim() || !annEb.trim())}>Save changes</button>
                                        <button type="button" onClick={() => setAnnEdit(false)} style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', color: '#333', fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </form>
                            ) : cur ? (
                                <div>
                                    {back}
                                    {st(cur) === 'trash' && <div className="an-note">This announcement is in Trash. Right-click the row to restore it.</div>}
                                    <div style={{ fontSize: '17px', fontWeight: 600, color: '#222', marginBottom: '4px', lineHeight: 1.3 }}>{cur.title}</div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>{fmtDay(cur.created_at)}{cur.admin?.name ? ' \u00b7 ' + cur.admin.name : ''}</div>
                                    <div style={{ borderTop: '1px solid #eee', margin: '14px 0' }} />
                                    <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#222', whiteSpace: 'pre-wrap' }}>{cur.body}</div>
                                </div>
                            ) : (
                                <div className="an-empty">Pick an announcement to read.</div>
                            )}
                        </div>
                        {annMenu && menuAnn && (
                            <div className="an-menu" style={{ left: annMenu.x, top: annMenu.y }} onClick={(e) => e.stopPropagation()}>
                                {menuFor(menuAnn).map(([label, kind, danger]) => (
                                    <button key={kind} type="button" style={danger ? { color: '#CC0000' } : undefined} onClick={() => act(kind, menuAnn)}>{label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
            {rowMenu && (() => { const mc = convs.find((x) => x.id === rowMenu.id); if (!mc) return null; return (
                <div role="menu" onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', zIndex: 50, left: Math.min(rowMenu.x, window.innerWidth - 180), top: Math.min(rowMenu.y, window.innerHeight - 140), minWidth: 160, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 4, boxShadow: '0 6px 18px rgba(0,0,0,.12)' }}>
                    {rowItems(mc).map(([label, kind, danger]) => (
                        <button key={kind} type="button" role="menuitem" onClick={() => rowAct(kind, mc)} style={{ display: 'block', width: '100%', border: 'none', background: 'transparent', borderRadius: 6, padding: '7px 10px', fontFamily: 'inherit', fontSize: '12.5px', color: danger ? '#CC0000' : '#222', cursor: 'pointer', textAlign: 'left' }}>{label}</button>
                    ))}
                </div>
            ); })()}
            <div className="ch-wrap" style={tab === 'announcements' ? { display: 'none' } : undefined}>
                <div className={'ch-list' + (sel ? ' hide-m' : '')}>
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <label className="ch-search"><Ic n="search" s={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setSrchOpen(true); }} onFocus={() => setSrchOpen(true)} placeholder="Search volunteers" aria-label="Search volunteers" /></label>
                        {srchOpen && q.trim() && (
                            <div role="listbox" style={{ position: 'absolute', zIndex: 40, top: '100%', left: 32, right: 10, marginTop: 4, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 3, maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,.10)' }}>
                                {popPeople.length === 0 ? (
                                    <div style={{ padding: '10px 12px', fontSize: '12px', color: '#999' }}>No volunteers found</div>
                                ) : popPeople.map((v) => (
                                    <button key={'pp' + v.id} type="button" role="option" className="ch-row" onClick={() => pickPerson(v)} style={{ borderRadius: 9, padding: '5px 8px', gap: 8 }}>
                                        <span className="ch-av" style={{ width: 24, height: 24, minWidth: 24, fontSize: 10 }}>{initials(v.name)}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#222' }}>{v.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                                        {newPeople.length > 0 && (
                        <>
                            <div className="ch-sec">Start a new conversation</div>
                            {newPeople.map((v) => (
                                <button key={'new' + v.id} type="button" className={'ch-row' + (draft && draft.id === v.id + '|' + myKey ? ' on' : '')} onClick={() => { if (!myKey) { window.alert('Choose your name in "Replying as" first, so the private chat is with the right person.'); return; } setDraft({ id: v.id + '|' + myKey, userId: v.id, name: v.name, key: myKey }); setSelectedId(null); }}>
                                    <span className="ch-av">{initials(v.name)}</span>
                                    <span className="ch-rt"><span className="ch-rn" style={{ display: 'block' }}>{v.name}</span><span className="ch-rp" style={{ display: 'block' }}>No messages yet</span></span>
                                </button>
                            ))}
                        </>
                    )}
                    {list.length === 0 && newPeople.length === 0 && (
                        <div className="ch-empty">{tab === 'inbox' ? 'No messages today. Older conversations are in History.' : 'Nothing here yet.'}</div>
                    )}
                    {pinnedRows.length > 0 && <div className="ch-sec">Pinned</div>}
                    {pinnedRows.map(renderRow)}
                    {restRows.some((c) => !c.key) && <><div className="ch-sec" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span>Group</span><button type="button" onClick={() => { setGName(groupChat?.name || ''); setGFile(null); setGOpen((o) => !o); }} style={{ border: 'none', background: 'none', color: '#CC0000', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', padding: 0 }}>Edit group</button></div>{gOpen && (<div style={{ margin: '4px 12px 10px', padding: '10px', border: '1px solid #e5e5e5', borderRadius: '10px', background: '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div className="ch-av" style={{ width: '44px', height: '44px', overflow: 'hidden' }}>{(gFile || groupChat?.picture) ? <img src={gFile ? URL.createObjectURL(gFile) : groupChat.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'RC'}</div><label style={{ fontSize: '12px', color: '#CC0000', cursor: 'pointer' }}>Change picture<input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 5 * 1024 * 1024) { window.alert('Picture is too big. Max 5 MB.'); return; } setGFile(f); }} /></label></div><input value={gName} onChange={(e) => setGName(e.target.value)} maxLength={60} placeholder="Group name" aria-label="Group name" style={{ width: '100%', boxSizing: 'border-box', margin: '8px 0', padding: '7px 10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '12.5px' }} /><div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}><button type="button" onClick={() => setGOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#888' }}>Cancel</button><button type="button" onClick={saveGroup} disabled={gSaving} style={{ border: 'none', background: '#CC0000', color: '#fff', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>{gSaving ? 'Saving...' : 'Save'}</button></div></div>)}</>}{restRows.filter((c) => !c.key).map(renderRow)}
                    {restRows.some((c) => c.key) && <div className="ch-sec">Private chats</div>}{(() => { const g = {}; restRows.filter((c) => c.key).forEach((c) => { (g[c.key] = g[c.key] || []).push(c); }); const ts = (c) => new Date(c.last?.created_at || 0).getTime(); return Object.keys(g).map((k) => { g[k].sort((a, b) => ts(b) - ts(a)); return [k, g[k]]; }).sort((a, b) => ts(b[1][0]) - ts(a[1][0])).map(([k, rows]) => { const shut = !!closedAdm[k]; const anyUnread = rows.some((c) => c.unread); return (<div key={'adm' + k}><button type="button" onClick={() => setClosedAdm((s) => ({ ...s, [k]: !s[k] }))} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'calc(100% - 16px)', margin: '6px 8px 2px', padding: '6px 10px', border: 'none', borderRadius: '8px', background: '#f5f5f5', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', color: '#333', textAlign: 'left' }}><span>{shut ? '\u25B8' : '\u25BE'}</span><span style={{ fontWeight: 600 }}>{'Admin ' + k}</span><span style={{ fontSize: '11px', color: '#777', background: '#fff', borderRadius: '10px', padding: '0 7px' }}>{rows.length}</span>{anyUnread && <span style={{ marginLeft: 'auto', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#CC0000' }} />}</button>{!shut && rows.map((c) => renderRow(c, 'g'))}</div>); }); })()}
                </div>

                <div className={'ch-chat' + (sel ? '' : ' hide-m')}>
                    {!sel ? (
                        <div className="ch-empty">Pick a conversation to read and reply.</div>
                    ) : (
                        <>
                            <div className="ch-head">
                                <button type="button" className="ch-ib ch-back" aria-label="Back" onClick={() => setSelectedId(null)}><Ic n="back" s={18} /></button>
                                <div className={'ch-av' + (sel.key ? ' pv' : '')}>{!sel.key && groupChat?.picture ? <img src={groupChat.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(sel.user?.name)}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{!sel.key ? (groupChat?.name || 'Group chat') + (sel.day && sel.last ? ' \u00b7 ' + fmtDay(sel.last.created_at) : '') : (sel.user?.name || 'Volunteer')}</div>
                                    <div style={{ fontSize: '12px', color: '#777' }}>{sel.key ? 'Admin ' + sel.key + '\u2019s private chat with this volunteer \u00b7 ' + (sel.user?.email || 'Volunteer') : (sel.day ? 'Messages from this day' : 'Team chat')}</div>
                                </div>
                                {sel.status === 'active' && !sel.gc && <button type="button" className={'ch-ib' + (sel.pinned ? ' on' : '')} aria-label={sel.pinned ? 'Unpin' : 'Pin'} title={sel.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(sel)}><Ic n="pin" /></button>}
                                {sel.status === 'active' && !sel.gc && <button type="button" className="ch-ib" aria-label="Archive" title="Archive" onClick={() => leave('archive', sel)}><Ic n="archive" /></button>}
                                {sel.status !== 'active' && <button type="button" className="ch-ib" aria-label="Restore" title="Restore" onClick={() => leave('restore', sel)}><Ic n="restore" /></button>}
                                {sel.status !== 'trashed' && !sel.gc && <button type="button" className="ch-ib" aria-label="Move to trash" title="Move to trash" onClick={() => leave('trash', sel)}><Ic n="trash" /></button>}
                                {sel.status === 'trashed' && <button type="button" className="ch-ib" aria-label="Delete forever" title="Delete forever" onClick={() => purge(sel)}><Ic n="trash" /></button>}
                            </div>

                            <div className="ch-scroll" ref={scrollRef}>
                                {!showAll && earlier > 0 && !sel.gc && (
                                    <button type="button" className="ch-more" onClick={() => setExpanded(true)}>Show earlier messages ({earlier})</button>
                                )}
                                {shown.length === 0 && sel.gc && !sel.day && <div className="ch-empty">No messages today. Earlier messages are in History.</div>}
                                {shown.map((m, i) => {
                                    const dk = dayKey(m.created_at);
                                    const showDay = dk !== prevDay;
                                    prevDay = dk;
                                    const admin = m.sender_type === 'admin';
                                    return (
                                        <div key={m.threadId + '-' + (m.id ?? i)} style={{ display: 'contents' }}>
                                            {showDay && <div className="ch-day"><span>{dk === today ? 'Today' : fmtDay(m.created_at)}</span></div>}
                                            <div className={'ch-msg ' + (admin ? 'me' : 'them')}>
                                                {!admin && <div className="ch-who">{sel.gc ? (m.label || 'Volunteer') : (sel.user?.name || 'Volunteer')}</div>}{admin && <div className="ch-who">{m.admin_label || m.admin?.name || 'Red Cross Admin'}{m.id && !sel.key && !sel.gc ? <> &middot; <button type="button" onClick={() => renameSender(m)} style={{ border: 'none', background: 'none', color: '#CC0000', cursor: 'pointer', fontSize: '11px', padding: 0, fontFamily: 'inherit' }}>Edit name</button></> : null}</div>}{renaming && renaming.id === m.id && (<div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '4px', margin: '4px 0', width: '170px' }}><div style={{ padding: '4px 8px', color: '#888', fontSize: '11px' }}>Show this message as</div>{staff.map((s) => (<button key={s} type="button" onClick={() => pickName(m, s)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: m.admin_label === fullLabel(s) ? '#e6f1fb' : 'transparent', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px' }}>{fullLabel(s)}</button>))}<button type="button" onClick={() => setRenaming(null)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '6px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#888' }}>Cancel</button></div>)}
                                                {m.body && <div className="ch-bub">{m.body}</div>}
{m.attachment_path && (() => { const u = m.threadId === 'g' ? route('groupchat.attachment', m.id) : route('admin.communication.attachment', m.id); const mt = m.attachment_mime || ''; return (
<div className="ch-att">
{mt.startsWith('image/') ? <a href={u} target="_blank" rel="noreferrer"><img src={u} alt={m.attachment_name || 'Picture'} /></a>
: mt.startsWith('video/') ? <video src={u} controls preload="metadata" />
: <a className="ch-doc" href={u} target="_blank" rel="noreferrer">{m.attachment_name || 'Open file'}</a>}
</div>); })()}
                                                <div className="ch-time">{fmtTime(m.created_at)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {file && (<div className="ch-file"><span>{file.name}</span><button type="button" onClick={() => setFile(null)}>Remove</button></div>)}
                            <div className="ch-as" style={sel.day ? { display: 'none' } : undefined}>
                                <span>Replying as</span>
                                {sel.key ? <b>Admin {sel.key}</b> : prof ? <b>Admin {prof}</b> : staff.length > 0 ? (<select value={staff.find((s) => s.toLowerCase() === asName.trim().toLowerCase()) || ''} onChange={(e) => changeName(e.target.value)} aria-label="Replying as" style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '4px 8px', fontSize: '12.5px', fontFamily: 'inherit' }}><option value="">Choose your name</option>{staff.map((s) => <option key={s} value={s}>{s}</option>)}</select>) : (<input value={asName} onChange={(e) => changeName(e.target.value)} placeholder="Your name (e.g. Maria)" aria-label="Replying as" maxLength={40} />)}
                            </div>
                            <div className="ch-comp" style={sel.day ? { display: 'none' } : undefined}>
                                <label className="ch-clip" aria-label="Attach a file" title="Attach a picture, video or PDF">
                                    <input type="file" hidden accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const lim = f.type.startsWith('image/') ? 5 : f.type.startsWith('video/') ? 50 : 10; if (f.size / 1048576 > lim) { window.alert('File too large. Limits: pictures 5 MB, videos 50 MB, PDF 10 MB.'); return; } setFile(f); }} />
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                </label>
                                <textarea
                                    rows={1}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                    placeholder="Type your reply"
                                    aria-label="Reply"
                                />
                                <button type="button" className="ch-send" aria-label="Send" onClick={send}><Ic n="send" /></button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}