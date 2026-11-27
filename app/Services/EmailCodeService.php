<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

/**
 * Short-lived 6-digit codes sent by email (password reset, attendance fallback).
 * The code is stored hashed in the cache, expires, and has limited tries.
 */
class EmailCodeService
{
    private function key(string $purpose, string $identifier): string
    {
        return 'email-code:' . $purpose . ':' . sha1(strtolower(trim($identifier)));
    }

    /** Creates a new code (replacing any old one) and returns it so it can be emailed. */
    public function issue(string $purpose, string $identifier, int $ttlMinutes = 10): string
    {
        $code    = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires = now()->addMinutes($ttlMinutes);

        Cache::put($this->key($purpose, $identifier), [
            'hash'       => Hash::make($code),
            'attempts'   => 0,
            'expires_at' => $expires->timestamp,
        ], $expires);

        return $code;
    }

    /** True only once: a correct code is used up right away. */
    public function verify(string $purpose, string $identifier, string $code, int $maxAttempts = 5): bool
    {
        $key  = $this->key($purpose, $identifier);
        $data = Cache::get($key);

        if (!$data) {
            return false;
        }

        if (($data['attempts'] ?? 0) >= $maxAttempts) {
            Cache::forget($key);
            return false;
        }

        if (!Hash::check(trim($code), $data['hash'])) {
            $data['attempts'] = ($data['attempts'] ?? 0) + 1;
            Cache::put($key, $data, Carbon::createFromTimestamp($data['expires_at']));
            return false;
        }

        Cache::forget($key);
        return true;
    }

    public function forget(string $purpose, string $identifier): void
    {
        Cache::forget($this->key($purpose, $identifier));
    }
}