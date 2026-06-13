import type { Metadata } from "next";
import PricingClient from "./client";

export const metadata: Metadata = {
  title: "الأسعار · Pricing",
  description:
    "باقات ArqFlow بالجنيه المصري: ستارتر، بيزنس، إنتربرايز. رسوم تأسيس لمرة واحدة + اشتراك شهري. الدفع بإنستاباي وفودافون كاش ووي باي.",
};

export default function PricingPage() {
  return <PricingClient />;
}
