import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import { ContentWidthProvider } from "@/components/layout/ContentWidth";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPaletteLoader } from "@/components/layout/CommandPaletteLoader";
import { PwaRegister } from "@/components/layout/InstallPwaButton";
import { ToolAbout } from "@/components/tools/ToolAbout";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  getOrganizationJsonLd,
  getWebsiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Free Web Tools`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "free online tools",
    "web tools",
    "image converter",
    "image compressor",
    "unit converter",
    "qr code generator",
    "background remover",
    "ai background removal",
    SITE_NAME,
  ],
  metadataBase: new URL(SITE_URL),
  verification: {
    google: "fvXDeFrH7oYYPdVM9Ry106WpY1edT4s5D0ZfuljevJo",
  },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Free Web Tools`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Free Web Tools`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Free Web Tools`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <JsonLd data={getWebsiteJsonLd()} />
        <JsonLd data={getOrganizationJsonLd()} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <div className="flex h-screen overflow-hidden bg-background">
              <div className="hidden lg:block">
                <Sidebar />
              </div>

              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Navbar />

                <main id="main" tabIndex={-1} className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
                  <ContentWidthProvider>
                    {children}
                    <ToolAbout />
                  </ContentWidthProvider>
                </main>
              </div>
            </div>

            <CommandPaletteLoader />
            <PwaRegister />
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
