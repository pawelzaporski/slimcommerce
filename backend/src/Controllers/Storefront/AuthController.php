<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\Client;
use App\Support\Jwt;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final readonly class AuthController
{
    private const array CLIENT_TYPES = ['b2c', 'b2b', 'gov'];

    public function __construct(private Jwt $jwt)
    {
    }

    #[OA\Post(
        path: '/api/storefront/register',
        summary: 'Rejestracja klienta (sklep)',
        description: 'Zakłada konto klienta i od razu zwraca token JWT (jak przy logowaniu).',
        tags: ['Storefront - Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['first_name', 'last_name', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'first_name', type: 'string', example: 'Jan'),
                    new OA\Property(property: 'last_name', type: 'string', example: 'Kowalski'),
                    new OA\Property(property: 'email', type: 'string', example: 'jan.kowalski@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                    new OA\Property(property: 'client_type', type: 'string', enum: ['b2c', 'b2b', 'gov'], default: 'b2c'),
                    new OA\Property(property: 'company_name', type: 'string', nullable: true),
                    new OA\Property(property: 'nip', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Utworzono konto',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'token', type: 'string'),
                        new OA\Property(property: 'client', ref: '#/components/schemas/Client'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function register(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data);

        if ($errors === [] && Client::query()->where('email', $data['email'])->exists()) {
            $errors['email'] = 'Klient z takim adresem e-mail już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $client = Client::query()->create([
            'client_type' => $data['client_type'] ?? 'b2c',
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'company_name' => $data['company_name'] ?? null,
            'nip' => $data['nip'] ?? null,
            'email' => $data['email'],
            'password' => password_hash((string) $data['password'], PASSWORD_DEFAULT),
        ]);

        return $this->json($response, [
            'token' => $this->issueToken($client),
            'client' => $client,
        ], 201);
    }

    #[OA\Post(
        path: '/api/storefront/login',
        summary: 'Logowanie klienta (sklep)',
        tags: ['Storefront - Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', example: 'jan.kowalski@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Zalogowano pomyślnie',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'token', type: 'string'),
                        new OA\Property(property: 'client', ref: '#/components/schemas/Client'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Nieprawidłowy email lub hasło'),
        ]
    )]
    public function login(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        /** @var Client|null $client */
        $client = Client::query()->where('email', $email)->first();

        if (! $client || ! password_verify($password, $client->password)) {
            return $this->json($response, ['error' => 'Nieprawidłowy email lub hasło.'], 401);
        }

        return $this->json($response, [
            'token' => $this->issueToken($client),
            'client' => $client,
        ]);
    }

    #[OA\Get(
        path: '/api/storefront/me',
        summary: 'Profil zalogowanego klienta',
        security: [['bearerAuth' => []]],
        tags: ['Storefront - Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Profil klienta', content: new OA\JsonContent(ref: '#/components/schemas/Client')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function me(Request $request, Response $response): Response
    {
        $claims = $request->getAttribute('authClient');
        $client = Client::query()->find((int) $claims['sub']);

        if (! $client) {
            return $this->json($response, ['error' => 'Brak autoryzacji.'], 401);
        }

        return $this->json($response, $client->toArray());
    }

    private function issueToken(Client $client): string
    {
        return $this->jwt->issue([
            'sub' => $client->id,
            'email' => $client->email,
            'type' => 'client',
        ]);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data): array
    {
        $errors = [];

        if (empty($data['first_name']) || ! is_string($data['first_name'])) {
            $errors['first_name'] = 'Pole first_name jest wymagane.';
        }

        if (empty($data['last_name']) || ! is_string($data['last_name'])) {
            $errors['last_name'] = 'Pole last_name jest wymagane.';
        }

        if (empty($data['email']) || ! is_string($data['email']) || ! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Pole email musi być poprawnym adresem e-mail.';
        }

        if (empty($data['password']) || ! is_string($data['password']) || strlen($data['password']) < 6) {
            $errors['password'] = 'Hasło musi mieć co najmniej 6 znaków.';
        }

        if (array_key_exists('client_type', $data) && ! in_array($data['client_type'], self::CLIENT_TYPES, true)) {
            $errors['client_type'] = 'Nieprawidłowy typ klienta.';
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function json(Response $response, array $payload, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
