<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Enums\SaleCondition;
use App\Enums\SaleType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Sale extends Model
{
    use SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    protected $fillable = [
        'pos_number',
        'voucher_code',
        'voucher_letter',
        'invoice_number',
        'tax_id',
        'date',
        'discount',
        'surcharge',
        'additional_discount',
        'subtotal',
        'total',
        'payment_status',
        'sale_condition',
        'afip_voucher',
        'cae',
        'cae_expiration',
        'due_date',
        'barcode_string',
        'payment_code',
        'sale_type',
        'afip_authorized',
        'customer_id',
        'user_id',
        'price_list_id',
        'point_of_sale_id',
        'warehouse_id',
        'active',
    ];

    protected $casts = [
        'date'                => 'date',
        'due_date'            => 'date',
        'cae_expiration'      => 'date',
        'tax_id'              => 'string',
        'afip_authorized'     => 'boolean',
        'active'              => 'boolean',
        'discount'            => 'decimal:2',
        'surcharge'           => 'decimal:2',
        'additional_discount' => 'decimal:2',
        'subtotal'            => 'decimal:2',
        'total'               => 'decimal:2',
        'payment_status'      => PaymentStatus::class,
        'sale_condition'      => SaleCondition::class,
        'sale_type'           => SaleType::class,
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    public function pointOfSale()
    {
        return $this->belongsTo(PointOfSale::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'sale_products')
                    ->withPivot(['supplier_code', 'sku', 'name', 'unit', 'quantity', 'discount', 'tax_rate', 'unit_price', 'subtotal'])
                    ->withTimestamps();
    }

    public function payments()
    {
        return $this->hasMany(SalePayment::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function movements()
    {
        return $this->morphMany(StockMovement::class, 'referenceable');
    }

    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments->sum('amount');
    }

    public function getPendingBalanceAttribute(): float
    {
        return round((float) $this->total - $this->total_paid, 2);
    }

    /**
     * Excluye las ventas canceladas. Una venta anulada no factura, no adeuda y
     * no vendió: no debe entrar en totales, reportes ni saldos. Se conserva el
     * registro, así que hay que filtrarla explícitamente en cada consulta.
     */
    public function scopeNotCancelled($query)
    {
        return $query->where('sales.payment_status', '!=', PaymentStatus::Cancelled->value);
    }

    /** Una venta cancelada es terminal: no acepta pagos, edición ni entregas. */
    public function isCancelled(): bool
    {
        return $this->payment_status === PaymentStatus::Cancelled;
    }

    /**
     * Recalcula payment_status a partir del saldo (fresh desde BD) y persiste.
     * No modifica una venta cancelada (estado terminal).
     * Debe invocarse dentro de una transacción con lock sobre la venta.
     */
    public function recalcPaymentStatus(): void
    {
        if ($this->isCancelled()) {
            return;
        }

        $paid  = round((float) $this->payments()->sum('amount'), 2);
        $total = round((float) $this->total, 2);

        $this->payment_status = match (true) {
            $paid >= $total => PaymentStatus::Paid,
            $paid > 0       => PaymentStatus::Partial,
            default         => PaymentStatus::Pending,
        };

        $this->save();
    }

    /**
     * Deriva la letra de comprobante (A/B) según la condición IVA del cliente.
     * Maneja tanto los códigos cortos (RI/MO/CF/EX de seeders) como los
     * strings largos que guarda el formulario ('Responsable Inscripto', etc.).
     */
    public static function resolveVoucherLetter(?Customer $customer): string
    {
        $status = $customer?->tax_status;
        if (! $status) {
            return 'B';
        }

        $code = strtoupper(trim($status));
        if (in_array($code, ['RI', 'MO'], true)) {
            return 'A';
        }
        if (in_array($code, ['CF', 'EX'], true)) {
            return 'B';
        }

        $lower = strtolower($status);
        if (str_contains($lower, 'responsable inscripto') || str_contains($lower, 'monotributo')) {
            return 'A';
        }

        // Exento, Consumidor Final u otros → Factura B
        return 'B';
    }
}
