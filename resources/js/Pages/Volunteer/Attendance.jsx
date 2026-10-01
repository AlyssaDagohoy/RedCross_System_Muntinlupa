import { Link, usePage, router } from '@inertiajs/react';
import FaceAttendance from '@/Components/FaceAttendance';
import { useState } from 'react';
import VolunteerShell from '../../Components/VolunteerShell';

export default function VolunteerAttendance({ auth, attendances, todayRecord, activities, availableActivities }) {
    const { flash } = usePage().props;
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Request Attendance Review
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewErr, setReviewErr] = useState('');

    const submitReview = () => {
        setReviewBusy(true);
        setReviewErr('');
        router.post(route('volunteer.attendance.request-review', selectedRecord.id), { reason: reviewReason }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedRecord(null); setReviewOpen(false); setReviewReason(''); },
            onError: (e) => setReviewErr(Object.values(e)[0] || 'Something went wrong. Please try again.'),
            onFinish: () => setReviewBusy(false),
        });
    };

    const formatTime = (datetime) => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatClock = (time) => {
        if (!time) return '-';
        // handles either "HH:mm:ss" strings or full datetimes
        const d = time.includes('T') || time.includes(' ') ? new Date(time) : new Date(`2000-01-01T${time}`);
        return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: false });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatDateShort = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // Absent = the activity ended with no time in. Ongoing = timed in, no time out yet.
    const statusOf = (record) => {
        if (record.status === 'absent') return { label: 'Absent', bg: '#fef2f2', color: '#CC0000' };
        if (record.status === 'needs_review') return { label: 'Needs Review', bg: '#fffbeb', color: '#b45309' };
        if (record.status === 'rejected') return { label: 'Rejected', bg: '#fef2f2', color: '#CC0000' };
        if (!record.time_out) return { label: 'Ongoing', bg: '#fffbeb', color: '#b45309' };
        return { label: 'Present', bg: '#f0fdf4', color: '#16a34a' };
    };

    // Newest first: by date, then by time in so the record you just made is always on top.
    const filtered = [...attendances]
        .sort((a, b) => {
            const byDate = new Date(b.date) - new Date(a.date);
            if (byDate !== 0) return byDate;
            const aIn = a.time_in ? new Date(a.time_in).getTime() : 0;
            const bIn = b.time_in ? new Date(b.time_in).getTime() : 0;
            return (bIn - aIn) || ((b.id || 0) - (a.id || 0));
        })
        .slice(0, 5);

    return (
        <VolunteerShell active="attendance" title="Attendance">

            <style>{`
                .att-table { border-collapse: collapse; width: 100%; }
                .att-table th { font-size: 10px; font-weight: 600; color: #999; text-align: left; padding: 10px 18px; background: #fafafa; border-bottom: 1px solid #f5f5f5; white-space: nowrap; }
                .att-table td { font-size: 12px; color: #333; padding: 12px 18px; border-bottom: 1px solid #f5f5f5; white-space: nowrap; }
                .att-table tbody tr { cursor: pointer; transition: background 0.1s; }
                .att-table tbody tr:hover td { background: #fafafa; }
                .att-table tbody tr:last-child td { border-bottom: none; }
            `}</style>

            {/* Flash */}
            {flash?.success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '11px 16px', marginBottom: '20px', fontSize: '12px', color: '#166534' }}>
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '11px 16px', marginBottom: '20px', fontSize: '12px', color: '#991b1b' }}>
                    {flash.error}
                </div>
            )}

            {/* Face Time In / Time Out */}
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Time In / Time Out</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                    <FaceAttendance todayRecord={todayRecord} activities={activities} availableActivities={availableActivities} faceStatus={auth.user.face_status ?? 'none'} />
                </div>
            </div>

            {/* Recent Records */}
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ebebeb', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>Recent Records</span>
                        <span style={{ fontSize: '10px', color: '#bbb', background: '#f5f5f5', padding: '2px 8px', borderRadius: '10px' }}>
                            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="att-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Activity</th>
                                <th>Attendance Method</th>
                                <th>Status</th>
                                <th>Time In</th>
                                <th>Time Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#ccc', padding: '36px', fontSize: '11px' }}>No records found</td>
                                </tr>
                            ) : (
                                filtered.map((record, i) => {
                                    const s = statusOf(record);
                                    const isAbsent = record.status === 'absent';
                                    return (
                                        <tr key={record.id || i} onClick={() => { setSelectedRecord(record); setReviewOpen(false); setReviewReason(''); setReviewErr(''); }}>
                                            <td style={{ fontWeight: '500', color: '#111' }}>{formatDate(record.date)}</td>
                                            <td style={{ color: '#333' }}>{record.activity?.name || '-'}</td>
                                            <td style={{ color: '#333' }}>{isAbsent ? '-' : ((record.attendance_method === 'fingerprint' ? 'Fingerprint' : 'Face Scan'))}</td>
                                            <td>
                                                <span style={{ background: s.bg, color: s.color, fontSize: '10.5px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px' }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td style={{ color: '#16a34a' }}>{formatTime(record.time_in)}{isLate(record) && <span style={{ marginLeft: '6px', fontSize: '9.5px', fontWeight: '700', color: '#CC0000', background: '#fef2f2', padding: '2px 6px', borderRadius: '8px' }}>Late</span>}</td>
                                            <td style={{ color: '#CC0000' }}>{formatTime(record.time_out)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer "View all" - same placement as the Dashboard cards */}
                <div style={{ padding: '10px 18px', borderTop: '1px solid #f5f5f5', textAlign: 'center' }}>
                    <Link href={route('volunteer.records')} style={{ fontSize: '10.5px', color: '#CC0000', fontWeight: '600', textDecoration: 'none' }}>
                        View all
                    </Link>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {selectedRecord && (
                <div
                    role="presentation"
                    onClick={() => setSelectedRecord(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'grid', placeItems: 'center', padding: '16px', zIndex: 300,
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '380px',
                            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        }}
                    >
                        <div style={{
                            background: 'linear-gradient(135deg, #CC0000 0%, #990000 100%)',
                            padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
                                {formatDateShort(selectedRecord.date)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedRecord(null)}
                                aria-label="Close"
                                style={{
                                    width: '26px', height: '26px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'white', flexShrink: 0,
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '14px' }}>
                                {selectedRecord.activity?.name || '-'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12.5px', color: '#444' }}>
                                <ClockDotIcon />
                                {formatClock(selectedRecord.activity?.start_time)} - {formatClock(selectedRecord.activity?.end_time)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '12.5px', color: '#444' }}>
                                <PinIcon />
                                {selectedRecord.activity?.location_name || selectedRecord.activity?.location || 'No location specified.'}
                            </div>

                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '14px 0' }} />

                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#bbb', letterSpacing: '0.5px', marginBottom: '5px' }}>ASSIGNMENT</div>
                                <div style={{ fontSize: '12.5px', color: '#333' }}>
                                    {selectedRecord.activity?.assignment || 'No assignment specified.'}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#bbb', letterSpacing: '0.5px', marginBottom: '5px' }}>DESCRIPTION</div>
                                <div style={{ fontSize: '12.5px', color: '#333' }}>
                                    {selectedRecord.activity?.description || 'No description provided.'}
                                </div>
                            </div>

                            {(() => {
                                const rec = selectedRecord;
                                const requested = !!rec.review_requested_at;
                                const reviewed = !!rec.reviewed_at;
                                const canRequest = rec.time_in && !rec.time_out
                                    && ['present', 'needs_review'].includes(rec.status) && !requested;
                                const note = { borderRadius: '8px', padding: '10px 14px', fontSize: '12px', lineHeight: '1.6', marginBottom: '12px' };

                                return (
                                    <>
                                        {reviewed && rec.admin_remark && (
                                            <div style={{ ...note, background: '#f9f9f9', color: '#333' }}>
                                                <span style={{ fontWeight: '600', color: '#CC0000' }}>Admin remark:</span> {rec.admin_remark}
                                            </div>
                                        )}
                                        {requested && !reviewed && (
                                            <div style={{ ...note, background: '#fffbeb', color: '#92400e' }}>
                                                Review request sent. Waiting for the admin.
                                            </div>
                                        )}
                                        {rec.status === 'needs_review' && !requested && !rec.time_out && (
                                            <div style={{ ...note, background: '#fffbeb', color: '#92400e' }}>
                                                No Time Out was recorded, so this record is waiting for admin review. You can add a reason below.
                                            </div>
                                        )}
                                        {canRequest && !reviewOpen && (
                                            <button type="button" onClick={() => setReviewOpen(true)} style={{
                                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CC0000',
                                                background: 'white', color: '#CC0000', fontSize: '12px', fontWeight: '600',
                                                cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px',
                                            }}>
                                                Request Attendance Review
                                            </button>
                                        )}
                                        {canRequest && reviewOpen && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#bbb', letterSpacing: '0.5px', marginBottom: '5px' }}>REASON</div>
                                                <textarea
                                                    value={reviewReason}
                                                    onChange={e => setReviewReason(e.target.value)}
                                                    rows={3}
                                                    placeholder="Example: I forgot to time out and already left the activity location."
                                                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ebebeb', borderRadius: '7px', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical' }}
                                                />
                                                {reviewErr && <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#991b1b' }}>{reviewErr}</div>}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                    <button type="button" onClick={() => setReviewOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                                    <button type="button" onClick={submitReview} disabled={reviewBusy} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#CC0000', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        {reviewBusy ? 'Sending...' : 'Send Request'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#333' }}>
                                <span style={{ color: '#CC0000', fontWeight: '600' }}>Assigned by:</span>{' '}
                                {selectedRecord.activity?.assigned_by_role || 'Branch Coordination'}
                                {selectedRecord.activity?.assigned_by_name ? ` / ${selectedRecord.activity.assigned_by_name}` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </VolunteerShell>
    );
}

// Late = timed in more than 15 minutes after the activity start (same rule as the running timer).
function isLate(record) {
    const start = record.activity?.start_time;
    if (!record.time_in || record.status === 'absent') return false;
    if (record.time_in_status) return record.time_in_status === 'late';
    if (!start) return false;
    const inDate = new Date(record.time_in);
    const [h, m] = start.split(':').map(Number);
    const scheduled = new Date(inDate);
    scheduled.setHours(h, m, 0, 0);
    return (inDate - scheduled) / 60000 > 15;
}

function ClockDotIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function PinIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}