<?php

declare(strict_types=1);

namespace App\Database;

use Illuminate\Database\Schema\Builder;

/**
 * Kontrakt pojedynczego pliku migracji w database/migrations/.
 * Migracje idą tylko "w przód" - nie ma wsparcia dla rollbacku (down()),
 * bo na tym etapie projektu nie jest potrzebne.
 */
interface Migration
{
    public function up(Builder $schema): void;
}
