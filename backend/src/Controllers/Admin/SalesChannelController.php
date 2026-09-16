<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\SalesChannel;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Miejsca sprzedaży - fronty sklepu (storefront) pod własnymi domenami.
 * Domena aktywnego miejsca sprzedaży jest automatycznie dopuszczana w CORS
 * (nagłówek Access-Control-Allow-Origin), obok listy z CORS_ALLOWED_ORIGIN.
 */
final class SalesChannelController
{
    #[OA\Get(
        path: '/api/admin/sales-channels',
        summary: 'Lista miejsc sprzedaży',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Sales Channels'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista miejsc sprzedaży',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/SalesChannel'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $channels = SalesChannel::query()->orderBy('name')->get();

        return $this->json($response, $channels->toArray());
    }

    #[OA\Post(
        path: '/api/admin/sales-channels',
        summary: 'Dodanie miejsca sprzedaży',
        description: 'Pole `domain` jest normalizowane do postaci origin (np. `sklep.example.com/` -> `https://sklep.example.com`). Aktywne miejsce sprzedaży od razu dostaje dostęp CORS do api/storefront.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Sales Channels'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'domain'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', example: 'Sklep główny'),
                    new OA\Property(property: 'domain', type: 'string', example: 'https://sklep.example.com'),
                    new OA\Property(property: 'is_active', type: 'boolean', default: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono miejsce sprzedaży', content: new OA\JsonContent(ref: '#/components/schemas/SalesChannel')),
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

        $channel = SalesChannel::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'name' => $data['name'],
            'domain' => SalesChannel::normalizeDomain($data['domain']),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return $this->json($response, $channel->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/sales-channels/{id}',
        summary: 'Edycja miejsca sprzedaży',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Sales Channels'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'domain', type: 'string'),
                    new OA\Property(property: 'is_active', type: 'boolean'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano miejsce sprzedaży', content: new OA\JsonContent(ref: '#/components/schemas/SalesChannel')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Miejsce sprzedaży nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $channel = SalesChannel::query()->find((int) $args['id']);

        if (! $channel) {
            return $this->json($response, ['error' => 'Miejsce sprzedaży nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true, ignoreId: $channel->id);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        if (array_key_exists('external_id', $data)) {
            $channel->external_id = $data['external_id'];
        }

        if (array_key_exists('name', $data)) {
            $channel->name = $data['name'];
        }

        if (array_key_exists('domain', $data)) {
            $channel->domain = SalesChannel::normalizeDomain($data['domain']);
        }

        if (array_key_exists('is_active', $data)) {
            $channel->is_active = (bool) $data['is_active'];
        }

        $channel->save();

        return $this->json($response, $channel->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/sales-channels/{id}',
        summary: 'Usunięcie miejsca sprzedaży',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Sales Channels'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Miejsce sprzedaży nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $channel = SalesChannel::query()->find((int) $args['id']);

        if (! $channel) {
            return $this->json($response, ['error' => 'Miejsce sprzedaży nie istnieje.'], 404);
        }

        $channel->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data, bool $partial = false, ?int $ignoreId = null): array
    {
        $errors = [];

        if (! $partial || array_key_exists('name', $data)) {
            if (empty($data['name']) || ! is_string($data['name'])) {
                $errors['name'] = 'Pole name jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('domain', $data)) {
            $domain = is_string($data['domain'] ?? null) ? SalesChannel::normalizeDomain($data['domain']) : null;

            if ($domain === null) {
                $errors['domain'] = 'Pole domain musi być poprawną domeną/originem, np. https://sklep.example.com.';
            } else {
                $exists = SalesChannel::query()
                    ->where('domain', $domain)
                    ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
                    ->exists();

                if ($exists) {
                    $errors['domain'] = 'Miejsce sprzedaży z taką domeną już istnieje.';
                }
            }
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
