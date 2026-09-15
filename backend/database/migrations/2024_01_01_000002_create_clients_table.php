<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('clients', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->enum('client_type', ['b2c', 'b2b', 'gov'])->default('b2c');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('company_name')->nullable();
            $table->string('nip')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->timestamps();
        });
    }
};
