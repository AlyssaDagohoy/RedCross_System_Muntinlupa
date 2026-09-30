import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function About({ auth }) {
    const navItems = [
        {
            label: 'Home', href: '/',
            children: [
                { label: 'Welcome', href: '/' },
            ]
        },
        {
            label: 'About Us', href: route('about'),
            children: [
                { label: 'Mission & Vision', href: '#mission-vision' },
                { label: 'Milestones & Impact', href: '#impact' },
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

    // ── MISSION / VISION TOGGLE (unchanged) ──
    const [mvTab, setMvTab] = useState('mission');
    const mvContent = {
        mission: {
            label: 'Our Mission',
            body: "To provide timely, effective, and compassionate humanitarian assistance to vulnerable communities in Muntinlupa City, empowering individuals and families through disaster preparedness, emergency response, health services, and volunteer development.",
        },
        vision: {
            label: 'Our Vision',
            body: "A resilient Muntinlupa City where every individual has access to humanitarian services, communities are prepared for any emergency, and volunteers are empowered to serve with excellence and compassion.",
        },
    };

    // ── MILESTONES & IMPACT ──
    const impactStats = [
        { num: '500+', label: 'Active Volunteers' },
        { num: '50+', label: 'Relief Operations' },
        { num: '10,000+', label: 'Lives Assisted' },
        { num: '15+', label: 'Years of Service' },
    ];

    const milestones = [
        { year: '1947', title: 'Philippine Red Cross Founded', desc: 'The national organization is established, laying the foundation for humanitarian service across the country.' },
        { year: '2005', title: 'Rizal Chapter – Muntinlupa Branch Opens', desc: 'A dedicated branch is established to serve Muntinlupa City, growing local volunteer capacity from day one.' },
        { year: '2013', title: 'Major Disaster Relief Operations', desc: 'Chapter volunteers mobilize for large-scale disaster response, delivering relief goods and emergency assistance to affected families.' },
        { year: '2020', title: 'COVID-19 Community Response', desc: 'Blood donation drives, sanitation support, and welfare assistance continue uninterrupted throughout the pandemic.' },
        { year: '2024', title: '500+ Active Volunteers', desc: 'The chapter reaches a new milestone in volunteer growth, strengthening its capacity to serve Muntinlupa City.' },
    ];

    // ── SCROLL REVEAL ──
    const [revealed, setRevealed] = useState({});
    const revealRefs = useRef([]);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('data-reveal-id');
                        setRevealed((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
        );
        revealRefs.current.forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, []);
    const registerReveal = (id) => (el) => {
        if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
    };
    const revealClass = (id, extra = '') =>
        `scroll-reveal ${revealed[id] ? 'is-revealed' : ''} ${extra}`.trim();

    return (
        <>
            <Head title="About - Philippine Red Cross Muntinlupa">
                <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Source Sans 3', sans-serif;
                    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                    background-attachment: fixed;
                }

                /* ── NAVBAR ── */
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

                .nav-auth { display: flex; align-items: center; gap: 8px; }
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

                /* ── SCROLL REVEAL ── */
                .scroll-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
                .scroll-reveal.is-revealed { opacity: 1; transform: translateY(0); }

                /* ── MISSION / VISION TOGGLE PANEL (unchanged) ── */
                .mv-section { padding: 140px 64px 20px; }
                .mv-top { max-width: 560px; margin: 0 auto 32px; text-align: center; }
                .section-eyebrow {
                    font-family: 'Source Sans 3', sans-serif; font-size: 11px; font-weight: 700;
                    letter-spacing: 3px; text-transform: uppercase; color: #DC2626; margin-bottom: 10px;
                }
                .section-heading {
                    font-family: 'Oswald', sans-serif; font-size: 28px; color: #1a1a1a; font-weight: 700;
                    text-transform: uppercase; margin: 0 0 8px; letter-spacing: 0.3px;
                    position: relative; display: inline-block;
                }
                .section-heading-underline {
                    position: absolute; left: 0; bottom: -8px; width: 100%; height: 10px;
                }
                .section-text {
                    font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;
                    font-weight: 300; line-height: 1.7; margin: 14px auto 0;
                }

                .mv-panel-wrap { max-width: 880px; margin: 0 auto; }
                .mv-tabs { display: flex; justify-content: center; gap: 8px; margin-bottom: -1px; position: relative; z-index: 2; }
                .mv-tab-btn {
                    font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 600;
                    letter-spacing: 0.5px; text-transform: uppercase;
                    color: #b45454; background: white;
                    border: 1px solid #ffe2e2; border-bottom: none;
                    padding: 14px 32px; border-radius: 14px 14px 0 0;
                    cursor: pointer; transition: color 0.2s, background 0.2s;
                }
                .mv-tab-btn.is-active { color: white; background: #DC2626; border-color: #DC2626; }
                .mv-panel {
                    background: white; border-radius: 24px;
                    border: 1px solid #ffe2e2;
                    box-shadow: 0 20px 50px rgba(127,29,29,0.1);
                    padding: 48px 56px;
                    position: relative; overflow: hidden;
                }
                .mv-panel::before {
                    content: '';
                    position: absolute; top: -80px; right: -80px;
                    width: 220px; height: 220px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(220,38,38,0.06) 0%, rgba(220,38,38,0) 70%);
                }
                .mv-panel-label {
                    font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 600;
                    color: #DC2626; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;
                    position: relative; z-index: 1;
                }
                .mv-panel-body {
                    font-family: 'Source Sans 3', sans-serif; font-size: 15px; color: #555;
                    line-height: 1.85; font-weight: 300; max-width: 620px;
                    position: relative; z-index: 1;
                }

                @media (max-width: 640px) {
                    .mv-section { padding: 116px 24px 8px; }
                    .mv-panel { padding: 32px 28px; }
                    .mv-tab-btn { padding: 12px 20px; font-size: 12px; }
                }

                /* ── MILESTONES & IMPACT — redesigned ── */
                .impact-section { padding: 72px 64px 96px; position: relative; overflow: hidden; }
                .impact-section::before {
                    content: '';
                    position: absolute; top: -160px; left: -140px;
                    width: 420px; height: 420px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(220,38,38,0.06) 0%, rgba(220,38,38,0) 70%);
                    pointer-events: none;
                }
                .impact-section::after {
                    content: '';
                    position: absolute; bottom: -180px; right: -160px;
                    width: 460px; height: 460px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(220,38,38,0.05) 0%, rgba(220,38,38,0) 70%);
                    pointer-events: none;
                }
                .impact-top { max-width: 620px; margin: 0 auto 52px; text-align: center; position: relative; z-index: 1; }

                .impact-stats-banner {
                    position: relative; z-index: 1;
                    max-width: 980px; margin: 0 auto 96px;
                    background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
                    border-radius: 20px;
                    padding: 36px 24px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 20px 44px rgba(127,29,29,0.24);
                }
                .impact-stat-block { flex: 1 1 0; text-align: center; padding: 0 20px; position: relative; }
                .impact-stat-block:not(:last-child)::after {
                    content: '';
                    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
                    width: 1px; height: 44px; background: rgba(255,255,255,0.2);
                }
                .impact-stat-num {
                    font-family: 'Oswald', sans-serif; font-size: 38px; font-weight: 700;
                    color: white; letter-spacing: 0.3px; line-height: 1;
                }
                .impact-stat-label {
                    font-family: 'Source Sans 3', sans-serif; font-size: 11px; color: rgba(255,255,255,0.75);
                    font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 10px;
                }
                @media (max-width: 900px) {
                    .impact-stats-banner { flex-wrap: wrap; gap: 24px 0; padding: 28px 16px; }
                    .impact-stat-block { flex: 1 1 45%; padding: 8px 12px; }
                    .impact-stat-block:not(:last-child)::after { display: none; }
                }

                .impact-timeline-editorial { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; }
                .impact-timeline-editorial::before {
                    content: '';
                    position: absolute; top: 0; bottom: 0; left: 50%;
                    width: 2px; transform: translateX(-50%);
                    background: linear-gradient(180deg, rgba(220,38,38,0) 0%, #ffd4d4 6%, #ffd4d4 94%, rgba(220,38,38,0) 100%);
                }
                .impact-node { position: relative; display: flex; align-items: center; width: 100%; padding: 36px 0; }
                .impact-node.is-left { justify-content: flex-start; }
                .impact-node.is-right { justify-content: flex-end; }
                .impact-node-dot {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    width: 12px; height: 12px; border-radius: 50%;
                    background: #DC2626; border: 3px solid white;
                    box-shadow: 0 0 0 4px #ffd4d4; z-index: 2;
                }
                .impact-node-content { width: calc(50% - 40px); position: relative; }
                .impact-node-ghost-year {
                    font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 64px; line-height: 1;
                    color: transparent; -webkit-text-stroke: 1px #ffd4d4;
                    position: absolute; top: -30px; letter-spacing: 1px;
                    pointer-events: none; user-select: none; z-index: 0;
                }
                .impact-node.is-left .impact-node-ghost-year { right: 0; text-align: right; }
                .impact-node.is-right .impact-node-ghost-year { left: 0; text-align: left; }

                .impact-node-card {
                    position: relative; z-index: 1;
                    background: white; border: 1px solid #ffe2e2; border-radius: 18px;
                    padding: 22px 26px;
                    box-shadow: 0 14px 34px rgba(127,29,29,0.08);
                    transition: transform 0.25s, box-shadow 0.25s;
                }
                .impact-node-card:hover { transform: translateY(-3px); box-shadow: 0 20px 44px rgba(127,29,29,0.14); }
                .impact-node.is-left .impact-node-card { margin-right: 40px; text-align: right; }
                .impact-node.is-right .impact-node-card { margin-left: 40px; text-align: left; }

                .impact-node-year { font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 700; color: #DC2626; letter-spacing: 1px; margin-bottom: 6px; }
                .impact-node-title { font-family: 'Oswald', sans-serif; font-size: 16.5px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.2px; margin-bottom: 8px; }
                .impact-node-desc { font-family: 'Source Sans 3', sans-serif; font-size: 13.5px; color: #777; line-height: 1.7; font-weight: 300; }

                @media (max-width: 760px) {
                    .impact-timeline-editorial::before { left: 20px; }
                    .impact-node, .impact-node.is-left, .impact-node.is-right { justify-content: flex-start; padding-left: 44px; }
                    .impact-node-dot { left: 20px; }
                    .impact-node-content { width: 100%; }
                    .impact-node.is-left .impact-node-card, .impact-node.is-right .impact-node-card { margin: 0; text-align: left; }
                    .impact-node-ghost-year { display: none; }
                }

                .site-footer {
                    background: linear-gradient(135deg, #b91c1c 0%, #b91c1c 100%);
                    color: rgba(255,255,255,0.75);
                    text-align: center;
                    font-family: 'Source Sans 3', sans-serif;
                    font-size: 12.5px; font-weight: 300; letter-spacing: 0.3px;
                    padding: 18px 24px;
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
                        {navItems.map((item) => (
                            <li key={item.label} className="nav-item-red">
                                <Link
                                    href={item.href}
                                    className={`nav-link-red${item.label === 'About Us' ? ' active' : ''}`}
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

                {/* ── MISSION & VISION (unchanged) ── */}
                <section id="mission-vision" className="mv-section" style={{ scrollMarginTop: '96px' }}>
                    <div
                        ref={registerReveal('mv-top')}
                        data-reveal-id="mv-top"
                        className={revealClass('mv-top', 'mv-top')}
                    >
                        <div className="section-eyebrow">Our Purpose</div>
                        <h2 className="section-heading">
                            Mission &amp; Vision
                            <svg className="section-heading-underline" viewBox="0 0 260 14" preserveAspectRatio="none">
                                <path d="M2 9 C 40 3, 90 3, 130 7 S 220 12, 258 6" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
                            </svg>
                        </h2>
                    </div>

                    <div
                        ref={registerReveal('mv-panel')}
                        data-reveal-id="mv-panel"
                        className={revealClass('mv-panel', 'mv-panel-wrap')}
                    >
                        <div className="mv-tabs">
                            <button
                                type="button"
                                className={`mv-tab-btn${mvTab === 'mission' ? ' is-active' : ''}`}
                                onClick={() => setMvTab('mission')}
                            >
                                Mission
                            </button>
                            <button
                                type="button"
                                className={`mv-tab-btn${mvTab === 'vision' ? ' is-active' : ''}`}
                                onClick={() => setMvTab('vision')}
                            >
                                Vision
                            </button>
                        </div>
                        <div className="mv-panel">
                            <div className="mv-panel-label">{mvContent[mvTab].label}</div>
                            <p className="mv-panel-body">{mvContent[mvTab].body}</p>
                        </div>
                    </div>
                </section>

                {/* ── MILESTONES & IMPACT — redesigned ── */}
                <section id="impact" className="impact-section" style={{ scrollMarginTop: '96px' }}>
                    <div
                        ref={registerReveal('impact-top')}
                        data-reveal-id="impact-top"
                        className={revealClass('impact-top', 'impact-top')}
                    >
                        <div className="section-eyebrow">Our Journey</div>
                        <h2 className="section-heading">
                            Milestones &amp; Impact
                            <svg className="section-heading-underline" viewBox="0 0 260 14" preserveAspectRatio="none">
                                <path d="M2 9 C 40 3, 90 3, 130 7 S 220 12, 258 6" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
                            </svg>
                        </h2>
                        <p className="section-text">
                            Years of service, response, and community impact across Muntinlupa City.
                        </p>
                    </div>

                    <div
                        ref={registerReveal('impact-stats')}
                        data-reveal-id="impact-stats"
                        className={revealClass('impact-stats', 'impact-stats-banner')}
                    >
                        {impactStats.map((stat) => (
                            <div key={stat.label} className="impact-stat-block">
                                <div className="impact-stat-num">{stat.num}</div>
                                <div className="impact-stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="impact-timeline-editorial">
                        {milestones.map((m, idx) => {
                            const side = idx % 2 === 0 ? 'is-left' : 'is-right';
                            return (
                                <div
                                    key={m.year}
                                    ref={registerReveal(`impact-ms-${idx}`)}
                                    data-reveal-id={`impact-ms-${idx}`}
                                    className={revealClass(`impact-ms-${idx}`, `impact-node ${side}`)}
                                >
                                    <div className="impact-node-dot" />
                                    <div className="impact-node-content">
                                        <div className="impact-node-ghost-year">{m.year}</div>
                                        <div className="impact-node-card">
                                            <div className="impact-node-year">{m.year}</div>
                                            <h3 className="impact-node-title">{m.title}</h3>
                                            <p className="impact-node-desc">{m.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="site-footer">
                    © 2026 Philippine Red Cross – Rizal Chapter, Muntinlupa City Branch. All rights reserved.
                </footer>

            </div>
        </>
    );
}
