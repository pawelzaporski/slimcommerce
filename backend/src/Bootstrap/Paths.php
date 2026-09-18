<?php

declare(strict_types=1);

namespace App\Bootstrap;

/**
 * Ścieżki z .env (DB_DATABASE, LOG_PATH) mogą być bezwzględne albo względne
 * do katalogu głównego projektu - tu jest jedno miejsce, które to rozstrzyga.
 */
final class Paths
{
    public static function resolve(string $rootPath, string $path): string
    {
        if (str_starts_with($path, '/') || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1) {
            return $path;
        }

        return rtrim($rootPath, '/') . '/' . ltrim($path, '/');
    }

    public static function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }
    }
}
