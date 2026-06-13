"use client";

import { Hammer, RefreshCcw, Wallet } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { PLANS, PAYMENT_ACCOUNTS } from "@/lib/plans";
import {
  Reveal,
  PageHero,
  SectionHeading,
  Accordion,
  PlanCard,
  CTABanner,
} from "@/components/marketing/Shared";

function FeesExplainer() {
  const t = useT({
    ar: {
      badge: "إزاي بتدفع",
      title: "رسوم تأسيس مرة واحدة + اشتراك شهري — وخلاص",
      setupH: "رسوم التأسيس (مرة واحدة)",
      setupP: "دي تكلفة بناء وكيلك الخاص: تجهيز قاعدة المعرفة من بيانات نشاطك، إنشاء مسار الأتمتة الخاص بيك، ربط الواتساب، وتسليمك لوحة التحكم. بتتدفع مرة واحدة بس عند الاشتراك.",
      monthlyH: "الاشتراك الشهري",
      monthlyP: "ده مقابل تشغيل البوت: رسائل الذكاء الاصطناعي حسب حد باقتك، استضافة وكيلك ومحرك الأتمتة، والدعم الفني. تقدر تلغي في أي وقت من غير أي غرامات.",
    },
    en: {
      badge: "How you pay",
      title: "One setup fee + a monthly subscription — that's it",
      setupH: "Setup fee (one time)",
      setupP: "This covers building your private agent: preparing the knowledge base from your business data, creating your dedicated automation flow, connecting WhatsApp, and handing over your dashboard. Paid once at subscription.",
      monthlyH: "Monthly subscription",
      monthlyP: "This keeps the bot running: AI messages up to your plan's limit, hosting for your agent and automation engine, and technical support. Cancel anytime with no penalties.",
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <SectionHeading badge={t.badge} title={t.title} />
      <div className="grid sm:grid-cols-2 gap-5 mt-10 max-w-4xl mx-auto">
        <Reveal>
          <div className="card card-hover p-7 h-full">
            <span className="w-11 h-11 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center mb-4">
              <Hammer className="w-5 h-5" aria-hidden />
            </span>
            <h3 className="font-bold text-lg">{t.setupH}</h3>
            <p className="text-muted text-sm mt-2 leading-relaxed">{t.setupP}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card card-hover p-7 h-full">
            <span className="w-11 h-11 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center mb-4">
              <RefreshCcw className="w-5 h-5" aria-hidden />
            </span>
            <h3 className="font-bold text-lg">{t.monthlyH}</h3>
            <p className="text-muted text-sm mt-2 leading-relaxed">{t.monthlyP}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PaymentMethods() {
  const { pick } = useLang();
  const t = useT({
    ar: {
      title: "طرق الدفع المتاحة",
      sub: "حوّل، صوّر إيصال التحويل، وارفعه — وفريقنا يأكّد بسرعة.",
    },
    en: {
      title: "Available payment methods",
      sub: "Transfer, screenshot the receipt, upload it — our team confirms quickly.",
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
      <Reveal>
        <div className="glass p-8 text-center">
          <h2 className="font-extrabold text-xl flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5 text-accent" aria-hidden /> {t.title}
          </h2>
          <p className="text-muted text-sm mt-2">{t.sub}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {Object.entries(PAYMENT_ACCOUNTS).map(([key, acc]) => (
              <div key={key} className="glass-strong px-6 py-4 rounded-xl min-w-44">
                <p className="font-bold">{pick(acc.label)}</p>
                <p className="text-accent text-sm mt-1 font-mono" dir="ltr">
                  {acc.number}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function PricingFaq() {
  const t = useT({
    ar: {
      badge: "أسئلة الأسعار",
      title: "أسئلة شائعة عن الدفع والباقات",
      items: [
        {
          q: "لو خلّصت رسائل باقتي قبل نهاية الشهر؟",
          a: "هنبعتلك تنبيه قبل ما توصل للحد بوقت كافي، وتقدر تترقى لباقة أعلى في أي لحظة — الترقية بتتحسب بفرق السعر بس من غير رسوم تأسيس جديدة.",
        },
        {
          q: "هل أقدر أغيّر الباقة بعدين؟",
          a: "أيوه، تقدر تترقى أو تنزل لباقة تانية من أول الشهر اللي بعده. رسوم التأسيس بتتدفع مرة واحدة بس مهما غيّرت الباقات.",
        },
        {
          q: "إيه سياسة الاسترداد؟",
          a: "رسوم التأسيس غير قابلة للاسترداد بعد ما يتم تجهيز وكيلك وتشغيله، لأنها مقابل شغل بيتنفذ فعلاً. الاشتراك الشهري تقدر تلغيه في أي وقت ومش هيتجدد الشهر اللي بعده.",
        },
        {
          q: "هل في رسوم مخفية أو تكلفة بالدولار؟",
          a: "لأ. كل التكاليف معلنة بالجنيه المصري في الصفحة دي: رسوم التأسيس والاشتراك الشهري. مفيش رسوم لكل رسالة، ومفيش مفاجآت بسعر صرف.",
        },
      ],
    },
    en: {
      badge: "Pricing FAQ",
      title: "Common questions about payment and plans",
      items: [
        {
          q: "What if I use up my plan's messages before the month ends?",
          a: "We notify you well before you hit the limit, and you can upgrade to a higher plan at any moment — upgrades are charged as the price difference only, with no new setup fee.",
        },
        {
          q: "Can I change my plan later?",
          a: "Yes, you can upgrade or downgrade starting from the next month. The setup fee is paid only once, no matter how many times you switch plans.",
        },
        {
          q: "What is the refund policy?",
          a: "The setup fee is non-refundable once your agent has been provisioned and activated, since it pays for work that's actually performed. The monthly subscription can be cancelled anytime and simply won't renew next month.",
        },
        {
          q: "Are there hidden fees or dollar-based costs?",
          a: "No. All costs are published in Egyptian pounds on this page: the setup fee and the monthly subscription. No per-message fees, and no exchange-rate surprises.",
        },
      ],
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <SectionHeading badge={t.badge} title={t.title} />
      <Reveal className="max-w-3xl mx-auto mt-10">
        <Accordion items={t.items} idPrefix="pricing-faq" />
      </Reveal>
    </section>
  );
}

export default function PricingClient() {
  const t = useT({
    ar: {
      badge: "الأسعار",
      title: "باقة لكل حجم بيزنس — وكلها بالجنيه",
      sub: "اختار الباقة، ادفع رسوم التأسيس + أول شهر، وبوتك يشتغل في دقايق. تقدر تلغي الاشتراك الشهري في أي وقت.",
    },
    en: {
      badge: "Pricing",
      title: "A plan for every business size — all in EGP",
      sub: "Pick a plan, pay the setup fee + first month, and your bot is live in minutes. Cancel the monthly subscription anytime.",
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid lg:grid-cols-3 gap-6 items-stretch pt-4">
          {PLANS.map((p, i) => (
            <PlanCard key={p.id} plan={p} delay={i * 0.1} detailed />
          ))}
        </div>
      </section>
      <FeesExplainer />
      <PaymentMethods />
      <PricingFaq />
      <CTABanner />
    </>
  );
}
