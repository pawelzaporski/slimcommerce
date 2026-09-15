<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Order;
use App\Models\Payment;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PaymentController
{
    #[OA\Post(
        path: '/api/admin/orders/{orderId}/payments',
        summary: 'Zarejestrowanie płatności do zamówienia',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        parameters: [new OA\Parameter(name: 'orderId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['amount', 'method'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'amount', type: 'number', format: 'float', example: 149.99),
                    new OA\Property(property: 'method', type: 'string', example: 'card'),
                    new OA\Property(property: 'status', type: 'string', default: 'paid'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Zarejestrowano płatność', content: new OA\JsonContent(ref: '#/components/schemas/Payment')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Zamówienie nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response, array $args): Response
    {
        $order = Order::query()->find((int) $args['orderId']);

        if (! $order) {
            return $this->json($response, ['error' => 'Zamówienie nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();
        $errors = $this->validate($data);

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $payment = $order->payments()->create([
            'external_id' => $data['external_id'] ?? null,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => $data['status'] ?? 'paid',
        ]);

        return $this->json($response, $payment->toArray(), 201);
    }

    #[OA\Delete(
        path: '/api/admin/payments/{id}',
        summary: 'Usunięcie płatności',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Orders'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Płatność nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $payment = Payment::query()->find((int) $args['id']);

        if (! $payment) {
            return $this->json($response, ['error' => 'Płatność nie istnieje.'], 404);
        }

        $payment->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data): array
    {
        $errors = [];

        if (! isset($data['amount']) || ! is_numeric($data['amount'])) {
            $errors['amount'] = 'Pole amount musi być liczbą.';
        }

        if (empty($data['method']) || ! is_string($data['method'])) {
            $errors['method'] = 'Pole method jest wymagane.';
        }

        if (isset($data['status']) && ! in_array($data['status'], Payment::STATUSES, true)) {
            $errors['status'] = 'Nieprawidłowy status płatności. Dozwolone: ' . implode(', ', Payment::STATUSES) . '.';
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
