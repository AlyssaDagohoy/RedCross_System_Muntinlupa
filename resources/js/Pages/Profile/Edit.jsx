import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Edit({ auth, mustVerifyEmail, status, userRole }) {
    const user = auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthdate: user.birthdate || '',
        gender: user.gender || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        emergency_contact_relationship: user.emergency_contact_relationship || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const initials = (user.name || '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Volunteer';

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
                    max-width: 760px;
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
                .form-field input, .form-field textarea, .form-field select {
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
                .form-field input:focus, .form-field textarea:focus, .form-field select:focus {
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
                    transition: background 0.2s, transform 0.15s;
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

                .section-label {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 11px; font-weight: 600;
                    letter-spacing: 2px; text-transform: uppercase;
                    color: #DC2626;
                    margin: 8px 0 4px;
                }
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
                            <Link href="/" className="nav-link">Home</Link>
                        </li>
                        {userRole === 'admin' && (
                            <li className="nav-item">
                                <Link href={route('dashboard')} className="nav-link">Dashboard</Link>
                            </li>
                        )}
                        <li className="nav-item" style={{ marginLeft: '4px' }}>
                            <span className="nav-link" style={{ gap: '10px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: '700', fontFamily: 'Oswald, sans-serif',
                                }}>{initials}</div>
                                {user.name}
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </span>
                            <div className="dropdown">
                                <Link href={route('profile.edit')}>My Profile</Link>
                                <Link href={route('logout')} method="post" as="button">Log Out</Link>
                            </div>
                        </li>
                    </ul>
                </nav>

                {/* ── PROFILE HEADER ── */}
                <section style={{ padding: '112px 64px 20px' }}>
                    <div className="section-box" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '32px 40px' }}>
                        <div style={{
                            width: '76px', height: '76px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Oswald, sans-serif', fontSize: '26px', fontWeight: '700',
                            flexShrink: 0, letterSpacing: '1px',
                        }}>{initials}</div>
                        <div>
                            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#111', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '6px' }}>
                                {user.name}
                            </h1>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13.5px', color: '#999', fontWeight: '300', marginBottom: '10px' }}>
                                {user.email}
                            </div>
                            <span className="role-badge">
                                {roleLabel}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── EDIT FORM ── */}
                <section style={{ padding: '20px 64px 60px' }}>
                    <div className="section-box">
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '8px' }}>
                                Account Settings
                            </div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#111', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Edit Profile Information
                            </h2>
                        </div>

                        <form onSubmit={submit} style={{ display: 'grid', gap: '20px' }}>
                            <div className="form-field">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    autoComplete="name"
                                />
                                {errors.name && <div className="error">{errors.name}</div>}
                            </div>

                            <div className="form-field">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    autoComplete="username"
                                />
                                {errors.email && <div className="error">{errors.email}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-field">
                                    <label htmlFor="phone">Contact Number</label>
                                    <input
                                        id="phone"
                                        type="text"
                                        placeholder="+63 9XX-XXX-XXXX"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        autoComplete="tel"
                                    />
                                    {errors.phone && <div className="error">{errors.phone}</div>}
                                </div>

                                <div className="form-field">
                                    <label>Role</label>
                                    <input
                                        type="text"
                                        value={roleLabel}
                                        disabled
                                        style={{ background: '#f5f5f5', color: '#999', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    rows={3}
                                    placeholder="House/Unit No., Street, Barangay, Muntinlupa City"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                                {errors.address && <div className="error">{errors.address}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-field">
                                    <label htmlFor="birthdate">Birthdate</label>
                                    <input
                                        id="birthdate"
                                        type="date"
                                        value={data.birthdate}
                                        onChange={e => setData('birthdate', e.target.value)}
                                        autoComplete="bday"
                                    />
                                    {errors.birthdate && <div className="error">{errors.birthdate}</div>}
                                </div>

                                <div className="form-field">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        value={data.gender}
                                        onChange={e => setData('gender', e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                    {errors.gender && <div className="error">{errors.gender}</div>}
                                </div>
                            </div>

                            <div className="section-label">Emergency Contact</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-field">
                                    <label htmlFor="emergency_contact_name">Emergency Contact Name</label>
                                    <input
                                        id="emergency_contact_name"
                                        type="text"
                                        placeholder="Full name"
                                        value={data.emergency_contact_name}
                                        onChange={e => setData('emergency_contact_name', e.target.value)}
                                    />
                                    {errors.emergency_contact_name && <div className="error">{errors.emergency_contact_name}</div>}
                                </div>

                                <div className="form-field">
                                    <label htmlFor="emergency_contact_relationship">Relationship</label>
                                    <input
                                        id="emergency_contact_relationship"
                                        type="text"
                                        placeholder="e.g. Spouse, Parent, Sibling"
                                        value={data.emergency_contact_relationship}
                                        onChange={e => setData('emergency_contact_relationship', e.target.value)}
                                    />
                                    {errors.emergency_contact_relationship && <div className="error">{errors.emergency_contact_relationship}</div>}
                                </div>
                            </div>

                            <div className="form-field">
                                <label htmlFor="emergency_contact_phone">Emergency Contact Number</label>
                                <input
                                    id="emergency_contact_phone"
                                    type="text"
                                    placeholder="+63 9XX-XXX-XXXX"
                                    value={data.emergency_contact_phone}
                                    onChange={e => setData('emergency_contact_phone', e.target.value)}
                                />
                                {errors.emergency_contact_phone && <div className="error">{errors.emergency_contact_phone}</div>}
                            </div>

                            {mustVerifyEmail && user.email_verified_at === null && (
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#DC2626', margin: 0 }}>
                                    Your email address is unverified.{' '}
                                    <Link href={route('verification.send')} method="post" as="button" style={{ color: '#DC2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
                                        Click here to re-send the verification email.
                                    </Link>
                                </p>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                                <button type="submit" className="save-btn" disabled={processing}>
                                    Save Changes
                                </button>
                                {recentlySuccessful && (
                                    <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                                        Saved.
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