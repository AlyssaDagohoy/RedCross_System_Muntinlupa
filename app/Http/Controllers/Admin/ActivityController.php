<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    /**
     * Tidy a name for comparing: lowercase, trimmed, repeated spaces collapsed.
     * "Blood  Drive " and "blood drive" become the same value.
     */
    private function normalizeName($name): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', (string) $name)));
    }

    /**
     * Validation rule: fails if another activity already has the same name
     * (ignoring uppercase/lowercase and extra spaces).
     */
    private function uniqueNameRule(?int $ignoreId = null): \Closure
    {
        return function ($attribute, $value, $fail) use ($ignoreId) {
            $wanted = $this->normalizeName($value);

            $existing = Activity::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->pluck('name')
                ->first(fn ($name) => $this->normalizeName($name) === $wanted);

            if ($existing !== null) {
                $fail('An activity named "' . $existing . '" already exists. Please use a different name.');
            }
        };
    }

    public function index()
    {
        Activity::syncStatuses();
        $activities = Activity::with('volunteers')->latest()->get();
        return Inertia::render('Admin/Activities/Index', [
            'activities' => $activities,
        ]);
    }

    public function create()
    {
        $volunteers = User::role('volunteer')
            ->where('status', 'approved')
            ->get(['id', 'name', 'email']);
        return Inertia::render('Admin/Activities/Create', [
            'defaultType'   => request('type', 'field'),
            'volunteers'    => $volunteers,
            'existingNames' => Activity::pluck('name'),
        ]);
    }

    public function store(Request $request)
    {
        // Save the name tidy: trimmed, with single spaces only.
        $request->merge([
            'name' => preg_replace('/\s+/u', ' ', trim((string) $request->input('name'))),
        ]);

        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255', $this->uniqueNameRule()],
            'description'     => 'nullable|string',
            'assigned_by'     => 'nullable|string|max:255',
            'date'            => 'required|date',
            'start_time'      => 'required',
            'end_time'        => 'required',
            'location_name'   => 'required|string',
            'latitude'        => 'required|numeric',
            'longitude'       => 'required|numeric',
            'radius_meters'   => 'integer|in:500',
            'status'          => 'in:upcoming,ongoing,completed,cancelled',
            'type'          => 'sometimes|in:field,branch',
            'volunteer_ids'   => 'array',
            'volunteer_ids.*' => 'exists:users,id',
        ]);

        $activity = Activity::create($validated);
        Activity::syncStatuses();

        if (!empty($validated['volunteer_ids'])) {
            $activity->volunteers()->sync($validated['volunteer_ids']);
        }

        return redirect()->route('admin.activities.index')
            ->with('success', 'Activity created successfully!');
    }

    public function edit(Activity $activity)
    {
        $volunteers = User::role('volunteer')
            ->where('status', 'approved')
            ->get(['id', 'name', 'email']);
        $activity->load('volunteers');
        return Inertia::render('Admin/Activities/Edit', [
            'activity'      => $activity,
            'volunteers'    => $volunteers,
            // Every other activity's name (this activity is left out so it can keep its own name)
            'existingNames' => Activity::where('id', '!=', $activity->id)->pluck('name'),
        ]);
    }

    public function update(Request $request, Activity $activity)
    {
        $request->merge([
            'name' => preg_replace('/\s+/u', ' ', trim((string) $request->input('name'))),
        ]);

        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255', $this->uniqueNameRule($activity->id)],
            'description'     => 'nullable|string',
            'assigned_by'     => 'nullable|string|max:255',
            'date'            => 'required|date',
            'start_time'      => 'required',
            'end_time'        => 'required',
            'location_name'   => 'required|string',
            'latitude'        => 'required|numeric',
            'longitude'       => 'required|numeric',
            'radius_meters'   => 'integer|in:500',
            'status'          => 'in:upcoming,ongoing,completed,cancelled',
            'type'          => 'sometimes|in:field,branch',
            'volunteer_ids'   => 'array',
            'volunteer_ids.*' => 'exists:users,id',
        ]);

        $activity->update($validated);
        Activity::syncStatuses();
        $activity->volunteers()->sync($validated['volunteer_ids'] ?? []);

        return redirect()->route('admin.activities.index')
            ->with('success', 'Activity updated successfully!');
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();
        return redirect()->route('admin.activities.index')
            ->with('success', 'Activity deleted successfully!');
    }
}
