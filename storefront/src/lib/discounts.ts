import { formatPrice } from './site';
import type { DiscountCodeInfo } from './types';

/** Krótki opis działania kodu do pokazania przy chipie z kodem ("-20%", "-10,00 zł/szt. na wybrane produkty"...). */
export function describeDiscount(info: DiscountCodeInfo): string {
  const value = info.value ?? 0;
  switch (info.type) {
    case 'percent_cart':
      return `-${value}% na cały koszyk`;
    case 'amount_cart':
      return `-${formatPrice(value)} na cały koszyk`;
    case 'percent_product':
      return `-${value}% na wybrane produkty`;
    case 'amount_product':
      return `-${formatPrice(value)}/szt. na wybrane produkty`;
    case 'free_shipping':
      return 'darmowa dostawa';
    default:
      return '';
  }
}
