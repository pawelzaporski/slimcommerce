<?php

declare(strict_types=1);

namespace App\Support;

use Firebase\JWT\JWT as FirebaseJwt;
use Firebase\JWT\Key;

/**
 * Cienki wrapper na firebase/php-jwt - wystawianie i weryfikacja
 * tokenów dostępowych dla panelu admina (api/admin).
 */
final readonly class Jwt
{
    public function __construct(
        private string $secret,
        private int $ttlSeconds = 3600,
    ) {
    }

    /**
     * @param array<string, scalar|null> $claims
     */
    public function issue(array $claims): string
    {
        $now = time();

        $payload = [...$claims, 'iat' => $now, 'exp' => $now + $this->ttlSeconds];

        return FirebaseJwt::encode($payload, $this->secret, 'HS256');
    }

    /**
     * @return array<string, mixed>
     *
     * @throws \Throwable gdy token jest nieprawidłowy, wygasły lub źle podpisany
     */
    public function verify(string $token): array
    {
        $decoded = FirebaseJwt::decode($token, new Key($this->secret, 'HS256'));

        return (array) $decoded;
    }
}
