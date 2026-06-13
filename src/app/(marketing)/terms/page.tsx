import type { Metadata } from "next";
import TermsClient from "./client";

export const metadata: Metadata = {
  title: "الشروط والأحكام · Terms of Service",
  description:
    "شروط استخدام ArqFlow: الاشتراك والدفع، سياسة الاسترداد، حدود الاستخدام، والمسؤوليات.",
};

export default function TermsPage() {
  return <TermsClient />;
}
