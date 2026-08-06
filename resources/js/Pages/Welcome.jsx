import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Welcome({ auth }) {
    const [visible, setVisible] = useState({});
    const [callModal, setCallModal] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                setVisible(v => ({ ...v, [e.target.dataset.id]: e.isIntersecting }));
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('[data-id]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const navItems = [
        {
            label: 'Home', href: '/',
            children: [
                { label: 'Welcome', href: '/' },
                { label: 'Latest News', href: '#latest-news' },
                { label: 'Recent Programs', href: '#recent-programs' },
            ]
        },
        {
            label: 'About Us', href: route('about'),
            children: [
                { label: 'Who We Are', href: route('about') },
                { label: 'Mission & Vision', href: route('about') },
                { label: 'Our Team', href: route('about') },
                { label: 'Our Services', href: route('about') },
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
                { label: 'Get in Touch', href: route('contact') },
                { label: 'Find Us', href: route('contact') },
                { label: 'Emergency Hotlines', href: route('contact') },
            ]
        },
    ];

    const fadeIn = (id, delay = 0) => ({
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        opacity: visible[id] ? 1 : 0,
        transform: visible[id] ? 'translateY(0)' : 'translateY(24px)',
    });

    const services = [
        {
            title: 'Blood Services',
            desc: 'Safe and adequate blood supply accessible at all times through our blood service facilities nationwide.',
            img: 'https://redcross.org.ph/wp-content/uploads/2022/08/PicsArt_08-11-03.09.03.jpeg'
        },
        {
            title: 'Disaster Response',
            desc: 'Rapid emergency response to natural disasters, providing relief and rehabilitation to affected communities.',
            img: 'https://redcross.org.ph/wp-content/uploads/2025/11/574884052_1281480234006011_5686183456708242094_n.jpg'
        },
        {
            title: 'Health Services',
            desc: 'Community health programs including medical missions, first aid training, and health education.',
            img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUTswwS5sxYtz4929nFBqhBFInlaMtHXRzpLfyiJYNFVWM6lh365MxEvY&s=10'
        },
        {
            title: 'Volunteer Program',
            desc: 'Join thousands of volunteers making a difference through service, training, and community outreach.',
            img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBE91B2Me0AW2hCtEgUaUk2KDCzwHVcAJHl3yfVWUQKq511T9UnFM1Vto&s=10'
        },
    ];

    const news = [
        {
            slug: 'blood-drive-success-muntinlupa',
            title: 'Blood Drive Success in Muntinlupa Barangays',
            date: 'JUN 12, 2026',
            excerpt: 'Over 300 units of blood collected during our latest community blood donation drive across five barangays.',
            img: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&h=280&fit=crop',
        },
        {
            slug: 'volunteers-complete-bls-training',
            title: 'New Volunteers Complete Basic Life Support Training',
            date: 'MAY 28, 2026',
            excerpt: 'A fresh batch of Red Cross 143 volunteers finished their certification, ready to serve the community.',
            img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=280&fit=crop',
        },
        {
            slug: 'disaster-preparedness-seminar-schools',
            title: 'Disaster Preparedness Seminar Held for Local Schools',
            date: 'MAY 15, 2026',
            excerpt: 'Students and teachers learned emergency response basics ahead of the upcoming rainy season.',
            img: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=280&fit=crop',
        },
    ];

    const hotlines = [
        { label: 'Red Cross Hotline', number: '143' },
        { label: 'National Emergency', number: '911' },
        { label: 'PRC Muntinlupa Office', number: '(02) 8790-2300' },
        { label: 'Duty Mobile', number: '+63 917 123 4567' },
    ];

    const handleHotlineClick = (label, number) => {
        setCallModal({ label, number });
    };

    const confirmCall = () => {
        if (callModal) {
            window.location.href = `tel:${callModal.number.replace(/[^\d+]/g, '')}`;
        }
        setCallModal(null);
    };

    return (
        <>
            <Head title="Philippine Red Cross - Muntinlupa" />
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
                .nav-link.active { background: rgba(0,0,0,0.18); }

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

                .section-box {
                    background: white;
                    border-radius: 24px;
                    padding: 44px 40px;
                    max-width: 1140px;
                    margin: 0 auto;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                    border: 1px solid #f5f5f5;
                }

                .service-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 20px 22px 26px; text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    overflow: hidden;
                }
                .service-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
                .service-card img { transition: transform 0.4s ease; }
                .service-card:hover img { transform: scale(1.08); }

                .news-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 14px 14px 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .news-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
                .news-card img { transition: transform 0.4s ease; }
                .news-card:hover img { transform: scale(1.06); }

                .hotline-banner {
                    position: relative;
                    width: 100%;
                    height: 220px;
                    border-radius: 18px;
                    overflow: hidden;
                    margin-bottom: 36px;
                }
                .hotline-banner img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .hotline-banner::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(180deg, rgba(127,29,29,0.35) 0%, rgba(127,29,29,0.85) 100%);
                }
                .hotline-banner-text {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    padding: 22px 30px;
                    z-index: 1;
                    text-align: left;
                }

                .hotline-card {
                    position: relative;
                    background: linear-gradient(150deg, #7f1d1d 0%, #DC2626 55%, #b91c1c 100%);
                    border-radius: 16px;
                    padding: 28px 20px 24px;
                    text-align: center;
                    box-shadow: 0 6px 20px rgba(220,38,38,0.25);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                    overflow: hidden;
                }
                .hotline-card::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image:
                        repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 14px);
                    pointer-events: none;
                }
                .hotline-card::after {
                    content: '';
                    position: absolute; top: -30px; right: -30px;
                    width: 100px; height: 100px; border-radius: 50%;
                    background: rgba(255,255,255,0.08);
                    pointer-events: none;
                }
                .hotline-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 44px rgba(220,38,38,0.4);
                }
                .hotline-pulse-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: #4ade80;
                    display: inline-block;
                    box-shadow: 0 0 0 rgba(74,222,128,0.6);
                    animation: hotlinePulse 1.8s infinite;
                }
                @keyframes hotlinePulse {
                    0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
                    70% { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
                    100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
                }
                .hotline-tap-hint {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 10px; color: rgba(255,255,255,0.55);
                    letter-spacing: 0.5px; text-transform: uppercase;
                    margin-top: 10px; font-weight: 600;
                }

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

                .login-btn {
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 600;
                    background: rgba(0,0,0,0.2); color: white;
                    padding: 9px 20px; border-radius: 6px;
                    text-decoration: none; white-space: nowrap;
                    transition: background 0.2s;
                }
                .login-btn:hover { background: rgba(0,0,0,0.35); }

                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
                @keyframes modalIn { from{ opacity:0; transform: scale(0.94) translateY(10px); } to{ opacity:1; transform: scale(1) translateY(0); } }
                @keyframes overlayIn { from{ opacity:0; } to{ opacity:1; } }

                .hero-float-img { animation: float 4s ease-in-out infinite; }

                .call-overlay {
                    position: fixed; inset: 0; z-index: 1000;
                    background: rgba(0,0,0,0.55);
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px;
                    animation: overlayIn 0.2s ease;
                }
                .call-modal {
                    background: white; border-radius: 20px;
                    max-width: 360px; width: 100%;
                    padding: 32px 28px 26px;
                    text-align: center;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.3);
                    animation: modalIn 0.25s ease;
                }
                .call-btn-confirm {
                    background: #DC2626; color: white; border: none;
                    padding: 13px 0; border-radius: 10px;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 14px; font-weight: 700;
                    letter-spacing: 0.3px; cursor: pointer;
                    width: 100%; transition: background 0.15s;
                }
                .call-btn-confirm:hover { background: #b91c1c; }
                .call-btn-cancel {
                    background: transparent; color: #888; border: none;
                    padding: 12px 0; border-radius: 10px;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 13px; font-weight: 600;
                    cursor: pointer; width: 100%; margin-top: 6px;
                    transition: color 0.15s;
                }
                .call-btn-cancel:hover { color: #444; }
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
                        {navItems.map((item, idx) => (
                            <li key={item.label} className="nav-item">
                                <span className={`nav-link${idx === 0 ? ' active' : ''}`}>
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

                        <li style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link href={route('donate')} className="donate-btn">DONATE NOW</Link>
                            <Link href={route('login')} className="login-btn">Log In</Link>
                        </li>
                    </ul>
                </nav>

                {/* ── HERO (WELCOME) ── */}
                <section style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'transparent',
                    paddingTop: '72px',
                }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        alignItems: 'center', gap: '40px',
                        maxWidth: '1200px', margin: '0 auto',
                        padding: '64px 56px 80px',
                        minHeight: 'calc(100vh - 72px)',
                    }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
                                color: '#DC2626', fontSize: '11px', fontWeight: '600',
                                letterSpacing: '2px', textTransform: 'uppercase',
                                padding: '6px 16px', borderRadius: '100px', marginBottom: '28px',
                                fontFamily: 'Source Sans 3, sans-serif',
                            }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#DC2626', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                                Volunteer Program 2026
                            </div>

                            <h1 style={{
                                fontFamily: 'Oswald, sans-serif',
                                fontSize: '58px', lineHeight: '1.05', color: '#1a1a1a',
                                letterSpacing: '0.5px', margin: '0 0 20px',
                                fontWeight: '700', textTransform: 'uppercase',
                            }}>
                                <span style={{ color: '#DC2626' }}>Volunteer</span> Needed <span style={{ color: '#DC2626' }}>Now</span>
                            </h1>

                            <p style={{
                                fontFamily: 'Source Sans 3, sans-serif',
                                fontSize: '16px', color: '#555', lineHeight: '1.75',
                                maxWidth: '440px', fontWeight: '300',
                                margin: '0 0 36px',
                            }}>
                                Join the Philippine Red Cross – Muntinlupa City Branch and make a difference
                                in your community through disaster response, blood services, and emergency care.
                            </p>

                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <Link href={route('register')} style={{
                                    background: '#DC2626', color: 'white', padding: '13px 30px',
                                    borderRadius: '100px', fontSize: '14px', fontWeight: '600',
                                    textDecoration: 'none', letterSpacing: '0.5px',
                                    fontFamily: 'Source Sans 3, sans-serif',
                                }}>Join for Free →</Link>
                                <Link href={route('about')} style={{
                                    fontFamily: 'Source Sans 3, sans-serif',
                                    color: '#DC2626', fontSize: '14px', fontWeight: '600',
                                    textDecoration: 'none',
                                    border: '1px solid rgba(220,38,38,0.3)',
                                    padding: '13px 26px', borderRadius: '100px',
                                }}>Learn More</Link>
                            </div>

                            <div style={{ display: 'flex', gap: '40px', marginTop: '56px' }}>
                                {[['500+', 'Volunteers'], ['24/7', 'Response'], ['10+', 'Programs']].map(([num, label]) => (
                                    <div key={label}>
                                        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', color: '#1a1a1a', fontWeight: '600' }}>{num}</div>
                                        <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#888', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '300' }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute', top: '-24px', right: '-24px',
                                width: '100%', height: '100%',
                                background: '#DC2626', borderRadius: '24px', zIndex: 0,
                            }} />
                            <img
                                className="hero-float-img"
                                src="https://pbs.twimg.com/media/EhNR1YLXcAIMJp2.png"
                                alt="Red Cross volunteers"
                                style={{
                                    position: 'relative', zIndex: 1,
                                    width: '100%', height: '520px', objectFit: 'cover',
                                    borderRadius: '24px',
                                    boxShadow: '0 20px 50px rgba(220,38,38,0.2)',
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* ── EMERGENCY HOTLINE ── */}
                <section style={{ padding: '40px 64px', scrollMarginTop: '96px' }}>
                    <div className="section-box" data-id="hotlinebox" style={fadeIn('hotlinebox')}>

                        <div className="hotline-banner">
                            <img
                                src="https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=1200&h=440&fit=crop"
                                alt="Emergency response team"
                            />
                            <div className="hotline-banner-text">
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#ffc4c4', marginBottom: '8px' }}>Need Help Now?</div>
                                <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '32px', color: 'white', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Emergency Hotline</h2>
                            </div>
                        </div>

                        <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: '0 auto 36px', maxWidth: '480px', lineHeight: '1.6', textAlign: 'center' }}>
                            For emergencies, disaster response, or urgent concerns, tap a hotline below to call.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {hotlines.map((h, i) => (
                                <div
                                    key={h.label}
                                    data-id={`hl${i}`}
                                    className="hotline-card"
                                    style={fadeIn(`hl${i}`, i * 0.08)}
                                    onClick={() => handleHotlineClick(h.label, h.number)}
                                >
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 16px',
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.85)',
                                            fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px',
                                        }}>
                                            <span className="hotline-pulse-dot"></span>
                                            {h.label}
                                        </div>
                                        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '26px', fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>{h.number}</div>
                                        <div className="hotline-tap-hint">Tap to Call</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── LATEST NEWS ── */}
                <section id="latest-news" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box" data-id="newsbox" style={fadeIn('newsbox')}>
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Stay Updated</div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.5px' }}>Latest News</h2>
                            <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: '0 auto', maxWidth: '480px', lineHeight: '1.6' }}>
                                Catch up on the latest announcements, events, and stories from the branch.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                            {news.map((n, i) => (
                                <div key={n.title} data-id={`news${i}`} className="news-card" style={fadeIn(`news${i}`, i * 0.08)}>
                                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', marginBottom: '16px' }}>
                                        <img
                                            src={n.img}
                                            alt={n.title}
                                            style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                                        />
                                        <div style={{
                                            position: 'absolute', top: '12px', left: '12px',
                                            background: '#DC2626', color: 'white',
                                            fontFamily: 'Source Sans 3, sans-serif', fontSize: '10.5px', fontWeight: '700',
                                            padding: '4px 11px', borderRadius: '100px', letterSpacing: '0.5px',
                                        }}>{n.date}</div>
                                    </div>
                                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111', textAlign: 'left', marginBottom: '8px', letterSpacing: '0.3px', lineHeight: '1.3' }}>{n.title}</h3>
                                    <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12.5px', color: '#999', lineHeight: '1.65', fontWeight: '300', textAlign: 'left', margin: '0 0 12px' }}>{n.excerpt}</p>
                                    <Link href={`/news/${n.slug}`} style={{
                                        fontFamily: 'Source Sans 3, sans-serif', fontSize: '12.5px', fontWeight: '600',
                                        color: '#DC2626', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    }}>Read More →</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── RECENT PROGRAMS ── */}
                <section id="recent-programs" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box" data-id="programsbox" style={fadeIn('programsbox')}>
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>What's Happening</div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.5px' }}>Recent Programs</h2>
                            <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: '0 auto', maxWidth: '480px', lineHeight: '1.6' }}>
                                A look at the latest activities and programs from the Philippine Red Cross Muntinlupa City Branch.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {services.map((s, i) => (
                                <div key={s.title} data-id={`sv${i}`} className="service-card" style={fadeIn(`sv${i}`, i * 0.08)}>
                                    <img
                                        src={s.img}
                                        alt={s.title}
                                        style={{
                                            width: '100%', height: '130px', objectFit: 'cover',
                                            borderRadius: '10px', marginBottom: '16px',
                                        }}
                                    />
                                    <div style={{ width: '40px', height: '3px', background: '#DC2626', margin: '0 auto 16px', borderRadius: '2px' }} />
                                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.4px' }}>{s.title}</h3>
                                    <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12.5px', color: '#999', lineHeight: '1.65', fontWeight: '300', margin: 0 }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA BANNER ── */}
                <section data-id="cta" style={{
                    padding: '60px 64px', textAlign: 'center',
                    background: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)',
                    position: 'relative', overflow: 'hidden',
                    ...fadeIn('cta'),
                }}>
                    <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '42px', color: 'white', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 14px', letterSpacing: '0.5px' }}>
                            Be A Volunteer Today
                        </h2>
                        <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.75)', fontWeight: '300', margin: '0 auto 32px', maxWidth: '480px', lineHeight: '1.75', fontStyle: 'italic' }}>
                            Your time and skills can save lives. Join the Philippine Red Cross Muntinlupa City Branch and be part of something greater.
                        </p>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <Link href={route('register')} style={{
                                background: 'white', color: '#DC2626', padding: '13px 36px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '700',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>Join Now</Link>
                            <Link href={route('about')} style={{
                                background: 'transparent', color: 'white', padding: '13px 36px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '600',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                border: '1px solid rgba(255,255,255,0.5)',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>Learn More</Link>
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

                {/* ── CALL CONFIRMATION MODAL ── */}
                {callModal && (
                    <div className="call-overlay" onClick={() => setCallModal(null)}>
                        <div className="call-modal" onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: '#fee2e2', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 18px',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                            </div>
                            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '19px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>
                                Would you like to call?
                            </div>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                {callModal.label}
                            </div>
                            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#DC2626', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '22px' }}>
                                {callModal.number}
                            </div>
                            <button className="call-btn-confirm" onClick={confirmCall}>Call Now</button>
                            <button className="call-btn-cancel" onClick={() => setCallModal(null)}>Cancel</button>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}