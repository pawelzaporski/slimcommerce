<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'DiscountCode',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'code', type: 'string', example: 'LATO20', description: 'Zawsze wielkimi literami, bez spacji'),
        new OA\Property(property: 'type', type: 'string', enum: ['percent_cart', 'amount_cart', 'percent_product', 'amount_product', 'free_shipping'], example: 'percent_cart'),
        new OA\Property(property: 'value', type: 'number', format: 'float', nullable: true, example: 20, description: 'Procent (0-100) albo kwota w zł; dla amount_product - kwota za sztukę; null dla free_shipping'),
        new OA\Property(property: 'min_cart_amount', type: 'number', format: 'float', nullable: true, example: 100, description: 'Minimalna wartość produktów w koszyku (przed rabatem)'),
        new OA\Property(property: 'starts_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ends_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'usage_limit', type: 'integer', nullable: true, example: 100),
        new OA\Property(property: 'used_count', type: 'integer', example: 3),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'products', type: 'array', items: new OA\Items(ref: '#/components/schemas/Product'), description: 'Tylko dla percent_product / amount_product'),
    ]
)]
final class DiscountCode extends Model
{
    public const string TYPE_PERCENT_CART = 'percent_cart';
    public const string TYPE_AMOUNT_CART = 'amount_cart';
    public const string TYPE_PERCENT_PRODUCT = 'percent_product';
    public const string TYPE_AMOUNT_PRODUCT = 'amount_product';
    public const string TYPE_FREE_SHIPPING = 'free_shipping';

    public const array TYPES = [
        self::TYPE_PERCENT_CART,
        self::TYPE_AMOUNT_CART,
        self::TYPE_PERCENT_PRODUCT,
        self::TYPE_AMOUNT_PRODUCT,
        self::TYPE_FREE_SHIPPING,
    ];

    protected $guarded = [];

    protected $casts = [
        'value' => 'decimal:2',
        'min_cart_amount' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'is_active' => 'boolean',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'discount_code_products');
    }

    public function isProductScoped(): bool
    {
        return in_array($this->type, [self::TYPE_PERCENT_PRODUCT, self::TYPE_AMOUNT_PRODUCT], true);
    }

    public function isPercent(): bool
    {
        return in_array($this->type, [self::TYPE_PERCENT_CART, self::TYPE_PERCENT_PRODUCT], true);
    }

    /** Kod wpisany przez klienta: bez spacji, wielkimi literami. */
    public static function normalizeCode(string $value): string
    {
        return strtoupper(preg_replace('/\s+/', '', trim($value)) ?? '');
    }

    public static function findByCode(string $value): ?self
    {
        $code = self::normalizeCode($value);

        if ($code === '') {
            return null;
        }

        return self::query()->with('products')->where('code', $code)->first();
    }

    /**
     * @return list<int>
     */
    public function productIds(): array
    {
        return $this->products->pluck('id')->map(static fn ($id): int => (int) $id)->all();
    }
}
