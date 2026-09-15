<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ShippingMethod',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'name', type: 'string', example: 'Kurier DPD'),
        new OA\Property(property: 'flat_rate', type: 'number', format: 'float', example: 15.99),
    ]
)]
final class ShippingMethod extends Model
{
    protected $guarded = [];

    protected $casts = [
        'flat_rate' => 'decimal:2',
    ];
}
