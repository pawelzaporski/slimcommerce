<?php

declare(strict_types=1);

namespace App\Bootstrap;

/**
 * Kieruje błędy PHP (error_log, ostrzeżenia, wyjątki logowane przez Slim)
 * do pliku pod naszą kontrolą. Na shared hostingu domyślny log Apache/PHP
 * jest zwykle niedostępny - a bez tego błędy produkcyjne po prostu giną.
 *
 * LOG_PATH w .env: ścieżka pliku (względna do katalogu projektu albo
 * bezwzględna). Pusta wartość = zostaw domyślne ustawienie PHP.
 *
 * Deprecacje (np. brick/math przy castach "decimal" w Eloquencie) logowane są
 * tylko w trybie debug - produkcyjnie zalewałyby plik logu kilkoma wpisami
 * na każde żądanie i zasłaniały prawdziwe błędy.
 */
final class Logging
{
    public static function configure(string $rootPath, string $logPath, bool $debug = true): void
    {
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');
        error_reporting($debug ? E_ALL : E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

        $logPath = trim($logPath);

        if ($logPath === '') {
            return;
        }

        $logFile = Paths::resolve($rootPath, $logPath);
        Paths::ensureDirectory(dirname($logFile));

        ini_set('error_log', $logFile);
    }
}
