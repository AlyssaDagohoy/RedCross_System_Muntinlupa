import { useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import AdminShell from '../../Components/AdminShell';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not sure'];

const fullNameError = (s) => {
    const words = String(s).trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
    const bad = 'Enter first and last name, like Maria Santos.';
    if (words.length < 2) return bad;
    if (!words.every((w) => /^\p{L}[\p{L}.'-]*$/u.test(w))) return 'Use letters only in the name.';
    if (words[0].length < 2 || words[words.length - 1].length < 2) return bad;
    return '';
};

function ProfileInner({ auth, user, me }) {
    const [photoPreview, setPhotoPreview] = useState(null);
    const [menu, setMenu] = useState(null);
    const [nameErr, setNameErr] = useState('');
    const fileRef = useRef(null);

    const [pinOpen, setPinOpen] = useState(false);
    const [pinCur, setPinCur] = useState('');
    const [pinNew, setPinNew] = useState('');
    const [pinConf, setPinConf] = useState('');
    const [pinMsg, setPinMsg] = useState({ ok: false, text: '' });
    const [pinBusy, setPinBusy] = useState(false);
    const [pwOpen, setPwOpen] = useState(false);

    const profileForm = useForm({
        name: me.name || '',
        title: me.title || '',
        personal_email: me.personal_email || '',
        phone: me.phone || '',
        birthdate: me.birthdate || '',
        blood_type: me.blood_type || '',
        address: me.address || '',
        emergency_contact_name: me.emergency_contact_name || '',
        emergency_contact_phone: me.emergency_contact_phone || '',
        photo: null,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!menu) return undefined;
        const close = () => setMenu(null);
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('click', close);
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', close, true);
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', close, true);
        };
    }, [menu]);

    const submitProfile = (e) => {
        e.preventDefault();
        const err = fullNameError(profileForm.data.name);
        if (err) { setNameErr(err); return; }
        setNameErr('');
        profileForm.transform((d) => ({ ...d, _method: 'patch' }));
        profileForm.post(route('admin.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                profileForm.setData('photo', null);
                setPhotoPreview(null);
            },
        });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.patch(route('admin.profile.password'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            profileForm.setData('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
        e.target.value = '';
    };

    const postJson = async (url, body) => {
        const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
        const res = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': m ? decodeURIComponent(m[1]) : '' }, body: JSON.stringify(body) });
        let data = {};
        try { data = await res.json(); } catch { /* ignore */ }
        return { ok: res.ok, data };
    };

    const changePin = async () => {
        if (!/^\d{4}$/.test(pinCur) || !/^\d{4}$/.test(pinNew)) { setPinMsg({ ok: false, text: 'PINs are 4 digits.' }); return; }
        if (pinNew !== pinConf) { setPinMsg({ ok: false, text: 'The new PINs do not match.' }); return; }
        setPinBusy(true);
        const r = await postJson(route('admin.who.change'), { current_pin: pinCur, pin: pinNew });
        setPinBusy(false);
        if (r.ok) {
            setPinCur(''); setPinNew(''); setPinConf('');
            setPinOpen(false);
            setPinMsg({ ok: true, text: 'PIN changed.' });
        } else {
            setPinMsg({ ok: false, text: r.data.message || 'Could not change the PIN.' });
        }
    };

    const digits = (v) => v.replace(/\D/g, '').slice(0, 4);

    const initials = (me.name || '')
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'A';

    const openMenuAt = (x, y) => setMenu({ x, y });
    const pickPhoto = () => { setMenu(null); if (fileRef.current) fileRef.current.click(); };

    const hasPhoto = photoPreview || me.photo;
    const firstErr = nameErr || Object.values(profileForm.errors)[0] || '';

    return (
        <AdminShell active="profile" title="My Profile">
            <style>{`
                .adm-pf, .adm-pf *, .adm-pf *::before, .adm-pf *::after { box-sizing: border-box; margin: 0; padding: 0; }
                .adm-pf { font-family: inherit; width: 100%; }
                .ap-layout { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 12px; align-items: start; }
                .ap-main { display: grid; gap: 12px; min-width: 0; }

                .ap-card { background: white; border: 1px solid #ebebeb; border-radius: 10px; overflow: hidden; }
                .ap-band { padding: 14px 18px; border-bottom: 1px solid #f5f5f5; font-size: 12px; font-weight: 600; color: #111; display: flex; align-items: center; gap: 8px; }
                .ap-band.mid { border-top: 1px solid #f5f5f5; background: #fcfcfc; }
                .ap-body { padding: 18px; }
                .ap-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 16px; }
                .ap-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .ap-foot { padding: 14px 18px; border-top: 1px solid #f5f5f5; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

                .ap-field label { display: block; font-size: 11px; font-weight: 500; color: #333; margin-bottom: 5px; }
                .ap-field input, .ap-field select, .ap-field textarea {
                    width: 100%; border: 1px solid #e2e2e2; border-radius: 8px; padding: 9px 12px;
                    font-size: 12px; background: white; color: #222; font-family: inherit; min-height: 38px; outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .ap-field textarea { resize: vertical; }
                .ap-field input:focus, .ap-field select:focus, .ap-field textarea:focus { border-color: #CC0000; box-shadow: 0 0 0 3px rgba(204,0,0,0.08); }
                .ap-field .has-err { border-color: #b3261e; background: #fff8f7; }
                .ap-field .error { font-size: 10.5px; color: #b3261e; font-weight: 500; margin-top: 4px; }
                .ap-field .hint { font-size: 10px; color: #aaa; margin-top: 4px; }

                .ap-save { background: #CC0000; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
                .ap-save:hover { background: #b30000; }
                .ap-save:disabled { opacity: 0.7; cursor: wait; }
                .ap-ghost { font-size: 10.5px; font-weight: 600; color: #333; background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 5px 12px; cursor: pointer; font-family: inherit; }
                .ap-ghost:hover { background: #f8f8f8; }

                .ap-avatar { position: relative; cursor: pointer; border: none; background: none; padding: 0; border-radius: 50%; display: block; margin: 0 auto; }
                .ap-avatar:focus-visible { outline: 3px solid rgba(204,0,0,0.3); outline-offset: 2px; }
                .ap-avatar::after {
                    content: ''; position: absolute; right: 0; bottom: 0; width: 26px; height: 26px; border-radius: 50%;
                    border: 2px solid white;
                    background: #CC0000 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'/%3E%3Ccircle cx='12' cy='13' r='4'/%3E%3C/svg%3E") center / 14px no-repeat;
                }
                .ap-badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 10px; background: #fff0f0; color: #CC0000; }
                .ap-menu-item { width: 100%; display: block; text-align: left; border: none; background: white; font-family: inherit; font-size: 12px; color: #222; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
                .ap-menu-item:hover { background: #f5f5f6; }

                .ap-info { padding: 10px 0; border-top: 1px solid #f5f5f5; }
                .ap-info dt { font-size: 10px; color: #aaa; margin-bottom: 3px; }
                .ap-info dd { font-size: 12px; font-weight: 500; color: #111; word-break: break-word; }

                .ap-head .ap-avatar { margin: 0; flex: none; }
                .ap-banner { height: 64px; background: linear-gradient(90deg, #ffe3e3, #fff7f7); }
                .ap-head-body { padding: 0 18px 18px; }
                .ap-head-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
                .ap-head-id { display: flex; align-items: flex-end; gap: 14px; margin-top: -36px; min-width: 0; }
                .ap-head-name { min-width: 0; padding-bottom: 2px; }
                .ap-head-name .n { font-size: 15px; font-weight: 600; color: #111; }
                .ap-head-name .t { font-size: 12px; color: #777; margin-top: 2px; }
                .ap-head-side { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 10px; }
                .ap-hint { font-size: 10.5px; line-height: 1.5; }
                .ap-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; margin-top: 14px; }
                .ap-tile { border: 1px solid #ebebeb; border-radius: 10px; padding: 10px 12px; min-width: 0; }
                .ap-tile dt { font-size: 10px; color: #aaa; margin-bottom: 3px; }
                .ap-tile dd { font-size: 12px; font-weight: 500; color: #111; word-break: break-word; }
                .ap-side-body { padding: 22px 18px 6px; text-align: center; }
                .ap-side-body .ap-avatar { margin: 0 auto 12px; }
                .ap-side-name { font-size: 15px; font-weight: 600; color: #111; }
                .ap-side-title { font-size: 12px; color: #777; margin-top: 2px; }
                .ap-side-badge { display: inline-block; margin-top: 10px; font-size: 11px; padding: 2px 10px; border-radius: 999px; background: #fff0f0; color: #CC0000; }
                .ap-side-hint { display: block; font-size: 10.5px; line-height: 1.5; margin-top: 10px; }
                .ap-side-rows { list-style: none; margin: 16px 0 0; padding: 0; text-align: left; }
                .ap-side-rows li { display: flex; align-items: center; gap: 10px; padding: 10px 2px; border-top: 1px solid #ebebeb; font-size: 12px; font-weight: 500; color: #111; min-width: 0; }
                .ap-side-rows li span { min-width: 0; word-break: break-word; }
                .ap-side-rows svg { width: 14px; height: 14px; flex: none; color: #888; }
                .ap-sec { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 0; }
                .ap-sec + .ap-sec { border-top: 1px solid #f5f5f5; }
                .ap-sec .t { font-size: 12px; font-weight: 600; color: #111; }
                .ap-sec .s { font-size: 10.5px; color: #aaa; margin-top: 2px; }

                .ap-rows { padding: 4px 18px; }
                .ap-row { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 4px 14px; align-items: start; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
                .ap-row:last-child { border-bottom: none; }
                .ap-row > label { font-size: 12px; font-weight: 500; color: #333; padding-top: 11px; }
                .ap-row .ap-field { max-width: 380px; }
                .ap-row.short .ap-field { max-width: 200px; }
                .ap-row.long .ap-field { max-width: 560px; }
                @media (max-width: 560px) { .ap-row { grid-template-columns: 1fr; } .ap-row > label { padding-top: 0; } }
                @media (max-width: 1100px) { .ap-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 860px) { .ap-layout { grid-template-columns: 1fr; } }
                @media (max-width: 560px) {
                    .ap-grid, .ap-grid.two { grid-template-columns: 1fr; }
                    .ap-body { padding: 14px; }
                }
            `}</style>

            <div className="adm-pf">
                <div className="ap-layout">

                    {/* LEFT: PROFILE CARD */}
                    <aside className="ap-card ap-side" aria-label="Account information">
                        <div className="ap-side-body">
                            <button
                                type="button"
                                className="ap-avatar"
                                aria-label="Profile photo. Right-click or press Enter for options."
                                onContextMenu={(e) => { e.preventDefault(); openMenuAt(e.clientX, e.clientY); }}
                                onClick={(e) => { e.stopPropagation(); openMenuAt(e.clientX, e.clientY); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const r = e.currentTarget.getBoundingClientRect();
                                        openMenuAt(r.left, r.bottom);
                                    }
                                }}
                            >
                                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#fff0f0', color: '#CC0000', fontSize: '28px', fontWeight: '600', display: 'grid', placeItems: 'center', overflow: 'hidden', border: '3px solid #CC0000' }}>
                                    {hasPhoto
                                        ? <img src={photoPreview || `/storage/${me.photo}`} alt={me.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        : <span aria-hidden="true">{initials}</span>}
                                </div>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />

                            <div className="ap-side-name">{me.name}</div>
                            {me.title && <div className="ap-side-title">{me.title}</div>}
                            <span className="ap-side-badge">Administrator</span>
                            <span className="ap-side-hint" style={{ color: profileForm.data.photo ? '#CC0000' : '#aaa' }}>
                                {profileForm.data.photo ? 'New photo selected. Save your changes to keep it.' : 'Click the photo to change it'}
                            </span>

                            <ul className="ap-side-rows">
                                <li>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>
                                    <span>Administrator</span>
                                </li>
                                <li>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                                    <span>{user.email}</span>
                                </li>
                                <li>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
                                    <span>{me.name}</span>
                                </li>
                            </ul>
                        </div>
                    </aside>

                    {menu && (
                        <div role="menu" style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 2000, background: 'white', border: '1px solid #ebebeb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px', minWidth: '140px' }}>
                            <button type="button" role="menuitem" className="ap-menu-item" onClick={pickPhoto}>Change photo</button>
                        </div>
                    )}

                    {/* RIGHT: FORM + SIGN-IN */}
                    <div className="ap-main">

                        <form onSubmit={submitProfile} encType="multipart/form-data" noValidate className="ap-card">
                            <div className="ap-band">Your details</div>
                            <div className="ap-rows">
                                <div className="ap-row">
                                    <label htmlFor="name">Full name</label>
                                    <div className="ap-field">
                                        <input
                                            id="name"
                                            type="text"
                                            className={(nameErr || profileForm.errors.name) ? 'has-err' : ''}
                                            value={profileForm.data.name}
                                            onChange={e => { profileForm.setData('name', e.target.value); setNameErr(''); }}
                                        />
                                        {(nameErr || profileForm.errors.name)
                                            ? <div className="error">{nameErr || profileForm.errors.name}</div>
                                            : <div className="hint">First and last name. Your old activities update too.</div>}
                                    </div>
                                </div>
                                <div className="ap-row">
                                    <label htmlFor="title">Title</label>
                                    <div className="ap-field">
                                        <input
                                            id="title"
                                            type="text"
                                            className={profileForm.errors.title ? 'has-err' : ''}
                                            placeholder="Branch Coordinator"
                                            value={profileForm.data.title}
                                            onChange={e => profileForm.setData('title', e.target.value)}
                                        />
                                        {profileForm.errors.title && <div className="error">{profileForm.errors.title}</div>}
                                    </div>
                                </div>
                                <div className="ap-row short">
                                    <label htmlFor="birthdate">Birthdate</label>
                                    <div className="ap-field">
                                        <input
                                            id="birthdate"
                                            type="date"
                                            className={profileForm.errors.birthdate ? 'has-err' : ''}
                                            value={profileForm.data.birthdate}
                                            onChange={e => profileForm.setData('birthdate', e.target.value)}
                                        />
                                        {profileForm.errors.birthdate && <div className="error">{profileForm.errors.birthdate}</div>}
                                    </div>
                                </div>
                                <div className="ap-row short">
                                    <label htmlFor="blood_type">Blood type</label>
                                    <div className="ap-field">
                                        <select
                                            id="blood_type"
                                            className={profileForm.errors.blood_type ? 'has-err' : ''}
                                            value={profileForm.data.blood_type}
                                            onChange={e => profileForm.setData('blood_type', e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                        {profileForm.errors.blood_type && <div className="error">{profileForm.errors.blood_type}</div>}
                                    </div>
                                </div>
                                <div className="ap-row">
                                    <label htmlFor="personal_email">Personal email</label>
                                    <div className="ap-field">
                                        <input
                                            id="personal_email"
                                            type="email"
                                            className={profileForm.errors.personal_email ? 'has-err' : ''}
                                            placeholder="name@gmail.com"
                                            value={profileForm.data.personal_email}
                                            onChange={e => profileForm.setData('personal_email', e.target.value)}
                                        />
                                        {profileForm.errors.personal_email && <div className="error">{profileForm.errors.personal_email}</div>}
                                    </div>
                                </div>
                                <div className="ap-row">
                                    <label htmlFor="phone">Contact number</label>
                                    <div className="ap-field">
                                        <input
                                            id="phone"
                                            type="tel"
                                            className={profileForm.errors.phone ? 'has-err' : ''}
                                            placeholder="0917 123 4567"
                                            value={profileForm.data.phone}
                                            onChange={e => profileForm.setData('phone', e.target.value)}
                                        />
                                        {profileForm.errors.phone && <div className="error">{profileForm.errors.phone}</div>}
                                    </div>
                                </div>
                                <div className="ap-row long">
                                    <label htmlFor="address">Address</label>
                                    <div className="ap-field">
                                        <input
                                            id="address"
                                            type="text"
                                            className={profileForm.errors.address ? 'has-err' : ''}
                                            value={profileForm.data.address}
                                            onChange={e => profileForm.setData('address', e.target.value)}
                                        />
                                        {profileForm.errors.address
                                            ? <div className="error">{profileForm.errors.address}</div>
                                            : <div className="hint">House no., street, barangay, city or municipality.</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="ap-band mid">Emergency contact</div>
                            <div className="ap-rows">
                                <div className="ap-row">
                                    <label htmlFor="emergency_contact_name">Full name</label>
                                    <div className="ap-field">
                                        <input
                                            id="emergency_contact_name"
                                            type="text"
                                            className={profileForm.errors.emergency_contact_name ? 'has-err' : ''}
                                            value={profileForm.data.emergency_contact_name}
                                            onChange={e => profileForm.setData('emergency_contact_name', e.target.value)}
                                        />
                                        {profileForm.errors.emergency_contact_name && <div className="error">{profileForm.errors.emergency_contact_name}</div>}
                                    </div>
                                </div>
                                <div className="ap-row">
                                    <label htmlFor="emergency_contact_phone">Contact number</label>
                                    <div className="ap-field">
                                        <input
                                            id="emergency_contact_phone"
                                            type="tel"
                                            className={profileForm.errors.emergency_contact_phone ? 'has-err' : ''}
                                            placeholder="0917 123 4567"
                                            value={profileForm.data.emergency_contact_phone}
                                            onChange={e => profileForm.setData('emergency_contact_phone', e.target.value)}
                                        />
                                        {profileForm.errors.emergency_contact_phone && <div className="error">{profileForm.errors.emergency_contact_phone}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="ap-foot">
                                <span role="status" style={{ fontSize: '11.5px', fontWeight: '500', color: firstErr ? '#b3261e' : (profileForm.recentlySuccessful ? '#16a34a' : '#888') }}>
                                    {firstErr || (profileForm.recentlySuccessful ? 'Your changes were saved.' : (profileForm.isDirty ? 'You have unsaved changes' : ''))}
                                </span>
                                <button type="submit" className="ap-save" disabled={profileForm.processing}>
                                    {profileForm.processing ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </form>

                        {/* SIGN-IN */}
                        <div className="ap-card">
                            <div className="ap-band">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                Sign-in
                            </div>
                            <div className="ap-body" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                                <div className="ap-sec">
                                    <div>
                                        <div className="t">Your PIN</div>
                                        <div className="s">Used to open this profile</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {pinMsg.text && !pinOpen && (
                                            <span style={{ fontSize: '11px', fontWeight: '500', color: pinMsg.ok ? '#16a34a' : '#b3261e' }}>{pinMsg.text}</span>
                                        )}
                                        <button type="button" className="ap-ghost" onClick={() => { setPinOpen((v) => !v); setPinMsg({ ok: false, text: '' }); }}>
                                            {pinOpen ? 'Cancel' : 'Change PIN'}
                                        </button>
                                    </div>
                                </div>

                                {pinOpen && (
                                    <div style={{ display: 'grid', gap: '14px', paddingBottom: '16px' }}>
                                        <div className="ap-grid">
                                            <div className="ap-field">
                                                <label htmlFor="pin_cur">Current PIN</label>
                                                <input id="pin_cur" type="password" inputMode="numeric" maxLength={4} value={pinCur} onChange={e => { setPinCur(digits(e.target.value)); setPinMsg({ ok: false, text: '' }); }} autoComplete="off" />
                                            </div>
                                            <div className="ap-field">
                                                <label htmlFor="pin_new">New PIN</label>
                                                <input id="pin_new" type="password" inputMode="numeric" maxLength={4} value={pinNew} onChange={e => { setPinNew(digits(e.target.value)); setPinMsg({ ok: false, text: '' }); }} autoComplete="off" />
                                            </div>
                                            <div className="ap-field">
                                                <label htmlFor="pin_conf">Confirm new PIN</label>
                                                <input id="pin_conf" type="password" inputMode="numeric" maxLength={4} value={pinConf} onChange={e => { setPinConf(digits(e.target.value)); setPinMsg({ ok: false, text: '' }); }} autoComplete="off" />
                                            </div>
                                        </div>
                                        {pinMsg.text && <div style={{ fontSize: '11px', fontWeight: '500', color: pinMsg.ok ? '#16a34a' : '#b3261e' }}>{pinMsg.text}</div>}
                                        <div>
                                            <button type="button" className="ap-save" onClick={changePin} disabled={pinBusy}>Update PIN</button>
                                        </div>
                                    </div>
                                )}

                                <div className="ap-sec">
                                    <div>
                                        <div className="t">Shared login</div>
                                        <div className="s">{user.email}, same for all admins</div>
                                    </div>
                                    <button type="button" className="ap-ghost" onClick={() => setPwOpen((v) => !v)}>
                                        {pwOpen ? 'Cancel' : 'Change shared password'}
                                    </button>
                                </div>

                                {pwOpen && (
                                    <form onSubmit={submitPassword} style={{ display: 'grid', gap: '14px', paddingTop: '4px', paddingBottom: '16px' }}>
                                        <div className="ap-field">
                                            <label htmlFor="current_password">Current password</label>
                                            <input
                                                id="current_password"
                                                type="password"
                                                className={passwordForm.errors.current_password ? 'has-err' : ''}
                                                value={passwordForm.data.current_password}
                                                onChange={e => passwordForm.setData('current_password', e.target.value)}
                                                autoComplete="current-password"
                                            />
                                            {passwordForm.errors.current_password && <div className="error">{passwordForm.errors.current_password}</div>}
                                        </div>

                                        <div className="ap-grid two">
                                            <div className="ap-field">
                                                <label htmlFor="password">New password</label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    className={passwordForm.errors.password ? 'has-err' : ''}
                                                    value={passwordForm.data.password}
                                                    onChange={e => passwordForm.setData('password', e.target.value)}
                                                    autoComplete="new-password"
                                                />
                                                {passwordForm.errors.password && <div className="error">{passwordForm.errors.password}</div>}
                                            </div>
                                            <div className="ap-field">
                                                <label htmlFor="password_confirmation">Confirm new password</label>
                                                <input
                                                    id="password_confirmation"
                                                    type="password"
                                                    value={passwordForm.data.password_confirmation}
                                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <button type="submit" className="ap-save" disabled={passwordForm.processing}>
                                                Update password
                                            </button>
                                            {passwordForm.recentlySuccessful && (
                                                <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '500' }}>
                                                    Password updated.
                                                </span>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminShell>
    );
}

export default function Profile(props) {
    return <ProfileInner key={props.me.name} {...props} />;
}