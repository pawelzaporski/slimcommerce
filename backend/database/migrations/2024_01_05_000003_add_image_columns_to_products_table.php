<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->table('products', function (Blueprint $table): void {
            // Dwa główne zdjęcia produktu (np. przód/tył) trzymane wprost na
            // produkcie - bez joinów przy listingu. Bez klucza obcego na poziomie
            // bazy, bo SQLite nie pozwala dodać FK przez ALTER TABLE; spójność
            // (zerowanie po usunięciu assetu) pilnuje AssetController::delete().
            $table->unsignedBigInteger('image1_asset_id')->nullable()->index();
            $table->unsignedBigInteger('image2_asset_id')->nullable()->index();
        });
    }
};
