import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import VolunteerShell from '@/Components/VolunteerShell';

/* ------------------------------------------------------------------ */
/*  Notifications — full history page, same simple card-list style     */
/*  as My Records. Filters by category, unread ones are visually       */
/*  distinct (left bar + bold title), and clicking a card marks it     */
/*  read and follows its action link.                                  */
/*                                                                      */
/*  Fed by a NotificationsController@index, expected shape:            */
/*    notifications: [{ id, category: 'activity'|'attendance'|'system',*/
/*                       title, message, action_label, action_url,     */
/*                       read, created_at }]                           */
/*  arranged newest first.                                             */
/*                                                                      */
/*  onMarkAsRead(id) / onMarkAllAsRead() are passed in from the parent  */
/*  so this component stays agnostic to how the request is made        */
/*  (Inertia router.patch, fetch, etc). If omitted, the page still      */
/*  renders and just won't persist read state.                         */
/* ------------------------------------------------------------------ */

const CATEGORY_LABEL = { activity: 'Activities', attendance: 'Attendance', system: 'System' };

const formatRelativeTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function CategoryIcon({ category }) {
    const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (category === 'attendance') {
        return <svg {...common} stroke="#1a8a3d"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
    }
    if (category === 'system') {
        return <svg {...common} stroke="#8a5cd6"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>;
    }
    return <svg {...common} stroke="#CC0000"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
}

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'activity', label: 'Activities' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'system', label: 'System' },
];

export default function Notifications({ notifications = [] }) {
    const [filter, setFilter] = useState('all');

    const onMarkAsRead = (id) => {
        router.patch(route('notifications.read', id), {}, { preserveScroll: true });
    };

    const onMarkAllAsRead = () => {
        router.patch(route('notifications.read-all'), {}, { preserveScroll: true });
    };

    const filtered = useMemo(() => {
        if (filter === 'all') return notifications;
        return notifications.filter((n) => n.category === filter);
    }, [notifications, filter]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const counts = useMemo(() => {
        const c = { all: notifications.length, activity: 0, attendance: 0, system: 0 };
        notifications.forEach((n) => { if (c[n.category] !== undefined) c[n.category] += 1; });
        return c;
    }, [notifications]);

    const handleOpen = (n) => {
        if (!n.read) onMarkAsRead?.(n.id);
        if (n.action_url) window.location.href = n.action_url;
    };

    return (
        <VolunteerShell active="notifications" title="Notifications">
            <style>{`
                .notif-card:hover { border-color: #d8d8d8; }
                .notif-card:active { background: #fafafa; }
                .filter-btn { border: 1px solid #ebebeb; background: white; color: #666; }
                .filter-btn.active { border-color: #CC0000; background: #CC0000; color: white; }
                @media (max-width: 480px) {
                    .notif-header-row { flex-direction: column; align-items: flex-start !important; gap: 10px !important; }
                }
            `}</style>

            <div>

                {/* Header */}
                <div className="notif-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: unreadCount > 0 ? '18px' : '0' }}>
                    <div>
                        {unreadCount > 0 && (
                            <p style={{ fontSize: '13.5px', color: '#888', marginTop: '4px' }}>
                                {`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => onMarkAllAsRead?.()}
                            style={{
                                padding: '9px 14px', fontSize: '12.5px', fontWeight: '600', fontFamily: 'inherit',
                                border: '1px solid #ebebeb', borderRadius: '10px', background: 'white', color: '#333', cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                    {FILTERS.map((f) => {
                        const active = filter === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setFilter(f.key)}
                                style={{
                                    padding: active ? '9px 14px' : '8px 14px', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit',
                                    color: active ? '#555' : '#999', background: active ? 'white' : '#f7f7f8',
                                    border: '1px solid #ebebeb', borderBottom: active ? '1px solid white' : 'none',
                                    borderRadius: '8px 8px 0 0', cursor: 'pointer', whiteSpace: 'nowrap',
                                    position: 'relative', zIndex: active ? 2 : 1, marginBottom: active ? '-1px' : '0',
                                }}
                            >
                                {f.label} {counts[f.key] > 0 && <span style={{ opacity: 0.6 }}>· {counts[f.key]}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                <div className="notif-rows" style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: '0 10px 10px 10px', overflow: 'hidden', marginBottom: '8px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '56px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                                No notifications
                            </div>
                            <p style={{ fontSize: '13px', color: '#aaa' }}>
                                {filter === 'all' ? "You don't have any notifications yet." : `No ${CATEGORY_LABEL[filter].toLowerCase()} notifications yet.`}
                            </p>
                        </div>
                    ) : (
                        filtered.map((n, i) => (
                            <NotificationCard key={n.id} n={n} first={i === 0} onOpen={() => handleOpen(n)} />
                        ))
                    )}
                </div>
            </div>
        </VolunteerShell>
    );
}

function NotificationCard({ n, onOpen, first }) {
    const t = String(n.title || '').toLowerCase();
    const kind = t.startsWith('timed out') ? 'out' : t.startsWith('timed in') ? 'in' : n.category;
    const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const STYLES = {
        in: { bg: '#E4F4EC', c: '#1E7F55', icon: <svg {...common} stroke="#1E7F55"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg> },
        out: { bg: '#FBE9E9', c: '#B92F2F', icon: <svg {...common} stroke="#B92F2F"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg> },
        attendance: { bg: '#E4F4EC', c: '#1E7F55', icon: <svg {...common} stroke="#1E7F55"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg> },
        system: { bg: '#F1EBFB', c: '#8a5cd6', icon: <svg {...common} stroke="#8a5cd6"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg> },
        activity: { bg: '#FBE9E9', c: '#CC0000', icon: <svg {...common} stroke="#CC0000"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg> },
    };
    const s = STYLES[kind] || STYLES.activity;
    const BADGE = {
        in: { bg: '#2E9E6B', icon: <g><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></g> },
        out: { bg: '#B92F2F', icon: <g><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></g> },
        other: { bg: '#6b7280', icon: <g><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></g> },
    };
    const bd = BADGE[kind === 'in' || kind === 'out' ? kind : 'other'];
    return (
        <button
            type="button"
            className="notif-card"
            onClick={onOpen}
            style={{
                width: '100%', display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left',
                padding: '13px 16px', borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
                border: 'none', borderTop: first ? 'none' : '1px solid #f0f0f0', background: n.read ? 'white' : '#fdf8f8',
            }}
        >
            <span style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0, display: 'block' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <img src="/images/redcross_logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px', boxSizing: 'border-box' }} />
                </span>
                <span style={{ position: 'absolute', right: '-3px', bottom: '-3px', width: '20px', height: '20px', borderRadius: '50%', background: bd.bg, border: '2px solid #fff', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{bd.icon}</svg>
                </span>
            </span>

            <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: n.read ? '500' : '700', color: '#141414' }}>
                    {n.title}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: '#777', marginTop: '2px' }}>
                    {n.message}
                </span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap' }}>{formatRelativeTime(n.created_at)}</span>
                {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#CC0000' }} />}
            </span>
        </button>
    );
}
