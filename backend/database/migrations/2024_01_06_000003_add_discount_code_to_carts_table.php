<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Kod rabatowy "wpięty" w koszyk przez storefront - przeliczany przy
        // każdym odczycie koszyka i w checkoucie (nie zapisujemy kwot w koszyku).
        $schema->table('carts', function (Blueprint $table): void {
            $table->foreignId('discount_code_id')->nullable()->constrained('discount_codes')->nullOnDelete();
        });
    }
};
