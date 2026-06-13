"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, Mail, Send, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SUPPORT_WHATSAPP } from "@/lib/plans";
import { Reveal, PageHero } from "@/components/marketing/Shared";

export default function ContactClient() {
  const t = useT({
    ar: {
      badge: "تواصل معنا",
      title: "إحنا هنا — وبنرد بسرعة",
      sub: "سؤال عن الباقات؟ محتاج مساعدة؟ عندك فكرة؟ كلمنا بالطريقة اللي تريحك.",
      waTitle: "واتساب",
      waDesc: "أسرع طريقة توصلنا — بنرد عادة خلال دقايق في مواعيد العمل.",
      waBtn: "افتح المحادثة",
      mailTitle: "الإيميل",
      mailDesc: "للاستفسارات التفصيلية والشراكات — بنرد خلال يوم عمل.",
      hours: "مواعيد الرد: يومياً من ١٠ صباحاً لـ ١٠ مساءً بتوقيت القاهرة",
      formTitle: "أو ابعتلنا رسالة من هنا",
      formDesc: "املا الفورم وهنفتحلك واتساب برسالتك جاهزة — تدوس إرسال وبس.",
      name: "الاسم",
      namePh: "اسمك الكريم",
      email: "الإيميل",
      emailPh: "you@example.com",
      message: "رسالتك",
      messagePh: "اكتب سؤالك أو طلبك هنا...",
      submit: "إرسال عبر واتساب",
      waMessage: (n: string, e: string, m: string) =>
        `مرحباً فريق ArqFlow 👋\n\nالاسم: ${n}\nالإيميل: ${e}\n\nالرسالة:\n${m}`,
    },
    en: {
      badge: "Contact",
      title: "We're here — and we reply fast",
      sub: "Question about plans? Need help? Have an idea? Reach us whichever way suits you.",
      waTitle: "WhatsApp",
      waDesc: "The fastest way to reach us — we usually reply within minutes during working hours.",
      waBtn: "Open chat",
      mailTitle: "Email",
      mailDesc: "For detailed inquiries and partnerships — we reply within one business day.",
      hours: "Reply hours: daily 10 AM – 10 PM Cairo time",
      formTitle: "Or send us a message from here",
      formDesc: "Fill the form and we'll open WhatsApp with your message ready — just hit send.",
      name: "Name",
      namePh: "Your name",
      email: "Email",
      emailPh: "you@example.com",
      message: "Your message",
      messagePh: "Write your question or request here...",
      submit: "Send via WhatsApp",
      waMessage: (n: string, e: string, m: string) =>
        `Hello ArqFlow team 👋\n\nName: ${n}\nEmail: ${e}\n\nMessage:\n${m}`,
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(t.waMessage(name.trim(), email.trim(), message.trim()));
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* contact cards */}
          <div className="lg:col-span-2 space-y-5">
            <Reveal>
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-hover p-7 block"
              >
                <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky text-white flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6" aria-hidden />
                </span>
                <h2 className="font-extrabold text-lg">{t.waTitle}</h2>
                <p className="text-muted text-sm mt-2 leading-relaxed">{t.waDesc}</p>
                <p className="text-accent font-mono text-sm mt-3" dir="ltr">
                  +20 102 916 8056
                </p>
                <span className="btn-outline !py-2 text-sm mt-4 inline-flex">{t.waBtn}</span>
              </a>
            </Reveal>
            <Reveal delay={0.1}>
              <a href="mailto:hello@arqflow.app" className="card card-hover p-7 block">
                <span className="w-12 h-12 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" aria-hidden />
                </span>
                <h2 className="font-extrabold text-lg">{t.mailTitle}</h2>
                <p className="text-muted text-sm mt-2 leading-relaxed">{t.mailDesc}</p>
                <p className="text-accent font-mono text-sm mt-3" dir="ltr">
                  hello@arqflow.app
                </p>
              </a>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="glass p-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent shrink-0" aria-hidden />
                <p className="text-muted text-xs leading-relaxed">{t.hours}</p>
              </div>
            </Reveal>
          </div>

          {/* form */}
          <Reveal delay={0.1} className="lg:col-span-3">
            <form onSubmit={onSubmit} className="glass-strong p-7 sm:p-9">
              <h2 className="font-extrabold text-xl">{t.formTitle}</h2>
              <p className="text-muted text-sm mt-2">{t.formDesc}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">{t.name}</span>
                  <input
                    className="input-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePh}
                    required
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">{t.email}</span>
                  <input
                    className="input-base"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPh}
                    required
                    autoComplete="email"
                    dir="ltr"
                  />
                </label>
              </div>
              <label className="block mt-4">
                <span className="block text-sm font-semibold mb-1.5">{t.message}</span>
                <textarea
                  className="input-base min-h-36 resize-y"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePh}
                  required
                />
              </label>
              <button type="submit" className="btn-primary w-full mt-6">
                <Send className="w-4 h-4" aria-hidden />
                {t.submit}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
