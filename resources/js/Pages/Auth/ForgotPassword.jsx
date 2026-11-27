import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ForgotPassword() {
    const [step, setStep] = useState('email');

    const emailForm = useForm({ email: '' });
    const resetForm = useForm({ email: '', code: '', password: '', password_confirmation: '' });

    const sendCode = (e) => {
        e.preventDefault();
        emailForm.post(route('password.code.send'), {
            preserveScroll: true,
            onSuccess: () => {
                resetForm.setData('email', emailForm.data.email);
                setStep('code');
            },
        });
    };

    const submitReset = (e) => {
        e.preventDefault();
        resetForm.post(route('password.code.reset'), {
            onFinish: () => resetForm.reset('password', 'password_confirmation'),
        });
    };

    const [showPw, setShowPw] = useState(false);

    const fontOpen = "'Open Sans', sans-serif";
    const fontSource = "'Source Sans 3', sans-serif";

    const pageStyle = { minHeight: '100vh', background: '#B92F2F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box' };
    const cardStyle = { width: '100%', maxWidth: 360, background: 'white', borderRadius: 18, padding: '18px 24px', boxShadow: '0 8px 30px rgba(127,29,29,0.08)', boxSizing: 'border-box' };
    const logoWrap = { width: 40, height: 40, background: 'white', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', boxShadow: '0 6px 18px rgba(127,29,29,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const titleStyle = { fontFamily: fontOpen, fontSize: 21, fontWeight: 700, letterSpacing: '0.2px', color: '#1a1a1a', margin: '0 0 3px', lineHeight: 1.2 };
    const subStyle = { fontSize: 11.5, color: '#999', fontWeight: 400, fontFamily: fontOpen, margin: 0, lineHeight: 1.5 };
    const labelStyle = { display: 'block', fontSize: 9, fontWeight: 600, color: '#999', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: fontSource };
    const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '7px 12px 7px 32px', fontSize: 12, fontFamily: fontSource, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', color: '#111', background: '#f6f6f7' };
    const codeStyle = { ...inputStyle, padding: '8px 12px 8px calc(12px + 0.5em)', textAlign: 'center', fontSize: 18, letterSpacing: '0.5em' };
    const pwStyle = { ...inputStyle, paddingRight: 34 };
    const errStyle = { fontSize: 10, color: '#DC2626', marginTop: 4, fontFamily: fontSource };
    const fieldStyle = { marginBottom: 10 };
    const iconWrap = { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', pointerEvents: 'none' };
    const eyeBtn = { position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: '#aaa' };
    const btnStyle = (busy) => ({ width: '100%', padding: 8, color: 'white', border: 'none', borderRadius: 999, background: busy ? '#f87171' : '#DC2626', fontSize: 12.5, fontWeight: 700, fontFamily: fontSource, cursor: busy ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.25)', marginTop: 4 });
    const footText = { textAlign: 'center', fontSize: 11, color: '#999', fontFamily: fontSource, fontWeight: 300 };
    const redLink = { color: '#DC2626', fontWeight: 600, textDecoration: 'none' };
    const grayBtn = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: '#999', fontFamily: fontSource, fontWeight: 300 };

    const svgProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const mailIcon = <svg {...svgProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    const lockIcon = <svg {...svgProps}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    const eyeIcon = (off) => <svg {...svgProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />{off && <line x1="3" y1="3" x2="21" y2="21" />}</svg>;

    return (
        <div className="fp-root" style={pageStyle}>
            <Head title="Forgot Password" />
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Source+Sans+3:wght@300;400;600&display=swap'); html,body{margin:0;padding:0;background:#B92F2F} .fp-root input:focus{outline:none !important;background:#ffffff !important;border-color:transparent !important;box-shadow:0 2px 8px rgba(0,0,0,0.12) !important}`}</style>

            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={logoWrap}>
                        <img src="/images/finallogo.png" alt="Red Cross" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={titleStyle}>{step === 'email' ? 'Forgot password?' : 'Enter your code'}</h1>
                    <p style={subStyle}>
                        {step === 'email'
                            ? 'Enter your email and we will send you a 6-digit code. Keep this page open, then type the code here.'
                            : <>We sent a 6-digit code to <strong>{resetForm.data.email}</strong>. It expires in 10 minutes. You can read the email on any device, then type the code below.</>}
                    </p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={sendCode}>
                        <div style={fieldStyle}>
                            <label htmlFor="email" style={labelStyle}>Email address</label>
                            <div style={{ position: 'relative' }}>
                                <span style={iconWrap}>{mailIcon}</span>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoFocus
                                    placeholder="name@email.com"
                                    value={emailForm.data.email}
                                    onChange={(e) => emailForm.setData('email', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            {emailForm.errors.email && <p style={errStyle}>{emailForm.errors.email}</p>}
                        </div>

                        <button type="submit" disabled={emailForm.processing} style={btnStyle(emailForm.processing)}>
                            Send code
                        </button>
                    </form>
                ) : (
                    <form onSubmit={submitReset}>
                        <div style={fieldStyle}>
                            <label htmlFor="code" style={labelStyle}>6-digit code</label>
                            <input
                                id="code"
                                type="text"
                                name="code"
                                inputMode="numeric"
                                maxLength={6}
                                autoFocus
                                autoComplete="off"
                                placeholder="000000"
                                value={resetForm.data.code}
                                onChange={(e) => resetForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                style={codeStyle}
                            />
                            {resetForm.errors.code && <p style={errStyle}>{resetForm.errors.code}</p>}
                        </div>

                        <div style={fieldStyle}>
                            <label htmlFor="password" style={labelStyle}>New password</label>
                            <div style={{ position: 'relative' }}>
                                <span style={iconWrap}>{lockIcon}</span>
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    value={resetForm.data.password}
                                    onChange={(e) => resetForm.setData('password', e.target.value)}
                                    style={pwStyle}
                                />
                                <button type="button" style={eyeBtn} onClick={() => setShowPw(!showPw)} aria-label="Show or hide password">{eyeIcon(showPw)}</button>
                            </div>
                            {resetForm.errors.password && <p style={errStyle}>{resetForm.errors.password}</p>}
                        </div>

                        <div style={fieldStyle}>
                            <label htmlFor="password_confirmation" style={labelStyle}>Confirm new password</label>
                            <div style={{ position: 'relative' }}>
                                <span style={iconWrap}>{lockIcon}</span>
                                <input
                                    id="password_confirmation"
                                    type={showPw ? 'text' : 'password'}
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    value={resetForm.data.password_confirmation}
                                    onChange={(e) => resetForm.setData('password_confirmation', e.target.value)}
                                    style={pwStyle}
                                />
                            </div>
                            {resetForm.errors.password_confirmation && <p style={errStyle}>{resetForm.errors.password_confirmation}</p>}
                            {resetForm.errors.email && <p style={errStyle}>{resetForm.errors.email}</p>}
                        </div>

                        <button type="submit" disabled={resetForm.processing} style={btnStyle(resetForm.processing)}>
                            Reset password
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                            <button type="button" style={grayBtn} onClick={() => setStep('email')}>Use a different email</button>
                        </div>
                    </form>
                )}

                <p style={{ ...footText, marginTop: 12 }}>
                    Back to <Link href={route('login')} style={redLink}>login</Link>
                </p>
            </div>
        </div>
    );
}