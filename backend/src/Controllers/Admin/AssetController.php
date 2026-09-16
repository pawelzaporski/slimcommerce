<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Asset;
use App\Models\Product;
use Illuminate\Database\Capsule\Manager as Capsule;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;

/**
 * Upload i zarządzanie plikami (zdjęciami). Pliki lądują fizycznie w
 * public/uploads/RRRR/MM/<losowa-nazwa>.<ext>, a metadane w tabeli `assets`.
 * Powiązanie z produktem robi się osobno - przez PUT /api/admin/products/{id}
 * (pola image1_asset_id, image2_asset_id, gallery_asset_ids).
 */
final class AssetController
{
    /** Dozwolone typy (wykrywane z treści pliku, nie z nagłówka klienta) => rozszerzenie na dysku. */
    private const array ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/avif' => 'avif',
    ];

    /** Limit rozmiaru pojedynczego pliku. Realny limit ogranicza też php.ini (upload_max_filesize / post_max_size). */
    private const int MAX_FILE_SIZE = 10 * 1024 * 1024;

    private const string UPLOADS_DIR = 'uploads';

    public function __construct(private readonly string $publicPath)
    {
    }

    #[OA\Get(
        path: '/api/admin/assets',
        summary: 'Lista plików (zdjęć)',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Assets'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 30)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Stronicowana lista plików (od najnowszych)',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Asset')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $query = $request->getQueryParams();
        $page = max(1, (int) ($query['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($query['per_page'] ?? 30)));

        $total = Asset::query()->count();

        $assets = Asset::query()
            ->orderByDesc('id')
            ->forPage($page, $perPage)
            ->get();

        return $this->json($response, [
            'data' => $assets->toArray(),
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/assets/{id}',
        summary: 'Szczegóły pliku',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Assets'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Plik', content: new OA\JsonContent(ref: '#/components/schemas/Asset')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Plik nie istnieje'),
        ]
    )]
    public function show(Request $request, Response $response, array $args): Response
    {
        $asset = Asset::query()->find((int) $args['id']);

        if (! $asset) {
            return $this->json($response, ['error' => 'Plik nie istnieje.'], 404);
        }

        return $this->json($response, $asset->toArray());
    }

    #[OA\Post(
        path: '/api/admin/assets',
        summary: 'Upload pliku (zdjęcia)',
        description: 'Przyjmuje multipart/form-data z polem `file` (JPEG/PNG/WebP/GIF/AVIF, do 10 MB) i opcjonalnymi `alt`, `external_id`. Typ pliku wykrywany jest z jego treści. Zwraca rekord assetu z gotowym `url`.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Assets'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['file'],
                    properties: [
                        new OA\Property(property: 'file', type: 'string', format: 'binary'),
                        new OA\Property(property: 'alt', type: 'string', nullable: true),
                        new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Wgrano plik', content: new OA\JsonContent(ref: '#/components/schemas/Asset')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji (brak pliku, zły typ, za duży)'),
        ]
    )]
    public function upload(Request $request, Response $response): Response
    {
        $files = $request->getUploadedFiles();
        $file = $files['file'] ?? null;
        $data = (array) $request->getParsedBody();

        if (! $file instanceof UploadedFileInterface) {
            return $this->json($response, ['errors' => ['file' => 'Brak pliku w polu "file" (multipart/form-data).']], 422);
        }

        if ($file->getError() !== UPLOAD_ERR_OK) {
            return $this->json($response, ['errors' => ['file' => $this->uploadErrorMessage($file->getError())]], 422);
        }

        $size = (int) $file->getSize();

        if ($size <= 0 || $size > self::MAX_FILE_SIZE) {
            return $this->json($response, ['errors' => ['file' => 'Plik jest pusty albo przekracza 10 MB.']], 422);
        }

        $tempPath = $file->getStream()->getMetadata('uri');

        if (! is_string($tempPath) || ! is_file($tempPath)) {
            return $this->json($response, ['errors' => ['file' => 'Nie udało się odczytać wgranego pliku.']], 422);
        }

        $mimeType = (string) (new \finfo(FILEINFO_MIME_TYPE))->file($tempPath);

        if (! isset(self::ALLOWED_MIME_TYPES[$mimeType])) {
            return $this->json($response, ['errors' => ['file' => 'Niedozwolony typ pliku. Dozwolone: JPEG, PNG, WebP, GIF, AVIF.']], 422);
        }

        $dimensions = @getimagesize($tempPath);
        $width = is_array($dimensions) ? (int) $dimensions[0] : null;
        $height = is_array($dimensions) ? (int) $dimensions[1] : null;

        $relativeDir = self::UPLOADS_DIR . '/' . date('Y') . '/' . date('m');
        $targetDir = $this->publicPath . '/' . $relativeDir;

        if (! is_dir($targetDir) && ! mkdir($targetDir, 0755, true) && ! is_dir($targetDir)) {
            return $this->json($response, ['error' => 'Nie można utworzyć katalogu na pliki.'], 500);
        }

        $storedName = bin2hex(random_bytes(12)) . '.' . self::ALLOWED_MIME_TYPES[$mimeType];
        $relativePath = $relativeDir . '/' . $storedName;

        $file->moveTo($targetDir . '/' . $storedName);

        $asset = Asset::query()->create([
            'external_id' => $this->optionalString($data['external_id'] ?? null),
            'filename' => $this->safeFilename($file->getClientFilename()),
            'path' => $relativePath,
            'mime_type' => $mimeType,
            'size' => $size,
            'width' => $width,
            'height' => $height,
            'alt' => $this->optionalString($data['alt'] ?? null),
        ]);

        return $this->json($response, $asset->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/assets/{id}',
        summary: 'Edycja metadanych pliku',
        description: 'Zmienia tylko opis (`alt`) i `external_id`. Sam plik jest niezmienny - żeby podmienić zdjęcie, wgraj nowe i wskaż je w produkcie.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Assets'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'alt', type: 'string', nullable: true),
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano', content: new OA\JsonContent(ref: '#/components/schemas/Asset')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Plik nie istnieje'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $asset = Asset::query()->find((int) $args['id']);

        if (! $asset) {
            return $this->json($response, ['error' => 'Plik nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        if (array_key_exists('alt', $data)) {
            $asset->alt = $this->optionalString($data['alt']);
        }

        if (array_key_exists('external_id', $data)) {
            $asset->external_id = $this->optionalString($data['external_id']);
        }

        $asset->save();

        return $this->json($response, $asset->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/assets/{id}',
        summary: 'Usunięcie pliku',
        description: 'Usuwa rekord i plik z dysku. Produkty, które wskazywały na ten plik jako zdjęcie 1/2, dostają tam NULL; wpisy w galerii (product_assets) są kasowane.',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Assets'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Plik nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $asset = Asset::query()->find((int) $args['id']);

        if (! $asset) {
            return $this->json($response, ['error' => 'Plik nie istnieje.'], 404);
        }

        $asset->getConnection()->transaction(function () use ($asset): void {
            Product::query()->where('image1_asset_id', $asset->id)->update(['image1_asset_id' => null]);
            Product::query()->where('image2_asset_id', $asset->id)->update(['image2_asset_id' => null]);
            Capsule::table('product_assets')->where('asset_id', $asset->id)->delete();
            $asset->delete();
        });

        $absolutePath = $this->publicPath . '/' . ltrim((string) $asset->path, '/');

        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }

        return $response->withStatus(204);
    }

    private function uploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Plik przekracza limit rozmiaru (upload_max_filesize / post_max_size w php.ini).',
            UPLOAD_ERR_PARTIAL => 'Plik został wgrany tylko częściowo.',
            UPLOAD_ERR_NO_FILE => 'Nie wybrano pliku.',
            default => 'Nie udało się wgrać pliku (kod ' . $code . ').',
        };
    }

    private function safeFilename(?string $name): string
    {
        $name = basename(trim((string) $name));
        $name = preg_replace('/[^\pL\pN._ -]+/u', '_', $name) ?? '';

        return $name !== '' ? mb_substr($name, 0, 200) : 'plik';
    }

    private function optionalString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
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
