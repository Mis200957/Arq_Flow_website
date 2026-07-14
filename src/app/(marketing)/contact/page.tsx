import type { Metadata } from "next";
import ContactClient from "./client";

export const metadata: Metadata = {
  title: "تواصل معنا · Contact",
  description:
    "كلم فريق ArqFlow على واتساب أو بالإيميل hello@arqflow.app — أو ابعت رسالتك من فورم التواصل.",
};

export default function ContactPage() {
  return <ContactClient />;
}
