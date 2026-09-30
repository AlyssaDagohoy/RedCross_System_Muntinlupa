<?php

namespace App\Console\Commands;

use App\Models\Document;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateComplianceDocumentsToPrivateDisk extends Command
{
    /**
     * php artisan documents:migrate-to-private
     */
    protected $signature = 'documents:migrate-to-private';

    protected $description = 'Move compliance document uploads from the public disk to the private local disk, then delete the public copies.';

    public function handle(): int
    {
        $documents = Document::whereNotNull('file_path')->get();

        if ($documents->isEmpty()) {
            $this->info('No compliance documents found — nothing to migrate.');

            return self::SUCCESS;
        }

        $moved = 0;
        $skipped = 0;
        $missing = 0;

        foreach ($documents as $document) {
            $path = $document->file_path;

            // Already migrated (or was never on public) — nothing to do.
            if (! Storage::disk('public')->exists($path)) {
                if (Storage::disk('local')->exists($path)) {
                    $this->line("Document #{$document->id}: already on private disk, skipping.");
                    $skipped++;
                } else {
                    $this->warn("Document #{$document->id}: file not found on either disk ({$path}).");
                    $missing++;
                }

                continue;
            }

            $contents = Storage::disk('public')->get($path);

            Storage::disk('local')->put($path, $contents);

            if (! Storage::disk('local')->exists($path)) {
                $this->error("Document #{$document->id}: copy to private disk failed, leaving public copy in place.");

                continue;
            }

            Storage::disk('public')->delete($path);

            $this->info("Document #{$document->id}: moved {$path} to private disk.");
            $moved++;
        }

        $this->newLine();
        $this->info("Done. Moved: {$moved}, already migrated: {$skipped}, missing: {$missing}.");

        return self::SUCCESS;
    }
}
