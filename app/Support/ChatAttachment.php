<?php

namespace App\Support;

use App\Models\CommunicationMessage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatAttachment
{
    public static function rules(): array
    {
        return [
            'bail', 'nullable', 'file',
            'mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm,pdf,doc,docx,xls,xlsx,ppt,pptx',
            'max:51200',
            function ($attribute, $value, $fail) {
                $mime = (string) $value->getMimeType();
                $limitMb = str_starts_with($mime, 'image/') ? 5 : (str_starts_with($mime, 'video/') ? 50 : 10);
                if ($value->getSize() > $limitMb * 1024 * 1024) {
                    $fail('File too large. Limits: pictures 5 MB, videos 50 MB, PDF 10 MB.');
                }
            },
        ];
    }

    public static function store(?UploadedFile $file): array
    {
        if (! $file) {
            return [];
        }

        return [
            'attachment_path' => $file->store('chat', 'local'),
            'attachment_name' => Str::limit($file->getClientOriginalName(), 120, ''),
            'attachment_mime' => (string) $file->getMimeType(),
        ];
    }

    public static function response(CommunicationMessage $message)
    {
        $disk = Storage::disk('local');
        abort_unless($message->attachment_path && $disk->exists($message->attachment_path), 404);

        return response()->file($disk->path($message->attachment_path), [
            'Content-Type' => $message->attachment_mime ?: 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}