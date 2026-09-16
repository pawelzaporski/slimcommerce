<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Miejsca sprzedaży - osobne fronty sklepu (storefront) pod własnymi
        // domenami. `domain` to pełny origin (schemat + host [+ port]), bo
        // dokładnie taką wartość przeglądarka wysyła w nagłówku Origin i taką
        // odbijamy w Access-Control-Allow-Origin (patrz public/index.php).
        $schema->create('sales_channels', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->string('name');
            $table->string('domain')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
