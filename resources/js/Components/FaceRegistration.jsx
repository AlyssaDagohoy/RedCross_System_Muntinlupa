import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

const STEPS = [
    { key: 'intro', title: 'Face Registration', instruction: 'Position your face inside the oval, then hold still.' },
    { key: 'center', title: 'Look Straight Ahead', instruction: 'Keep your face centered and still.' },
    { key: 'left', title: 'Turn Left', instruction: 'Slowly turn your head to the left.' },
    { key: 'right', title: 'Turn Right', instruction: 'Slowly turn your head to the right.' },
    { key: 'blink', title: 'Blink Naturally', instruction: 'Close your eyes for a moment, then open them.' },
    { key: 'uploading', title: 'Saving...', instruction: 'Submitting your face profile for approval.' },
    { key: 'done', title: 'Registered', instruction: 'Your face profile has been registered successfully.' },
];

const OVAL_RX = 140;
const OVAL_RY = 180;
const OVAL_CIRCUMFERENCE = Math.PI * (3 * (OVAL_RX + OVAL_RY) - Math.sqrt((3 * OVAL_RX + OVAL_RY) * (OVAL_RX + 3 * OVAL_RY)));
const HOLD_FRAMES_NEEDED = 8;
const BADGE_SIZE = 40;

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

    const [faceApiReady, setFaceApiReady] = useState(false);
    const [modelsReady, setModelsReady] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
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
            const result = await captureDescriptor();
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
            } else if (step.key === 'left') {
                conditionMet = ratio > 1.7;
            } else if (step.key === 'right') {
                conditionMet = ratio < 0.6;
            } else if (step.key === 'blink') {
                earBase.current = Math.max(earBase.current * 0.98, avgEar);
if (avgEar > earBase.current * 0.88) {
    if (blinkPhase.current === 'closed') blinkPhase.current = 'done';
} else if (avgEar < earBase.current * 0.78 && blinkPhase.current === 'open') {
    blinkPhase.current = 'closed';
}
conditionMet = blinkPhase.current === 'done';
            }

            if (conditionMet) {
                holdCounter.current += 1;
                setRingColor('#DC2626');
                setRingProgress(Math.min(1, holdCounter.current / HOLD_FRAMES_NEEDED));

                if (holdCounter.current >= HOLD_FRAMES_NEEDED) {
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
        }, 300);

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
    const showsCamera = ['center', 'left', 'right', 'blink'].includes(step.key);
    const badgeDone = ringProgress >= 1;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: showsCamera ? '#ffffff' : 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Source Sans 3', sans-serif",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />

            <button
                onClick={() => { stopCamera(); onClose(); }}
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
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {step.title}
                </div>
                <div style={{ fontSize: '13px', color: '#999', marginTop: '4px', fontWeight: '300' }}>
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
                    <div style={{ position: 'relative', width: `${OVAL_RX * 2 + 24}px`, height: `${OVAL_RY * 2 + 24 + BADGE_SIZE / 2}px` }}>
                        <div style={{
                            position: 'absolute', top: 0, left: '12px',
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
                        <svg width={OVAL_RX * 2 + 24} height={OVAL_RY * 2 + 24} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                            <ellipse
                                cx={OVAL_RX + 12} cy={OVAL_RY + 12} rx={OVAL_RX} ry={OVAL_RY}
                                fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={OVAL_CIRCUMFERENCE}
                                strokeDashoffset={dashOffset}
                                style={{ transition: 'stroke-dashoffset 0.15s linear, stroke 0.2s' }}
                            />
                        </svg>

                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: `calc(50% - ${BADGE_SIZE / 2}px)`,
                            width: `${BADGE_SIZE}px`, height: `${BADGE_SIZE}px`,
                            borderRadius: '50%',
                            background: badgeDone ? '#16a34a' : 'white',
                            border: `2px solid ${badgeDone ? '#16a34a' : '#ffe2e2'}`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s, border 0.2s',
                        }}>
                            {badgeDone ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                                <div style={{
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    border: '2.5px solid #ffe2e2',
                                    borderTopColor: detecting ? '#DC2626' : '#f0a8a8',
                                    animation: detecting ? 'faceSpin 0.7s linear infinite' : 'none',
                                }} />
                            )}
                        </div>
                    </div>

                    <style>{`@keyframes faceSpin { to { transform: rotate(360deg); } }`}</style>

                    <div style={{
                        marginTop: '16px', fontFamily: 'monospace', fontSize: '11px',
                        color: '#DC2626', background: '#fff3f3', padding: '6px 14px',
                        borderRadius: '8px', border: '1px solid #ffe2e2',
                    }}>
                        {debugText}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#bbb', fontWeight: '300' }}>
                        Tip: face a light source or window for best detection.
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
                <div style={{ display: 'flex', gap: '6px', marginTop: '24px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                            width: '24px', height: '4px', borderRadius: '2px',
                            background: i <= stepIndex ? '#DC2626' : '#f0d5d5',
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
}