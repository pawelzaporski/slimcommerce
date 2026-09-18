<?php

declare(strict_types=1);

namespace App\Bootstrap;

use Illuminate\Database\Capsule\Manager as Capsule;

/**
 * Inicjalizuje połączenie Eloquenta (Capsule) z bazą SQLite
 * na podstawie konfiguracji wczytanej z .env.
 *
 * SQLite pod równoległym ruchem (kilka procesów PHP na shared hostingu):
 * - journal_mode=WAL: odczyty nie blokują zapisu i odwrotnie (zamiast
 *   "database is locked" przy każdym nałożeniu się żądań). Obok bazy
 *   pojawiają się pliki -wal i -shm - to normalne, muszą być zapisywalne.
 * - busy_timeout: zamiast natychmiastowego błędu przy zajętej bazie PHP
 *   czeka do N ms na zwolnienie blokady.
 * Oba sterowane z .env (DB_SQLITE_WAL, DB_BUSY_TIMEOUT_MS).
 */
final readonly class Database
{
    public function __construct(
        private string $databasePath,
        private bool $walMode = true,
        private int $busyTimeoutMs = 5000,
    ) {
    }

    /**
     * @param array<string, mixed> $env
     */
    public static function fromEnv(string $rootPath, array $env): self
    {
        $databasePath = (string) ($env['DB_DATABASE'] ?? 'database/database.sqlite');

        if ($databasePath !== ':memory:') {
            $databasePath = Paths::resolve($rootPath, $databasePath);
        }

        return new self(
            databasePath: $databasePath,
            walMode: filter_var($env['DB_SQLITE_WAL'] ?? 'true', FILTER_VALIDATE_BOOL),
            busyTimeoutMs: max(0, (int) ($env['DB_BUSY_TIMEOUT_MS'] ?? 5000)),
        );
    }

    public function boot(): Capsule
    {
        $this->ensureDatabaseFileExists();

        $capsule = new Capsule();

        $capsule->addConnection([
            'driver' => 'sqlite',
            'database' => $this->databasePath,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);

        $capsule->setAsGlobal();
        $capsule->bootEloquent();

        $pdo = $capsule->getConnection()->getPdo();

        if ($this->busyTimeoutMs > 0) {
            $pdo->exec('PRAGMA busy_timeout = ' . $this->busyTimeoutMs);
        }

        if ($this->walMode && $this->databasePath !== ':memory:') {
            $pdo->exec('PRAGMA journal_mode = WAL');
        }

        return $capsule;
    }

    /**
     * illuminate/database (bez pełnego frameworka) próbuje przez realpath()
     * zweryfikować ścieżkę do pliku SQLite, a gdy plik jeszcze nie istnieje,
     * odwołuje się do nieistniejącego w tym kontekście helpera base_path()
     * z illuminate/support. Zakładamy więc plik (i katalog) z wyprzedzeniem.
     */
    private function ensureDatabaseFileExists(): void
    {
        if ($this->databasePath === ':memory:') {
            return;
        }

        Paths::ensureDirectory(dirname($this->databasePath));

        if (! file_exists($this->databasePath)) {
            touch($this->databasePath);
        }
    }
}
