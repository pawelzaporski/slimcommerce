<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\DiscountCode;
use App\Models\SalesChannel;
use App\Models\ShippingMethod;

/**
 * Jedno miejsce liczenia koszyka: wartość produktów, rabat z kodu, darmowa
 * dostawa (z kodu albo z progu miejsca sprzedaży) i koszt dostawy.
 * Używane przez storefront (podgląd koszyka) i checkout (zapis do zamówienia),
 * żeby klient widział w koszyku dokładnie to, co trafi do zamówienia.
 *
 * Koszyk musi mieć załadowane `items.variant`, a kod - relację `products`.
 */
final class CartPricing
{
    /**
     * @return array{
     *     items_total: float,
     *     discount_amount: float,
     *     subtotal: float,
     *     free_shipping: bool,
     *     free_shipping_reason: string|null,
     *     free_shipping_from: float|null,
     *     shipping_amount: float,
     *     total: float,
     *     discount_code: array{code: string, type: string, value: float|null}|null,
     *     discount_error: string|null
     * }
     */
    public static function calculate(
        Cart $cart,
        ?DiscountCode $code,
        ?SalesChannel $channel,
        ?ShippingMethod $shippingMethod = null,
    ): array {
        $itemsTotal = 0.0;

        foreach ($cart->items as $item) {
            $itemsTotal += self::unitPrice($item) * $item->quantity;
        }

        $itemsTotal = round($itemsTotal, 2);

        $discount = 0.0;
        $freeByCode = false;
        $discountError = null;
        $codeInfo = null;

        if ($code !== null) {
            $discountError = self::validateCode($code, $cart, $itemsTotal);

            if ($discountError === null) {
                $discount = self::discountFor($code, $cart, $itemsTotal);
                $freeByCode = $code->type === DiscountCode::TYPE_FREE_SHIPPING;
                $codeInfo = [
                    'code' => $code->code,
                    'type' => $code->type,
                    'value' => $code->value !== null ? (float) $code->value : null,
                ];
            }
        }

        $subtotal = round(max(0.0, $itemsTotal - $discount), 2);

        $threshold = $channel?->free_shipping_from !== null ? (float) $channel->free_shipping_from : null;
        $freeByThreshold = $threshold !== null && $cart->items->isNotEmpty() && $subtotal >= $threshold;

        $freeShipping = $freeByCode || $freeByThreshold;
        $shippingAmount = 0.0;

        if ($shippingMethod !== null && ! $freeShipping) {
            $shippingAmount = round((float) $shippingMethod->flat_rate, 2);
        }

        return [
            'items_total' => $itemsTotal,
            'discount_amount' => round($discount, 2),
            'subtotal' => $subtotal,
            'free_shipping' => $freeShipping,
            'free_shipping_reason' => $freeByCode ? 'code' : ($freeByThreshold ? 'threshold' : null),
            'free_shipping_from' => $threshold,
            'shipping_amount' => $shippingAmount,
            'total' => round($subtotal + $shippingAmount, 2),
            'discount_code' => $codeInfo,
            'discount_error' => $discountError,
        ];
    }

    /**
     * Zwraca komunikat błędu (po polsku, do pokazania klientowi) albo null,
     * gdy kod można zastosować do tego koszyka.
     */
    public static function validateCode(DiscountCode $code, Cart $cart, float $itemsTotal): ?string
    {
        if (! $code->is_active) {
            return 'Kod rabatowy jest nieaktywny.';
        }

        $now = time();

        if ($code->starts_at !== null && $code->starts_at->getTimestamp() > $now) {
            return 'Kod rabatowy nie jest jeszcze aktywny.';
        }

        if ($code->ends_at !== null && $code->ends_at->getTimestamp() < $now) {
            return 'Kod rabatowy wygasł.';
        }

        if ($code->usage_limit !== null && $code->used_count >= $code->usage_limit) {
            return 'Limit użyć tego kodu został wyczerpany.';
        }

        if ($code->min_cart_amount !== null && $itemsTotal < (float) $code->min_cart_amount) {
            return sprintf('Ten kod działa od %s zł wartości koszyka.', number_format((float) $code->min_cart_amount, 2, ',', ' '));
        }

        if ($code->isProductScoped() && self::eligibleItems($code, $cart) === []) {
            return 'Ten kod nie obejmuje żadnego produktu w koszyku.';
        }

        return null;
    }

    public static function discountFor(DiscountCode $code, Cart $cart, float $itemsTotal): float
    {
        $value = (float) ($code->value ?? 0);

        switch ($code->type) {
            case DiscountCode::TYPE_PERCENT_CART:
                return round($itemsTotal * min(100.0, max(0.0, $value)) / 100, 2);

            case DiscountCode::TYPE_AMOUNT_CART:
                return round(min($itemsTotal, max(0.0, $value)), 2);

            case DiscountCode::TYPE_PERCENT_PRODUCT:
                $eligible = 0.0;
                foreach (self::eligibleItems($code, $cart) as $item) {
                    $eligible += self::unitPrice($item) * $item->quantity;
                }

                return round($eligible * min(100.0, max(0.0, $value)) / 100, 2);

            case DiscountCode::TYPE_AMOUNT_PRODUCT:
                // Kwota za każdą sztukę objętego produktu, nie więcej niż jego cena.
                $discount = 0.0;
                foreach (self::eligibleItems($code, $cart) as $item) {
                    $discount += min(self::unitPrice($item), max(0.0, $value)) * $item->quantity;
                }

                return round($discount, 2);

            default:
                return 0.0;
        }
    }

    /**
     * @return list<CartItem>
     */
    private static function eligibleItems(DiscountCode $code, Cart $cart): array
    {
        $productIds = $code->productIds();

        if ($productIds === []) {
            return [];
        }

        $items = [];

        foreach ($cart->items as $item) {
            $productId = $item->variant?->product_id;

            if ($productId !== null && in_array((int) $productId, $productIds, true)) {
                $items[] = $item;
            }
        }

        return $items;
    }

    private static function unitPrice(CartItem $item): float
    {
        return (float) ($item->custom_price ?? $item->variant?->price ?? 0);
    }
}
