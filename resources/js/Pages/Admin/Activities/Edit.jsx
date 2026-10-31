import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminShell from '../../../Components/AdminShell';

/*
  Two-column edit page: form on the left, "How volunteers will see it"
  preview and map on the right. Location flow is unchanged: Branch Activity
  fills the branch address automatically; Field Activity needs the admin to
  type a place and press "Confirm location". Radius is fixed on every save.

  Duplicate names: existingNames comes from the controller and holds every
  OTHER activity's name (this activity is left out, so it can keep its own
  name). Compared ignoring uppercase/lowercase and extra spaces. The server
  checks again on save.
*/

const FIXED_RADIUS_METERS = 500;

/*
  Branch location. If latitude/longitude are null, the page looks up
  BRANCH.address on OpenStreetMap when "Branch Activity" is clicked.
*/
const BRANCH = {
    address: 'Red Cross Center, Centennial Lane, Filinvest Corporate City, Alabang, Muntinlupa City, Metro Manila, Philippines',
    latitude: 14.4180,
    longitude: 121.0390,
};

/* Same name check as the server: lowercase, trimmed, repeated spaces collapsed. */
const normalizeName = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

const dupMessage = (name) => `An activity named "${name}" already exists. Please use a different name.`;

const card = { background: 'white', border: '1px solid #ebebeb', borderRadius: '12px', padding: '20px' };
const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ebebeb', borderRadius: '10px',
    fontSize: '13px', fontFamily: 'inherit', color: '#222', boxSizing: 'border-box', background: '#fafafa',
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#333' };
const errorStyle = { color: '#CC0000', fontSize: '11.5px', marginTop: '5px' };
const hintStyle = { fontSize: '11.5px', color: '#999', marginTop: '6px' };
const sectionTitle = { fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.08em', color: '#999', textTransform: 'uppercase', marginBottom: '14px' };

const TYPE_OPTIONS = [
    { value: 'field', label: 'Field Activity', hint: 'Outside the branch, e.g. blood drives, relief operations' },
    { value: 'branch', label: 'Branch Activity', hint: 'Inside the branch, e.g. orientations, trainings' },
];

const STATUS_STYLES = {
    upcoming: { label: 'Upcoming', bg: '#fff3e0', color: '#b26a00' },
    ongoing: { label: 'Ongoing', bg: '#e3f2fd', color: '#1565c0' },
    completed: { label: 'Completed', bg: '#e9f8ee', color: '#1a8a3d' },
    cancelled: { label: 'Cancelled', bg: '#f3f3f3', color: '#777' },
};

const formatDate = (d) => {
    if (!d) return 'Not set';
    const date = new Date(`${String(d).slice(0, 10)}T00:00:00`);
    return isNaN(date) ? 'Not set' : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = String(t).split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return '';
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export default function Edit({ activity, volunteers, existingNames = [] }) {
    const { data, setData, patch, processing, errors, clearErrors } = useForm({
        name: activity.name || '',
        type: activity.type === 'branch' ? 'branch' : 'field',
        description: activity.description || '',
        assigned_by: activity.assigned_by || '',
        date: activity.date || '',
        start_time: activity.start_time || '',
        end_time: activity.end_time || '',
        location_name: activity.location_name || '',
        latitude: activity.latitude || '',
        longitude: activity.longitude || '',
        radius_meters: FIXED_RADIUS_METERS,
        status: activity.status || 'upcoming',
        volunteer_ids: activity.volunteers?.map((v) => v.id) || [],
    });

    const [searchLoading, setSearchLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState(
        activity.latitude && activity.longitude
            ? { ok: true, message: activity.location_name || 'Location already set for this activity.' }
            : null
    );
    const [volunteerFilter, setVolunteerFilter] = useState('');

    const locationConfirmed = !!(data.latitude && data.longitude);
    const isBranch = data.type === 'branch';

    // Another activity that already has the same name as what is typed (null if none)
    const duplicateName = (() => {
        const wanted = normalizeName(data.name);
        if (!wanted) return null;
        return existingNames.find((n) => normalizeName(n) === wanted) ?? null;
    })();

    const today = new Date().toLocaleDateString('en-CA');
    const datePassed = !!data.date && String(data.date).slice(0, 10) < today;
    const statusMismatch = datePassed && (data.status === 'upcoming' || data.status === 'ongoing');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (duplicateName) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!locationConfirmed) {
            setLocationStatus({ ok: false, message: 'Please confirm the location before saving.' });
            return;
        }
        patch(route('admin.activities.update', activity.id));
    };

    const handleNameChange = (value) => {
        setData('name', value);
        clearErrors('name');
    };

    const handleVolunteerToggle = (id) => {
        const current = data.volunteer_ids;
        setData('volunteer_ids', current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);
    };

    const handleLocationNameChange = (value) => {
        setData((prev) => ({ ...prev, location_name: value, latitude: '', longitude: '' }));
        setLocationStatus(null);
    };

    const applyBranchLocation = async () => {
        setLocationStatus(null);

        if (BRANCH.latitude !== null && BRANCH.longitude !== null) {
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
                setLocationStatus({ ok: false, message: "Couldn't find the branch on the map. Set BRANCH.latitude and BRANCH.longitude in Edit.jsx." });
            }
        } catch {
            setLocationStatus({ ok: false, message: 'Branch lookup failed. Check your connection and try again.' });
        }
        setSearchLoading(false);
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

    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    const mapSrc = locationConfirmed && !isNaN(lat) && !isNaN(lon)
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.004}%2C${lat - 0.003}%2C${lon + 0.004}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lon}`
        : null;

    const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.upcoming;
    const timeRange = data.start_time || data.end_time
        ? `${formatTime(data.start_time)}${data.end_time ? ` \u2013 ${formatTime(data.end_time)}` : ''}`
        : 'Not set';

    const previewRows = [
        ['Date', formatDate(data.date)],
        ['Time', timeRange],
        ['Assigned location', locationConfirmed ? data.location_name : 'Not set yet'],
        ['Assignment', data.description || 'No description'],
        ['Assigned by', data.assigned_by || 'Not set'],
    ];

    return (
        <AdminShell active="activities" title="Edit Activity">
            <style>{`
                .act-input:focus { border-color: #CC0000 !important; outline: none; box-shadow: 0 0 0 3px rgba(204,0,0,0.08); background: white !important; }
                .act-primary-btn:hover { background: #aa0000 !important; }
                .act-ghost-btn:hover { background: #f0f0f0 !important; }
                .act-vol-row:hover { background: #fafafa; }
                .act-type-btn:hover { border-color: #CC0000 !important; }
                .act-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
                .act-left { display: contents; }
                .act-left > div:nth-child(1) { grid-column: 1; grid-row: 1; }
                .act-left > div:nth-child(2) { grid-column: 2; grid-row: 1; }
                
                .act-left > div:nth-child(3) { grid-column: 1 / -1; grid-row: 2; }
                .act-right { position: sticky; top: 16px; display: grid; gap: 16px; }
                @media (max-width: 900px) {
                    .act-grid { grid-template-columns: 1fr; }
                    .act-left > div { grid-column: auto !important; grid-row: auto !important; }
                    .act-right { position: static; }
                }
            `}</style>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                <div style={{ marginBottom: '20px' }}>
                    <Link href={route('admin.activities.index')} style={{ fontSize: '12.5px', color: '#999', textDecoration: 'none' }}>
                        &larr; Back to Activities
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="act-grid">
                    <div className="act-left">

                        {/* Activity details */}
                        <div style={card}>
                            <div style={sectionTitle}>Activity details</div>
                            <div style={{ display: 'grid', gap: '16px' }}>

                                <div>
                                    <label style={labelStyle}>Activity Type *</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {TYPE_OPTIONS.map((opt) => {
                                            const active = data.type === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleTypeClick(opt.value)}
                                                    className="act-type-btn"
                                                    aria-pressed={active}
                                                    title={opt.hint}
                                                    style={{
                                                        padding: '7px 16px', borderRadius: '999px', cursor: 'pointer',
                                                        fontFamily: 'inherit', fontSize: '12.5px',
                                                        fontWeight: active ? '700' : '500',
                                                        color: active ? '#CC0000' : '#444',
                                                        border: active ? '1.5px solid #CC0000' : '1px solid #ebebeb',
                                                        background: active ? '#fff5f5' : '#fafafa',
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p style={hintStyle}>{TYPE_OPTIONS.find((o) => o.value === data.type)?.hint}</p>
                                    {errors.type && <p style={errorStyle}>{errors.type}</p>}
                                </div>

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

                                {statusMismatch && (
                                    <div style={{
                                        padding: '10px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.5,
                                        background: '#fff7e6', color: '#b8860b', display: 'flex', gap: '10px',
                                        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
                                    }}>
                                        <span>{'\u26A0'} This date has already passed, but the status is still {STATUS_STYLES[data.status].label}.</span>
                                        <button
                                            type="button"
                                            onClick={() => setData('status', 'completed')}
                                            className="act-ghost-btn"
                                            style={{ padding: '5px 10px', background: 'white', color: '#b8860b', border: '1px solid #e8d4a0', borderRadius: '8px', cursor: 'pointer', fontSize: '11.5px', fontWeight: '600', fontFamily: 'inherit' }}
                                        >
                                            Mark as Completed
                                        </button>
                                    </div>
                                )}

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
                                    <div data-assigned-by="locked" style={{ ...inputStyle, background: '#f3f3f3', color: '#444', cursor: 'not-allowed' }}>{data.assigned_by || 'Not set'}</div>
                                    {errors.assigned_by && <p style={errorStyle}>{errors.assigned_by}</p>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Assign Volunteers</label>
                            {volunteers.length === 0 ? (
                                <p style={{ color: '#999', fontSize: '13px' }}>No approved volunteers yet.</p>
                            ) : (
                                <>
                                    <input
                                        className="act-input"
                                        type="text"
                                        value={volunteerFilter}
                                        onChange={(e) => setVolunteerFilter(e.target.value)}
                                        placeholder="Search volunteers..."
                                        style={{ ...inputStyle, marginBottom: '8px' }}
                                    />
                                    <div style={{ border: '1px solid #ebebeb', borderRadius: '10px', maxHeight: '300px', overflowY: 'auto' }}>
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
                                            : ''}
                                        Approved volunteers only.
                                    </p>
                                </>
                            )}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div style={card}>
                            <div style={sectionTitle}>Location</div>
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
                                    ? 'Branch activities use the branch location automatically. Choose Field Activity to set a different place.'
                                    : "You can confirm any place that exists on the map, even if you are not there. Editing the name clears the match until you re-confirm."}
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
                                    marginTop: '14px', height: '200px', border: '1px dashed #ddd', borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '0 12px',
                                }}>
                                    Map preview appears after confirming the location
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <Link href={route('admin.activities.index')} className="act-ghost-btn" style={{
                                padding: '10px 18px', background: '#f5f5f5', color: '#444', borderRadius: '10px',
                                textDecoration: 'none', fontWeight: '600', fontSize: '12.5px',
                            }}>
                                Cancel
                            </Link>
                            <button type="submit" disabled={processing} className="act-primary-btn" style={{
                                padding: '10px 22px', background: '#CC0000', color: 'white', border: 'none',
                                borderRadius: '10px', fontWeight: '600', fontSize: '12.5px', fontFamily: 'inherit',
                                cursor: processing ? 'default' : 'pointer', opacity: processing ? 0.7 : 1,
                            }}>
                                {processing ? 'Saving\u2026' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
