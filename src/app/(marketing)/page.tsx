import type { Metadata } from "next";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "ArqFlow — موظف ذكاء اصطناعي على واتساب | AI WhatsApp Employee",
  description:
    "موظف ذكاء اصطناعي يرد على عملاءك على واتساب ٢٤ ساعة — ياخد طلبات، يحجز مواعيد، ويتكلم مصري. ArqFlow: AI WhatsApp agents for Egyptian businesses.",
};

export default function HomePage() {
  return <HomeClient />;
}
