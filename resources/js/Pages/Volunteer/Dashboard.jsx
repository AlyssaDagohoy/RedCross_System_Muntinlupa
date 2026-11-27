import { Link, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import VolunteerShell, { safeRoute, useVolunteerShell, faceStatusLabel } from '../../Components/VolunteerShell';
import { AttendanceCapture, RingClockButton, RunningTimer } from '../../Components/FaceAttendance';
import TimeInSuccessModal from '../../Components/TimeInSuccessModal';

export default function VolunteerDashboard({ auth, totalHours, totalDays, monthDays, attendedCount, missedCount, monthHours, todayHours, lastMonthDone, lastMonthAttended, lastMonthMissed, monthAttended, fieldAttended, branchAttended, longestStreak, currentStreak, monthDone, monthScheduled, recordsTotal, assignedActivities, recentAttendance, todayAttendance }) {
    const activitiesList = assignedActivities || [];
    const attendance = (recentAttendance || [])
        .filter(rec => new Date(rec.date).toDateString() !== new Date().toDateString() || !!rec.time_out || ['absent', 'cancelled', 'needs_review'].includes(rec.status)).filter(rec => !!rec.hours_rendered || !!rec.time_out || rec.status === 'cancelled' || rec.status === 'absent' || rec.status === 'needs_review')
        .slice(0, 5);

    const todayRecords = todayAttendance || [];
    const attendanceFor = (act) => todayRecords.find(rec => rec.activity_id === act.id) || null;
    const isOngoing = (rec) => !!rec?.time_in && !rec?.time_out && rec?.status !== 'needs_review';
    const isCompleted = (rec) => !!rec?.time_out;

    const todayActivities = activitiesList
        .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
        .filter(a => !['absent', 'needs_review'].includes(attendanceFor(a)?.status) && !isCompleted(attendanceFor(a)))
        .sort((a, b) => {
            const aOngoing = isOngoing(attendanceFor(a)) ? 1 : 0;
            const bOngoing = isOngoing(attendanceFor(b)) ? 1 : 0;
            if (bOngoing !== aOngoing) return bOngoing - aOngoing;
            const tm = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : 99999; };
            return tm(a.start_time) - tm(b.start_time);
        });

    // Upcoming: only the next 3 activities are shown; the rest live behind "View All"
    const upcomingActivities = activitiesList.filter(a => new Date(a.date) >= new Date(new Date().setHours(24, 0, 0, 0))).slice(0, 3);

    const [activeCapture, setActiveCapture] = useState(null);
    // Inline-expanded item. Keys are namespaced ("today-<id>" / "up-<id>" / "rec-<index>") so
    // items from different cards can never open each other.
    const [openKey, setOpenKeyRaw] = useState(() => { try { const v = sessionStorage.getItem('dash_open_key'); return v === null ? null : JSON.parse(v); } catch (e) { return null; } }); const setOpenKey = (v) => setOpenKeyRaw((cur) => { const n = typeof v === 'function' ? v(cur) : v; try { if (n === null || n === undefined) sessionStorage.removeItem('dash_open_key'); else sessionStorage.setItem('dash_open_key', JSON.stringify(n)); } catch (e) {} return n; });
    const toggleOpen = (key) => setOpenKey((cur) => (cur === key ? null : key));
    const [successInfo, setSuccessInfo] = useState(null);
    const isMobile = useIsMobile();
    const isPhone = useIsMobile(600);
    const [mobileTab, setMobileTab] = useState('today');
    // Reminders card: what the volunteer still needs to do
    const reminders = (() => {
        const list = [];
        const nowD = new Date();
        const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
        const toMinR = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
        const fmtR = (t) => { const m = toMinR(t); if (m == null) return ''; const h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
        todayActivities.forEach((a) => {
            if (attendanceFor(a)?.time_in) return;
            const s = toMinR(a.start_time);
            const e = toMinR(a.end_time);
            if (s == null || (e != null && nowMin >= e)) return;
            const open = () => {
                setMobileTab('today');
                setOpenKey(`today-${a.id}`);
                if (isPhone) window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            list.push(nowMin >= s
                ? { key: `in-${a.id}`, tone: 'red', text: `Time In for ${a.name} (started ${fmtR(a.start_time)})`, onClick: open }
                : { key: `in-${a.id}`, tone: 'amber', text: `${a.name} starts at ${fmtR(a.start_time)}`, onClick: open });
        });
        const review = (recentAttendance || []).filter((r) => r.status === 'needs_review').length;
        if (review > 0) list.push({ key: 'review', tone: 'amber', text: `${review} attendance record${review !== 1 ? 's' : ''} under admin review`, href: route('volunteer.records') });
        return list;
    })();

    const handleCaptureSuccess = () => {
        const act = activitiesList.find(a => a.id === activeCapture?.activityId);
        setSuccessInfo({
            mode: activeCapture?.mode,
            activityName: act?.name || 'the activity',
        });
        setActiveCapture(null);
        router.reload({ only: ['todayAttendance', 'recentAttendance', 'totalHours', 'totalDays', 'monthDays', 'attendedCount', 'missedCount', 'monthHours', 'todayHours', 'lastMonthDone', 'lastMonthAttended', 'lastMonthMissed', 'monthAttended', 'fieldAttended', 'branchAttended', 'longestStreak', 'currentStreak', 'monthDone', 'monthScheduled', 'recordsTotal'] });
    };

    return (
        <VolunteerShell active="dashboard" title="Dashboard">

            {isPhone ? (
                <>
                    <SetupStatus compact />
                    <PhoneClockCard activities={todayActivities} attendanceFor={attendanceFor} onStart={(activity, mode) => setActiveCapture({ activityId: activity.id, mode })} />
                </>
            ) : (<SetupStatus compact />)}

            {!isPhone && <TimedInCard activities={todayActivities} attendanceFor={attendanceFor} onStart={(activity, mode) => setActiveCapture({ activityId: activity.id, mode })} />}
            {isMobile && <RemindersCard reminders={reminders} />}

            <RingCards
                compact={isMobile}
                totalHours={totalHours}
                attendedCount={attendedCount}
                missedCount={missedCount}
                monthHours={monthHours} todayHours={todayHours} fieldAttended={fieldAttended} branchAttended={branchAttended} lastMonthDone={lastMonthDone} lastMonthAttended={lastMonthAttended} lastMonthMissed={lastMonthMissed}
                monthDone={monthDone}
                monthScheduled={monthScheduled}
                longestStreak={longestStreak}
                currentStreak={currentStreak}
            />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px', gap: '16px', marginBottom: '20px', alignItems: 'start' }}>
                <div style={{ minWidth: 0 }}>
                    <div role="tablist" style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', paddingLeft: '0px' }}>
                        {[['today', "Today's tasks", todayActivities.length], ['upcoming', 'Upcoming tasks', upcomingActivities.length]].map(([k, label, count]) => (
                            <button key={k} type="button" role="tab" aria-selected={mobileTab === k} onClick={() => setMobileTab(k)} style={{
                                position: 'relative', zIndex: mobileTab === k ? 2 : 1, marginBottom: mobileTab === k ? '-1px' : '0',
                                border: '1px solid #ebebeb',
                                borderBottom: mobileTab === k ? '1px solid white' : 'none',
                                borderRadius: '8px 8px 0 0', background: mobileTab === k ? 'white' : '#f7f7f8',
                                padding: mobileTab === k ? '9px 14px' : '8px 14px', fontSize: '12px', fontWeight: '600', color: mobileTab === k ? '#555' : '#999',
                                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '7px',
                            }}>{label} ({count})</button>
                        ))}
                    </div>










                <div style={{ background: 'white', borderRadius: '0 10px 10px 10px', border: '1px solid #ebebeb', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden', display: (mobileTab !== 'today') ? 'none' : 'flex', flexDirection: 'column' }}>
                    {todayActivities.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#ccc' }}>No tasks scheduled for today</div>
                        </div>
                    ) : (
                        todayActivities.map((act, i) => {
                            const key = `today-${act.id}`;
                            const isOpen = openKey === key;
                            return (
                                <div
                                    key={act.id}
                                    style={{ borderBottom: i < todayActivities.length - 1 ? '1px solid #f5f5f5' : 'none' }}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggleOpen(key)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleOpen(key); }}
                                        className="task-row"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                            padding: '12px 18px', cursor: 'pointer',
                                            transition: 'background 0.1s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#111' }}>{act.name}</span>
                                                    {isOngoing(attendanceFor(act)) && (
                                                        <span style={{ fontSize: '9px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', background: '#fffbeb', color: '#b45309' }}>
                                                            Ongoing
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#CC0000' }}>
                                                    {isOpen ? 'Hide details' : 'Show details'}
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="m6 9 6 6 6-6" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                                            {/* stopPropagation para hindi mag-toggle yung expand kapag Time In/Out ang pinindot */}
                                            {!isPhone && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                >
                                                    <TaskAttendanceButton
                                                        act={act}
                                                        record={attendanceFor(act)}
                                                        onStart={(activity, mode) => setActiveCapture({ activityId: activity.id, mode })}
                                                    />
                                                </div>
                                            )}
                                            
                                        </div>
                                    </div>
                                    {isOpen && (
                                        <div style={{ padding: '0 18px 14px' }}>
                                            <ActivityDetails act={act} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {/* Footer "View All" — goes to the Schedule page (Assigned tab, default) */}
                    <div style={{ marginTop: 'auto', padding: '10px 18px', borderTop: '1px solid #f5f5f5', textAlign: 'center' }}>
                        <Link href={route('volunteer.schedule')} style={{ fontSize: '10.5px', color: '#333', fontWeight: '400', textDecoration: 'none' }}>
                            View All
                        </Link>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '0 10px 10px 10px', border: '1px solid #ebebeb', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden', display: (mobileTab !== 'upcoming') ? 'none' : 'flex', flexDirection: 'column' }}>
                    {upcomingActivities.length === 0 ? (
                        <div style={{ padding: isMobile ? '16px' : '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#ccc' }}>No upcoming tasks</div>
                        </div>
                    ) : (
                        <div style={{ padding: '4px 0' }}>
                            {upcomingActivities.map((act, i) => {
                                const key = `up-${act.id}`;
                                const isOpen = openKey === key;
                                return (
                                    <div
                                        key={act.id}
                                        style={{ borderBottom: i < upcomingActivities.length - 1 ? '1px solid #f8f8f8' : 'none' }}
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleOpen(key)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleOpen(key); }}
                                            className="task-row"
                                            style={{ padding: '12px 18px', cursor: 'pointer', transition: 'background 0.1s' }}
                                        >
                                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#111' }}>{act.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#CC0000' }}>
                                                {isOpen ? 'Hide details' : 'Show details'}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="m6 9 6 6 6-6" /></svg>
                                            </div>
                                        </div>
{isOpen && (
                                            <div style={{ padding: '0 18px 14px' }}>
                                                <ActivityDetails act={act} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Footer "View All" — goes to the Schedule page, landing directly on the Upcoming tab */}
                    <div style={{ marginTop: 'auto', padding: '10px 18px', borderTop: '1px solid #f5f5f5', textAlign: 'center' }}>
                        <Link href={route('volunteer.schedule', { tab: 'upcoming' })} style={{ fontSize: '10.5px', color: '#333', fontWeight: '400', textDecoration: 'none' }}>
                            View All
                        </Link>
                    </div>
                </div>
                </div>
                {!isMobile && (
                    <div style={{ paddingTop: '32px' }}>
                        <RemindersCard reminders={reminders} />
                    </div>
                )}
            </div>

            <RecentRecordsCard recordsTotal={recordsTotal} attendance={attendance} isMobile={isMobile} openKey={openKey} toggleOpen={toggleOpen} />

            {activeCapture && (
                <AttendanceCapture
                    mode={activeCapture.mode}
                    activityId={activeCapture.activityId}
                    onClose={() => setActiveCapture(null)}
                    onSuccess={handleCaptureSuccess}
                />
            )}

            <TimeInSuccessModal
                open={!!successInfo}
                type={successInfo?.mode === 'checkout' ? 'out' : 'in'}
                onClose={() => setSuccessInfo(null)}
            />

        </VolunteerShell>
    );
}

function RcElapsed({ since }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const ms = now - new Date(since).getTime();
    const s = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;
    const pad = (n) => String(n).padStart(2, '0');
    return <>{`${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`}</>;
}

// Phone-only (600px and below) big round Time In / Time Out button.
// Same rules and same onStart handler as TaskAttendanceButton, so the check-in flow is unchanged.
function PhoneClockCard({ activities, attendanceFor, onStart }) {
    const { setup } = useVolunteerShell();
    const faceReady = !!setup.face_done;
    const [pickedId, setPickedId] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const [open, setOpen] = useState(true);

    const act = activities.find(a => String(a.id) === String(pickedId)) || activities[0] || null;
    const record = act ? attendanceFor(act) : null;
    const timedIn = !!record?.time_in && !record?.time_out;

    useEffect(() => {
        if (!timedIn) return undefined;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [timedIn]);

    const DASH = '\u2014';
    const card = { background: 'white', borderRadius: '12px', border: '1px solid #ebebeb', padding: '16px', marginBottom: '12px' };
    const dateText = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });

    const dateRow = (
        <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#777', marginBottom: '12px' }}>{dateText}</div>
    );

    if (!act) {
        return (
            <>
                <div style={{ ...card, textAlign: 'center', padding: '28px 16px' }}>
                    {dateRow}
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Nothing to check in for today</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>New tasks will show up here.</div>
                </div>
            </>
        );
    }

    const pad = (n) => String(n).padStart(2, '0');
    const startedAt = timedIn ? new Date(record.time_in).getTime() : NaN;
    const elapsedSec = Number.isFinite(startedAt) ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
    const clock = `${Math.floor(elapsedSec / 3600)}:${pad(Math.floor((elapsedSec % 3600) / 60))}:${pad(elapsedSec % 60)}`;
    const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
    const fmt12 = (t) => { const m = toMin(t); if (m == null) return DASH; const h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${pad(m % 60)} ${h >= 12 ? 'PM' : 'AM'}`; };
    const sMin = toMin(act.start_time);
    const eMin = toMin(act.end_time);
    const planned = sMin != null && eMin != null && eMin > sMin ? (eMin - sMin) * 60 : 0;
    const progress = timedIn && planned ? Math.min(1, elapsedSec / planned) : 0;
    const R = 76;
    const C = 2 * Math.PI * R;
    const label = timedIn ? 'Time Out' : 'Time In';
    const leftLabel = timedIn ? 'Time in' : 'Starts';
    const leftValue = timedIn
        ? (Number.isFinite(startedAt) ? new Date(startedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : DASH)
        : fmt12(act.start_time);

    return (
        <>
            <div style={{ ...card, cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(o => !o)}>
                <button type="button" aria-expanded={open} aria-label={open ? 'Collapse card' : 'Expand card'} onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'none', border: 'none', padding: 0, marginBottom: open ? '14px' : 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.name}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: (!open && timedIn) ? '#CC0000' : '#888', marginTop: '2px' }}>
                            {open ? dateText : (timedIn ? `On duty \u00B7 ${clock}` : 'Not started yet')}
                        </span>
                    </span>
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f5f5f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points={open ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} /></svg>
                    </span>
                </button>
                <div style={{ display: open ? 'block' : 'none' }}>
                {activities.length > 1 && (
                    <label onClick={(e) => e.stopPropagation()} style={{ display: 'block', marginBottom: '14px' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px' }}>Switch activity</span>
                        <select value={act.id} onChange={(e) => setPickedId(e.target.value)} style={{ width: '100%', height: '44px', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', color: '#111', background: 'white' }}>
                            {activities.map(a => {
                                const r = attendanceFor(a);
                                return <option key={a.id} value={a.id}>{`${a.name}${r?.time_in && !r?.time_out ? ' (ongoing)' : ''}`}</option>;
                            })}
                        </select>
                    </label>
                )}

                <div style={{ textAlign: 'center' }}>
                    <button
                        type="button"
                        aria-label={label}
                        aria-disabled={!faceReady}
                        onClick={(e) => { e.stopPropagation(); if (faceReady) onStart(act, timedIn ? 'checkout' : 'checkin'); }}
                        style={{ position: 'relative', display: 'block', margin: '0 auto', width: '170px', height: '170px', padding: 0, border: 'none', background: 'none', cursor: faceReady ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                    >
                        <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
                            <circle cx="85" cy="85" r="74" fill="none" stroke={faceReady ? '#f7c1c1' : '#e4e4e6'} strokeWidth="7" />
                            {progress > 0 && (
                                <circle cx="85" cy="85" r="74" fill="none" stroke="#CC0000" strokeWidth="7" strokeLinecap="round"
                                    strokeDasharray={`${(Math.min(progress, 1) * 2 * Math.PI * 74).toFixed(1)} ${(2 * Math.PI * 74).toFixed(1)}`} transform="rotate(-90 85 85)" />
                            )}
                            <circle cx="85" cy="85" r="62" fill={faceReady ? '#CC0000' : '#c9c9cc'} />
                            {progress > 0 && (() => {
                                const a = Math.min(progress, 1) * 2 * Math.PI - Math.PI / 2;
                                return <circle data-rc-dot="1" cx={(85 + 74 * Math.cos(a)).toFixed(1)} cy={(85 + 74 * Math.sin(a)).toFixed(1)} r="8" fill="white" stroke="#CC0000" strokeWidth="3" />;
                            })()}
                        </svg>
                        <span style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <span style={{ fontSize: timedIn ? '22px' : '20px', fontWeight: '600', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{timedIn ? <RcElapsed since={record.time_in} /> : label}</span>
                            <span style={{ fontSize: '11px', marginTop: '5px', color: faceReady ? '#ffd9d9' : '#f3f3f4' }}>
                                {faceReady ? (timedIn ? 'Tap to end shift' : 'Tap to start') : 'Not available yet'}
                            </span>
                        </span>
                        </button>
                </div>

                {!faceReady && (
                    <div style={{ marginTop: '12px', padding: '9px 12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '10px', fontSize: '11px', color: '#777', textAlign: 'center' }}>
                        {setup.face_pending ? 'Your face registration is waiting for admin approval.' : 'Register your face to use Time In and Time Out.'}
                    </div>
                )}

                <div style={{ display: 'flex', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#888' }}>{leftLabel}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginTop: '2px' }}>{leftValue}</div>
                    </div>
                    <div style={{ flex: 1, borderLeft: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '11px', color: '#888' }}>Ends at</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginTop: '2px' }}>{fmt12(act.end_time)}</div>
                    </div>
                </div>

                {act.location_name && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#666' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {act.location_name}
                    </div>
                )}
                </div>
            </div>
        </>
    );
}

function TimedInCard({ activities, attendanceFor, onStart }) {
    const { setup } = useVolunteerShell();
    const act = (activities || []).find((a) => { const r = attendanceFor(a); return !!r?.time_in && !r?.time_out; });
    if (!act) return null;
    const rec = attendanceFor(act);
    return (
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Time In / Time Out</span>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>{act.name}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                </div>
                {rec?.status === 'needs_review' ? (<div style={{ padding: "14px 18px", margin: "0 auto 16px", maxWidth: "320px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "13px" }}>Time out is closed. Your attendance was sent to the admin for review.</div>) : (<RingClockButton mode="checkout" isOngoing={true} record={rec} activity={act} canProceed={true} onPress={() => { if (setup.face_done) onStart(act, 'checkout'); }} />)}
                {rec?.status !== 'needs_review' && <RunningTimer record={rec} activity={act} />}
            </div>
        </div>
    );
}

function TaskAttendanceButton({ act, record, onStart }) {
    const { setup } = useVolunteerShell();
    const faceReady = !!setup.face_done; if (record?.status === 'needs_review') { return (<span style={{ fontSize: '10px', fontWeight: '600', color: '#b45309', background: '#fffbeb', borderRadius: '5px', padding: '3px 10px', whiteSpace: 'nowrap' }}>Under review</span>); }

    if (record?.time_out) {
        return (
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#16a34a', background: '#f0fdf4', borderRadius: '5px', padding: '3px 10px' }}>
                Completed
            </span>
        );
    }

    const timedIn = !!record?.time_in;
    const label = timedIn ? 'Time Out' : 'Time In';
    const base = {
        fontSize: '10px', fontWeight: '600', borderRadius: '5px', padding: '3px 12px',
        fontFamily: 'inherit', whiteSpace: 'nowrap', border: '1px solid #CC0000', cursor: 'pointer',
    };

    if (!faceReady) {
        return (
            <span
                aria-disabled="true"
                title={setup.face_pending ? 'Waiting for admin approval of your face registration' : 'Register your face to use Time In and Time Out'}
                style={{ ...base, background: '#f5f5f5', color: '#bbb', border: '1px solid #f0f0f0', cursor: 'not-allowed' }}
            >
                {label}
            </span>
        );
    }

    return (
        <button
            type="button"
            className={timedIn ? '' : 'btn-view'}
            onClick={() => onStart(act, timedIn ? 'checkout' : 'checkin')}
            style={{ ...base, background: timedIn ? 'white' : '#CC0000', color: timedIn ? '#CC0000' : 'white' }}
        >
            {label}
        </button>
    );
}

function recordToActivity(rec) {
    if (rec.activity) return { ...rec.activity, attendance_method: rec.attendance_method };
    return {
        date: rec.date,
        name: rec.activity_name,
        start_time: rec.activity_start_time,
        end_time: rec.activity_end_time,
        location_name: rec.location_name,
        assignment: rec.assignment,
        attendance_method: rec.attendance_method,
        description: rec.description,
        assigned_by_role: rec.assigned_by_role,
        assigned_by_name: rec.assigned_by_name,
    };
}

function RecentRecordsCard({ recordsTotal, attendance, isMobile, openKey, toggleOpen }) {
    const rows = (attendance || []).filter((r) => !!r.time_out || ['absent', 'cancelled', 'needs_review', 'rejected'].includes(r.status));
    const goToRecord = (r) => router.visit(route('volunteer.records', { record: r.id }));
    const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '\u2014');
    const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '\u2014');
    const statusOf = (r) => {
        if (r.status === 'absent') return { label: 'Absent', bg: '#fef2f2', color: '#CC0000' };
        if (r.status === 'needs_review') return { label: 'Needs Review', bg: '#fffbeb', color: '#b45309' };
        if (r.status === 'rejected') return { label: 'Rejected', bg: '#fef2f2', color: '#CC0000' };
        if (!r.time_out) return { label: 'Ongoing', bg: '#fffbeb', color: '#b45309' };
        return { label: 'Present', bg: '#f0fdf4', color: '#16a34a' };
    };
    return (
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <style>{`
                .dash-table { border-collapse: collapse; width: 100%; }
                .dash-table th { font-size: 10px; font-weight: 600; color: #999; text-align: left; padding: 10px 18px; background: #fafafa; border-bottom: 1px solid #f5f5f5; white-space: nowrap; }
                .dash-table td { font-size: 12px; color: #333; padding: 12px 18px; border-bottom: 1px solid #f5f5f5; white-space: nowrap; }
                .dash-table tbody tr.dash-row { cursor: pointer; transition: background 0.1s; }
                .dash-table tbody tr.dash-row:hover td { background: #fafafa; }
                .dash-table tbody tr.dash-open td { background: #fafafa; }
            `}</style>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Recent Activity</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#999' }}>Showing {rows.length} of {Math.max(Number(recordsTotal) || 0, rows.length)}</span>
            </div>
            {rows.length === 0 ? (
                <div style={{ padding: isMobile ? '16px' : '32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#ccc' }}>No recent activity</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Activity</th><th>Where</th><th>Assigned by</th>
                                <th>Status</th>
                                <th>Time In</th>
                                <th>Time Out</th><th>Assignment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((rec, i) => {
                                const key = `rec-${i}`;
                                const isOpen = openKey === key;
                                const s = statusOf(rec);
                                return (
                                    <tr key={rec.id || i} className="dash-row" tabIndex={0} onClick={() => goToRecord(rec)} onKeyDown={(e) => { if (e.key === 'Enter') goToRecord(rec); }}>
                                        <td style={{ fontWeight: '500', color: '#111' }}>{fmtDate(rec.date)}</td>
                                        <td>{rec.activity_name || rec.activity?.name || '-'}</td>
                                        <td title={rec.activity?.location_name || ''} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', color: '#666' }}>{rec.activity?.location_name || '-'}</td>
                                        <td style={{ color: '#666' }}>{rec.activity?.assigned_by || '-'}</td>
                                        <td>
                                            <span style={{ background: s.bg, color: s.color, fontSize: '10.5px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px' }}>{s.label}</span>
                                        </td>
                                        <td style={{ color: '#16a34a' }}>{fmtTime(rec.time_in)}</td>
                                        <td style={{ color: '#CC0000' }}>{fmtTime(rec.time_out)}</td>
                                        <td title={rec.activity?.description || ''} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', color: '#666' }}>{rec.activity?.description || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <div style={{ padding: '10px 18px', borderTop: '1px solid #f5f5f5', textAlign: 'center' }}>
                <Link href={route('volunteer.records')} style={{ fontSize: '10.5px', color: '#333', fontWeight: '400', textDecoration: 'none' }}>
                    View all
                </Link>
            </div>
        </div>
    );
}
function RecentActivityRow({ rec, isLast, isOpen, onToggle }) {
    const cancelled = rec.status === 'cancelled' || rec.status === 'absent';
    const name = rec.activity_name || rec.activity?.name || 'Activity';

    const timeRange = () => {
        if (!rec.time_in) return '—';
        const fmt = (d) => new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
        return rec.time_out ? `${fmt(rec.time_in)} → ${fmt(rec.time_out)}` : fmt(rec.time_in);
    };

    return (
        <div style={{ borderBottom: isLast ? 'none' : '1px solid #f5f5f5' }}>
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
                className="task-row"
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    padding: '12px 18px', cursor: 'pointer',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: cancelled ? '#fef2f2' : '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {cancelled ? <CancelledIcon /> : <CheckIcon />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{
                            fontSize: '12px', fontWeight: '600', color: '#111',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>
                            {new Date(rec.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            {' · '}{timeRange()}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                        fontSize: '9px', fontWeight: '600', padding: '3px 9px', borderRadius: '10px',
                        background: cancelled ? '#fef2f2' : '#f0fdf4',
                        color: cancelled ? '#DC2626' : '#16a34a',
                    }}>
                        {rec.status === 'absent' ? 'Absent' : (cancelled ? 'Cancelled' : 'Completed')}
                    </span>
                    <Chevron open={isOpen} />
                </div>
            </div>

            {isOpen && (
                <div style={{ padding: '0 18px 16px' }}>
                    <ActivityDetails act={recordToActivity(rec)} />
                </div>
            )}
        </div>
    );
}

function CheckIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function CancelledIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

/* ---------------- Inline activity details — stacked in a single column ---------------- */

function ActivityDetails({ act }) {
    const detailLabelWidth = '68px';

    const fmt = (t) => {
        const [h, m] = String(t).split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const timeText = act.start_time
        ? (act.end_time ? `${fmt(act.start_time)} \u2013 ${fmt(act.end_time)}` : fmt(act.start_time))
        : null;

    const assignedBy = act.assigned_by_name
        ? `${act.assigned_by_role ? `${act.assigned_by_role} / ` : ''}${act.assigned_by_name}`
        : (act.assigned_by || null);

    const dateText = act.date
        ? new Date(act.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;
    const whenText = [dateText, timeText].filter(Boolean).join(' \u00B7 ');

    const detailRows = [
        { label: 'When', value: whenText },
        { label: 'Where', value: act.location_name },
        { label: 'Assignment', value: act.description || act.assignment },
        { label: 'Assigned by', value: assignedBy },
    ].filter((r) => r.value);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {detailRows.map((r, i) => (
                <div key={r.label} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '8px', flexShrink: 0 }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#bbb', marginTop: '5px', flexShrink: 0 }} />
                        {i < detailRows.length - 1 && <div style={{ width: '1px', flex: 1, background: '#e5e5e5', marginTop: '3px' }} />}
                    </div>
                    <div style={{ paddingBottom: i < detailRows.length - 1 ? '12px' : 0, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>{r.label}</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', lineHeight: '1.5', wordBreak: 'break-word' }}>{r.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
function Chevron({ open }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0, display: 'block' }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

const iconProps = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function ClockIcon() {
    return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function PinIcon() {
    return <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}

function CalendarIcon() {
    return <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

function ClipboardIcon() {
    return <svg {...iconProps}><path d="M9 2h6v4H9z"/><rect x="4" y="4" width="16" height="18" rx="2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg>;
}

function UserIcon() {
    return <svg {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function TextIcon() {
    return <svg {...iconProps}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>;
}

function useIsMobile(breakpoint = 768) {
    const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth <= breakpoint);
    useEffect(() => {
        const on = () => setM(window.innerWidth <= breakpoint);
        on();
        window.addEventListener('resize', on);
        return () => window.removeEventListener('resize', on);
    }, [breakpoint]);
    return m;
}

function SetupNotice() {
    const { setup } = useVolunteerShell();
    const isMobile = useIsMobile();
    if (isMobile || setup.profile_completed) return null;

    return (
        <div role="region" aria-label="Profile setup required" style={{
            background: '#fff5f5', border: '1px solid #f5c6c6', borderLeft: '4px solid #CC0000',
            borderRadius: '10px', padding: '16px 20px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
            <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '3px' }}>Welcome to the Volunteer Portal!</div>
                <div style={{ fontSize: '11.5px', color: '#555' }}>Please complete your volunteer profile to continue using the portal.</div>
            </div>
            <Link href={safeRoute('volunteer.profile')} className="btn-view" style={{
                background: '#CC0000', color: 'white', fontSize: '11px', fontWeight: '600',
                padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>Set Up My Profile</Link>
        </div>
    );
}

function Pill({ ok, children }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '10px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px',
            background: ok ? '#f0fdf4' : '#fffbeb', color: ok ? '#16a34a' : '#b45309',
        }}>
            <span aria-hidden="true">{ok ? '✓' : '●'}</span>
            {children}
        </span>
    );
}

function SetupStatus({ compact = false }) {
    const { setup, openFace } = useVolunteerShell();
    const { profile_completed: profileDone, face_done: faceDone, face_needed: faceNeeded, face_pending: facePending } = setup;

    const isMobile = useIsMobile();
    const [rcOpen, setRcOpen] = useState(!isMobile);
    if (profileDone && faceDone) return null;

    if (isMobile || compact) {
        const doneCount = (profileDone ? 1 : 0) + (faceDone ? 1 : 0);
        if (compact) {
            const startStyle = { fontSize: '12px', fontWeight: '600', color: 'white', background: '#CC0000', border: 'none', borderRadius: '8px', padding: '9px 18px', textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'center', boxSizing: 'border-box', ...(isMobile ? { width: '100%' } : {}) };
            const badgeStyle = { display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#CC0000', background: 'white', border: '1px solid #f5c6c6', borderRadius: '10px', padding: '1px 9px', marginBottom: '4px' };
            let title;
            let sub;
            let action = null;
            let badge = null;
            if (!profileDone) {
                title = 'Complete your profile';
                sub = faceDone ? 'Takes about 2 minutes.' : 'Takes about 2 minutes. Face registration comes next.';
                if (!faceDone) badge = '2 steps left';
                action = <Link href={safeRoute('volunteer.profile')} style={startStyle}>Start</Link>;
            } else if (facePending) {
                title = 'Face registration submitted';
                sub = 'Waiting for admin approval.';
            } else {
                const rejected = setup.face_status === 'rejected';
                title = rejected ? 'Register your face again' : 'Register your face';
                sub = rejected ? 'Your last scan was not approved.' : 'Needed for Time In and Time Out.';
                if (faceNeeded) action = <button type="button" onClick={openFace} style={startStyle}>Start</button>;
            }
            return (
                <div role="region" aria-label="Finish setting up" style={{ background: '#fff5f5', border: '1px solid #f5c6c6', borderLeft: '4px solid #CC0000', borderRadius: '12px', marginBottom: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                        {badge && <span style={badgeStyle}>{badge}</span>}
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{title}</div>
                        <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>{sub}</div>
                    </div>
                    {action}
                </div>
            );
        }
        const mRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 16px', borderTop: '1px solid #f5f5f5' };
        const mBtn = { fontSize: '11px', fontWeight: '600', color: '#333', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 };
        return (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ padding: '14px 16px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Finish setting up</div>
                    <div style={{ fontSize: '11px', color: '#888', margin: '2px 0 10px' }}>{doneCount} of 2 done</div>
                    <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px' }}>
                        <div style={{ width: (doneCount * 50) + '%', height: '4px', background: '#CC0000', borderRadius: '2px' }} />
                    </div>
                </div>
                <div style={mRow}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '5px' }}>Profile</div>
                        <Pill ok={profileDone}>{profileDone ? 'Completed' : 'Not Yet Completed'}</Pill>
                    </div>
                    {!profileDone && <Link href={safeRoute('volunteer.profile')} className="btn-view" style={mBtn}>Set up</Link>}
                </div>
                <div style={mRow}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '5px' }}>Face registration</div>
                        <Pill ok={faceDone}>{faceStatusLabel(setup)}</Pill>
                    </div>
                    {faceNeeded && <button type="button" className="btn-view" onClick={openFace} style={mBtn}>{setup.face_status === 'rejected' ? 'Register again' : 'Register'}</button>}
                </div>
                {(faceNeeded || facePending) && (
                    <div style={{ padding: '10px 16px', background: '#fafafa', borderTop: '1px solid #f5f5f5', fontSize: '10.5px', color: '#888' }}>
                        {facePending ? 'Your face registration is waiting for admin approval.' : 'Register your face to use Time In and Time Out.'}
                    </div>
                )}
            </div>
        );
    }

    const rowStyle = { padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' };
    const smallBtn = {
        fontSize: '10px', fontWeight: '600', color: '#333', background: 'white', border: '1px solid #e0e0e0',
        borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
    };

    return (
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Account setup</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ ...rowStyle, borderRight: '1px solid #f5f5f5' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Profile Setup</div>
                        <Pill ok={profileDone}>{profileDone ? 'Completed' : 'Not Yet Completed'}</Pill>
                    </div>
                    {!profileDone && <Link href={safeRoute('volunteer.profile')} className="btn-view" style={smallBtn}>Set Up My Profile</Link>}
                </div>

                <div style={rowStyle}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Face Registration</div>
                        <Pill ok={faceDone}>{faceStatusLabel(setup)}</Pill>
                    </div>
                    {faceNeeded && <button type="button" className="btn-view" onClick={openFace} style={smallBtn}>{setup.face_status === 'rejected' ? 'Register Again' : 'Register My Face'}</button>}
                </div>
            </div>

            {(faceNeeded || facePending) && (
                <div style={{ padding: '10px 18px', background: '#fafafa', borderTop: '1px solid #f5f5f5', fontSize: '10.5px', color: '#888' }}>
                    {facePending ? 'Your face registration is waiting for admin approval.' : 'Register your face to use Time In and Time Out.'}
                </div>
            )}
        </div>
    );
}

function RemindersCard({ reminders }) {
    const n = reminders.length;
    const dotColor = { red: '#CC0000', amber: '#b45309' };
    const rowStyle = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'white', border: 'none', fontFamily: 'inherit', fontSize: '12px', color: '#222', textAlign: 'left', textDecoration: 'none', cursor: 'pointer' };
    const inner = (r) => (
        <>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor[r.tone] || '#b45309', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>{r.text}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><polyline points="9 6 15 12 9 18" /></svg>
        </>
    );
    return (
        <div role="region" aria-label="Reminders" style={{ display: 'flex', background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', borderLeft: '4px solid #9b1c1c', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: '600', color: '#9b1c1c' }}><ReminderPinIcon />Reminders</span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: n > 0 ? '#b45309' : '#16a34a' }}>{n > 0 ? `${n} need${n === 1 ? 's' : ''} your attention` : 'All caught up'}</span>
                </div>
                {n === 0 ? (
                    <div style={{ padding: '14px 16px', fontSize: '12px', color: '#888' }}>Nothing to do right now.</div>
                ) : reminders.map((r, i) => {
                    const st = { ...rowStyle, borderBottom: i < n - 1 ? '1px solid #f5f5f5' : 'none' };
                    return r.href
                        ? (<Link key={r.key} href={r.href} style={st}>{inner(r)}</Link>)
                        : (<button key={r.key} type="button" onClick={r.onClick} style={st}>{inner(r)}</button>);
                })}
            </div>
        </div>
    );
}

function ReminderPinIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
            <path d="M9 15l-4.5 4.5" />
            <path d="M14.5 4l5.5 5.5" />
        </svg>
    );
}
function RingGauge({ value, frac, color }) {
    const r = 21;
    const circ = 2 * Math.PI * r;
    const small = String(value).length > 3;
    return (
        <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="27" cy="27" r={r} fill="none" stroke="#ececee" strokeWidth="7" />
            {frac > 0 && <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${circ * frac} ${circ}`} transform="rotate(-90 27 27)" />}
            <text x="27" y={small ? 30 : 31} textAnchor="middle" fontSize={small ? 11 : 13} fontWeight="600" fill="#111">{value}</text>
        </svg>
    );
}

function RingCards({ compact, totalHours, attendedCount, missedCount, monthHours, todayHours, fieldAttended, branchAttended, lastMonthDone, lastMonthAttended, lastMonthMissed, monthDone, monthScheduled, longestStreak, currentStreak }) {
    const card = { position: 'relative', flex: compact ? '0 0 230px' : '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', boxSizing: 'border-box' };
    const row = { display: 'flex', alignItems: 'center', gap: '14px' };
    const title = { fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '6px' };
    const line = { fontSize: '10.5px', color: '#666', lineHeight: 1.7 };
    const dot = (c) => <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: c, marginRight: '6px' }} />;
    const fmt = (n) => String(Math.round((Number(n) || 0) * 10) / 10);
    const RingPill = ({ kind, children }) => {
        const m = { ok: ['rgba(63,166,106,0.12)', '#2f7d52'], red: ['rgba(204,0,0,0.08)', '#CC0000'], gray: ['#f1f1f3', '#666'] }[kind];
        return <span style={{ alignSelf: 'flex-start', fontSize: '10.5px', fontWeight: '500', padding: '2px 9px', borderRadius: '999px', background: m[0], color: m[1], whiteSpace: 'nowrap' }}>{children}</span>;
    };

    const Arrow = ({ down }) => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '4px', verticalAlign: '-1px' }}>
            {down ? <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></> : <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>}
        </svg>
    );
    const TrendPill = ({ diff, unit, fallback }) => {
        if (diff === null || diff === undefined || Number.isNaN(diff)) return fallback;
        if (diff === 0) return <RingPill kind="gray">Same as last month</RingPill>;
        return <RingPill kind={diff > 0 ? 'ok' : 'red'}><Arrow down={diff < 0} />{diff > 0 ? '+' : '\u2212'}{Math.abs(diff)}{unit} vs last month</RingPill>;
    };
    const attDiff = (nowPct) => {
        if (lastMonthAttended == null || nowPct === null) return null;
        const lt = (Number(lastMonthAttended) || 0) + (Number(lastMonthMissed) || 0);
        if (lt === 0) return null;
        return nowPct - Math.round(((Number(lastMonthAttended) || 0) / lt) * 100);
    };

    const MILESTONES = [10, 25, 50, 100, 200, 500, 1000];
    const hours = Number(totalHours) || 0;
    const nextMs = MILESTONES.find((m) => m > hours) || null;
    const prevMs = [...MILESTONES].reverse().find((m) => m <= hours) || 0;
    const hoursPct = nextMs ? Math.round(((hours - prevMs) / (nextMs - prevMs)) * 100) : 100;

    const attended = Number(attendedCount) || 0;
    const missed = Number(missedCount) || 0;
    const total = attended + missed;
    const pct = total > 0 ? Math.round((attended / total) * 100) : null;

    const mDone = Number(monthDone) || 0;
    const mSched = Number(monthScheduled) || 0;
    const monthPct = mSched > 0 ? Math.min(100, Math.round((mDone / mSched) * 100)) : null;

    const best = Number(longestStreak) || 0;
    const cur = Number(currentStreak) || 0;
    const streakFrac = best > 0 ? Math.min(1, cur / best) : 0;
    const fld = Number(fieldAttended) || 0;
    const brn = Number(branchAttended) || 0;
    const typeTotal = fld + brn;
    const fieldPct = typeTotal > 0 ? Math.round((fld / typeTotal) * 100) : 0;
    const streakNote = best === 0 ? 'Complete an activity to start' : (cur >= best ? 'Personal best' : `${best - cur} more to beat it`);

    return (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', overflowX: compact ? 'auto' : 'visible', paddingBottom: compact ? '6px' : 0 }}>
            <div style={card}><Link href={safeRoute('volunteer.records')} aria-label="Open records" style={{ position: 'absolute', inset: 0, borderRadius: '10px', color: '#9a9aa2', textDecoration: 'none' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', top: '8px', right: '8px' }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="8 7 17 7 17 16" /></svg></Link>
                <div style={row}>
                    <RingGauge value={`${hoursPct}%`} frac={hoursPct / 100} color="#3fa66a" />
                    <div>
                        <div style={title}>Volunteer hours</div>
                        <div style={{ fontSize: '10px', color: '#9a9aa2', marginBottom: '2px' }}>Since joining</div>
                        <div style={line}>{dot('#3fa66a')}{nextMs ? `${fmt(hours)} of ${nextMs} hrs` : `${fmt(hours)} hrs total`}</div>
                        <div style={line}>{dot('#d4d4d8')}{attended} {attended === 1 ? 'activity' : 'activities'} attended</div>
                    </div>
                </div>
                {Number(todayHours) >= 0.05 ? <RingPill kind="ok"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '4px', verticalAlign: '-1px' }}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>+{fmt(todayHours)} hrs today</RingPill> : <RingPill kind="gray"><Arrow />+0 hrs today</RingPill>}
            </div>
            <div style={card}>
                <Link href={safeRoute('volunteer.records')} aria-label="Open activity types in records" style={{ position: 'absolute', inset: 0, borderRadius: '10px', color: '#9a9aa2', textDecoration: 'none' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', top: '8px', right: '8px' }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="8 7 17 7 17 16" /></svg></Link>
                <div style={row}>
                    <RingGauge value={typeTotal === 0 ? '\u2013' : `${fieldPct}%`} frac={typeTotal === 0 ? 0 : fieldPct / 100} color="#CC0000" />
                    <div>
                        <div style={title}>Activity types</div>
                        <div style={{ fontSize: '10px', color: '#9a9aa2', marginBottom: '2px' }}>Since joining</div>
                        <div style={line}>{dot('#CC0000')}{fld} Field</div>
                        <div style={line}>{dot('#d4d4d8')}{brn} Branch</div>
                    </div>
                </div>
                {typeTotal === 0 ? <RingPill kind="gray">No activities yet</RingPill> : (fld === brn ? <RingPill kind="gray">Balanced</RingPill> : <RingPill kind="ok"><Arrow />{fld > brn ? 'Mostly Field' : 'Mostly Branch'}</RingPill>)}
            </div>
            <div style={card}><Link href={safeRoute('volunteer.records')} aria-label="Open attendance in records" style={{ position: 'absolute', inset: 0, borderRadius: '10px', color: '#9a9aa2', textDecoration: 'none' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', top: '8px', right: '8px' }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="8 7 17 7 17 16" /></svg></Link>
                <div style={row}>
                    <RingGauge value={pct === null ? '\u2013' : `${pct}%`} frac={pct === null ? 0 : pct / 100} color="#3fa66a" />
                    <div>
                        <div style={title}>Attendance rate</div>
                        <div style={{ fontSize: '10px', color: '#9a9aa2', marginBottom: '2px' }}>Since joining</div>
                        <div style={line}>{dot('#3fa66a')}{attended} Attended</div>
                        <div style={line}>{dot('#CC0000')}{missed} Missed</div>
                    </div>
                </div>
                <TrendPill diff={attDiff(pct)} unit="%" fallback={<RingPill kind="gray"><Arrow />+0% vs last month</RingPill>} />
            </div>
            <div style={card}>
                <div style={row}>
                    <RingGauge value={best} frac={streakFrac} color="#e08a00" />
                    <div>
                        <div style={title}>Longest streak</div>
                        <div style={line}>{dot('#e08a00')}{cur} in a row now</div>
                        <div style={line}>{dot('#d4d4d8')}{streakNote}</div>
                    </div>
                </div>
                {best === 0 ? <RingPill kind="gray">No streak yet</RingPill> : (cur >= best ? <RingPill kind="red"><Arrow />Keep it up!</RingPill> : <RingPill kind="gray">Best: {best}</RingPill>)}
            </div>
        </div>
    );
}
function taskDateLabel(d) {
    const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
}

function taskTimeLabel(t) {
    const s = String(t || '').trim();
    if (!s) return '';
    if (/[ap]m/i.test(s)) return s;
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return s;
    const h = parseInt(m[1], 10);
    return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

function taskWhenLabel(act) {
    const d = taskDateLabel(act && act.date);
    const a = taskTimeLabel(act && act.start_time);
    const b = taskTimeLabel(act && act.end_time);
    const t = a && b ? `${a} \u2013 ${b}` : (a || b);
    return [d, t].filter(Boolean).join(' \u00B7 ');
}
