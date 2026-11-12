import type { Metadata } from "next";
import { CatalogProvider } from "./components/catalog-context";
import { CartProvider } from "./components/cart-context";
import { SiteChrome } from "./components/site-chrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "VitaHub UG | Shop Vitamins, Supplements & Wellness Products in Uganda",
  description:
    "Discover vitamins, nutritional supplements, minerals, protein and wellness products at VitaHub UG. Shop online in Uganda and support your everyday wellness journey.",
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
