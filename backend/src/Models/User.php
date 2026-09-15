<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'User',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'name', type: 'string', example: 'Super Admin'),
        new OA\Property(property: 'email', type: 'string', example: 'superadmin'),
        new OA\Property(property: 'role', type: 'string', example: 'superadmin'),
    ]
)]
final class User extends Model
{
    protected $guarded = [];

    protected $hidden = ['password'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
