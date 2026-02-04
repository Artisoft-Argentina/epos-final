<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TelegramWebhookController;

Route::post('/telegram/webhook/admin', [TelegramWebhookController::class, 'handleAdmin']);
Route::post('/telegram/webhook/vendedor', [TelegramWebhookController::class, 'handleVendedor']);
