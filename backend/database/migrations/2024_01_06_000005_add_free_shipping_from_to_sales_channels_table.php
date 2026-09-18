<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Próg darmowej dostawy per miejsce sprzedaży (wartość koszyka po rabacie).
        // NULL = brak darmowej dostawy od kwoty w tym sklepie.
        $schema->table('sales_channels', function (Blueprint $table): void {
            $table->decimal('free_shipping_from', 10, 2)->nullable();
        });
    }
};
