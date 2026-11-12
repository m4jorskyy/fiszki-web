import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/context/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIHAOWU",
  description:
    "Osobista kartoteka fiszek z algorytmem SM-2 i skanowaniem zdjęć przez Gemini AI.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NIHAOWU",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCEBF4" },
    { media: "(prefers-color-scheme: dark)", color: "#09060E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[var(--accent-cobalt)] selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
