<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\PaymentMethod;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PaymentMethodController
{
    #[OA\Get(
        path: '/api/storefront/payment-methods',
        summary: 'Lista metod płatności (sklep)',
        description: 'Publiczna lista metod płatności do wyboru w checkout.',
        tags: ['Storefront - Checkout'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista metod płatności',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/PaymentMethod'))
            ),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $methods = PaymentMethod::query()->orderBy('id')->get();

        $response->getBody()->write(json_encode($methods, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
