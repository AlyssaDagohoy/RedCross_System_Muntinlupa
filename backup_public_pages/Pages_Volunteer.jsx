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
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                }

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
                        {navItems.map((item) => (
                            <li key={item.label} className="nav-item-red">
                                <Link
                                    href={item.href}
                                    className={`nav-link-red${item.label === 'Volunteer' ? ' active' : ''}`}
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
