import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import UspStrip from '@/components/UspStrip';
import { LogoMark } from '@/components/icons';
import { topLevelCategories } from '@/lib/categories';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import type { Category } from '@/lib/types';

const HELP_LINKS = [
  { href: '/pomoc#dostawa', label: 'Dostawa' },
  { href: '/pomoc#platnosci', label: 'Płatności' },
  { href: '/pomoc#zwroty', label: 'Zwroty i reklamacje' },
  { href: '/pomoc', label: 'Najczęstsze pytania' },
  { href: '/kontakt', label: 'Kontakt' },
];

const COMPANY_LINKS = [
  { href: '/o-nas', label: 'O nas' },
  { href: '/regulamin', label: 'Regulamin' },
  { href: '/polityka-prywatnosci', label: 'Polityka prywatności' },
];

export default function Footer({ categories }: { categories: Category[] }) {
  const shopCategories = topLevelCategories(categories).slice(0, 6);

  return (
    <footer className="mt-16 border-t border-black/10">
      <UspStrip />

      <section className="bg-rose-light">
        <div className="container-x grid items-center gap-6 py-10 md:grid-cols-2">
          <div>
            <h2 className="display text-3xl md:text-4xl">Zapisz się do newslettera</h2>
            <p className="mt-2 max-w-md text-sm text-ink/70">
              Nowości, poradniki i informacje o promocjach prosto na Twoją skrzynkę. Zero spamu, w każdej chwili
              możesz się wypisać.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <section className="container-x grid grid-cols-2 gap-8 py-12 text-sm md:grid-cols-4">
        <div>
          <h3 className="display mb-3 text-base">Sklep</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/produkty" className="hover:text-brand">
                Wszystkie produkty
              </Link>
            </li>
            <li>
              <Link href="/nowosci" className="hover:text-brand">
                Nowości
              </Link>
            </li>
            <li>
              <Link href="/ulubione" className="hover:text-brand">
                Ulubione
              </Link>
            </li>
            {shopCategories.map((category) => (
              <li key={category.id}>
                <Link href={`/kategoria/${category.slug}`} className="hover:text-brand">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="display mb-3 text-base">Pomoc</h3>
          <ul className="space-y-2">
            {HELP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="display mb-3 text-base">O firmie</h3>
          <ul className="space-y-2">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="display mb-3 text-base">Kontakt</h3>
          <ul className="space-y-2 text-ink/80">
            <li>pon.–pt. 8:00–18:00</li>
            <li>
              <a href="mailto:kontakt@example.com" className="hover:text-brand">
                kontakt@example.com
              </a>
            </li>
            <li>
              <a href="tel:+48000000000" className="hover:text-brand">
                +48 000 000 000
              </a>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-2">
            <LogoMark size={28} />
            <span className="flex flex-col leading-none">
              <span className="display text-lg text-brand">{SITE_NAME}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{SITE_TAGLINE}</span>
            </span>
          </div>
        </div>
      </section>

      <div className="border-t border-black/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Wszelkie prawa zastrzeżone.
          </p>
          <p className="display text-[11px] tracking-wider">Płatności: BLIK · karta · przelew · za pobraniem</p>
        </div>
      </div>
    </footer>
  );
}
