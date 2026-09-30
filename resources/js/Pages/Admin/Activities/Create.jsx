import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Create Activity — restyled to match the rest of the portal.        */
/*                                                                      */
/*  GPS handling: admins never see or type raw latitude/longitude.     */
/*  They type a location name, hit "Confirm location," and a geocoder  */
/*  (OpenStreetMap Nominatim) resolves it — the resolved address is    */
/*  shown back to them so they know it matched the right place, and    */
/*  the coordinates are stashed in the form silently. Submitting       */
/*  without a confirmed location is blocked client-side.               */
/*                                                                      */
/*  Radius: no longer admin-editable. FIXED_RADIUS_METERS is sent on   */
/*  every create so a tight per-activity radius can't accidentally     */
/*  block a legitimate check-in from a spot GPS reads slightly off.    */
/* ------------------------------------------------------------------ */

const FIXED_RADIUS_METERS = 500;

const card = { background: 'white', border: '1px solid #ebebeb', borderRadius: '14px' };
const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ebebeb', borderRadius: '10px',
    fontSize: '13px', fontFamily: 'inherit', color: '#222', boxSizing: 'border-box', background: '#fafafa',
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#333' };
const errorStyle = { color: '#CC0000', fontSize: '11.5px', marginTop: '5px' };
const hintStyle = { fontSize: '11.5px', color: '#999', marginTop: '6px' };

export default function Create({ volunteers }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        location_name: '',
        latitude: '',
        longitude: '',
        radius_meters: FIXED_RADIUS_METERS,
        status: 'upcoming',
        assigned_by: '',
        volunteer_ids: [],
    });

    const [searchLoading, setSearchLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState(null); // { ok: bool, message: string } | null
    const [volunteerFilter, setVolunteerFilter] = useState('');

    const locationConfirmed = !!(data.latitude && data.longitude);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!locationConfirmed) {
            setLocationStatus({ ok: false, message: 'Please confirm the location before creating the activity.' });
            return;
        }
        post(route('admin.activities.store'));
    };

    const handleVolunteerToggle = (id) => {
        const current = data.volunteer_ids;
        setData('volunteer_ids', current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);
    };

    const handleLocationNameChange = (value) => {
        setData((prev) => ({ ...prev, location_name: value, latitude: '', longitude: '' }));
        setLocationStatus(null);
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
                setLocationStatus({ ok: false, message: "Couldn't find that place — try adding a barangay or city." });
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

    return (
        <>
            <Head title="Create Activity" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                body { background: #f7f7f8; }
                .act-input:focus { border-color: #CC0000 !important; outline: none; box-shadow: 0 0 0 3px rgba(204,0,0,0.08); background: white !important; }
                .act-primary-btn:hover { background: #aa0000 !important; }
                .act-ghost-btn:hover { background: #f0f0f0 !important; }
                .act-vol-row:hover { background: #fafafa; }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#f7f7f8', fontFamily: "'Inter', sans-serif", padding: '32px 20px' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>

                    <div style={{ marginBottom: '20px' }}>
                        <Link href={route('admin.activities.index')} style={{ fontSize: '12.5px', color: '#999', textDecoration: 'none' }}>
                            ← Back to Activities
                        </Link>
                        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#141414', margin: '8px 0 0' }}>Create Activity</h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ ...card, padding: '24px', display: 'grid', gap: '20px' }}>

                            <div>
                                <label style={labelStyle}>Activity Name *</label>
                                <input className="act-input" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} style={inputStyle} placeholder="e.g. Flood Relief – Bulacan" />
                                {errors.name && <p style={errorStyle}>{errors.name}</p>}
                            </div>

                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea className="act-input" value={data.description} onChange={(e) => setData('description', e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Brief description of the activity..." />
                            </div>

                            <div>
                                <label style={labelStyle}>Assigned By</label>
                                <input className="act-input" type="text" value={data.assigned_by} onChange={(e) => setData('assigned_by', e.target.value)} style={inputStyle} placeholder="e.g. Dr. John Reyes, Director" />
                                {errors.assigned_by && <p style={errorStyle}>{errors.assigned_by}</p>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Date *</label>
                                    <input className="act-input" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} style={inputStyle} />
                                    {errors.date && <p style={errorStyle}>{errors.date}</p>}
                                </div>
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

                            {/* Location — no raw GPS fields shown. Type a place, confirm it, done. */}
                            <div>
                                <label style={labelStyle}>Location *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                    <input
                                        className="act-input"
                                        type="text"
                                        value={data.location_name}
                                        onChange={(e) => handleLocationNameChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmLocation())}
                                        style={inputStyle}
                                        placeholder="e.g. Barangay Hall, Alabang, Muntinlupa"
                                    />
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
                                        {searchLoading ? 'Checking…' : 'Confirm location'}
                                    </button>
                                </div>
                                {errors.location_name && <p style={errorStyle}>{errors.location_name}</p>}

                                {locationStatus && (
                                    <div style={{
                                        marginTop: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.5,
                                        background: locationStatus.ok ? '#e9f8ee' : '#fff7e6',
                                        color: locationStatus.ok ? '#1a8a3d' : '#b8860b',
                                    }}>
                                        {locationStatus.ok ? '✓ Matched: ' : '⚠ '}{locationStatus.message}
                                    </div>
                                )}

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
                                        📍 Use my current location instead
                                    </button>
                                </div>
                                <p style={hintStyle}>Type the venue, then confirm — the match shown above is what gets saved, so double-check it's the right place.</p>
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
                                        <div style={{ border: '1px solid #ebebeb', borderRadius: '10px', maxHeight: '220px', overflowY: 'auto' }}>
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
                                        {data.volunteer_ids.length > 0 && (
                                            <p style={hintStyle}>{data.volunteer_ids.length} volunteer{data.volunteer_ids.length === 1 ? '' : 's'} selected</p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
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
                                    {processing ? 'Creating…' : 'Create Activity'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
