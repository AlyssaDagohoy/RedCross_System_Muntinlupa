<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class AttendanceController extends Controller
{
    private const FILTER_KEYS = [
        'search', 'volunteer_id', 'activity_id', 'location', 'date', 'date_from', 'date_to',
        'status', 'time_in_status', 'time_out_status', 'method', 'manual', 'sort',
    ];

    private const SPECIAL = ['absent', 'excused', 'needs_review', 'rejected'];

    public function index(Request $request)
    {
        Attendance::markAbsences();

        // Attendance that needs an admin decision (missing Time Outs and review requests).
        Attendance::closeMissingTimeOuts();
        $attendanceReviews = Attendance::with(['user', 'activity'])
            ->where('status', 'needs_review')
            ->where(fn ($q) => $q->whereNull('attendance_method')->orWhere('attendance_method', '!=', 'dtr'))
            ->orderBy('date', 'desc')
            ->get();

        $attendances = $this->fetch($request);

        $volunteers = User::role('volunteer')
            ->where('status', 'approved')
            ->get(['id', 'name', 'email']);

        $activities = Activity::orderBy('date', 'desc')
            ->get(['id', 'name', 'date']);

        // Filter choices come straight from the data, so nothing is hardcoded.
        $options = [
            'time_in_status'  => Attendance::whereNotNull('time_in_status')->distinct()->pluck('time_in_status')->values(),
            'time_out_status' => Attendance::whereNotNull('time_out_status')->distinct()->pluck('time_out_status')->values(),
            'method'          => Attendance::whereNotNull('attendance_method')->distinct()->pluck('attendance_method')->values(),
            'location'        => Activity::whereNotNull('location_name')->distinct()->orderBy('location_name')->pluck('location_name')->values(),
        ];

        return Inertia::render('Admin/Attendance', [
            'attendanceReviews' => $attendanceReviews,
            'dtrSubmissions' => \App\Models\DtrSubmission::with(['user', 'activity'])->where('status', 'pending')->latest()->get()->map(fn ($d) => $d->toUi())->values(),
            'attendances' => $attendances,
            'volunteers'  => $volunteers,
            'activities'  => $activities,
            'options'     => $options,
            'counts'      => $this->statusCounts($request),
            'total'       => Attendance::count(),
            'filters'     => $request->only(self::FILTER_KEYS),
        ]);
    }

    private const EXPORT_COLUMNS = [
        'date'     => 'Date',
        'name'     => 'Name',
        'activity' => 'Activity',
        'atime'    => 'Activity Time',
        'location' => 'Location',
        'assigned' => 'Assigned By',
        'in'       => 'Time In',
        'out'      => 'Time Out',
        'method'   => 'Method',
        'hours'    => 'Hours',
        'status'   => 'Status',
    ];

    private const ESSENTIAL_COLUMNS = ['date', 'name', 'activity', 'in', 'out', 'hours', 'status'];

    // Columns picked on the page, kept in table order. Name is always included.
    private function exportColumns(Request $request): array
    {
        $asked = array_filter(explode(',', (string) $request->query('cols', '')));
        if (!$asked) {
            $asked = self::ESSENTIAL_COLUMNS;
        }

        return array_values(array_filter(
            array_keys(self::EXPORT_COLUMNS),
            fn ($k) => $k === 'name' || in_array($k, $asked, true)
        ));
    }

    private function exportCell($record, string $key, bool $forExcel = false)
    {
        switch ($key) {
            case 'date':
                return $record->date ? date('M d, Y', strtotime($record->date)) : '-';
            case 'name':
                return $record->user ? $record->user->name : '-';
            case 'activity':
                return $record->activity ? $record->activity->name : '-';
            case 'atime':
                return $this->activityTime($record);
            case 'location':
                if (!$record->activity) {
                    return '-';
                }
                if ($record->activity->type === 'branch') {
                    return 'Branch';
                }
                return $record->activity->location_name ?: '-';
            case 'assigned':
                return ($record->activity && $record->activity->assigned_by) ? $record->activity->assigned_by : '-';
            case 'in':
                return $record->time_in ? date('h:i A', strtotime($record->time_in)) : '-';
            case 'out':
                return $record->time_out ? date('h:i A', strtotime($record->time_out)) : '-';
            case 'method':
                $m = strtolower((string) $record->attendance_method);
                if (str_contains($m, 'finger')) {
                    return 'Fingerprint';
                }
                if ($m === 'dtr') {
                    return 'DTR';
                }
                if ($m === 'manual') {
                    return 'Admin review';
                }
                if (str_contains($m, 'fallback')) {
                    return 'Fallback';
                }
                if (str_contains($m, 'face') || str_contains($m, 'facial')) {
                    return 'Face recognition';
                }
                return '-';
            case 'hours':
                if (!$record->hours_rendered) {
                    return '-';
                }
                return $forExcel ? $record->hours_rendered : $record->hours_rendered . ' hrs';
            case 'status':
                return $this->statusLabel($record);
        }

        return '-';
    }

    public function exportPdf(Request $request)
    {
        Attendance::markAbsences();

        $attendances = $this->fetch($request);
        $totalHours = $attendances->sum('hours_rendered');
        $keys = $this->exportColumns($request);

        $pdf = Pdf::loadHTML($this->generatePdfHtml($attendances, $totalHours, $keys))
            ->setPaper('a4', 'landscape');

        return $pdf->download('attendance-report-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        Attendance::markAbsences();

        $attendances = $this->fetch($request);
        $keys = $this->exportColumns($request);
        $headings = array_map(fn ($k) => self::EXPORT_COLUMNS[$k], $keys);

        $data = [];
        foreach ($attendances as $record) {
            $data[] = array_map(fn ($k) => $this->exportCell($record, $k, true), $keys);
        }

        $export = new class($data, $headings) implements FromArray, WithHeadings, ShouldAutoSize {
            public function __construct(private array $data, private array $headings) {}

            public function array(): array
            {
                return $this->data;
            }

            public function headings(): array
            {
                return $this->headings;
            }
        };

        return Excel::download($export, 'attendance-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    // Filtered and sorted records, used by the page, the PDF and the Excel export.
    private function fetch(Request $request)
    {
        $rows = $this->filteredQuery($request)->get();

        if ($request->sort === 'name') {
            $rows = $rows->sortBy(fn ($r) => strtolower($r->user->name ?? ''))->values();
        }

        return $rows;
    }

    // Counts for the status pills. They follow every filter except the status itself.
    private function statusCounts(Request $request)
    {
        $rows = $this->filteredQuery($request, false)->get();

        $counts = [
            'all' => $rows->count(), 'present' => 0, 'absent' => 0,
            'excused' => 0, 'needs_review' => 0, 'rejected' => 0,
        ];

        foreach ($rows as $r) {
            $key = $this->statusKey($r);
            if ($key === 'ongoing') {
                $key = 'present';
            }
            $counts[$key]++;
        }

        return $counts;
    }

    private function filteredQuery(Request $request, bool $applyStatus = true)
    {
        $query = Attendance::with(['user', 'activity']);

        if ($request->sort === 'oldest') {
            $query->orderBy('date', 'asc')->orderBy('id', 'asc');
        } elseif ($request->sort === 'hours') {
            $query->orderBy('hours_rendered', 'desc')->orderBy('date', 'desc');
        } else {
            $query->orderBy('date', 'desc')->orderBy('id', 'desc');
        }

        if ($request->filled('volunteer_id')) {
            $query->where('user_id', $request->volunteer_id);
        }

        if ($request->filled('activity_id')) {
            $query->where('activity_id', $request->activity_id);
        }

        if ($request->filled('location')) {
            $location = $request->location;
            $query->whereHas('activity', fn ($a) => $a->where('location_name', $location));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', $term))
                  ->orWhereHas('activity', fn ($a) => $a->where('name', 'like', $term)
                        ->orWhere('location_name', 'like', $term));
            });
        }

        if ($applyStatus && $request->filled('status')) {
            $status = $request->status;

            if (in_array($status, self::SPECIAL, true)) {
                $query->where('status', $status);
            } elseif ($status === 'present') {
                // Present includes volunteers who are still timed in.
                $query->where(function ($q) {
                    $q->whereNull('status')->orWhereNotIn('status', self::SPECIAL);
                });
            }
        }

        if ($request->filled('time_in_status')) {
            $this->tagFilter($query, 'time_in_status', $request->time_in_status);
        }

        if ($request->filled('time_out_status')) {
            if ($request->time_out_status === 'none') {
                $query->whereNull('time_out');
            } else {
                $this->tagFilter($query, 'time_out_status', $request->time_out_status);
            }
        }

        if ($request->filled('method')) {
            $this->tagFilter($query, 'attendance_method', $request->method);
        }

        // Manual entries = records an admin edited or reviewed.
        if ($request->boolean('manual')) {
            $query->whereNotNull('reviewed_by');
        }

        return $query;
    }

    // Matches even if the database says on_time, on time or On-Time.
    private function tagFilter($query, string $column, string $value)
    {
        $value = strtolower(str_replace(['_', '-'], ' ', trim($value)));
        $query->whereRaw("LOWER(REPLACE(REPLACE({$column}, '_', ' '), '-', ' ')) = ?", [$value]);
    }

    private function statusKey($record)
    {
        if (in_array($record->status, self::SPECIAL, true)) {
            return $record->status;
        }

        return $record->time_out ? 'present' : 'ongoing';
    }

    private function statusLabel($record)
    {
        return match ($this->statusKey($record)) {
            'absent'       => 'Absent',
            'excused'      => 'Excused',
            'needs_review' => 'Needs Review',
            'rejected'     => 'Rejected',
            'ongoing'      => 'Ongoing',
            default        => 'Present',
        };
    }

    // The set schedule, so the reader can compare it with the Time In.
    private function activityTime($record)
    {
        if ($record->activity && $record->activity->start_time && $record->activity->end_time) {
            return date('g:i A', strtotime($record->activity->start_time))
                . ' - ' . date('g:i A', strtotime($record->activity->end_time));
        }

        return '-';
    }

    private function generatePdfHtml($attendances, $totalHours, array $keys)
    {
        $head = '';
        foreach ($keys as $k) {
            $head .= '<th>' . e(self::EXPORT_COLUMNS[$k]) . '</th>';
        }

        $rows = '';
        foreach ($attendances as $record) {
            $rows .= '<tr>';
            foreach ($keys as $k) {
                $value = e($this->exportCell($record, $k));
                $style = '';
                if ($k === 'in') {
                    $style = " style='color: green'";
                } elseif ($k === 'out') {
                    $style = $record->time_out ? " style='color: red'" : " style='color: #666'";
                }
                $rows .= "<td{$style}>{$value}</td>";
            }
            $rows .= '</tr>';
        }

        $size = count($keys) > 8 ? '10px' : '12px';

        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; font-size: {$size}; color: #111; }
                .header { text-align: center; margin-bottom: 24px; }
                .header h1 { font-size: 20px; color: #DC2626; margin: 0; }
                .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #DC2626; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
                td { padding: 9px 8px; border-bottom: 1px solid #f0f0f0; font-size: {$size}; }
                tr:nth-child(even) { background: #f9fafb; }
                .footer { margin-top: 20px; font-size: 11px; color: #888; text-align: right; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>Philippine Red Cross - Muntinlupa Chapter</h1>
                <p>Volunteer Attendance Report | Generated: " . now()->format('F d, Y h:i A') . "</p>
            </div>
            <table>
                <thead>
                    <tr>{$head}</tr>
                </thead>
                <tbody>
                    {$rows}
                </tbody>
            </table>
            <div class='footer'>
                Total Records: {$attendances->count()} | Total Hours Rendered: {$totalHours} hrs
            </div>
        </body>
        </html>";
    }}
