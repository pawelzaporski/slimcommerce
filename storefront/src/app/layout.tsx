import type { Metadata } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getCategoriesSafe } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Krój treści (czytelny, humanistyczny bezszeryf) + kondensowany krój
// nagłówków wersalikami - typografia typowa dla drogerii/beauty e-commerce.
const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
});

const displayFont = Oswald({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — sklep internetowy`,
    template: `%s — ${SITE_NAME}`,
  },
  description: "Sklep internetowy slimCommerce — przeglądaj produkty, dodawaj do koszyka i zamawiaj online.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pl_PL",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategoriesSafe();

  return (
    <html lang="pl" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} />
      </body>
    </html>
  );
}
