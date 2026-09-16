<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ProductVariant',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'product_id', type: 'integer', example: 1),
        new OA\Property(property: 'sku', type: 'string', example: 'SKU-001-XL'),
        new OA\Property(property: 'ean', type: 'string', nullable: true, example: '5901234123457'),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 79.99),
        new OA\Property(property: 'stock', type: 'integer', example: 10),
        new OA\Property(
            property: 'attribute_values',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/AttributeValue')
        ),
        new OA\Property(property: 'product', ref: '#/components/schemas/Product', nullable: true, description: 'Produkt nadrzędny (z image1/image2) - obecny tam, gdzie API dociąga tę relację, np. w pozycjach koszyka'),
    ]
)]
final class ProductVariant extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function attributeValues(): BelongsToMany
    {
        // Tabela pivot ma kolumny variant_id / attribute_value_id (patrz
        // database/migrations/..._create_variant_attribute_values_table.php),
        // a nie domyślne product_variant_id oczekiwane przez konwencję Eloquenta.
        return $this->belongsToMany(
            AttributeValue::class,
            'variant_attribute_values',
            foreignPivotKey: 'variant_id',
            relatedPivotKey: 'attribute_value_id',
        );
    }
}
