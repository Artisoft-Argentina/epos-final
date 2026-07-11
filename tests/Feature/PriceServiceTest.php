<?php

use App\Models\Category;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\User;
use App\Http\Controllers\PriceListController;
use App\Services\PriceService;
use App\Services\ProductService;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Setup
|--------------------------------------------------------------------------
| Los modelos de negocio (Product, PriceList, ...) viven en la BD del tenant.
| Corremos solo las migraciones de `database/migrations/tenant` sobre la
| conexión sqlite :memory: de testing. migrate:fresh resetea el esquema en
| cada test. No usamos RefreshDatabase porque cargaría las migraciones
| centrales (colisión de tablas `cache`/`sessions`).
*/

beforeEach(function () {
    $this->artisan('migrate:fresh', ['--path' => 'database/migrations/tenant']);
    $this->priceService = app(PriceService::class);
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeProduct(float $cost, ?float $markup = null): Product
{
    static $seq = 0;
    $seq++;

    $category = Category::firstOrCreate(['name' => 'General']);

    return Product::create([
        'sku'            => 'ART-' . str_pad((string) $seq, 6, '0', STR_PAD_LEFT),
        'name'           => 'Producto test',
        'unit'           => 'UN',
        'cost'           => $cost,
        'markup_percent' => $markup,
        'tax_rate'       => 21,
        'min_stock'      => 0,
        'category_id'    => $category->id,
        'active'         => true,
    ]);
}

function makeList(string $name, float $percentage, string $strategy = 'list', bool $defaultPos = false): PriceList
{
    return PriceList::create([
        'name'              => $name,
        'percentage'        => $percentage,
        'pricing_strategy'  => $strategy,
        'default_pos'       => $defaultPos,
        'default_ecommerce' => false,
        'active'            => true,
    ]);
}

function pivotOf(Product $product, PriceList $list): ?object
{
    return DB::table('price_list_products')
        ->where('product_id', $product->id)
        ->where('price_list_id', $list->id)
        ->first();
}

// ─── resolvePrice ─────────────────────────────────────────────────────────────

it('resuelve el precio con strategy list usando el % de la lista', function () {
    $product = makeProduct(cost: 100, markup: 40);
    $list    = makeList('Minorista', 50, 'list');

    // strategy 'list' ignora el markup del producto
    expect($this->priceService->resolvePrice($product, $list))->toBe(150.00);
});

it('resuelve el precio con strategy product usando el markup del producto', function () {
    $product = makeProduct(cost: 100, markup: 30);
    $list    = makeList('Mayorista', 50, 'product');

    expect($this->priceService->resolvePrice($product, $list))->toBe(130.00);
});

it('resuelve el precio con strategy product y hace fallback al % de la lista si no hay markup', function () {
    $product = makeProduct(cost: 100, markup: null);
    $list    = makeList('Mayorista', 25, 'product');

    expect($this->priceService->resolvePrice($product, $list))->toBe(125.00);
});

// ─── generateForProduct ───────────────────────────────────────────────────────

it('genera precios en todas las listas activas al crear un producto', function () {
    $listA = makeList('A', 10, 'list');
    $listB = makeList('B', 20, 'list');
    $inactive = makeList('Inactiva', 99, 'list');
    $inactive->update(['active' => false]);

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);

    expect((float) pivotOf($product, $listA)->price)->toBe(110.00);
    expect((float) pivotOf($product, $listB)->price)->toBe(120.00);
    expect((bool) pivotOf($product, $listA)->is_manual)->toBeFalse();
    expect(pivotOf($product, $inactive))->toBeNull();
});

// ─── updateCost ───────────────────────────────────────────────────────────────

it('actualiza el costo y recalcula precios no-manuales + registra historial', function () {
    $user = User::factory()->create();
    $list = makeList('Minorista', 50, 'list');

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);
    expect((float) pivotOf($product, $list)->price)->toBe(150.00);

    $this->priceService->updateCost($product, 200, $user);

    expect((float) $product->fresh()->cost)->toBe(200.00);
    expect((float) pivotOf($product, $list)->price)->toBe(300.00);

    $this->assertDatabaseHas('price_history', [
        'product_id' => $product->id,
        'type'       => 'cost_update',
        'old_value'  => 100,
        'new_value'  => 200,
    ]);
    $this->assertDatabaseHas('price_history', [
        'product_id' => $product->id,
        'type'       => 'bulk_recalculation',
        'old_value'  => 150,
        'new_value'  => 300,
    ]);
});

