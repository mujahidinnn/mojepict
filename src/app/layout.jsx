import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "MOJEPICT",
  description:
    "MOJEPICT adalah kumpulan tools online gratis untuk edit gambar: kompres, ubah format, resize, crop, watermark, QR Code, dan lainnya.",
  icons: {
    icon: "/logo.ico",
    apple: "/logo.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
