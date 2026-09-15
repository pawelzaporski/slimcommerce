<?php

declare(strict_types=1);

namespace App\Bootstrap;

use Illuminate\Database\Capsule\Manager as Capsule;

/**
 * Inicjalizuje połączenie Eloquenta (Capsule) z bazą SQLite
 * na podstawie konfiguracji wczytanej z .env.
 */
final readonly class Database
{
    public function __construct(private string $databasePath)
    {
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

        $directory = dirname($this->databasePath);

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        if (! file_exists($this->databasePath)) {
            touch($this->databasePath);
        }
    }
}
