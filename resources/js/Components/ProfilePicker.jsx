import { useEffect, useMemo, useRef, useState } from 'react';

const RED = '#DC2626';
const FONT = "'Open Sans', sans-serif";
const PALETTE = ['#7C3AED', '#0F766E', '#B45309', '#15803D', '#1D4ED8', '#BE185D'];
const ONLINE_MINUTES = 5;
const STORAGE_KEY = 'profilePicker.lastAdminId';

function colorFor(name = '') {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
}

function minutesSince(iso, now) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, (now - t) / 60000);
}

function plural(n, word) {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function activeLabel(m) {
    if (m === null) return 'Never signed in';
    if (m < ONLINE_MINUTES) return 'Active now';
    if (m < 60) return `Active ${Math.round(m)} min ago`;
    if (m < 1440) return `Active ${plural(Math.round(m / 60), 'hour')} ago`;
    if (m < 10080) return `Active ${plural(Math.round(m / 1440), 'day')} ago`;
    if (m < 43200) return `Active ${plural(Math.round(m / 10080), 'week')} ago`;
    if (m < 525600) return `Active ${plural(Math.round(m / 43200), 'month')} ago`;
    return `Active ${plural(Math.round(m / 525600), 'year')} ago`;
}

function exactTime(iso) {
    if (!iso) return 'No sign-in recorded';
    return new Date(iso).toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

function Avatar({ admin, online, size = 42 }) {
    return (
        <span style={{ position: 'relative', flex: 'none', width: size, height: size }}>
            {admin.avatar ? (
                <img src={admin.avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <span style={{
                    width: size, height: size, borderRadius: '50%', background: colorFor(admin.name),
                    color: '#fff', fontWeight: 600, fontSize: size * 0.38, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    {(admin.name || '?').trim()[0].toUpperCase()}
                </span>
            )}
            <span style={{
                position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: '50%',
                border: '2px solid #fff', boxSizing: 'border-box', background: online ? '#16A34A' : '#B8BDC9',
            }} />
        </span>
    );
}

function Row({ admin, now, featured, shortcut, busy, dimmed, onPick }) {
    const [active, setActive] = useState(false);
    const m = minutesSince(admin.last_seen_at, now);
    const online = m !== null && m < ONLINE_MINUTES;
    const tinted = featured || active;

    return (
        <button
            type="button"
            onClick={() => onPick(admin)}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', minHeight: 60, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                fontFamily: FONT, color: '#1a1a1a', fontSize: 15, outline: 'none',
                background: tinted ? '#FEF2F2' : 'transparent',
                border: `1px solid ${tinted ? '#FECACA' : 'transparent'}`,
                opacity: dimmed ? 0.4 : 1, pointerEvents: dimmed ? 'none' : 'auto',
                transition: 'background .15s, border-color .15s',
            }}
        >
            <Avatar admin={admin} online={online} />
            <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{admin.name}</span>
                <span
                    title={exactTime(admin.last_seen_at)}
                    style={{ display: 'block', fontSize: 12, marginTop: 1, color: online ? '#15803D' : '#5B6170' }}
                >
                    {activeLabel(m)}
                </span>
            </span>
            {busy ? (
                <span style={{
                    width: 18, height: 18, borderRadius: '50%', border: `2px solid #FECACA`,
                    borderTopColor: RED, animation: 'pp-spin .8s linear infinite',
                }} />
            ) : featured ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: RED, borderRadius: 999, padding: '5px 12px' }}>
                    Continue
                </span>
            ) : (
                <>
                    {shortcut ? (
                        <span style={{ fontSize: 11, color: '#5B6170', border: '1px solid #D8DBE2', borderRadius: 6, padding: '1px 7px' }}>
                            {shortcut}
                        </span>
                    ) : null}
                    <span aria-hidden="true" style={{ color: active ? RED : '#5B6170', fontSize: 18, lineHeight: 1 }}>&rsaquo;</span>
                </>
            )}
        </button>
    );
}

const labelStyle = { fontSize: 11, letterSpacing: '0.6px', color: '#5B6170', padding: '14px 12px 4px', fontFamily: FONT };

