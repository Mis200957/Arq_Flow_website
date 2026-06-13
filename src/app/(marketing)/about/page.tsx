import type { Metadata } from "next";
import AboutClient from "./client";

export const metadata: Metadata = {
  title: "من نحن · About",
  description:
    "قصة ArqFlow — من تأسيس محسن «رازور» حجاج، Al-Haggag Digital Systems. مهمتنا: كل بيزنس مصري يستاهل موظف ذكاء اصطناعي.",
};

export default function AboutPage() {
  return <AboutClient />;
}
