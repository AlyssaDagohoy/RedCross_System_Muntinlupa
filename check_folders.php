App\Models\File201Folder::select("id","name","parent_id")->get()->each(function($f){ echo $f->id . " | " . $f->name . " | parent: " . ($f->parent_id ?? "NULL") . PHP_EOL; });
