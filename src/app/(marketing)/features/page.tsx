import type { Metadata } from "next";
import FeaturesClient from "./client";

export const metadata: Metadata = {
  title: "المميزات · Features",
  description:
    "ردود فورية، استقبال طلبات وحجوزات، فهم الرسائل الصوتية بالمصري، تحويل ذكي للبشر، وتحليلات — مميزات ArqFlow بالتفصيل.",
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
