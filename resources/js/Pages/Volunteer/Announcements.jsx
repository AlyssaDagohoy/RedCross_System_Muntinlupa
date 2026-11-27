import { useState } from 'react';
import VolunteerShell from '../../Components/VolunteerShell';

const isNew = (d) => Date.now() - new Date(d).getTime() < 7 * 86400000;
const shortDay = (d) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (e) { return ''; }
};
const fullDay = (d) => {
    try {
        const t = new Date(d);
        const a = t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const b = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return a + ', ' + b;
    } catch (e) { return ''; }
};
const poster = (a) =>
    a.posted_by || a.author_name || (a.author && a.author.name) || (a.user && a.user.name) || 'Red Cross Admin';

const Megaphone = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
);

export default function VolunteerAnnouncements({ auth, announcements = [] }) {
    const [selId, setSelId] = useState(announcements.length ? announcements[0].id : null);
    const sel = announcements.find((a) => a.id === selId) || announcements[0];

    return (
        <VolunteerShell active="announcements" title="Announcements" notifications={[]}>
            <style>{`
.an-split{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,8fr);gap:14px;align-items:start}
@media (max-width:700px){.an-split{grid-template-columns:minmax(0,1fr)}}
.an-card{background:#fff;border:1px solid #ebebeb;border-radius:14px;overflow:hidden}
.an-h{font-size:15px;font-weight:600;color:#111;padding:14px 16px 6px}
.an-li{display:flex;align-items:center;gap:10px;width:calc(100% - 12px);margin:3px 6px;padding:10px;border:0;border-radius:10px;background:transparent;text-align:left;cursor:pointer;font-family:inherit}
.an-li:hover{background:#f7f7f8}
.an-li.on{background:#f3f4f6}
.an-ic{width:32px;height:32px;border-radius:50%;background:#fbeaea;color:#CC0000;display:flex;align-items:center;justify-content:center;flex:none}
.an-mid{min-width:0;flex:1}
.an-r1{display:flex;align-items:center;gap:6px}
.an-t{font-size:14px;font-weight:600;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.an-dot{width:8px;height:8px;border-radius:50%;background:#CC0000;flex:none}
.an-pv{font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.an-dt{font-size:12px;color:#999;flex:none}
.an-dh{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #ebebeb}
.an-dt1{font-size:15px;font-weight:600;color:#111}
.an-dm{font-size:12px;color:#888;margin-top:1px}
.an-tag{margin-left:auto;font-size:11px;font-weight:600;background:#fbeaea;color:#8c1d1d;border-radius:10px;padding:2px 9px;flex:none}
.an-pin{font-size:11px;font-weight:600;background:#f3f4f6;color:#555;border-radius:10px;padding:2px 9px;flex:none}
.an-body{white-space:pre-wrap;font-size:13.5px;color:#222;line-height:1.65;padding:16px;min-height:90px}
.an-empty{padding:32px 16px;text-align:center;color:#777;font-size:13.5px}
            `}</style>
            {announcements.length === 0 ? (
                <div className="an-card">
                    <div className="an-empty">No announcements yet.</div>
                </div>
            ) : (
                <div className="an-split">
                    <div className="an-card">
                        <div className="an-h">Announcements</div>
                        <div style={{ paddingBottom: 6 }}>
                            {announcements.map((a) => (
                                <button key={a.id} type="button" className={'an-li' + (sel && sel.id === a.id ? ' on' : '')} onClick={() => setSelId(a.id)}>
                                    <span className="an-ic"><Megaphone /></span>
                                    <span className="an-mid">
                                        <span className="an-r1">
                                            <span className="an-t">{a.title}</span>
                                            {isNew(a.created_at) && <span className="an-dot" />}
                                        </span>
                                        <span className="an-pv" style={{ display: 'block' }}>{a.body}</span>
                                    </span>
                                    <span className="an-dt">{shortDay(a.created_at)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="an-card">
                        <div className="an-dh">
                            <span className="an-ic"><Megaphone /></span>
                            <div style={{ minWidth: 0 }}>
                                <div className="an-dt1">{sel.title}</div>
                                <div className="an-dm">Posted by {poster(sel)} · {fullDay(sel.created_at)}</div>
                            </div>
                            {sel.pinned_at && <span className="an-pin" style={{ marginLeft: 'auto' }}>Pinned</span>}
                            <span className="an-tag" style={sel.pinned_at ? { marginLeft: 6 } : undefined}>Announcement</span>
                        </div>
                        <div className="an-body">{sel.body}</div>
                    </div>
                </div>
            )}
        </VolunteerShell>
    );
}