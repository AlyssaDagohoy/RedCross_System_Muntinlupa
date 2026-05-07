import { Head, Link, usePage } from '@inertiajs/react';
import FaceAttendance from '@/Components/FaceAttendance';

export default function VolunteerAttendance({ attendances, todayRecord, totalHours, activities }) {
    const { flash } = usePage().props;

    const formatTime = (datetime) => {
        if (!datetime) return '—';
        return new Date(datetime).toLocaleTimeString('en-PH', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <>
            <Head title="Attendance" />
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />

            <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Source Sans 3', sans-serif" }}>

                {/* NAV */}
                <nav style={{
                    background: '#111', padding: '14px 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', background: '#DC2626',
                            borderRadius: '4px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '900'
                        }}>+</div>
                        <span style={{
                            fontFamily: 'Oswald, sans-serif',
                            color: 'white', fontSize: '16px', fontWeight: '600', letterSpacing: '1px'
                        }}>RED CROSS — Volunteer Portal</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <Link href={route('volunteer.dashboard')} style={{
                            color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none'
                        }}>← Dashboard</Link>
                        <Link href={route('logout')} method="post" as="button" style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.7)', padding: '7px 18px',
                            borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                        }}>Log Out</Link>
                    </div>
                </nav>

                <div style={{ padding: '40px 32px', maxWidth: '860px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            fontSize: '11px', fontWeight: '600', letterSpacing: '2px',
                            textTransform: 'uppercase', color: '#DC2626', marginBottom: '6px'
                        }}>Volunteer Portal</div>
                        <h1 style={{
                            fontFamily: 'Oswald, sans-serif',
                            fontSize: '32px', color: '#111', fontWeight: '600',
                            textTransform: 'uppercase', margin: 0
                        }}>Attendance</h1>
                    </div>

                    {/* Flash messages */}
                    {flash?.success && (
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '6px', padding: '12px 16px',
                            marginBottom: '20px', fontSize: '13px', color: '#166534'
                        }}>✅ {flash.success}</div>
                    )}
                    {flash?.error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '6px', padding: '12px 16px',
                            marginBottom: '20px', fontSize: '13px', color: '#991b1b'
                        }}>⚠️ {flash.error}</div>
                    )}

                    {/* Face Attendance Card */}
                    <FaceAttendance
                        todayRecord={todayRecord}
                        activities={activities}
                    />

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#DC2626', fontWeight: '600' }}>
                                {attendances.length}
                            </div>
                            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Total Days Present</div>
                        </div>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: '#DC2626', fontWeight: '600' }}>
                                {parseFloat(totalHours || 0).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Total Hours Rendered</div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8e8e8' }}>
                            <div style={{
                                fontFamily: 'Oswald, sans-serif', fontSize: '16px',
                                color: '#111', fontWeight: '600', textTransform: 'uppercase'
                            }}>Attendance History</div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    {['Date', 'Activity', 'Time In', 'Time Out', 'Hours'].map(h => (
                                        <th key={h} style={{
                                            padding: '12px 24px', textAlign: 'left',
                                            fontSize: '11px', fontWeight: '600',
                                            textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{
                                            padding: '32px', textAlign: 'center',
                                            color: '#aaa', fontSize: '14px'
                                        }}>No attendance records yet.</td>
                                    </tr>
                                ) : attendances.map((record) => (
                                    <tr key={record.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', color: '#111' }}>{formatDate(record.date)}</td>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', color: '#111' }}>{record.activity?.name ?? '—'}</td>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', color: '#16a34a' }}>{formatTime(record.time_in)}</td>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', color: '#DC2626' }}>{formatTime(record.time_out)}</td>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', color: '#111' }}>{record.hours_rendered ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}