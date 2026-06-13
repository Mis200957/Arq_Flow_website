import type { Metadata } from "next";
import TestimonialsClient from "./client";

export const metadata: Metadata = {
  title: "آراء العملاء · Testimonials",
  description:
    "قصص نجاح أصحاب البيزنس مع ArqFlow: مطاعم، عيادات، جيمات، محلات، عقارات وفنادق — بأرقام ونتائج حقيقية.",
};

export default function TestimonialsPage() {
  return <TestimonialsClient />;
}
