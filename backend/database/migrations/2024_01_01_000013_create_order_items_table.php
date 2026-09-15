<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();
        });
    }
};
