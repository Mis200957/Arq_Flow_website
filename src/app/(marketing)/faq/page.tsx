import type { Metadata } from "next";
import FaqClient from "./client";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة · FAQ",
  description:
    "إجابات عن كل أسئلتك حول ArqFlow: عام، الإعداد، الفواتير والدفع، والأسئلة التقنية.",
};

export default function FaqPage() {
  return <FaqClient />;
}
