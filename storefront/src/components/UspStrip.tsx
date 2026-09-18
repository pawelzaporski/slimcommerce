import { ReturnIcon, ShieldIcon, StoreIcon, TruckIcon } from '@/components/icons';
import { getStorefrontSettingsSafe } from '@/lib/api';
import { formatPrice } from '@/lib/site';

/** Pasek USP pod treścią strony. Próg darmowej dostawy bierze z ustawień miejsca sprzedaży (API); bez progu pokazuje neutralny kafelek. */
export default async function UspStrip() {
  const { free_shipping_from: freeShippingFrom } = await getStorefrontSettingsSafe();

  const usps = [
    { icon: ShieldIcon, title: '100% bezpieczne', text: 'płatności online' },
    { icon: ReturnIcon, title: '14 dni na zwrot', text: 'bez podawania przyczyny' },
    freeShippingFrom !== null
      ? { icon: TruckIcon, title: 'Darmowa dostawa', text: `od ${formatPrice(freeShippingFrom)} dla wszystkich` }
      : { icon: TruckIcon, title: 'Szybka dostawa', text: 'pod wskazany adres' },
    { icon: StoreIcon, title: 'Gwarancja', text: 'oryginalności produktów' },
  ];

  return (
    <section className="container-x grid grid-cols-2 gap-6 py-10 md:grid-cols-4" aria-label="Dlaczego warto">
      {usps.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex flex-col items-center text-center">
          <Icon size={40} strokeWidth={1.3} />
          <p className="display mt-3 text-sm leading-tight">
            {title}
            <br />
            <span className="text-ink/70">{text}</span>
          </p>
        </div>
      ))}
    </section>
  );
}
