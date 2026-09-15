<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\ShippingMethod;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ShippingMethodController
{
    #[OA\Get(
        path: '/api/admin/shipping-methods',
        summary: 'Lista metod dostawy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Shipping'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista metod dostawy',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/ShippingMethod'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $methods = ShippingMethod::query()->orderBy('name')->get();

        return $this->json($response, $methods->toArray());
    }

    #[OA\Post(
        path: '/api/admin/shipping-methods',
        summary: 'Dodanie metody dostawy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Shipping'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'flat_rate'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', example: 'Kurier DPD'),
                    new OA\Property(property: 'flat_rate', type: 'number', format: 'float', example: 15.99),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono metodę dostawy', content: new OA\JsonContent(ref: '#/components/schemas/ShippingMethod')),
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

        $method = ShippingMethod::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'name' => $data['name'],
            'flat_rate' => $data['flat_rate'],
        ]);

        return $this->json($response, $method->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/shipping-methods/{id}',
        summary: 'Edycja metody dostawy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Shipping'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'flat_rate', type: 'number', format: 'float'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano metodę dostawy', content: new OA\JsonContent(ref: '#/components/schemas/ShippingMethod')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Metoda dostawy nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $method = ShippingMethod::query()->find((int) $args['id']);

        if (! $method) {
            return $this->json($response, ['error' => 'Metoda dostawy nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $method->fill(array_intersect_key($data, array_flip(['external_id', 'name', 'flat_rate'])));
        $method->save();

        return $this->json($response, $method->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/shipping-methods/{id}',
        summary: 'Usunięcie metody dostawy',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Shipping'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Metoda dostawy nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $method = ShippingMethod::query()->find((int) $args['id']);

        if (! $method) {
            return $this->json($response, ['error' => 'Metoda dostawy nie istnieje.'], 404);
        }

        $method->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data, bool $partial = false): array
    {
        $errors = [];

        if (! $partial || array_key_exists('name', $data)) {
            if (empty($data['name']) || ! is_string($data['name'])) {
                $errors['name'] = 'Pole name jest wymagane.';
            }
        }

        if (! $partial || array_key_exists('flat_rate', $data)) {
            if (! isset($data['flat_rate']) || ! is_numeric($data['flat_rate'])) {
                $errors['flat_rate'] = 'Pole flat_rate musi być liczbą.';
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
