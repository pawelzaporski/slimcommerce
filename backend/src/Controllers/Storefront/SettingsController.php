<?php

declare(strict_types=1);

namespace App\Controllers\Storefront;

use App\Models\SalesChannel;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Ustawienia sklepu dla storefrontu - dziś próg darmowej dostawy z miejsca
 * sprzedaży (rozpoznawanego po nagłówku X-Sales-Channel albo Origin).
 */
final class SettingsController
{
    #[OA\Get(
        path: '/api/storefront/settings',
        summary: 'Ustawienia bieżącego miejsca sprzedaży (próg darmowej dostawy)',
        description: 'Miejsce sprzedaży rozpoznawane po nagłówku X-Sales-Channel (origin storefrontu) albo Origin. Gdy nie da się dopasować, a aktywne jest dokładnie jedno miejsce sprzedaży - używane jest ono.',
        tags: ['Storefront - Settings'],
        parameters: [
            new OA\Parameter(name: 'X-Sales-Channel', in: 'header', required: false, schema: new OA\Schema(type: 'string', example: 'https://sklep.example.com')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Ustawienia',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'sales_channel', nullable: true, properties: [
                            new OA\Property(property: 'id', type: 'integer'),
                            new OA\Property(property: 'name', type: 'string'),
                            new OA\Property(property: 'domain', type: 'string'),
                        ]),
                        new OA\Property(property: 'free_shipping_from', type: 'number', format: 'float', nullable: true, description: 'Wartość koszyka (po rabacie), od której dostawa jest darmowa; null = brak progu'),
                    ]
                )
            ),
        ]
    )]
    public function show(Request $request, Response $response): Response
    {
        $channel = SalesChannel::resolveForRequest($request);

        $payload = [
            'sales_channel' => $channel ? ['id' => $channel->id, 'name' => $channel->name, 'domain' => $channel->domain] : null,
            'free_shipping_from' => $channel?->free_shipping_from !== null ? (float) $channel->free_shipping_from : null,
        ];

        $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
