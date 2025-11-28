<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/download/{path}', function ($path) {
    $fullPath = storage_path("app/public/{$path}");

    if (!file_exists($fullPath)) {
        abort(404, 'File not found');
    }

    return response()->download($fullPath);
})->where('path', '.*');
