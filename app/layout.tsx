import type { Metadata } from "next";
import { CatalogProvider } from "./components/catalog-context";
import { CartProvider } from "./components/cart-context";
import { SiteChrome } from "./components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form & Function — Feel good. For real.",
  description:
    "Thoughtful supplements for the everyday you. Clean ingredients, clear purpose, and nothing you don't need.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        <CatalogProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
