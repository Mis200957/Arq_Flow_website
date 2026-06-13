import type { Metadata } from "next";
import PrivacyClient from "./client";

export const metadata: Metadata = {
  title: "سياسة الخصوصية · Privacy Policy",
  description:
    "سياسة خصوصية ArqFlow: البيانات التي نجمعها، التخزين على Supabase، التعامل مع بيانات واتساب، وحقوقك.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
