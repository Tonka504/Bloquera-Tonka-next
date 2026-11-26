import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Tipografía moderna y redondeada para el estilo de vidrio:
// Manrope (lectura) + Plus Jakarta Sans (títulos y cifras).
const cuerpo = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const titulos = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
      <body className={`${cuerpo.variable} ${titulos.variable} ${cuerpo.className}`}>
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
