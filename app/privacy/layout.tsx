import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const title = `Privacy Policy · ${SITE_NAME}`;
const ogImage = { url: "/og-image.png", width: 1200, height: 630, alt: title };
const description =
  "How Mojepict handles your files and data: what runs entirely in your browser, what the optional AI-enhanced tools send to a cloud service, and what's stored locally.";

export const metadata: Metadata = {
  // Root title template appends "· Mojepict".
  title: "Privacy Policy",
  description,
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/privacy`,
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
