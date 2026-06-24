"use client";

import {
  Target,
  Eye,
  Layers,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  LayoutTemplate,
  Brain,
  Gauge,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  Reveal,
  PageHero,
  SectionHeading,
  CTABanner,
} from "@/components/marketing/Shared";

function Story() {
  const t = useT({
    ar: {
      badge: "قصتنا",
      title: "بدأت من مشكلة بنشوفها كل يوم",
      p1: "ArqFlow بدأت بعد ملاحظة بسيطة: كتير من أصحاب المشاريع والعيادات والمطاعم بيضيع عليهم عملاء لأن مفيش وقت كفاية للرد على الرسائل والاستفسارات طول اليوم. المشكلة مش في الخدمة نفسها، لكن في متابعة العملاء بشكل مستمر.",
      p2: "الحلول الموجودة كانت غالباً معقدة أو مكلفة بالنسبة لمعظم المشاريع الصغيرة والمتوسطة، وكثير منها متصمم لأسواق مختلفة عن السوق المصري. وده خلّى الاستفادة منها أصعب مما المفروض تكون عليه.",
      p3: "عشان كده بنينا ArqFlow. منصة بتساعد الأنشطة التجارية على استخدام الذكاء الاصطناعي في التواصل مع العملاء والرد على الاستفسارات بشكل أسهل وأسرع، من غير تعقيد أو تكاليف مبالغ فيها.",
      mission: "مهمتنا",
      missionText: "كل بيزنس مصري يستاهل موظف ذكاء اصطناعي — مش بس الشركات الكبيرة اللي معاها ملايين.",
    },
    en: {
      badge: "The story",
      title: "Born from a simple observation",
      p1: "ArqFlow was founded by Mohsen “Razor” Haggag, founder of Al-Haggag Digital Systems, after a pattern he saw in almost every Egyptian business: the shop, clinic, or restaurant owner loses customers daily — not because the product is bad, but because nobody is free to answer WhatsApp.",
      p2: "The technology to solve this existed, but it was built in English, priced in dollars, and aimed at large enterprises. Nobody had built it for the Egyptian business: in its dialect, in its pound, around how it actually works.",
      p3: "So we built it ourselves. ArqFlow is a complete system that gives any Egyptian business — from a street-food cart to a private hospital — its own AI employee, installed in minutes, at a fair price in EGP.",
      mission: "Our mission",
      missionText: "Every Egyptian business deserves an AI employee — not just the corporations with millions to spend.",
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal>
          <span className="badge badge-accent mb-4">{t.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">{t.title}</h2>
          <div className="space-y-4 mt-5 text-muted leading-relaxed">
            <p>{t.p1}</p>
            <p>{t.p2}</p>
            <p>{t.p3}</p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="glass-strong relative overflow-hidden p-10 text-center">
            <div className="glow-orb w-56 h-56 bg-brand-teal -top-16 -end-16" aria-hidden />
            <div className="relative">
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-sky text-white flex items-center justify-center mx-auto mb-5">
                <Target className="w-7 h-7" aria-hidden />
              </span>
              <p className="badge badge-accent mb-3">{t.mission}</p>
              <p className="text-xl sm:text-2xl font-extrabold leading-relaxed gradient-text">
                {t.missionText}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Values() {
  const t = useT({
    ar: {
      badge: "قيمنا",
      title: "اللي بنشتغل بيه كل يوم",
      items: [
        { icon: Eye, h: "الوضوح قبل أي حاجة", p: "أسعار معلنة، خطوات واضحة، ووعود نقدر ننفذها. لو حاجة مش هتشتغل لنشاطك، هنقولك قبل ما تدفع." },
        { icon: HeartHandshake, h: "نجاح العميل = نجاحنا", p: "إحنا مش بنبيع اشتراكات — بنبني موظفين أذكياء. البوت اللي مش بيجيب نتيجة لصاحبه، فشل لينا إحنا." },
        { icon: Sparkles, h: "جودة بمستوى عالمي، بروح مصرية", p: "تصميم وهندسة بمعايير عالمية، لكن بلهجة وفهم وأسعار من السوق المصري نفسه." },
        { icon: ShieldCheck, h: "بياناتك أمانة", p: "بيانات نشاطك ومحادثات عملاءك ملك ليك. بنحميها، وعمرنا ما نبيعها أو نشاركها." },
      ],
    },
    en: {
      badge: "Our values",
      title: "What we work by, every day",
      items: [
        { icon: Eye, h: "Clarity above everything", p: "Published prices, clear steps, promises we can keep. If something won't work for your business, we'll tell you before you pay." },
        { icon: HeartHandshake, h: "Client success = our success", p: "We don't sell subscriptions — we build smart employees. A bot that doesn't deliver results for its owner is our failure." },
        { icon: Sparkles, h: "World-class quality, Egyptian soul", p: "Design and engineering at global standards, with a dialect, understanding, and pricing from the Egyptian market itself." },
        { icon: ShieldCheck, h: "Your data is a trust", p: "Your business data and your customers' conversations belong to you. We protect them and will never sell or share them." },
      ],
    },
  });

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-brand-sky -bottom-32 -start-32" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} />
        <div className="grid sm:grid-cols-2 gap-5 mt-12 max-w-4xl mx-auto">
          {t.items.map((it, i) => (
            <Reveal key={it.h} delay={i * 0.08}>
              <div className="card card-hover p-7 h-full">
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

function Framework() {
  const t = useT({
    ar: {
      badge: "إطار العمل",
      title: "إزاي بنبني كل حاجة في ArqFlow",
      sub: "أربع مراحل بنمرّر عليها كل منتج وكل صفحة وكل وكيل ذكاء اصطناعي بنبنيه:",
      steps: [
        { icon: Lightbulb, h: "Clarity — الوضوح", p: "نفهم المشكلة الحقيقية الأول: مين العميل، بيخسر فين، وإيه أبسط حل ينفع فعلاً." },
        { icon: LayoutTemplate, h: "Structure — البنية", p: "نبني نظام منظم وقابل للتوسع — مش حلول مرقّعة. كل وكيل له بنيته المستقلة والواضحة." },
        { icon: Brain, h: "User Psychology — نفسية المستخدم", p: "نصمّم للإنسان اللي هيستخدم: صاحب البيزنس المشغول والعميل اللي عايز إجابة دلوقتي." },
        { icon: Gauge, h: "Performance — الأداء", p: "نقيس ونحسّن باستمرار: سرعة الرد، دقة الإجابات، ومعدل تحويل السؤال لطلب." },
      ],
    },
    en: {
      badge: "The framework",
      title: "How we build everything at ArqFlow",
      sub: "Four stages every product, page, and AI agent we build passes through:",
      steps: [
        { icon: Lightbulb, h: "Clarity", p: "Understand the real problem first: who the customer is, where they lose money, and the simplest solution that actually works." },
        { icon: LayoutTemplate, h: "Structure", p: "Build an organized, scalable system — not patched-together hacks. Every agent gets its own clean, independent architecture." },
        { icon: Brain, h: "User Psychology", p: "Design for the human using it: the busy business owner and the customer who wants an answer right now." },
        { icon: Gauge, h: "Performance", p: "Measure and improve continuously: reply speed, answer accuracy, and the rate of questions converting into orders." },
      ],
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
        {t.steps.map((s, i) => (
          <Reveal key={s.h} delay={i * 0.1}>
            <div className="card card-hover p-6 h-full relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-11 h-11 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center">
                  <s.icon className="w-5 h-5" aria-hidden />
                </span>
                <span className="text-4xl font-extrabold gradient-text opacity-60">{i + 1}</span>
              </div>
              <h3 className="font-bold">{s.h}</h3>
              <p className="text-muted text-sm mt-2 leading-relaxed">{s.p}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function AboutClient() {
  const t = useT({
    ar: {
      badge: "من نحن",
      title: "بنبني موظفين أذكياء للبيزنس المصري",
    },
    en: {
      badge: "About us",
      title: "We build smart employees for Egyptian businesses",
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <Story />
      <div className="section-divider max-w-7xl mx-auto mt-16" />
      <Values />
      <Framework />
      <CTABanner />
    </>
  );
}
