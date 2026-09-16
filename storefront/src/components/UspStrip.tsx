import { ReturnIcon, ShieldIcon, StoreIcon, TruckIcon } from '@/components/icons';
import { FREE_SHIPPING_FROM } from '@/lib/site';

const USPS = [
  { icon: ShieldIcon, title: '100% bezpieczne', text: 'płatności online' },
  { icon: ReturnIcon, title: '14 dni na zwrot', text: 'bez podawania przyczyny' },
  { icon: TruckIcon, title: `Darmowa dostawa`, text: `od ${FREE_SHIPPING_FROM} zł dla wszystkich` },
  { icon: StoreIcon, title: 'Gwarancja', text: 'oryginalności produktów' },
];

export default function UspStrip() {
  return (
    <section className="container-x grid grid-cols-2 gap-6 py-10 md:grid-cols-4" aria-label="Dlaczego warto">
      {USPS.map(({ icon: Icon, title, text }) => (
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
