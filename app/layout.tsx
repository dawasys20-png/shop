import type { Metadata } from "next";
import { CatalogProvider } from "./components/catalog-context";
import { CartProvider } from "./components/cart-context";
import { SiteChrome } from "./components/site-chrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "VitaHub UG | Vitamins, Supplements & Wellness Products in Uganda",
    template: "%s | VitaHub UG",
  },
  description:
    "Shop quality vitamins, dietary supplements, minerals, protein and wellness products at VitaHub UG. Discover products to support your everyday health and wellness, with convenient online shopping in Uganda.",
  applicationName: "VitaHub UG",
  keywords: [
    "VitaHub UG",
    "supplements in Uganda",
    "buy vitamins in Uganda",
    "vitamins and minerals",
    "protein supplements Uganda",
    "health and wellness products",
    "nutritional supplements",
    "dietary supplements Uganda",
    "online supplement shop Uganda",
  ],
  openGraph: {
    type: "website",
    locale: "en_UG",
    siteName: "VitaHub UG",
    title: "VitaHub UG | Grow Well, Together",
    description:
      "Explore vitamins, supplements, minerals, protein and wellness products. Shop online with VitaHub UG.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "VitaHub UG – Vitamins, Supplements & Wellness Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaHub UG | Grow Well, Together",
    description:
      "Shop vitamins, supplements and wellness products online in Uganda with VitaHub UG.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "2-LqgwcdbT-_UT8b-a13eyvWTU-NtiTw-EFxOlcsTT8",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <CatalogProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
