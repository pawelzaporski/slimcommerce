<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\Product;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ProductController
{
    #[OA\Get(
        path: '/api/storefront/products',
        summary: 'Lista produktów (sklep)',
        description: 'Zwraca publiczną listę aktywnych produktów z katalogu.',
        tags: ['Storefront - Products'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista aktywnych produktów',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/Product')
                )
            ),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        $response->getBody()->write(json_encode($products, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }

    #[OA\Get(
        path: '/api/storefront/products/{id}',
        summary: 'Szczegóły produktu (sklep)',
        description: 'Zwraca aktywny produkt wraz z wariantami i kategoriami.',
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
            ->with(['variants', 'categories'])
            ->find((int) $args['id']);

        if (! $product) {
            $response->getBody()->write(json_encode(['error' => 'Produkt nie istnieje.'], JSON_THROW_ON_ERROR));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($product, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
