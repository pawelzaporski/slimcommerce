<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Product',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: 'ERP-1234'),
        new OA\Property(property: 'sku', type: 'string', example: 'SKU-001'),
        new OA\Property(property: 'name', type: 'string', example: 'Koszulka bawełniana'),
        new OA\Property(property: 'base_price', type: 'number', format: 'float', example: 99.99),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'image1_asset_id', type: 'integer', nullable: true, example: 7, description: 'Pierwsze (główne) zdjęcie - id z tabeli assets'),
        new OA\Property(property: 'image2_asset_id', type: 'integer', nullable: true, example: 8, description: 'Drugie zdjęcie - id z tabeli assets'),
        new OA\Property(property: 'image1', ref: '#/components/schemas/Asset', nullable: true),
        new OA\Property(property: 'image2', ref: '#/components/schemas/Asset', nullable: true),
        new OA\Property(property: 'gallery', type: 'array', items: new OA\Items(ref: '#/components/schemas/Asset'), description: 'Pozostałe zdjęcia (tabela product_assets), posortowane po position'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
final class Product extends Model
{
    /**
     * Relacje ze zdjęciami dołączane wszędzie tam, gdzie zwracamy produkt.
     */
    public const array IMAGE_RELATIONS = ['image1', 'image2', 'gallery'];

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
        'image1_asset_id' => 'integer',
        'image2_asset_id' => 'integer',
    ];

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'product_categories');
    }

    /** Pierwsze (główne) zdjęcie - kolumna products.image1_asset_id. */
    public function image1(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image1_asset_id');
    }

    /** Drugie zdjęcie - kolumna products.image2_asset_id. */
    public function image2(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image2_asset_id');
    }

    /** Pozostałe zdjęcia (galeria) - tabela product_assets, w kolejności `position`. */
    public function gallery(): BelongsToMany
    {
        return $this->belongsToMany(Asset::class, 'product_assets')
            ->withPivot('position')
            ->orderByPivot('position');
    }
}
