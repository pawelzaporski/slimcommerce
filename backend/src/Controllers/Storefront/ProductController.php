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
}
