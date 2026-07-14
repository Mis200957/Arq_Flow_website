import type { Metadata } from "next";
import BookDemoClient from "./client";

export const metadata: Metadata = {
  title: "احجز ديمو · Book a Demo",
  description:
    "احجز ديمو مجاني وشوف بعينك إزاي موظف ArqFlow الذكي هيرد على عملاء نشاطك على واتساب.",
};

export default function BookDemoPage() {
  return <BookDemoClient />;
}
