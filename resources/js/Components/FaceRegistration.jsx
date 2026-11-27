import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

const STEPS = [
    { key: 'intro', title: 'Face registration', instruction: 'Position your face inside the oval, then hold still.' },
    { key: 'center', title: 'Look straight ahead', instruction: 'Keep your face centered and still.' },
    { key: 'left', title: 'Turn left', instruction: 'Slowly turn your head to the left.' },
    { key: 'right', title: 'Turn right', instruction: 'Slowly turn your head to the right.' },
    { key: 'blink', title: 'Blink naturally', instruction: 'Close your eyes for a moment, then open them.' },
    { key: 'uploading', title: 'Saving...', instruction: 'Submitting your face profile for approval.' },
    { key: 'done', title: 'Registered', instruction: 'Your face profile has been registered successfully.' },
];

const OVAL_RX = 140;
const OVAL_RY = 180;
const OVAL_CIRCUMFERENCE = Math.PI * (3 * (OVAL_RX + OVAL_RY) - Math.sqrt((3 * OVAL_RX + OVAL_RY) * (OVAL_RX + 3 * OVAL_RY)));
const HOLD_FRAMES_NEEDED = 6;
const BADGE_SIZE = 40;
const RING_CX = OVAL_RX + 12;
const RING_CY = OVAL_RY + 12;
const RING_PATH = `M ${RING_CX} ${RING_CY - OVAL_RY} A ${OVAL_RX} ${OVAL_RY} 0 1 1 ${RING_CX} ${RING_CY + OVAL_RY} A ${OVAL_RX} ${OVAL_RY} 0 1 1 ${RING_CX} ${RING_CY - OVAL_RY}`;
const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspectRatio(eye) {
    const a = dist(eye[1], eye[5]);
    const b = dist(eye[2], eye[4]);
    const c = dist(eye[0], eye[3]);
    return (a + b) / (2 * c);
}

