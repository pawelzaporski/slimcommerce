<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->string('sku')->unique();
            $table->string('name');
            $table->decimal('base_price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
