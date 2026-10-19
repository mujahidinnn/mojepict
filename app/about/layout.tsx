import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const title = `About · ${SITE_NAME}`;
const ogImage = { url: "/og-image.png", width: 1200, height: 630, alt: title };
const description =
  "Mojepict is a free, browser-based collection of image, PDF, unit, color, and text tools. Learn what it is, how it works, and why it's free.";

export const metadata: Metadata = {
  // Root title template appends "· Mojepict".
  title: "About",
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage.url],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
