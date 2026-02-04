<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('shop.index');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Redirigir clientes a su dashboard
    Route::get('dashboard', function () {
        $userRole = auth()->user()->role?->role;
        
        if ($userRole === 'cliente') {
            return redirect()->route('client.dashboard');
        }
        
        if (in_array($userRole, ['admin', 'superadmin'])) {
            return redirect()->route('admin.dashboard');
        }
        
        // Usuarios sin rol específico van a su dashboard
        return redirect()->route('user.dashboard');
    })->name('dashboard');

    Route::get('admin/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('admin.dashboard')->middleware(['role:admin,superadmin']);
    Route::get('dashboard/export', [\App\Http\Controllers\DashboardController::class, 'exportExcel'])->name('dashboard.export')->middleware(['role:admin,superadmin']);
    
    // Dashboard para usuarios regulares
    Route::get('user/dashboard', [\App\Http\Controllers\UserDashboardController::class, 'index'])->name('user.dashboard');

    // Rutas solo para superadmin
    Route::middleware(['role:superadmin'])->group(function () {
        Route::resource('users', \App\Http\Controllers\UserController::class);
        Route::resource('roles', \App\Http\Controllers\RoleController::class);
        Route::get('empresa', [\App\Http\Controllers\EmpresaController::class, 'index'])->name('empresa.index');
        Route::post('empresa', [\App\Http\Controllers\EmpresaController::class, 'store'])->name('empresa.store');
        Route::get('activity-log', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-log.index');
    });
    // Rutas para admin y superadmin
    Route::middleware(['role:admin,superadmin'])->group(function () {
        Route::resource('categorias', \App\Http\Controllers\CategoriaController::class);
        Route::resource('marcas', \App\Http\Controllers\MarcaController::class);
        Route::resource('articulos', \App\Http\Controllers\ArticuloController::class);
        Route::post('articulos/{articulo}/imagenes', [\App\Http\Controllers\ArticuloImagenController::class, 'store'])->name('articulos.imagenes.store');
        Route::delete('articulos/imagenes/{imagen}', [\App\Http\Controllers\ArticuloImagenController::class, 'destroy'])->name('articulos.imagenes.destroy');
        Route::post('articulos/imagenes/{imagen}/principal', [\App\Http\Controllers\ArticuloImagenController::class, 'setPrincipal'])->name('articulos.imagenes.setPrincipal');
        Route::post('articulos/{articulo}/imagenes/order', [\App\Http\Controllers\ArticuloImagenController::class, 'updateOrder'])->name('articulos.imagenes.updateOrder');
        Route::resource('suppliers', \App\Http\Controllers\SupplierController::class);
        Route::resource('remitos', \App\Http\Controllers\RemitoController::class);
        Route::get('remitos/articulos/{supplier}', [\App\Http\Controllers\RemitoController::class, 'getArticulosBySupplier'])->name('remitos.articulos');
        Route::post('remitos/{remito}/convertir-inventario', [\App\Http\Controllers\RemitoController::class, 'convertirAInventario'])->name('remitos.convertir-inventario');
        Route::resource('compras', \App\Http\Controllers\CompraController::class);
        Route::resource('inventarios', \App\Http\Controllers\InventarioController::class);
        Route::resource('listas-precios', \App\Http\Controllers\ListaPrecioController::class);
        Route::post('listas-precios/{listas_precio}/regenerar', [\App\Http\Controllers\ListaPrecioController::class, 'regenerarPrecios'])->name('listas-precios.regenerar');
    });

    // Rutas para todos los roles
    Route::resource('clientes', \App\Http\Controllers\ClienteController::class);
    Route::get('clientes/{cliente}/estado-cuenta', [\App\Http\Controllers\ClienteController::class, 'estadoCuenta'])->name('clientes.estado-cuenta');
    Route::get('clientes/{cliente}/exportar-excel', [\App\Http\Controllers\ClienteController::class, 'exportarExcel'])->name('clientes.exportar-excel');
    Route::get('clientes/{cliente}/exportar-pdf', [\App\Http\Controllers\ClienteController::class, 'exportarPdf'])->name('clientes.exportar-pdf');
    Route::get('estados-cuenta', [\App\Http\Controllers\ClienteController::class, 'estadosCuenta'])->name('estados-cuenta.index');
    Route::resource('ventas', \App\Http\Controllers\VentaController::class);
    Route::resource('presupuestos', \App\Http\Controllers\PresupuestoController::class);
    Route::post('afip/authorize/{factura}', [\App\Http\Controllers\VentaController::class, 'autorizarAfip'])->name('afip.authorize');
    Route::get('facturas/{factura}/pagos/create', [\App\Http\Controllers\PagoController::class, 'create'])->name('pagos.create');
    Route::post('facturas/{factura}/pagos', [\App\Http\Controllers\PagoController::class, 'store'])->name('pagos.store');
    Route::delete('pagos/{pago}', [\App\Http\Controllers\PagoController::class, 'destroy'])->name('pagos.destroy');
    Route::get('facturas/{factura}/entregas/create', [\App\Http\Controllers\EntregaController::class, 'create'])->name('entregas.create');
    Route::post('facturas/{factura}/entregas', [\App\Http\Controllers\EntregaController::class, 'store'])->name('entregas.store');
    Route::get('entregas', [\App\Http\Controllers\EntregaController::class, 'index'])->name('entregas.index');
    Route::post('entregas/{entrega}/marcar-entregada', [\App\Http\Controllers\EntregaController::class, 'marcarEntregada'])->name('entregas.marcar-entregada');
    Route::post('entregas/{entrega}/cancelar', [\App\Http\Controllers\EntregaController::class, 'cancelar'])->name('entregas.cancelar');
    Route::delete('entregas/{entrega}', [\App\Http\Controllers\EntregaController::class, 'destroy'])->name('entregas.destroy');

    Route::get('chat', [\App\Http\Controllers\ChatController::class, 'index'])->name('chat.index');
    Route::post('chat/send', [\App\Http\Controllers\ChatController::class, 'send'])->name('chat.send');

    Route::get('asistente-compras', [\App\Http\Controllers\AsistenteComprasController::class, 'index'])->name('asistente-compras.index');
    Route::post('asistente-compras/process', [\App\Http\Controllers\AsistenteComprasController::class, 'processPdf'])->name('asistente-compras.process');
    Route::post('asistente-compras/add-inventory', [\App\Http\Controllers\AsistenteComprasController::class, 'addToInventory'])->name('asistente-compras.add-inventory');

    Route::get('facturas/{factura}/pdf', [\App\Http\Controllers\FacturaPdfController::class, 'generate'])->name('facturas.pdf');

    Route::post('afip/consultar-cuit', [\App\Http\Controllers\ClienteController::class, 'consultarCuit'])->name('afip.consultar-cuit');

});

