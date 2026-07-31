import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
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
    "browser-based tools",
    "image converter",
    "image compressor",
    "unit converter",
    "qr code generator",
    "background remover",
    "no upload tools",
    SITE_NAME,
  ],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/mojepict-logo.png",
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
      { url: "/mojepict-logo.png", width: 253, height: 253, alt: SITE_NAME },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} - Free Web Tools`,
    description: SITE_DESCRIPTION,
    images: ["/mojepict-logo.png"],
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
            <div className="flex h-screen overflow-hidden bg-background">
              <div className="hidden lg:block">
                <Sidebar />
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar />

                <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-6xl">{children}</div>
                </main>
              </div>
            </div>

            <CommandPalette />
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
