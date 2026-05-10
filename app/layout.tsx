import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mojepict - Free Web Tools",
    template: "%s · Mojepict",
  },
  description:
    "A collection of free, browser-only web tools. Image converters, unit tools, and more — no uploads, no accounts.",
  metadataBase: new URL("https://mojepict.vercel.app"),
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
