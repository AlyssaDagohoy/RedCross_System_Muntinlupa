import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceAttendance({ todayRecord, activities }) {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [cameraOn, setCameraOn] = useState(false);
    const [mode, setMode] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const alreadyTimedIn = !!todayRecord?.time_in;
    const alreadyTimedOut = !!todayRecord?.time_out;

    useEffect(() => {
        loadModels();
        return () => stopCamera();
    }, []);

    useEffect(() => {
        if (cameraOn) startCamera();
        else stopCamera();
        return () => stopCamera();
    }, [cameraOn]);

    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            ]);
            setModelsLoaded(true);
        } catch (err) {
            setStatus('Failed to load face models.');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setStatus('Camera access denied.');
            setCameraOn(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const getCsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const captureFaceDescriptor = async () => {
        if (!videoRef.current) return null;
        const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        if (!detection) return null;
        return Array.from(detection.descriptor);
    };

    const getLocation = () => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => reject(new Error('Location access denied.'))
        );
    });

    const handleRegister = async () => {
        setLoading(true);
        setStatus('Scanning face...');
        const descriptor = await captureFaceDescriptor();
        if (!descriptor) {
            setStatus('No face detected. Please look at the camera.');
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(route('volunteer.face.register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ face_descriptor: descriptor }),
            });
            const data = await res.json();
            setStatus(data.message);
            if (res.ok) { setCameraOn(false); setMode(null); }
        } catch {
            setStatus('Something went wrong.');
        }
        setLoading(false);
    };

    const handleTimeIn = async () => {
        if (!selectedActivity) { setStatus('Please select an activity.'); return; }
        setLoading(true);
        setStatus('Scanning face...');
        const descriptor = await captureFaceDescriptor();
        if (!descriptor) {
            setStatus('No face detected. Please look at the camera.');
            setLoading(false);
            return;
        }
        setStatus('Checking location...');
        let location;
        try {
            location = await getLocation();
        } catch (e) {
            setStatus(e.message);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(route('volunteer.face.timein'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ activity_id: selectedActivity, face_descriptor: descriptor, ...location }),
            });
            const data = await res.json();
            setStatus(data.message);
            if (res.ok) { stopCamera(); setCameraOn(false); setMode(null); setTimeout(() => window.location.reload(), 1500); }
        } catch {
            setStatus('Something went wrong.');
        }
        setLoading(false);
    };

    const handleTimeOut = async () => {
        if (!selectedActivity) { setStatus('Please select an activity.'); return; }
        setLoading(true);
        setStatus('Scanning face...');
        const descriptor = await captureFaceDescriptor();
        if (!descriptor) {
            setStatus('No face detected. Please look at the camera.');
            setLoading(false);
            return;
        }
        setStatus('Checking location...');
        let location;
        try {
            location = await getLocation();
        } catch (e) {
            setStatus(e.message);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(route('volunteer.face.timeout'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ activity_id: selectedActivity, face_descriptor: descriptor, ...location }),
            });
            const data = await res.json();
            setStatus(data.message);
            if (res.ok) { stopCamera(); setCameraOn(false); setMode(null); setTimeout(() => window.location.reload(), 1500); }
        } catch {
            setStatus('Something went wrong.');
        }
        setLoading(false);
    };

    const startMode = (m) => {
        setMode(m);
        setStatus('');
        setCameraOn(true);
    };

    const cancelMode = () => {
        setMode(null);
        setCameraOn(false);
        setStatus('');
        stopCamera();
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Today's Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                    { label: 'Time In', value: todayRecord?.time_in ? new Date(todayRecord.time_in).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '— : —', color: '#16a34a' },
                    { label: 'Time Out', value: todayRecord?.time_out ? new Date(todayRecord.time_out).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '— : —', color: '#CC0000' },
                    { label: 'Hours Today', value: todayRecord?.hours_rendered ? parseFloat(todayRecord.hours_rendered).toFixed(2) : '0.00', color: '#111' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '14px 10px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600', marginBottom: '6px' }}>{label}</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Activity Selector */}
            {!alreadyTimedOut && (
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Select Activity
                    </div>
                    <select
                        value={selectedActivity}
                        onChange={e => setSelectedActivity(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px',
                            border: '1px solid #ebebeb', borderRadius: '8px',
                            fontSize: '12px', color: '#333', background: 'white',
                            outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">-- Select your assigned activity --</option>
                        {activities?.map(a => (
                            <option key={a.id} value={a.id}>{a.name} — {a.location_name} ({a.date})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Models loading */}
            {!modelsLoaded && (
                <div style={{ fontSize: '11px', color: '#bbb', marginBottom: '12px' }}>
                    Loading face recognition models...
                </div>
            )}

            {/* Camera */}
            {cameraOn && (
                <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        style={{ width: '100%', maxWidth: '380px', borderRadius: '8px', border: '1.5px solid #ebebeb' }}
                    />
                </div>
            )}

            {/* Status */}
            {status && (
                <div style={{
                    padding: '9px 14px', borderRadius: '7px', marginBottom: '14px', fontSize: '11px', fontWeight: '500',
                    background: (status.toLowerCase().includes('success') || status.toLowerCase().includes('timed') || status.toLowerCase().includes('registered')) ? '#f0fdf4' : '#fef2f2',
                    color: (status.toLowerCase().includes('success') || status.toLowerCase().includes('timed') || status.toLowerCase().includes('registered')) ? '#166534' : '#991b1b',
                    border: (status.toLowerCase().includes('success') || status.toLowerCase().includes('timed') || status.toLowerCase().includes('registered')) ? '1px solid #bbf7d0' : '1px solid #fecaca',
                }}>
                    {status}
                </div>
            )}

            {/* Action Buttons */}
            {!mode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                        onClick={() => startMode('timein')}
                        disabled={alreadyTimedIn || !modelsLoaded}
                        style={{
                            padding: '10px', borderRadius: '7px', border: 'none', fontSize: '11px', fontWeight: '600',
                            cursor: alreadyTimedIn || !modelsLoaded ? 'not-allowed' : 'pointer',
                            background: alreadyTimedIn ? '#f5f5f5' : '#16a34a',
                            color: alreadyTimedIn ? '#bbb' : 'white',
                            transition: 'background 0.15s',
                        }}
                    >
                        {alreadyTimedIn ? 'Timed In' : 'Face Time In'}
                    </button>
                    <button
                        onClick={() => startMode('timeout')}
                        disabled={!alreadyTimedIn || alreadyTimedOut || !modelsLoaded}
                        style={{
                            padding: '10px', borderRadius: '7px', border: 'none', fontSize: '11px', fontWeight: '600',
                            cursor: (!alreadyTimedIn || alreadyTimedOut) ? 'not-allowed' : 'pointer',
                            background: alreadyTimedOut ? '#f5f5f5' : !alreadyTimedIn ? '#f5f5f5' : '#CC0000',
                            color: (alreadyTimedOut || !alreadyTimedIn) ? '#bbb' : 'white',
                            transition: 'background 0.15s',
                        }}
                    >
                        {alreadyTimedOut ? 'Timed Out' : 'Face Time Out'}
                    </button>
                </div>
            ) : mode !== 'register' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                        onClick={cancelMode}
                        style={{ padding: '10px', borderRadius: '7px', border: '1px solid #ebebeb', cursor: 'pointer', background: 'white', color: '#555', fontSize: '11px', fontWeight: '600' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={mode === 'timein' ? handleTimeIn : handleTimeOut}
                        disabled={loading || !modelsLoaded}
                        style={{
                            padding: '10px', borderRadius: '7px', border: 'none', fontSize: '11px', fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            background: '#CC0000', color: 'white',
                        }}
                    >
                        {loading ? 'Processing...' : 'Capture & Submit'}
                    </button>
                </div>
            ) : null}

            {/* Register Face */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f5f5f5' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#bbb', marginBottom: '8px' }}>
                    First time? Register your face
                </div>
                {mode === 'register' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={cancelMode} style={{ padding: '9px', borderRadius: '7px', border: '1px solid #ebebeb', cursor: 'pointer', background: 'white', color: '#555', fontSize: '11px', fontWeight: '600' }}>
                            Cancel
                        </button>
                        <button onClick={handleRegister} disabled={loading || !modelsLoaded} style={{ padding: '9px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: '#111', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                            {loading ? 'Registering...' : 'Capture Face'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => startMode('register')}
                        disabled={!modelsLoaded}
                        style={{
                            width: '100%', padding: '9px', borderRadius: '7px', border: 'none',
                            cursor: modelsLoaded ? 'pointer' : 'not-allowed',
                            background: '#111', color: 'white', fontSize: '11px', fontWeight: '600',
                        }}
                    >
                        Register Face
                    </button>
                )}
            </div>
        </div>
    );
}