<?php
$req = App\Models\DocumentRequest::where("document_name", "abcdef")->first();
if ($req) {
    echo "Request ID: " . $req->id . PHP_EOL;
    $docs = App\Models\VolunteerDocument::where("document_request_id", $req->id)->get(["id","name","original_name","path"]);
    foreach ($docs as $d) {
        echo $d->id . " | name=" . $d->name . " | original_name=" . $d->original_name . " | path=" . $d->path . PHP_EOL;
    }
} else {
    echo "No request named abcdef found." . PHP_EOL;
}
