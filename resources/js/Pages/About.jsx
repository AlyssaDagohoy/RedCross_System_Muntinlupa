import { Head, Link } from '@inertiajs/react';

export default function About({ auth }) {
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
                { label: 'Who We Are', href: '#who-we-are' },
                { label: 'Mission & Vision', href: '#mission-vision' },
                { label: 'Our Team', href: '#our-team' },
                { label: 'Our Services', href: '#our-services' },
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

    return (
        <>
            <Head title="About - Philippine Red Cross Muntinlupa" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                }

                /* NAV */
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

                /* SECTION BOX WRAPPER — same as Welcome */
                .section-box {
                    background: white;
                    border-radius: 24px;
                    padding: 44px 40px;
                    max-width: 1140px;
                    margin: 0 auto;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                    border: 1px solid #f5f5f5;
                }

                /* CARDS — same tones as Welcome */
                .stat-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 26px 20px; text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
                .service-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 30px 24px; text-align: left;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .service-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
                .team-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 28px 20px; text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .team-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }

                /* PHOTO-ONLY CARDS — stat */
                .stat-card-photo {
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    aspect-ratio: 1 / 1;
                }
                .stat-card-photo:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
                .stat-card-photo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                /* SERVICE CARD IMAGE — image + text combo */
                .service-card-img {
                    width: 100%;
                    height: 140px;
                    border-radius: 10px;
                    object-fit: cover;
                    display: block;
                    margin-bottom: 16px;
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
                        {navItems.map((item, idx) => (
                            <li key={item.label} className="nav-item">
                                <span className={`nav-link${idx === 1 ? ' active' : ''}`}>
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

                {/* ── HERO BANNER ── */}
                <section style={{
                    position: 'relative', overflow: 'hidden',
                    backgroundImage: 'url("https://staging.imanilahost.com/redcross/wp-content/themes/yootheme/cache/banner_inner-1966008c.jpeg")',
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
                            Philippine Red Cross — Muntinlupa
                        </div>
                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '30px', lineHeight: '1.1', color: 'white',
                            letterSpacing: '0.5px', margin: '0 0 8px 0',
                            fontWeight: '700', textTransform: 'uppercase'
                        }}>
                            About <span style={{ color: 'white' }}>Us</span>
                        </h1>
                        <p style={{
                            fontFamily: 'Source Sans 3, sans-serif',
                            fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6',
                            maxWidth: '460px', fontWeight: '300', fontStyle: 'italic', margin: 0,
                        }}>
                            Dedicated to humanitarian service, disaster response, and building resilient communities across Muntinlupa City.
                        </p>
                    </div>
                </section>

                {/* ── WHO WE ARE ── */}
                <section id="who-we-are" style={{ padding: '40px 64px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
                            <div style={{ flex: 1.2 }}>
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Who We Are</div>
                                <h2 style={{
                                    fontFamily: 'Oswald, sans-serif', fontSize: '34px', color: '#111',
                                    lineHeight: '1.1', letterSpacing: '0.5px', marginBottom: '18px',
                                    fontWeight: '600', textTransform: 'uppercase'
                                }}>
                                    Serving Muntinlupa<br />Since Day One
                                </h2>
                                <div style={{ width: '40px', height: '3px', background: '#DC2626', marginBottom: '18px', borderRadius: '2px' }}></div>
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#666', lineHeight: '1.8', fontWeight: '300', marginBottom: '14px' }}>
                                    The Philippine Red Cross – Muntinlupa City Chapter is committed to saving lives and serving our local community in times of need. Through disaster preparedness, emergency response, blood services, and volunteer programs, we provide timely care, support, and hope to the people of Muntinlupa.
                                </p>
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#666', lineHeight: '1.8', fontWeight: '300' }}>
                                    As part of the world's largest humanitarian network, we uphold the seven fundamental principles of the Red Cross: Humanity, Impartiality, Neutrality, Independence, Voluntary Service, Unity, and Universality.
                                </p>
                            </div>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                {[
                                    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpABhKwZ-be0E-78kbb5YjkoSCCjSHIFMkzGAlCNKw9kKTLfZbeOro3nxG&s=10', label: 'Active Volunteers' },
                                    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1yiSzm1mGUER1pPWATYSwj4nkbKbleoVt2HmIjjI4jxtRsk5-EEOo2K-q&s=10', label: 'Emergency Response' },
                                    { img: 'https://capitalonecareers.com.ph/img/capital-one-philippines%20ties-up-with-red-cross.jpg', label: 'Active Programs' },
                                    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmexJILTBS5OWYo4tJlfAyaw9GMk3A1-Tm83YdIZZl8cSMp2iU7t8EXj8&s=10', label: 'Year Established' },
                                ].map(({ img, label }) => (
                                    <div key={label} className="stat-card-photo">
                                        <img src={img} alt={label} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── MISSION & VISION ── */}
                <section id="mission-vision" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Our Purpose</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0
                            }}>Mission & Vision</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)',
                                borderRadius: '14px', padding: '36px 32px',
                            }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', color: 'white', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Our Mission</div>
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.8', fontWeight: '300', margin: 0 }}>
                                    To provide timely, effective, and compassionate humanitarian assistance to vulnerable communities in Muntinlupa City, empowering individuals and families through disaster preparedness, emergency response, health services, and volunteer development.
                                </p>
                            </div>
                            <div className="stat-card" style={{ padding: '36px 32px', textAlign: 'left' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', color: '#111', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Our Vision</div>
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13.5px', color: '#666', lineHeight: '1.8', fontWeight: '300', margin: 0 }}>
                                    A resilient Muntinlupa City where every individual has access to humanitarian services, communities are prepared for any emergency, and volunteers are empowered to serve with excellence and compassion.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── OUR SERVICES ── */}
                <section id="our-services" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>What We Do</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0
                            }}>Our Services</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {[
                                { title: 'Disaster Response', desc: 'Rapid deployment during calamities and emergencies across Muntinlupa. Our trained teams are ready 24/7.', img: 'https://mb.com.ph/manilabulletin/uploads/images/2025/09/21/44421.webp' },
                                { title: 'Blood Services', desc: 'Regular blood donation drives for patients in critical need. Every drop counts in saving lives.', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-f4RgYGMdI7i0Qma4h4Uwc2WDMNZiuVnvcO62ORPEBeYqwo-dIBpyIs&s=10' },
                                { title: 'Emergency Care', desc: 'First aid and medical assistance for communities in need. Trained volunteers available around the clock.', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaKNOxy-259EulxTCnvy3OEHXGSHf9uVpOVC8UGClfBw&s=10' },
                                { title: 'Community Programs', desc: 'Training and outreach programs for Muntinlupa residents to build stronger, more resilient communities.', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSA5eZR0qGMXeTrd3gLQ3_5Gu19QrqHw1d3i_ET6HZT4ahR34GNNuyKOPE&s=10' },
                            ].map(({ title, desc, img }) => (
                                <div key={title} className="service-card">
                                    <img src={img} alt={title} className="service-card-img" />
                                    <div style={{
                                        fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: '600',
                                        color: '#111', marginBottom: '10px', letterSpacing: '0.3px',
                                        textTransform: 'uppercase'
                                    }}>{title}</div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12.5px', color: '#999', lineHeight: '1.65', fontWeight: '300' }}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── OUR TEAM ── */}
                <section id="our-team" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>The People Behind It</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px'
                            }}>Our Team</h2>
                            <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: 0 }}>
                                Dedicated individuals who make our mission possible every day.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {[
                                { name: 'Chapter Administrator', role: 'Leadership & Operations', initials: 'CA' },
                                { name: 'Disaster Response Officer', role: 'Emergency Deployment', initials: 'DR' },
                                { name: 'Blood Services Coordinator', role: 'Donation Drives', initials: 'BS' },
                                { name: 'Volunteer Manager', role: 'Volunteer Development', initials: 'VM' },
                            ].map(({ name, role, initials }) => (
                                <div key={name} className="team-card">
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: '#DC2626', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'Oswald, sans-serif', fontSize: '17px', fontWeight: '600',
                                        margin: '0 auto 16px', letterSpacing: '1px'
                                    }}>{initials}</div>
                                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '6px' }}>{name}</div>
                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11.5px', color: '#DC2626', fontWeight: '600', letterSpacing: '0.5px' }}>{role}</div>
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