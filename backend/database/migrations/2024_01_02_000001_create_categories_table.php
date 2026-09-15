<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('categories', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->string('name');
            $table->string('slug')->unique();
            // Bez ->constrained() - samoreferencyjny klucz obcy w tym samym
            // CREATE TABLE nie jest potrzebny (parent_id sprawdzamy w kodzie).
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->timestamps();
        });
    }
};
