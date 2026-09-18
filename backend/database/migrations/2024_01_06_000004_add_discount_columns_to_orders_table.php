<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Rozbicie total_amount: items_amount - discount_amount + shipping_amount.
        // discount_code to snapshot tekstowy (kod może zostać później usunięty).
        $schema->table('orders', function (Blueprint $table): void {
            $table->decimal('items_amount', 10, 2)->default(0);
            $table->string('discount_code')->nullable();
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('shipping_amount', 10, 2)->default(0);
        });
    }
};
