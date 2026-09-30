import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Contact({ auth }) {
    const [copied, setCopied] = useState(null);

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
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

    return (
        <>
            <Head title="Contact - Philippine Red Cross Muntinlupa" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                }

                /* NAV */
                .nav-pill-red {
                    display: flex; align-items: center; gap: 2px;
                    background: transparent;
                    border-radius: 100px; padding: 4px;
                    list-style: none; margin: 0;
                }
                .nav-item-red { position: relative; }
                .nav-link-red {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 12.5px; font-weight: 600;
                    color: #7f1d1d;
                    padding: 7px 16px;
                    display: inline-block; white-space: nowrap;
                    cursor: pointer;
                    position: relative;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .nav-link-red:hover { color: #DC2626; }
                .nav-link-red.active { color: #DC2626; }
                .nav-link-red.active::after {
                    content: ''; position: absolute; left: 16px; right: 16px; bottom: -2px;
                    height: 2px; background: #DC2626; border-radius: 2px;
                }

                .nav-auth {
                    display: flex; align-items: center; gap: 8px;
                }
                .nav-login-link {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 12.5px; font-weight: 600;
                    color: #7f1d1d; padding: 8px 16px;
                    border-radius: 100px;
                    text-decoration: none; white-space: nowrap;
                    transition: background 0.2s;
                }
                .nav-login-link:hover { background: #fee2e2; }

                .login-btn-red {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 12.5px; font-weight: 700;
                    color: white; padding: 8px 18px;
                    border-radius: 100px;
                    background: #DC2626;
                    text-decoration: none; white-space: nowrap;
                    transition: background 0.2s;
                }
                .login-btn-red:hover { background: #b91c1c; }

                /* SECTION BOX WRAPPER */
                .section-box {
                    background: white;
                    border-radius: 24px;
                    padding: 44px 40px;
                    max-width: 1140px;
                    margin: 0 auto;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                    border: 1px solid #f5f5f5;
                }

                /* CARDS */
                .contact-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 36px 28px; text-align: left;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .contact-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }

                .copy-btn {
                    background: white;
                    border: 1px solid #ffe2e2;
                    border-radius: 5px;
                    padding: 3px 8px;
                    font-size: 10px;
                    cursor: pointer;
                    color: #DC2626;
                    font-weight: 600;
                    flex-shrink: 0;
                    transition: background 0.15s;
                }
                .copy-btn:hover { background: #fee2e2; }
                .copy-btn.copied { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }

                .map-box {
                    background: white; border-radius: 14px; overflow: hidden;
                    border: 1px solid #ffe2e2;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                }

                /* EMERGENCY HOTLINE CARDS */
                .hotline-card {
                    background: white; border-radius: 14px;
                    padding: 24px 20px; text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .hotline-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
            `}</style>

            <div>

                {/* ── NAVBAR BACKDROP (hides content peeking through the floating gap) ── */}
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
                    height: '160px',
                    background: 'linear-gradient(180deg, #fee2e2 0%, rgba(254,226,226,0.7) 40%, rgba(254,226,226,0) 100%)',
                    pointerEvents: 'none',
                }} />

                {/* ── NAVBAR ── */}
                <nav style={{
                    position: 'fixed', top: '16px', left: '24px', right: '24px', zIndex: 100,
                    background: 'white',
                    height: '56px',
                    borderRadius: '100px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                    border: '1px solid #ffe2e2',
                }}>

                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0, paddingLeft: '8px', zIndex: 1 }}>
                        <div style={{
                            width: '36px', height: '36px', background: 'white',
                            borderRadius: '50%', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <img
                                src="/images/red-cross-logo.png"
                                alt="Philippine Red Cross"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#7f1d1d', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px' }}>
                                RIZAL CHAPTER
                            </strong>
                            <span style={{ display: 'block', fontSize: '9.5px', color: '#999', fontFamily: 'Open Sans, sans-serif', fontWeight: '300' }}>
                                Muntinlupa City Branch
                            </span>
                        </div>
                    </Link>

                    <ul className="nav-pill-red" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
                        {navItems.map((item, idx) => (
                            <li key={item.label} className="nav-item-red">
                                <Link
                                    href={item.href}
                                    className={`nav-link-red${idx === 3 ? ' active' : ''}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="nav-auth">
                        <Link href={route('login')} className="nav-login-link">Log In</Link>
                        <Link href={route('register')} className="login-btn-red">Sign Up</Link>
                    </div>
                </nav>

                {/* ── HERO BANNER ── */}
                <section style={{
                    position: 'relative', overflow: 'hidden',
                    backgroundImage: 'url("https://redcross.org.ph/wp-content/themes/yootheme/cache/banner_inner-1966008c.jpeg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center',
                    marginTop: '96px',
                    borderRadius: '24px',
                    marginLeft: '24px', marginRight: '24px',
                }}>
                    <div style={{
                        position: 'absolute', right: '-40px', top: '50%',
                        transform: 'translateY(-50%)', width: '260px', height: '260px',
                        border: '36px solid rgba(255,255,255,0.08)', borderRadius: '50%'
                    }}></div>

                    <div style={{
                        position: 'relative', zIndex: 2, padding: '32px 48px',
                        width: '100%',
                    }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                            color: 'white', fontSize: '10px', fontWeight: '600',
                            letterSpacing: '2px', textTransform: 'uppercase',
                            padding: '5px 14px', borderRadius: '100px', marginBottom: '12px',
                            fontFamily: 'Source Sans 3, sans-serif',
                        }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'white', display: 'inline-block' }}></span>
                            Get In Touch
                        </div>
                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '30px', lineHeight: '1.1', color: 'white',
                            letterSpacing: '0.5px', margin: '0 0 8px 0',
                            fontWeight: '700', textTransform: 'uppercase'
                        }}>
                            Contact <span style={{ color: 'white' }}>Us</span>
                        </h1>
                        <p style={{
                            fontFamily: 'Source Sans 3, sans-serif',
                            fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6',
                            maxWidth: '460px', fontWeight: '300', fontStyle: 'italic', margin: 0,
                        }}>
                            Reach out to the Philippine Red Cross – Muntinlupa City Branch. We're here to help.
                        </p>
                    </div>
                </section>

                {/* ── CONTACT CARDS (Get in Touch) ── */}
                <section id="get-in-touch" style={{ padding: '40px 64px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>How To Reach Us</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0
                            }}>Get In Touch</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>

                            {/* Visit Us */}
                            <div className="contact-card">
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Visit Us</div>
                                <div style={{ width: '28px', height: '3px', background: '#DC2626', marginBottom: '16px', borderRadius: '2px' }}></div>
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#666', lineHeight: '1.8', fontWeight: '300', margin: '0 0 16px' }}>
                                    Muntinlupa City Hall Compound<br />
                                    National Road, Alabang<br />
                                    Muntinlupa City, Metro Manila
                                </p>
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Mon – Fri &nbsp;·&nbsp; 8:00 AM – 5:00 PM
                                </div>
                            </div>

                            {/* Call Us */}
                            <div style={{
                                background: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)',
                                borderRadius: '14px', padding: '36px 28px',
                            }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Call Us Now</div>
                                <div style={{ width: '28px', height: '3px', background: 'rgba(255,255,255,0.4)', marginBottom: '16px', borderRadius: '2px' }}></div>
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Hotline</div>
                                    <div style={{ fontSize: '22px', fontFamily: 'Oswald, sans-serif', color: 'white', fontWeight: '700', letterSpacing: '1px' }}>143</div>
                                </div>
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Office</div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: 'white', fontWeight: '400' }}>(02) 8790-2300</div>
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Mobile</div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: 'white', fontWeight: '400' }}>+63 917 123 4567</div>
                                </div>
                            </div>

                            {/* Email Us */}
                            <div className="contact-card">
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Email Us</div>
                                <div style={{ width: '28px', height: '3px', background: '#DC2626', marginBottom: '16px', borderRadius: '2px' }}></div>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>General Inquiries</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: '#444' }}>rizalmuntinlupa@redcross.org.ph</span>
                                        <button onClick={() => handleCopy('rizalmuntinlupa@redcross.org.ph', 'general')} className={`copy-btn${copied === 'general' ? ' copied' : ''}`}>
                                            {copied === 'general' ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Volunteer Program</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: '#444' }}>volunteers@redcross.org.ph</span>
                                        <button onClick={() => handleCopy('volunteers@redcross.org.ph', 'volunteer')} className={`copy-btn${copied === 'volunteer' ? ' copied' : ''}`}>
                                            {copied === 'volunteer' ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ── MAP (Find Us) ── */}
                <section id="find-us" style={{ padding: '0 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div className="map-box">
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #ffe2e2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', fontWeight: '600', color: '#111' }}>Our Location</span>
                                <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#aaa', marginLeft: '4px' }}>Muntinlupa City Hall Compound, Alabang</span>
                            </div>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3864.0!2d121.0244!3d14.4024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d1234567890%3A0xabc123!2sMuntinlupa+City+Hall!5e0!3m2!1sen!2sph!4v1234567890"
                                width="100%"
                                height="320"
                                style={{ border: 0, display: 'block' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </section>

                {/* ── EMERGENCY HOTLINES ── */}
                <section id="emergency-hotlines" style={{ padding: '0 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Need Help Now?</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0
                            }}>Emergency Hotlines</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {[
                                { label: 'Red Cross Hotline', number: '143' },
                                { label: 'National Emergency', number: '911' },
                                { label: 'PRC Muntinlupa Office', number: '(02) 8790-2300' },
                                { label: 'Duty Mobile', number: '+63 917 123 4567' },
                            ].map(({ label, number }) => (
                                <div key={label} className="hotline-card">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                    </div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '8px' }}>{label}</div>
                                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', color: '#DC2626', fontWeight: '700', letterSpacing: '0.5px' }}>{number}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA BANNER ── */}
                <section style={{
                    padding: '60px 64px', textAlign: 'center',
                    background: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '14px' }}>Join Us</div>
                        <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '38px', color: 'white', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 28px', letterSpacing: '0.5px' }}>
                            Be A Volunteer Today
                        </h2>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <Link href={route('register')} style={{
                                background: 'white', color: '#DC2626', padding: '13px 36px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '700',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>Register Now</Link>
                            <Link href={route('login')} style={{
                                background: 'transparent', color: 'white', padding: '13px 36px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '600',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                border: '1px solid rgba(255,255,255,0.5)',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>Log In</Link>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer style={{ background: '#0a0a0a', padding: '24px 64px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3px', fontWeight: '300' }}>
                            © 2026 Philippine Red Cross – Muntinlupa City Branch. All rights reserved.
                        </span>
                    </div>
                </footer>

            </div>
        </>
    );
}