export default function FaceRegistration({ onClose, onRegistered }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const holdCounter = useRef(0);
    const blinkPhase = useRef('open');
const earBase = useRef(0);
    const baseRatio = useRef(0);

    const [faceApiReady, setFaceApiReady] = useState(false);
    const [modelsReady, setModelsReady] = useState(false);
    const [stepIndex, setStepIndex] = useState(1);
    const [ringProgress, setRingProgress] = useState(0);
    const [ringColor, setRingColor] = useState('#e5e5e5');
    const [error, setError] = useState('');
    const [debugText, setDebugText] = useState('waiting for face...');
    const [detecting, setDetecting] = useState(false);
    const descriptorsRef = useRef([]);

    const step = STEPS[stepIndex];

    useEffect(() => {
        if (window.faceapi) { setFaceApiReady(true); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = () => setFaceApiReady(true);
        script.onerror = () => setError('Could not load face detection library.');
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (!faceApiReady) return;
        (async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsReady(true);
            } catch (e) {
                setError('Could not load face detection models. Check /models folder.');
            }
        })();
    }, [faceApiReady]);

    useEffect(() => {
        if (step.key !== 'intro' && step.key !== 'uploading' && step.key !== 'done' && modelsReady) {
            startCamera();
        }
        return () => stopCamera();
    }, [step.key, modelsReady]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 800 } },
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
            setError('Camera access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const getBrightenedCanvas = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const scale = 320 / video.videoWidth;
        canvas.width = 320;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.filter = 'brightness(1.5) contrast(1.15)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas;
    }, []);

    const captureQuick = async () => {
        const canvas = getBrightenedCanvas();
        if (!canvas) return null;
        const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 });
        return await window.faceapi
            .detectSingleFace(canvas, options)
            .withFaceLandmarks();
    };

    const captureDescriptor = useCallback(async () => {
        const canvas = getBrightenedCanvas();
        if (!canvas) return null;
        const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 });
        return await window.faceapi
            .detectSingleFace(canvas, options)
            .withFaceLandmarks()
            .withFaceDescriptor();
    }, [getBrightenedCanvas]);

    useEffect(() => {
        if (!modelsReady) return;
        if (!['center', 'left', 'right', 'blink'].includes(step.key)) return;

        let cancelled = false;
        holdCounter.current = 0;
        blinkPhase.current = 'open';
earBase.current = 0;

        const interval = setInterval(async () => {
            if (cancelled) return;
            setDetecting(true);
            const result = await captureQuick();
            if (cancelled) { setDetecting(false); return; }
            setDetecting(false);

            if (!result) {
                setRingColor('#e5e5e5');
                holdCounter.current = 0;
                setRingProgress(0);
                setDebugText('no face detected');
if (step.key === 'blink' && blinkPhase.current === 'open' && earBase.current > 0) blinkPhase.current = 'closed';
                return;
            }

            const landmarks = result.landmarks;
            const jaw = landmarks.getJawOutline();
            const nose = landmarks.getNose();
            const noseTip = nose[nose.length - 1];
            const distLeft = dist(noseTip, jaw[0]);
            const distRight = dist(noseTip, jaw[16]);
            const ratio = distLeft / distRight;

            const leftEar = eyeAspectRatio(landmarks.getLeftEye());
            const rightEar = eyeAspectRatio(landmarks.getRightEye());
            const avgEar = (leftEar + rightEar) / 2;

            setDebugText(`ratio: ${ratio.toFixed(2)} | ear: ${avgEar.toFixed(2)} | step: ${step.key}`);

            let conditionMet = false;

            if (step.key === 'center') {
                conditionMet = ratio > 0.6 && ratio < 1.7;
                if (conditionMet) baseRatio.current = baseRatio.current ? baseRatio.current * 0.7 + ratio * 0.3 : ratio;
            } else if (step.key === 'left') {
                conditionMet = ratio > (baseRatio.current || 1.2) * 1.3;
            } else if (step.key === 'right') {
                conditionMet = ratio < (baseRatio.current || 1.2) * 0.77;
            } else if (step.key === 'blink') {
                if (blinkPhase.current === 'open') earBase.current = earBase.current ? earBase.current * 0.9 + avgEar * 0.1 : avgEar;
if (avgEar > earBase.current * 0.93) {
    if (blinkPhase.current === 'closed') blinkPhase.current = 'done';
} else if (avgEar < earBase.current * 0.87 && blinkPhase.current === 'open') {
    blinkPhase.current = 'closed';
}
conditionMet = blinkPhase.current === 'done';
                if (conditionMet) holdCounter.current = HOLD_FRAMES_NEEDED - 1;
            }

            if (conditionMet) {
                holdCounter.current += 1;
                setRingColor('#DC2626');
                setRingProgress(Math.min(1, holdCounter.current / HOLD_FRAMES_NEEDED));

                if (holdCounter.current >= HOLD_FRAMES_NEEDED) {
                    cancelled = true;
                    const finalRes = await captureDescriptor();
                    if (!finalRes) { cancelled = false; holdCounter.current = HOLD_FRAMES_NEEDED - 1; return; }
                    result.descriptor = finalRes.descriptor;
                    cancelled = true;
                    descriptorsRef.current.push(Array.from(result.descriptor));
                    setRingColor('#16a34a');
                    setTimeout(() => {
                        setRingProgress(0);
                        setRingColor('#e5e5e5');
                        setStepIndex(i => i + 1);
                    }, 400);
                }
            } else {
                holdCounter.current = Math.max(0, holdCounter.current - 1);
                setRingColor('#f59e0b');
                setRingProgress(Math.min(1, holdCounter.current / HOLD_FRAMES_NEEDED));
            }
        }, step.key === 'blink' ? 100 : 200);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [step.key, modelsReady, captureDescriptor]);

    useEffect(() => {
        if (step.key !== 'uploading') return;
        stopCamera();

        // Average the 4 captured descriptors (center/left/right/blink) into one 128-length vector
        const all = descriptorsRef.current;
        const length = all[0].length;
        const avgDescriptor = new Array(length).fill(0);
        all.forEach(desc => {
            desc.forEach((val, i) => { avgDescriptor[i] += val / all.length; });
        });

        router.post(route('volunteer.face.register'), {
            face_descriptor: avgDescriptor,
        }, {
            onSuccess: () => setStepIndex(i => i + 1),
            onError: (errors) => {
                console.error('Face registration submit errors:', errors);
                const firstError = Object.values(errors)[0] || 'Unknown error';
                setError(`Failed to submit: ${firstError}`);
            },
        });
    }, [step.key]);

    const dashOffset = OVAL_CIRCUMFERENCE * (1 - ringProgress);
    const turnDir = step.key === 'left' ? -1 : step.key === 'right' ? 1 : 0;
    const ringEdgeX = RING_CX + turnDir * OVAL_RX;
    const chevron = (tip) => `M ${tip - turnDir * 10} ${RING_CY - 16} L ${tip} ${RING_CY} L ${tip - turnDir * 10} ${RING_CY + 16}`;
    const arrowPaths = null;
    const statusText = ringColor === '#16a34a' ? 'Got it' : ringColor === '#DC2626' ? 'Good, hold it there' : ringColor === '#f59e0b' ? 'Keep going slowly' : (modelsReady ? 'Looking for your face...' : 'Loading camera...');
    const showsCamera = ['center', 'left', 'right', 'blink'].includes(step.key);
    const badgeDone = ringProgress >= 1;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: showsCamera ? 'linear-gradient(#ffffff 35%, #fff0f0 100%)' : 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '80px', boxSizing: 'border-box', overflowY: 'auto',
            fontFamily: "'Source Sans 3', sans-serif",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Source+Sans+3:wght@300;400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

            <button
                onClick={() => { stopCamera(); onClose(); }}
                aria-label="Close"
                style={{
                    position: 'absolute', top: '20px', right: '24px',
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#999',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '17px', fontWeight: '700', color: '#111' }}>
                    {step.title}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#555', marginTop: '6px', fontWeight: '400', background: '#ffffff', border: '1px solid #f0d5d5', padding: '5px 16px', borderRadius: '100px', display: 'inline-block' }}>
                    {step.instruction}
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '10px', padding: '10px 16px', fontSize: '12px', marginBottom: '16px', maxWidth: '320px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {step.key === 'intro' && (
                <button
                    onClick={() => setStepIndex(1)}
                    disabled={!modelsReady}
                    style={{
                        background: modelsReady ? '#DC2626' : '#f0a8a8', color: 'white', border: 'none',
                        padding: '13px 34px', borderRadius: '100px', fontSize: '13.5px', fontWeight: '600',
                        cursor: modelsReady ? 'pointer' : 'not-allowed', fontFamily: "'Source Sans 3', sans-serif",
                    }}
                >
                    {modelsReady ? 'Start Registration' : 'Loading camera model...'}
                </button>
            )}

            {showsCamera && (
                <>
                    <div style={{ position: 'relative', width: `${OVAL_RX * 2 + 24}px`, height: `${OVAL_RY * 2 + 24}px` }}>
                        <div style={{
                            position: 'absolute', top: '12px', left: '12px',
                            width: `${OVAL_RX * 2}px`, height: `${OVAL_RY * 2}px`,
                            borderRadius: '50%', overflow: 'hidden',
                            background: '#000',
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay muted playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />
                        </div>
                        <svg width={OVAL_RX * 2 + 24} height={OVAL_RY * 2 + 24} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
                            <path d={RING_PATH} fill="none" stroke="#eeeeee" strokeWidth="4" />
                            {ringProgress > 0 && (
                                <path
                                    d={RING_PATH} fill="none" stroke={ringColor} strokeWidth="5" strokeLinecap="round"
                                    pathLength="100" strokeDasharray={`${ringProgress * 100} 100`}
                                    transform={step.key === 'left' ? `translate(${OVAL_RX * 2 + 24} 0) scale(-1 1)` : undefined}
                                    style={{ transition: 'stroke-dasharray 0.15s linear, stroke 0.2s' }}
                                />
                            )}
                            {arrowPaths && (
                                <g fill="none" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={arrowPaths[0]} />
                                    <path d={arrowPaths[1]} opacity="0.4" />
                                </g>
                            )}
                        </svg>


                    </div>

                    <style>{`@keyframes faceSpin { to { transform: rotate(360deg); } }`}</style>

                    <div style={{
                        marginTop: '16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '500', color: ringColor === '#16a34a' ? '#16a34a' : '#B71C1C',
                        padding: 0, borderRadius: 0,
                    }}>
                        {statusText}
                    </div>
                    {DEBUG && (
                        <div style={{
                            marginTop: '8px', fontFamily: 'monospace', fontSize: '11px',
                            color: '#DC2626', background: '#fff3f3', padding: '6px 14px',
                            borderRadius: '8px', border: '1px solid #ffe2e2',
                        }}>
                            {debugText}
                        </div>
                    )}
                    <div style={{ marginTop: '8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999', fontWeight: '300', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" /></svg>
                        Face a window or light for best detection
                    </div>
                </>
            )}

            {step.key === 'uploading' && (
                <div style={{
                    width: `${OVAL_RX * 2}px`, height: `${OVAL_RY * 2}px`, borderRadius: '50%',
                    background: '#fff3f3', border: '2px dashed #ffe2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600' }}>Submitting...</span>
                </div>
            )}

            {step.key === 'done' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <button
                        onClick={() => { onRegistered && onRegistered(); onClose(); }}
                        style={{
                            background: '#DC2626', color: 'white', border: 'none',
                            padding: '12px 30px', borderRadius: '100px', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
                        }}
                    >
                        Continue
                    </button>
                </div>
            )}

            {stepIndex > 0 && stepIndex < 5 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: i <= stepIndex ? '#B71C1C' : '#f0d5d5',
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
}