<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\Category;
use App\Models\Product;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ProductController
{
    #[OA\Get(
        path: '/api/storefront/products',
        summary: 'Lista produktów (sklep)',
        description: 'Zwraca publiczną listę aktywnych produktów z katalogu (z kategoriami i dwoma głównymi zdjęciami: image1, image2). Opcjonalnie zawężona do kategorii (`?category=slug`) - wraz z jej podkategoriami.',
        tags: ['Storefront - Products'],
        parameters: [
            new OA\Parameter(name: 'category', in: 'query', required: false, description: 'Slug kategorii; produkty z tej kategorii i wszystkich jej podkategorii', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista aktywnych produktów',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/Product')
                )
            ),
            new OA\Response(response: 404, description: 'Kategoria o podanym slugu nie istnieje'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with(['categories', 'image1', 'image2'])
            ->orderBy('id');

        $categorySlug = trim((string) ($request->getQueryParams()['category'] ?? ''));

        if ($categorySlug !== '') {
            $category = Category::query()->where('slug', $categorySlug)->first();

            if (! $category) {
                $response->getBody()->write(json_encode(['error' => 'Kategoria nie istnieje.'], JSON_THROW_ON_ERROR));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $categoryIds = $this->categoryWithDescendantIds((int) $category->id);
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $categoryIds));
        }

        $products = $query->get();

        $response->getBody()->write(json_encode($products, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Id kategorii wraz ze wszystkimi potomkami (drzewo po parent_id) - produkt
     * przypięty do podkategorii ma być widoczny także w kategorii nadrzędnej.
     *
     * @return list<int>
     */
    private function categoryWithDescendantIds(int $rootId): array
    {
        $childrenByParent = [];

        foreach (Category::query()->whereNotNull('parent_id')->get(['id', 'parent_id']) as $category) {
            $childrenByParent[(int) $category->parent_id][] = (int) $category->id;
        }

        $ids = [];
        $stack = [$rootId];

        while ($stack !== []) {
            $id = array_pop($stack);

            if (in_array($id, $ids, true)) {
                continue;
            }

            $ids[] = $id;

            foreach ($childrenByParent[$id] ?? [] as $childId) {
                $stack[] = $childId;
            }
        }

        return $ids;
    }

    #[OA\Get(
        path: '/api/storefront/products/{id}',
        summary: 'Szczegóły produktu (sklep)',
        description: 'Zwraca aktywny produkt wraz z wariantami, kategoriami i zdjęciami (image1, image2, gallery).',
        tags: ['Storefront - Products'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Produkt', content: new OA\JsonContent(ref: '#/components/schemas/Product')),
            new OA\Response(response: 404, description: 'Produkt nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $product = Product::query()
            ->where('is_active', true)
            ->with(['variants', 'categories', ...Product::IMAGE_RELATIONS])
            ->find((int) $args['id']);

        if (! $product) {
            $response->getBody()->write(json_encode(['error' => 'Produkt nie istnieje.'], JSON_THROW_ON_ERROR));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($product, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