it('no hace nada si el costo no cambia', function () {
    $user = User::factory()->create();
    $product = makeProduct(cost: 100);

    $this->priceService->updateCost($product, 100, $user);

    $this->assertDatabaseCount('price_history', 0);
});

it('respeta los precios manuales al actualizar el costo', function () {
    $user = User::factory()->create();
    $list = makeList('Minorista', 50, 'list');

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);
    $this->priceService->overridePrice($product, $list, 999, $user);

    $this->priceService->updateCost($product, 200, $user);

    // El precio manual queda intacto pese al cambio de costo
    expect((float) pivotOf($product, $list)->price)->toBe(999.00);
    expect((bool) pivotOf($product, $list)->is_manual)->toBeTrue();
});

// ─── ProductService::update (regresión del bug P1) ────────────────────────────

it('recalcula las listas al editar el costo de un producto via ProductService (flujo #2)', function () {
    $this->actingAs(User::factory()->create());
    $list = makeList('Minorista', 50, 'list');

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);
    expect((float) pivotOf($product, $list)->price)->toBe(150.00);

    app(ProductService::class)->update($product, ['cost' => 200]);

    // Antes del fix esto quedaba en 150 (updateCost era no-op)
    expect((float) $product->fresh()->cost)->toBe(200.00);
    expect((float) pivotOf($product, $list)->price)->toBe(300.00);
    $this->assertDatabaseHas('price_history', [
        'product_id' => $product->id,
        'type'       => 'cost_update',
    ]);
});

it('recalcula las listas strategy product al cambiar solo el markup del producto (flujo #6)', function () {
    $this->actingAs(User::factory()->create());
    $listList    = makeList('POS', 0, 'list');          // ignora el markup del producto
    $listProduct = makeList('Mayorista', -15, 'product'); // usa el markup del producto

    $product = makeProduct(cost: 100, markup: null);
    $this->priceService->generateForProduct($product);
    // Sin markup: product-strategy hace fallback al -15% de la lista → 85
    expect((float) pivotOf($product, $listProduct)->price)->toBe(85.00);
    expect((float) pivotOf($product, $listList)->price)->toBe(100.00);

    // Cambiar SOLO el markup a 30% (sin tocar el costo)
    app(ProductService::class)->update($product, ['markup_percent' => 30]);

    // list-strategy no cambia; product-strategy ahora usa 30% → 130
    expect((float) pivotOf($product->fresh(), $listProduct)->price)->toBe(130.00);
    expect((float) pivotOf($product->fresh(), $listList)->price)->toBe(100.00);
});

it('respeta los precios manuales al recalcular por cambio de markup', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $listProduct = makeList('Mayorista', -15, 'product');

    $product = makeProduct(cost: 100, markup: null);
    $this->priceService->generateForProduct($product);
    $this->priceService->overridePrice($product, $listProduct, 999, $user);

    app(ProductService::class)->update($product, ['markup_percent' => 30]);

    expect((float) pivotOf($product->fresh(), $listProduct)->price)->toBe(999.00);
    expect((bool) pivotOf($product->fresh(), $listProduct)->is_manual)->toBeTrue();
});

// ─── recalculateList ──────────────────────────────────────────────────────────

it('recalcula solo automáticos con strategy auto_only', function () {
    $user = User::factory()->create();
    $list = makeList('Minorista', 50, 'list');

    $manual = makeProduct(cost: 100);
    $auto   = makeProduct(cost: 100);
    $this->priceService->generateForProduct($manual);
    $this->priceService->generateForProduct($auto);
    $this->priceService->overridePrice($manual, $list, 999, $user);

    // Cambiamos el % y recalculamos respetando manuales
    $list->update(['percentage' => 100]);
    $this->priceService->recalculateList($list->fresh(), 'auto_only', $user);

    expect((float) pivotOf($manual, $list)->price)->toBe(999.00);   // intacto
    expect((float) pivotOf($auto, $list)->price)->toBe(200.00);     // recalculado
});

