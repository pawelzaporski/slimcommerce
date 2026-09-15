<?php

declare(strict_types=1);

namespace App\Database;

use App\Models\User;

/**
 * Zapewnia istnienie domyślnego konta superadmina, potrzebnego
 * do pierwszego zalogowania się do panelu (api/admin/login).
 *
 * Dane logowania są zaszyte na stałe (nie w .env) - to jedyne konto
 * zakładane automatycznie, tylko gdy w bazie nie ma jeszcze żadnego
 * użytkownika o roli "superadmin". Zmień hasło po pierwszym zalogowaniu
 * przed jakimkolwiek wdrożeniem poza lokalny development.
 */
final class Seeder
{
    private const string DEFAULT_NAME = 'Super Admin';
    private const string DEFAULT_EMAIL = 'superadmin';
    private const string DEFAULT_PASSWORD = 'superadmin';

    public static function run(): void
    {
        if (User::query()->where('role', 'superadmin')->exists()) {
            return;
        }

        User::query()->create([
            'name' => self::DEFAULT_NAME,
            'email' => self::DEFAULT_EMAIL,
            'password' => password_hash(self::DEFAULT_PASSWORD, PASSWORD_DEFAULT),
            'role' => 'superadmin',
        ]);
    }
}
