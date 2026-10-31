<?php

return [
    // All values are in minutes.

    // Time In opens this long before the activity starts. Earlier than this is blocked.
    'time_in_opens_before' => 60,

    // Time In is "on time" from the start until this many minutes after it.
    'time_in_on_time_window' => 15,

    // Time Out earlier than this many minutes before the end needs a confirmation (early).
    'time_out_early_window' => 60,

    // Time Out stays open this many minutes after the activity ends.
    'time_out_grace' => 15,
];