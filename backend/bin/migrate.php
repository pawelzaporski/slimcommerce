<?php

declare(strict_types=1);

/**
 * Ręczne uruchomienie migracji + seedu superadmina:
 *   php bin/migrate.php
 * Używaj, gdy w .env jest DB_AUTO_MIGRATE=false (produkcja) - albo zawsze,
 * gdy chcesz mieć pewność, że schemat jest aktualny po wgraniu nowej wersji.
 */

use App\Bootstrap\Database;
use App\Bootstrap\Logging;
use App\Database\Installer;
use Dotenv\Dotenv;

require dirname(__DIR__) . '/vendor/autoload.php';

$rootPath = dirname(__DIR__);

Dotenv::createImmutable($rootPath)->load();
Logging::configure($rootPath, (string) ($_ENV['LOG_PATH'] ?? 'storage/logs/php-error.log'), filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOL));

Database::fromEnv($rootPath, $_ENV)->boot();

$executed = Installer::run();

if ($executed === []) {
    echo 'Schemat aktualny - brak nowych migracji.' . PHP_EOL;
} else {
    echo 'Wykonano migracje:' . PHP_EOL;
    foreach ($executed as $name) {
        echo "  - {$name}" . PHP_EOL;
    }
}
