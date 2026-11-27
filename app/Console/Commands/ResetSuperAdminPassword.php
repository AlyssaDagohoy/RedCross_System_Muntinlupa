<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ResetSuperAdminPassword extends Command
{
    protected $signature = 'superadmin:reset-password {email? : Email of the superadmin account}';

    protected $description = 'Reset the superadmin password if it was forgotten';

    public function handle(): int
    {
        $query = User::role('super-admin');

        if ($email = $this->argument('email')) {
            $query->where('email', strtolower(trim($email)));
        }

        $user = $query->first();

        if (! $user) {
            $this->error('No superadmin account found.');
            return self::FAILURE;
        }

        $this->info("Resetting the password for {$user->name} ({$user->email}).");

        $password = (string) $this->secret('New password (at least 8 characters)');
        $confirm  = (string) $this->secret('Confirm new password');

        if (strlen($password) < 8) {
            $this->error('The password must be at least 8 characters.');
            return self::FAILURE;
        }

        if ($password !== $confirm) {
            $this->error('The passwords do not match.');
            return self::FAILURE;
        }

        $user->forceFill([
            'password'             => Hash::make($password),
            'status'               => 'approved',
            'must_change_password' => false,
        ])->save();

        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }

        $this->info('Done. The superadmin can now log in with the new password.');

        return self::SUCCESS;
    }
}