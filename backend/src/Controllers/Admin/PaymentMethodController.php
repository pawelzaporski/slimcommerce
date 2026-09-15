<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\PaymentMethod;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PaymentMethodController
{
    #[OA\Get(
        path: '/api/admin/payment-methods',
        summary: 'Lista metod płatności',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Payment Methods'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista metod płatności',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/PaymentMethod'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $methods = PaymentMethod::query()->orderBy('name')->get();

        return $this->json($response, $methods->toArray());
    }

    #[OA\Post(
        path: '/api/admin/payment-methods',
        summary: 'Dodanie metody płatności',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Payment Methods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', example: 'Karta płatnicza'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono metodę płatności', content: new OA\JsonContent(ref: '#/components/schemas/PaymentMethod')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data);

        if ($errors === [] && PaymentMethod::query()->where('name', $data['name'])->exists()) {
            $errors['name'] = 'Metoda płatności o takiej nazwie już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $method = PaymentMethod::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'name' => $data['name'],
        ]);

        return $this->json($response, $method->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/payment-methods/{id}',
        summary: 'Edycja metody płatności',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Payment Methods'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano metodę płatności', content: new OA\JsonContent(ref: '#/components/schemas/PaymentMethod')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Metoda płatności nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $method = PaymentMethod::query()->find((int) $args['id']);

        if (! $method) {
            return $this->json($response, ['error' => 'Metoda płatności nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data, partial: true);

        if (
            $errors === []
            && array_key_exists('name', $data)
            && PaymentMethod::query()->where('name', $data['name'])->where('id', '!=', $method->id)->exists()
        ) {
            $errors['name'] = 'Metoda płatności o takiej nazwie już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $method->fill(array_intersect_key($data, array_flip(['external_id', 'name'])));
        $method->save();

        return $this->json($response, $method->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/payment-methods/{id}',
        summary: 'Usunięcie metody płatności',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Payment Methods'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Metoda płatności nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $method = PaymentMethod::query()->find((int) $args['id']);

        if (! $method) {
            return $this->json($response, ['error' => 'Metoda płatności nie istnieje.'], 404);
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
