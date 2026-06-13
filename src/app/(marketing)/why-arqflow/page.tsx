import type { Metadata } from "next";
import WhyArqflowClient from "./client";

export const metadata: Metadata = {
  title: "ليه ArqFlow · Why ArqFlow",
  description:
    "سرعة فائقة، إتقان اللهجة المصرية، أتمتة حقيقية بمحرك n8n، ذكاء اصطناعي خاص لكل نشاط، أسعار شفافة بالجنيه، وتحويل بشري ذكي.",
};

export default function WhyArqflowPage() {
  return <WhyArqflowClient />;
}
