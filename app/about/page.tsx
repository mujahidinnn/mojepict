"use client";

import { useI18n } from "@/lib/i18n/context";
import { InfoPage } from "@/components/layout/InfoPage";
import { aboutContent } from "@/lib/content/about";

export default function AboutPage() {
  const { locale } = useI18n();
  return <InfoPage {...aboutContent[locale]} />;
}
