<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Product;
use App\Models\ProductVariant;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ProductVariantController
{
    #[OA\Get(
        path: '/api/admin/products/{productId}/variants',
        summary: 'Lista wariantów produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Variants'],
        parameters: [new OA\Parameter(name: 'productId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista wariantów',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/ProductVariant'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Produkt nie istnieje'),
        ]
    )]
    public function list(Request $request, Response $response, array $args): Response
    {
        $product = Product::query()->find((int) $args['productId']);

        if (! $product) {
            return $this->json($response, ['error' => 'Produkt nie istnieje.'], 404);
        }

        $variants = $product->variants()->with('attributeValues')->orderBy('id')->get();

        return $this->json($response, $variants->toArray());
    }

    #[OA\Post(
        path: '/api/admin/products/{productId}/variants',
        summary: 'Dodanie wariantu produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Variants'],
        parameters: [new OA\Parameter(name: 'productId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['sku', 'price'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'sku', type: 'string', example: 'SKU-001-XL'),
                    new OA\Property(property: 'ean', type: 'string', nullable: true),
                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 79.99),
                    new OA\Property(property: 'stock', type: 'integer', default: 0),
                    new OA\Property(
                        property: 'attribute_value_ids',
                        type: 'array',
                        items: new OA\Items(type: 'integer'),
                        description: 'ID wartości cech przypisanych do wariantu (np. XL, Czerwony)'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono wariant', content: new OA\JsonContent(ref: '#/components/schemas/ProductVariant')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Produkt nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response, array $args): Response
    {
        $product = Product::query()->find((int) $args['productId']);

        if (! $product) {
            return $this->json($response, ['error' => 'Produkt nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data);

        if ($errors === [] && ProductVariant::query()->where('sku', $data['sku'])->exists()) {
            $errors['sku'] = 'Wariant z takim SKU już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $variant = $product->variants()->create([
            'external_id' => $data['external_id'] ?? null,
            'sku' => $data['sku'],
            'ean' => $data['ean'] ?? null,
            'price' => $data['price'],
            'stock' => $data['stock'] ?? 0,
        ]);

        $variant->attributeValues()->sync($this->attributeValueIds($data));

        return $this->json($response, $variant->load('attributeValues')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/variants/{id}',
        summary: 'Edycja wariantu produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Variants'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'sku', type: 'string'),
                    new OA\Property(property: 'ean', type: 'string', nullable: true),
                    new OA\Property(property: 'price', type: 'number', format: 'float'),
                    new OA\Property(property: 'stock', type: 'integer'),
                    new OA\Property(property: 'attribute_value_ids', type: 'array', items: new OA\Items(type: 'integer')),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano wariant', content: new OA\JsonContent(ref: '#/components/schemas/ProductVariant')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Wariant nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $variant = ProductVariant::query()->find((int) $args['id']);

        if (! $variant) {
            return $this->json($response, ['error' => 'Wariant nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data, partial: true);

        if (
            $errors === []
            && array_key_exists('sku', $data)
            && ProductVariant::query()->where('sku', $data['sku'])->where('id', '!=', $variant->id)->exists()
        ) {
            $errors['sku'] = 'Wariant z takim SKU już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $variant->fill(array_intersect_key($data, array_flip(['external_id', 'sku', 'ean', 'price', 'stock'])));
        $variant->save();

        if (array_key_exists('attribute_value_ids', $data)) {
            $variant->attributeValues()->sync($this->attributeValueIds($data));
        }

        return $this->json($response, $variant->load('attributeValues')->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/variants/{id}',
        summary: 'Usunięcie wariantu produktu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Variants'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Wariant nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $variant = ProductVariant::query()->find((int) $args['id']);

        if (! $variant) {
            return $this->json($response, ['error' => 'Wariant nie istnieje.'], 404);
        }

        $variant->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return list<int>
     */
    private function attributeValueIds(array $data): array
    {
        if (! isset($data['attribute_value_ids']) || ! is_array($data['attribute_value_ids'])) {
            return [];
        }

        return array_values(array_map('intval', $data['attribute_value_ids']));
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

        if (! $partial || array_key_exists('price', $data)) {
            if (! isset($data['price']) || ! is_numeric($data['price'])) {
                $errors['price'] = 'Pole price musi być liczbą.';
            }
        }

        if (array_key_exists('stock', $data) && ! is_numeric($data['stock'])) {
            $errors['stock'] = 'Pole stock musi być liczbą całkowitą.';
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
