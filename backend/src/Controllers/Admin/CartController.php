<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Cart;
use App\Models\Client;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CartController
{
    #[OA\Get(
        path: '/api/admin/carts',
        summary: 'Lista koszyków',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Stronicowana lista koszyków',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Cart')),
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

        $total = Cart::query()->count();

        $carts = Cart::query()
            ->with('client')
            ->withCount('items')
            ->orderByDesc('id')
            ->forPage($page, $perPage)
            ->get();

        return $this->json($response, [
            'data' => $carts,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/carts/{id}',
        summary: 'Szczegóły koszyka (wraz z pozycjami)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Koszyk', content: new OA\JsonContent(ref: '#/components/schemas/Cart')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $cart = Cart::query()->with(['client', 'items.variant'])->find((int) $args['id']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        return $this->json($response, $cart->toArray());
    }

    #[OA\Post(
        path: '/api/admin/carts',
        summary: 'Dodanie koszyka',
        description: 'Jeśli nazwa nie zostanie podana, zostanie ustawiona automatycznie na "Koszyk #{id}". Pole client_id jest opcjonalne - puste oznacza koszyk gościa (niezalogowanego klienta), podane wiąże koszyk z zalogowanym klientem.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', nullable: true, example: 'Mój koszyk'),
                    new OA\Property(property: 'client_id', type: 'integer', nullable: true, description: 'ID zalogowanego klienta, jeśli koszyk nie jest koszykiem gościa'),
                    new OA\Property(property: 'status', type: 'string', default: 'active'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono koszyk', content: new OA\JsonContent(ref: '#/components/schemas/Cart')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $cart = Cart::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'token' => Cart::generateToken(),
            'client_id' => $data['client_id'] ?? null,
            'name' => $data['name'] ?? null,
            'status' => $data['status'] ?? 'active',
            'last_interaction_at' => date('Y-m-d H:i:s'),
        ]);

        if (empty($cart->name)) {
            $cart->name = "Koszyk #{$cart->id}";
            $cart->save();
        }

        return $this->json($response, $cart->load('client')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/carts/{id}',
        summary: 'Edycja koszyka',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', nullable: true),
                    new OA\Property(property: 'client_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'status', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano koszyk', content: new OA\JsonContent(ref: '#/components/schemas/Cart')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $cart = Cart::query()->find((int) $args['id']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $cart->fill(array_intersect_key($data, array_flip(['external_id', 'name', 'client_id', 'status'])));
        $cart->last_interaction_at = date('Y-m-d H:i:s');
        $cart->save();

        return $this->json($response, $cart->load('client')->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/carts/{id}',
        summary: 'Usunięcie koszyka',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $cart = Cart::query()->find((int) $args['id']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        $cart->delete();

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

        if (isset($data['client_id']) && $data['client_id'] !== null && ! Client::query()->where('id', $data['client_id'])->exists()) {
            $errors['client_id'] = 'Wskazany klient nie istnieje.';
        }

        if (isset($data['status']) && ! in_array($data['status'], Cart::STATUSES, true)) {
            $errors['status'] = 'Nieprawidłowy status koszyka. Dozwolone: ' . implode(', ', Cart::STATUSES) . '.';
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
