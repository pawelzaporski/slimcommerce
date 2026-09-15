<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'CartItem',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'cart_id', type: 'integer', example: 1),
        new OA\Property(property: 'variant_id', type: 'integer', example: 1),
        new OA\Property(property: 'quantity', type: 'integer', example: 1),
        new OA\Property(property: 'custom_price', type: 'number', format: 'float', nullable: true, example: null, description: 'Opcjonalna cena nadpisująca cenę wariantu (np. rabat)'),
    ]
)]
final class CartItem extends Model
{
    protected $guarded = [];

    protected $casts = [
        'quantity' => 'integer',
        'custom_price' => 'decimal:2',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
