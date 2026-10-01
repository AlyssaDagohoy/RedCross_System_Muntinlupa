import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import FaceRegistration from '@/Components/FaceRegistration';

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

function RunningTimer({ record, activity }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (!record?.time_in || record?.time_out) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [record?.time_in, record?.time_out]);

    const punctuality = record?.time_in_status
        ? (record.time_in_status === 'on_time' ? 'ontime' : record.time_in_status)
        : getPunctuality(record?.time_in, activity?.start_time);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
            marginBottom: '16px', flexWrap: 'wrap',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Time In
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
                    {formatTime(record?.time_in)}
                </div>
            </div>

            <div style={{ width: '1px', height: '34px', background: '#eee' }} />

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Now
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>
                    {formatTime(now)} <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: '600' }}>(running)</span>
                </div>
            </div>

            {punctuality && (
                <>
                    <div style={{ width: '1px', height: '34px', background: '#eee' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            Status
                        </div>
                        <div style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px',
                            display: 'inline-block',
                            background: punctuality === 'early' ? '#eff6ff' : punctuality === 'ontime' ? '#f0fdf4' : '#fef2f2',
                            color: punctuality === 'early' ? '#3B82F6' : punctuality === 'ontime' ? '#16a34a' : '#DC2626',
                        }}>
                            {punctuality === 'early' ? 'Early' : punctuality === 'ontime' ? 'On Time' : 'Late'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// NEW: popup shown right after a Time In / Time Out is saved.
function ScanSuccessModal({ mode, activityName, onClose }) {
    const isCheckin = mode === 'checkin';

    return (
        <div
            role="presentation"
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'grid', placeItems: 'center', padding: '16px', zIndex: 3000,
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '16px', width: '100%', maxWidth: '320px',
                    overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
                    padding: '28px 24px 24px',
                }}
            >
                <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 14px',
                    background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>

                <div style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '6px' }}>
                    {isCheckin ? 'Time In Successful' : 'Time Out Successful'}
                </div>

                <div style={{ fontSize: '12.5px', color: '#666', lineHeight: '1.6', marginBottom: '18px' }}>
                    {isCheckin
                        ? <>You're now <strong style={{ color: '#b45309' }}>Ongoing</strong> for <strong>{activityName}</strong>.</>
                        : <>Your hours for <strong>{activityName}</strong> have been recorded.</>
                    }
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                        background: '#CC0000', color: 'white', fontSize: '13px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Got it
                </button>
            </div>
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
                {isOngoing && <RunningTimer record={todayRecord} activity={activeActivity} />}

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

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>
                    {isOngoing ? 'Ready to time out.' : `Ready to ${mode === 'checkin' ? 'time in' : 'time out'}.`}
                </div>
                <button
                    onClick={() => {
                        // remember what is being scanned, for the success popup
                        captureInfo.current = { mode, activityName: activeActivity?.name || 'the activity' };
                        setShowCapture(true);
                    }}
                    disabled={!canProceed}
                    style={{
                        background: canProceed ? '#DC2626' : '#f0a8a8', color: 'white', border: 'none',
                        padding: '12px 32px', borderRadius: '100px', fontSize: '13.5px', fontWeight: '600',
                        cursor: canProceed ? 'pointer' : 'not-allowed', fontFamily: "'Source Sans 3', sans-serif",
                    }}
                >
                    {mode === 'checkin' ? 'Time In' : 'Time Out'}
                </button>
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

            {successInfo && (
                <ScanSuccessModal
                    mode={successInfo.mode}
                    activityName={successInfo.activityName}
                    onClose={() => setSuccessInfo(null)}
                />
            )}
        </>
    );
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// CHANGED: exported so other pages (e.g. the volunteer dashboard) can open this
// capture overlay directly, without going through the full FaceAttendance flow.
export function AttendanceCapture({ mode, activityId, onClose, onSuccess }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const holdCounter = useRef(0);

    const [modelsReady, setModelsReady] = useState(!!window.faceapi?.nets?.tinyFaceDetector?.isLoaded);
    const [ringProgress, setRingProgress] = useState(0);
    const [ringColor, setRingColor] = useState('#e5e5e5');
    const [statusText, setStatusText] = useState('Position your face in the oval');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // NEW: "too early" confirmation. The server asks for it, Confirm resends with confirm_early.
    const [earlyConfirm, setEarlyConfirm] = useState('');
    const [lateConfirm, setLateConfirm] = useState('');
    const lastScan = useRef(null);

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
            onSuccess: () => onSuccess(),
            onError: (errors) => {
                setError(Object.values(errors)[0] || 'Something went wrong. Please try again.');
                setRingColor('#DC2626');
                setSubmitting(false);
                holdCounter.current = 0;
                setRingProgress(0);
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
            setModelsReady(true);
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
        if (!modelsReady || submitting) return;
        let cancelled = false;

        const interval = setInterval(async () => {
            if (cancelled || !videoRef.current) return;
            const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
            const result = await window.faceapi
                .detectSingleFace(videoRef.current, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!result) {
                holdCounter.current = 0;
                setRingProgress(0);
                setRingColor('#e5e5e5');
                setStatusText('Position your face in the oval');
                return;
            }

            holdCounter.current += 1;
            setRingColor('#DC2626');
            setStatusText('Hold still...');
            setRingProgress(Math.min(1, holdCounter.current / HOLD_FRAMES_NEEDED));

            if (holdCounter.current >= HOLD_FRAMES_NEEDED) {
                cancelled = true;
                clearInterval(interval);
                setRingColor('#16a34a');
                setStatusText('Verifying...');
                setSubmitting(true);

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        lastScan.current = {
                            face_descriptor: Array.from(result.descriptor),
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            activity_id: activityId ?? null,
                        };
                        router.post(route(mode === 'checkin' ? 'volunteer.face.timein' : 'volunteer.face.timeout'), {
                            face_descriptor: Array.from(result.descriptor),
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            activity_id: activityId ?? null,
                        }, {
                            // CHANGED: without these, Inertia rebuilds the whole page when the server
                            // answers and wipes local state, which made the success popup disappear.
                            preserveState: true,
                            preserveScroll: true,
                            onSuccess: () => onSuccess(),
                            onError: (errors) => {
                                console.error('Time in/out errors:', errors);
                                if (errors.confirm_late) {
                                    setLateConfirm(errors.confirm_late);
                                    return;
                                }
                                if (errors.confirm_early) {
                                    setEarlyConfirm(errors.confirm_early);
                                    return;
                                }
                                setError(Object.values(errors)[0] || 'Face not recognized or out of range. Please try again.');
                                setRingColor('#DC2626');
                                setSubmitting(false);
                                holdCounter.current = 0;
                                setRingProgress(0);
                            },
                        });
                    },
                    (geoErr) => {
                        // CHANGED: say what to do, depending on why location failed.
                        setError(geoErr?.code === 1
                            ? 'Location access is blocked. Allow location for this site in your browser settings, then try again.'
                            : 'Could not get your location. Turn on location or GPS, then try again.');
                        setSubmitting(false);
                        holdCounter.current = 0;
                        setRingProgress(0);
                    }
                );
            }
        }, 180);

        return () => { cancelled = true; clearInterval(interval); };
    }, [modelsReady, submitting, mode, activityId, onSuccess]);

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
                        fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
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
