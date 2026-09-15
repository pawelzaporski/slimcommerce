<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Client;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ClientController
{
    private const array CLIENT_TYPES = ['b2c', 'b2b', 'gov'];
    private const array FILLABLE = ['external_id', 'client_type', 'first_name', 'last_name', 'company_name', 'nip', 'email', 'discount_percent'];

    #[OA\Get(
        path: '/api/admin/clients',
        summary: 'Lista klientów',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'search', in: 'query', description: 'Filtruje po imieniu, nazwisku, firmie lub e-mailu', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Stronicowana lista klientów',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Client')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $query = $request->getQueryParams();
        $page = max(1, (int) ($query['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($query['per_page'] ?? 15)));
        $search = trim((string) ($query['search'] ?? ''));

        $builder = Client::query();

        if ($search !== '') {
            $builder->where(function ($q) use ($search): void {
                $like = '%' . $search . '%';
                $q->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('company_name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            });
        }

        $total = (clone $builder)->count();

        $clients = $builder
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get();

        return $this->json($response, [
            'data' => $clients,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/clients/{id}',
        summary: 'Szczegóły klienta (wraz z adresami)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Klient', content: new OA\JsonContent(ref: '#/components/schemas/Client')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Klient nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $client = Client::query()->with('addresses')->find((int) $args['id']);

        if (! $client) {
            return $this->json($response, ['error' => 'Klient nie istnieje.'], 404);
        }

        return $this->json($response, $client->toArray());
    }

    #[OA\Post(
        path: '/api/admin/clients',
        summary: 'Dodanie klienta',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['first_name', 'last_name', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'client_type', type: 'string', enum: ['b2c', 'b2b', 'gov'], default: 'b2c'),
                    new OA\Property(property: 'first_name', type: 'string', example: 'Jan'),
                    new OA\Property(property: 'last_name', type: 'string', example: 'Kowalski'),
                    new OA\Property(property: 'company_name', type: 'string', nullable: true),
                    new OA\Property(property: 'nip', type: 'string', nullable: true),
                    new OA\Property(property: 'email', type: 'string', example: 'jan.kowalski@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                    new OA\Property(property: 'discount_percent', type: 'number', format: 'float', default: 0),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono klienta', content: new OA\JsonContent(ref: '#/components/schemas/Client')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
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
            'external_id' => $data['external_id'] ?? null,
            'client_type' => $data['client_type'] ?? 'b2c',
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'company_name' => $data['company_name'] ?? null,
            'nip' => $data['nip'] ?? null,
            'email' => $data['email'],
            'password' => password_hash((string) $data['password'], PASSWORD_DEFAULT),
            'discount_percent' => $data['discount_percent'] ?? 0,
        ]);

        return $this->json($response, $client->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/clients/{id}',
        summary: 'Edycja klienta',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'client_type', type: 'string', enum: ['b2c', 'b2b', 'gov']),
                    new OA\Property(property: 'first_name', type: 'string'),
                    new OA\Property(property: 'last_name', type: 'string'),
                    new OA\Property(property: 'company_name', type: 'string', nullable: true),
                    new OA\Property(property: 'nip', type: 'string', nullable: true),
                    new OA\Property(property: 'email', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', description: 'Podaj tylko, gdy zmieniasz hasło'),
                    new OA\Property(property: 'discount_percent', type: 'number', format: 'float'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano klienta', content: new OA\JsonContent(ref: '#/components/schemas/Client')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Klient nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $client = Client::query()->find((int) $args['id']);

        if (! $client) {
            return $this->json($response, ['error' => 'Klient nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data, partial: true);

        if (
            $errors === []
            && array_key_exists('email', $data)
            && Client::query()->where('email', $data['email'])->where('id', '!=', $client->id)->exists()
        ) {
            $errors['email'] = 'Klient z takim adresem e-mail już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $client->fill(array_intersect_key($data, array_flip(self::FILLABLE)));

        if (! empty($data['password'])) {
            $client->password = password_hash((string) $data['password'], PASSWORD_DEFAULT);
        }

        $client->save();

        return $this->json($response, $client->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/clients/{id}',
        summary: 'Usunięcie klienta',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Klient nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $client = Client::query()->find((int) $args['id']);

        if (! $client) {
            return $this->json($response, ['error' => 'Klient nie istnieje.'], 404);
        }

        $client->delete();

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

        if (! $partial || array_key_exists('first_name', $data)) {
            if (empty($data['first_name']) || ! is_string($data['first_name'])) {
                $errors['first_name'] = 'Pole first_name jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('last_name', $data)) {
            if (empty($data['last_name']) || ! is_string($data['last_name'])) {
                $errors['last_name'] = 'Pole last_name jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('email', $data)) {
            if (empty($data['email']) || ! is_string($data['email']) || ! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Pole email musi być poprawnym adresem e-mail.';
            }
        }

        if (! $partial && (empty($data['password']) || ! is_string($data['password']) || strlen($data['password']) < 6)) {
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
