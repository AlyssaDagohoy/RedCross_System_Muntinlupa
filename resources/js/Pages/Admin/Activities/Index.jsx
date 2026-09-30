import { Head, Link, router } from '@inertiajs/react';

/* ------------------------------------------------------------------ */
/*  Activities list — restyled to match Create/Edit and the rest of    */
/*  the portal (white cards, #ebebeb borders, #CC0000 accent, Inter).  */
/*  No behavior changes: same delete confirm, same status source.      */
/* ------------------------------------------------------------------ */

const STATUS_STYLE = {
    upcoming:  { bg: '#eaf1fd', color: '#1d4ed8' },
    ongoing:   { bg: '#e9f8ee', color: '#1a8a3d' },
    completed: { bg: '#f0f0f1', color: '#666' },
    cancelled: { bg: '#fdeaea', color: '#CC0000' },
};

export default function Index({ activities }) {
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this activity?')) {
            router.delete(route('admin.activities.destroy', id));
        }
    };

    return (
        <>
            <Head title="Activities" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                body { background: #f7f7f8; }
                .act-card:hover { border-color: #d8d8d8 !important; }
                .act-edit-btn:hover { background: #eeeeee !important; }
                .act-delete-btn:hover { background: #fbdada !important; }
                .act-new-btn:hover { background: #aa0000 !important; }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#f7f7f8', fontFamily: "'Inter', sans-serif", padding: '32px 20px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#141414', margin: 0 }}>Activities</h1>
                            <p style={{ color: '#999', marginTop: '4px', fontSize: '13px' }}>Manage all Red Cross activities</p>
                        </div>
                        <Link
                            href={route('admin.activities.create')}
                            className="act-new-btn"
                            style={{
                                background: '#CC0000', color: 'white', padding: '10px 18px', borderRadius: '10px',
                                textDecoration: 'none', fontWeight: '600', fontSize: '12.5px', whiteSpace: 'nowrap',
                            }}
                        >
                            + New Activity
                        </Link>
                    </div>

                    {activities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px 16px', background: 'white', borderRadius: '14px', border: '1px solid #ebebeb' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>No activities yet</p>
                            <Link href={route('admin.activities.create')} style={{ color: '#CC0000', fontSize: '13px', fontWeight: '500' }}>Create your first activity</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {activities.map((activity) => {
                                const statusStyle = STATUS_STYLE[activity.status] ?? STATUS_STYLE.completed;
                                return (
                                    <div key={activity.id} className="act-card" style={{
                                        background: 'white', border: '1px solid #ebebeb', borderRadius: '14px', padding: '18px 20px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                                    }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#141414', margin: 0 }}>{activity.name}</h2>
                                                <span style={{
                                                    background: statusStyle.bg, color: statusStyle.color,
                                                    padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize',
                                                }}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                            <p style={{ color: '#888', margin: '0 0 3px', fontSize: '12.5px' }}>
                                                {activity.date} · {activity.start_time}–{activity.end_time}
                                            </p>
                                            <p style={{ color: '#888', margin: '0 0 3px', fontSize: '12.5px' }}>
                                                📍 {activity.location_name}
                                            </p>
                                            <p style={{ color: '#888', margin: 0, fontSize: '12.5px' }}>
                                                👥 {activity.volunteers?.length ?? 0} volunteer{(activity.volunteers?.length ?? 0) === 1 ? '' : 's'} assigned
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <Link
                                                href={route('admin.activities.edit', activity.id)}
                                                className="act-edit-btn"
                                                style={{
                                                    background: '#f5f5f5', color: '#333', padding: '8px 16px', borderRadius: '9px',
                                                    textDecoration: 'none', fontSize: '12.5px', fontWeight: '500',
                                                }}
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(activity.id)}
                                                className="act-delete-btn"
                                                style={{
                                                    background: '#fdeaea', color: '#CC0000', padding: '8px 16px', borderRadius: '9px',
                                                    border: 'none', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
