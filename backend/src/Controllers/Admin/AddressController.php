<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Address;
use App\Models\Client;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AddressController
{
    private const array TYPES = ['billing', 'delivery'];

    #[OA\Post(
        path: '/api/admin/clients/{clientId}/addresses',
        summary: 'Dodanie adresu klienta',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [new OA\Parameter(name: 'clientId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['type', 'street', 'city', 'postal_code', 'country'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'type', type: 'string', enum: ['billing', 'delivery']),
                    new OA\Property(property: 'street', type: 'string', example: 'ul. Kwiatowa 5'),
                    new OA\Property(property: 'city', type: 'string', example: 'Warszawa'),
                    new OA\Property(property: 'postal_code', type: 'string', example: '00-001'),
                    new OA\Property(property: 'country', type: 'string', example: 'Polska'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono adres', content: new OA\JsonContent(ref: '#/components/schemas/Address')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Klient nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response, array $args): Response
    {
        $client = Client::query()->find((int) $args['clientId']);

        if (! $client) {
            return $this->json($response, ['error' => 'Klient nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $address = $client->addresses()->create([
            'external_id' => $data['external_id'] ?? null,
            'type' => $data['type'],
            'street' => $data['street'],
            'city' => $data['city'],
            'postal_code' => $data['postal_code'],
            'country' => $data['country'],
        ]);

        return $this->json($response, $address->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/addresses/{id}',
        summary: 'Edycja adresu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'type', type: 'string', enum: ['billing', 'delivery']),
                    new OA\Property(property: 'street', type: 'string'),
                    new OA\Property(property: 'city', type: 'string'),
                    new OA\Property(property: 'postal_code', type: 'string'),
                    new OA\Property(property: 'country', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano adres', content: new OA\JsonContent(ref: '#/components/schemas/Address')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Adres nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $address = Address::query()->find((int) $args['id']);

        if (! $address) {
            return $this->json($response, ['error' => 'Adres nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $address->fill(array_intersect_key($data, array_flip(['external_id', 'type', 'street', 'city', 'postal_code', 'country'])));
        $address->save();

        return $this->json($response, $address->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/addresses/{id}',
        summary: 'Usunięcie adresu',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Clients'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Adres nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $address = Address::query()->find((int) $args['id']);

        if (! $address) {
            return $this->json($response, ['error' => 'Adres nie istnieje.'], 404);
        }

        $address->delete();

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

        foreach (['street', 'city', 'postal_code', 'country'] as $field) {
            if (! $partial || array_key_exists($field, $data)) {
                if (empty($data[$field]) || ! is_string($data[$field])) {
                    $errors[$field] = "Pole {$field} jest wymagane.";
                }
            }
        }

        if (! $partial || array_key_exists('type', $data)) {
            if (! isset($data['type']) || ! in_array($data['type'], self::TYPES, true)) {
                $errors['type'] = 'Pole type musi mieć wartość billing lub delivery.';
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
