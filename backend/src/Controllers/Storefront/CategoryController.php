<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\Category;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Publiczna lista kategorii dla storefrontu - płaska (z parent_id, drzewo
 * składa front) i z licznikiem aktywnych produktów w każdej kategorii.
 */
final class CategoryController
{
    #[OA\Get(
        path: '/api/storefront/categories',
        summary: 'Lista kategorii (sklep)',
        description: 'Zwraca wszystkie kategorie (płasko, z `parent_id` do zbudowania drzewa) wraz z liczbą aktywnych produktów `products_count`.',
        tags: ['Storefront - Categories'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista kategorii',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(
                        allOf: [
                            new OA\Schema(ref: '#/components/schemas/Category'),
                            new OA\Schema(properties: [new OA\Property(property: 'products_count', type: 'integer', example: 12)]),
                        ]
                    )
                )
            ),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $categories = Category::query()
            ->withCount(['products' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('name')
            ->get();

        $response->getBody()->write(json_encode($categories, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
