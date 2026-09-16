'use client';

import Image from 'next/image';
import { useState } from 'react';
import { imageAlt } from '@/lib/images';
import type { Asset } from '@/lib/types';

interface ProductGalleryProps {
  images: Asset[];
  productName: string;
}

/**
 * Duże zdjęcie + pasek miniatur. Pierwsze zdjęcie (image1) jest w HTML od razu
 * (SSR), przełączanie miniatur to jedyna część wymagająca JS po stronie klienta.
 */
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeId, setActiveId] = useState<number | null>(images[0]?.id ?? null);
  const active = images.find((image) => image.id === activeId) ?? images[0];

  if (!active) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-smoke text-sm uppercase tracking-wider text-ink/30">
        Brak zdjęcia
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-smoke">
        <Image
          key={active.id}
          src={active.url}
          alt={imageAlt(active, productName)}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Pozostałe zdjęcia produktu">
          {images.map((image, index) => {
            const isActive = image.id === active.id;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(image.id)}
                  aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
                  aria-pressed={isActive}
                  className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-smoke transition ${
                    isActive ? 'border-brand' : 'border-transparent hover:border-black/30'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={imageAlt(image, `${productName} - zdjęcie ${index + 1}`)}
                    fill
                    sizes="(min-width: 768px) 10vw, 20vw"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
