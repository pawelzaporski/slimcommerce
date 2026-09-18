<?php

declare(strict_types=1);

namespace App\Database;

use RuntimeException;

/**
 * Migracje + seed superadmina pod jedną blokadą plikową (flock), żeby dwa
 * równoległe żądania na świeżej bazie nie próbowały tworzyć tych samych
 * tabel / tego samego konta naraz (SQLite nie ochroni przed tym sam).
 *
 * Wołane:
 * - przy każdym żądaniu, gdy DB_AUTO_MIGRATE=true (wygodne w developmencie),
 * - ręcznie: `php bin/migrate.php` (CLI) albo `POST /api/admin/migrate`
 *   z nagłówkiem X-Migrate-Key (shared hosting bez SSH, po wgraniu plików).
 */
final class Installer
{
    private const string LOCK_FILE = __DIR__ . '/../../database/.install.lock';

    /**
     * @return list<string> nazwy plików migracji wykonanych w tym przebiegu
     */
    public static function run(): array
    {
        $lock = fopen(self::LOCK_FILE, 'c');

        if ($lock === false) {
            throw new RuntimeException('Nie można otworzyć pliku blokady: ' . self::LOCK_FILE);
        }

        try {
            if (! flock($lock, LOCK_EX)) {
                throw new RuntimeException('Nie można założyć blokady migracji.');
            }

            $executed = Migrator::run();
            Seeder::run();

            return $executed;
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
