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
                <div className="notif-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div>
                        <p style={{ fontSize: '13.5px', color: '#888', marginTop: '4px' }}>
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : "You're all caught up."}
                        </p>
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            className={`filter-btn${filter === f.key ? ' active' : ''}`}
                            style={{
                                padding: '8px 14px', fontSize: '12.5px', fontWeight: '600', fontFamily: 'inherit',
                                borderRadius: '999px', cursor: 'pointer',
                            }}
                        >
                            {f.label} {counts[f.key] > 0 && <span style={{ opacity: 0.6 }}>· {counts[f.key]}</span>}
                        </button>
                    ))}
                </div>

                {/* List */}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map((n) => (
                            <NotificationCard key={n.id} n={n} onOpen={() => handleOpen(n)} />
                        ))}
                    </div>
                )}
            </div>
        </VolunteerShell>
    );
}

function NotificationCard({ n, onOpen }) {
    return (
        <button
            type="button"
            className="notif-card"
            onClick={onOpen}
            style={{
                width: '100%', display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left',
                padding: '15px 16px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid #ebebeb', background: n.read ? 'white' : '#fdf8f8',
                borderLeft: n.read ? '1px solid #ebebeb' : '3px solid #CC0000',
            }}
        >
            <span style={{ marginTop: '2px', flexShrink: 0 }}><CategoryIcon category={n.category} /></span>

            <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: n.read ? '500' : '700', color: '#141414' }}>
                        {n.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#bbb' }}>{formatRelativeTime(n.created_at)}</span>
                </span>
                <span style={{ display: 'block', fontSize: '12.5px', color: '#777', marginTop: '3px' }}>
                    {n.message}
                </span>
                {n.action_label && (
                    <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: '600', color: '#CC0000', marginTop: '8px' }}>
                        {n.action_label} →
                    </span>
                )}
            </span>

            {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#CC0000', flexShrink: 0, marginTop: '6px' }} />}
        </button>
    );
}
