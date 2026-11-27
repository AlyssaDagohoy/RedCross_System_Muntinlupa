import LocationPicker from '../../../Components/LocationPicker';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminShell from '../../../Components/AdminShell';

/*
  Step-by-step create page: Details -> Location -> Volunteers -> Review.

  GPS handling: admins never see or type raw latitude/longitude. They type a
  location name, hit "Confirm on map", and a geocoder (OpenStreetMap
  Nominatim) resolves it. Submitting without a confirmed location is blocked.

  Radius is not admin-editable. FIXED_RADIUS_METERS is sent on every create.

  Type: Field Activity or Branch Activity.
    - Branch Activity: fills in the branch location automatically (locked).
    - Field Activity: clears the location so the admin types the place and
      presses "Confirm on map".

  Duplicate names: existingNames comes from the controller. The name is
  compared ignoring uppercase/lowercase and extra spaces, so "Blood" and
  "blood" count as the same activity. The server checks again on save.
*/

const FIXED_RADIUS_METERS = 500;

/* Today's date in the computer's local time (YYYY-MM-DD). Used as the default; admins can still change it. */
const todayLocal = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* Same name check as the server: lowercase, trimmed, repeated spaces collapsed. */
const normalizeName = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

const dupMessage = (name) => `An activity named "${name}" already exists. Please use a different name.`;

/*
  Keep these the same as in Edit.jsx. If latitude/longitude are null, the
  page looks up BRANCH.address on OpenStreetMap for Branch Activities.
*/
const BRANCH = {
    address: 'Red Cross Center, Centennial Lane, Filinvest Corporate City, Alabang, Muntinlupa City, Metro Manila, Philippines',
    latitude: 14.4180,
    longitude: 121.0390,
};

const hasBranchCoords = BRANCH.latitude !== null && BRANCH.longitude !== null;

const STEPS = ['Type', 'Details', 'Location', 'Volunteers', 'Review'];

const STEP_1_FIELDS = ['type'];
const STEP_2_FIELDS = ['name', 'date', 'start_time', 'end_time', 'description', 'assigned_by', 'status'];
const STEP_3_FIELDS = ['location_name', 'latitude', 'longitude', 'radius_meters'];

const card = { background: 'white', border: '1px solid #ececec', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06)', borderRadius: '14px', overflow: 'hidden' };
const cardBody = { padding: '24px' };
const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ebebeb', borderRadius: '10px',
    fontSize: '13px', fontFamily: 'inherit', color: '#222', boxSizing: 'border-box', background: '#fafafa',
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#333' };
const errorStyle = { color: '#CC0000', fontSize: '11.5px', marginTop: '5px' };
const hintStyle = { fontSize: '11.5px', color: '#999', marginTop: '6px' };
const sectionTitle = { fontSize: '12px', fontWeight: '600', color: '#A32D2D', marginBottom: '14px' };

const TYPE_OPTIONS = [
    { value: 'field', label: 'Field Activity', hint: 'Outside the branch, e.g. blood drives, relief operations' },
    { value: 'branch', label: 'Branch Activity', hint: 'Inside the branch, e.g. orientations, trainings' },
];

const STATUS_LABELS = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' };

