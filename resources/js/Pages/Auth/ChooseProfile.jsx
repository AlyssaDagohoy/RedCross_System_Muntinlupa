import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import ProfilePicker from '../../Components/ProfilePicker';

const FONT = "'Open Sans', sans-serif";
const RED = '#DC2626';

export default function ChooseProfile({ admins = [], canResetPassword = false, status }) {
    const [selected, setSelected] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const choose = (admin) => new Promise((resolve) => {
        setTimeout(() => {
            setData('email', admin.email);
            setSelected(admin);
            resolve();
        }, 350);
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    const error = errors.email || errors.password;

    return (
        <>
            <Head title="Log in" />
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 16, padding: 16, background: '#FEF2F2', fontFamily: FONT,
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#fff', overflow: 'hidden',
                    border: '1px solid #ffe2e2', boxShadow: '0 6px 18px rgba(127,29,29,0.14)',
                }}>
                    <img src="/images/finallogo.png" alt="Philippine Red Cross" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {status && (
                    <div style={{
                        maxWidth: 420, width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: '#f0fdf4',
                        border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, color: '#15803D',
                    }}>{status}</div>
                )}

                {selected ? (
                    <form onSubmit={submit} style={{
                        width: '100%', maxWidth: 420, boxSizing: 'border-box', background: '#fff', borderRadius: 18,
                        border: '1px solid #f0f0f0', padding: '28px 24px 22px',
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 18 }}>
                            <div style={{
                                width: 56, height: 56, margin: '0 auto 10px', borderRadius: '50%', background: '#FEF2F2',
                                border: '1px solid #FECACA', color: RED, fontWeight: 700, fontSize: 22,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {selected.name.trim()[0].toUpperCase()}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{selected.name}</div>
                            <div style={{ fontSize: 13, color: '#5B6170', marginTop: 2 }}>{selected.email}</div>
                        </div>

                        <label htmlFor="pp-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
                            Password
                        </label>
                        <input
                            id="pp-password"
                            type="password"
                            autoFocus
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            style={{
                                width: '100%', boxSizing: 'border-box', height: 44, padding: '0 14px', fontFamily: FONT,
                                fontSize: 15, border: `1px solid ${error ? '#FCA5A5' : '#D8DBE2'}`, borderRadius: 10, outline: 'none',
                            }}
                        />
                        {error && (
                            <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: '#B91C1C' }}>{error}</p>
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 16px', fontSize: 13, color: '#5B6170' }}>
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                            Keep me signed in
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%', height: 44, border: 'none', borderRadius: 10, background: RED, color: '#fff',
                                fontFamily: FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: processing ? 0.7 : 1,
                            }}
                        >
                            {processing ? 'Logging in\u2026' : 'Log in'}
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13 }}>
                            <button
                                type="button"
                                onClick={() => { setSelected(null); reset('password'); }}
                                style={{ background: 'none', border: 'none', padding: 0, color: '#5B6170', cursor: 'pointer', fontFamily: FONT, fontSize: 13 }}
                            >
                                Not you? Switch profile
                            </button>
                            {canResetPassword && (
                                <Link href="/forgot-password" style={{ color: RED, textDecoration: 'none' }}>Forgot password?</Link>
                            )}
                        </div>
                    </form>
                ) : (
                    <ProfilePicker
                        admins={admins}
                        onSelect={choose}
                        onAddAdmin={() => router.get('/login', { other: 1 })}
                    />
                )}
            </div>
        </>
    );
}