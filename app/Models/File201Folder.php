<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class File201Folder extends Model
{
    protected $fillable = [
        'user_id',
        'parent_id',
        'name',
        'is_starred',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(File201Folder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(File201Folder::class, 'parent_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VolunteerDocument::class, 'folder_id');
    }
}