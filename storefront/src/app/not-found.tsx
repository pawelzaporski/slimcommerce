import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-x py-20 text-center">
      <p className="display text-8xl text-brand">404</p>
      <h1 className="display mt-2 text-3xl">Nie znaleźliśmy tej strony</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        Produkt mógł zostać wycofany, a kategoria zmienić nazwę. Sprawdź ofertę albo użyj wyszukiwarki.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-brand">
          Strona główna
        </Link>
        <Link href="/produkty" className="btn btn-outline">
          Produkty
        </Link>
      </div>
    </div>
  );
}
