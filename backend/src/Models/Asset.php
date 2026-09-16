<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Asset',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'filename', type: 'string', example: 'koszulka-przod.jpg', description: 'Oryginalna nazwa wgranego pliku'),
        new OA\Property(property: 'path', type: 'string', example: 'uploads/2026/09/3f9a1c2b.jpg', description: 'Ścieżka względem katalogu public/'),
        new OA\Property(property: 'url', type: 'string', example: 'http://localhost:8080/uploads/2026/09/3f9a1c2b.jpg', description: 'Pełny adres pliku (APP_URL + path)'),
        new OA\Property(property: 'mime_type', type: 'string', example: 'image/jpeg'),
        new OA\Property(property: 'size', type: 'integer', example: 245812, description: 'Rozmiar w bajtach'),
        new OA\Property(property: 'width', type: 'integer', nullable: true, example: 1200),
        new OA\Property(property: 'height', type: 'integer', nullable: true, example: 1200),
        new OA\Property(property: 'alt', type: 'string', nullable: true, example: 'Koszulka bawełniana - przód'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
final class Asset extends Model
{
    /**
     * Baza adresu, pod którym serwowany jest katalog public/ (bez końcowego "/").
     * Ustawiana raz w public/index.php z APP_URL (albo z nagłówka Host żądania).
     */
    private static string $baseUrl = '';

    protected $guarded = [];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    protected $appends = ['url'];

    public static function setBaseUrl(string $baseUrl): void
    {
        self::$baseUrl = rtrim($baseUrl, '/');
    }

    public function getUrlAttribute(): string
    {
        return self::$baseUrl . '/' . ltrim((string) $this->path, '/');
    }
}
