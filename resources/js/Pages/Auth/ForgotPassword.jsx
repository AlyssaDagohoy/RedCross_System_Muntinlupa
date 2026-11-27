import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
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

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            {step === 'email' ? (
                <form onSubmit={sendCode}>
                    <div className="mb-4 text-sm text-gray-600">
                        Enter your email and we will send you a 6-digit code. Keep this page open, then type the code here.
                    </div>

                    <TextInput
                        type="email"
                        name="email"
                        value={emailForm.data.email}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => emailForm.setData('email', e.target.value)}
                    />
                    <InputError message={emailForm.errors.email} className="mt-2" />

                    <div className="mt-4 flex items-center justify-end">
                        <PrimaryButton className="ms-4" disabled={emailForm.processing}>
                            Send code
                        </PrimaryButton>
                    </div>
                </form>
            ) : (
                <form onSubmit={submitReset}>
                    <div className="mb-4 text-sm text-gray-600">
                        We sent a 6-digit code to <strong>{resetForm.data.email}</strong>. It expires in 10 minutes. You can read the email on any device, then type the code below.
                    </div>

                    <div>
                        <InputLabel htmlFor="code" value="6-digit code" />
                        <TextInput
                            id="code"
                            type="text"
                            name="code"
                            inputMode="numeric"
                            maxLength={6}
                            value={resetForm.data.code}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) => resetForm.setData('code', e.target.value.replace(/\D/g, ''))}
                        />
                        <InputError message={resetForm.errors.code} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="New password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={resetForm.data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => resetForm.setData('password', e.target.value)}
                        />
                        <InputError message={resetForm.errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Confirm new password" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={resetForm.data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => resetForm.setData('password_confirmation', e.target.value)}
                        />
                        <InputError message={resetForm.errors.password_confirmation} className="mt-2" />
                        <InputError message={resetForm.errors.email} className="mt-2" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <button type="button" className="text-sm text-gray-600 underline" onClick={() => setStep('email')}>
                            Use a different email
                        </button>
                        <PrimaryButton disabled={resetForm.processing}>
                            Reset password
                        </PrimaryButton>
                    </div>
                </form>
            )}

            <div className="mt-6 text-center text-sm">
                <Link href={route('login')} className="text-gray-600 underline">Back to login</Link>
            </div>
        </GuestLayout>
    );
}