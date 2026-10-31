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

const card = { background: 'white', border: '1px solid #ececec', borderLeft: '4px solid #A32D2D', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06)', borderRadius: '12px', padding: '24px' };
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

    const locationConfirmed = !!(data.latitude && data.longitude);
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

    const handleLocationNameChange = (value) => {
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

    const confirmLocation = async () => {
        if (!data.location_name.trim()) {
            setLocationStatus({ ok: false, message: 'Type a location first.' });
            return;
        }
        setSearchLoading(true);
        setLocationStatus(null);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location_name)}&format=json&limit=1`);
            const results = await res.json();
            if (results.length > 0) {
                const resolved = results[0].display_name;
                setData((prev) => ({
                    ...prev,
                    latitude: parseFloat(results[0].lat).toFixed(8),
                    longitude: parseFloat(results[0].lon).toFixed(8),
                }));
                setLocationStatus({ ok: true, message: resolved });
            } else {
                setLocationStatus({ ok: false, message: "Couldn't find that place \u2014 try adding a barangay or city." });
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
            (pos) => {
                setData((prev) => ({
                    ...prev,
                    latitude: pos.coords.latitude.toFixed(8),
                    longitude: pos.coords.longitude.toFixed(8),
                }));
                setLocationStatus({ ok: true, message: 'Using your current location as the activity site.' });
                setSearchLoading(false);
            },
            () => {
                setLocationStatus({ ok: false, message: 'Could not detect your location. Try typing the address instead.' });
                setSearchLoading(false);
            }
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
        <AdminShell active="activities" title="Create Activity">
            <style>{`
