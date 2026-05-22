<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit')->middleware('can:profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update')->middleware('can:profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy')->middleware('can:profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit')->middleware('can:password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware(['throttle:6,1', 'can:password.update'])
        ->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance')->middleware('can:appearance');

    Route::get('settings/telegram', function () {
        return Inertia::render('settings/telegram');
    })->name('telegram')->middleware('can:telegram');
    Route::post('settings/telegram/verify', [\App\Http\Controllers\TelegramAuthController::class, 'verify'])->name('telegram.verify')->middleware('can:telegram.verify');

    // AFIP
    Route::get('settings/afip', [\App\Http\Controllers\Settings\AfipController::class, 'index'])->name('afip.settings')->middleware('can:afip.settings');
    Route::post('settings/afip/upload', [\App\Http\Controllers\Settings\AfipController::class, 'upload'])->name('afip.upload')->middleware('can:afip.upload');
    Route::get('settings/afip/health', [\App\Http\Controllers\Settings\AfipController::class, 'healthCheck'])->name('afip.health')->middleware('can:afip.health');

    // MercadoPago
    Route::get('settings/mercadopago', [\App\Http\Controllers\Settings\MercadoPagoController::class, 'index'])->name('mercadopago.settings')->middleware('can:mercadopago.settings');
    Route::post('settings/mercadopago', [\App\Http\Controllers\Settings\MercadoPagoController::class, 'update'])->name('mercadopago.update')->middleware('can:mercadopago.update');
});
