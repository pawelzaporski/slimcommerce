<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Client;
use App\Models\ProductVariant;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Koszyk storefrontu jest identyfikowany losowym, nieodgadnionym `token`
 * (nie sekwencyjnym `id`, które dałoby się zgadywać) - front zapisuje go
 * u siebie (np. localStorage) i wysyła przy kolejnych żądaniach zamiast
 * numerycznego id. Te trasy są publiczne (api/storefront/*, bez JWT admina),
 * bo koszyk musi działać dla niezalogowanego gościa.
 *
 * UWAGA: `client_id` przyjmowane tu z requestu NIE jest dziś w żaden sposób
 * uwierzytelnione - w projekcie nie ma jeszcze logowania klientów sklepu
 * (tabela `clients` ma hasło, ale brak endpointu login). Dopóki taki
 * mechanizm nie powstanie, każdy wywołujący może podać dowolne client_id -
 * nie traktuj tego pola jako bezpiecznego źródła prawdy o tożsamości klienta.
 */
final class CartController
{
    #[OA\Post(
        path: '/api/storefront/carts',
        summary: 'Utworzenie koszyka (storefront)',
        description: 'Zwraca token identyfikujący koszyk - front zapisuje go i używa we wszystkich kolejnych żądaniach zamiast id.',
        tags: ['Storefront - Cart'],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', nullable: true),
                    new OA\Property(property: 'client_id', type: 'integer', nullable: true, description: 'Podaj, gdy koszyk zakłada zalogowany klient'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono koszyk', content: new OA\JsonContent(ref: '#/components/schemas/Cart')),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        if (isset($data['client_id']) && ! Client::query()->where('id', $data['client_id'])->exists()) {
            return $this->json($response, ['errors' => ['client_id' => 'Wskazany klient nie istnieje.']], 422);
        }

        $cart = Cart::query()->create([
            'token' => Cart::generateToken(),
            'client_id' => $data['client_id'] ?? null,
            'name' => $data['name'] ?? null,
            'status' => 'active',
            'last_interaction_at' => date('Y-m-d H:i:s'),
        ]);

        if (empty($cart->name)) {
            $cart->name = "Koszyk #{$cart->id}";
            $cart->save();
        }

        return $this->json($response, $cart->load('items.variant.product.image1')->toArray(), 201);
    }

    #[OA\Get(
        path: '/api/storefront/carts/{token}',
        summary: 'Podgląd koszyka po tokenie',
        tags: ['Storefront - Cart'],
        parameters: [new OA\Parameter(name: 'token', in: 'path', required: true, schema: new OA\Schema(type: 'string'))],
        responses: [
            new OA\Response(response: 200, description: 'Koszyk', content: new OA\JsonContent(ref: '#/components/schemas/Cart')),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $cart = $this->findByToken($args['token']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        return $this->json($response, $cart->load('items.variant.product.image1')->toArray());
    }

    #[OA\Put(
        path: '/api/storefront/carts/{token}',
        summary: 'Aktualizacja koszyka (np. przypięcie klienta po zalogowaniu)',
        tags: ['Storefront - Cart'],
        parameters: [new OA\Parameter(name: 'token', in: 'path', required: true, schema: new OA\Schema(type: 'string'))],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', nullable: true),
                    new OA\Property(property: 'client_id', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano koszyk', content: new OA\JsonContent(ref: '#/components/schemas/Cart')),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $cart = $this->findByToken($args['token']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        if (array_key_exists('client_id', $data) && $data['client_id'] !== null && ! Client::query()->where('id', $data['client_id'])->exists()) {
            return $this->json($response, ['errors' => ['client_id' => 'Wskazany klient nie istnieje.']], 422);
        }

        $cart->fill(array_intersect_key($data, array_flip(['name', 'client_id'])));
        $cart->last_interaction_at = date('Y-m-d H:i:s');
        $cart->save();

        return $this->json($response, $cart->load('items.variant.product.image1')->toArray());
    }

    #[OA\Post(
        path: '/api/storefront/carts/{token}/items',
        summary: 'Dodanie pozycji do koszyka',
        tags: ['Storefront - Cart'],
        parameters: [new OA\Parameter(name: 'token', in: 'path', required: true, schema: new OA\Schema(type: 'string'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['variant_id', 'quantity'],
                properties: [
                    new OA\Property(property: 'variant_id', type: 'integer'),
                    new OA\Property(property: 'quantity', type: 'integer', example: 1),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Dodano pozycję', content: new OA\JsonContent(ref: '#/components/schemas/CartItem')),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function addItem(Request $request, Response $response, array $args): Response
    {
        $cart = $this->findByToken($args['token']);

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validateItem($data);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        // Ten sam wariant dodany ponownie zwiększa ilość istniejącej pozycji
        // zamiast tworzyć duplikat wiersza.
        $item = $cart->items()->where('variant_id', $data['variant_id'])->first();

        if ($item) {
            $item->quantity += (int) $data['quantity'];
            $item->save();
        } else {
            $item = $cart->items()->create([
                'variant_id' => $data['variant_id'],
                'quantity' => $data['quantity'],
            ]);
        }

        $cart->status = 'active';
        $cart->last_interaction_at = date('Y-m-d H:i:s');
        $cart->save();

        return $this->json($response, $item->load('variant.product.image1')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/storefront/carts/{token}/items/{itemId}',
        summary: 'Zmiana ilości pozycji koszyka',
        tags: ['Storefront - Cart'],
        parameters: [
            new OA\Parameter(name: 'token', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'itemId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(required: ['quantity'], properties: [new OA\Property(property: 'quantity', type: 'integer')])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano pozycję', content: new OA\JsonContent(ref: '#/components/schemas/CartItem')),
            new OA\Response(response: 404, description: 'Koszyk lub pozycja nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function updateItem(Request $request, Response $response, array $args): Response
    {
        $item = $this->findItem($args['token'], (int) $args['itemId']);

        if (! $item) {
            return $this->json($response, ['error' => 'Pozycja nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        if (! isset($data['quantity']) || ! is_numeric($data['quantity']) || (int) $data['quantity'] < 1) {
            return $this->json($response, ['errors' => ['quantity' => 'Ilość musi być liczbą całkowitą większą od zera.']], 422);
        }

        $item->quantity = (int) $data['quantity'];
        $item->save();

        $item->cart->last_interaction_at = date('Y-m-d H:i:s');
        $item->cart->save();

        return $this->json($response, $item->load('variant.product.image1')->toArray());
    }

    #[OA\Delete(
        path: '/api/storefront/carts/{token}/items/{itemId}',
        summary: 'Usunięcie pozycji koszyka',
        tags: ['Storefront - Cart'],
        parameters: [
            new OA\Parameter(name: 'token', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'itemId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 404, description: 'Koszyk lub pozycja nie istnieje'),
        ]
    )]
    public function removeItem(Request $request, Response $response, array $args): Response
    {
        $item = $this->findItem($args['token'], (int) $args['itemId']);

        if (! $item) {
            return $this->json($response, ['error' => 'Pozycja nie istnieje.'], 404);
        }

        $cart = $item->cart;
        $item->delete();

        $cart->last_interaction_at = date('Y-m-d H:i:s');
        $cart->save();

        return $response->withStatus(204);
    }

    private function findByToken(string $token): ?Cart
    {
        return Cart::query()->where('token', $token)->first();
    }

    /**
     * Pobiera pozycję TYLKO jeśli należy do koszyka wskazanego tokenem -
     * inaczej ktoś znający sam numer pozycji (itemId) mógłby edytować
     * cudzy koszyk.
     */
    private function findItem(string $token, int $itemId): ?CartItem
    {
        $cart = $this->findByToken($token);

        if (! $cart) {
            return null;
        }

        return CartItem::query()->where('id', $itemId)->where('cart_id', $cart->id)->first();
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validateItem(array $data): array
    {
        $errors = [];

        if (empty($data['variant_id']) || ! ProductVariant::query()->where('id', $data['variant_id'])->exists()) {
            $errors['variant_id'] = 'Wskazany wariant produktu nie istnieje.';
        }

        if (! isset($data['quantity']) || ! is_numeric($data['quantity']) || (int) $data['quantity'] < 1) {
            $errors['quantity'] = 'Ilość musi być liczbą całkowitą większą od zera.';
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
