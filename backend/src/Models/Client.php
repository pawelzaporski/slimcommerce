<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Client',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'client_type', type: 'string', enum: ['b2c', 'b2b', 'gov'], example: 'b2c'),
        new OA\Property(property: 'first_name', type: 'string', example: 'Jan'),
        new OA\Property(property: 'last_name', type: 'string', example: 'Kowalski'),
        new OA\Property(property: 'company_name', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'nip', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'email', type: 'string', example: 'jan.kowalski@example.com'),
        new OA\Property(property: 'discount_percent', type: 'number', format: 'float', example: 0),
    ]
)]
final class Client extends Model
{
    protected $guarded = [];

    protected $hidden = ['password'];

    protected $casts = [
        'discount_percent' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