.act-primary-btn, .act-ghost-btn { border-radius: 9px !important; }
.act-ghost-btn { background: #fff !important; border: 1px solid #e5e5e5 !important; }
                .act-input:focus { border-color: #CC0000 !important; outline: none; box-shadow: 0 0 0 3px rgba(204,0,0,0.08); background: white !important; }
                .act-primary-btn:hover { background: #aa0000 !important; }
                .act-ghost-btn:hover { background: #f0f0f0 !important; }
                .act-vol-row:hover { background: #fafafa; }
                .act-type-btn:hover { border-color: #CC0000 !important; }
                .act-step-btn:hover .act-step-dot { border-color: #CC0000 !important; }
                @media (max-width: 600px) {
                    .act-step-label { display: none; }
                }
            `}</style>

            <div style={{ maxWidth: '780px', margin: '0 auto' }}>

                <div style={{ marginBottom: '20px' }}>
                    <Link href={route('admin.activities.index')} style={{ fontSize: '12.5px', color: '#999', textDecoration: 'none' }}>
                        &larr; Back to Activities
                    </Link>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    {STEPS.map((label, i) => {
                        const n = i + 1;
                        const done = n < step;
                        const current = n === step;
                        return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: n === STEPS.length ? '0 0 auto' : 1 }}>
                                <button
                                    type="button"
                                    onClick={() => goToStep(n)}
                                    className="act-step-btn"
                                    disabled={!done}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
                                        padding: 0, cursor: done ? 'pointer' : 'default', fontFamily: 'inherit',
                                    }}
                                >
                                    <span className="act-step-dot" style={{
                                        width: '26px', height: '26px', borderRadius: '50%', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700',
                                        background: current ? '#CC0000' : done ? '#fff5f5' : '#fafafa', boxShadow: current ? '0 0 0 4px #fbeaea' : 'none',
                                        color: current ? 'white' : done ? '#CC0000' : '#999',
                                        border: current ? '1.5px solid #CC0000' : done ? '1.5px solid #CC0000' : '1px solid #ddd',
                                    }}>
                                        {done ? '\u2713' : n}
                                    </span>
                                    <span className="act-step-label" style={{
                                        fontSize: '12.5px', fontWeight: current ? '700' : '500',
                                        color: current ? '#222' : '#999', whiteSpace: 'nowrap',
                                    }}>
                                        {label}
                                    </span>
                                </button>
                                {n < STEPS.length && (
                                    <div style={{ flex: 1, height: '2px', background: done ? '#CC0000' : '#f0cccc' }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={card}>

                        {/* STEP 1: Type */}
                        {step === 1 && (
                            <>
                                <div style={sectionTitle}>Step 1 &middot; What kind of activity?</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                    {TYPE_OPTIONS.map((opt) => {
                                        const active = data.type === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleTypeClick(opt.value)}
                                                className="act-type-btn"
                                                aria-pressed={active}
                                                style={{
                                                    textAlign: 'left', padding: '16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative',
                                                    fontFamily: 'inherit',
                                                    border: active ? '1.5px solid #CC0000' : '1px solid #ebebeb',
                                                    background: active ? '#fff5f5' : '#fff',
                                                }}
                                            >
                                                <span style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#CC0000' : '#f3f3f4', color: active ? '#fff' : '#777' }}>
{opt.value === 'field' ? (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>) : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" /></svg>)}
</span>
<div style={{ minWidth: 0 }}>
<div style={{ fontSize: '14px', fontWeight: '700', color: active ? '#A32D2D' : '#222', marginBottom: '6px' }}>
                                                    {opt.label}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#777', lineHeight: 1.5 }}>{opt.hint}</div>
</div>
{active && <span style={{ position: 'absolute', top: '10px', right: '12px', color: '#CC0000', fontSize: '15px', fontWeight: '700' }}>&#10003;</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type && <p style={errorStyle}>{errors.type}</p>}
                            </>
                        )}

                        {/* STEP 2: Details */}
                        {step === 2 && (
                            <>
                                <div style={sectionTitle}>Step 2 &middot; Activity details</div>
                                <div style={{ display: 'grid', gap: '16px' }}>

                                    <div>
                                        <label style={labelStyle}>Activity Name *</label>
                                        <input
                                            className="act-input"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            style={{ ...inputStyle, ...(duplicateName || errors.name ? { borderColor: '#CC0000' } : {}) }}
                                            placeholder="e.g. Flood Relief &ndash; Bulacan"
                                        />
                                        {duplicateName ? (
                                            <p style={errorStyle}>{dupMessage(duplicateName)}</p>
                                        ) : (
                                            errors.name && <p style={errorStyle}>{errors.name}</p>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                                        <div>
                                            <label style={labelStyle}>Date *</label>
                                            <input className="act-input" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} style={inputStyle} />
                                            {errors.date && <p style={errorStyle}>{errors.date}</p>}
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Status</label>
                                            <select className="act-input" value={data.status} onChange={(e) => setData('status', e.target.value)} style={inputStyle}>
                                                <option value="upcoming">Upcoming</option>
                                                <option value="ongoing">Ongoing</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                                        <div>
                                            <label style={labelStyle}>Start Time *</label>
                                            <input className="act-input" type="time" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} style={inputStyle} />
                                            {errors.start_time && <p style={errorStyle}>{errors.start_time}</p>}
                                        </div>
                                        <div>
                                            <label style={labelStyle}>End Time *</label>
                                            <input className="act-input" type="time" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} style={inputStyle} />
                                            {errors.end_time && <p style={errorStyle}>{errors.end_time}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Assignment</label>
                                        <textarea className="act-input" value={data.description} onChange={(e) => setData('description', e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="What will volunteers do?" />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Assigned By</label>
                                        <div style={{ ...inputStyle, background: '#f3f3f3', color: '#444', cursor: 'not-allowed' }}>{assignedByName || 'Current profile'}</div>
                                        {errors.assigned_by && <p style={errorStyle}>{errors.assigned_by}</p>}
                                    </div>
                                </div>
                            </>
                        )}

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
                                        onChange={(e) => handleLocationNameChange(e.target.value)}
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
                                {errors.location_name && <p style={errorStyle}>{errors.location_name}</p>}

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

                                {!isBranch && (
                                    <div style={{ marginTop: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={useMyLocation}
                                            disabled={searchLoading}
                                            className="act-ghost-btn"
                                            style={{
                                                padding: '7px 12px', background: '#fafafa', color: '#666', border: '1px solid #ebebeb',
                                                borderRadius: '8px', cursor: 'pointer', fontSize: '11.5px', fontFamily: 'inherit',
                                            }}
                                        >
                                            {'\u{1F4CD}'} Use my current location instead
                                        </button>
                                    </div>
                                )}

                                <p style={hintStyle}>
                                    {isBranch
                                        ? 'Branch activities use the branch location automatically. Go back to step 1 and choose Field Activity to set a different place.'
                                        : "You can confirm any place that exists on the map, even if you are not there. The match shown above is what gets saved."}
                                </p>

                                {mapSrc ? (
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

                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '16px' }}>
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
                </form>
            </div>
        </AdminShell>
    );
}
