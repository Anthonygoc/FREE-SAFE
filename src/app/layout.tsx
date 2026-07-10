import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FREE SAFE — Plataforma de Qualidade e Conformidade",
  description: "Treinamento, qualidade e conformidade para postos da Rede Free",
  metadataBase: new URL("https://postos-free-safe.com.br"),
  applicationName: "FREE SAFE",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "FREE SAFE — Plataforma de Qualidade e Conformidade",
    description: "Treinamento, qualidade e conformidade para postos da Rede Free",
    url: "https://postos-free-safe.com.br",
    siteName: "FREE SAFE",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
