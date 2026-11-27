import { Head, Link, useForm } from '@inertiajs/react';

export default function ForcePasswordChange() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.force.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px' };
    const label = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#666', margin: '12px 0 4px' };
    const err = { fontSize: '11px', color: '#c62828', marginTop: '4px' };

    return (
        <div style={{ minHeight: '100vh', background: '#b92f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <Head title="Set your new password" />
            <form onSubmit={submit} style={{ background: '#fff', borderRadius: '16px', padding: '28px 26px', width: '100%', maxWidth: '340px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                <h1 style={{ margin: 0, fontSize: '20px', textAlign: 'center' }}>Set your <span style={{ color: '#d32f2f' }}>new password</span></h1>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#777', textAlign: 'center' }}>You are using a temporary password. Choose your own to continue.</p>

                <label style={label} htmlFor="password">NEW PASSWORD</label>
                <input id="password" type="password" autoFocus value={data.password} onChange={(e) => setData('password', e.target.value)} style={input} autoComplete="new-password" />
                {errors.password && <div style={err}>{errors.password}</div>}

                <label style={label} htmlFor="password_confirmation">CONFIRM NEW PASSWORD</label>
                <input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} style={input} autoComplete="new-password" />

                <button type="submit" disabled={processing} style={{ width: '100%', marginTop: '18px', padding: '11px', border: 'none', borderRadius: '999px', background: '#d32f2f', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', opacity: processing ? 0.6 : 1 }}>
                    {processing ? 'Saving...' : 'Save and continue'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <Link href={route('logout')} method="post" as="button" style={{ border: 'none', background: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Log out</Link>
                </div>
            </form>
        </div>
    );
}
