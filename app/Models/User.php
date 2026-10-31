<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;

#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'birthdate',
        'gender',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone',
        'photo',
        'face_descriptor',
        'face_status',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birthdate' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (User $user) {
            if (empty($user->biometric_id)) {
                $user->forceFill(['biometric_id' => $user->id])->saveQuietly();
            }
        });
    }
    public function activities()
    {
        return $this->belongsToMany(Activity::class, 'activity_volunteer');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

public function isProfileComplete(): bool
    {
        return filled($this->phone)
            && filled($this->address)
            && filled($this->birthdate)
            && filled($this->gender)
            && filled($this->emergency_contact_name)
            && filled($this->emergency_contact_relationship)
            && filled($this->emergency_contact_phone);
    }
}
