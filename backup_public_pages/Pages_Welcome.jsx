import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function Welcome({ auth }) {
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
                { label: 'Who We Are', href: route('about') },
                { label: 'Mission & Vision', href: route('about') },
                { label: 'Our Team', href: route('about') },
                { label: 'Milestones & Impact', href: `${route('about')}#impact` },
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

    // ── LOGIN STEPS STRIP ──
    const loginSteps = [
        { label: 'Register / Log In with Email', icon: 'mail' },
        { label: 'Wait for Admin Confirmation', icon: 'clock' },
        { label: 'Access Your Portal', icon: 'check' },
    ];

    const featureIcon = (type) => {
        switch (type) {
            case 'mail':
                return <path d="M4 6h16v12H4z M4 6l8 7 8-7" />;
            case 'scan':
                return <path d="M4.5 9V7.2A2.7 2.7 0 0 1 7.2 4.5H9 M19.5 9V7.2a2.7 2.7 0 0 0-2.7-2.7H15 M4.5 15v1.8a2.7 2.7 0 0 0 2.7 2.7H9 M19.5 15v1.8a2.7 2.7 0 0 1-2.7 2.7H15 M9 11.5c0 .4-.2.7-.5.7s-.5-.3-.5-.7.2-.7.5-.7.5.3.5.7z M15.5 11.5c0 .4-.2.7-.5.7s-.5-.3-.5-.7.2-.7.5-.7.5.3.5.7z M9.5 15c.6.5 1.4.8 2.1.8s1.5-.3 2.1-.8" />;
            case 'clock':
                return <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3.5 2" />;
            case 'lock':
                return <path d="M6 11V7a6 6 0 0 1 12 0v4 M5 11h14v9H5z" />;
            case 'check':
                return <path d="M5 12l4 4L19 6" />;
            default:
                return null;
        }
    };

    // ── ACTIVITIES CAROUSEL ──
    const activityItems = [
        { title: 'Blood Services', meta: 'Core program', img: '/images/b.jpg', desc: 'Support community blood-letting drives, from donor registration to post-donation care.' },
        { title: 'Disaster Response', meta: 'Emergency deployment', img: '/images/e.jpg', desc: 'Assist in relief operations, evacuation support, and emergency deployment during calamities.' },
        { title: 'Community Health', meta: 'Health & wellness', img: '/images/g.jpg', desc: 'Join health education drives, first aid demos, and wellness outreach programs.' },
        { title: 'Welfare Services', meta: 'Family assistance', img: '/images/f.jpg', desc: 'Help vulnerable families access relief assistance, welfare programs, and social services.' },
        { title: 'Red Cross Youth', meta: 'Youth leadership', img: '/images/d.jpg', desc: 'Build leadership skills through peer education, campus chapters, and youth-led service projects.' },
        { title: 'Safety Services', meta: 'First aid training', img: '/images/c.jpg', desc: 'Teach first aid, water safety, and emergency preparedness to schools and communities.' },
        { title: 'Water & Sanitation', meta: 'WATSAN response', img: '/images/h.jpg', desc: 'Deliver clean water access and sanitation support during emergencies and outreach missions.' },
        { title: 'Blood Donor Recruitment', meta: 'Donor engagement', img: '/images/a.jpg', desc: 'Recruit and engage new voluntary blood donors through campaigns and partner organizations.' },
    ];
    const trackRef = useRef(null);
    const scrollTrack = (dir) => {
        if (!trackRef.current) return;
        trackRef.current.scrollBy({ left: dir * 270, behavior: 'smooth' });
    };
    const [expandedCard, setExpandedCard] = useState(null);
    const toggleCard = (title) => {
        setExpandedCard((prev) => (prev === title ? null : title));
    };

    // ── FACIAL RECOGNITION SCAN ANIMATION (loops) ──
    const [scanState, setScanState] = useState('scanning'); // 'scanning' | 'verified'
    useEffect(() => {
        const cycle = () => {
            setScanState('scanning');
            const toVerified = setTimeout(() => setScanState('verified'), 1800);
            const reset = setTimeout(() => setScanState('scanning'), 3600);
            return () => { clearTimeout(toVerified); clearTimeout(reset); };
        };
        cycle();
        const interval = setInterval(cycle, 3600);
        return () => clearInterval(interval);
    }, []);

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
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    const revealClass = (id, extra = '') =>
        `scroll-reveal ${revealed[id] ? 'is-revealed' : ''} ${extra}`.trim();

    return (
        <>
            <Head title="Philippine Red Cross - Muntinlupa">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Fragment+Mono&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap" rel="stylesheet" />
</Head>

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    font-family: 'Open Sans', sans-serif;
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

                .nav-auth {
                    display: flex; align-items: center; gap: 8px; zIndex: 1;
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

                /* ── LIGHT HERO (real map image, red-tinted, brand color) ── */
                .hero-light {
                    position: relative; overflow: hidden;
                    background-image:
                        linear-gradient(135deg, rgba(255,245,245,0.55) 0%, rgba(255,226,226,0.6) 100%),
                        url('/images/map-red-tint.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    padding-top: 92px;
                    padding-bottom: 0px;
                    min-height: 100vh;
                    display: flex; flex-direction: column; justify-content: center;
                }
                .hero-light::before {
                    content: '';
                    position: absolute; top: -180px; left: -140px;
                    width: 420px; height: 420px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0) 70%);
                    pointer-events: none;
                }
                .hero-light::after {
                    content: '';
                    position: absolute; top: -120px; right: -160px;
                    width: 460px; height: 460px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(220,38,38,0.07) 0%, rgba(220,38,38,0) 70%);
                    pointer-events: none;
                }

                .hero-center-col {
                    max-width: 660px; margin: 0 auto; text-align: center;
                    padding: 0 24px; position: relative; z-index: 1;
                }

                .hero-text-glow {
                    position: absolute;
                    left: 50%; top: 50%;
                    transform: translate(-50%, -50%);
                    width: 1180px; max-width: 150vw; height: 340px;
                    background: radial-gradient(ellipse 55% 45% at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.78) 35%, rgba(255,255,255,0.4) 62%, rgba(255,255,255,0) 85%);
                    filter: blur(12px);
                    z-index: -1;
                    pointer-events: none;
                }

                .hero-badge-light {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: white; border: 1px solid #ffd4d4;
                    color: #b91c1c; font-size: 11px; font-weight: 700;
                    letter-spacing: 1.5px; text-transform: uppercase;
                    padding: 6px 16px; border-radius: 100px; margin-bottom: 16px;
                    font-family: 'Open Sans', sans-serif;
                    box-shadow: 0 6px 16px rgba(127,29,29,0.06);
                }

                .hero-title-light {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 31px; line-height: 1.2; color: #1a1a1a;
                    letter-spacing: 0.1px; margin: 0 auto 12px; font-weight: 600;
                    max-width: 600px;
                }
                .hero-title-light span { color: #DC2626; }

                .hero-subtext-light {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 13.5px; color: #6b6b6b; line-height: 1.6;
                    font-weight: 400; margin: 0 auto 20px; max-width: 440px;
                }

                /* ── PHONE MOCKUP (facial recognition / verification) ── */
                .phone-mock-wrap {
                    position: relative; display: flex; justify-content: center; align-items: flex-end;
                    padding-bottom: 0;
                    gap: 0;
                }
                .phone-mock-white-halo {
                    position: absolute; left: 50%; top: 50%;
                    transform: translate(-50%, -50%);
                    width: 480px; height: 480px;
                    background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0) 72%);
                    z-index: 0;
                    pointer-events: none;
                }
                .phone-mock-glow {
                    position: absolute; bottom: -14px; width: 340px; height: 90px;
                    background: radial-gradient(ellipse, rgba(220,38,38,0.22) 0%, rgba(220,38,38,0) 70%);
                    filter: blur(4px);
                    z-index: 1;
                }
                .phone-frame-center {
                    position: relative;
                    width: 190px; height: 340px;
                    background: #111;
                    border-radius: 32px;
                    padding: 9px;
                    box-shadow: 0 30px 60px rgba(127,29,29,0.28), 0 0 0 3px #1a1a1a;
                    z-index: 3;
                }
                .phone-frame-side {
                    position: relative;
                    width: 148px; height: 268px;
                    background: #111;
                    border-radius: 28px;
                    padding: 7px;
                    box-shadow: 0 20px 40px rgba(127,29,29,0.22), 0 0 0 3px #1a1a1a;
                    z-index: 1;
                    margin-bottom: 14px;
                }
                .phone-frame-side.is-left {
                    transform: rotate(-11deg);
                    margin-right: -34px;
                }
                .phone-frame-side.is-right {
                    transform: rotate(11deg);
                    margin-left: -34px;
                }
                .phone-notch {
                    position: absolute; top: 9px; left: 50%; transform: translateX(-50%);
                    width: 70px; height: 16px; background: #111; border-radius: 0 0 12px 12px;
                    z-index: 3;
                }
                .phone-notch-side {
                    position: absolute; top: 7px; left: 50%; transform: translateX(-50%);
                    width: 54px; height: 13px; background: #111; border-radius: 0 0 10px 10px;
                    z-index: 3;
                }
                .phone-screen {
                    width: 100%; height: 100%;
                    background: linear-gradient(180deg, #fff5f5 0%, #ffffff 60%);
                    border-radius: 24px;
                    overflow: hidden;
                    display: flex; flex-direction: column; align-items: center;
                    padding: 24px 14px 14px;
                    position: relative;
                }
                .phone-screen-side {
                    width: 100%; height: 100%;
                    background: linear-gradient(180deg, #fff5f5 0%, #ffffff 60%);
                    border-radius: 21px;
                    overflow: hidden;
                    display: flex; flex-direction: column; align-items: center;
                    padding: 18px 11px 11px;
                    position: relative;
                }
                .phone-screen-header {
                    font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700;
                    color: #7f1d1d; letter-spacing: 0.3px; margin-bottom: 3px;
                }
                .phone-screen-sub {
                    font-family: 'Open Sans', sans-serif; font-size: 8.5px; color: #999;
                    margin-bottom: 16px;
                }

                /* ── FACE SCAN FRAME ── */
                .face-scan-frame {
                    width: 84px; height: 104px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    background: linear-gradient(160deg, #2b2b2f 0%, #17171a 100%);
                    position: relative;
                    margin-bottom: 16px;
                    overflow: hidden;
                    border: 3px solid #ffd4d4;
                    transition: border-color 0.4s;
                }
                .face-scan-frame.is-verified { border-color: #22c55e; }

                .face-scan-line {
                    position: absolute; left: 6px; right: 6px; height: 2px;
                    background: linear-gradient(90deg, rgba(220,38,38,0) 0%, #DC2626 50%, rgba(220,38,38,0) 100%);
                    box-shadow: 0 0 8px rgba(220,38,38,0.6);
                    opacity: 0;
                }
                .face-scan-frame.is-scanning .face-scan-line {
                    opacity: 1;
                    animation: faceScanSweep 1.8s ease-in-out infinite;
                }
                @keyframes faceScanSweep {
                    0% { top: 10px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 94px; opacity: 0; }
                }

                .face-icon { transition: opacity 0.3s, transform 0.3s; }
                .face-scan-photo {
                    width: 100%; height: 100%;
                    object-fit: cover; object-position: center 30%;
                    display: block;
                }
                .face-check {
                    position: absolute; opacity: 0; transform: scale(0.5);
                    transition: opacity 0.3s, transform 0.3s;
                    width: 32px; height: 32px; border-radius: 50%;
                    background: #22c55e;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 6px 14px rgba(0,0,0,0.3);
                }
                .face-scan-frame.is-verified .face-check { opacity: 1; transform: scale(1); }

                .fingerprint-status-text {
                    font-family: 'Open Sans', sans-serif; font-size: 10.5px; font-weight: 700;
                    color: #DC2626; margin-bottom: 2px; letter-spacing: 0.2px;
                    transition: color 0.3s;
                }
                .fingerprint-status-text.is-verified { color: #16a34a; }
                .fingerprint-status-sub {
                    font-family: 'Open Sans', sans-serif; font-size: 8.5px; color: #aaa;
                    margin-bottom: 14px;
                }

                .phone-id-card {
                    width: 100%; background: #fff8f8; border: 1px solid #ffe0e0;
                    border-radius: 12px; padding: 9px 10px;
                    display: flex; align-items: center; gap: 8px;
                }
                .phone-id-avatar {
                    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
                    background: linear-gradient(135deg, #fecaca, #DC2626);
                }
                .phone-id-name {
                    font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; color: #1a1a1a;
                }
                .phone-id-role {
                    font-family: 'Open Sans', sans-serif; font-size: 8px; color: #999; margin-top: 1px;
                }

                /* ── BIOMETRIC TERMINAL (photo, left slot) ── */
                .terminal-photo {
                    position: relative;
                    width: 148px; height: 268px;
                    background: #111;
                    border-radius: 28px;
                    padding: 3px;
                    box-shadow: 0 20px 40px rgba(127,29,29,0.22), 0 0 0 3px #1a1a1a;
                    z-index: 1;
                    margin-bottom: 14px;
                    transform: rotate(-11deg);
                    margin-right: -34px;
                }
                .terminal-photo-notch {
                    position: absolute; top: 7px; left: 50%; transform: translateX(-50%);
                    width: 54px; height: 13px; background: #111; border-radius: 0 0 10px 10px;
                    z-index: 3;
                }
                .terminal-photo-screen {
                    width: 100%; height: 100%;
                    border-radius: 21px;
                    overflow: hidden;
                }
                .terminal-photo-screen img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                }

                /* ── SIDE PHONE CONTENT ── */
                .side-screen-header {
                    font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700;
                    color: #7f1d1d; letter-spacing: 0.3px; margin-bottom: 12px; align-self: flex-start;
                }
                .side-profile-avatar {
                    width: 56px; height: 56px; border-radius: 14px;
                    background: linear-gradient(160deg, #2b2b2f 0%, #17171a 100%);
                    margin-bottom: 10px;
                    border: 3px solid white;
                    box-shadow: 0 6px 16px rgba(127,29,29,0.15);
                    display: flex; align-items: center; justify-content: center;
                }
                .side-profile-scanner {
                    width: 34px; height: 34px; border-radius: 50%;
                    background: radial-gradient(circle at 35% 30%, #4fa8ff 0%, #1560c4 55%, #0b2f66 100%);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: inset 0 0 6px rgba(0,0,0,0.5), 0 0 5px rgba(79,168,255,0.6);
                }
                .side-profile-name {
                    font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700;
                    color: #1a1a1a; margin-bottom: 2px;
                }
                .side-profile-role {
                    font-family: 'Open Sans', sans-serif; font-size: 8px; color: #999; margin-bottom: 14px;
                }
                .side-profile-badge {
                    width: 100%; background: #fff8f8; border: 1px solid #ffe0e0;
                    border-radius: 10px; padding: 8px 10px; text-align: center;
                }
                .side-profile-badge-label {
                    font-family: 'Fragment Mono', monospace; font-size: 7px; letter-spacing: 0.5px;
                    text-transform: uppercase; color: #DC2626; margin-bottom: 3px; font-weight: 600;
                }
                .side-profile-badge-value {
                    font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; color: #1a1a1a;
                }

                .side-task-card {
                    width: 100%; background: #fff8f8; border: 1px solid #ffe0e0;
                    border-radius: 12px; padding: 10px; margin-bottom: 8px;
                }
                .side-task-time {
                    font-family: 'Fragment Mono', monospace; font-size: 7.5px; letter-spacing: 0.5px;
                    color: #DC2626; font-weight: 600; margin-bottom: 4px;
                }
                .side-task-title {
                    font-family: 'Open Sans', sans-serif; font-size: 9.5px; font-weight: 700;
                    color: #1a1a1a; margin-bottom: 2px;
                }
                .side-task-loc {
                    font-family: 'Open Sans', sans-serif; font-size: 8px; color: #999;
                }
                .side-check-row {
                    width: 100%; display: flex; align-items: center; gap: 6px;
                    padding: 6px 2px;
                }
                .side-check-dot {
                    width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                }
                .side-check-dot.is-done { background: #22c55e; }
                .side-check-dot.is-pending { background: #f0f0f0; border: 1.5px solid #ddd; }
                .side-check-label {
                    font-family: 'Open Sans', sans-serif; font-size: 8.5px; color: #555; font-weight: 500;
                }

                .mock-float-card {
                    position: absolute;
                    background: white; border-radius: 14px;
                    padding: 10px 14px;
                    box-shadow: 0 14px 34px rgba(127,29,29,0.18);
                    display: flex; align-items: center; gap: 9px;
                    z-index: 2;
                }

                /* ── FEATURE STRIP ── */
                .feature-strip {
                    position: relative; z-index: 2;
                    max-width: 960px; margin: 20px auto 0;
                    background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
                    border-radius: 16px;
                    padding: 14px 18px;
                    display: flex; align-items: center; justify-content: space-between;
                    box-shadow: 0 16px 34px rgba(127,29,29,0.28);
                    flex-wrap: wrap;
                    gap: 10px 10px;
                }
                .feature-strip-item {
                    display: flex; align-items: center; gap: 8px;
                    flex: 1 1 auto; justify-content: center;
                    min-width: 110px;
                }
                .feature-strip-icon {
                    width: 24px; height: 24px; border-radius: 50%;
                    background: rgba(255,255,255,0.14);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                }
                .feature-strip-stepnum {
                    position: absolute; top: -6px; left: -6px;
                    width: 15px; height: 15px; border-radius: 50%;
                    background: white; color: #b91c1c;
                    font-family: 'Fragment Mono', monospace; font-size: 8.5px; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                .feature-strip-label {
                    font-family: 'Open Sans', sans-serif; font-size: 11px; font-weight: 600;
                    color: white; letter-spacing: 0.2px; white-space: nowrap;
                }
                .feature-strip-arrow {
                    flex-shrink: 0;
                    display: flex; align-items: center;
                    opacity: 0.55;
                }
                @media (max-width: 900px) {
                    .feature-strip-arrow { display: none; }
                }

                .hero-bottom-spacer { height: 24px; }

              .hero-bottom-spacer { height: 0; }

.hero-bottom-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 280px;
  background: linear-gradient(
    to bottom,
    rgba(255, 245, 245, 0)    0%,
    rgba(255, 245, 245, 0)    35%,
    rgba(255, 246, 246, 0.02) 45%,
    rgba(255, 248, 248, 0.05) 55%,
    rgba(255, 250, 250, 0.10) 65%,
    rgba(255, 251, 251, 0.20) 74%,
    rgba(255, 253, 253, 0.38) 82%,
    rgba(255, 254, 254, 0.60) 89%,
    rgba(255, 255, 255, 0.82) 95%,
    rgba(255, 255, 255, 1)    100%
  );
  pointer-events: none;
}

@media (max-width: 768px) {
  .hero-bottom-fade {
    height: 190px;
  }
}

                /* ── HERO ENTRANCE ANIMATIONS (on page load) ── */
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeScaleIn {
                    from { opacity: 0; transform: scale(0.94); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeSlideRight {
                    from { opacity: 0; transform: translateX(-24px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .hero-anim-badge {
                    opacity: 0;
                    animation: fadeSlideUp 0.6s ease forwards;
                    animation-delay: 0.1s;
                }
                .hero-anim-title {
                    opacity: 0;
                    animation: fadeSlideUp 0.7s ease forwards;
                    animation-delay: 0.25s;
                }
                .hero-anim-subtext {
                    opacity: 0;
                    animation: fadeSlideUp 0.7s ease forwards;
                    animation-delay: 0.4s;
                }
                .hero-anim-cta {
                    opacity: 0;
                    animation: fadeSlideUp 0.7s ease forwards;
                    animation-delay: 0.5s;
                }
                .hero-anim-image {
                    opacity: 0;
                    animation: fadeScaleIn 0.8s ease forwards;
                    animation-delay: 0.35s;
                }
                .hero-anim-card-1 {
                    opacity: 0;
                    animation: fadeSlideRight 0.6s ease forwards;
                    animation-delay: 0.75s;
                }
                .hero-anim-card-2 {
                    opacity: 0;
                    animation: fadeSlideRight 0.6s ease forwards;
                    animation-delay: 0.9s;
                }
                .hero-anim-strip {
                    opacity: 0;
                    animation: fadeSlideUp 0.7s ease forwards;
                    animation-delay: 1s;
                }

                /* ── SCROLL REVEAL (as sections enter viewport) ── */
                .scroll-reveal {
                    opacity: 0;
                    transform: translateY(28px);
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }
                .scroll-reveal.is-revealed {
                    opacity: 1;
                    transform: translateY(0);
                }
                .scroll-reveal-delay-1.is-revealed { transition-delay: 0.1s; }
                .scroll-reveal-delay-2.is-revealed { transition-delay: 0.2s; }
                .scroll-reveal-delay-3.is-revealed { transition-delay: 0.3s; }
                .scroll-reveal-delay-4.is-revealed { transition-delay: 0.4s; }

                /* ── WHAT YOU'LL BE DOING ── */
                .activities-section {
                    padding: 64px 64px 72px;
                    background: linear-gradient(180deg, #ffffff 0%, #fdfbfb 50%, #ffffff 100%);
                    position: relative;
                    overflow: hidden;
                }
                .activities-section::before {
                    content: '';
                    position: absolute;
                    top: -140px; right: -120px;
                    width: 380px; height: 380px;
                    background: radial-gradient(circle, rgba(220,38,38,0.07) 0%, rgba(220,38,38,0) 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }
                .activities-section::after {
                    content: '';
                    position: absolute;
                    bottom: -160px; left: -140px;
                    width: 420px; height: 420px;
                    background: radial-gradient(circle, rgba(220,38,38,0.06) 0%, rgba(220,38,38,0) 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }

                .activities-top {
                    position: relative;
                    max-width: 1100px; margin: 0 auto 36px;
                    text-align: center;
                }
                .activities-header-inner { max-width: 640px; margin: 0 auto; }
                .activities-eyebrow {
                    font-family: 'Fragment Mono', monospace;
                    font-size: 11px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase;
                    color: #DC2626; margin-bottom: 10px;
                }
                .activities-heading {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 27px; color: #1a1a1a; font-weight: 600;
                    letter-spacing: 0.2px; margin: 0 0 8px;
                    position: relative; display: inline-block;
                    text-shadow: 0 4px 14px rgba(127,29,29,0.18);
                }
                .activities-heading-underline {
                    position: absolute; left: 0; bottom: -6px; width: 108%; height: 8px;
                }
                .activities-text {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 14px; color: #666; font-weight: 300;
                    line-height: 1.7; margin: 14px auto 0;
                }

                .activities-nav-btn {
                    width: 42px; height: 42px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.15s;
                    border: 1.5px solid #f0c9c9; background: white;
                    position: absolute; top: 50%; transform: translateY(-50%);
                    z-index: 3;
                    box-shadow: 0 10px 24px rgba(127,29,29,0.14);
                }
                .activities-nav-btn.is-left { left: -21px; }
                .activities-nav-btn.is-right { right: -21px; }
                .activities-nav-btn:hover { transform: translateY(-52%); }
                .activities-nav-btn:active { transform: translateY(-50%); }
                .activities-nav-btn.is-primary { background: #DC2626; border-color: #DC2626; }
                .activities-nav-btn.is-primary:hover { background: #b91c1c; }
                .activities-nav-btn:disabled { opacity: 0.35; cursor: default; transform: translateY(-50%); }

                .activities-track-wrap { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
                .activities-track {
                    display: flex; gap: 20px;
                    align-items: flex-start;
                    overflow-x: auto; scroll-snap-type: x mandatory;
                    padding: 4px 4px 12px;
                    scrollbar-width: none;
                }
                .activities-track::-webkit-scrollbar { display: none; }

                .activity-card {
                    scroll-snap-align: start;
                    flex: 0 0 250px;
                    background: white; border-radius: 16px; overflow: hidden;
                    border: 1px solid #f5e0e0;
                    box-shadow: 0 6px 20px rgba(127,29,29,0.05);
                    display: flex; flex-direction: column;
                    cursor: pointer;
                    transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
                }
                .activity-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 32px rgba(127,29,29,0.12);
                    border-color: #fecaca;
                }
                .activity-card-img {
                    width: 100%; height: 150px; object-fit: cover; display: block;
                    background: #fde3e3;
                }
                .activity-card-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
                .activity-card-title {
                    font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 600;
                    color: #1a1a1a; letter-spacing: 0.1px;
                }
                .activity-card-meta {
                    font-family: 'Open Sans', sans-serif; font-size: 12px; color: #999;
                    font-weight: 400;
                }
                .activity-card-footer {
                    margin-top: auto; padding-top: 12px; border-top: 1px solid #f5e0e0;
                    display: flex; align-items: center; justify-content: space-between;
                    cursor: pointer;
                }
                .activity-card-toggle {
                    font-family: 'Open Sans', sans-serif; font-size: 12.5px; font-weight: 600;
                    color: #DC2626;
                    display: inline-flex; align-items: center; gap: 5px;
                }
                .activity-card-toggle svg { transition: transform 0.2s; }
                .activity-card.is-expanded .activity-card-toggle svg { transform: rotate(180deg); }
                .activity-card-desc {
                    max-height: 0; overflow: hidden;
                    transition: max-height 0.3s ease, margin-top 0.3s ease;
                    font-family: 'Open Sans', sans-serif; font-size: 12.5px; color: #777;
                    line-height: 1.6; font-weight: 300;
                }
                .activity-card.is-expanded .activity-card-desc {
                    max-height: 160px; margin-top: 8px;
                }

                .activities-footer { text-align: center; margin-top: 32px; position: relative; z-index: 1; }
                .activities-btn {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 13.5px; font-weight: 700;
                    color: white; background: #DC2626;
                    text-decoration: none; letter-spacing: 0.3px;
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 13px 28px; border-radius: 100px;
                    box-shadow: 0 10px 24px rgba(220,38,38,0.25);
                    transition: background 0.2s, transform 0.2s;
                }
                .activities-btn svg { transition: transform 0.2s; }
                .activities-btn:hover { background: #b91c1c; transform: translateY(-2px); }
                .activities-btn:hover svg { transform: translateX(3px); }

                @media (max-width: 900px) {
                    .activities-section { padding: 48px 24px 56px; }
                    .activities-top { padding-top: 0; }
                    .activities-nav-btn.is-left { left: -6px; }
                    .activities-nav-btn.is-right { right: -6px; }
                    .activities-heading { font-size: 22px; }
                    .activity-card { flex: 0 0 220px; }
                }

                .site-footer {
                    background: linear-gradient(135deg, #b91c1c 0%, #b91c1c 100%);
                    color: rgba(255,255,255,0.75);
                    text-align: center;
                    font-family: 'Open Sans', sans-serif;
                    font-size: 12.5px; font-weight: 300; letter-spacing: 0.3px;
                    padding: 18px 24px;
                }

                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

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
                                    className={`nav-link-red${idx === 0 ? ' active' : ''}`}
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

                {/* ── HERO (WELCOME) — centered, app-style ── */}
                <section className="hero-light">
                    <div className="hero-center-col">
                        <div className="hero-text-glow" />
                   <div className="hero-anim-badge hero-badge-light" style={{ position: 'relative', zIndex: 150, backgroundColor: '#ffffff', border: 'none', boxShadow: 'none' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                            For Approved Volunteers
                        </div>

                        <h1 className="hero-anim-title hero-title-light" style={{ position: 'relative', zIndex: 150 }}>
    Verified. Trusted. <span>Ready to Serve.</span>
</h1>

<p className="hero-anim-subtext hero-subtext-light" style={{ position: 'relative', zIndex: 150 }}>
    Your branch coordinator has cleared you to join. Verify your identity and get instant access to your volunteer portal.
</p>

                    </div>

                    <div className="hero-anim-image">
                        <div className="phone-mock-wrap">
                            <div className="phone-mock-white-halo" />
                            <div className="phone-mock-glow" />

                            {/* LEFT — Biometric Terminal Photo */}
                            <div className="terminal-photo">
                                <div className="terminal-photo-notch" />
                                <div className="terminal-photo-screen">
                                    <img src="/images/biometric-device.png" alt="Biometric access terminal" />
                                </div>
                            </div>

                            {/* CENTER PHONE — Facial Recognition Verification */}
                            <div className="phone-frame-center">
                                <div className="phone-notch" />
                                <div className="phone-screen">
                                    <div className="phone-screen-header">Identity Verification</div>
                                    <div className="phone-screen-sub">Rizal Chapter Volunteer Portal</div>

                                    <div className={`face-scan-frame ${scanState === 'verified' ? 'is-verified' : 'is-scanning'}`}>
                                        <div className="face-scan-line" />

                                        <img
                                            className="face-scan-photo"
                                            src="/images/volunteer-face-example.png"
                                            alt="Example volunteer profile"
                                        />
                                        <div className="face-check">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className={`fingerprint-status-text ${scanState === 'verified' ? 'is-verified' : ''}`}>
                                        {scanState === 'verified' ? 'Face Verified' : 'Scanning Face...'}
                                    </div>
                                    <div className="fingerprint-status-sub">
                                        {scanState === 'verified' ? 'Welcome back, volunteer' : 'Position your face in frame'}
                                    </div>

                                    <div className="phone-id-card">
                                        <div className="phone-id-avatar" />
                                        <div>
                                            <div className="phone-id-name">Maria D. Santos</div>
                                            <div className="phone-id-role">Volunteer ID · Blood Services</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PHONE — Today's Task */}
                            <div className="phone-frame-side is-right">
                                <div className="phone-notch-side" />
                                <div className="phone-screen-side">
                                    <div className="side-screen-header">Today's Task</div>
                                    <div className="side-task-card">
                                        <div className="side-task-time">8:00 AM – 12:00 NN</div>
                                        <div className="side-task-title">Blood Donation Drive</div>
                                        <div className="side-task-loc">Brgy. Putatan</div>
                                    </div>
                                    <div className="side-check-row">
                                        <div className="side-check-dot is-done">
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <div className="side-check-label">Check-in</div>
                                    </div>
                                    <div className="side-check-row">
                                        <div className="side-check-dot is-pending" />
                                        <div className="side-check-label">Donor registration</div>
                                    </div>
                                    <div className="side-check-row">
                                        <div className="side-check-dot is-pending" />
                                        <div className="side-check-label">Post-donation care</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="feature-strip hero-anim-strip">
                        {loginSteps.map((item, idx) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                <div className="feature-strip-item">
                                    <div className="feature-strip-icon">
                                        <span className="feature-strip-stepnum">{idx + 1}</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            {featureIcon(item.icon)}
                                        </svg>
                                    </div>
                                    <span className="feature-strip-label">{item.label}</span>
                                </div>
                                {idx < loginSteps.length - 1 && (
                                    <div className="feature-strip-arrow">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                            <path d="M5 12h14M13 6l6 6-6 6" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="hero-bottom-spacer" />
                    <div className="hero-bottom-fade" />
                </section>

                {/* ── WHAT YOU'LL BE DOING ── */}
                <section className="activities-section">
                    <div className="activities-top">
                        <div
                            ref={registerReveal('activities-header')}
                            data-reveal-id="activities-header"
                            className={revealClass('activities-header', 'activities-header-inner')}
                        >
                            <div className="activities-eyebrow">Get Involved</div>
                            <h2 className="activities-heading">
                                What you'll be doing
                                <svg className="activities-heading-underline" viewBox="0 0 260 14" preserveAspectRatio="none">
                                    <path d="M2 9 C 40 3, 90 3, 130 7 S 220 12, 258 6" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
                                </svg>
                            </h2>
                            <p className="activities-text">
                                As a Red Cross volunteer, you'll be trained and deployed across these core service areas in Muntinlupa.
                            </p>
                        </div>
                    </div>

                    <div
                        ref={registerReveal('activities-track')}
                        data-reveal-id="activities-track"
                        className={revealClass('activities-track', 'activities-track-wrap')}
                    >
                        <button
                            type="button"
                            className="activities-nav-btn is-left"
                            onClick={() => scrollTrack(-1)}
                            aria-label="Scroll left"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                <path d="M19 12H5M11 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <div className="activities-track" ref={trackRef}>
                            {activityItems.map((item) => (
                                <div
                                    key={item.title}
                                    className={`activity-card ${expandedCard === item.title ? 'is-expanded' : ''}`}
                                    onClick={() => toggleCard(item.title)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCard(item.title); }}
                                >
                                    <img className="activity-card-img" src={item.img} alt={item.title} />
                                    <div className="activity-card-body">
                                        <div>
                                            <div className="activity-card-title">{item.title}</div>
                                            <div className="activity-card-meta">{item.meta}</div>
                                            <p className="activity-card-desc">{item.desc}</p>
                                        </div>
                                        <div className="activity-card-footer">
                                            <span className="activity-card-toggle">
                                                View details
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="activities-nav-btn is-primary is-right"
                            onClick={() => scrollTrack(1)}
                            aria-label="Scroll right"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </button>
                    </div>

                    <div
                        ref={registerReveal('activities-footer')}
                        data-reveal-id="activities-footer"
                        className={revealClass('activities-footer', 'activities-footer')}
                    >
                        <Link href={route('about')} className="activities-btn">
                            Get to Know Us
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </Link>
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
