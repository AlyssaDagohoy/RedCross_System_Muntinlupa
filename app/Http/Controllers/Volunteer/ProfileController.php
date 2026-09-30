<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit()
    {
        $user = Auth::user();

        return Inertia::render('Volunteer/Profile', [
            'profile' => [
                'contact_number'                 => $user->phone,
                'address'                         => $user->address,
                'birthdate'                       => $user->birthdate?->format('Y-m-d'),
                'gender'                          => $user->gender,
                'emergency_contact_name'          => $user->emergency_contact_name,
                'emergency_contact_relationship'  => $user->emergency_contact_relationship,
                'emergency_contact_number'        => $user->emergency_contact_phone,
                'photo_url'                       => $user->photo ? Storage::disk('public')->url($user->photo) : null,
                'volunteer_id'                    => $user->id,
                'status'                          => $user->status ?? 'Approved',
                'date_joined'                     => $user->created_at?->format('F j, Y'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'contact_number'                  => 'nullable|string|max:20',
            'address'                         => 'nullable|string|max:500',
            'birthdate'                       => 'nullable|date',
            'gender'                          => 'nullable|string|max:30',
            'emergency_contact_name'          => 'nullable|string|max:100',
            'emergency_contact_relationship'  => 'nullable|string|max:100',
            'emergency_contact_number'        => 'nullable|string|max:20',
            'photo'                           => 'nullable|image|max:2048',
        ]);

        $toSave = [
            'phone'                          => $validated['contact_number'] ?? null,
            'address'                        => $validated['address'] ?? null,
            'birthdate'                      => $validated['birthdate'] ?? null,
            'gender'                         => $validated['gender'] ?? null,
            'emergency_contact_name'         => $validated['emergency_contact_name'] ?? null,
            'emergency_contact_relationship' => $validated['emergency_contact_relationship'] ?? null,
            'emergency_contact_phone'        => $validated['emergency_contact_number'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            $toSave['photo'] = $request->file('photo')->store('photos', 'public');
        }

        $user->update($toSave);

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