it('recalcula todos con strategy all y resetea is_manual', function () {
    $user = User::factory()->create();
    $list = makeList('Minorista', 50, 'list');

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);
    $this->priceService->overridePrice($product, $list, 999, $user);

    $this->priceService->recalculateList($list, 'all', $user);

    expect((float) pivotOf($product, $list)->price)->toBe(150.00);
    expect((bool) pivotOf($product, $list)->is_manual)->toBeFalse();
});

it('resetea is_manual con strategy all aunque el precio no cambie (edge case P2)', function () {
    $user = User::factory()->create();
    $list = makeList('Minorista', 50, 'list');

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);
    // Override manual al MISMO valor que la fórmula (150)
    $this->priceService->overridePrice($product, $list, 150, $user);
    expect((bool) pivotOf($product, $list)->is_manual)->toBeTrue();

    $this->priceService->recalculateList($list, 'all', $user);

    // El precio no cambia, pero is_manual debe resetearse a false
    expect((float) pivotOf($product, $list)->price)->toBe(150.00);
    expect((bool) pivotOf($product, $list)->is_manual)->toBeFalse();
});

// ─── overridePrice ────────────────────────────────────────────────────────────

it('marca is_manual y registra historial al sobreescribir un precio', function () {
    $user = User::factory()->create();
    $list = makeList('Minorista', 50, 'list');

    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);

    $this->priceService->overridePrice($product, $list, 500, $user);

    expect((float) pivotOf($product, $list)->price)->toBe(500.00);
    expect((bool) pivotOf($product, $list)->is_manual)->toBeTrue();
    $this->assertDatabaseHas('price_history', [
        'product_id'    => $product->id,
        'price_list_id' => $list->id,
        'type'          => 'price_override',
        'old_value'     => 150,
        'new_value'     => 500,
    ]);
});

// ─── destroy (soft delete + invariantes) ──────────────────────────────────────

it('bloquea eliminar la lista POS por defecto', function () {
    $pos = makeList('POS', 0, 'list', defaultPos: true);
    makeList('Web', 10, 'list'); // segunda activa para pasar el check de "última"

    app(PriceListController::class)->destroy($pos);

    expect($pos->fresh()->trashed())->toBeFalse();
});

it('bloquea eliminar la lista de ecommerce por defecto', function () {
    makeList('POS', 0, 'list', defaultPos: true);
    $eco = makeList('Web', 10, 'list');
    $eco->update(['default_ecommerce' => true]);

    app(PriceListController::class)->destroy($eco);

    expect($eco->fresh()->trashed())->toBeFalse();
});

it('bloquea eliminar la última lista activa', function () {
    $only = makeList('POS', 0, 'list'); // única activa (sin default para no chocar antes)

    app(PriceListController::class)->destroy($only);

    expect($only->fresh()->trashed())->toBeFalse();
});

it('soft-deletea la lista y sus precios sin borrarlos físicamente', function () {
    makeList('POS', 0, 'list', defaultPos: true);
    $extra = makeList('Distribuidor', 5, 'list');
    $product = makeProduct(cost: 100);
    $this->priceService->generateForProduct($product);

    expect(pivotOf($product, $extra))->not->toBeNull();

    app(PriceListController::class)->destroy($extra);

    // La lista queda soft-deleted: fuera de las queries normales, presente con withTrashed
    expect(PriceList::find($extra->id))->toBeNull();
    expect(PriceList::withTrashed()->find($extra->id))->not->toBeNull();

    // El pivot NO se borró físicamente: sigue existiendo con deleted_at seteado
    expect(DB::table('price_list_products')->where('price_list_id', $extra->id)->count())->toBe(1);
    expect(DB::table('price_list_products')->where('price_list_id', $extra->id)->whereNotNull('deleted_at')->count())->toBe(1);

    // Y el precio ya no aparece entre las listas del producto (scope de la lista soft-deleted)
    expect($product->fresh()->priceLists()->where('price_list_id', $extra->id)->exists())->toBeFalse();
});
