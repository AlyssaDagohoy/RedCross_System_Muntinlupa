import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Donate({ auth }) {
    const [copied, setCopied] = useState(null);
    const [selectedTier, setSelectedTier] = useState(1);

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
            label: 'About Us', href: route('login'),
            children: [
                { label: 'Who We Are', href: route('login') + '#who-we-are' },
                { label: 'Mission & Vision', href: route('login') + '#mission-vision' },
                { label: 'Our Team', href: route('login') + '#our-team' },
                { label: 'Our Services', href: route('login') + '#our-services' },
            ]
        },
        {
            label: 'Volunteer', href: route('login'),
            children: [
                { label: 'Become a Volunteer', href: `${route('login')}#become` },
                { label: 'Red Cross 143 Program', href: `${route('login')}#program` },
                { label: 'Volunteer Service FAQs', href: `${route('login')}#faqs` },
            ]
        },
        {
            label: 'Contact Us', href: route('login'),
            children: [
                { label: 'Get in Touch', href: route('login') + '#get-in-touch' },
                { label: 'Find Us', href: route('login') + '#find-us' },
                { label: 'Emergency Hotlines', href: route('login') + '#emergency-hotlines' },
            ]
        },
    ];

    const impactTiers = [
        { amount: '₱500', label: 'Emergency Food Pack', desc: 'Feeds one displaced family for three days during a disaster response operation.' },
        { amount: '₱1,500', label: 'Hygiene & First Aid Kit', desc: 'Supplies a household with essential hygiene items and basic first aid materials.' },
        { amount: '₱3,000', label: 'Blood Screening Support', desc: 'Covers screening and processing for one safe, ready-to-transfuse blood unit.' },
        { amount: '₱7,500', label: 'Volunteer Deployment', desc: 'Equips and mobilizes a trained volunteer for a full disaster response shift.' },
    ];

    const waysToGive = [
        {
            title: 'Bank Transfer',
            desc: 'Deposit or transfer directly to our chapter account.',
            rows: [
                { key: 'bank', label: 'Bank', value: 'BDO Unibank' },
                { key: 'acctname', label: 'Account Name', value: 'Philippine Red Cross – Muntinlupa Chapter' },
                { key: 'acctnum', label: 'Account Number', value: '0012-3456-7890' },
            ],
        },
        {
            title: 'GCash',
            desc: 'Send your donation instantly through GCash.',
            rows: [
                { key: 'gcashname', label: 'Account Name', value: 'PRC Muntinlupa Chapter' },
                { key: 'gcashnum', label: 'Mobile Number', value: '0917 123 4567' },
            ],
        },
    ];

    return (
        <>
            <Head title="Donate - Philippine Red Cross Muntinlupa" />
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

                /* STAT CARDS */
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

                /* IMPACT TIER CARDS — signature element */
                .tier-card {
                    position: relative;
                    background: #fff3f3;
                    border-radius: 14px;
                    padding: 28px 22px;
                    text-align: left;
                    border: 2px solid #ffe2e2;
                    cursor: pointer;
                    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
                }
                .tier-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }
                .tier-card.selected {
                    background: linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%);
                    border-color: transparent;
                    box-shadow: 0 16px 36px rgba(220,38,38,0.24);
                }
                .tier-card .tier-amount {
                    font-family: 'Oswald, sans-serif'; font-size: 26px; font-weight: 700;
                    color: #DC2626; letter-spacing: 0.3px; margin-bottom: 10px;
                    transition: color 0.25s ease;
                }
                .tier-card.selected .tier-amount { color: white; }
                .tier-card .tier-label {
                    font-family: 'Oswald, sans-serif'; font-size: 13.5px; font-weight: 600;
                    color: #111; text-transform: uppercase; letter-spacing: 0.4px;
                    margin-bottom: 8px; transition: color 0.25s ease;
                }
                .tier-card.selected .tier-label { color: white; }
                .tier-card .tier-desc {
                    font-family: 'Source Sans 3, sans-serif'; font-size: 12.5px;
                    color: #999; line-height: 1.6; font-weight: 300;
                    transition: color 0.25s ease;
                }
                .tier-card.selected .tier-desc { color: rgba(255,255,255,0.85); }
                .tier-check {
                    position: absolute; top: 18px; right: 18px;
                    width: 20px; height: 20px; border-radius: 50%;
                    border: 2px solid #ffd4d4;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.25s ease;
                }
                .tier-card.selected .tier-check {
                    border-color: white; background: white;
                }

                /* WAYS TO GIVE CARDS */
                .give-card {
                    background: #fff3f3; border-radius: 14px;
                    padding: 32px 28px; text-align: left;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .give-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
                }

                .give-row {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 10px; padding: 10px 0;
                    border-bottom: 1px solid #ffe2e2;
                }
                .give-row:last-child { border-bottom: none; }

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

                .instore-card {
                    background: white; border-radius: 14px;
                    padding: 24px 20px; text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid #ffe2e2;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .instore-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 36px rgba(220,38,38,0.14);
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
                            <strong style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'white', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.6px' }}>
                                Scan<span style={{ color: '#fecaca' }}>2</span>Serve
                            </strong>
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

                        <li style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link href={route('donate')} className="donate-btn" style={{ background: 'rgba(0,0,0,0.18)', color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>DONATE NOW</Link>
                            <Link href={route('login')} className="login-btn">Log In</Link>
                        </li>
                    </ul>
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
                            Every Peso Reaches Someone
                        </div>
                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '30px', lineHeight: '1.1', color: 'white',
                            letterSpacing: '0.5px', margin: '0 0 8px 0',
                            fontWeight: '700', textTransform: 'uppercase'
                        }}>
                            Donate <span style={{ color: 'white' }}>Now</span>
                        </h1>
                        <p style={{
                            fontFamily: 'Source Sans 3, sans-serif',
                            fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6',
                            maxWidth: '460px', fontWeight: '300', fontStyle: 'italic', margin: 0,
                        }}>
                            Your gift funds real relief in Muntinlupa City — food packs, blood units, and volunteers on standby.
                        </p>
                    </div>
                </section>

                {/* ── WHY YOUR DONATION MATTERS ── */}
                <section id="why-give" style={{ padding: '40px 64px 20px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
                            <div style={{ flex: 1.1 }}>
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Why It Matters</div>
                                <h2 style={{
                                    fontFamily: 'Oswald, sans-serif', fontSize: '32px', color: '#111',
                                    lineHeight: '1.15', letterSpacing: '0.5px', marginBottom: '18px',
                                    fontWeight: '600', textTransform: 'uppercase'
                                }}>
                                    Donations Stay<br />In Muntinlupa
                                </h2>
                                <div style={{ width: '40px', height: '3px', background: '#DC2626', marginBottom: '18px', borderRadius: '2px' }}></div>
                                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#666', lineHeight: '1.8', fontWeight: '300' }}>
                                    Every donation made to the Rizal Chapter — Muntinlupa City Branch funds relief operations, blood services, and volunteer deployments right here in the city. No middle layer, no delay: your support moves directly into food packs, first aid kits, and trained hands on the ground.
                                </p>
                            </div>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                {[
                                    { value: '1,200+', label: 'Families Assisted' },
                                    { value: '340', label: 'Blood Units Collected' },
                                    { value: '85', label: 'Active Volunteers' },
                                    { value: '24/7', label: 'Emergency Response' },
                                ].map(({ value, label }) => (
                                    <div key={label} className="stat-card">
                                        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '26px', fontWeight: '700', color: '#DC2626', marginBottom: '6px' }}>{value}</div>
                                        <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── GIVE WITH IMPACT (signature tier selector) ── */}
                <section id="give-with-impact" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>See The Impact</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px'
                            }}>Give With Impact</h2>
                            <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#999', fontWeight: '300', margin: 0 }}>
                                Every amount funds something specific. Choose what you'd like to provide.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
                            {impactTiers.map((tier, idx) => (
                                <div
                                    key={tier.label}
                                    className={`tier-card${selectedTier === idx ? ' selected' : ''}`}
                                    onClick={() => setSelectedTier(idx)}
                                >
                                    <div className="tier-check">
                                        {selectedTier === idx && (
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="tier-amount">{tier.amount}</div>
                                    <div className="tier-label">{tier.label}</div>
                                    <div className="tier-desc">{tier.desc}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <a href="#ways-to-give" style={{
                                display: 'inline-block',
                                background: '#DC2626', color: 'white', padding: '13px 40px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '700',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>
                                Give {impactTiers[selectedTier].amount} Now
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── WAYS TO GIVE ── */}
                <section id="ways-to-give" style={{ padding: '20px 64px 40px', scrollMarginTop: '96px' }}>
                    <div className="section-box">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                            <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: '#DC2626', marginBottom: '10px' }}>Choose A Method</div>
                            <h2 style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#111',
                                fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0
                            }}>Ways To Give</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            {waysToGive.map((way) => (
                                <div key={way.title} className="give-card">
                                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{way.title}</div>
                                    <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12.5px', color: '#999', lineHeight: '1.6', fontWeight: '300', margin: '0 0 16px' }}>{way.desc}</p>
                                    <div>
                                        {way.rows.map(row => (
                                            <div key={row.key} className="give-row">
                                                <div>
                                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '10.5px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{row.label}</div>
                                                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '13px', color: '#444' }}>{row.value}</div>
                                                </div>
                                                <button onClick={() => handleCopy(row.value, row.key)} className={`copy-btn${copied === row.key ? ' copied' : ''}`}>
                                                    {copied === row.key ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div className="instore-card">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>In Person</div>
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: '#999', lineHeight: '1.6', fontWeight: '300' }}>
                                    Drop off your donation at the Muntinlupa City Hall Compound, Mon–Fri, 8AM–5PM.
                                </div>
                            </div>
                            <div className="instore-card">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', fontWeight: '600', color: '#111', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>Donate Blood Instead</div>
                                <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: '#999', lineHeight: '1.6', fontWeight: '300' }}>
                                    Can't give financially? Donating blood is just as vital — check our upcoming drives.
                                </div>
                            </div>
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
                        <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '14px' }}>Prefer To Give Time?</div>
                        <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '38px', color: 'white', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 28px', letterSpacing: '0.5px' }}>
                            Be A Volunteer Instead
                        </h2>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <Link href={`${route('login')}#become`} style={{
                                background: 'white', color: '#DC2626', padding: '13px 36px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '700',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>Join Us</Link>
                            <Link href={route('login')} style={{
                                background: 'transparent', color: 'white', padding: '13px 36px',
                                borderRadius: '4px', fontSize: '13px', fontWeight: '600',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                border: '1px solid rgba(255,255,255,0.5)',
                                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                            }}>Contact Us</Link>
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
