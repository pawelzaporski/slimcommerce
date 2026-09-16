<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        // Pliki (obecnie zdjęcia) wgrywane przez panel - jeden rekord na plik
        // fizycznie leżący w public/uploads/. Produkt wskazuje na assety przez
        // products.image1_asset_id / image2_asset_id (dwa "główne" zdjęcia) oraz
        // przez tabelę product_assets (pozostałe zdjęcia - galeria).
        $schema->create('assets', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->string('filename');           // oryginalna nazwa pliku z uploadu
            $table->string('path')->unique();     // ścieżka względem public/, np. uploads/2026/09/abc.jpg
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');   // w bajtach
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt')->nullable();
            $table->timestamps();
        });
    }
};
