import type { NextConfig } from "next";

// Zdjęcia produktów serwuje backend z katalogu public/uploads/ - next/image
// optymalizuje tylko obrazy z jawnie dozwolonych hostów, więc dopuszczamy
// host API (ten sam, z którego czytamy api/storefront/*). Jeśli backend ma
// ustawione APP_URL na inny host (np. CDN), dopisz go tutaj.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080");

// Next 16 domyślnie odmawia optymalizacji obrazów z hostów rozwiązujących się
// na prywatne IP (ochrona przed SSRF). Lokalnie backend stoi na localhost,
// więc dla takiego API_URL to wyłączamy - produkcyjnie (publiczna domena API)
// flaga zostaje false.
const apiIsLocal =
  apiUrl.hostname === "localhost" ||
  apiUrl.hostname === "::1" ||
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiUrl.hostname);

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: apiIsLocal,
    remotePatterns: [
      {
        protocol: apiUrl.protocol === "https:" ? "https" : "http",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
