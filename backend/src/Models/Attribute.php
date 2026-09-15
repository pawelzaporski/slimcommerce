<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Attribute',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'name', type: 'string', example: 'Rozmiar'),
        new OA\Property(
            property: 'values',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/AttributeValue')
        ),
    ]
)]
final class Attribute extends Model
{
    protected $guarded = [];

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }
}
