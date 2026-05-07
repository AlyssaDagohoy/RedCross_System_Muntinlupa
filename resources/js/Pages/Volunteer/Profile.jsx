import { Head, Link, useForm } from '@inertiajs/react';

export default function VolunteerProfile({ user }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        _method: 'PATCH',
        phone: user?.phone || '',
        address: user?.address || '',
        birthdate: user?.birthdate || '',
        gender: user?.gender || '',
        emergency_contact_name: user?.emergency_contact_name || '',
        emergency_contact_phone: user?.emergency_contact_phone || '',
        photo: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('volunteer.profile.update'));
    };

    const inputStyle = (hasError) => ({
        width: '100%', padding: '10px 14px',
        border: hasError ? '1px solid #DC2626' : '1px solid #e8e8e8',
        borderRadius: '6px', fontSize: '14px',
        outline: 'none', boxSizing: 'border-box',
        fontFamily: "'Source Sans 3', sans-serif",
        background: 'white',
    });

    const labelStyle = {
        display: 'block', fontSize: '12px', fontWeight: '600',
        color: '#555', textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: '6px'
    };

    return (
        <>
            <Head title="My Profile" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />

            <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Source Sans 3', sans-serif" }}>

                {/* NAV */}
                <nav style={{
                    background: '#111', padding: '14px 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', background: '#DC2626',
                            borderRadius: '4px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '900'
                        }}>+</div>
                        <span style={{
                            fontFamily: 'Oswald, sans-serif',
                            color: 'white', fontSize: '16px', fontWeight: '600', letterSpacing: '1px'
                        }}>RED CROSS — Volunteer Portal</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <Link href={route('volunteer.dashboard')} style={{
                            color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none'
                        }}>← Dashboard</Link>
                        <Link href={route('logout')} method="post" as="button" style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.7)', padding: '7px 18px',
                            borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                        }}>Log Out</Link>
                    </div>
                </nav>

                <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 16px' }}>

                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            fontSize: '11px', fontWeight: '600', letterSpacing: '2px',
                            textTransform: 'uppercase', color: '#DC2626', marginBottom: '6px'
                        }}>Volunteer Portal</div>
                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '32px', color: '#111', fontWeight: '600',
                            textTransform: 'uppercase', margin: 0
                        }}>My Profile</h1>
                    </div>

                    {/* Success Banner */}
                    {recentlySuccessful && (
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '6px', padding: '12px 16px',
                            marginBottom: '20px', fontSize: '13px', color: '#166534'
                        }}>
                            ✅ Profile updated successfully!
                        </div>
                    )}

                    <div style={{
                        background: 'white', borderRadius: '8px',
                        border: '1px solid #e8e8e8', overflow: 'hidden'
                    }}>
                        {/* Card Header */}
                        <div style={{ background: '#DC2626', padding: '20px 32px' }}>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif',
                                fontSize: '18px', color: 'white', fontWeight: '600',
                                textTransform: 'uppercase', margin: 0
                            }}>Personal Information</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '4px 0 0' }}>
                                Fill in your details so the admin has complete information.
                            </p>
                        </div>

                        <form onSubmit={submit} encType="multipart/form-data" style={{ padding: '32px' }}>

                            {/* Name (read-only) */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={labelStyle}>Full Name</label>
                                <input type="text" value={user?.name || ''} disabled style={{
                                    ...inputStyle(false), background: '#f5f5f5', color: '#888'
                                }} />
                                <p style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    Contact admin to change your name.
                                </p>
                            </div>

                            {/* Email (read-only) */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={labelStyle}>Email Address</label>
                                <input type="email" value={user?.email || ''} disabled style={{
                                    ...inputStyle(false), background: '#f5f5f5', color: '#888'
                                }} />
                            </div>

                            {/* Phone */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={labelStyle}>Phone Number</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    placeholder="e.g. 09171234567"
                                    style={inputStyle(errors.phone)}
                                />
                                {errors.phone && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
                            </div>

                            {/* Birthdate & Gender — 2 columns */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                                <div>
                                    <label style={labelStyle}>Birthdate</label>
                                    <input
                                        type="date"
                                        value={data.birthdate}
                                        onChange={e => setData('birthdate', e.target.value)}
                                        style={inputStyle(errors.birthdate)}
                                    />
                                    {errors.birthdate && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.birthdate}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Gender</label>
                                    <select
                                        value={data.gender}
                                        onChange={e => setData('gender', e.target.value)}
                                        style={inputStyle(errors.gender)}
                                    >
                                        <option value="">Select gender</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                    {errors.gender && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.gender}</p>}
                                </div>
                            </div>

                            {/* Address */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={labelStyle}>Address</label>
                                <textarea
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    placeholder="Enter your full address"
                                    rows={3}
                                    style={{ ...inputStyle(errors.address), resize: 'vertical' }}
                                />
                                {errors.address && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.address}</p>}
                            </div>

                            {/* Emergency Contact */}
                            <div style={{
                                background: '#fafafa', border: '1px solid #e8e8e8',
                                borderRadius: '6px', padding: '20px', marginBottom: '18px'
                            }}>
                                <div style={{
                                    fontSize: '12px', fontWeight: '600', letterSpacing: '1px',
                                    textTransform: 'uppercase', color: '#DC2626', marginBottom: '14px'
                                }}>Emergency Contact</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Contact Name</label>
                                        <input
                                            type="text"
                                            value={data.emergency_contact_name}
                                            onChange={e => setData('emergency_contact_name', e.target.value)}
                                            placeholder="Full name"
                                            style={inputStyle(errors.emergency_contact_name)}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Contact Phone</label>
                                        <input
                                            type="text"
                                            value={data.emergency_contact_phone}
                                            onChange={e => setData('emergency_contact_phone', e.target.value)}
                                            placeholder="e.g. 09181234567"
                                            style={inputStyle(errors.emergency_contact_phone)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={labelStyle}>Profile Photo</label>
                                {user?.photo && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <img
                                            src={`/storage/${user.photo}`}
                                            alt="Current photo"
                                            style={{
                                                width: '80px', height: '80px',
                                                borderRadius: '50%', objectFit: 'cover',
                                                border: '3px solid #DC2626'
                                            }}
                                        />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setData('photo', e.target.files[0])}
                                    style={{ fontSize: '13px', color: '#555' }}
                                />
                                {errors.photo && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.photo}</p>}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    width: '100%', background: processing ? '#999' : '#DC2626',
                                    color: 'white', border: 'none', padding: '12px',
                                    borderRadius: '6px', fontSize: '14px', fontWeight: '600',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Source Sans 3', sans-serif",
                                }}
                            >
                                {processing ? 'Saving...' : 'Save Profile'}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}