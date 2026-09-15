<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\User;
use App\Support\Jwt;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final readonly class AuthController
{
    public function __construct(private Jwt $jwt)
    {
    }

    #[OA\Post(
        path: '/api/admin/login',
        summary: 'Logowanie do panelu admina',
        description: 'Weryfikuje dane logowania pracownika (tabela users) i zwraca token JWT.',
        tags: ['Admin - Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', example: 'superadmin'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'superadmin'),
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
                        new OA\Property(property: 'user', ref: '#/components/schemas/User'),
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

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! password_verify($password, $user->password)) {
            return $this->json($response, ['error' => 'Nieprawidłowy email lub hasło.'], 401);
        }

        $token = $this->jwt->issue([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
        ]);

        return $this->json($response, [
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
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
