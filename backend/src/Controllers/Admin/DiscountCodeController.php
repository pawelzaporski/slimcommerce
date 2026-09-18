<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\DiscountCode;
use App\Models\Product;
use DateTimeImmutable;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/**
 * CRUD kodów rabatowych (panel admina). Sposób liczenia rabatu jest w
 * App\Support\CartPricing - tu tylko walidacja i zapis definicji kodu.
 */
final class DiscountCodeController
{
    #[OA\Get(
        path: '/api/admin/discount-codes',
        summary: 'Lista kodów rabatowych (z produktami)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Discount Codes'],
        responses: [
            new OA\Response(response: 200, description: 'Lista', content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/DiscountCode'))),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $codes = DiscountCode::query()->with('products')->orderByDesc('id')->get();

        return $this->json($response, $codes->toArray());
    }

    #[OA\Get(
        path: '/api/admin/discount-codes/{id}',
        summary: 'Szczegóły kodu rabatowego',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Discount Codes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Kod', content: new OA\JsonContent(ref: '#/components/schemas/DiscountCode')),
            new OA\Response(response: 404, description: 'Kod nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $code = DiscountCode::query()->with('products')->find((int) $args['id']);

        if (! $code) {
            return $this->json($response, ['error' => 'Kod rabatowy nie istnieje.'], 404);
        }

        return $this->json($response, $code->toArray());
    }

    #[OA\Post(
        path: '/api/admin/discount-codes',
        summary: 'Dodanie kodu rabatowego',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Discount Codes'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['code', 'type'],
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'LATO20'),
                    new OA\Property(property: 'type', type: 'string', enum: ['percent_cart', 'amount_cart', 'percent_product', 'amount_product', 'free_shipping']),
                    new OA\Property(property: 'value', type: 'number', format: 'float', nullable: true, example: 20, description: 'Wymagane poza free_shipping'),
                    new OA\Property(property: 'min_cart_amount', type: 'number', format: 'float', nullable: true),
                    new OA\Property(property: 'starts_at', type: 'string', nullable: true, example: '2026-06-01', description: 'Data lub data-czas'),
                    new OA\Property(property: 'ends_at', type: 'string', nullable: true, example: '2026-08-31', description: 'Sama data = do końca tego dnia'),
                    new OA\Property(property: 'usage_limit', type: 'integer', nullable: true),
                    new OA\Property(property: 'is_active', type: 'boolean', default: true),
                    new OA\Property(property: 'product_ids', type: 'array', items: new OA\Items(type: 'integer'), description: 'Wymagane (min. 1) dla percent_product / amount_product'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono', content: new OA\JsonContent(ref: '#/components/schemas/DiscountCode')),
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

        $attributes = $this->attributesFrom($data);

        $code = DiscountCode::query()->getConnection()->transaction(function () use ($attributes, $data): DiscountCode {
            $code = DiscountCode::query()->create($attributes);
            $code->products()->sync($this->productIdsFrom($data, $code));

            return $code;
        });

        return $this->json($response, $code->load('products')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/discount-codes/{id}',
        summary: 'Edycja kodu rabatowego',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Discount Codes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/DiscountCode')),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano', content: new OA\JsonContent(ref: '#/components/schemas/DiscountCode')),
            new OA\Response(response: 404, description: 'Kod nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $code = DiscountCode::query()->with('products')->find((int) $args['id']);

        if (! $code) {
            return $this->json($response, ['error' => 'Kod rabatowy nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        // Walidujemy pełny obraz (istniejące wartości + zmiany), żeby np. zmiana
        // typu na produktowy bez product_ids nie przeszła.
        $merged = [...$code->toArray(), 'product_ids' => $code->productIds(), ...$data];
        $errors = $this->validate($merged, ignoreId: $code->id);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $attributes = $this->attributesFrom($merged);

        DiscountCode::query()->getConnection()->transaction(function () use ($code, $attributes, $merged): void {
            $code->fill($attributes);
            $code->save();
            $code->products()->sync($this->productIdsFrom($merged, $code));
        });

        return $this->json($response, $code->load('products')->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/discount-codes/{id}',
        summary: 'Usunięcie kodu rabatowego (koszyki z tym kodem tracą rabat; zamówienia zachowują snapshot)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Discount Codes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 404, description: 'Kod nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $code = DiscountCode::query()->find((int) $args['id']);

        if (! $code) {
            return $this->json($response, ['error' => 'Kod rabatowy nie istnieje.'], 404);
        }

        $code->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data, ?int $ignoreId = null): array
    {
        $errors = [];

        $code = is_string($data['code'] ?? null) ? DiscountCode::normalizeCode($data['code']) : '';

        if ($code === '') {
            $errors['code'] = 'Pole code jest wymagane.';
        } elseif (! preg_match('/^[A-Z0-9_-]{2,40}$/', $code)) {
            $errors['code'] = 'Kod może zawierać tylko litery, cyfry, myślnik i podkreślenie (2-40 znaków).';
        } else {
            $query = DiscountCode::query()->where('code', $code);

            if ($ignoreId !== null) {
                $query->where('id', '!=', $ignoreId);
            }

            if ($query->exists()) {
                $errors['code'] = 'Kod rabatowy o tej nazwie już istnieje.';
            }
        }

        $type = $data['type'] ?? null;

        if (! is_string($type) || ! in_array($type, DiscountCode::TYPES, true)) {
            $errors['type'] = 'Pole type musi być jednym z: ' . implode(', ', DiscountCode::TYPES) . '.';
            $type = null;
        }

        $value = $data['value'] ?? null;

        if ($type !== null && $type !== DiscountCode::TYPE_FREE_SHIPPING) {
            if ($value === null || $value === '' || ! is_numeric($value) || (float) $value <= 0) {
                $errors['value'] = 'Pole value musi być liczbą większą od zera.';
            } elseif (in_array($type, [DiscountCode::TYPE_PERCENT_CART, DiscountCode::TYPE_PERCENT_PRODUCT], true) && (float) $value > 100) {
                $errors['value'] = 'Rabat procentowy nie może przekraczać 100.';
            }
        }

        if (isset($data['min_cart_amount']) && $data['min_cart_amount'] !== '' && (! is_numeric($data['min_cart_amount']) || (float) $data['min_cart_amount'] < 0)) {
            $errors['min_cart_amount'] = 'Pole min_cart_amount musi być liczbą nieujemną.';
        }

        foreach (['starts_at', 'ends_at'] as $field) {
            if (! empty($data[$field]) && $this->parseDate((string) $data[$field], $field === 'ends_at') === null) {
                $errors[$field] = "Pole {$field} musi być datą (RRRR-MM-DD) lub datą z czasem.";
            }
        }

        if (! isset($errors['starts_at'], $errors['ends_at']) && ! empty($data['starts_at']) && ! empty($data['ends_at'])) {
            $start = $this->parseDate((string) $data['starts_at'], false);
            $end = $this->parseDate((string) $data['ends_at'], true);

            if ($start !== null && $end !== null && $end < $start) {
                $errors['ends_at'] = 'Data końca nie może być wcześniejsza niż data początku.';
            }
        }

        if (isset($data['usage_limit']) && $data['usage_limit'] !== '' && $data['usage_limit'] !== null && (! is_numeric($data['usage_limit']) || (int) $data['usage_limit'] < 1)) {
            $errors['usage_limit'] = 'Pole usage_limit musi być liczbą całkowitą większą od zera.';
        }

        if ($type !== null && in_array($type, [DiscountCode::TYPE_PERCENT_PRODUCT, DiscountCode::TYPE_AMOUNT_PRODUCT], true)) {
            $ids = $data['product_ids'] ?? null;

            if (! is_array($ids) || $ids === []) {
                $errors['product_ids'] = 'Dla kodu na wybrane produkty wskaż co najmniej jeden produkt.';
            } else {
                $ids = array_values(array_unique(array_map('intval', $ids)));
                $existing = Product::query()->whereIn('id', $ids)->count();

                if ($existing !== count($ids)) {
                    $errors['product_ids'] = 'Któryś ze wskazanych produktów nie istnieje.';
                }
            }
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    private function attributesFrom(array $data): array
    {
        $type = (string) $data['type'];
        $freeShipping = $type === DiscountCode::TYPE_FREE_SHIPPING;

        return [
            'code' => DiscountCode::normalizeCode((string) $data['code']),
            'type' => $type,
            'value' => $freeShipping ? null : round((float) $data['value'], 2),
            'min_cart_amount' => isset($data['min_cart_amount']) && $data['min_cart_amount'] !== '' ? round((float) $data['min_cart_amount'], 2) : null,
            'starts_at' => ! empty($data['starts_at']) ? $this->parseDate((string) $data['starts_at'], false)?->format('Y-m-d H:i:s') : null,
            'ends_at' => ! empty($data['ends_at']) ? $this->parseDate((string) $data['ends_at'], true)?->format('Y-m-d H:i:s') : null,
            'usage_limit' => isset($data['usage_limit']) && $data['usage_limit'] !== '' && $data['usage_limit'] !== null ? (int) $data['usage_limit'] : null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return list<int>
     */
    private function productIdsFrom(array $data, DiscountCode $code): array
    {
        if (! $code->isProductScoped()) {
            return [];
        }

        return array_values(array_unique(array_map('intval', (array) ($data['product_ids'] ?? []))));
    }

    /**
     * "2026-06-01" (sama data) dla końca okresu oznacza koniec tego dnia,
     * dla początku - jego początek. Data z czasem brana jest dosłownie.
     */
    private function parseDate(string $value, bool $endOfDay): ?DateTimeImmutable
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        try {
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                $date = new DateTimeImmutable($value);

                return $endOfDay ? $date->setTime(23, 59, 59) : $date->setTime(0, 0, 0);
            }

            return new DateTimeImmutable($value);
        } catch (Throwable) {
            return null;
        }
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
