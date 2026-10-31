<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AdminStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProfileController extends Controller
{
    private const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not sure'];

    private const FIELDS = [
        'title', 'personal_email', 'phone', 'birthdate', 'blood_type',
        'address', 'emergency_contact_name', 'emergency_contact_phone',
    ];

    public function edit()
    {
        $name = (string) session('admin_profile');
        $row  = $name !== '' ? DB::table('admin_profile_details')->where('name', $name)->first() : null;

        $me = ['name' => $name, 'photo' => $row->photo ?? null];
        foreach (self::FIELDS as $f) {
            $me[$f] = $row->$f ?? '';
        }

        return Inertia::render('Admin/Profile', [
            'user' => Auth::user(),
            'me'   => $me,
        ]);
    }

    public function update(Request $request)
    {
        $old = (string) session('admin_profile');
        abort_if($old === '', 403);

        $request->merge(['name' => AdminStaff::tidy((string) $request->input('name'))]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', function ($attribute, $value, $fail) {
                if (! AdminStaff::isFullName((string) $value)) {
                    $fail('Enter first and last name, like Maria Santos.');
                }
            }],
            'title'                   => 'nullable|string|max:100',
            'personal_email'          => 'nullable|email|max:255',
            'phone'                   => 'nullable|string|max:20',
            'birthdate'               => 'nullable|date|before_or_equal:today',
            'blood_type'              => ['nullable', Rule::in(self::BLOOD_TYPES)],
            'address'                 => 'nullable|string|max:500',
            'emergency_contact_name'  => 'nullable|string|max:100',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'photo'                   => 'nullable|image|max:2048',
        ]);

        $new = $validated['name'];

        if (strcasecmp($new, $old) !== 0
            && collect(AdminStaff::all())->contains(fn ($s) => strcasecmp($s, $new) === 0)) {
            throw ValidationException::withMessages(['name' => 'That name is already used by another admin.']);
        }

        DB::transaction(function () use ($old, $new, $validated, $request) {
            if ($new !== $old) {
                AdminStaff::rename($old, $new);
            }

            $row  = DB::table('admin_profile_details')->where('name', $new)->first();
            $data = collect($validated)->only(self::FIELDS)->all();

            if ($request->hasFile('photo')) {
                if ($row && $row->photo) {
                    Storage::disk('public')->delete($row->photo);
                }
                $data['photo'] = $request->file('photo')->store('photos', 'public');
            }

            if ($row) {
                DB::table('admin_profile_details')->where('name', $new)->update($data + ['updated_at' => now()]);
            } else {
                DB::table('admin_profile_details')->insert($data + ['name' => $new, 'created_at' => now(), 'updated_at' => now()]);
            }
        });

        if ($new !== $old) {
            session(['admin_profile' => $new]);
        }

        return back()->with('success', 'Profile updated successfully!');
    }

    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'          => ['required', 'confirmed', Password::min(8)],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password updated successfully!');
    }
}