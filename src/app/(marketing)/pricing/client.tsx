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
      title: "رسوم تأسيس مرة واحدة + رصيد محادثات — وخلاص",
      setupH: "رسوم التأسيس (مرة واحدة)",
      setupP: "دي تكلفة بناء وكيلك الخاص: تجهيز قاعدة المعرفة من بيانات نشاطك، إنشاء مسار الأتمتة الخاص بيك، ربط الواتساب، وتسليمك لوحة التحكم. بتتدفع مرة واحدة بس عند الاشتراك.",
      monthlyH: "رصيد المحادثات",
      monthlyP: "بتدفع قيمة الباقة فتتحول لرصيد ذكاء اصطناعي، والبوت بيرد من الرصيد ده لحد ما يخلص أو تعدّي ٣٠ يوم — أيهما أقرب. تقدر تجدد أو ترقّي في أي وقت، وأي رصيد متبقي بيتجمّع.",
    },
    en: {
      badge: "How you pay",
      title: "One setup fee + a conversation balance — that's it",
      setupH: "Setup fee (one time)",
      setupP: "This covers building your private agent: preparing the knowledge base from your business data, creating your dedicated automation flow, connecting WhatsApp, and handing over your dashboard. Paid once at subscription.",
      monthlyH: "Conversation balance",
      monthlyP: "You pay the package price, which becomes an AI credit balance. The bot replies from that balance until it runs out or 30 days pass — whichever comes first. Renew or upgrade anytime, and any leftover balance rolls over.",
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <SectionHeading badge={t.badge} title={t.title} />
      <div className="grid sm:grid-cols-2 gap-5 mt-10 max-w-4xl mx-auto">
        <Reveal>
          <div className="card card-hover p-6 sm:p-7 h-full">
            <span className="w-11 h-11 icon-chip mb-4">
              <Hammer className="w-5 h-5" aria-hidden />
            </span>
            <h3 className="font-bold text-lg">{t.setupH}</h3>
            <p className="text-muted text-sm mt-2 leading-relaxed">{t.setupP}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card card-hover p-6 sm:p-7 h-full">
            <span className="w-11 h-11 icon-chip mb-4">
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
        <div className="glass p-6 sm:p-8 text-center">
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
          q: "لو خلص رصيدي قبل آخر الـ٣٠ يوم؟",
          a: "هنبعتلك تنبيهات قبل ما الرصيد يخلص. والبوت بيقف يرد لما الرصيد يخلص أو تعدّي ٣٠ يوم. تقدر تجدد أو ترقّي في أي لحظة بنفس طريقة الدفع، والرصيد المتبقي بيتجمّع مع الجديد.",
        },
        {
          q: "هل أقدر أغيّر الباقة بعدين؟",
          a: "أيوه، تقدر تترقى أو تنزل لباقة تانية في أي وقت — بتدفع قيمة الباقة الجديدة بس، من غير رسوم تأسيس جديدة، وأي رصيد متبقي بيتضاف للرصيد الجديد.",
        },
        {
          q: "إيه سياسة الاسترداد؟",
          a: "رسوم التأسيس غير قابلة للاسترداد بعد ما يتم تجهيز وكيلك وتشغيله، لأنها مقابل شغل بيتنفذ فعلاً. رصيد المحادثات بيتستهلك بالاستخدام وصالح ٣٠ يوم من تاريخ الدفع.",
        },
        {
          q: "هل في رسوم مخفية أو تكلفة بالدولار؟",
          a: "لأ. بتدفع قيمة الباقة بالجنيه المصري وهي رصيدك، والبوت بيرد من الرصيد ده. مفيش رسوم مخفية ولا مفاجآت بسعر صرف.",
        },
      ],
    },
    en: {
      badge: "Pricing FAQ",
      title: "Common questions about payment and plans",
      items: [
        {
          q: "What if my balance runs out before the 30 days end?",
          a: "We notify you before the balance runs low. The bot stops replying once the balance is used up or 30 days pass. You can renew or upgrade anytime using the same payment flow, and any leftover balance rolls over.",
        },
        {
          q: "Can I change my plan later?",
          a: "Yes, you can upgrade or downgrade anytime — you only pay the new package price, with no new setup fee, and any leftover balance is added to the new one.",
        },
        {
          q: "What is the refund policy?",
          a: "The setup fee is non-refundable once your agent has been provisioned and activated, since it pays for work that's actually performed. The conversation balance is consumed by usage and is valid for 30 days from payment.",
        },
        {
          q: "Are there hidden fees or dollar-based costs?",
          a: "No. You pay the package price in EGP and that's your balance — the bot replies from it. No hidden fees and no exchange-rate surprises.",
        },
      ],
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
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
      sub: "اختار الباقة، ادفع رسوم التأسيس + رصيد الباقة، وبوتك يشتغل في دقايق. البوت بيرد من رصيدك (صالح ٣٠ يوم) وتقدر تجدد أو ترقّي في أي وقت.",
    },
    en: {
      badge: "Pricing",
      title: "A plan for every business size — all in EGP",
      sub: "Pick a plan, pay the setup fee + the package balance, and your bot is live in minutes. The bot replies from your balance (valid 30 days) — renew or upgrade anytime.",
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
