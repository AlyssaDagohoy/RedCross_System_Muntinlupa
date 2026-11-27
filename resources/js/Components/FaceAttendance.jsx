import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import FaceRegistration from '@/Components/FaceRegistration';
import TimeInSuccessModal from '@/Components/TimeInSuccessModal';

const OVAL_RX = 140;
const OVAL_RY = 180;
const OVAL_CIRCUMFERENCE = Math.PI * (3 * (OVAL_RX + OVAL_RY) - Math.sqrt((3 * OVAL_RX + OVAL_RY) * (OVAL_RX + 3 * OVAL_RY)));
const HOLD_FRAMES_NEEDED = 12;

function formatTime(datetime) {
    if (!datetime) return '—';
    return new Date(datetime).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function getPunctuality(timeIn, startTime) {
    if (!timeIn || !startTime) return null;
    const inDate = new Date(timeIn);
    const [h, m] = startTime.split(':').map(Number);
    const scheduled = new Date(inDate);
    scheduled.setHours(h, m, 0, 0);
    const diffMinutes = (inDate - scheduled) / 60000;
    if (diffMinutes < 0) return 'early';
    if (diffMinutes <= 15) return 'ontime';
    return 'late';
}

const ringToMin = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
const ringFmt12 = (t) => {
    const m = ringToMin(t);
    if (m == null) return '\u2014';
    const h = Math.floor(m / 60);
    return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Round Time In / Time Out button with a progress ring (same look as the phone card).
export function RingClockButton({ mode, isOngoing, record, activity, canProceed, onPress }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isOngoing || !record?.time_in || record?.time_out) return undefined;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isOngoing, record?.time_in, record?.time_out]);

    const pad = (n) => String(n).padStart(2, '0');
    const startedAt = isOngoing && record?.time_in ? new Date(record.time_in).getTime() : NaN;
    const elapsed = Number.isFinite(startedAt) ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
    const clock = `${Math.floor(elapsed / 3600)}:${pad(Math.floor((elapsed % 3600) / 60))}:${pad(elapsed % 60)}`;
    const eMin = ringToMin(activity?.end_time);
    const inDate = Number.isFinite(startedAt) ? new Date(startedAt) : null;
    const inMin = inDate ? inDate.getHours() * 60 + inDate.getMinutes() : null;
    const planned = eMin != null && inMin != null && eMin > inMin ? (eMin - inMin) * 60 : 0;
    const progress = isOngoing && planned ? Math.min(1, elapsed / planned) : 0;
    const R = 74;
    const C = 2 * Math.PI * R;
    const ang = progress * 2 * Math.PI - Math.PI / 2;
    const label = mode === 'checkin' ? 'Time In' : 'Time Out';
    const sub = !canProceed ? 'Choose an activity' : (isOngoing ? 'Tap to end shift' : 'Tap to start');

    return (
        <button
            type="button"
            aria-label={label}
            disabled={!canProceed}
            onClick={onPress}
            style={{ position: 'relative', display: 'block', margin: '0 auto 16px', width: '170px', height: '170px', padding: 0, border: 'none', background: 'none', cursor: canProceed ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
        >
            <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
                <circle cx="85" cy="85" r="74" fill="none" stroke={canProceed ? '#f7c1c1' : '#e4e4e6'} strokeWidth="4" />
                {progress > 0 && (
                    <circle cx="85" cy="85" r="74" fill="none" stroke="#CC0000" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${(progress * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 85 85)" />
                )}
                <circle cx="85" cy="85" r="64" fill={canProceed ? '#CC0000' : '#c9c9cc'} />
            </svg>
            <span style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <span style={{ fontSize: isOngoing ? '22px' : '20px', fontWeight: '600', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{isOngoing ? clock : label}</span>
                <span style={{ fontSize: '11px', marginTop: '5px', color: canProceed ? '#ffd9d9' : '#f3f3f4' }}>{sub}</span>
            </span>
        </button>
    );
}

// Details under the round button: Time in, Ends at, Status, location.
export function RunningTimer({ record, activity }) {
    const punctuality = record?.time_in_status
        ? (record.time_in_status === 'on_time' ? 'ontime' : record.time_in_status)
        : getPunctuality(record?.time_in, activity?.start_time);
    const timeInText = record?.time_in
        ? new Date(record.time_in).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
        : '\u2014';
    const labelStyle = { fontSize: '11px', color: '#888' };
    const valueStyle = { fontSize: '13px', fontWeight: '600', marginTop: '2px' };

    return (
        <div>
            <div style={{ display: 'flex', maxWidth: '440px', margin: '0 auto', paddingTop: '14px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>Time in</div>
                    <div style={{ ...valueStyle, color: '#16a34a' }}>{timeInText}</div>
                </div>
                <div style={{ flex: 1, borderLeft: '1px solid #f0f0f0' }}>
                    <div style={labelStyle}>Ends at</div>
                    <div style={{ ...valueStyle, color: '#111' }}>{ringFmt12(activity?.end_time)}</div>
                </div>
                {punctuality && (
                    <div style={{ flex: 1, borderLeft: '1px solid #f0f0f0' }}>
                        <div style={labelStyle}>Status</div>
                        <div style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', display: 'inline-block', marginTop: '2px',
                            background: punctuality === 'early' ? '#eff6ff' : punctuality === 'ontime' ? '#f0fdf4' : '#fef2f2',
                            color: punctuality === 'early' ? '#3B82F6' : punctuality === 'ontime' ? '#16a34a' : '#DC2626',
                        }}>
                            {punctuality === 'early' ? 'Early' : punctuality === 'ontime' ? 'On Time' : 'Late'}
                        </div>
                    </div>
                )}
            </div>
            {activity?.location_name && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#666' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {activity.location_name}
                </div>
            )}
        </div>
    );
}

export default function FaceAttendance({ todayRecord, activities, availableActivities, faceStatus = 'none' }) {
    // CHANGED: open the registration right away when the volunteer arrives from the
    // "Register My Face" button (…/attendance?register=1) and still needs to register.
    const [showRegistration, setShowRegistration] = useState(() => {
        if (typeof window === 'undefined') return false;
        const wantsRegister = new URLSearchParams(window.location.search).get('register') === '1';
        return wantsRegister && (faceStatus === 'none' || faceStatus === 'rejected');
    });
    const [showCapture, setShowCapture] = useState(false);
    const [status, setStatus] = useState(faceStatus);
    const [selectedActivityId, setSelectedActivityId] = useState('');

    // NEW: success popup state. captureInfo remembers which mode/activity was being
    // scanned, because the props change as soon as the server saves the record.
    const [successInfo, setSuccessInfo] = useState(null);
    const captureInfo = useRef(null);

    // NEW: the dropdown only lists activities that still need a Time In.
    // Falls back to `activities` if the page does not send the shorter list.
    const timeInOptions = availableActivities ?? activities;

    // NEW: clear the selection once its activity is timed in (it leaves the list).
    useEffect(() => {
        if (selectedActivityId && !timeInOptions?.some(a => a.id === Number(selectedActivityId))) {
            setSelectedActivityId('');
        }
    }, [timeInOptions, selectedActivityId]);

    // CHANGED: remove ?register=1 from the address bar so a refresh does not reopen the camera.
    useEffect(() => {
        if (new URLSearchParams(window.location.search).has('register')) {
            window.history.replaceState(window.history.state, '', window.location.pathname);
        }
    }, []);

    if (status === 'none') {
        return (
            <>
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px', lineHeight: '1.6' }}>
                        You need to register your face before you can time in or out. This only needs to be done once.
                    </div>
                    <button
                        onClick={() => setShowRegistration(true)}
                        style={{
                            background: '#DC2626', color: 'white', border: 'none',
                            padding: '11px 28px', borderRadius: '100px', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
                        }}
                    >
                        Register My Face
                    </button>
                </div>
                {showRegistration && (
                    <FaceRegistration
                        onClose={() => setShowRegistration(false)}
                        onRegistered={() => setStatus('approved')}
                    />
                )}
            </>
        );
    }

    if (status === 'pending') {
        return (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
                    borderRadius: '10px', padding: '10px 18px', fontSize: '12.5px', fontWeight: '600',
                }}>
                    ⏳ Face profile pending admin approval
                </div>
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <>
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '14px' }}>
                        Your face registration was not approved. Please register again.
                    </div>
                    <button
                        onClick={() => setShowRegistration(true)}
                        style={{
                            background: '#DC2626', color: 'white', border: 'none',
                            padding: '11px 28px', borderRadius: '100px', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
                        }}
                    >
                        Re-Register My Face
                    </button>
                </div>
                {showRegistration && (
                    <FaceRegistration
                        onClose={() => setShowRegistration(false)}
                        onRegistered={() => setStatus('approved')}
                    />
                )}
            </>
        );
    }

    const isOngoing = todayRecord?.time_in && !todayRecord?.time_out;
    const mode = isOngoing ? 'checkout' : 'checkin';

    // For checkout, the activity is already fixed (whatever they timed in for)
    const checkoutActivity = activities?.find(a => a.id === todayRecord?.activity_id) ?? activities?.[0];
    const activeActivity = isOngoing
        ? checkoutActivity
        : timeInOptions?.find(a => a.id === Number(selectedActivityId));

    const canProceed = isOngoing ? !!checkoutActivity : !!activeActivity;

    return (
        <>
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>

                {!isOngoing && (
                    <div style={{ marginBottom: '16px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: '600', marginBottom: '6px', textAlign: 'left' }}>
                            Select Activity
                        </label>
                        <select
                            value={selectedActivityId}
                            onChange={e => setSelectedActivityId(e.target.value)}
                            style={{
                                width: '100%', padding: '9px 12px', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '13px', color: '#333',
                                background: '#fff', fontFamily: "'Source Sans 3', sans-serif",
                            }}
                        >
                            <option value="">— Choose an activity —</option>
                            {timeInOptions?.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name}{a.start_time ? ` (${a.start_time.slice(0, 5)})` : ''}
                                </option>
                            ))}
                        </select>
                        {(!timeInOptions || timeInOptions.length === 0) && (
                            <div style={{ fontSize: '11.5px', color: '#bbb', marginTop: '6px' }}>
                                No activities left to time in for today.
                            </div>
                        )}
                    </div>
                )}

                {isOngoing && activeActivity && (
                    <div data-rc-heading="1" style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>{activeActivity.name}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    </div>
                )}
                <RingClockButton
                    mode={mode}
                    isOngoing={!!isOngoing}
                    record={todayRecord}
                    activity={activeActivity}
                    canProceed={canProceed}
                    onPress={() => {
                        // remember what is being scanned, for the success popup
                        captureInfo.current = { mode, activityName: activeActivity?.name || 'the activity' };
                        setShowCapture(true);
                    }}
                />
                {isOngoing && <RunningTimer record={todayRecord} activity={activeActivity} />}
            </div>

            {showCapture && (
                <AttendanceCapture
                    mode={mode}
                    activityId={activeActivity?.id}
                    onClose={() => setShowCapture(false)}
                    onSuccess={() => {
                        setShowCapture(false);
                        setSuccessInfo(captureInfo.current || { mode, activityName: activeActivity?.name || 'the activity' });
                        router.reload();
                    }}
                />
            )}

            <TimeInSuccessModal
                open={!!successInfo}
                type={successInfo?.mode === 'checkout' ? 'out' : 'in'}
                onClose={() => setSuccessInfo(null)}
            />
        </>
    );
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspectRatio(eye) {
    const a = dist(eye[1], eye[5]);
    const b = dist(eye[2], eye[4]);
    const c = dist(eye[0], eye[3]);
    return (a + b) / (2 * c);
}

