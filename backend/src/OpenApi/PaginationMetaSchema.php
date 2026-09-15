<?php

declare(strict_types=1);

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Nośnik schematu metadanych paginacji, współdzielonego przez
 * stronicowane listy (np. GET /api/admin/products).
 */
#[OA\Schema(
    schema: 'PaginationMeta',
    type: 'object',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1),
        new OA\Property(property: 'per_page', type: 'integer', example: 15),
        new OA\Property(property: 'total', type: 'integer', example: 42),
        new OA\Property(property: 'last_page', type: 'integer', example: 3),
    ]
)]
final class PaginationMetaSchema
{
}
