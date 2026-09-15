<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Product;
use App\Models\ProductVariant;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ProductController
{
    private const array FILLABLE = ['external_id', 'sku', 'name', 'base_price', 'is_active'];

    #[OA\Get(
        path: '/api/admin/products',
        summary: 'Lista produktów (panel admina)',
        description: 'Zwraca stronicowaną listę wszystkich produktów, także nieaktywnych. Wymaga tokenu Bearer.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Products'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Stronicowana lista produktów',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Product')),
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

        $total = Product::query()->count();

        $products = Product::query()
            ->with('categories')
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get();

        return $this->json($response, [
            'data' => $products,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/products/{id}',
        summary: 'Szczegóły produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Products'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Produkt', content: new OA\JsonContent(ref: '#/components/schemas/Product')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Produkt nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $product = Product::query()->with('categories')->find((int) $args['id']);

        if (! $product) {
            return $this->json($response, ['error' => 'Produkt nie istnieje.'], 404);
        }

        return $this->json($response, $product->toArray());
    }

    #[OA\Post(
        path: '/api/admin/products',
        summary: 'Dodanie produktu',
        description: 'Tworzy produkt wraz z domyślnym wariantem (to samo SKU/cena, EAN z pola `ean`, stan 0) - każdy produkt musi mieć co najmniej jeden wariant, żeby był sprzedawalny.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Products'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['sku', 'name', 'base_price'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'sku', type: 'string', example: 'SKU-002'),
                    new OA\Property(property: 'name', type: 'string', example: 'Kubek ceramiczny'),
                    new OA\Property(property: 'base_price', type: 'number', format: 'float', example: 29.9),
                    new OA\Property(property: 'ean', type: 'string', nullable: true, description: 'EAN domyślnego wariantu tworzonego razem z produktem'),
                    new OA\Property(property: 'is_active', type: 'boolean', default: true),
                    new OA\Property(property: 'category_ids', type: 'array', items: new OA\Items(type: 'integer')),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono produkt (wraz z domyślnym wariantem)', content: new OA\JsonContent(ref: '#/components/schemas/Product')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data);

        if ($errors === [] && Product::query()->where('sku', $data['sku'])->exists()) {
            $errors['sku'] = 'Produkt z takim SKU już istnieje.';
        }

        if ($errors === [] && ProductVariant::query()->where('sku', $data['sku'])->exists()) {
            $errors['sku'] = 'Wariant z takim SKU już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $product = Product::query()->getConnection()->transaction(function () use ($data): Product {
            $product = Product::query()->create([
                'external_id' => $data['external_id'] ?? null,
                'sku' => $data['sku'],
                'name' => $data['name'],
                'base_price' => $data['base_price'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Domyślny wariant - produkt bez wariantu nie ma gdzie trzymać stanu
            // magazynowego (storefront/koszyk operują na wariantach).
            $product->variants()->create([
                'sku' => $product->sku,
                'ean' => $data['ean'] ?? null,
                'price' => $product->base_price,
                'stock' => 0,
            ]);

            $product->categories()->sync($this->categoryIds($data));

            return $product;
        });

        return $this->json($response, $product->load('categories')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/products/{id}',
        summary: 'Edycja produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Products'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'sku', type: 'string'),
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'base_price', type: 'number', format: 'float'),
                    new OA\Property(property: 'is_active', type: 'boolean'),
                    new OA\Property(property: 'category_ids', type: 'array', items: new OA\Items(type: 'integer')),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano produkt', content: new OA\JsonContent(ref: '#/components/schemas/Product')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Produkt nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $product = Product::query()->find((int) $args['id']);

        if (! $product) {
            return $this->json($response, ['error' => 'Produkt nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data, partial: true);

        if (
            $errors === []
            && array_key_exists('sku', $data)
            && Product::query()->where('sku', $data['sku'])->where('id', '!=', $product->id)->exists()
        ) {
            $errors['sku'] = 'Produkt z takim SKU już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $product->fill(array_intersect_key($data, array_flip(self::FILLABLE)));
        $product->save();

        if (array_key_exists('category_ids', $data)) {
            $product->categories()->sync($this->categoryIds($data));
        }

        return $this->json($response, $product->load('categories')->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/products/{id}',
        summary: 'Usunięcie produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Products'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Produkt nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $product = Product::query()->find((int) $args['id']);

        if (! $product) {
            return $this->json($response, ['error' => 'Produkt nie istnieje.'], 404);
        }

        $product->delete();

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

        if (! $partial || array_key_exists('sku', $data)) {
            if (empty($data['sku']) || ! is_string($data['sku'])) {
                $errors['sku'] = 'Pole sku jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('name', $data)) {
            if (empty($data['name']) || ! is_string($data['name'])) {
                $errors['name'] = 'Pole name jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('base_price', $data)) {
            if (! isset($data['base_price']) || ! is_numeric($data['base_price'])) {
                $errors['base_price'] = 'Pole base_price musi być liczbą.';
            }
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return list<int>
     */
    private function categoryIds(array $data): array
    {
        if (! isset($data['category_ids']) || ! is_array($data['category_ids'])) {
            return [];
        }

        return array_values(array_map('intval', $data['category_ids']));
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
