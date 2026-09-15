<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('addresses', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->enum('type', ['billing', 'delivery']);
            $table->string('street');
            $table->string('city');
            $table->string('postal_code');
            $table->string('country');
            $table->timestamps();
        });
    }
};
