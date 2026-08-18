"use client";

import { useI18n } from "@/lib/i18n/context";
import { InfoPage } from "@/components/layout/InfoPage";
import { privacyContent } from "@/lib/content/privacy";

export default function PrivacyPage() {
  const { locale } = useI18n();
  return <InfoPage {...privacyContent[locale]} />;
}