export default function Create({ volunteers, defaultType = 'field', existingNames = [] }) { const { adminProfile, auth } = usePage().props; const assignedByName = adminProfile || auth?.user?.name || '';
    const startsAsBranch = defaultType === 'branch';

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        name: '',
        type: startsAsBranch ? 'branch' : 'field',
        description: '',
        date: todayLocal(),
        start_time: '',
        end_time: '',
        location_name: startsAsBranch ? BRANCH.address : '',
        latitude: startsAsBranch && hasBranchCoords ? Number(BRANCH.latitude).toFixed(8) : '',
        longitude: startsAsBranch && hasBranchCoords ? Number(BRANCH.longitude).toFixed(8) : '',
        radius_meters: FIXED_RADIUS_METERS,
        status: 'upcoming',
        assigned_by: assignedByName,
        volunteer_ids: [],
    });

    const [step, setStep] = useState(1);
    const [stepError, setStepError] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState(
        startsAsBranch && hasBranchCoords ? { ok: true, message: BRANCH.address } : null
    );
    const [volunteerFilter, setVolunteerFilter] = useState('');
    const [pinCoord, setPinCoord] = useState('');
    const [nameEdited, setNameEdited] = useState(false);

    const locationConfirmed = !!(data.latitude && data.longitude);
    const pinLocked = !!pinCoord && pinCoord === data.latitude;
    const isBranch = data.type === 'branch';

    // The existing activity that has the same name as what is typed (null if none)
    const duplicateName = (() => {
        const wanted = normalizeName(data.name);
        if (!wanted) return null;
        return existingNames.find((n) => normalizeName(n) === wanted) ?? null;
    })();

    // Page opened as a branch activity (?type=branch) without fixed coordinates: look the branch up once.
    useEffect(() => {
        if (startsAsBranch && !hasBranchCoords) {
            lookUpBranch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If the server sends back validation errors, jump to the step that has the problem.
    useEffect(() => {
        const keys = Object.keys(errors);
        if (keys.length === 0) return;
        if (keys.some((k) => STEP_1_FIELDS.includes(k))) setStep(1);
        else if (keys.some((k) => STEP_2_FIELDS.includes(k))) setStep(2);
        else if (keys.some((k) => STEP_3_FIELDS.includes(k))) setStep(3);
        else if (keys.some((k) => k.startsWith('volunteer_ids'))) setStep(4);
    }, [errors]);

    const validateStep = (n) => {
        if (n === 2) {
            if (!data.name.trim()) return 'Enter an activity name.';
            if (duplicateName) return dupMessage(duplicateName);
            if (!data.date) return 'Pick a date.';
            if (!data.start_time || !data.end_time) return 'Set the start and end time.';
        }
        if (n === 3) {
            if (!locationConfirmed) return 'Confirm the location on the map first.';
        }
        return '';
    };

    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const goNext = () => {
        const msg = validateStep(step);
        if (msg) {
            setStepError(msg);
            return;
        }
        setStepError('');
        setStep((s) => Math.min(STEPS.length, s + 1));
        scrollTop();
    };

    const goBack = () => {
        setStepError('');
        setStep((s) => Math.max(1, s - 1));
        scrollTop();
    };

    const goToStep = (n) => {
        if (n >= step) return;
        setStepError('');
        setStep(n);
        scrollTop();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (step < STEPS.length) {
            goNext();
            return;
        }
        for (const n of [2, 3]) {
            const msg = validateStep(n);
            if (msg) {
                setStep(n);
                setStepError(msg);
                scrollTop();
                return;
            }
        }
        post(route('admin.activities.store'));
    };

    const handleNameChange = (value) => {
        setData('name', value);
        clearErrors('name');
        setStepError('');
    };

    const handleVolunteerToggle = (id) => {
        const current = data.volunteer_ids;
        setData('volunteer_ids', current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);
    };

    const [suggestions, setSuggestions] = useState([]);

    const fetchSuggestions = (value) => {
        clearTimeout(window.__locSuggestTimer);
        const seq = (window.__locSuggestSeq = (window.__locSuggestSeq || 0) + 1);
        const q = cleanQuery(value);
        if (q.length < 2) { setSuggestions([]); return; }
        window.__locSuggestTimer = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=ph&viewbox=120.95,14.50,121.12,14.28`);
                const results = await res.json();
                if (seq !== window.__locSuggestSeq) return;
                setSuggestions(Array.isArray(results) ? results : []);
            } catch {
                if (seq === window.__locSuggestSeq) setSuggestions([]);
            }
        }, 600);
    };

    const pickSuggestion = (s) => {
        clearTimeout(window.__locSuggestTimer);
        window.__locSuggestSeq = (window.__locSuggestSeq || 0) + 1;
        setData((prev) => ({
            ...prev,
            location_name: s.display_name,
            latitude: parseFloat(s.lat).toFixed(8),
            longitude: parseFloat(s.lon).toFixed(8),
        }));
        setSuggestions([]);
        setLocationStatus({ ok: true, message: s.display_name });
        setNameEdited(false);
        if (typeof clearErrors === 'function') clearErrors('location_name');
    };

    const handlePinPick = async (pinLat, pinLon) => {
        const seq = (window.__pinSeq = (window.__pinSeq || 0) + 1);
        const latStr = Number(pinLat).toFixed(8);
        const lonStr = Number(pinLon).toFixed(8);
        setPinCoord(latStr);
        setNameEdited(false);
        setData((prev) => ({ ...prev, latitude: latStr, longitude: lonStr }));
        setSearchLoading(true);
        let placeName = `Pinned location (${Number(pinLat).toFixed(5)}, ${Number(pinLon).toFixed(5)})`;
        try {
            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pinLat}&lon=${pinLon}&format=json&zoom=18`);
            const info = await rev.json();
            if (info && info.display_name) placeName = info.display_name;
        } catch {}
        if (seq !== window.__pinSeq) return;
        setData((prev) => ({ ...prev, location_name: placeName, latitude: latStr, longitude: lonStr }));
        setLocationStatus({ ok: true, message: placeName });
        if (typeof clearErrors === 'function') clearErrors('location_name');
        setSearchLoading(false);
    };

    const cleanQuery = (s) => String(s || '')
        .replace(/\b(brgy|bgy|brg)\b\.?\s*/gi, 'Barangay ')
        .replace(/\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[.,\s]+$/, '')
        .trim();

    const searchPlace = async (text, exactOnly) => {
        const base = cleanQuery(text)
            .replace(/,?\s*(Philippines|Pilipinas)\b/gi, '')
            .replace(/,?\s*(Metro Manila|National Capital Region|NCR|Southern Manila District)\b/gi, '')
            .replace(/[.,\s]+$/, '')
            .trim();
        const parts = base.split(',').map((p) => p.trim()).filter(Boolean);
        const tries = [];
        for (let i = 0; i < parts.length; i++) {
            if (i > 0 && parts.length - i < 2) break;
            tries.push(parts.slice(i).join(', '));
        }
        if (tries.length === 0) tries.push(base);
        if (exactOnly) tries.length = Math.min(tries.length, 1);
        for (let i = 0; i < tries.length; i++) {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tries[i])}&format=json&limit=1&countrycodes=ph&viewbox=120.95,14.50,121.12,14.28`);
            const results = await res.json();
            if (Array.isArray(results) && results.length > 0) return { result: results[0], exact: i === 0 };
            if (i < tries.length - 1) await new Promise((r) => setTimeout(r, 1100));
        }
        return null;
    };

    const handleLocationNameChange = (value) => {
        if (pinLocked && data.latitude && data.longitude) {
            setNameEdited(true);
            setData((prev) => ({ ...prev, location_name: value }));
            setLocationStatus({ ok: true, message: value });
            return;
        }
        setData((prev) => ({ ...prev, location_name: value, latitude: '', longitude: '' }));
        setLocationStatus(null);
    };

    const lookUpBranch = async () => {
        setSearchLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(BRANCH.address)}&format=json&limit=1`);
            const results = await res.json();
            if (results.length > 0) {
                setData((prev) => ({
                    ...prev,
                    latitude: parseFloat(results[0].lat).toFixed(8),
                    longitude: parseFloat(results[0].lon).toFixed(8),
                }));
                setLocationStatus({ ok: true, message: BRANCH.address });
            } else {
                setLocationStatus({ ok: false, message: "Couldn't find the branch on the map. Set BRANCH.latitude and BRANCH.longitude in Create.jsx." });
            }
        } catch {
            setLocationStatus({ ok: false, message: 'Branch lookup failed. Check your connection and try again.' });
        }
        setSearchLoading(false);
    };

    const applyBranchLocation = () => {
        setLocationStatus(null);

        if (hasBranchCoords) {
            setData((prev) => ({
                ...prev,
                type: 'branch',
                location_name: BRANCH.address,
                latitude: Number(BRANCH.latitude).toFixed(8),
                longitude: Number(BRANCH.longitude).toFixed(8),
            }));
            setLocationStatus({ ok: true, message: BRANCH.address });
            return;
        }

        setData((prev) => ({ ...prev, type: 'branch', location_name: BRANCH.address, latitude: '', longitude: '' }));
        lookUpBranch();
    };

    const applyFieldLocation = () => {
        setData((prev) => ({ ...prev, type: 'field', location_name: '', latitude: '', longitude: '' }));
        setLocationStatus(null);
    };

    const handleTypeClick = (value) => {
        if (value === data.type) return;
        if (value === 'branch') applyBranchLocation();
        else applyFieldLocation();
    };

    const pickType = (value) => {
        if (value !== data.type) handleTypeClick(value);
        setStepError('');
        setStep(2);
        scrollTop();
    };

    const confirmLocation = async () => {
        if (data.latitude && data.longitude && data.location_name.trim() && !nameEdited) {
            setLocationStatus({ ok: true, message: data.location_name });
            return;
        }
        if (!data.location_name.trim()) {
            setLocationStatus({ ok: false, message: 'Type a location first.' });
            return;
        }
        setSearchLoading(true);
        setLocationStatus(null);
        try {
            const found = await searchPlace(data.location_name, nameEdited);
            const res = { json: async () => (found ? [found.result] : []) };
            const results = await res.json();
            if (results.length > 0) {
                const resolved = results[0].display_name;
                setNameEdited(false);
                setData((prev) => ({
                    ...prev,
                    latitude: parseFloat(results[0].lat).toFixed(8),
                    longitude: parseFloat(results[0].lon).toFixed(8),
                }));
                setLocationStatus({ ok: true, message: found && !found.exact ? ('Exact place not found, so the pin is near: ' + resolved + '. Drag the pin to the exact spot.') : resolved });
            } else {
                setLocationStatus(nameEdited ? { ok: true, message: data.location_name } : { ok: false, message: "Couldn't find that place \u2014 try adding a barangay or city." });
            }
        } catch {
            setLocationStatus({ ok: false, message: 'Search failed. Check your connection and try again.' });
        }
        setSearchLoading(false);
    };

    const useMyLocation = () => {
        setSearchLoading(true);
        setLocationStatus(null);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                let placeName = `Current location (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`;
                try {
                    const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                    const info = await rev.json();
                    if (info && info.display_name) placeName = info.display_name;
                } catch {}
                if (typeof clearErrors === 'function') clearErrors('location_name');
                setData((prev) => ({
                    ...prev,
                    location_name: placeName,
                    latitude: pos.coords.latitude.toFixed(8),
                    longitude: pos.coords.longitude.toFixed(8),
                }));
                setLocationStatus({ ok: true, message: placeName + ' (about ' + Math.round(pos.coords.accuracy) + ' m accuracy)' });
                setSearchLoading(false);
            },
            () => {
                setLocationStatus({ ok: false, message: 'Could not detect your location. Try typing the address instead.' });
                setSearchLoading(false);
            }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const filteredVolunteers = volunteers.filter((v) =>
        v.name.toLowerCase().includes(volunteerFilter.toLowerCase()) || v.email.toLowerCase().includes(volunteerFilter.toLowerCase())
    );

    const selectedVolunteers = volunteers.filter((v) => data.volunteer_ids.includes(v.id));

    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    const mapSrc = locationConfirmed && !isNaN(lat) && !isNaN(lon)
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.004}%2C${lat - 0.003}%2C${lon + 0.004}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lon}`
        : null;

    const reviewRow = (label, value) => (
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '12.5px' }}>
            <span style={{ color: '#999' }}>{label}</span>
            <span style={{ color: '#222', wordBreak: 'break-word' }}>{value || <span style={{ color: '#bbb' }}>&mdash;</span>}</span>
        </div>
    );

    const reviewHeader = (title, stepNumber) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ ...sectionTitle, marginBottom: 0 }}>{title}</div>
            <button type="button" onClick={() => setStep(stepNumber)} className="act-ghost-btn" style={{
                padding: '5px 12px', background: '#fafafa', color: '#666', border: '1px solid #ebebeb',
                borderRadius: '8px', cursor: 'pointer', fontSize: '11.5px', fontFamily: 'inherit',
            }}>
                Edit
            </button>
        </div>
    );

    return (
        <AdminShell active="activities" title="Activities">
            <style>{`