// Same thresholds as FaceRegistration.jsx
const TURN_LEFT_RATIO = 1.7;
const TURN_RIGHT_RATIO = 0.6;

const LIVENESS_PROMPTS = {
    blink: 'Liveness check: blink once',
    left: 'Liveness check: slowly turn your head left',
    right: 'Liveness check: slowly turn your head right',
};

export function AttendanceCapture({ mode, activityId, onClose, onSuccess }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const holdCounter = useRef(0);

    // Liveness state: stage 'challenge' (prove you are live) -> 'hold' (look straight, then submit)
    const stage = useRef('challenge');
    const challengeRef = useRef(null);
    const poseFrames = useRef(0);
    const blinkState = useRef({ base: 0, closed: false });

    const [modelsReady, setModelsReady] = useState(!!window.faceapi?.nets?.tinyFaceDetector?.isLoaded);
    const [challengeReady, setChallengeReady] = useState(false);
    const [ringProgress, setRingProgress] = useState(0);
    const [ringColor, setRingColor] = useState('#e5e5e5');
    const [statusText, setStatusText] = useState('Position your face in the oval');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [earlyConfirm, setEarlyConfirm] = useState('');
    const [lateConfirm, setLateConfirm] = useState('');
    const lastScan = useRef(null);
    const pauseRef = useRef(false);
    const fbCodeRef = useRef('');
    const [failCount, setFailCount] = useState(0);
    const [fbOpen, setFbOpen] = useState(false);
    const [fbStep, setFbStep] = useState('ask');
    const [fbCode, setFbCode] = useState('');
    const [fbBusy, setFbBusy] = useState(false);
    const [fbMsg, setFbMsg] = useState('');
    const [fbActive, setFbActive] = useState(false);
    const [fbPass, setFbPass] = useState('');

    // Ask the server for a fresh random challenge (blink / left / right).
    const loadChallenge = useCallback(async () => {
        setChallengeReady(false);
        stage.current = 'challenge';
        poseFrames.current = 0;
        holdCounter.current = 0;
        blinkState.current = { base: 0, closed: false };
        try {
            const res = await fetch(route('volunteer.face.challenge'), {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('challenge failed');
            challengeRef.current = await res.json();
            setChallengeReady(true);
        } catch {
            setError('Could not start the liveness check. Please close and try again.');
        }
    }, []);

    const resetScan = useCallback(() => {
        setSubmitting(false);
        setRingProgress(0);
        setRingColor('#DC2626');
        loadChallenge();
    }, [loadChallenge]);

    useEffect(() => { loadChallenge(); }, [loadChallenge]);

    const modeKey = mode === 'checkin' ? 'in' : 'out';
    const postJson = async (url, body) => {
        const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '');
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrf },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        let data = {};
        try { data = await res.json(); } catch {}
        return { ok: res.ok, data };
    };
    const reportProblem = async () => {
        try {
            const { data } = await postJson(route('volunteer.face.scan.problem'), { activity_id: activityId, mode: modeKey });
            if (typeof data.count === 'number') setFailCount(data.count);
        } catch {}
    };
    const grabSelfie = () => {
        const v = videoRef.current;
        if (!v || !v.videoWidth) return null;
        const cv = document.createElement('canvas');
        cv.width = 320;
        cv.height = Math.round(v.videoHeight * (320 / v.videoWidth));
        cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
        return cv.toDataURL('image/jpeg', 0.7);
    };
    const sendFbCode = async () => {
        setFbBusy(true); setFbMsg('');
        try {
            const { ok, data } = await postJson(route('volunteer.face.fallback.code'), { activity_id: activityId, mode: modeKey, password: fbPass });
            if (ok) { setFbStep('code'); } else { setFbMsg(data.message || 'Could not send the code. Please try again.'); }
        } catch { setFbMsg('Could not send the code. Please check your connection.'); }
        setFbBusy(false);
    };
    const useFbCode = () => {
        if (!/^\d{6}$/.test(fbCode)) { setFbMsg('Enter the 6-digit code.'); return; }
        fbCodeRef.current = fbCode; setFbPass('');
        setFbActive(true); setFbOpen(false); setError(''); setFbMsg('');
        pauseRef.current = false;
        resetScan();
    };
    const cancelFb = () => { setFbOpen(false); setFbMsg(''); pauseRef.current = false; resetScan(); };

    const resendConfirmed = () => {
        if (!lastScan.current) return;
        setEarlyConfirm(''); setLateConfirm('');
        router.post(route(mode === 'checkin' ? 'volunteer.face.timein' : 'volunteer.face.timeout'), {
            ...lastScan.current,
            confirm_early: true,
            confirm_late: true,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => { onSuccess(); router.reload(); },
            onError: (errors) => {
                setError(Object.values(errors)[0] || 'Something went wrong. Please try again.');
                resetScan();
            },
        });
    };

    useEffect(() => {
        (async () => {
            if (!window.faceapi) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
                    s.onload = resolve;
                    s.onerror = reject;
                    document.body.appendChild(s);
                });
            }
            const MODEL_URL = '/models';
            await Promise.all([
                window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsReady(true); (async () => { try { const t0 = performance.now(); const warm = document.createElement('canvas'); warm.width = 150; warm.height = 150; await window.faceapi.detectSingleFace(warm, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 288, scoreThreshold: 0.4 })).withFaceLandmarks(); await window.faceapi.nets.faceRecognitionNet.computeFaceDescriptor(warm); console.log('[scan] warm-up ms', Math.round(performance.now() - t0)); } catch (e) { console.warn('[scan] warm-up skipped', e); } })();
        })().catch(() => setError('Could not load face detection models.'));
    }, []);

    useEffect(() => {
        if (!modelsReady) return;
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 640 } });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch {
                setError('Camera access denied. Please allow camera permissions.');
            }
        })();
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, [modelsReady]);

    useEffect(() => {
        if (!modelsReady || !challengeReady || submitting) return;
        let cancelled = false;
        let capturing = false;
        let timer = null;
        let cachedPos = null;
        let preState = 0;

        const geoOpts = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };
        // Start the location lookup now so it is ready when the blink passes.
        const keepBest = (pp) => { if (!cachedPos || pp.coords.accuracy < cachedPos.coords.accuracy) cachedPos = pp; };
        let lastGeoErr = null;
        let lowId = null;
        const onGeoErr = (e) => {
            lastGeoErr = e;
            if (e && e.code !== 1 && lowId === null) {
                lowId = navigator.geolocation.watchPosition(keepBest, (e2) => { lastGeoErr = e2; }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
            }
        };
        const watchId = navigator.geolocation.watchPosition(keepBest, onGeoErr, geoOpts);
        lowId = navigator.geolocation.watchPosition(keepBest, (e2) => { lastGeoErr = e2; }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
        const stopGeo = () => {
            navigator.geolocation.clearWatch(watchId);
            if (lowId !== null) navigator.geolocation.clearWatch(lowId);
        };
        setTimeout(stopGeo, 120000);
        
        const getPos = (ok, fail) => {
            const started = Date.now();
            const check = () => {
                if (cachedPos && (cachedPos.coords.accuracy <= 150 || Date.now() - started > 2500)) {
                    stopGeo();
                    return ok(cachedPos);
                }
                if (!cachedPos && Date.now() - started > 20000) {
                    stopGeo();
                    return fail(lastGeoErr || { code: 3, message: 'Location timeout' });
                }
                setTimeout(check, 400);
            };
            check();
        };

        const SEQ = ['left', 'right', 'blink'];
        const LABEL = { left: 'Turn your head LEFT', right: 'Turn your head RIGHT', blink: 'Now BLINK your eyes' };
        const POSE_NEEDED = 4;
        const TURN_LEFT = 1.7;
        const TURN_RIGHT = 0.6;

        const bs = blinkState.current;
        stage.current = 'challenge';
        bs.step = 0; bs.t = Date.now(); bs.base = 0; bs.closed = false; bs.n = 0; window.__scanT0 = performance.now();
        poseFrames.current = 0;
        holdCounter.current = 0;

        const canvas = document.createElement('canvas');
        const brightFrame = () => {
            const v = videoRef.current;
            if (!v || v.readyState < 2 || v.videoWidth === 0) return null;
            canvas.width = 320;
            canvas.height = Math.round(v.videoHeight * (320 / v.videoWidth));
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.filter = 'brightness(1.5) contrast(1.15)';
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            return canvas;
        };

        const capture = async () => {
            capturing = true; console.log('[scan] challenge finished after ms', Math.round(performance.now() - (window.__scanT0 || performance.now())));
            cancelled = true;
            stage.current = 'hold';
            setRingProgress(1);
            setRingColor('#16a34a');
            setStatusText('\u2713 LEFT  \u2713 RIGHT  \u2713 BLINK  |  Verifying...');
            setSubmitting(true);

            const { token, challenge } = challengeRef.current;
            const opts = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
            let full = null; const tCap = performance.now();
            for (let i = 0; i < 4 && !full; i++) {
                full = await window.faceapi.detectSingleFace(videoRef.current, opts).withFaceLandmarks().withFaceDescriptor(); console.log('[scan] detect+descriptor ms', Math.round(performance.now() - tCap));
            }
            if (!full) {
                setError('Face not detected. Please try again.');
                resetScan();
                return;
            }

            getPos(
                (pos) => {
                    const payload = {
                        face_descriptor: Array.from(full.descriptor),
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        activity_id: activityId ?? null,
                        liveness_token: token,
                        liveness_challenge: challenge, ...(fbCodeRef.current ? { fallback_code: fbCodeRef.current, fallback_photo: grabSelfie() } : {}),
                    };
                    lastScan.current = payload; const tPost = performance.now();
                    router.post(route(mode === 'checkin' ? 'volunteer.face.timein' : 'volunteer.face.timeout'), payload, {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => { console.log('[scan] server round-trip ms', Math.round(performance.now() - tPost)); onSuccess(); router.reload(); },
                        onError: (errors) => {
                            console.error('Time in/out errors:', errors);
                            if (errors.confirm_late) { setLateConfirm(errors.confirm_late); return; }
                            if (errors.confirm_early) { setEarlyConfirm(errors.confirm_early); return; }
                            const msg = Object.values(errors)[0] || 'Face not recognized or out of range. Please try again.';
                            const mm = /Failed attempt (\d+) of/.exec(String(msg));
                            if (mm) setFailCount(parseInt(mm[1], 10));
                            if (fbCodeRef.current) { fbCodeRef.current = ''; setFbActive(false); }
                            setError(msg);
                            resetScan();
                        },
                    });
                },
                (geoErr) => {
                    setError(geoErr?.code === 1
                        ? 'Location access is blocked. Allow location for this site in your browser settings, then try again.'
                        : (geoErr?.code === 3 ? 'Location timed out. Move near a window or turn on GPS, then try again.' : 'Could not get your location. Turn on location or GPS, then try again.'));
                    resetScan();
                }
            );
        };

        const step = async () => {
            if (capturing || pauseRef.current || !videoRef.current || !challengeRef.current) return;

            const frame = brightFrame();
            if (!frame) return;
            const opts = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 288, scoreThreshold: 0.4 });
            const result = await window.faceapi.detectSingleFace(frame, opts).withFaceLandmarks();
            if (!cancelled && !capturing && !result) setStatusText('No face found. Look at the camera.');

            if (cancelled || capturing) return;

            if (!result) {
                poseFrames.current = 0;
                bs.n = 0;
                return;
            }

            const lm = result.landmarks;

            // Is the face inside the oval? (map the frame onto the on-screen video box)
            {
                const bx = result.detection.box;
                const sc = Math.max((OVAL_RX * 2) / frame.width, (OVAL_RY * 2) / frame.height);
                const px = (OVAL_RX * 2 - frame.width * sc) / 2 + (bx.x + bx.width / 2) * sc;
                const py = (OVAL_RY * 2 - frame.height * sc) / 2 + (bx.y + bx.height / 2) * sc;
                const nx = (px - OVAL_RX) / OVAL_RX;
                const ny = (py - OVAL_RY) / OVAL_RY;
                if (nx * nx + ny * ny > 0.6) {
                    poseFrames.current = 0;
                    bs.n = 0;
                    setRingColor('#DC2626');
                    setStatusText('Center your face inside the oval.');
                    return;
                }
            }
            const jaw = lm.getJawOutline();
            const nose = lm.getNose();
            const tip = nose[nose.length - 1];
            const ratio = dist(tip, jaw[0]) / dist(tip, jaw[16]);
            const ear = (eyeAspectRatio(lm.getLeftEye()) + eyeAspectRatio(lm.getRightEye())) / 2;

            // Early face check: reject a wrong face right at the start (normal scan only)
            if (!fbCodeRef.current && preState !== 2) {
                if (preState === 1) return;
                if (ratio < 0.8 || ratio > 1.25) { setStatusText('Look straight at the camera.'); return; }

            // Neutral-face check (mouth closed, eyes open). Tune these two numbers:
            //   MOUTH_MAX: bigger = more relaxed (strict: 0.20, relaxed: 0.35)
            //   EYE_MIN:   smaller = more relaxed (strict: 0.20, relaxed: 0.16)
            {
                const MOUTH_MAX = 0.25;
                const EYE_MIN = 0.18;
                const P = lm.positions;
                const d = (a, b) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
                const mouthOpen = d(62, 66) / d(48, 54);
                const earL = (d(37, 41) + d(38, 40)) / (2 * d(36, 39));
                const earR = (d(43, 47) + d(44, 46)) / (2 * d(42, 45));
                const eyes = (earL + earR) / 2;
                const bad = mouthOpen > MOUTH_MAX || eyes < EYE_MIN;
                // must stay bad for 4 frames in a row, so a normal blink does not fail
                window.__exprBad = bad ? (window.__exprBad || 0) + 1 : 0;
                if (window.__exprBad >= 4) {
                    setRingColor('#DC2626');
                    setStatusText('Relax your face, mouth closed.');
                    return;
                }
            }
                preState = 1;
                setStatusText('Checking your face...');
                try {
                    const o = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
                    const f = await window.faceapi.detectSingleFace(videoRef.current, o).withFaceLandmarks().withFaceDescriptor();
                    if (cancelled) return;
                    if (!f) { preState = 0; return; }
                    const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '');
                    const r = await fetch(route('volunteer.face.precheck'), {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': xsrf },
                        body: JSON.stringify({ face_descriptor: Array.from(f.descriptor) }),
                    });
                    if (cancelled) return;
                    if (r.status === 422) {
                        const j = await r.json().catch(() => ({}));
                        preState = 0;
                        setError(j.message || 'Face not recognized. Please try again.');
                        resetScan();
                        return;
                    }
                    preState = 2;
                } catch (e) {
                    preState = 2;
                }
                return;
            }

            const cur = SEQ[bs.step];
            const done = SEQ.slice(0, bs.step).map(s => '\u2713 ' + s.toUpperCase()).join('  ');
            const prefix = done ? done + '  |  ' : '';

            // short pause after each step so leftover movement does not count
            if (Date.now() - (bs.t || 0) < 600) {
                setRingColor('#16a34a');
                setRingProgress(bs.step / SEQ.length);
                return;
            }

            let passed = false;
            let partial = 0;

            if (cur === 'left' || cur === 'right') {
                const turned = cur === 'left' ? ratio > TURN_LEFT : ratio < TURN_RIGHT;
                poseFrames.current = turned ? poseFrames.current + 1 : 0;
                partial = Math.min(1, poseFrames.current / POSE_NEEDED);
                passed = poseFrames.current >= POSE_NEEDED;
            } else {
                const facing = ratio > 0.7 && ratio < 1.4;
                if (!facing) { bs.n = 0; bs.closed = false; }
                else {
                    bs.base = Math.max((bs.base || 0) * 0.997, ear);
                    if (ear < bs.base * 0.9) { bs.closed = true; }
                    else { if (bs.closed && ear > bs.base * 0.94) passed = true; }
                }
                partial = bs.closed ? 0.5 : 0;
            }

            if (passed) {
                bs.step += 1;
                bs.t = Date.now();
                poseFrames.current = 0;
                bs.closed = false; bs.n = 0; bs.base = 0;
                if (bs.step >= SEQ.length) {
                    await capture();
                } else {
                    setRingColor('#16a34a');
                    setRingProgress(bs.step / SEQ.length);
                    setStatusText('\u2713 ' + cur.toUpperCase() + ' passed  |  ' + (bs.step + 1) + '/3 ' + LABEL[SEQ[bs.step]]);
                }
            } else {
                setRingColor('#f59e0b');
                setRingProgress((bs.step + partial) / SEQ.length);
                setStatusText(prefix + (bs.step + 1) + '/3 ' + LABEL[cur]);
            }
        };

        const loop = async () => {
            const tl = performance.now(); try { await step(); } catch (e) { console.error(e); } window.__scanFrames = (window.__scanFrames || 0) + 1; window.__scanMs = (window.__scanMs || 0) + (performance.now() - tl); if (window.__scanFrames % 25 === 0) console.log('[scan] avg ms per frame', Math.round(window.__scanMs / window.__scanFrames));
            if (!cancelled) timer = setTimeout(loop, 40);
        };
        loop();

        const watchdog = setInterval(() => {
            if (capturing || cancelled || pauseRef.current) return;
            if (Date.now() - (bs.t || Date.now()) > 25000) {
                cancelled = true;
                reportProblem().finally(() => {
                    setError('We could not complete the scan. Please try again with better light and your face inside the oval.');
                    resetScan();
                });
            }
        }, 1000);
        return () => { cancelled = true; clearTimeout(timer); clearInterval(watchdog); };
    }, [modelsReady, challengeReady, submitting, mode, activityId, onSuccess, resetScan]);
    const cx = OVAL_RX + 12;
    const cy = OVAL_RY + 12;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: '#ffffff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Source Sans 3', sans-serif",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />

            <button
                onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); onClose(); }}
                aria-label="Close"
                style={{
                    position: 'absolute', top: '20px', right: '24px',
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#fff3f3', border: '1px solid #ffe2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#DC2626',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '18px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {mode === 'checkin' ? 'Time In' : 'Time Out'}
                </div>
                <div style={{ fontSize: '13px', color: '#999', marginTop: '4px', fontWeight: '300' }}>
                    {statusText}
                </div>
            </div>

            {(earlyConfirm || lateConfirm) && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'grid', placeItems: 'center', padding: '16px', zIndex: 10,
                }}>
                    <div role="dialog" aria-modal="true" style={{
                        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '320px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center', padding: '28px 24px 24px',
                    }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 14px',
                            background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', color: '#b45309', fontWeight: '700',
                        }}>!</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '6px' }}>
                            {lateConfirm ? (mode === 'checkin' ? 'Late Time In' : 'Timing Out Late') : (mode === 'checkin' ? 'Too Early to Time In' : 'Too Early to Time Out')}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#666', lineHeight: '1.6', marginBottom: '18px' }}>
                            {earlyConfirm || lateConfirm}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); onClose(); }}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #ddd',
                                    background: 'white', color: '#444', fontSize: '13px', fontWeight: '600',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={resendConfirmed}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                                    background: '#CC0000', color: 'white', fontSize: '13px', fontWeight: '600',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {failCount >= 3 && !fbActive && !fbOpen && (
                <button
                    type="button"
                    onClick={() => { pauseRef.current = true; setFbOpen(true); setFbStep('ask'); setFbMsg(''); setFbCode(''); }}
                    style={{ marginBottom: '14px', padding: '9px 18px', borderRadius: '10px', border: '1px solid #CC0000', background: 'white', color: '#CC0000', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    Verify another way
                </button>
            )}

            {fbActive && (
                <div style={{ marginBottom: '14px', maxWidth: '320px', textAlign: 'center', fontSize: '12px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '9px 14px' }}>
                    Code ready. Finish the face check (turn left, right, then blink) to record your attendance.
                </div>
            )}

            {fbOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '320px', padding: '22px', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Verify another way</div>
                        {fbStep === 'ask' ? (
                            <>
                                <div style={{ fontSize: '12.5px', color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>
                                    Enter your account password first. Then we will send a 6-digit code to your registered email. You will still need to finish the face check and be inside the activity location.
                                    <input type="password" value={fbPass} onChange={(e) => setFbPass(e.target.value)} placeholder="Account password" autoComplete="current-password" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: '12px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e5e5', fontSize: '13px', fontFamily: 'inherit' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" onClick={cancelFb} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e5e5e5', background: 'white', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                    <button type="button" disabled={fbBusy} onClick={sendFbCode} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#CC0000', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{fbBusy ? 'Sending...' : 'Send code'}</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '12.5px', color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
                                    Type the 6-digit code from your email. It expires in 5 minutes.
                                </div>
                                <input
                                    type="text" inputMode="numeric" maxLength={6} value={fbCode}
                                    onChange={(e) => setFbCode(e.target.value.replace(/\D/g, ''))}
                                    style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #e5e5e5', fontSize: '20px', letterSpacing: '6px', textAlign: 'center', marginBottom: '14px', fontFamily: 'inherit' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" disabled={fbBusy} onClick={sendFbCode} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e5e5e5', background: 'white', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{fbBusy ? 'Sending...' : 'Resend'}</button>
                                    <button type="button" onClick={useFbCode} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#CC0000', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Continue</button>
                                </div>
                                <button type="button" onClick={cancelFb} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            </>
                        )}
                        {fbMsg && <div style={{ marginTop: '12px', fontSize: '12px', color: '#991b1b' }}>{fbMsg}</div>}
                    </div>
                </div>
            )}

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '10px', padding: '10px 16px', fontSize: '12px', marginBottom: '16px', maxWidth: '320px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <div style={{ position: 'relative', width: `${OVAL_RX * 2 + 24}px`, height: `${OVAL_RY * 2 + 24}px` }}>
                <div style={{
                    position: 'absolute', inset: '12px',
                    borderRadius: '50%', overflow: 'hidden', background: '#000',
                }}>
                    <video
                        ref={videoRef}
                        autoPlay muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                </div>
                <svg width={OVAL_RX * 2 + 24} height={OVAL_RY * 2 + 24} style={{ position: 'absolute', top: 0, left: 0 }}>
                    <ellipse cx={cx} cy={cy} rx={OVAL_RX} ry={OVAL_RY} fill="none" stroke="#f0f0f0" strokeWidth="6" />
                    {/* CHANGED: progress arc starts at the top and goes clockwise; no rotate(-90deg), which turned the tall oval into a wide one */}
                    <path
                        d={`M ${cx} ${cy - OVAL_RY} A ${OVAL_RX} ${OVAL_RY} 0 0 1 ${cx} ${cy + OVAL_RY} A ${OVAL_RX} ${OVAL_RY} 0 0 1 ${cx} ${cy - OVAL_RY}`}
                        pathLength="1"
                        fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray="1"
                        strokeDashoffset={1 - ringProgress}
                        style={{ opacity: ringProgress > 0 ? 1 : 0, transition: 'stroke-dashoffset 0.15s linear, stroke 0.2s' }}
                    />
                </svg>
            </div>

            {!modelsReady && (
                <div style={{ marginTop: '18px', fontSize: '12px', color: '#bbb' }}>Loading camera model...</div>
            )}
        </div>
    );
}
