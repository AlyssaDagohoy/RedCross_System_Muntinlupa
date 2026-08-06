import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Profile({ auth, user }) {
    const [photoPreview, setPhotoPreview] = useState(null);

    const profileForm = useForm({
        phone: user.phone || '',
        address: user.address || '',
        birthdate: user.birthdate || '',
        gender: user.gender || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        photo: null,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.post(route('admin.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                profileForm.setData('photo', null);
                setPhotoPreview(null);
            },
        });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.patch(route('admin.profile.password'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            profileForm.setData('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const initials = (user.name || '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title="My Profile - Philippine Red Cross Muntinlupa" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                }

                .nav-item { position: relative; height: 100%; display: flex; align-items: center; }
                .nav-link {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 14px; font-weight: 600;
                    color: white;
                    text-decoration: none;
                    padding: 0 20px; height: 100%;
                    display: flex; align-items: center; gap: 9px;
                    white-space: nowrap;
                    letter-spacing: 0.3px;
                    transition: background 0.2s;
                    cursor: pointer;
                }
                .nav-link:hover { background: rgba(0,0,0,0.12); }

                .dropdown {
                    position: absolute; top: 120%; right: 0;
                    background: #DC2626;
                    min-width: 180px;
                    padding: 6px 0;
                    opacity: 0; visibility: hidden;
                    transform: translateY(-6px);
                    transition: all 0.2s ease;
                    z-index: 200;
                    box-shadow: 0 16px 36px rgba(0,0,0,0.28);
                    border-radius: 16px;
                }
                .nav-item:hover .dropdown { opacity: 1; visibility: visible; transform: translateY(0); }

                .dropdown a, .dropdown button {
                    display: block; width: 100%; text-align: left;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 400;
                    color: rgba(255,255,255,0.88);
                    text-decoration: none; background: none; border: none; cursor: pointer;
                    padding: 12px 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    transition: background 0.15s, color 0.15s;
                    letter-spacing: 0.2px;
                }
                .dropdown a:last-child, .dropdown button:last-child { border-bottom: none; }
                .dropdown a:hover, .dropdown button:hover { background: rgba(0,0,0,0.15); color: white; }

                .section-box {
                    background: white;
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 780px;
                    margin: 0 auto;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                    border: 1px solid #f5f5f5;
                }

                .form-field label {
                    display: block;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 12px; font-weight: 600;
                    letter-spacing: 0.5px; text-transform: uppercase;
                    color: #999; margin-bottom: 8px;
                }
                .form-field input, .form-field select, .form-field textarea {
                    width: 100%;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 14px;
                    color: #111;
                    background: #fff8f8;
                    border: 1px solid #ffe2e2;
                    border-radius: 10px;
                    padding: 12px 14px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
                    border-color: #DC2626;
                    box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
                }
                .form-field .error {
                    color: #DC2626; font-size: 12px; margin-top: 6px; font-weight: 400;
                }

                .save-btn {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 700;
                    background: #DC2626; color: white;
                    padding: 12px 32px; border-radius: 100px;
                    border: none; letter-spacing: 0.4px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .save-btn:hover { background: #b91c1c; }
                .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                .role-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: #fee2e2; color: #DC2626;
                    font-size: 11px; font-weight: 700;
                    letter-spacing: 0.6px; text-transform: uppercase;
                    padding: 6px 14px; border-radius: 100px;
                }

                .photo-upload-btn {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 12px; font-weight: 600;
                    background: white; color: #DC2626;
                    border: 1px solid #ffe2e2;
                    padding: 8px 18px; border-radius: 100px;
                    cursor: pointer; letter-spacing: 0.3px;
                    transition: background 0.2s, border-color 0.2s;
                    display: inline-flex; align-items: center; gap: 6px;
                }
                .photo-upload-btn:hover { background: #fff3f3; border-color: #DC2626; }
            `}</style>

            <div>

                {/* ── NAVBAR ── */}
                <nav style={{
                    position: 'fixed', top: '16px', left: '24px', right: '24px', zIndex: 100,
                    background: '#DC2626',
                    height: '64px',
                    borderRadius: '100px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px 0 24px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', flexShrink: 0 }}>
                        <div style={{
                            width: '36px', height: '36px', background: 'white',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#DC2626', fontSize: '20px', fontWeight: '900',
                            flexShrink: 0,
                        }}>+</div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'white', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.6px' }}>
                                RIZAL CHAPTER
                            </strong>
                            <span style={{ display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.72)', fontFamily: 'Source Sans 3, sans-serif', fontWeight: '300' }}>
                                Muntinlupa City Branch
                            </span>
                        </div>
                    </Link>

                    <ul style={{ display: 'flex', alignItems: 'center', listStyle: 'none', height: '64px', gap: '0', margin: '0 0 0 auto', padding: 0 }}>
                        <li className="nav-item">
                            <Link href={route('admin.dashboard')} className="nav-link">Dashboard</Link>
                        </li>
                        <li className="nav-item">
                            <Link href={route('admin.volunteers')} className="nav-link">Volunteers</Link>
                        </li>
                        <li className="nav-item">
                            <Link href={route('admin.activities.index')} className="nav-link">Activities</Link>
                        </li>
                        <li className="nav-item" style={{ marginLeft: '4px' }}>
                            <span className="nav-link" style={{ gap: '10px' }}>
                                {user.photo ? (
                                    <img src={`/storage/${user.photo}`} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: '700', fontFamily: 'Oswald, sans-serif',
                                    }}>{initials}</div>
                                )}
                                {user.name}
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </span>
                            <div className="dropdown">
                                <Link href={route('admin.profile')}>My Profile</Link>
                                <Link href={route('logout')} method="post" as="button">Log Out</Link>
                            </div>
                        </li>
                    </ul>
                </nav>

                {/* ── PROFILE HEADER ── */}
                <section style={{ padding: '112px 64px 20px' }}>
                    <div className="section-box" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '32px 40px' }}>
                        {photoPreview || user.photo ? (
                            <img
                                src={photoPreview || `/storage/${user.photo}`}
                                alt={user.name}
                                style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: '76px', height: '76px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'Oswald, sans-serif', fontSize: '26px', fontWeight: '700',
                                flexShrink: 0, letterSpacing: '1px',
                            }}>{initials}</div>
                        )}
                        <div>
                            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#111', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '6px' }}>
                                {user.name}
                            </h1>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13.5px', color: '#999', fontWeight: '300', marginBottom: '10px' }}>
                                {user.email}
                            </div>
                            <span className="role-badge">Administrator</span>
                        </div>
                    </div>
                </section>

                {/* ── EDIT PROFILE FORM ── */}
                <section style={{ padding: '20px 64px' }}>
                    <div className="section-box">
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '8px' }}>
                                Personal Information
                            </div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#111', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Edit Profile
                            </h2>
                        </div>

                        <form onSubmit={submitProfile} encType="multipart/form-data" style={{ display: 'grid', gap: '20px' }}>
                            <div className="form-field">
                                <label>Profile Photo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <label className="photo-upload-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        Upload New Photo
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                    </label>
                                    {profileForm.data.photo && (
                                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'Source Sans 3, sans-serif' }}>{profileForm.data.photo.name}</span>
                                    )}
                                </div>
                                {profileForm.errors.photo && <div className="error">{profileForm.errors.photo}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-field">
                                    <label htmlFor="phone">Contact Number</label>
                                    <input
                                        id="phone"
                                        type="text"
                                        placeholder="+63 9XX-XXX-XXXX"
                                        value={profileForm.data.phone}
                                        onChange={e => profileForm.setData('phone', e.target.value)}
                                    />
                                    {profileForm.errors.phone && <div className="error">{profileForm.errors.phone}</div>}
                                </div>

                                <div className="form-field">
                                    <label htmlFor="birthdate">Birthdate</label>
                                    <input
                                        id="birthdate"
                                        type="date"
                                        value={profileForm.data.birthdate}
                                        onChange={e => profileForm.setData('birthdate', e.target.value)}
                                    />
                                    {profileForm.errors.birthdate && <div className="error">{profileForm.errors.birthdate}</div>}
                                </div>
                            </div>

                            <div className="form-field">
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    value={profileForm.data.gender}
                                    onChange={e => profileForm.setData('gender', e.target.value)}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {profileForm.errors.gender && <div className="error">{profileForm.errors.gender}</div>}
                            </div>

                            <div className="form-field">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    rows={3}
                                    placeholder="House/Unit No., Street, Barangay, Muntinlupa City"
                                    value={profileForm.data.address}
                                    onChange={e => profileForm.setData('address', e.target.value)}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                                {profileForm.errors.address && <div className="error">{profileForm.errors.address}</div>}
                            </div>

                            <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '20px', marginTop: '4px' }}>
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '16px' }}>
                                    Emergency Contact
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-field">
                                        <label htmlFor="emergency_contact_name">Contact Name</label>
                                        <input
                                            id="emergency_contact_name"
                                            type="text"
                                            placeholder="Full name"
                                            value={profileForm.data.emergency_contact_name}
                                            onChange={e => profileForm.setData('emergency_contact_name', e.target.value)}
                                        />
                                        {profileForm.errors.emergency_contact_name && <div className="error">{profileForm.errors.emergency_contact_name}</div>}
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="emergency_contact_phone">Contact Number</label>
                                        <input
                                            id="emergency_contact_phone"
                                            type="text"
                                            placeholder="+63 9XX-XXX-XXXX"
                                            value={profileForm.data.emergency_contact_phone}
                                            onChange={e => profileForm.setData('emergency_contact_phone', e.target.value)}
                                        />
                                        {profileForm.errors.emergency_contact_phone && <div className="error">{profileForm.errors.emergency_contact_phone}</div>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                                <button type="submit" className="save-btn" disabled={profileForm.processing}>
                                    Save Changes
                                </button>
                                {profileForm.recentlySuccessful && (
                                    <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                                        Saved.
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                </section>

                {/* ── CHANGE PASSWORD ── */}
                <section style={{ padding: '20px 64px 60px' }}>
                    <div className="section-box">
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '8px' }}>
                                Security
                            </div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#111', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Change Password
                            </h2>
                        </div>

                        <form onSubmit={submitPassword} style={{ display: 'grid', gap: '20px' }}>
                            <div className="form-field">
                                <label htmlFor="current_password">Current Password</label>
                                <input
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                                    autoComplete="current-password"
                                />
                                {passwordForm.errors.current_password && <div className="error">{passwordForm.errors.current_password}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-field">
                                    <label htmlFor="password">New Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={e => passwordForm.setData('password', e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    {passwordForm.errors.password && <div className="error">{passwordForm.errors.password}</div>}
                                </div>
                                <div className="form-field">
                                    <label htmlFor="password_confirmation">Confirm New Password</label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                                <button type="submit" className="save-btn" disabled={passwordForm.processing}>
                                    Update Password
                                </button>
                                {passwordForm.recentlySuccessful && (
                                    <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                                        Password updated.
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                </section>

            </div>
        </>
    );
}