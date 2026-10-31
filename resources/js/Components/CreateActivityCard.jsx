import { Link } from '@inertiajs/react';

export default function CreateActivityCard() {
    const lift = (e, y) => { e.currentTarget.style.transform = `translateY(${y}px)`; };
    return (
        <div style={{ margin: 0, background: '#A32D2D', borderRadius: 12, padding: 14, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'absolute', right: -34, top: -34, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', right: -6, top: -6, width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#F7C1C1', fontSize: 12, position: 'relative' }}>Next activity</span>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 500, lineHeight: 1.3, position: 'relative' }}>Plan a new event for your volunteers</span>
            <Link
                href={route('admin.activities.create')}
                onMouseEnter={(e) => lift(e, -2)}
                onMouseLeave={(e) => lift(e, 0)}
                style={{ position: 'relative', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#A32D2D', fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 999, textDecoration: 'none', transition: 'transform .15s' }}
            >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create
            </Link>
        </div>
    );
}