<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CartItemController
{
    #[OA\Post(
        path: '/api/admin/carts/{cartId}/items',
        summary: 'Dodanie pozycji do koszyka',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [new OA\Parameter(name: 'cartId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['variant_id', 'quantity'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'variant_id', type: 'integer'),
                    new OA\Property(property: 'quantity', type: 'integer', example: 1),
                    new OA\Property(property: 'custom_price', type: 'number', format: 'float', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Dodano pozycję', content: new OA\JsonContent(ref: '#/components/schemas/CartItem')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response, array $args): Response
    {
        $cart = Cart::query()->find((int) $args['cartId']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $item = $cart->items()->create([
            'external_id' => $data['external_id'] ?? null,
            'variant_id' => $data['variant_id'],
            'quantity' => $data['quantity'],
            'custom_price' => $data['custom_price'] ?? null,
        ]);

        $cart->last_interaction_at = date('Y-m-d H:i:s');
        $cart->save();

        return $this->json($response, $item->load('variant')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/cart-items/{id}',
        summary: 'Edycja pozycji koszyka',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'quantity', type: 'integer'),
                    new OA\Property(property: 'custom_price', type: 'number', format: 'float', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano pozycję', content: new OA\JsonContent(ref: '#/components/schemas/CartItem')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Pozycja nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $item = CartItem::query()->find((int) $args['id']);

        if (! $item) {
            return $this->json($response, ['error' => 'Pozycja nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $item->fill(array_intersect_key($data, array_flip(['quantity', 'custom_price'])));
        $item->save();

        return $this->json($response, $item->load('variant')->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/cart-items/{id}',
        summary: 'Usunięcie pozycji koszyka',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Carts'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Pozycja nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $item = CartItem::query()->find((int) $args['id']);

        if (! $item) {
            return $this->json($response, ['error' => 'Pozycja nie istnieje.'], 404);
        }

        $item->delete();

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

        if (! $partial || array_key_exists('variant_id', $data)) {
            if (empty($data['variant_id']) || ! ProductVariant::query()->where('id', $data['variant_id'])->exists()) {
                $errors['variant_id'] = 'Wskazany wariant produktu nie istnieje.';
            }
        }

        if (! $partial || array_key_exists('quantity', $data)) {
            if (! isset($data['quantity']) || ! is_numeric($data['quantity']) || (int) $data['quantity'] < 1) {
                $errors['quantity'] = 'Ilość musi być liczbą całkowitą większą od zera.';
            }
        }

        if (isset($data['custom_price']) && $data['custom_price'] !== null && ! is_numeric($data['custom_price'])) {
            $errors['custom_price'] = 'Pole custom_price musi być liczbą.';
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
