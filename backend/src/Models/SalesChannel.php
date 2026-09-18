<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ServerRequestInterface;

#[OA\Schema(
    schema: 'SalesChannel',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'external_id', type: 'string', nullable: true, example: null),
        new OA\Property(property: 'name', type: 'string', example: 'Sklep główny'),
        new OA\Property(property: 'domain', type: 'string', example: 'https://sklep.example.com', description: 'Origin storefrontu (schemat + host [+ port]) dopuszczony w CORS'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'free_shipping_from', type: 'number', format: 'float', nullable: true, example: 199, description: 'Wartość koszyka (po rabacie), od której dostawa w tym sklepie jest darmowa; null = brak progu'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
final class SalesChannel extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'free_shipping_from' => 'decimal:2',
    ];

    /**
     * Miejsce sprzedaży, z którego przyszło żądanie storefrontu: po nagłówku
     * X-Sales-Channel (origin sklepu, wysyłany przez storefront także z SSR),
     * a w drugiej kolejności po Origin przeglądarki. Gdy nic nie pasuje, a
     * aktywne jest dokładnie jedno miejsce sprzedaży - używamy go (typowa
     * instalacja z jednym sklepem). W innym wypadku null.
     */
    public static function resolveForRequest(ServerRequestInterface $request): ?self
    {
        foreach (['X-Sales-Channel', 'Origin'] as $header) {
            $value = trim($request->getHeaderLine($header));

            if ($value === '') {
                continue;
            }

            $origin = self::normalizeDomain($value);

            if ($origin === null) {
                continue;
            }

            $channel = self::query()->where('domain', $origin)->where('is_active', true)->first();

            if ($channel !== null) {
                return $channel;
            }
        }

        $active = self::query()->where('is_active', true)->orderBy('id')->limit(2)->get();

        return $active->count() === 1 ? $active->first() : null;
    }

    /**
     * Originy aktywnych miejsc sprzedaży - wchodzą na listę dozwolonych w CORS.
     *
     * @return list<string>
     */
    public static function activeOrigins(): array
    {
        return self::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->pluck('domain')
            ->all();
    }

    /**
     * Sprowadza wpisaną domenę do postaci origin: małe litery, schemat (domyślnie
     * https), host i ewentualny port - bez ścieżki, query i końcowego "/".
     * Zwraca null, gdy z wartości nie da się wyciągnąć hosta.
     */
    public static function normalizeDomain(string $value): ?string
    {
        $value = strtolower(trim($value));

        if ($value === '') {
            return null;
        }

        if (! preg_match('#^[a-z][a-z0-9+.-]*://#', $value)) {
            $value = 'https://' . $value;
        }

        $parts = parse_url($value);

        if ($parts === false || empty($parts['host']) || ! in_array($parts['scheme'] ?? '', ['http', 'https'], true)) {
            return null;
        }

        // parse_url łyka np. "not a domain" jako host - wymagamy poprawnej nazwy
        // hosta (etykiety a-z0-9 i myślniki, rozdzielone kropkami) albo adresu IP.
        $host = $parts['host'];
        $isHostname = preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/', $host) === 1;
        $isIp = filter_var(trim($host, '[]'), FILTER_VALIDATE_IP) !== false;

        if (! $isHostname && ! $isIp) {
            return null;
        }

        $origin = $parts['scheme'] . '://' . $parts['host'];

        if (isset($parts['port'])) {
            $origin .= ':' . $parts['port'];
        }

        return $origin;
    }
}
