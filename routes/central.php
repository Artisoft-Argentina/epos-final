<?php

declare(strict_types=1);

use App\Http\Controllers\Central\CentralAuthController;
use App\Http\Controllers\Central\CentralDashboardController;
use App\Http\Controllers\Central\TenantController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('central.dashboard');
})->name('central.home');

Route::prefix('central')->group(function () {
    // Login del superadmin central (público)
    Route::get('/login', [CentralAuthController::class, 'create'])->name('central.login');
    Route::post('/login', [CentralAuthController::class, 'store'])->name('central.login.store');

    // Rutas protegidas del panel central
    Route::middleware(['auth:central'])->group(function () {
        Route::post('/logout', [CentralAuthController::class, 'destroy'])->name('central.logout');

        Route::get('/', [CentralDashboardController::class, 'index'])->name('central.dashboard');

        Route::resource('/tenants', TenantController::class)->names([
            'index'   => 'central.tenants.index',
            'create'  => 'central.tenants.create',
            'store'   => 'central.tenants.store',
            'show'    => 'central.tenants.show',
            'edit'    => 'central.tenants.edit',
            'update'  => 'central.tenants.update',
            'destroy' => 'central.tenants.destroy',
        ]);

        Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate'])->name('central.tenants.activate');
        Route::post('/tenants/{tenant}/deactivate', [TenantController::class, 'deactivate'])->name('central.tenants.deactivate');
    });
});
