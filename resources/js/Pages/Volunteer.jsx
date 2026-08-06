import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Volunteer({ auth }) {
    const [visible, setVisible] = useState({});
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                setVisible(v => ({ ...v, [e.target.dataset.id]: e.isIntersecting }));
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('[data-id]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const fadeIn = (id, delay = 0) => ({
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        opacity: visible[id] ? 1 : 0,
        transform: visible[id] ? 'translateY(0)' : 'translateY(24px)',
    });

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

    const steps = [
        { num: '01', title: 'Register Online', desc: 'Create your volunteer account and fill out the application form with your basic information.' },
        { num: '02', title: 'Attend Orientation', desc: 'Join a scheduled orientation session to learn about Red Cross values, safety protocols, and volunteer conduct.' },
        { num: '03', title: 'Complete Training', desc: 'Finish the required Basic Life Support and First Aid modules under the Red Cross 143 curriculum.' },
        { num: '04', title: 'Get Deployed', desc: 'Once certified, you\u2019ll be assigned to activities, blood drives, or disaster response operations based on availability.' },
    ];

    const programPillars = [
        { title: 'Community Outreach', desc: 'Volunteers assist in barangay-level health missions, blood donation drives, and awareness campaigns.' },
        { title: 'Disaster Response', desc: 'Trained members are deployed for relief distribution, evacuation support, and emergency logistics during calamities.' },
        { title: 'First Aid & BLS', desc: 'Every 143 volunteer completes certified Basic Life Support and First Aid training before active deployment.' },
        { title: 'Youth Leadership', desc: 'Young volunteers are given leadership roles in planning and running local Red Cross initiatives.' },
    ];

    const faqs = [
        { q: 'Who can become a volunteer?', a: 'Any Filipino citizen aged 18 and above who is physically fit and willing to undergo training can apply. Minors may join youth programs with parental consent.' },
        { q: 'Is there a fee to join?', a: 'No. Membership and training under the Red Cross 143 Program are free. Some optional certifications may have minimal fees covered by the branch.' },
        { q: 'How much time do I need to commit?', a: 'Volunteers can choose their availability. Some serve a few hours a month, while active responders may be called during emergencies or scheduled activities.' },
        { q: 'Do I need prior medical training?', a: 'No prior experience is required. Basic Life Support and First Aid training are provided as part of the onboarding process.' },
        { q: 'What happens after I register online?', a: 'Your application will be reviewed by the branch. Once approved, you\u2019ll receive a schedule for orientation and initial training sessions.' },
    ];

    return (
        <>
            <Head title="Volunteer - Philippine Red Cross Muntinlupa" />
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

                .step-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 26px 22px; text-align: left;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .step-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }

                .pillar-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 24px 22px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    border-left: 3px solid #DC2626;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .pillar-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }

                .faq-item {
                    border-bottom: 1px solid #f0e0e0;
                }
                .faq-item:last-child { border-bottom: none; }
                .faq-question {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 20px 4px; cursor: pointer;
                    font-family: 'Oswald, sans-serif';
                    font-size: 15.5px; font-weight: 500; color: #111;
                    letter-spacing: 0.2px;
                }
                .faq-icon {
                    flex-shrink: 0; margin-left: 16px;
                    transition: transform 0.25s ease;
                    color: #DC2626;
                }
                .faq-icon.open { transform: rotate(45deg); }
                .faq-answer {
                    max-height: 0; overflow: hidden;
                    transition: max-height 0.3s ease, padding 0.3s ease;
                    font-family: 'Source Sans 3, sans-serif';
                    font-size: 13.5px; color: #888; line-height: 1.75; font-weight: 300;
                    padding: 0 4px;
                }
                .faq-answer.open { max-height: 220px; padding: 0 4px 20px; }

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
            `}</style>

            <div>
                {/* ── NAVBAR ── */}
                <nav style={{
                    position: 'fixed', top: '16px', left: '24px', right: '24px', zIndex: 100,
                    background: '#DC2626', height: '64px', borderRadius: '100px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px 0 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', flexShrink: 0 }}>
                        <div style={{
                            width: '36px', height: '36px', background: 'white', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#DC2626', fontSize: '20px', fontWeight: '900', flexShrink: 0,
                        }}>+</div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'white', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.6px' }}>RIZAL CHAPTER</strong>
                            <span style={{ display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.72)', fontFamily: 'Source Sans 3, sans-serif', fontWeight: '300' }}>Muntinlupa City Branch</span>
                        </div>
                    </Link>

                    <ul style={{ display: 'flex', alignItems: 'center', listStyle: 'none', height: '64px', gap: '0', margin: '0 0 0 auto', padding: 0 }}>
                        {navItems.map((item) => (
                            <li key={item.label} className="nav-item">
                                <span className={`nav-link${item.label === 'Volunteer' ? ' active' : ''}`}>
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

                {/* ── HERO ── */}
                <section style={{ padding: '140px 64px 60px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
                        color: '#DC2626', fontSize: '11px', fontWeight: '600',
                        letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '6px 16px', borderRadius: '100px', marginBottom: '24px',
                        fontFamily: 'Source Sans 3, sans-serif',
                    }}>
                        Join the Movement
                    </div>
                    <h1 style={{
                        fontFamily: 'Oswald, sans-serif', fontSize: '46px', color: '#1a1a1a',
                        fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase',
                        margin: '0 0 16px',
                    }}>
                        <span style={{ color: '#DC2626' }}>Volunteer</span> With Us
                    </h1>
                    <p style={{
                        fontFamily: 'Source Sans 3, sans-serif', fontSize: '15px', color: '#666',
                        fontWeight: '300', maxWidth: '560px', margin: '0 auto', lineHeight: '1.8',
                    }}>
                        Whether it's your first time or you've served for years, there's a place for you at the
                        Philippine Red Cross – Muntinlupa City Branch. Here's everything you need to know to get started.
                    </p>
                </section>

                {/* ── BECOME A VOLUNTEER ── */}
                <section id="become" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box" data-id="become-box" style={fadeIn('become-box')}>
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Get Started</div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '32px', color: '#111', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.5px' }}>Become a Volunteer</h2>
                            <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: '0 auto', maxWidth: '520px', lineHeight: '1.7' }}>
                                Becoming a Red Cross volunteer takes four simple steps, from registration to your first deployment.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
                            {steps.map((s, i) => (
                                <div key={s.num} data-id={`step${i}`} className="step-card" style={fadeIn(`step${i}`, i * 0.08)}>
                                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '26px', fontWeight: '700', color: '#DC2626', marginBottom: '10px' }}>{s.num}</div>
                                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '8px', letterSpacing: '0.3px' }}>{s.title}</h3>
                                    <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12.5px', color: '#999', lineHeight: '1.65', fontWeight: '300', margin: 0 }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Link href={route('register')} style={{
                                background: '#DC2626', color: 'white', padding: '13px 34px',
                                borderRadius: '100px', fontSize: '14px', fontWeight: '600',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                fontFamily: 'Source Sans 3, sans-serif', display: 'inline-block',
                            }}>Register as a Volunteer →</Link>
                        </div>
                    </div>
                </section>

                {/* ── RED CROSS 143 PROGRAM ── */}
                <section id="program" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box" data-id="program-box" style={fadeIn('program-box')}>
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Our Flagship Program</div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '32px', color: '#111', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.5px' }}>Red Cross 143 Program</h2>
                            <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: '0 auto', maxWidth: '560px', lineHeight: '1.7' }}>
                                Red Cross 143 is the national volunteer network that trains everyday Filipinos to respond to
                                emergencies in their own communities — one volunteer per 143 households.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {programPillars.map((p, i) => (
                                <div key={p.title} data-id={`pillar${i}`} className="pillar-card" style={fadeIn(`pillar${i}`, i * 0.08)}>
                                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111', marginBottom: '8px', letterSpacing: '0.3px' }}>{p.title}</h3>
                                    <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#999', lineHeight: '1.7', fontWeight: '300', margin: 0 }}>{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── VOLUNTEER SERVICE FAQS ── */}
                <section id="faqs" style={{ padding: '20px 64px 60px', scrollMarginTop: '96px' }}>
                    <div className="section-box" data-id="faq-box" style={{ maxWidth: '760px', ...fadeIn('faq-box') }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Questions?</div>
                            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '32px', color: '#111', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.5px' }}>Volunteer Service FAQs</h2>
                        </div>

                        <div>
                            {faqs.map((f, i) => {
                                const isOpen = openFaq === i;
                                return (
                                    <div key={f.q} className="faq-item">
                                        <div className="faq-question" onClick={() => setOpenFaq(isOpen ? null : i)}>
                                            <span>{f.q}</span>
                                            <svg className={`faq-icon${isOpen ? ' open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </div>
                                        <div className={`faq-answer${isOpen ? ' open' : ''}`}>{f.a}</div>
                                    </div>
                                );
                            })}
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