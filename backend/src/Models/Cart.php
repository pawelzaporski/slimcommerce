<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Cart',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'token', type: 'string', nullable: true, example: 'a1b2c3...', description: 'Nieodgadnięty identyfikator używany przez storefront zamiast id'),
        new OA\Property(property: 'client_id', type: 'integer', nullable: true, example: null, description: 'Puste dla koszyka gościa (niezalogowanego klienta)'),
        new OA\Property(property: 'name', type: 'string', nullable: true, example: 'Mój koszyk'),
        new OA\Property(property: 'status', type: 'string', example: 'active'),
        new OA\Property(property: 'discount_code_id', type: 'integer', nullable: true, example: null, description: 'Kod rabatowy przypięty do koszyka (storefront)'),
        new OA\Property(property: 'last_interaction_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
final class Cart extends Model
{
    public const array STATUSES = ['active', 'abandoned', 'converted'];

    protected $guarded = [];

    protected $casts = [
        'last_interaction_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function discountCode(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class);
    }

    public static function generateToken(): string
    {
        return bin2hex(random_bytes(24));
    }
}
