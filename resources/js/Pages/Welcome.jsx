import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Philippine Red Cross - Muntinlupa" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet" />

            <div style={{ fontFamily: "'Source Sans 3', sans-serif" }}>

                {/* NAVBAR */}
                <nav style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 48px', background: 'white',
                    borderBottom: '1px solid #f0f0f0',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                            width: '34px', height: '34px', background: '#DC2626',
                            borderRadius: '4px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '900'
                        }}>+</div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#111' }}>Rizal Chapter</strong>
                            <span style={{ display: 'block', fontSize: '10px', color: '#888' }}>Muntinlupa City Branch</span>
                        </div>
                    </Link>
                    <ul style={{ display: 'flex', alignItems: 'center', gap: '28px', listStyle: 'none', margin: 0, padding: 0 }}>
                        <li><Link href="/" style={{ color: '#555', textDecoration: 'none', fontSize: '13px' }}>Home</Link></li>
                        <li><a href="#about" style={{ color: '#555', textDecoration: 'none', fontSize: '13px' }}>About</a></li>
                        <li><a href="#contact" style={{ color: '#555', textDecoration: 'none', fontSize: '13px' }}>Contact</a></li>
                        <li>
                            <Link href={route('login')} style={{
                                background: '#DC2626', color: 'white', padding: '8px 18px',
                                borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                textDecoration: 'none'
                            }}>Log In</Link>
                        </li>
                    </ul>
                </nav>

                {/* HERO */}
                <section style={{
                    position: 'relative', minHeight: '600px', overflow: 'hidden',
                    background: '#1a1a1a', display: 'flex', alignItems: 'center'
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #7f1d1d 0%, #1a1a1a 60%)',
                        opacity: 0.9
                    }}></div>
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.05,
                        backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 40px)'
                    }}></div>
                    <div style={{
                        position: 'absolute', right: '-40px', top: '50%',
                        transform: 'translateY(-50%)', width: '500px', height: '500px',
                        border: '60px solid rgba(220,38,38,0.12)', borderRadius: '50%'
                    }}></div>
                    <div style={{
                        position: 'absolute', right: '60px', top: '50%',
                        transform: 'translateY(-50%)', width: '320px', height: '320px',
                        border: '1.5px solid rgba(220,38,38,0.25)', borderRadius: '50%'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 2, padding: '120px 48px 80px', maxWidth: '640px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)',
                            color: '#fca5a5', fontSize: '11px', fontWeight: '600',
                            letterSpacing: '2px', textTransform: 'uppercase',
                            padding: '6px 14px', borderRadius: '100px', marginBottom: '28px',
                        }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }}></span>
                            Volunteer Program 2026
                        </div>
                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '76px', lineHeight: '0.95', color: 'white',
                            letterSpacing: '1px', margin: '0 0 8px 0',
                            fontWeight: '700', textTransform: 'uppercase'
                        }}>
                            <span style={{ color: '#DC2626' }}>Red Cross</span><br />
                            Volunteer<br />
                            Needed
                        </h1>
                        <p style={{
                            fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.75',
                            maxWidth: '460px', fontWeight: '300',
                            margin: '24px 0 40px 0', fontStyle: 'italic'
                        }}>
                            Join the Philippine Red Cross – Muntinlupa City Branch and make a difference in your community through disaster response, blood services, and emergency care.
                        </p>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <a href="#about" style={{
                                background: '#DC2626', color: 'white', padding: '13px 30px',
                                borderRadius: '4px', fontSize: '14px', fontWeight: '600',
                                textDecoration: 'none', letterSpacing: '0.5px'
                            }}>Read More</a>
                            <Link href={route('register')} style={{
                                color: 'rgba(255,255,255,0.75)', fontSize: '14px',
                                textDecoration: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: '2px',
                                letterSpacing: '0.3px'
                            }}>Register Now →</Link>
                        </div>
                    </div>

                    <div style={{
                        position: 'absolute', bottom: '40px', right: '48px',
                        display: 'flex', gap: '40px', zIndex: 2
                    }}>
                        {[['500+', 'Volunteers'], ['24/7', 'Response'], ['10+', 'Programs']].map(([num, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontFamily: 'Oswald, sans-serif',
                                    fontSize: '38px', color: 'white',
                                    lineHeight: '1', fontWeight: '600'
                                }}>
                                    {num.includes('/') ? num : <>{num.replace('+', '')}<span style={{ color: '#DC2626' }}>+</span></>}
                                </div>
                                <div style={{
                                    fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                                    marginTop: '6px', letterSpacing: '1px',
                                    textTransform: 'uppercase'
                                }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ABOUT */}
                <section id="about" style={{
                    padding: '80px 48px', background: '#fff',
                    display: 'flex', gap: '80px', alignItems: 'center'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '11px', fontWeight: '600', letterSpacing: '2.5px',
                            textTransform: 'uppercase', color: '#DC2626', marginBottom: '14px'
                        }}>Who We Are</div>
                        <h2 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '42px', color: '#111', lineHeight: '1.05',
                            letterSpacing: '0.5px', marginBottom: '20px',
                            fontWeight: '600', textTransform: 'uppercase'
                        }}>
                            Serving Muntinlupa<br />Since Day One
                        </h2>
                        <div style={{ width: '40px', height: '2px', background: '#DC2626', marginBottom: '20px' }}></div>
                        <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.85', fontWeight: '300' }}>
                            The Philippine Red Cross – Muntinlupa City Chapter is committed to saving lives and serving our local community in times of need. Through disaster preparedness, emergency response, blood services, and volunteer programs, we provide timely care, support, and hope to the people of Muntinlupa.
                        </p>
                    </div>

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e8e8e8', border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden' }}>
                        {[
                            { title: 'Disaster Response', desc: 'Rapid deployment during calamities and emergencies across Muntinlupa.' },
                            { title: 'Blood Services', desc: 'Regular blood donation drives for patients in critical need.' },
                            { title: 'Emergency Care', desc: 'First aid and medical assistance for communities in need.' },
                            { title: 'Community Programs', desc: 'Training and outreach programs for Muntinlupa residents.' },
                        ].map(({ title, desc }) => (
                            <div key={title} style={{ background: '#fff', padding: '28px 24px', cursor: 'default' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                                <div style={{ width: '28px', height: '2px', background: '#DC2626', marginBottom: '14px' }}></div>
                                <div style={{
                                    fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: '600',
                                    color: '#111', marginBottom: '8px', letterSpacing: '0.3px', textTransform: 'uppercase'
                                }}>{title}</div>
                                <div style={{ fontSize: '13px', color: '#777', lineHeight: '1.65', fontWeight: '300' }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FOOTER */}
                <div style={{
                    background: '#0a0a0a', padding: '18px 48px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3px' }}>
                        © 2026 Philippine Red Cross – Muntinlupa City Branch. All rights reserved.
                    </span>
                </div>
            </div>
        </>
    );
}