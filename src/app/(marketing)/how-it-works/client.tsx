"use client";

import {
  ListChecks,
  ClipboardList,
  Wallet,
  Rocket,
  Brain,
  Workflow,
  QrCode,
  LayoutDashboard,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  Reveal,
  PageHero,
  SectionHeading,
  CTABanner,
} from "@/components/marketing/Shared";

function Timeline() {
  const t = useT({
    ar: {
      badge: "الخطوات",
      title: "رحلتك من أول كليك لأول رد ذكي",
      steps: [
        {
          icon: ListChecks,
          h: "١ — اختار باقتك",
          p: "قارن بين ستارتر وبيزنس وإنتربرايز في صفحة الأسعار. كل باقة مكتوب فيها بالظبط عدد الرسائل والمميزات والسعر بالجنيه — مفيش «اتصل بنا لمعرفة السعر».",
          extra: "محتار؟ احجز ديمو مجاني وهنرشحلك الباقة المناسبة لحجم نشاطك.",
        },
        {
          icon: ClipboardList,
          h: "٢ — املا فورم الأونبوردنج",
          p: "فورم واحد بسيط بتدّينا فيه روح نشاطك: الاسم، المجال، المنيو أو قائمة الخدمات بالأسعار، مواعيد الشغل، سياسة التوصيل أو الحجز، وأكتر الأسئلة اللي عملاءك بيسألوها.",
          extra: "كل ما البيانات أدق، كل ما البوت بقى أشطر — دي المادة اللي بنبني بيها قاعدة معرفته.",
        },
        {
          icon: Wallet,
          h: "٣ — ادفع وارفع الإثبات",
          p: "حوّل رسوم التأسيس + أول شهر على إنستاباي أو فودافون كاش أو وي باي، وارفع سكرين شوت التحويل في نفس الصفحة. فريقنا بيراجع ويأكّد الدفع بسرعة.",
          extra: "كل المبالغ بالجنيه المصري، ومفيش أي رسوم مخفية.",
        },
        {
          icon: Rocket,
          h: "٤ — البوت يشتغل في دقايق",
          p: "بمجرد تأكيد الدفع، نظام التجهيز الأوتوماتيكي بيبني وكيلك الخاص، يحمّله معرفة نشاطك، ويوصّله برقم واتساب البيزنس بتاعك. هتستلم بيانات دخول لوحة التحكم على طول.",
          extra: "من اللحظة دي، أي رسالة على واتساب نشاطك بيرد عليها موظفك الجديد.",
        },
      ],
    },
    en: {
      badge: "The steps",
      title: "Your journey from first click to first smart reply",
      steps: [
        {
          icon: ListChecks,
          h: "1 — Choose your plan",
          p: "Compare Starter, Business, and Enterprise on the pricing page. Every plan states exactly how many messages, which features, and the price in EGP — no “contact us for pricing”.",
          extra: "Not sure? Book a free demo and we'll recommend the right plan for your volume.",
        },
        {
          icon: ClipboardList,
          h: "2 — Fill the onboarding form",
          p: "One simple form where you give us the soul of your business: name, industry, menu or service list with prices, working hours, delivery or booking policy, and your customers' most common questions.",
          extra: "The more accurate the data, the smarter the bot — this is the material we build its knowledge base from.",
        },
        {
          icon: Wallet,
          h: "3 — Pay & upload proof",
          p: "Transfer the setup fee + first month via InstaPay, Vodafone Cash, or WE Pay, then upload a screenshot of the transfer on the same page. Our team reviews and confirms quickly.",
          extra: "All amounts in Egyptian pounds, with zero hidden fees.",
        },
        {
          icon: Rocket,
          h: "4 — Your bot goes live in minutes",
          p: "Once payment is confirmed, our automated provisioning builds your private agent, loads it with your business knowledge, and connects it to your business WhatsApp number. You receive dashboard credentials right away.",
          extra: "From that moment, every message to your WhatsApp gets answered by your new employee.",
        },
      ],
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <SectionHeading badge={t.badge} title={t.title} />
      <div className="relative mt-14 max-w-3xl mx-auto">
        <div
          className="absolute top-0 bottom-0 start-6 w-px bg-gradient-to-b from-brand-teal via-brand-sky to-transparent hidden sm:block"
          aria-hidden
        />
        <ol className="space-y-8">
          {t.steps.map((s, i) => (
            <li key={s.h}>
              <Reveal delay={i * 0.08}>
                <div className="flex gap-5">
                  <span className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky text-white items-center justify-center shrink-0 relative z-10 shadow-[0_8px_24px_rgba(42,96,114,0.4)]">
                    <s.icon className="w-5 h-5" aria-hidden />
                  </span>
                  <div className="card card-hover p-6 flex-1">
                    <h3 className="font-extrabold text-lg flex items-center gap-2.5">
                      <s.icon className="w-5 h-5 text-accent sm:hidden" aria-hidden />
                      {s.h}
                    </h3>
                    <p className="text-muted text-sm mt-3 leading-relaxed">{s.p}</p>
                    <p className="text-accent text-xs mt-3 font-semibold">{s.extra}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BehindTheScenes() {
  const t = useT({
    ar: {
      badge: "خلف الكواليس",
      title: "إيه اللي بيحصل لما نقول «بنجهّز البوت»؟",
      sub: "مش سحر — هندسة. دي المراحل اللي بتحصل أوتوماتيكياً في الدقايق اللي بعد تأكيد دفعك:",
      items: [
        {
          icon: Brain,
          h: "بناء قاعدة المعرفة الخاصة بيك",
          p: "بناخد بيانات الأونبوردنج — المنيو، الأسعار، السياسات — ونحوّلها لقاعدة معرفة خاصة بنشاطك لوحده. وكيلك مش بيشارك معلوماته مع أي بيزنس تاني.",
        },
        {
          icon: Workflow,
          h: "تشغيل محرك الأتمتة",
          p: "بننشئ لنشاطك مسار أتمتة خاص على محرك n8n: استقبال الرسالة → فهمها بالذكاء الاصطناعي → الرد أو تسجيل الطلب أو التحويل لبشري. كل بيزنس له مساره المستقل.",
        },
        {
          icon: QrCode,
          h: "ربط واتساب نشاطك",
          p: "بنوصّل الوكيل برقم واتساب البيزنس بتاعك بخطوة مسح QR بسيطة بنمشي معاك فيها. رقمك يفضل رقمك — إحنا بس بنضيف عليه العقل.",
        },
        {
          icon: LayoutDashboard,
          h: "تسليم لوحة التحكم",
          p: "بتستلم داشبورد خاص بيك تشوف فيه المحادثات والطلبات والإحصائيات لحظة بلحظة، وتقدر تعدّل معلومات البوت في أي وقت.",
        },
      ],
    },
    en: {
      badge: "Behind the scenes",
      title: "What actually happens when we say “provisioning your bot”?",
      sub: "Not magic — engineering. These stages run automatically in the minutes after your payment is confirmed:",
      items: [
        {
          icon: Brain,
          h: "Building your private knowledge base",
          p: "We take your onboarding data — menu, prices, policies — and turn it into a knowledge base for your business alone. Your agent never shares its knowledge with any other business.",
        },
        {
          icon: Workflow,
          h: "Spinning up the automation engine",
          p: "We create a dedicated automation flow on our n8n engine: receive message → understand it with AI → reply, log the order, or escalate to a human. Every business gets its own isolated flow.",
        },
        {
          icon: QrCode,
          h: "Connecting your WhatsApp",
          p: "We link the agent to your business WhatsApp number with a simple QR scan we walk you through. Your number stays your number — we just add the brain.",
        },
        {
          icon: LayoutDashboard,
          h: "Handing over your dashboard",
          p: "You receive your own dashboard with live conversations, orders, and stats — and you can update the bot's knowledge anytime.",
        },
      ],
    },
  });

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-brand-teal -top-20 -end-32" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
        <div className="grid sm:grid-cols-2 gap-5 mt-12 max-w-4xl mx-auto">
          {t.items.map((it, i) => (
            <Reveal key={it.h} delay={i * 0.08}>
              <div className="card card-hover p-6 h-full">
                <span className="w-11 h-11 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center mb-4">
                  <it.icon className="w-5 h-5" aria-hidden />
                </span>
                <h3 className="font-bold text-lg">{it.h}</h3>
                <p className="text-muted text-sm mt-2 leading-relaxed">{it.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HowItWorksClient() {
  const t = useT({
    ar: {
      badge: "كيف يعمل",
      title: "من الدفع لأول رد ذكي — في دقايق",
      sub: "صمّمنا العملية كلها عشان تكون أسرع من طلب أوردر دليفري. أربع خطوات واضحة، وكل حاجة بعدها أوتوماتيك.",
    },
    en: {
      badge: "How it works",
      title: "From payment to first smart reply — in minutes",
      sub: "We designed the whole process to be faster than ordering delivery. Four clear steps, and everything after them is automatic.",
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <Timeline />
      <div className="section-divider max-w-7xl mx-auto" />
      <BehindTheScenes />
      <CTABanner />
    </>
  );
}
