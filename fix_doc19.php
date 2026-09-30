<?php
$doc = App\Models\VolunteerDocument::find(19);
$doc->original_name = "file2.jpg";
$doc->save();
echo "Updated: " . $doc->original_name . PHP_EOL;
