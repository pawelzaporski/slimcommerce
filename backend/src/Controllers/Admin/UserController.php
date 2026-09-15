<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\User;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class UserController
{
    private const array ROLES = ['superadmin', 'admin'];

    #[OA\Get(
        path: '/api/admin/users',
        summary: 'Lista użytkowników panelu admina',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Users'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista użytkowników',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/User'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $users = User::query()->orderBy('id')->get();

        return $this->json($response, $users->toArray());
    }

    #[OA\Post(
        path: '/api/admin/users',
        summary: 'Dodanie użytkownika panelu admina',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Users'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'role'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', example: 'Anna Nowak'),
                    new OA\Property(property: 'email', type: 'string', example: 'anna.nowak@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                    new OA\Property(property: 'role', type: 'string', enum: ['superadmin', 'admin'], default: 'admin'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono użytkownika', content: new OA\JsonContent(ref: '#/components/schemas/User')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data);

        if ($errors === [] && User::query()->where('email', $data['email'])->exists()) {
            $errors['email'] = 'Użytkownik z takim adresem e-mail już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $user = User::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => password_hash((string) $data['password'], PASSWORD_DEFAULT),
            'role' => $data['role'],
        ]);

        return $this->json($response, $user->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/users/{id}',
        summary: 'Edycja użytkownika panelu admina',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Users'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'email', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', description: 'Podaj tylko, gdy zmieniasz hasło'),
                    new OA\Property(property: 'role', type: 'string', enum: ['superadmin', 'admin']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano użytkownika', content: new OA\JsonContent(ref: '#/components/schemas/User')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Użytkownik nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $user = User::query()->find((int) $args['id']);

        if (! $user) {
            return $this->json($response, ['error' => 'Użytkownik nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true);

        if (
            $errors === []
            && array_key_exists('email', $data)
            && User::query()->where('email', $data['email'])->where('id', '!=', $user->id)->exists()
        ) {
            $errors['email'] = 'Użytkownik z takim adresem e-mail już istnieje.';
        }

        if (
            $errors === []
            && array_key_exists('role', $data)
            && $data['role'] !== 'superadmin'
            && $user->role === 'superadmin'
            && User::query()->where('role', 'superadmin')->where('id', '!=', $user->id)->doesntExist()
        ) {
            $errors['role'] = 'To jedyne konto superadmina - nie można odebrać mu tej roli.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $user->fill(array_intersect_key($data, array_flip(['external_id', 'name', 'email', 'role'])));

        if (! empty($data['password'])) {
            $user->password = password_hash((string) $data['password'], PASSWORD_DEFAULT);
        }

        $user->save();

        return $this->json($response, $user->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/users/{id}',
        summary: 'Usunięcie użytkownika panelu admina',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Users'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Użytkownik nie istnieje'),
            new OA\Response(response: 422, description: 'Nie można usunąć własnego konta ani jedynego superadmina'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $user = User::query()->find((int) $args['id']);

        if (! $user) {
            return $this->json($response, ['error' => 'Użytkownik nie istnieje.'], 404);
        }

        $authUser = (array) $request->getAttribute('authUser', []);

        if (isset($authUser['sub']) && (int) $authUser['sub'] === $user->id) {
            return $this->json($response, ['error' => 'Nie można usunąć własnego konta.'], 422);
        }

        if ($user->role === 'superadmin' && User::query()->where('role', 'superadmin')->where('id', '!=', $user->id)->doesntExist()) {
            return $this->json($response, ['error' => 'To jedyne konto superadmina - nie można go usunąć.'], 422);
        }

        $user->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data, bool $partial = false): array
    {
        $errors = [];

        if (! $partial || array_key_exists('name', $data)) {
            if (empty($data['name']) || ! is_string($data['name'])) {
                $errors['name'] = 'Pole name jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('email', $data)) {
            // Bez FILTER_VALIDATE_EMAIL - domyślne konto superadmina (Seeder)
            // ma login "superadmin", nie prawdziwy adres e-mail.
            if (empty($data['email']) || ! is_string($data['email'])) {
                $errors['email'] = 'Pole email jest wymagane.';
            }
        }

        if (! $partial && (empty($data['password']) || ! is_string($data['password']) || strlen($data['password']) < 6)) {
            $errors['password'] = 'Hasło musi mieć co najmniej 6 znaków.';
        }

        if (! $partial || array_key_exists('role', $data)) {
            if (empty($data['role']) || ! in_array($data['role'], self::ROLES, true)) {
                $errors['role'] = 'Pole role musi mieć wartość superadmin lub admin.';
            }
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
