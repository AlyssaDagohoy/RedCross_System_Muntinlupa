import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    const navItems = [
        {
            label: 'Home', href: '/',
            children: [
                { label: 'Welcome', href: '/' },
                { label: 'Latest News', href: '/#latest-news' },
                { label: 'Recent Programs', href: '/#recent-programs' },
            ]
        },
        {
            label: 'About Us', href: route('about'),
            children: [
                { label: 'Who We Are', href: route('about') + '#who-we-are' },
                { label: 'Mission & Vision', href: route('about') + '#mission-vision' },
                { label: 'Our Team', href: route('about') + '#our-team' },
                { label: 'Our Services', href: route('about') + '#our-services' },
            ]
        },
        {
            label: 'Volunteer', href: route('volunteer'),
            children: [
                { label: 'Become a Volunteer', href: `${route('volunteer')}#become` },
                { label: 'Red Cross 143 Program', href: `${route('volunteer')}#program` },
                { label: 'Volunteer Service FAQs', href: `${route('volunteer')}#faqs` },
            ]
        },
        {
            label: 'Contact Us', href: route('contact'),
            children: [
                { label: 'Get in Touch', href: route('contact') + '#get-in-touch' },
                { label: 'Find Us', href: route('contact') + '#find-us' },
                { label: 'Emergency Hotlines', href: route('contact') + '#emergency-hotlines' },
            ]
        },
    ];

    const eyeIcon = (visible) => visible ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );

    return (
        <>
            <Head title="Volunteer Registration" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                    min-height: 100vh;
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

                .nav-chevron {
                    display: flex; align-items: center; justify-content: center;
                    transition: transform 0.25s ease;
                    opacity: 0.75;
                }
                .nav-item:hover .nav-chevron { transform: rotate(180deg); opacity: 1; }

                .dropdown {
                    position: absolute; top: 120%; left: 0;
                    background: #DC2626;
                    min-width: 220px;
                    padding: 6px 0;
                    opacity: 0; visibility: hidden;
                    transform: translateY(-6px);
                    transition: all 0.2s ease;
                    z-index: 200;
                    box-shadow: 0 16px 36px rgba(0,0,0,0.28);
                    border-radius: 16px;
                }
                .nav-item:hover .dropdown { opacity: 1; visibility: visible; transform: translateY(0); }

                .dropdown a {
                    display: block;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 400;
                    color: rgba(255,255,255,0.88);
                    text-decoration: none;
                    padding: 12px 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    transition: background 0.15s, color 0.15s;
                    letter-spacing: 0.2px;
                }
                .dropdown a:last-child { border-bottom: none; }
                .dropdown a:hover { background: rgba(0,0,0,0.15); color: white; }

                .donate-btn {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 700;
                    background: white; color: #DC2626;
                    padding: 9px 24px; border-radius: 20px;
                    border: 2px solid white;
                    text-decoration: none; letter-spacing: 0.4px;
                    transition: all 0.2s; white-space: nowrap;
                }
                .donate-btn:hover { background: transparent; color: white; }

                .reg-input {
                    width: 100%; padding: 10px 14px;
                    border-radius: 10px; font-size: 13px;
                    outline: none; color: #111;
                    background: #fff3f3; box-sizing: border-box;
                    font-family: 'Source Sans 3', sans-serif;
                    transition: border 0.15s;
                }
                .reg-input:focus { border-color: #DC2626 !important; }

                .password-toggle-btn {
                    position: absolute; right: 4px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    padding: 6px; display: flex; align-items: center;
                    justify-content: center; color: #aaa;
                    transition: color 0.15s;
                }
                .password-toggle-btn:hover { color: #DC2626; }

                .reg-submit-btn {
                    width: 100%; padding: 12px;
                    color: white; border: none;
                    border-radius: 100px; font-size: 13.5px;
                    font-weight: 600; letter-spacing: 0.4px;
                    font-family: 'Source Sans 3', sans-serif;
                    transition: opacity 0.2s;
                }
                .reg-submit-btn:hover:not(:disabled) { opacity: 0.9; }
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
                        {navItems.map((item) => (
                            <li key={item.label} className="nav-item">
                                <span className="nav-link">
                                    {item.label}
                                    <svg className="nav-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </span>
                                <div className="dropdown">
                                    {item.children.map(child => (
                                        child.href.includes('#') ? (
                                            <a key={child.label} href={child.href}>{child.label}</a>
                                        ) : (
                                            <Link key={child.label} href={child.href}>{child.label}</Link>
                                        )
                                    ))}
                                </div>
                            </li>
                        ))}

                        <li style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
                            <Link href={route('donate')} className="donate-btn">DONATE NOW</Link>
                        </li>
                    </ul>
                </nav>

                {/* ── CENTERED REGISTER ── */}
                <div style={{
                    minHeight: '100vh', display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    padding: '96px 24px 24px',
                }}>
                    <div style={{
                        width: '100%', maxWidth: '400px',
                        background: 'white', borderRadius: '20px',
                        padding: '28px 32px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                        border: '1px solid #f5f5f5',
                    }}>

                        {/* Logo */}
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', textDecoration: 'none', justifyContent: 'center' }}>
                            <div style={{
                                width: '32px', height: '32px', background: '#DC2626',
                                borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: 'white', fontSize: '17px', fontWeight: '900',
                                flexShrink: 0,
                            }}>+</div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.6px' }}>
                                    RIZAL CHAPTER
                                </strong>
                                <span style={{ display: 'block', fontSize: '10px', color: '#999', fontFamily: 'Source Sans 3, sans-serif', fontWeight: '300' }}>
                                    Muntinlupa City Branch
                                </span>
                            </div>
                        </Link>

                        {/* Title */}
                        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '10px', fontWeight: '600', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '6px' }}>
                                Volunteer Portal
                            </div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif',
                                fontSize: '22px', color: '#111',
                                letterSpacing: '0.5px', lineHeight: '1.15',
                                fontWeight: '600', textTransform: 'uppercase',
                                marginBottom: '4px'
                            }}>
                                Create Account
                            </h2>
                            <p style={{ fontSize: '12px', color: '#999', fontWeight: '300', fontFamily: 'Source Sans 3, sans-serif' }}>
                                Register to join the Red Cross volunteer team
                            </p>
                        </div>

                        {/* Pending notice */}
                        <div style={{
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderRadius: '10px', padding: '10px 14px',
                            marginBottom: '18px', fontSize: '12px', color: '#92400e',
                            fontFamily: 'Source Sans 3, sans-serif', lineHeight: '1.5',
                        }}>
                            ⏳ After registering, your account will be reviewed by an admin before you can log in.
                        </div>

                        {/* Form */}
                        <form onSubmit={submit}>

                            {/* Full Name */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block', fontSize: '10px',
                                    fontWeight: '600', color: '#999', marginBottom: '6px',
                                    textTransform: 'uppercase', letterSpacing: '0.7px',
                                    fontFamily: 'Source Sans 3, sans-serif',
                                }}>Full Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    autoFocus
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    className="reg-input"
                                    style={{ border: errors.name ? '1px solid #DC2626' : '1px solid #ffe2e2' }}
                                />
                                {errors.name && (
                                    <p style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '5px', fontFamily: 'Source Sans 3, sans-serif' }}>{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block', fontSize: '10px',
                                    fontWeight: '600', color: '#999', marginBottom: '6px',
                                    textTransform: 'uppercase', letterSpacing: '0.7px',
                                    fontFamily: 'Source Sans 3, sans-serif',
                                }}>Email Address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="reg-input"
                                    style={{ border: errors.email ? '1px solid #DC2626' : '1px solid #ffe2e2' }}
                                />
                                {errors.email && (
                                    <p style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '5px', fontFamily: 'Source Sans 3, sans-serif' }}>{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block', fontSize: '10px',
                                    fontWeight: '600', color: '#999', marginBottom: '6px',
                                    textTransform: 'uppercase', letterSpacing: '0.7px',
                                    fontFamily: 'Source Sans 3, sans-serif',
                                }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="Create a password"
                                        required
                                        className="reg-input"
                                        style={{
                                            border: errors.password ? '1px solid #DC2626' : '1px solid #ffe2e2',
                                            paddingRight: '42px',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle-btn"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {eyeIcon(showPassword)}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '5px', fontFamily: 'Source Sans 3, sans-serif' }}>{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{
                                    display: 'block', fontSize: '10px',
                                    fontWeight: '600', color: '#999', marginBottom: '6px',
                                    textTransform: 'uppercase', letterSpacing: '0.7px',
                                    fontFamily: 'Source Sans 3, sans-serif',
                                }}>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        placeholder="Repeat your password"
                                        required
                                        className="reg-input"
                                        style={{
                                            border: errors.password_confirmation ? '1px solid #DC2626' : '1px solid #ffe2e2',
                                            paddingRight: '42px',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="password-toggle-btn"
                                        tabIndex={-1}
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    >
                                        {eyeIcon(showConfirm)}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '5px', fontFamily: 'Source Sans 3, sans-serif' }}>{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="reg-submit-btn"
                                style={{
                                    background: processing ? '#f87171' : '#DC2626',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    marginBottom: '14px',
                                }}
                            >
                                {processing ? 'Registering...' : 'Register as Volunteer'}
                            </button>

                            <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', fontFamily: 'Source Sans 3, sans-serif', fontWeight: '300' }}>
                                Already have an account?{' '}
                                <Link href={route('login')} style={{ color: '#DC2626', fontWeight: '600', textDecoration: 'none' }}>
                                    Log in here
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}