<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Address',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'client_id', type: 'integer', example: 1),
        new OA\Property(property: 'type', type: 'string', enum: ['billing', 'delivery'], example: 'delivery'),
        new OA\Property(property: 'street', type: 'string', example: 'ul. Kwiatowa 5'),
        new OA\Property(property: 'city', type: 'string', example: 'Warszawa'),
        new OA\Property(property: 'postal_code', type: 'string', example: '00-001'),
        new OA\Property(property: 'country', type: 'string', example: 'Polska'),
    ]
)]
final class Address extends Model
{
    protected $guarded = [];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