export default function ProfilePicker({
    admins = [],
    onSelect,
    onAddAdmin,
    footer = 'Secure session \u00b7 Philippine Red Cross',
}) {
    const [query, setQuery] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const inputRef = useRef(null);
    const live = useRef({});

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    const sorted = useMemo(() => (
        [...admins].sort((a, b) => (new Date(b.last_seen_at || 0)) - (new Date(a.last_seen_at || 0)))
    ), [admins]);

    const lastUsed = useMemo(() => {
        let saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
        return sorted.find((a) => String(a.id) === saved) || sorted[0] || null;
    }, [sorted]);

    const others = useMemo(() => sorted.filter((a) => a !== lastUsed), [sorted, lastUsed]);

    const q = query.trim().toLowerCase();
    const matches = (a) => a.name.toLowerCase().includes(q);
    const showLast = lastUsed && matches(lastUsed);
    const shownOthers = others.filter(matches);
    const onlineCount = admins.filter((a) => {
        const m = minutesSince(a.last_seen_at, now);
        return m !== null && m < ONLINE_MINUTES;
    }).length;

    const pick = async (admin) => {
        if (busyId !== null) return;
        setBusyId(admin.id);
        setMessage({ kind: 'info', text: `Signing in as ${admin.name}\u2026` });
        try {
            await onSelect?.(admin);
            try { localStorage.setItem(STORAGE_KEY, String(admin.id)); } catch (e) { /* ignore */ }
            setMessage({ kind: 'ok', text: `Welcome back, ${admin.name.split(' ')[0]}` });
            setTimeout(() => { setBusyId(null); setMessage(null); }, 1800);
        } catch (e) {
            setMessage({ kind: 'error', text: "Couldn't continue. Try again." });
            setBusyId(null);
        }
    };

    live.current = { lastUsed, shownOthers, pick };

    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const { lastUsed: lu, shownOthers: so, pick: doPick } = live.current;
            if (e.target === inputRef.current) {
                if (e.key === 'Escape') { setQuery(''); inputRef.current.blur(); }
                return;
            }
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === '/') { e.preventDefault(); inputRef.current?.focus(); return; }
            if (e.key === 'Enter' && lu && e.target.tagName !== 'BUTTON') { doPick(lu); return; }
            const k = parseInt(e.key, 10);
            if (k >= 1 && k <= so.length) doPick(so[k - 1]);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const messageColor = message?.kind === 'ok' ? '#15803D' : message?.kind === 'error' ? '#B91C1C' : '#5B6170';

    return (
        <div style={{
            width: '100%', maxWidth: 420, boxSizing: 'border-box', background: '#fff', borderRadius: 18,
            border: '1px solid #f0f0f0', padding: '26px 12px 14px', fontFamily: FONT,
        }}>
            <style>{'@keyframes pp-spin{to{transform:rotate(360deg)}}'}</style>

            <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Who's using this?</h1>
                <p style={{ margin: '4px 0 10px', fontSize: 14, color: '#5B6170' }}>Select your profile to continue</p>
                {onlineCount > 0 && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#15803D',
                        background: '#F0FDF4', borderRadius: 999, padding: '3px 10px',
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} />
                        {onlineCount} {onlineCount === 1 ? 'admin' : 'admins'} online now
                    </span>
                )}
            </div>

            <div style={{ margin: '16px 4px 0' }}>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search admins  (press / )"
                    aria-label="Search admins"
                    style={{
                        width: '100%', boxSizing: 'border-box', height: 40, padding: '0 14px', fontFamily: FONT,
                        fontSize: 14, border: '1px solid #D8DBE2', borderRadius: 10, background: '#F7F7F9', outline: 'none',
                    }}
                />
            </div>

            {showLast && (
                <>
                    <div style={labelStyle}>LAST USED</div>
                    <Row
                        admin={lastUsed} now={now} featured onPick={pick}
                        busy={busyId === lastUsed.id} dimmed={busyId !== null && busyId !== lastUsed.id}
                    />
                </>
            )}

            {shownOthers.length > 0 && (
                <>
                    <div style={labelStyle}>OTHER ADMINS &middot; MOST RECENT FIRST</div>
                    {shownOthers.map((a, i) => (
                        <Row
                            key={a.id} admin={a} now={now} shortcut={i < 9 ? i + 1 : null} onPick={pick}
                            busy={busyId === a.id} dimmed={busyId !== null && busyId !== a.id}
                        />
                    ))}
                </>
            )}

            {!showLast && shownOthers.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 14, color: '#5B6170', padding: '18px 0', margin: 0 }}>
                    No admin matches that name.
                </p>
            )}

            {onAddAdmin && (
                <>
                    <div style={{ height: 1, background: '#EEF0F4', margin: '8px 12px' }} />
                    <button
                        type="button"
                        onClick={onAddAdmin}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '8px 12px',
                            background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT,
                            fontSize: 15, fontWeight: 600, color: '#1a1a1a', textAlign: 'left',
                        }}
                    >
                        <span style={{
                            width: 42, height: 42, borderRadius: '50%', border: '1.5px dashed #9AA0AE', color: '#5B6170',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>+</span>
                        Add admin
                    </button>
                </>
            )}

            <p aria-live="polite" style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 12, color: messageColor }}>
                {message ? message.text : footer}
            </p>
        </div>
    );
}