import type { Metadata } from "next";
import HowItWorksClient from "./client";

export const metadata: Metadata = {
  title: "كيف يعمل · How it Works",
  description:
    "من اختيار الباقة لتشغيل البوت في دقائق: خطوات الاشتراك في ArqFlow وما يحدث خلف الكواليس عند تجهيز وكيلك الخاص.",
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
