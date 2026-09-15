<?php

declare(strict_types=1);

namespace App\Database;

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

/**
 * Uruchamia pliki migracji z database/migrations/ (posortowane po nazwie,
 * stąd prefiks daty w nazwie pliku), pomijając te już zapisane w tabeli
 * `migrations`. Każde uruchomienie run() jest tanie i idempotentne - można
 * je bezpiecznie wołać przy każdym starcie aplikacji.
 *
 * Dodanie nowej tabeli: nowy plik migracji w database/migrations/.
 * Dodanie kolumny do istniejącej tabeli: NIE edytuj starego pliku migracji
 * (już wykonany, nie zostanie ponownie uruchomiony) - dodaj nowy plik
 * z $schema->table('nazwa', function (Blueprint $table) { $table->... });
 */
final class Migrator
{
    private const string MIGRATIONS_PATH = __DIR__ . '/../../database/migrations';

    public static function run(): void
    {
        $schema = Capsule::schema();

        self::ensureMigrationsTableExists($schema);

        $files = self::migrationFiles();
        $alreadyRun = self::alreadyRunMigrations();

        // Baza istniała już przed wprowadzeniem tabeli `migrations`
        // (schemat tworzony był bezpośrednio, bez śledzenia) - żeby nie
        // próbować tworzyć tabel, które już są, i nie tracić w nich danych,
        // oznaczamy cały bieżący zestaw migracji jako już wykonany (batch 0).
        if ($alreadyRun === [] && $schema->hasTable('users')) {
            self::markAllAsRun($files);

            return;
        }

        $pending = array_values(array_filter(
            $files,
            static fn (string $file): bool => ! in_array(basename($file), $alreadyRun, true),
        ));

        if ($pending === []) {
            return;
        }

        $batch = self::nextBatchNumber();

        foreach ($pending as $file) {
            /** @var Migration $migration */
            $migration = require $file;
            $migration->up($schema);

            Capsule::table('migrations')->insert([
                'migration' => basename($file),
                'batch' => $batch,
            ]);
        }
    }

    private static function ensureMigrationsTableExists(Builder $schema): void
    {
        if ($schema->hasTable('migrations')) {
            return;
        }

        $schema->create('migrations', function (Blueprint $table): void {
            $table->id();
            $table->string('migration');
            $table->unsignedInteger('batch');
            $table->timestamp('run_at')->useCurrent();
        });
    }

    /**
     * @return list<string>
     */
    private static function migrationFiles(): array
    {
        $files = glob(self::MIGRATIONS_PATH . '/*.php') ?: [];
        sort($files);

        return $files;
    }

    /**
     * @return list<string>
     */
    private static function alreadyRunMigrations(): array
    {
        return Capsule::table('migrations')->pluck('migration')->all();
    }

    private static function nextBatchNumber(): int
    {
        return ((int) Capsule::table('migrations')->max('batch')) + 1;
    }

    /**
     * @param list<string> $files
     */
    private static function markAllAsRun(array $files): void
    {
        $rows = array_map(
            static fn (string $file): array => ['migration' => basename($file), 'batch' => 0],
            $files,
        );

        if ($rows !== []) {
            Capsule::table('migrations')->insert($rows);
        }
    }
}
