import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-black/10 px-4 py-6 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
          © {new Date().getFullYear()} {SITE_NAME}
        </footer>
      </body>
    </html>
  );
}
