import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProductProvider } from "./context/ProductProvider";
import { ThemeRegistry } from "./theme/useThemeContext.hook";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MercadoLibre Productos",
  description: "Explorador de productos populares de MercadoLibre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeRegistry>
          <ProductProvider>{children}</ProductProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
