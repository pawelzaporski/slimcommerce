<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Kody rabatowe. `type` decyduje o sposobie liczenia (patrz App\Models\DiscountCode::TYPES):
        //  - percent_cart / amount_cart       - rabat % / kwotowy na cały koszyk,
        //  - percent_product / amount_product - rabat % / kwotowy (za sztukę) tylko na produkty
        //                                       z tabeli discount_code_products,
        //  - free_shipping                    - darmowa dostawa (value nieużywane).
        $schema->create('discount_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('type');
            $table->decimal('value', 10, 2)->nullable();
            $table->decimal('min_cart_amount', 10, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
