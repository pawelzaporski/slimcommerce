<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Attribute;
use App\Models\AttributeValue;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AttributeController
{
    #[OA\Get(
        path: '/api/admin/attributes',
        summary: 'Lista cech (wraz z wartościami)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista cech',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Attribute'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $attributes = Attribute::query()->with('values')->orderBy('id')->get();

        return $this->json($response, $attributes->toArray());
    }

    #[OA\Post(
        path: '/api/admin/attributes',
        summary: 'Dodanie cechy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', example: 'Rozmiar'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono cechę', content: new OA\JsonContent(ref: '#/components/schemas/Attribute')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        if (empty($data['name']) || ! is_string($data['name'])) {
            return $this->json($response, ['errors' => ['name' => 'Pole name jest wymagane.']], 422);
        }

        $attribute = Attribute::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'name' => $data['name'],
        ]);

        return $this->json($response, $attribute->load('values')->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/attributes/{id}',
        summary: 'Edycja cechy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano cechę', content: new OA\JsonContent(ref: '#/components/schemas/Attribute')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Cecha nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $attribute = Attribute::query()->find((int) $args['id']);

        if (! $attribute) {
            return $this->json($response, ['error' => 'Cecha nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        if (array_key_exists('name', $data) && (empty($data['name']) || ! is_string($data['name']))) {
            return $this->json($response, ['errors' => ['name' => 'Pole name jest wymagane.']], 422);
        }

        $attribute->fill(array_intersect_key($data, array_flip(['external_id', 'name'])));
        $attribute->save();

        return $this->json($response, $attribute->load('values')->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/attributes/{id}',
        summary: 'Usunięcie cechy (kaskadowo usuwa jej wartości)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Cecha nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $attribute = Attribute::query()->find((int) $args['id']);

        if (! $attribute) {
            return $this->json($response, ['error' => 'Cecha nie istnieje.'], 404);
        }

        $attribute->delete();

        return $response->withStatus(204);
    }

    #[OA\Post(
        path: '/api/admin/attributes/{id}/values',
        summary: 'Dodanie wartości cechy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['value'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'value', type: 'string', example: 'XL'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono wartość', content: new OA\JsonContent(ref: '#/components/schemas/AttributeValue')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Cecha nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function createValue(Request $request, Response $response, array $args): Response
    {
        $attribute = Attribute::query()->find((int) $args['id']);

        if (! $attribute) {
            return $this->json($response, ['error' => 'Cecha nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        if (empty($data['value']) || ! is_string($data['value'])) {
            return $this->json($response, ['errors' => ['value' => 'Pole value jest wymagane.']], 422);
        }

        $value = $attribute->values()->create([
            'external_id' => $data['external_id'] ?? null,
            'value' => $data['value'],
        ]);

        return $this->json($response, $value->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/attribute-values/{id}',
        summary: 'Edycja wartości cechy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'value', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano wartość', content: new OA\JsonContent(ref: '#/components/schemas/AttributeValue')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Wartość nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function updateValue(Request $request, Response $response, array $args): Response
    {
        $value = AttributeValue::query()->find((int) $args['id']);

        if (! $value) {
            return $this->json($response, ['error' => 'Wartość nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        if (array_key_exists('value', $data) && (empty($data['value']) || ! is_string($data['value']))) {
            return $this->json($response, ['errors' => ['value' => 'Pole value jest wymagane.']], 422);
        }

        $value->fill(array_intersect_key($data, array_flip(['external_id', 'value'])));
        $value->save();

        return $this->json($response, $value->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/attribute-values/{id}',
        summary: 'Usunięcie wartości cechy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Attributes'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Wartość nie istnieje'),
        ]
    )]
    public function deleteValue(Request $request, Response $response, array $args): Response
    {
        $value = AttributeValue::query()->find((int) $args['id']);

        if (! $value) {
            return $this->json($response, ['error' => 'Wartość nie istnieje.'], 404);
        }

        $value->delete();

        return $response->withStatus(204);
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
