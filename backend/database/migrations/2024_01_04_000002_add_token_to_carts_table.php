<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->table('carts', function (Blueprint $table): void {
            // Losowy, nieodgadnięty identyfikator koszyka używany przez
            // storefront (publiczne api/storefront/*) zamiast sekwencyjnego
            // `id` - inaczej dałoby się przeglądać/edytować cudze koszyki
            // po prostu zgadując kolejne liczby.
            $table->string('token', 64)->nullable()->unique();
        });
    }
};
