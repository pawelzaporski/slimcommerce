<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\ShippingMethod;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ShippingMethodController
{
    #[OA\Get(
        path: '/api/storefront/shipping-methods',
        summary: 'Lista metod dostawy (sklep)',
        description: 'Publiczna lista metod dostawy do wyboru w checkout.',
        tags: ['Storefront - Checkout'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista metod dostawy',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/ShippingMethod'))
            ),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $methods = ShippingMethod::query()->orderBy('id')->get();

        $response->getBody()->write(json_encode($methods, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