.act-primary-btn, .act-ghost-btn { border-radius: 9px !important; }
.act-ghost-btn { background: #fff !important; border: 1px solid #e5e5e5 !important; }
                .act-input:focus { border-color: #CC0000 !important; outline: none; box-shadow: 0 0 0 3px rgba(204,0,0,0.08); background: white !important; }
                .act-primary-btn:hover { background: #aa0000 !important; }
                .act-ghost-btn:hover { background: #f0f0f0 !important; }
                .act-vol-row:hover { background: #fafafa; }
                .act-type-btn:hover, .act-type-btn:focus-visible { background: #f3f3f3 !important; border-color: #d4d4d4 !important; outline: none; }
                .act-type-btn:hover .act-type-title, .act-type-btn:focus-visible .act-type-title, .act-type-btn:hover .act-type-icon, .act-type-btn:focus-visible .act-type-icon { color: #C62828 !important; }
                .act-step-btn:hover .act-step-dot { border-color: #CC0000 !important; }
                @media (max-width: 600px) {
                    .act-step-label { display: none; }
                }
            `}</style>

            <div style={{ maxWidth: '780px', margin: '0 auto' }}>

                <form onSubmit={handleSubmit}>
                    <div style={card}>
                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderBottom: '1px solid #ececec' }}>
                        <Link
                            href={route('admin.activities.index')}
                            aria-label="Back to Activities"
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#CC0000'; e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#666'; }}
                            style={{
                                width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666',
                                textDecoration: 'none', fontSize: '14px', lineHeight: 1,
                            }}
                        >
                            &larr;
                        </Link>
                        <Link
                            href={route('admin.activities.index')}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#CC0000'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#666', textDecoration: 'none' }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
                            </svg>
                            Activities
                        </Link>
                        <span style={{ fontSize: '13px', color: '#bbb' }}>&rsaquo;</span>
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#7a8ba3' }}>Create Activity</span>
                    </div>
                        <div style={{ padding: '12px 24px', borderBottom: '1px solid #ececec' }}>
{/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {STEPS.map((label, i) => {
                        const n = i + 1;
                        const done = n < step;
                        const current = n === step;
                        return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: n === STEPS.length ? '0 0 auto' : 1 }}>
                                <button
                                    type="button"
                                    onClick={() => goToStep(n)}
                                    className="act-step-btn"
                                    disabled={!done}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none',
                                        padding: 0, cursor: done ? 'pointer' : 'default', fontFamily: 'inherit',
                                    }}
                                >
                                    <span className="act-step-dot" style={{
                                        width: '22px', height: '22px', borderRadius: '50%', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600',
                                        background: current ? '#7a8ba3' : done ? '#f0fdf4' : '#f1f5f9', boxShadow: 'none',
                                        color: current ? 'white' : done ? '#16a34a' : '#64748b',
                                        border: current ? '1px solid #7a8ba3' : done ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                                    }}>
                                        {done ? '\u2713' : n}
                                    </span>
                                    <span className="act-step-label" style={{
                                        fontSize: '12px', fontWeight: current ? '600' : '500',
                                        color: current ? '#222' : '#999', whiteSpace: 'nowrap',
                                    }}>
                                        {label}
                                    </span>
                                </button>
                                {n < STEPS.length && (
                                    <div style={{ flex: 1, height: '1px', background: done ? '#16a34a' : '#cbd5e1' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
                        </div>
                        <div key={step} style={{ ...cardBody, overflowY: 'auto', maxHeight: 'max(380px, calc(100vh - 220px))' }}>

                        {/* STEP 1: Type */}
                        {step === 1 && (
                            <>
                                <div style={sectionTitle}>Step 1 &middot; What kind of activity?</div>
                                <p style={{ fontSize: '12px', color: '#888', margin: '-6px 0 16px' }}>Tap one to continue.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                    {TYPE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => pickType(opt.value)}
                                            className="act-type-btn"
                                            style={{
                                                textAlign: 'left', padding: '18px 16px', borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', gap: '12px', alignItems: 'flex-start', fontFamily: 'inherit',
                                                border: '1px solid #ebebeb', background: '#fff',
                                            }}
                                        >
                                            <span className="act-type-icon" style={{ flexShrink: 0, marginTop: '1px', color: '#777', display: 'flex' }}>
                                                {opt.value === 'field' ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" /></svg>
                                                )}
                                            </span>
                                            <div style={{ minWidth: 0 }}>
                                                <div className="act-type-title" style={{ fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '4px' }}>{opt.label}</div>
                                                <div style={{ fontSize: '12px', color: '#777', lineHeight: 1.5 }}>{opt.hint}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.type && <p style={errorStyle}>{errors.type}</p>}
                            </>
                        )}

                        {/* STEP 2: Details (two columns) */}
                        {step === 2 && (() => {
                            const card = { border: '1px solid #ebebeb', borderRadius: '12px', padding: '14px 16px', background: '#fff' };
                            const head = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#444', marginBottom: '12px' };
                            const hint = { fontSize: '11.5px', color: '#888', margin: 0 };
                            const ico = (d) => (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
                            );
                            const toMin = (t) => {
                                if (!t) return null;
                                const p = String(t).split(':').map(Number);
                                return p[0] * 60 + (p[1] || 0);
                            };
                            const sm = toMin(data.start_time);
                            const em = toMin(data.end_time);
                            let durationText = null;
                            let durationBad = false;
                            if (sm !== null && em !== null) {
                                const diff = em - sm;
                                if (diff > 0) {
                                    const h = Math.floor(diff / 60);
                                    const m = diff % 60;
                                    durationText = [h ? h + (h > 1 ? ' hours' : ' hour') : '', m ? m + ' min' : ''].filter(Boolean).join(' ');
                                } else {
                                    durationBad = true;
                                }
                            }
                            const nameLen = (data.name || '').length;
                            const descLen = (data.description || '').length;

                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', alignItems: 'stretch' }}>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                                        <div style={card}>
                                            <div style={head}>{ico('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6')}Basic info</div>
                                            <label style={labelStyle}>Activity name *</label>
                                            <input
                                                className="act-input"
                                                type="text"
                                                maxLength={80}
                                                value={data.name}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                style={{ ...inputStyle, ...(duplicateName || errors.name ? { borderColor: '#CC0000' } : {}) }}
                                                placeholder="e.g. Flood Relief &ndash; Bulacan"
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '6px' }}>
                                                {duplicateName ? (
                                                    <p style={{ ...errorStyle, margin: 0 }}>{dupMessage(duplicateName)}</p>
                                                ) : errors.name ? (
                                                    <p style={{ ...errorStyle, margin: 0 }}>{errors.name}</p>
                                                ) : (
                                                    <p style={hint}>Use a clear name volunteers will recognize.</p>
                                                )}
                                                <span style={{ ...hint, whiteSpace: 'nowrap' }}>{nameLen} / 80</span>
                                            </div>
                                        </div>

                                        <div style={{ ...card, flex: 1 }}>
                                            <div style={head}>{ico('M3 5h18v16H3zM3 10h18M8 3v4M16 3v4')}Schedule</div>
                                            <label style={labelStyle}>Date *</label>
                                            <input className="act-input" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} style={inputStyle} />
                                            {errors.date && <p style={errorStyle}>{errors.date}</p>}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                                <div>
                                                    <label style={labelStyle}>Start time *</label>
                                                    <input className="act-input" type="time" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} style={inputStyle} />
                                                    {errors.start_time && <p style={errorStyle}>{errors.start_time}</p>}
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>End time *</label>
                                                    <input className="act-input" type="time" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} style={inputStyle} />
                                                    {errors.end_time && <p style={errorStyle}>{errors.end_time}</p>}
                                                </div>
                                            </div>
                                            {durationText && (
                                                <span style={{ display: 'inline-block', marginTop: '10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '3px 9px', fontSize: '11.5px', fontWeight: '600' }}>Duration: {durationText}</span>
                                            )}
                                            {durationBad && (
                                                <span style={{ display: 'inline-block', marginTop: '10px', background: '#fef2f2', color: '#CC0000', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 9px', fontSize: '11.5px', fontWeight: '600' }}>End time must be after start time</span>
                                            )}
                                        </div>

                                    </div>

                                    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                                        <div style={head}>{ico('M9 3h6v4H9zM6 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1')}Assignment</div>
                                        <label style={labelStyle}>What will volunteers do?</label>
                                        <textarea
                                            className="act-input"
                                            maxLength={500}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            style={{ ...inputStyle, flex: 1, minHeight: '150px', height: 'auto', resize: 'none' }}
                                            placeholder="Describe the tasks, what to bring, and who to report to."
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '6px' }}>
                                            <p style={hint}>Optional, but it helps volunteers decide if they can join.</p>
                                            <span style={{ ...hint, whiteSpace: 'nowrap' }}>{descLen} / 500</span>
                                        </div>

                                        <label style={{ ...labelStyle, marginTop: '14px', display: 'block' }}>Assigned by</label>
                                        <div style={{ ...inputStyle, background: '#f3f3f3', color: '#444', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {ico('M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4')}
                                            <span style={{ flex: 1 }}>{assignedByName || 'Current profile'}</span>
                                            <span style={{ fontSize: '11px', color: '#999' }}>Auto-filled</span>
                                        </div>
                                        {errors.assigned_by && <p style={errorStyle}>{errors.assigned_by}</p>}
                                    </div>

                                </div>
                            );
                        })()}
                        {/* STEP 3: Location */}
                        {step === 3 && (
                            <>
                                <div style={sectionTitle}>Step 3 &middot; Location</div>
                                <label style={labelStyle}>Place name or address *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: isBranch ? '1fr' : '1fr auto', gap: '10px' }}>
                                    <input
                                        className="act-input"
                                        type="text"
                                        value={data.location_name}
                                        onChange={(e) => { handleLocationNameChange(e.target.value); fetchSuggestions(e.target.value); }}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), !isBranch && confirmLocation())}
                                        readOnly={isBranch}
                                        style={{ ...inputStyle, ...(isBranch ? { background: '#f3f3f3', color: '#666', cursor: 'not-allowed' } : {}) }}
                                        placeholder="e.g. Barangay Hall, Alabang, Muntinlupa"
                                    />
                                    {!isBranch && (
                                        <button
                                            type="button"
                                            onClick={confirmLocation}
                                            disabled={searchLoading}
                                            className="act-primary-btn"
                                            style={{
                                                padding: '10px 16px', background: '#CC0000', color: 'white', border: 'none',
                                                borderRadius: '10px', cursor: searchLoading ? 'default' : 'pointer', fontSize: '12.5px',
                                                fontWeight: '600', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {searchLoading ? 'Checking\u2026' : locationConfirmed ? 'Re-confirm' : 'Confirm on map'}
                                        </button>
                                    )}
                                </div>
                                {!isBranch && !locationConfirmed && (
                                    <div style={{ marginTop: '8px', background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', lineHeight: 1.5, color: '#1e3a8a' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>How to find the address</div>
                                        Type the subdivision or street, then the barangay (Brgy.) and Muntinlupa City. Example: A. Bunye, Brgy. Sucat, Muntinlupa City. Pick a suggestion from the list, or place the pin on the map and type the full name yourself.
                                    </div>
                                )}{errors.location_name && <p style={errorStyle}>{errors.location_name}</p>}

                                {suggestions.length > 0 && (
                                    <div role="listbox" style={{ marginTop: '6px', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={s.place_id}
                                                type="button"
                                                role="option"
                                                onClick={() => pickSuggestion(s)}
                                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'white', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #f1f1f1' : 'none', cursor: 'pointer', fontSize: '12.5px', fontFamily: 'inherit', color: '#333' }}
                                            >
                                                {s.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchLoading && isBranch && <p style={hintStyle}>Looking up the branch location&hellip;</p>}

                                {locationStatus && (
                                    <div style={{
                                        marginTop: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.5,
                                        background: locationStatus.ok ? '#e9f8ee' : '#fff7e6',
                                        color: locationStatus.ok ? '#1a8a3d' : '#b8860b',
                                    }}>
                                        {locationStatus.ok ? (isBranch ? '\u2713 Branch location set: ' : '\u2713 Confirmed: ') : '\u26A0 '}{locationStatus.message}
                                    </div>
                                )}

                                <p style={hintStyle}>
                                    {isBranch
                                        ? 'Branch activities use the branch location automatically. Go back to step 1 and choose Field Activity to set a different place.'
                                        : "You can confirm any place that exists on the map, even if you are not there. The match shown above is what gets saved."}
                                </p>

                                {!isBranch ? (
                                    <LocationPicker latitude={data.latitude} longitude={data.longitude} onPick={handlePinPick} height={380} />
                                ) : mapSrc ? (
                                    <iframe
                                        title="Activity location"
                                        src={mapSrc}
                                        style={{ display: 'block', width: '100%', height: '380px', marginTop: '14px', border: '1px solid #ebebeb', borderRadius: '10px' }}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div style={{
                                        marginTop: '14px', height: '220px', border: '1px dashed #ddd', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '0 12px',
                                    }}>
                                        Map preview appears after confirming the location
                                    </div>
                                )}
                            </>
                        )}

                        {/* STEP 4: Volunteers */}
                        {step === 4 && (
                            <>
                                <div style={sectionTitle}>Step 4 &middot; Assign volunteers</div>
                                {volunteers.length === 0 ? (
                                    <p style={{ color: '#999', fontSize: '13px' }}>No approved volunteers yet. You can skip this step.</p>
                                ) : (
                                    <>
                                        <input
                                            className="act-input"
                                            type="text"
                                            value={volunteerFilter}
                                            onChange={(e) => setVolunteerFilter(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                            placeholder="Search volunteers..."
                                            style={{ ...inputStyle, marginBottom: '8px' }}
                                        />
                                        <div style={{ border: '1px solid #ebebeb', borderRadius: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                                            {filteredVolunteers.length === 0 ? (
                                                <p style={{ padding: '14px', fontSize: '12.5px', color: '#bbb', textAlign: 'center' }}>No matches</p>
                                            ) : (
                                                filteredVolunteers.map((v) => (
                                                    <label key={v.id} className="act-vol-row" style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                                                    }}>
                                                        <input type="checkbox" checked={data.volunteer_ids.includes(v.id)} onChange={() => handleVolunteerToggle(v.id)} />
                                                        <span style={{ fontSize: '12.5px', color: '#333' }}>{v.name} <span style={{ color: '#aaa' }}>({v.email})</span></span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        <p style={hintStyle}>
                                            {data.volunteer_ids.length > 0
                                                ? `${data.volunteer_ids.length} volunteer${data.volunteer_ids.length === 1 ? '' : 's'} selected. `
                                                : 'Optional. '}
                                            Approved volunteers only.
                                        </p>
                                    </>
                                )}
                                {errors.volunteer_ids && <p style={errorStyle}>{errors.volunteer_ids}</p>}
                            </>
                        )}

                        {/* STEP 5: Review */}
                        {step === 5 && (
                            <>
                                <div style={sectionTitle}>Step 5 &middot; Review and create</div>

                                <div style={{ marginBottom: '18px' }}>
                                    {reviewHeader('Details', 2)}
                                    {reviewRow('Type', TYPE_OPTIONS.find((o) => o.value === data.type)?.label)}
                                    {reviewRow('Activity name', data.name)}
                                    {reviewRow('Date', data.date)}
                                    {reviewRow('Time', data.start_time && data.end_time ? `${data.start_time} - ${data.end_time}` : '')}
                                    {reviewRow('Status', STATUS_LABELS[data.status] || data.status)}
                                    {reviewRow('Assignment', data.description)}
                                    {reviewRow('Assigned by', data.assigned_by)}
                                </div>

                                <div style={{ marginBottom: '18px' }}>
                                    {reviewHeader('Location', 3)}
                                    {reviewRow('Place', data.location_name)}
                                    {mapSrc && (
                                        <iframe
                                            title="Activity location"
                                            src={mapSrc}
                                            style={{ display: 'block', width: '100%', height: '220px', marginTop: '10px', border: '1px solid #ebebeb', borderRadius: '10px' }}
                                            loading="lazy"
                                        />
                                    )}
                                </div>

                                <div>
                                    {reviewHeader('Volunteers', 4)}
                                    {selectedVolunteers.length === 0 ? (
                                        <p style={{ fontSize: '12.5px', color: '#bbb', padding: '8px 0' }}>No volunteers assigned.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '8px' }}>
                                            {selectedVolunteers.map((v) => (
                                                <span key={v.id} style={{
                                                    fontSize: '11.5px', padding: '4px 10px', borderRadius: '999px',
                                                    background: '#fff5f5', color: '#CC0000', border: '1px solid #f5d0d0',
                                                }}>
                                                    {v.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {stepError && (
                            <div style={{
                                marginTop: '16px', padding: '10px 12px', borderRadius: '10px', fontSize: '12px',
                                background: '#fff7e6', color: '#b8860b',
                            }}>
                                {'\u26A0'} {stepError}
                            </div>
                        )}
                    </div>

                    {step > 1 && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #ececec', background: '#fafafa' }}>
                        {step === 1 ? (
                            <Link href={route('admin.activities.index')} className="act-ghost-btn" style={{
                                padding: '10px 18px', background: '#f5f5f5', color: '#444', borderRadius: '10px',
                                textDecoration: 'none', fontWeight: '600', fontSize: '12.5px',
                            }}>
                                Cancel
                            </Link>
                        ) : (
                            <button key="back" type="button" onClick={goBack} className="act-ghost-btn" style={{
                                padding: '10px 18px', background: '#f5f5f5', color: '#444', border: 'none', borderRadius: '10px',
                                fontWeight: '600', fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer',
                            }}>
                                &larr; Back
                            </button>
                        )}

                        {step < STEPS.length ? (
                            <button key="next" type="button" onClick={goNext} className="act-primary-btn" style={{
                                padding: '10px 22px', background: '#CC0000', color: 'white', border: 'none',
                                borderRadius: '10px', fontWeight: '600', fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer',
                            }}>
                                Next: {STEPS[step]} &rarr;
                            </button>
                        ) : (
                            <button key="submit" type="submit" disabled={processing} className="act-primary-btn" style={{
                                padding: '10px 22px', background: '#CC0000', color: 'white', border: 'none',
                                borderRadius: '10px', fontWeight: '600', fontSize: '12.5px', fontFamily: 'inherit',
                                cursor: processing ? 'default' : 'pointer', opacity: processing ? 0.7 : 1,
                            }}>
                                {processing ? 'Creating\u2026' : 'Create Activity'}
                            </button>
                        )}
                    </div>
                    )}
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
