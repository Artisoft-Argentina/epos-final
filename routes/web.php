<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('shop.index');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Redirigir según rol
    Route::get('dashboard', function () {
        $user = auth()->user();

        if ($user->hasRole('cliente')) {
            return redirect()->route('client.dashboard');
        }

        if ($user->hasAnyRole(['admin', 'superadmin'])) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('user.dashboard');
    })->name('dashboard');

    Route::get('admin/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('admin.dashboard')->middleware(['can:admin.dashboard']);
    Route::get('dashboard/export', [\App\Http\Controllers\DashboardController::class, 'exportExcel'])->name('dashboard.export')->middleware(['can:dashboard.export']);

    // Design System demo (solo en desarrollo)
    Route::get('design-system', function () {
        return inertia('design-system');
    })->name('design-system')->middleware(['can:design-system']);

    // Dashboard para usuarios regulares
    Route::get('user/dashboard', [\App\Http\Controllers\UserDashboardController::class, 'index'])->name('user.dashboard')->middleware('can:user.dashboard');

    // ── Rutas solo para superadmin ──────────────────────────────────────────
    // Route::middleware(['role:superadmin'])->group(function () {

    // Users
    Route::get('users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index')->middleware('can:users.index');
    Route::get('users/create', [\App\Http\Controllers\UserController::class, 'create'])->name('users.create')->middleware('can:users.create');
    Route::post('users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store')->middleware('can:users.store');
    Route::get('users/{user}', [\App\Http\Controllers\UserController::class, 'show'])->name('users.show')->middleware('can:users.show');
    Route::get('users/{user}/edit', [\App\Http\Controllers\UserController::class, 'edit'])->name('users.edit')->middleware('can:users.edit');
    Route::put('users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update')->middleware('can:users.update');
    Route::delete('users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy')->middleware('can:users.destroy');

    // Roles
    Route::get('roles', [\App\Http\Controllers\RoleController::class, 'index'])->name('roles.index')->middleware('can:roles.index');
    Route::get('roles/create', [\App\Http\Controllers\RoleController::class, 'create'])->name('roles.create')->middleware('can:roles.create');
    Route::post('roles', [\App\Http\Controllers\RoleController::class, 'store'])->name('roles.store')->middleware('can:roles.store');
    Route::get('roles/{role}', [\App\Http\Controllers\RoleController::class, 'show'])->name('roles.show')->middleware('can:roles.show');
    Route::get('roles/{role}/edit', [\App\Http\Controllers\RoleController::class, 'edit'])->name('roles.edit')->middleware('can:roles.edit');
    Route::put('roles/{role}', [\App\Http\Controllers\RoleController::class, 'update'])->name('roles.update')->middleware('can:roles.update');
    Route::delete('roles/{role}', [\App\Http\Controllers\RoleController::class, 'destroy'])->name('roles.destroy')->middleware('can:roles.destroy');

    Route::get('empresa', [\App\Http\Controllers\EmpresaController::class, 'index'])->name('empresa.index')->middleware('can:empresa.index');
    Route::post('empresa', [\App\Http\Controllers\EmpresaController::class, 'store'])->name('empresa.store')->middleware('can:empresa.store');
    Route::get('activity-log', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-log.index')->middleware('can:activity-log.index');
    // });

    // ── Rutas para admin y superadmin ───────────────────────────────────────
    // Route::middleware(['role:admin,superadmin'])->group(function () {

    // Categories (except create, edit)
    Route::get('categories', [\App\Http\Controllers\CategoryController::class, 'index'])->name('categories.index')->middleware('can:categories.index');
    Route::post('categories', [\App\Http\Controllers\CategoryController::class, 'store'])->name('categories.store')->middleware('can:categories.store');
    Route::get('categories/{category}', [\App\Http\Controllers\CategoryController::class, 'show'])->name('categories.show')->middleware('can:categories.show');
    Route::put('categories/{category}', [\App\Http\Controllers\CategoryController::class, 'update'])->name('categories.update')->middleware('can:categories.update');
    Route::delete('categories/{category}', [\App\Http\Controllers\CategoryController::class, 'destroy'])->name('categories.destroy')->middleware('can:categories.destroy');
    Route::patch('categories/{category}/toggle-active', [\App\Http\Controllers\CategoryController::class, 'toggleActive'])->name('categories.toggle-active')->middleware('can:categories.toggle-active');

    // Brands (except create, edit)
    Route::get('brands', [\App\Http\Controllers\BrandController::class, 'index'])->name('brands.index')->middleware('can:brands.index');
    Route::post('brands', [\App\Http\Controllers\BrandController::class, 'store'])->name('brands.store')->middleware('can:brands.store');
    Route::get('brands/{brand}', [\App\Http\Controllers\BrandController::class, 'show'])->name('brands.show')->middleware('can:brands.show');
    Route::put('brands/{brand}', [\App\Http\Controllers\BrandController::class, 'update'])->name('brands.update')->middleware('can:brands.update');
    Route::delete('brands/{brand}', [\App\Http\Controllers\BrandController::class, 'destroy'])->name('brands.destroy')->middleware('can:brands.destroy');
    Route::patch('brands/{brand}/toggle-active', [\App\Http\Controllers\BrandController::class, 'toggleActive'])->name('brands.toggle-active')->middleware('can:brands.toggle-active');

    // Products
    Route::get('products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index')->middleware('can:products.index');
    Route::get('products/create', [\App\Http\Controllers\ProductController::class, 'create'])->name('products.create')->middleware('can:products.create');
    Route::post('products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store')->middleware('can:products.store');
    Route::get('products/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show')->middleware('can:products.show');
    Route::get('products/{product}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->name('products.edit')->middleware('can:products.edit');
    Route::put('products/{product}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update')->middleware('can:products.update');
    Route::delete('products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy')->middleware('can:products.destroy');
    Route::patch('products/{product}/toggle-active', [\App\Http\Controllers\ProductController::class, 'toggleActive'])->name('products.toggle-active')->middleware('can:products.toggle-active');
    Route::post('products/{product}/images', [\App\Http\Controllers\ProductImageController::class, 'store'])->name('products.images.store')->middleware('can:products.images.store');
    Route::delete('products/images/{image}', [\App\Http\Controllers\ProductImageController::class, 'destroy'])->name('products.images.destroy')->middleware('can:products.images.destroy');
    Route::post('products/images/{image}/set-primary', [\App\Http\Controllers\ProductImageController::class, 'setPrimary'])->name('products.images.set-primary')->middleware('can:products.images.set-primary');
    Route::post('products/{product}/images/order', [\App\Http\Controllers\ProductImageController::class, 'updateOrder'])->name('products.images.order')->middleware('can:products.images.order');
    Route::get('products/{product}/barcode', [\App\Http\Controllers\CodigoController::class, 'generarCodigoBarras'])->name('products.barcode')->middleware('can:products.barcode');
    Route::get('products/{product}/qr', [\App\Http\Controllers\CodigoController::class, 'generarCodigoQR'])->name('products.qr')->middleware('can:products.qr');
    Route::get('products/{product}/codes', [\App\Http\Controllers\CodigoController::class, 'generarCodigos'])->name('products.codes')->middleware('can:products.codes');
    Route::post('products/print-labels', [\App\Http\Controllers\CodigoController::class, 'imprimirEtiquetas'])->name('products.print-labels')->middleware('can:products.print-labels');
    Route::get('products/{product}/movements', [\App\Http\Controllers\MovimientoController::class, 'index'])->name('products.movements')->middleware('can:products.movements');

    // Suppliers
    Route::get('suppliers', [\App\Http\Controllers\SupplierController::class, 'index'])->name('suppliers.index')->middleware('can:suppliers.index');
    Route::get('suppliers/create', [\App\Http\Controllers\SupplierController::class, 'create'])->name('suppliers.create')->middleware('can:suppliers.create');
    Route::post('suppliers', [\App\Http\Controllers\SupplierController::class, 'store'])->name('suppliers.store')->middleware('can:suppliers.store');
    Route::get('suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'show'])->name('suppliers.show')->middleware('can:suppliers.show');
    Route::get('suppliers/{supplier}/edit', [\App\Http\Controllers\SupplierController::class, 'edit'])->name('suppliers.edit')->middleware('can:suppliers.edit');
    Route::put('suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'update'])->name('suppliers.update')->middleware('can:suppliers.update');
    Route::delete('suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'destroy'])->name('suppliers.destroy')->middleware('can:suppliers.destroy');

    // Orders
    Route::get('orders', [\App\Http\Controllers\OrderController::class, 'index'])->name('orders.index')->middleware('can:orders.index');
    Route::get('orders/create', [\App\Http\Controllers\OrderController::class, 'create'])->name('orders.create')->middleware('can:orders.create');
    Route::post('orders', [\App\Http\Controllers\OrderController::class, 'store'])->name('orders.store')->middleware('can:orders.store');
    Route::get('orders/{order}', [\App\Http\Controllers\OrderController::class, 'show'])->name('orders.show')->middleware('can:orders.show');
    Route::get('orders/{order}/edit', [\App\Http\Controllers\OrderController::class, 'edit'])->name('orders.edit')->middleware('can:orders.edit');
    Route::put('orders/{order}', [\App\Http\Controllers\OrderController::class, 'update'])->name('orders.update')->middleware('can:orders.update');
    Route::delete('orders/{order}', [\App\Http\Controllers\OrderController::class, 'destroy'])->name('orders.destroy')->middleware('can:orders.destroy');
    Route::get('orders/products/{supplier}', [\App\Http\Controllers\OrderController::class, 'getProductsBySupplier'])->name('orders.products')->middleware('can:orders.products');
    Route::post('orders/{order}/convert-inventory', [\App\Http\Controllers\OrderController::class, 'convertToInventory'])->name('orders.convert-inventory')->middleware('can:orders.convert-inventory');

    // Inventarios (only create, store, edit, update, destroy)
    Route::get('inventarios/create', [\App\Http\Controllers\InventarioController::class, 'create'])->name('inventarios.create')->middleware('can:inventarios.create');
    Route::post('inventarios', [\App\Http\Controllers\InventarioController::class, 'store'])->name('inventarios.store')->middleware('can:inventarios.store');
    Route::get('inventarios/{inventario}/edit', [\App\Http\Controllers\InventarioController::class, 'edit'])->name('inventarios.edit')->middleware('can:inventarios.edit');
    Route::put('inventarios/{inventario}', [\App\Http\Controllers\InventarioController::class, 'update'])->name('inventarios.update')->middleware('can:inventarios.update');
    Route::delete('inventarios/{inventario}', [\App\Http\Controllers\InventarioController::class, 'destroy'])->name('inventarios.destroy')->middleware('can:inventarios.destroy');
    Route::post('inventarios/reconcile-all', [\App\Http\Controllers\InventarioController::class, 'reconcileAll'])->name('inventarios.reconcile-all')->middleware('can:inventarios.reconcile-all');
    Route::post('inventarios/{inventario}/reconcile', [\App\Http\Controllers\InventarioController::class, 'reconcile'])->name('inventarios.reconcile')->middleware('can:inventarios.reconcile');
    Route::post('inventarios/{inventario}/adjust', [\App\Http\Controllers\InventarioController::class, 'adjust'])->name('inventarios.adjust')->middleware('can:inventarios.adjust');

    // Almacenes
    Route::get('almacenes', [\App\Http\Controllers\WarehouseController::class, 'index'])->name('almacenes.index')->middleware('can:almacenes.index');
    Route::get('almacenes/create', [\App\Http\Controllers\WarehouseController::class, 'create'])->name('almacenes.create')->middleware('can:almacenes.create');
    Route::post('almacenes', [\App\Http\Controllers\WarehouseController::class, 'store'])->name('almacenes.store')->middleware('can:almacenes.store');
    Route::get('almacenes/{almacene}', [\App\Http\Controllers\WarehouseController::class, 'show'])->name('almacenes.show')->middleware('can:almacenes.show');
    Route::get('almacenes/{almacene}/edit', [\App\Http\Controllers\WarehouseController::class, 'edit'])->name('almacenes.edit')->middleware('can:almacenes.edit');
    Route::put('almacenes/{almacene}', [\App\Http\Controllers\WarehouseController::class, 'update'])->name('almacenes.update')->middleware('can:almacenes.update');
    Route::delete('almacenes/{almacene}', [\App\Http\Controllers\WarehouseController::class, 'destroy'])->name('almacenes.destroy')->middleware('can:almacenes.destroy');

    // Puntos de venta
    Route::get('puntos-venta', [\App\Http\Controllers\PointOfSaleController::class, 'index'])->name('puntos-venta.index')->middleware('can:puntos-venta.index');
    Route::get('puntos-venta/create', [\App\Http\Controllers\PointOfSaleController::class, 'create'])->name('puntos-venta.create')->middleware('can:puntos-venta.create');
    Route::post('puntos-venta', [\App\Http\Controllers\PointOfSaleController::class, 'store'])->name('puntos-venta.store')->middleware('can:puntos-venta.store');
    Route::get('puntos-venta/{puntoVenta}', [\App\Http\Controllers\PointOfSaleController::class, 'show'])->name('puntos-venta.show')->middleware('can:puntos-venta.show');
    Route::get('puntos-venta/{puntoVenta}/edit', [\App\Http\Controllers\PointOfSaleController::class, 'edit'])->name('puntos-venta.edit')->middleware('can:puntos-venta.edit');
    Route::put('puntos-venta/{puntoVenta}', [\App\Http\Controllers\PointOfSaleController::class, 'update'])->name('puntos-venta.update')->middleware('can:puntos-venta.update');
    Route::delete('puntos-venta/{puntoVenta}', [\App\Http\Controllers\PointOfSaleController::class, 'destroy'])->name('puntos-venta.destroy')->middleware('can:puntos-venta.destroy');
    Route::post('puntos-venta/set-active', [\App\Http\Controllers\PointOfSaleController::class, 'setActive'])->name('puntos-venta.set-active')->middleware('can:puntos-venta.set-active');

    // Transferencias (admin actions)
    Route::post('transferencias/{transferencia}/dispatch', [\App\Http\Controllers\StockTransferController::class, 'dispatchTransfer'])->name('transferencias.dispatch')->middleware('can:transferencias.dispatch');
    Route::post('transferencias/{transferencia}/receive', [\App\Http\Controllers\StockTransferController::class, 'receive'])->name('transferencias.receive')->middleware('can:transferencias.receive');
    Route::post('transferencias/{transferencia}/cancel', [\App\Http\Controllers\StockTransferController::class, 'cancel'])->name('transferencias.cancel')->middleware('can:transferencias.cancel');

    // Listas de precios
    Route::get('price-lists', [\App\Http\Controllers\PriceListController::class, 'index'])->name('price-lists.index')->middleware('can:price-lists.index');
    Route::post('price-lists', [\App\Http\Controllers\PriceListController::class, 'store'])->name('price-lists.store')->middleware('can:price-lists.store');
    Route::get('price-lists/{priceList}', [\App\Http\Controllers\PriceListController::class, 'show'])->name('price-lists.show')->middleware('can:price-lists.show');
    Route::put('price-lists/{priceList}', [\App\Http\Controllers\PriceListController::class, 'update'])->name('price-lists.update')->middleware('can:price-lists.update');
    Route::delete('price-lists/{priceList}', [\App\Http\Controllers\PriceListController::class, 'destroy'])->name('price-lists.destroy')->middleware('can:price-lists.destroy');
    Route::post('price-lists/{priceList}/recalculate', [\App\Http\Controllers\PriceListController::class, 'recalculate'])->name('price-lists.recalculate')->middleware('can:price-lists.recalculate');
    Route::post('price-lists/{priceList}/override-price', [\App\Http\Controllers\PriceListController::class, 'overridePrice'])->name('price-lists.override-price')->middleware('can:price-lists.override-price');

    // ── Rutas compartidas entre roles ───────────────────────────────────────

    // Transferencias
    Route::get('transferencias', [\App\Http\Controllers\StockTransferController::class, 'index'])->name('transferencias.index')->middleware('can:transferencias.index');
    Route::get('transferencias/create', [\App\Http\Controllers\StockTransferController::class, 'create'])->name('transferencias.create')->middleware('can:transferencias.create');
    Route::post('transferencias', [\App\Http\Controllers\StockTransferController::class, 'store'])->name('transferencias.store')->middleware('can:transferencias.store');
    Route::get('transferencias/{transferencia}', [\App\Http\Controllers\StockTransferController::class, 'show'])->name('transferencias.show')->middleware('can:transferencias.show');
    Route::delete('transferencias/{transferencia}', [\App\Http\Controllers\StockTransferController::class, 'destroy'])->name('transferencias.destroy')->middleware('can:transferencias.destroy');

    // Customers
    Route::get('customers', [\App\Http\Controllers\CustomerController::class, 'index'])->name('customers.index')->middleware('can:customers.index');
    Route::get('customers/create', [\App\Http\Controllers\CustomerController::class, 'create'])->name('customers.create')->middleware('can:customers.create');
    Route::post('customers', [\App\Http\Controllers\CustomerController::class, 'store'])->name('customers.store')->middleware('can:customers.store');
    Route::get('customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'show'])->name('customers.show')->middleware('can:customers.show');
    Route::get('customers/{customer}/edit', [\App\Http\Controllers\CustomerController::class, 'edit'])->name('customers.edit')->middleware('can:customers.edit');
    Route::put('customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'update'])->name('customers.update')->middleware('can:customers.update');
    Route::patch('customers/{customer}/toggle-active', [\App\Http\Controllers\CustomerController::class, 'toggleActive'])->name('customers.toggle-active')->middleware('can:customers.toggle-active');
    Route::get('customers/{customer}/export-excel', [\App\Http\Controllers\CustomerController::class, 'exportExcel'])->name('customers.export-excel')->middleware('can:customers.export-excel');
    Route::get('customers/{customer}/export-pdf', [\App\Http\Controllers\CustomerController::class, 'exportPdf'])->name('customers.export-pdf')->middleware('can:customers.export-pdf');

    // Inventario y productos — lectura
    Route::get('inventarios', [\App\Http\Controllers\InventarioController::class, 'index'])->name('inventarios.index')->middleware('can:inventarios.index');
    Route::get('inventarios/{inventario}', [\App\Http\Controllers\InventarioController::class, 'show'])->name('inventarios.show')->middleware('can:inventarios.show');
    Route::get('products/{product}/stock-by-warehouse', [\App\Http\Controllers\ProductController::class, 'stockByWarehouse'])->name('products.stock-by-warehouse')->middleware('can:products.stock-by-warehouse');

    // Scanner
    Route::get('scanner', [\App\Http\Controllers\CodigoController::class, 'scanner'])->name('scanner.index')->middleware('can:scanner.index');
    Route::post('scanner/buscar', [\App\Http\Controllers\CodigoController::class, 'buscarPorCodigo'])->name('scanner.buscar')->middleware('can:scanner.buscar');

    // Ventas
    Route::get('ventas', [\App\Http\Controllers\VentaController::class, 'index'])->name('ventas.index')->middleware('can:ventas.index');
    Route::get('ventas/create', [\App\Http\Controllers\VentaController::class, 'create'])->name('ventas.create')->middleware('can:ventas.create');
    Route::post('ventas', [\App\Http\Controllers\VentaController::class, 'store'])->name('ventas.store')->middleware('can:ventas.store');
    Route::get('ventas/{venta}', [\App\Http\Controllers\VentaController::class, 'show'])->name('ventas.show')->middleware('can:ventas.show');
    Route::get('ventas/{venta}/edit', [\App\Http\Controllers\VentaController::class, 'edit'])->name('ventas.edit')->middleware('can:ventas.edit');
    Route::put('ventas/{venta}', [\App\Http\Controllers\VentaController::class, 'update'])->name('ventas.update')->middleware('can:ventas.update');
    Route::delete('ventas/{venta}', [\App\Http\Controllers\VentaController::class, 'destroy'])->name('ventas.destroy')->middleware('can:ventas.destroy');

    // Presupuestos
    Route::get('presupuestos', [\App\Http\Controllers\PresupuestoController::class, 'index'])->name('presupuestos.index')->middleware('can:presupuestos.index');
    Route::get('presupuestos/create', [\App\Http\Controllers\PresupuestoController::class, 'create'])->name('presupuestos.create')->middleware('can:presupuestos.create');
    Route::post('presupuestos', [\App\Http\Controllers\PresupuestoController::class, 'store'])->name('presupuestos.store')->middleware('can:presupuestos.store');
    Route::get('presupuestos/{presupuesto}', [\App\Http\Controllers\PresupuestoController::class, 'show'])->name('presupuestos.show')->middleware('can:presupuestos.show');
    Route::get('presupuestos/{presupuesto}/edit', [\App\Http\Controllers\PresupuestoController::class, 'edit'])->name('presupuestos.edit')->middleware('can:presupuestos.edit');
    Route::put('presupuestos/{presupuesto}', [\App\Http\Controllers\PresupuestoController::class, 'update'])->name('presupuestos.update')->middleware('can:presupuestos.update');
    Route::delete('presupuestos/{presupuesto}', [\App\Http\Controllers\PresupuestoController::class, 'destroy'])->name('presupuestos.destroy')->middleware('can:presupuestos.destroy');
    Route::post('presupuestos/{presupuesto}/convertir-venta', [\App\Http\Controllers\PresupuestoController::class, 'convertirAVenta'])->name('presupuestos.convertir-venta')->middleware('can:presupuestos.convertir-venta');

    Route::post('afip/authorize/{factura}', [\App\Http\Controllers\VentaController::class, 'autorizarAfip'])->name('afip.authorize')->middleware('can:afip.authorize');

    // Pagos
    Route::get('facturas/{factura}/pagos/create', [\App\Http\Controllers\PagoController::class, 'create'])->name('pagos.create')->middleware('can:pagos.create');
    Route::post('facturas/{factura}/pagos', [\App\Http\Controllers\PagoController::class, 'store'])->name('pagos.store')->middleware('can:pagos.store');
    Route::delete('pagos/{pago}', [\App\Http\Controllers\PagoController::class, 'destroy'])->name('pagos.destroy')->middleware('can:pagos.destroy');

    // Entregas
    Route::get('facturas/{factura}/entregas/create', [\App\Http\Controllers\EntregaController::class, 'create'])->name('entregas.create')->middleware('can:entregas.create');
    Route::post('facturas/{factura}/entregas', [\App\Http\Controllers\EntregaController::class, 'store'])->name('entregas.store')->middleware('can:entregas.store');
    Route::get('entregas', [\App\Http\Controllers\EntregaController::class, 'index'])->name('entregas.index')->middleware('can:entregas.index');
    Route::post('entregas/{entrega}/marcar-entregada', [\App\Http\Controllers\EntregaController::class, 'marcarEntregada'])->name('entregas.marcar-entregada')->middleware('can:entregas.marcar-entregada');
    Route::post('entregas/{entrega}/cancelar', [\App\Http\Controllers\EntregaController::class, 'cancelar'])->name('entregas.cancelar')->middleware('can:entregas.cancelar');
    Route::patch('entregas/{entrega}/warehouse', [\App\Http\Controllers\EntregaController::class, 'updateWarehouse'])->name('entregas.update-warehouse')->middleware('can:entregas.update-warehouse');
    Route::delete('entregas/{entrega}', [\App\Http\Controllers\EntregaController::class, 'destroy'])->name('entregas.destroy')->middleware('can:entregas.destroy');

    Route::get('chat', [\App\Http\Controllers\ChatController::class, 'index'])->name('chat.index')->middleware('can:chat.index');
    Route::post('chat/send', [\App\Http\Controllers\ChatController::class, 'send'])->name('chat.send')->middleware('can:chat.send');

    Route::get('asistente-compras', [\App\Http\Controllers\AsistenteComprasController::class, 'index'])->name('asistente-compras.index')->middleware('can:asistente-compras.index');
    Route::post('asistente-compras/process', [\App\Http\Controllers\AsistenteComprasController::class, 'processPdf'])->name('asistente-compras.process')->middleware('can:asistente-compras.process');
    Route::post('asistente-compras/add-inventory', [\App\Http\Controllers\AsistenteComprasController::class, 'addToInventory'])->name('asistente-compras.add-inventory')->middleware('can:asistente-compras.add-inventory');

    Route::get('facturas/{factura}/pdf', [\App\Http\Controllers\FacturaPdfController::class, 'generate'])->name('facturas.pdf')->middleware('can:facturas.pdf');

    Route::post('afip/consultar-cuit', [\App\Http\Controllers\CustomerController::class, 'consultarCuit'])->name('afip.consultar-cuit')->middleware('can:afip.consultar-cuit');

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
    Route::get('checkout', [\App\Http\Controllers\CheckoutController::class, 'index'])->name('checkout.index')->middleware('can:checkout.index');
    Route::post('checkout/payment', [\App\Http\Controllers\CheckoutController::class, 'createPayment'])->name('checkout.payment')->middleware('can:checkout.payment');
    Route::get('checkout/success', [\App\Http\Controllers\CheckoutController::class, 'success'])->name('checkout.success')->middleware('can:checkout.success');
    Route::get('checkout/failure', [\App\Http\Controllers\CheckoutController::class, 'failure'])->name('checkout.failure')->middleware('can:checkout.failure');
    Route::get('checkout/pending', [\App\Http\Controllers\CheckoutController::class, 'pending'])->name('checkout.pending')->middleware('can:checkout.pending');
    Route::get('payment/{paymentId}/status', [\App\Http\Controllers\CheckoutController::class, 'getPaymentStatus'])->name('payment.status')->middleware('can:payment.status');

    Route::get('my-purchases', [\App\Http\Controllers\UserPurchaseController::class, 'index'])->name('user.purchases')->middleware('can:user.purchases');

    // Rutas para clientes
    // Route::middleware(['role:cliente'])->group(function () {
        Route::get('client/dashboard', [\App\Http\Controllers\ClientDashboardController::class, 'index'])->name('client.dashboard')->middleware('can:client.dashboard');
        Route::get('client/profile', [\App\Http\Controllers\ClientDashboardController::class, 'profile'])->name('client.profile')->middleware('can:client.profile');
        Route::put('client/profile', [\App\Http\Controllers\ClientDashboardController::class, 'updateProfile'])->name('client.profile.update')->middleware('can:client.profile.update');
    // });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
