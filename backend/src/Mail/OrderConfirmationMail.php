<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Order;
use App\Support\Mailer;

/**
 * Potwierdzenie złożenia zamówienia dla klienta (wysyłane po checkoucie).
 * Zamówienie musi mieć załadowane relacje: client, deliveryAddress,
 * shippingMethod, items.variant.product, payments.
 */
final readonly class OrderConfirmationMail
{
    public function __construct(private Mailer $mailer, private string $shopName)
    {
    }

    public function send(Order $order): bool
    {
        $client = $order->client;

        if ($client === null || empty($client->email)) {
            return false;
        }

        $subject = sprintf('%s - potwierdzenie zamówienia #%d', $this->shopName, $order->id);

        return $this->mailer->send(
            toEmail: (string) $client->email,
            toName: trim((string) $client->first_name . ' ' . (string) $client->last_name),
            subject: $subject,
            text: $this->text($order),
            html: $this->html($order),
        );
    }

    private function text(Order $order): string
    {
        $lines = [
            sprintf('Dziękujemy za zamówienie #%d w sklepie %s.', $order->id, $this->shopName),
            '',
            'Pozycje:',
        ];

        foreach ($order->items as $item) {
            $lines[] = sprintf(
                '- %s x %d - %s zł',
                $this->itemName($item),
                $item->quantity,
                $this->money((float) $item->unit_price * $item->quantity),
            );
        }

        $lines[] = '';

        if ((float) $order->discount_amount > 0) {
            $lines[] = sprintf('Rabat%s: -%s zł', $order->discount_code ? " ({$order->discount_code})" : '', $this->money((float) $order->discount_amount));
        }

        if ($order->shippingMethod !== null) {
            $shipping = (float) $order->shipping_amount;
            $lines[] = sprintf('Dostawa: %s - %s', $order->shippingMethod->name, $shipping > 0 ? $this->money($shipping) . ' zł' : 'gratis');
        }

        $lines[] = sprintf('Razem do zapłaty: %s zł', $this->money((float) $order->total_amount));

        $payment = $order->payments->first();
        if ($payment !== null) {
            $lines[] = sprintf('Płatność: %s', $payment->method);
        }

        if ($order->deliveryAddress !== null) {
            $a = $order->deliveryAddress;
            $lines[] = '';
            $lines[] = 'Adres dostawy:';
            $lines[] = $a->street;
            $lines[] = sprintf('%s %s', $a->postal_code, $a->city);
            $lines[] = $a->country;
        }

        $lines[] = '';
        $lines[] = 'Status zamówienia: ' . $order->status;

        return implode("\n", $lines);
    }

    private function html(Order $order): string
    {
        $e = static fn (mixed $value): string => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $rows = '';
        foreach ($order->items as $item) {
            $rows .= sprintf(
                '<tr><td style="padding:4px 8px">%s</td><td style="padding:4px 8px;text-align:right">%d</td><td style="padding:4px 8px;text-align:right">%s zł</td></tr>',
                $e($this->itemName($item)),
                $item->quantity,
                $e($this->money((float) $item->unit_price * $item->quantity)),
            );
        }

        $discountHtml = (float) $order->discount_amount > 0
            ? sprintf('<p>Rabat%s: -%s zł</p>', $order->discount_code ? ' (' . $e($order->discount_code) . ')' : '', $e($this->money((float) $order->discount_amount)))
            : '';

        $shippingAmount = (float) $order->shipping_amount;
        $shipping = $order->shippingMethod !== null
            ? sprintf('<p>Dostawa: %s - %s</p>', $e($order->shippingMethod->name), $shippingAmount > 0 ? $e($this->money($shippingAmount)) . ' zł' : 'gratis')
            : '';

        $payment = $order->payments->first();
        $paymentHtml = $payment !== null ? sprintf('<p>Płatność: %s</p>', $e($payment->method)) : '';

        $address = '';
        if ($order->deliveryAddress !== null) {
            $a = $order->deliveryAddress;
            $address = sprintf(
                '<p><strong>Adres dostawy</strong><br>%s<br>%s %s<br>%s</p>',
                $e($a->street),
                $e($a->postal_code),
                $e($a->city),
                $e($a->country),
            );
        }

        return sprintf(
            '<!doctype html><html lang="pl"><body style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
            . '<h2>Dziękujemy za zamówienie #%d</h2>'
            . '<p>Sklep: %s</p>'
            . '<table cellspacing="0" cellpadding="0" style="border-collapse:collapse">'
            . '<thead><tr><th style="text-align:left;padding:4px 8px">Produkt</th><th style="padding:4px 8px">Ilość</th><th style="padding:4px 8px">Wartość</th></tr></thead>'
            . '<tbody>%s</tbody></table>'
            . '%s%s<p><strong>Razem do zapłaty: %s zł</strong></p>%s%s'
            . '<p>Status zamówienia: %s</p>'
            . '</body></html>',
            $order->id,
            $e($this->shopName),
            $rows,
            $discountHtml,
            $shipping,
            $e($this->money((float) $order->total_amount)),
            $paymentHtml,
            $address,
            $e($order->status),
        );
    }

    private function itemName(object $item): string
    {
        $variant = $item->variant;
        $product = $variant?->product;

        $name = $product?->name ?? ('Wariant #' . $item->variant_id);
        $sku = $variant?->sku;

        return $sku ? "{$name} ({$sku})" : $name;
    }

    private function money(float $amount): string
    {
        return number_format($amount, 2, ',', ' ');
    }
}
