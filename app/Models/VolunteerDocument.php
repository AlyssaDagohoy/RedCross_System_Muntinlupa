<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerDocument extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'user_id',
        'file_request_id',
        'document_request_id',
        'folder_id',
        'name',
        'original_name',
        'type',
        'path',
        'is_starred',
        'is_archived',
        'archived_at',
        'is_copy',
        'copied_from_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(File201Folder::class, 'folder_id');
    }

    public function documentRequest(): BelongsTo
    {
        return $this->belongsTo(DocumentRequest::class, 'document_request_id');
    }
}
