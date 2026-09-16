<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Pozostałe zdjęcia produktu (galeria) - wszystko poza dwoma głównymi,
        // które siedzą bezpośrednio w kolumnach tabeli products.
        $schema->create('product_assets', function (Blueprint $table): void {
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);

            $table->primary(['product_id', 'asset_id']);
        });
    }
};
