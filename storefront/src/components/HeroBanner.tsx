import Image from 'next/image';
import Link from 'next/link';
import { imageAlt } from '@/lib/images';
import type { Product } from '@/lib/types';

/** Baner główny - pastelowe tło, duży kondensowany nagłówek, produkt z oferty (jeśli ma zdjęcie). */
export default function HeroBanner({ featured }: { featured?: Product }) {
  const image = featured?.image1 ?? null;

  return (
    <section className="relative overflow-hidden bg-rose">
      <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-plum/15" />
      <div aria-hidden className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full bg-lemon/70" />

      <div className="container-x relative grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div>
          <span className="badge badge-brand">Nowości w sklepie</span>
          <h1 className="display mt-4 text-5xl leading-[0.95] md:text-7xl">
            Zakupy,
            <br />
            które cieszą
          </h1>
          <p className="mt-5 max-w-md text-base text-ink/75">
            Wybrane produkty, szybka dostawa i 14 dni na zwrot. Sprawdź, co nowego pojawiło się w naszej ofercie.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/produkty" className="btn btn-black btn-lg">
              Zobacz produkty
            </Link>
            <Link href="/nowosci" className="btn btn-outline btn-lg">
              Nowości
            </Link>
          </div>
        </div>

        {featured && (
          <Link href={`/produkty/${featured.id}`} className="group relative mx-auto w-full max-w-sm md:ml-auto">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white shadow-xl">
              {image ? (
                <Image
                  src={image.url}
                  alt={imageAlt(image, featured.name)}
                  fill
                  priority
                  sizes="(min-width: 768px) 24rem, 80vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm uppercase tracking-wider text-ink/30">
                  {featured.name}
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 left-6 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Polecamy</p>
              <p className="display text-base leading-tight">{featured.name}</p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
