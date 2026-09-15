<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Client;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ShippingMethod;
use App\Support\Jwt;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/**
 * Zamienia koszyk (cart_token) w zamówienie. Działa zarówno dla zalogowanego
 * klienta (nagłówek "Authorization: Bearer <token klienta>"), jak i dla gościa -
 * gość dostaje pod spodem lekki rekord Client (bez ustawionego, znanego mu hasła -
 * losowy, niewykorzystywalny hash) i token JWT w odpowiedzi, żeby mógł zobaczyć
 * potwierdzenie zamówienia bez zakładania konta z góry. To świadomy odpowiednik
 * typowego "checkout jako gość" - klient nigdy się nie loguje, ale rekord istnieje.
 *
 * Pozycje zamówienia i ich total_amount liczone są tak samo jak w
 * Admin\OrderController::create (suma pozycji wg bieżącej ceny + stawka dostawy).
 * Zamówienie nie rezerwuje/nie odejmuje stanu magazynowego - tak samo jak
 * zamówienia tworzone dziś w panelu admina (brak takiej logiki nigdzie w apce).
 */
final readonly class CheckoutController
{
    public function __construct(private Jwt $jwt)
    {
    }

    #[OA\Post(
        path: '/api/storefront/checkout',
        summary: 'Złożenie zamówienia (koszyk -> zamówienie), dla gościa lub zalogowanego klienta',
        description: 'Zalogowany klient wysyła nagłówek "Authorization: Bearer <token>" - dane kontaktowe (email/first_name/last_name) są wtedy ignorowane. Bez nagłówka to checkout jako gość - te pola są wymagane.',
        tags: ['Storefront - Checkout'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['cart_token', 'delivery_address'],
                properties: [
                    new OA\Property(property: 'cart_token', type: 'string'),
                    new OA\Property(property: 'email', type: 'string', description: 'Wymagane dla gościa'),
                    new OA\Property(property: 'first_name', type: 'string', description: 'Wymagane dla gościa'),
                    new OA\Property(property: 'last_name', type: 'string', description: 'Wymagane dla gościa'),
                    new OA\Property(
                        property: 'delivery_address',
                        properties: [
                            new OA\Property(property: 'street', type: 'string'),
                            new OA\Property(property: 'city', type: 'string'),
                            new OA\Property(property: 'postal_code', type: 'string'),
                            new OA\Property(property: 'country', type: 'string'),
                        ]
                    ),
                    new OA\Property(property: 'billing_address', description: 'Jak delivery_address - pomiń, żeby użyć adresu dostawy też jako rozliczeniowego'),
                    new OA\Property(property: 'shipping_method_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'payment_method', type: 'string', nullable: true, example: 'cod'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Złożono zamówienie',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'token', type: 'string', description: 'Token klienta (nowy dla gościa, ten sam dla zalogowanego)'),
                        new OA\Property(property: 'order', ref: '#/components/schemas/Order'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Koszyk nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function checkout(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        $cart = ! empty($data['cart_token']) ? Cart::query()->where('token', $data['cart_token'])->first() : null;

        if (! $cart) {
            return $this->json($response, ['error' => 'Koszyk nie istnieje.'], 404);
        }

        $cart->load('items.variant');

        $client = $this->resolveAuthenticatedClient($request);
        $errors = $this->validate($data, guest: $client === null);

        if ($cart->items->isEmpty()) {
            $errors['cart'] = 'Koszyk jest pusty.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $shippingMethod = isset($data['shipping_method_id']) && $data['shipping_method_id'] !== null
            ? ShippingMethod::query()->find((int) $data['shipping_method_id'])
            : null;

        $order = Order::query()->getConnection()->transaction(function () use ($data, $cart, $client, $shippingMethod): Order {
            $client ??= Client::query()->create([
                'client_type' => 'b2c',
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                // Gość nie ustawia hasła - losowy, niewykorzystywalny hash tylko po to,
                // żeby spełnić NOT NULL w bazie. Konto nie jest logowalne przez /login,
                // dopóki klient nie ustawi hasła (mechanizmu do tego dziś jeszcze nie ma).
                'password' => password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT),
            ]);

            $deliveryAddress = Address::query()->create([
                'client_id' => $client->id,
                'type' => 'delivery',
                ...$this->pickAddressFields($data['delivery_address']),
            ]);

            $billingAddress = ! empty($data['billing_address'])
                ? Address::query()->create([
                    'client_id' => $client->id,
                    'type' => 'billing',
                    ...$this->pickAddressFields($data['billing_address']),
                ])
                : $deliveryAddress;

            $itemsTotal = 0.0;
            foreach ($cart->items as $item) {
                $unitPrice = $item->custom_price ?? $item->variant->price;
                $itemsTotal += (float) $unitPrice * $item->quantity;
            }

            $shippingCost = $shippingMethod ? (float) $shippingMethod->flat_rate : 0.0;

            $order = Order::query()->create([
                'client_id' => $client->id,
                'billing_address_id' => $billingAddress->id,
                'delivery_address_id' => $deliveryAddress->id,
                'shipping_method_id' => $shippingMethod?->id,
                'total_amount' => round($itemsTotal + $shippingCost, 2),
                'status' => 'pending',
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->custom_price ?? $item->variant->price,
                ]);
            }

            if (! empty($data['payment_method'])) {
                Payment::query()->create([
                    'order_id' => $order->id,
                    'amount' => $order->total_amount,
                    'method' => $data['payment_method'],
                    'status' => 'pending',
                ]);
            }

            $cart->status = 'converted';
            $cart->client_id ??= $client->id;
            $cart->save();

            return $order;
        });

        return $this->json($response, [
            'token' => $this->jwt->issue(['sub' => $order->client_id, 'email' => $order->client->email, 'type' => 'client']),
            'order' => $order->load(['client', 'billingAddress', 'deliveryAddress', 'shippingMethod', 'items.variant', 'payments'])->toArray(),
        ], 201);
    }

    private function resolveAuthenticatedClient(Request $request): ?Client
    {
        $header = $request->getHeaderLine('Authorization');

        if (! str_starts_with($header, 'Bearer ')) {
            return null;
        }

        try {
            $claims = $this->jwt->verify(substr($header, 7));
        } catch (Throwable) {
            return null;
        }

        if (($claims['type'] ?? null) !== 'client') {
            return null;
        }

        return Client::query()->find((int) $claims['sub']);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data, bool $guest): array
    {
        $errors = [];

        if ($guest) {
            if (empty($data['email']) || ! is_string($data['email']) || ! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Pole email musi być poprawnym adresem e-mail.';
            } elseif (Client::query()->where('email', $data['email'])->exists()) {
                $errors['email'] = 'Konto z tym adresem e-mail już istnieje. Zaloguj się, aby złożyć zamówienie.';
            }

            if (empty($data['first_name']) || ! is_string($data['first_name'])) {
                $errors['first_name'] = 'Pole first_name jest wymagane.';
            }

            if (empty($data['last_name']) || ! is_string($data['last_name'])) {
                $errors['last_name'] = 'Pole last_name jest wymagane.';
            }
        }

        $errors = [...$errors, ...$this->validateAddress($data['delivery_address'] ?? null, 'delivery_address')];

        if (isset($data['billing_address'])) {
            $errors = [...$errors, ...$this->validateAddress($data['billing_address'], 'billing_address')];
        }

        if (isset($data['shipping_method_id']) && $data['shipping_method_id'] !== null && ! ShippingMethod::query()->where('id', $data['shipping_method_id'])->exists()) {
            $errors['shipping_method_id'] = 'Wskazana metoda dostawy nie istnieje.';
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $address
     *
     * @return array{street: string, city: string, postal_code: string, country: string}
     */
    private function pickAddressFields(array $address): array
    {
        return [
            'street' => (string) $address['street'],
            'city' => (string) $address['city'],
            'postal_code' => (string) $address['postal_code'],
            'country' => (string) $address['country'],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function validateAddress(mixed $address, string $field): array
    {
        if (! is_array($address)) {
            return [$field => 'Adres jest wymagany (street, city, postal_code, country).'];
        }

        $errors = [];

        foreach (['street', 'city', 'postal_code', 'country'] as $part) {
            if (empty($address[$part]) || ! is_string($address[$part])) {
                $errors["{$field}.{$part}"] = 'To pole jest wymagane.';
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
