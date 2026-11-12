import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Tipografía industrial: Barlow (lectura) + Barlow Condensed (títulos y cifras),
// inspiradas en la rotulación de señalética y maquinaria.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Bloquera Tonka",
  description: "Sistema de Gestión Integral",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${barlow.variable} ${barlowCondensed.variable} ${barlow.className}`}>
        {children}
        <Toaster
          position="top-center"
          closeButton
          toastOptions={{ className: "toast-industrial" }}
        />
      </body>
    </html>
  );
}