// Rutas públicas del e-commerce
Route::get('shop', [\App\Http\Controllers\EcommerceController::class, 'index'])->name('shop.index');
Route::get('shop/{articulo}', [\App\Http\Controllers\EcommerceController::class, 'show'])->name('shop.show');
Route::post('cart/{articulo}', [\App\Http\Controllers\EcommerceController::class, 'addToCart'])->name('cart.add');
Route::get('cart', [\App\Http\Controllers\EcommerceController::class, 'cart'])->name('cart.index');
Route::delete('cart', [\App\Http\Controllers\EcommerceController::class, 'clearCart'])->name('cart.clear');
Route::patch('cart/{cartItem}', [\App\Http\Controllers\EcommerceController::class, 'updateCartItem'])->name('cart.update');
Route::delete('cart/{cartItem}', [\App\Http\Controllers\EcommerceController::class, 'removeCartItem'])->name('cart.remove');

// Rutas de checkout - requieren autenticación
Route::middleware(['auth'])->group(function () {
    Route::get('checkout', [\App\Http\Controllers\CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('checkout/payment', [\App\Http\Controllers\CheckoutController::class, 'createPayment'])->name('checkout.payment');
    Route::get('checkout/success', [\App\Http\Controllers\CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('checkout/failure', [\App\Http\Controllers\CheckoutController::class, 'failure'])->name('checkout.failure');
    Route::get('checkout/pending', [\App\Http\Controllers\CheckoutController::class, 'pending'])->name('checkout.pending');
    Route::get('payment/{paymentId}/status', [\App\Http\Controllers\CheckoutController::class, 'getPaymentStatus'])->name('payment.status');

    Route::get('my-purchases', [\App\Http\Controllers\UserPurchaseController::class, 'index'])->name('user.purchases');

    // Rutas para clientes
    Route::middleware(['role:cliente'])->group(function () {
        Route::get('client/dashboard', [\App\Http\Controllers\ClientDashboardController::class, 'index'])->name('client.dashboard');
        Route::get('client/profile', [\App\Http\Controllers\ClientDashboardController::class, 'profile'])->name('client.profile');
        Route::put('client/profile', [\App\Http\Controllers\ClientDashboardController::class, 'updateProfile'])->name('client.profile.update');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
