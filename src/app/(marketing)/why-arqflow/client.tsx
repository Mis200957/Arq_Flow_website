"use client";

import {
  Gauge,
  MessagesSquare,
  Workflow,
  Brain,
  BadgeDollarSign,
  Users,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { Reveal, PageHero, CTABanner } from "@/components/marketing/Shared";

export default function WhyArqflowClient() {
  const t = useT({
    ar: {
      badge: "ليه ArqFlow",
      title: "في بوتات كتير. في ArqFlow واحد.",
      sub: "اتبنى من الأول للسوق المصري: لهجته، طرق دفعه، وطريقة عملائه في الكلام على واتساب.",
      items: [
        {
          icon: Gauge,
          h: "سرعة بتكسب البيعة",
          p: "متوسط الرد أقل من ٥ ثواني، ٢٤ ساعة في اليوم. العميل اللي بيسأل وانت نايم بيشتري قبل ما تصحى — بدل ما يروح للمنافس.",
        },
        {
          icon: MessagesSquare,
          h: "إتقان اللهجة المصرية",
          p: "مش ترجمة آلية ولا فصحى متكلفة. الوكيل بيفهم «عايز» و«بكام» و«هاتلي» والفويسات الطويلة، وبيرد بطريقة طبيعية تحس إنها من البلد.",
        },
        {
          icon: Workflow,
          h: "أتمتة حقيقية بمحرك n8n",
          p: "مش مجرد ردود — مسارات أتمتة كاملة على محرك n8n: تسجيل الطلب، تأكيد الحجز، إشعار فريقك، تحديث الداشبورد. شغل بيخلص لوحده فعلاً.",
        },
        {
          icon: Brain,
          h: "ذكاء اصطناعي خاص بنشاطك",
          p: "كل بيزنس عنده وكيل مستقل بقاعدة معرفة خاصة: منيوهاتك، أسعارك، سياساتك. معلوماتك ليك لوحدك ومش بتتخلط مع أي عميل تاني.",
        },
        {
          icon: BadgeDollarSign,
          h: "أسعار شفافة بالجنيه",
          p: "كل الأرقام معلنة بالجنيه المصري: رسوم تأسيس واضحة واشتراك شهري ثابت. مفيش دولار متغير، مفيش رسوم مخفية، مفيش «اتصل بنا».",
        },
        {
          icon: Users,
          h: "البشر موجودين وقت ما تحتاجهم",
          p: "الذكاء الاصطناعي بيتعامل مع ٩٠٪ من الرسائل، ولما الموضوع يحتاج بني آدم — شكوى حساسة أو طلب خاص — بيحوّل لفريقك فوراً مع ملخص كامل.",
        },
      ],
    },
    en: {
      badge: "Why ArqFlow",
      title: "There are many bots. There is one ArqFlow.",
      sub: "Built from day one for the Egyptian market: its dialect, its payment methods, and the way its customers actually talk on WhatsApp.",
      items: [
        {
          icon: Gauge,
          h: "Speed that wins the sale",
          p: "Average reply under 5 seconds, 24 hours a day. The customer who asks while you sleep buys before you wake up — instead of going to your competitor.",
        },
        {
          icon: MessagesSquare,
          h: "Egyptian dialect mastery",
          p: "Not machine translation, not stiff formal Arabic. The agent understands “3ayez”, “bekam”, “hatly”, and long voice notes — and replies so naturally it feels local.",
        },
        {
          icon: Workflow,
          h: "Real automation on an n8n engine",
          p: "Not just replies — complete automation flows on our n8n engine: log the order, confirm the booking, notify your team, update the dashboard. Work that genuinely finishes itself.",
        },
        {
          icon: Brain,
          h: "A private AI for your business",
          p: "Every business gets an independent agent with its own knowledge base: your menus, your prices, your policies. Your data is yours alone — never mixed with any other client.",
        },
        {
          icon: BadgeDollarSign,
          h: "Transparent pricing in EGP",
          p: "Every number is public, in Egyptian pounds: a clear setup fee and a fixed monthly subscription. No fluctuating dollars, no hidden fees, no “contact sales”.",
        },
        {
          icon: Users,
          h: "Humans exactly when needed",
          p: "AI handles 90% of messages, and when something needs a human — a sensitive complaint or a special request — it escalates to your team instantly with a full summary.",
        },
      ],
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.items.map((it, i) => (
            <Reveal key={it.h} delay={i * 0.07}>
              <div className="card card-hover p-6 sm:p-7 h-full">
                <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky text-white flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(44,76,69,0.08)]">
                  <it.icon className="w-6 h-6" aria-hidden />
                </span>
                <h2 className="font-extrabold text-lg">{it.h}</h2>
                <p className="text-muted text-sm mt-3 leading-relaxed">{it.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <CTABanner />
    </>
  );
}
