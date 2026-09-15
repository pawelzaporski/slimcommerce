<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Address;
use App\Models\Client;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class OrderController
{
    #[OA\Get(
        path: '/api/admin/orders',
        summary: 'Lista zamówień',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Stronicowana lista zamówień',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Order')),
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
        $status = trim((string) ($query['status'] ?? ''));

        $builder = Order::query()->with('client');

        if ($status !== '') {
            $builder->where('status', $status);
        }

        $total = (clone $builder)->count();

        $orders = $builder
            ->orderByDesc('id')
            ->forPage($page, $perPage)
            ->get();

        return $this->json($response, [
            'data' => $orders,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/orders/{id}',
        summary: 'Szczegóły zamówienia',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Zamówienie', content: new OA\JsonContent(ref: '#/components/schemas/Order')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Zamówienie nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $order = Order::query()
            ->with(['client', 'billingAddress', 'deliveryAddress', 'shippingMethod', 'items.variant', 'payments'])
            ->find((int) $args['id']);

        if (! $order) {
            return $this->json($response, ['error' => 'Zamówienie nie istnieje.'], 404);
        }

        return $this->json($response, $order->toArray());
    }

    #[OA\Post(
        path: '/api/admin/orders',
        summary: 'Dodanie zamówienia',
        description: 'Tworzy zamówienie z pozycjami. Cena jednostkowa każdej pozycji to bieżąca cena wariantu w chwili złożenia zamówienia. total_amount jest wyliczana po stronie serwera (suma pozycji + koszt dostawy).',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['client_id', 'items'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'client_id', type: 'integer'),
                    new OA\Property(property: 'billing_address_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'delivery_address_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'shipping_method_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'status', type: 'string', default: 'pending'),
                    new OA\Property(
                        property: 'items',
                        type: 'array',
                        items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'variant_id', type: 'integer'),
                                new OA\Property(property: 'quantity', type: 'integer', example: 1),
                            ]
                        )
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono zamówienie', content: new OA\JsonContent(ref: '#/components/schemas/Order')),
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

        $shippingMethod = isset($data['shipping_method_id']) && $data['shipping_method_id'] !== null
            ? ShippingMethod::query()->find((int) $data['shipping_method_id'])
            : null;

        $order = Order::query()->getConnection()->transaction(function () use ($data, $shippingMethod): Order {
            $itemsTotal = 0.0;
            $variants = [];

            foreach ($data['items'] as $item) {
                $variant = ProductVariant::query()->find((int) $item['variant_id']);
                $quantity = (int) $item['quantity'];
                $itemsTotal += (float) $variant->price * $quantity;
                $variants[] = ['variant' => $variant, 'quantity' => $quantity];
            }

            $shippingCost = $shippingMethod ? (float) $shippingMethod->flat_rate : 0.0;

            $order = Order::query()->create([
                'external_id' => $data['external_id'] ?? null,
                'client_id' => $data['client_id'],
                'billing_address_id' => $data['billing_address_id'] ?? null,
                'delivery_address_id' => $data['delivery_address_id'] ?? null,
                'shipping_method_id' => $data['shipping_method_id'] ?? null,
                'total_amount' => round($itemsTotal + $shippingCost, 2),
                'status' => $data['status'] ?? 'pending',
            ]);

            foreach ($variants as $entry) {
                $order->items()->create([
                    'variant_id' => $entry['variant']->id,
                    'quantity' => $entry['quantity'],
                    'unit_price' => $entry['variant']->price,
                ]);
            }

            return $order;
        });

        return $this->json($response, $order->load(['client', 'items.variant'])->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/orders/{id}',
        summary: 'Edycja zamówienia (status, adresy, metoda dostawy)',
        description: 'Pozycje zamówienia (items) nie są edytowalne po utworzeniu - w razie pomyłki usuń zamówienie i złóż nowe.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'status', type: 'string'),
                    new OA\Property(property: 'billing_address_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'delivery_address_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'shipping_method_id', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano zamówienie', content: new OA\JsonContent(ref: '#/components/schemas/Order')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Zamówienie nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $order = Order::query()->find((int) $args['id']);

        if (! $order) {
            return $this->json($response, ['error' => 'Zamówienie nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = [];

        if (array_key_exists('status', $data) && ! in_array($data['status'], Order::STATUSES, true)) {
            $errors['status'] = 'Nieprawidłowy status zamówienia. Dozwolone: ' . implode(', ', Order::STATUSES) . '.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $order->fill(array_intersect_key($data, array_flip(['status', 'billing_address_id', 'delivery_address_id', 'shipping_method_id'])));
        $order->save();

        return $this->json($response, $order->load(['client', 'items.variant'])->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/orders/{id}',
        summary: 'Usunięcie zamówienia',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Zamówienie nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $order = Order::query()->find((int) $args['id']);

        if (! $order) {
            return $this->json($response, ['error' => 'Zamówienie nie istnieje.'], 404);
        }

        $order->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data): array
    {
        $errors = [];

        if (empty($data['client_id']) || ! Client::query()->where('id', $data['client_id'])->exists()) {
            $errors['client_id'] = 'Wskazany klient nie istnieje.';
        }

        if (isset($data['billing_address_id']) && $data['billing_address_id'] !== null && ! Address::query()->where('id', $data['billing_address_id'])->exists()) {
            $errors['billing_address_id'] = 'Wskazany adres rozliczeniowy nie istnieje.';
        }

        if (isset($data['delivery_address_id']) && $data['delivery_address_id'] !== null && ! Address::query()->where('id', $data['delivery_address_id'])->exists()) {
            $errors['delivery_address_id'] = 'Wskazany adres dostawy nie istnieje.';
        }

        if (isset($data['shipping_method_id']) && $data['shipping_method_id'] !== null && ! ShippingMethod::query()->where('id', $data['shipping_method_id'])->exists()) {
            $errors['shipping_method_id'] = 'Wskazana metoda dostawy nie istnieje.';
        }

        if (isset($data['status']) && ! in_array($data['status'], Order::STATUSES, true)) {
            $errors['status'] = 'Nieprawidłowy status zamówienia. Dozwolone: ' . implode(', ', Order::STATUSES) . '.';
        }

        if (empty($data['items']) || ! is_array($data['items'])) {
            $errors['items'] = 'Zamówienie musi zawierać co najmniej jedną pozycję.';

            return $errors;
        }

        foreach ($data['items'] as $index => $item) {
            if (! is_array($item) || empty($item['variant_id']) || ! ProductVariant::query()->where('id', $item['variant_id'])->exists()) {
                $errors["items.{$index}.variant_id"] = 'Wskazany wariant produktu nie istnieje.';
            }

            if (! is_array($item) || ! isset($item['quantity']) || ! is_numeric($item['quantity']) || (int) $item['quantity'] < 1) {
                $errors["items.{$index}.quantity"] = 'Ilość musi być liczbą całkowitą większą od zera.';
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
