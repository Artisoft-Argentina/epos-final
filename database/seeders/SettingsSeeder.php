<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Setting::firstOrCreate(
            ['id' => 1],
            [
                'tax_id'                => null,
                'business_name'         => null,
                'address'               => null,
                'phone'                 => null,
                'email'                 => null,
                'zip_code'              => null,
                'city_id'               => null,
                'state_id'              => null,
                'tax_status'            => null,
                'gross_income_tax'      => null,
                'activity_start_date'   => null,
                'pos_number'            => 1,
                'afip_environment'      => 'homologacion',
                'trade_name'            => null,
                'commercial_address'    => null,
                'tagline'               => null,
                'logo'                  => null,
                'next_invoice_number'   => 1,
                'next_order_number'     => 1,
                'next_quote_number'     => 1,
                'next_payment_number'   => 1,
                'next_receipt_number'   => 1,
                'mp_access_token'       => null,
                'mp_public_key'         => null,
                'mp_environment'        => 'sandbox',
            ]
        );
    }
}
