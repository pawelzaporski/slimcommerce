<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('shipping_methods', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->nullable()->index();
            $table->string('name');
            $table->decimal('flat_rate', 10, 2);
            $table->timestamps();
        });
    }
};
