import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import VolunteerShell, { safeRoute, useVolunteerShell, faceStatusLabel } from '../../Components/VolunteerShell';

/*
  Props from the controller (`profile` is the volunteer's record):
    profile = {
      volunteer_id, status, date_joined,
      contact_number, address, birthdate (YYYY-MM-DD), gender,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_number,
      photo_url
    }
*/

const PH_MOBILE = /^(09|\+639)\d{9}$/;
const isPhone = (v = '') => PH_MOBILE.test(v.replace(/[\s-]/g, ''));

function validate(d) {
    const e = {};
    if (!isPhone(d.contact_number)) e.contact_number = 'Enter a Philippine mobile number, like 0917 123 4567.';
    if ((d.address || '').trim().length < 10) e.address = 'Enter your complete address, including barangay and city.';
    if (!d.birthdate) e.birthdate = 'Select your birthdate.';
    else if (new Date(d.birthdate) > new Date()) e.birthdate = 'Birthdate cannot be in the future.';
    if (!d.gender) e.gender = 'Select an option.';
    if ((d.emergency_contact_name || '').trim().length < 2) e.emergency_contact_name = 'Enter the full name of your emergency contact.';
    if (!(d.emergency_contact_relationship || '').trim()) e.emergency_contact_relationship = 'Enter how this person is related to you.';
    if (!isPhone(d.emergency_contact_number)) e.emergency_contact_number = 'Enter a Philippine mobile number, like 0917 123 4567.';
    return e;
}

export default function VolunteerProfile({ auth, profile }) {
    return (
        <VolunteerShell active="profile" title="Profile">
            <ProfileBody user={auth.user} profile={profile || {}} />
        </VolunteerShell>
    );
}

