<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\Installer;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/**
 * Ręczne uruchomienie migracji przez HTTP - dla shared hostingu bez SSH,
 * gdy DB_AUTO_MIGRATE=false. Chronione sekretem MIGRATE_SECRET z .env
 * (nagłówek X-Migrate-Key). Bez ustawionego sekretu endpoint nie istnieje (404).
 */
final readonly class MaintenanceController
{
    public function __construct(private string $migrateSecret)
    {
    }

    #[OA\Post(
        path: '/api/admin/migrate',
        summary: 'Uruchomienie migracji i seedu (wymaga nagłówka X-Migrate-Key = MIGRATE_SECRET)',
        tags: ['Admin - Maintenance'],
        parameters: [
            new OA\Parameter(name: 'X-Migrate-Key', in: 'header', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Wykonano',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'executed', type: 'array', items: new OA\Items(type: 'string')),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Zły klucz'),
            new OA\Response(response: 404, description: 'MIGRATE_SECRET nie jest ustawiony'),
            new OA\Response(response: 500, description: 'Migracja nie powiodła się'),
        ]
    )]
    public function migrate(Request $request, Response $response): Response
    {
        if ($this->migrateSecret === '') {
            return $this->json($response, ['error' => 'Not found.'], 404);
        }

        $provided = $request->getHeaderLine('X-Migrate-Key');

        if ($provided === '' || ! hash_equals($this->migrateSecret, $provided)) {
            return $this->json($response, ['error' => 'Forbidden.'], 403);
        }

        try {
            $executed = Installer::run();
        } catch (Throwable $e) {
            error_log('[migrate] ' . $e->getMessage());

            return $this->json($response, ['error' => 'Migracja nie powiodła się: ' . $e->getMessage()], 500);
        }

        return $this->json($response, ['executed' => $executed]);
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
