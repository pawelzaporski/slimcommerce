<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('orders', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('billing_address_id')->nullable()->constrained('addresses')->cascadeOnDelete();
            $table->foreignId('delivery_address_id')->nullable()->constrained('addresses')->cascadeOnDelete();
            $table->foreignId('shipping_method_id')->nullable()->constrained('shipping_methods')->cascadeOnDelete();
            $table->decimal('total_amount', 10, 2);
            $table->string('status');
            $table->timestamps();
        });
    }
};
