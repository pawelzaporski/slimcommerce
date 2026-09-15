<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'AttributeValue',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'attribute_id', type: 'integer', example: 1),
        new OA\Property(property: 'value', type: 'string', example: 'XL'),
    ]
)]
final class AttributeValue extends Model
{
    protected $guarded = [];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }
}