function ProfileBody({ user, profile }) {
    const { setup, openFace, showToast } = useVolunteerShell();
    const { data, setData, post, transform, processing, errors, clearErrors } = useForm({
        contact_number: profile.contact_number || '',
        address: profile.address || '',
        birthdate: profile.birthdate || '',
        gender: profile.gender || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_relationship: profile.emergency_contact_relationship || '',
        emergency_contact_number: profile.emergency_contact_number || '',
        photo: null,
    });
    const [clientErrors, setClientErrors] = useState({});
    const [photoPreview, setPhotoPreview] = useState(profile.photo_url || null);
    const [photoError, setPhotoError] = useState('');

    useEffect(() => () => {
        if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    }, [photoPreview]);

    const err = (k) => clientErrors[k] || errors[k];

    const change = (k) => (e) => {
        setData(k, e.target.value);
        if (clientErrors[k]) setClientErrors((c) => ({ ...c, [k]: undefined }));
        if (errors[k]) clearErrors(k);
    };

    const pickPhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
            setPhotoError('Choose an image (JPG or PNG) under 2 MB.');
            return;
        }
        setPhotoError('');
        setData('photo', file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();
        const found = validate(data);
        setClientErrors(found);
        const first = Object.keys(found)[0];
        if (first) {
            document.getElementById(`f-${first}`)?.focus();
            return;
        }
        const wasFirstTime = !setup.profile_completed;
        // Laravel route is PATCH, so _method must be 'patch' (not 'put') or it 405s.
        transform((d) => ({ ...d, _method: 'patch' }));
        post(safeRoute('volunteer.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => showToast(wasFirstTime ? 'Profile setup completed. Thank you!' : 'Your changes were saved.'),
        });
    };

    const input = (k, extra = {}) => ({
        id: `f-${k}`,
        className: 'vp-input',
        value: data[k],
        onChange: change(k),
        'aria-invalid': err(k) ? 'true' : undefined,
        'aria-describedby': err(k) ? `f-${k}-err` : undefined,
        style: { ...inputStyle, ...(err(k) ? { borderColor: '#b3261e', background: '#fff8f7' } : {}) },
        ...extra,
    });

    const today = new Date().toISOString().slice(0, 10);
    const joined = profile.date_joined || (user.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');

    return (
        <>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>Volunteer Profile</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                    {setup.profile_completed ? 'Keep your details up to date.' : 'Profile setup is required. Complete every field below to continue using the portal.'}
                </div>
            </div>

            {!setup.profile_completed && (
                <div role="region" aria-label="Profile setup required" style={{ background: '#fff5f5', border: '1px solid #f5c6c6', borderLeft: '4px solid #CC0000', borderRadius: '10px', padding: '13px 18px', marginBottom: '16px', fontSize: '11.5px', color: '#555' }}>
                    <strong style={{ color: '#111', fontWeight: '600' }}>Profile setup required.</strong> Save this form to finish your account setup.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '12px', alignItems: 'start' }}>
                <form onSubmit={submit} noValidate style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Your details</span>
                    </div>

                    <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                        <Field id="f-name" label="Full name">
                            <input id="f-name" value={user.name || ''} readOnly style={readOnlyStyle} />
                        </Field>
                        <Field id="f-email" label="Email address">
                            <input id="f-email" value={user.email || ''} readOnly style={readOnlyStyle} />
                        </Field>

                        <Field id="f-contact_number" label="Contact number" error={err('contact_number')}>
                            <input {...input('contact_number', { type: 'tel', inputMode: 'tel', placeholder: '0917 123 4567', autoComplete: 'tel' })} />
                        </Field>
                        <Field id="f-birthdate" label="Birthdate" error={err('birthdate')}>
                            <input {...input('birthdate', { type: 'date', max: today })} />
                        </Field>

                        <div style={{ gridColumn: 'span 2' }}>
                            <Field id="f-address" label="Address" error={err('address')} hint="House no., street, barangay, city or municipality.">
                                <input {...input('address', { autoComplete: 'street-address' })} />
                            </Field>
                        </div>

                        <Field id="f-gender" label="Gender" error={err('gender')}>
                            <select {...input('gender')}>
                                <option value="">Select</option>
                                <option>Female</option>
                                <option>Male</option>
                                <option>Prefer not to say</option>
                            </select>
                        </Field>
                    </div>

                    <div style={{ padding: '14px 18px', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5', background: '#fcfcfc' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Emergency contact</span>
                    </div>

                    <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                        <Field id="f-emergency_contact_name" label="Full name" error={err('emergency_contact_name')}>
                            <input {...input('emergency_contact_name')} />
                        </Field>
                        <Field id="f-emergency_contact_relationship" label="Relationship" error={err('emergency_contact_relationship')}>
                            <input {...input('emergency_contact_relationship', { placeholder: 'Mother, spouse, sibling…' })} />
                        </Field>
                        <Field id="f-emergency_contact_number" label="Contact number" error={err('emergency_contact_number')}>
                            <input {...input('emergency_contact_number', { type: 'tel', inputMode: 'tel', placeholder: '0917 123 4567' })} />
                        </Field>
                    </div>

                    <div style={{ padding: '14px 18px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={processing} className="btn-view" style={{ background: '#CC0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '11.5px', fontWeight: '600', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.7 : 1, fontFamily: 'inherit' }}>
                            {processing ? 'Saving…' : setup.profile_completed ? 'Save changes' : 'Complete profile setup'}
                        </button>
                    </div>
                </form>

                {/* Account column */}
                <aside aria-label="Account information" style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', padding: '22px 18px', textAlign: 'center' }}>
                    <div style={{ width: '92px', height: '92px', borderRadius: '50%', margin: '0 auto 12px', background: '#fff0f0', color: '#CC0000', fontSize: '28px', fontWeight: '600', display: 'grid', placeItems: 'center', overflow: 'hidden', border: '3px solid white', boxShadow: '0 0 0 1px #ebebeb' }}>
                        {photoPreview ? <img src={photoPreview} alt="Your profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span aria-hidden="true">{user.name?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <label style={{ display: 'inline-block', position: 'relative', fontSize: '10.5px', fontWeight: '600', color: '#CC0000', border: '1px solid #f0c8c8', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                        {photoPreview ? 'Change photo' : 'Upload photo'}
                        <input type="file" accept="image/*" onChange={pickPhoto} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                    </label>
                    {(photoError || errors.photo) && <p role="alert" style={{ fontSize: '10.5px', color: '#b3261e', fontWeight: '500', marginTop: '8px' }}>{photoError || errors.photo}</p>}

                    <dl style={{ margin: '18px 0 0', textAlign: 'left' }}>
                        <Row label="Volunteer ID">{profile.volunteer_id || '—'}</Row>
                        <Row label="Volunteer status">{profile.status || 'Approved'}</Row>
                        <Row label="Date joined">{joined}</Row>
                        <Row label="Profile setup">
                            <Pill ok={setup.profile_completed}>{setup.profile_completed ? 'Completed' : 'Not Yet Completed'}</Pill>
                        </Row>
                        <Row label="Face registration">
                            <Pill ok={setup.face_done}>{setup.face_done ? 'Registered' : faceStatusLabel(setup)}</Pill>
                            {setup.face_needed && (
                                <div>
                                    <button type="button" onClick={openFace} className="btn-view" style={{ marginTop: '8px', fontSize: '10px', fontWeight: '600', color: 'white', background: '#CC0000', border: 'none', borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Register My Face</button>
                                </div>
                            )}
                        </Row>
                    </dl>
                    <p style={{ fontSize: '10px', color: '#aaa', marginTop: '14px', lineHeight: 1.55, textAlign: 'left' }}>
                        Volunteer ID, status and date joined are managed by the Red Cross and cannot be edited.
                    </p>
                </aside>
            </div>
        </>
    );
}

/* ---------------- small pieces ---------------- */

const inputStyle = { width: '100%', border: '1px solid #e2e2e2', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', background: 'white', color: '#222', fontFamily: 'inherit', minHeight: '38px' };
const readOnlyStyle = { ...inputStyle, background: '#f5f5f6', color: '#888', border: '1px solid #ebebeb' };

function Field({ id, label, error, hint, children }) {
    return (
        <div>
            <label htmlFor={id} style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#333', marginBottom: '5px' }}>{label}</label>
            {children}
            {hint && !error && <p style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>{hint}</p>}
            {error && <p id={`${id}-err`} style={{ fontSize: '10.5px', color: '#b3261e', fontWeight: '500', marginTop: '4px' }}>{error}</p>}
        </div>
    );
}

function Row({ label, children }) {
    return (
        <div style={{ padding: '10px 0', borderTop: '1px solid #f5f5f5' }}>
            <dt style={{ fontSize: '10px', color: '#aaa', marginBottom: '3px' }}>{label}</dt>
            <dd style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: '#111' }}>{children}</dd>
        </div>
    );
}

function Pill({ ok, children }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '10px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px',
            background: ok ? '#f0fdf4' : '#fffbeb', color: ok ? '#16a34a' : '#b45309',
        }}>
            <span aria-hidden="true">{ok ? '✓' : '●'}</span>
            {children}
        </span>
    );
}