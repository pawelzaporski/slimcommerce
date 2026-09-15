<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Order',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'client_id', type: 'integer', example: 1),
        new OA\Property(property: 'billing_address_id', type: 'integer', nullable: true, example: null),
        new OA\Property(property: 'delivery_address_id', type: 'integer', nullable: true, example: null),
        new OA\Property(property: 'shipping_method_id', type: 'integer', nullable: true, example: null),
        new OA\Property(property: 'total_amount', type: 'number', format: 'float', example: 149.99),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
    ]
)]
final class Order extends Model
{
    public const array STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

    protected $guarded = [];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'billing_address_id');
    }

    public function deliveryAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'delivery_address_id');
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
