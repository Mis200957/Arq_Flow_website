"use client";

import {
  UtensilsCrossed,
  Stethoscope,
  Dumbbell,
  ShoppingBag,
  Building2,
  Hotel,
  Star,
  TrendingUp,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { Reveal, PageHero, CTABanner } from "@/components/marketing/Shared";

export default function TestimonialsClient() {
  const t = useT({
    ar: {
      badge: "آراء العملاء",
      title: "نتايج حقيقية من بيزنس حقيقي",
      sub: "أصحاب أنشطة من مجالات مختلفة بيحكوا إيه اللي اتغير بعد ما وظّفوا موظف ArqFlow الذكي.",
      note: "أسماء الأنشطة معدّلة للحفاظ على خصوصية عملائنا.",
      items: [
        {
          icon: UtensilsCrossed,
          biz: "مطعم مشويات — مدينة نصر",
          name: "أحمد س.",
          quote: "كنا بنخسر طلبات الليل كلها. دلوقتي البوت بياخد الأوردر كامل بالعنوان والتفاصيل وإحنا نايمين، ونصحى نلاقي الطلبات جاهزة في الداشبورد.",
          metric: "+٤٠٪",
          metricLabel: "زيادة في الطلبات أول شهر",
        },
        {
          icon: Stethoscope,
          biz: "عيادة أسنان — المعادي",
          name: "د. مريم ع.",
          quote: "السكرتيرة كانت بتقضي نص يومها بترد على «بكام الكشف» و«فين العيادة». البوت خد الشغل ده كله، والحجوزات بقت بتتسجل لوحدها حتى بعد مواعيد الشغل.",
          metric: "-٧٠٪",
          metricLabel: "تقليل في المكالمات الروتينية",
        },
        {
          icon: Dumbbell,
          biz: "جيم — التجمع الخامس",
          name: "عمر ح.",
          quote: "أكتر وقت بييجي فيه استفسارات هو بالليل بعد ما الناس تخلص شغل. البوت بيرد عليهم في ثانية ويبعتلهم العروض، وبقينا بنقفل اشتراكات من غير ما حد يدخل الجيم أصلاً.",
          metric: "+٢٥٪",
          metricLabel: "زيادة في الاشتراكات الجديدة",
        },
        {
          icon: ShoppingBag,
          biz: "متجر ملابس أونلاين — الإسكندرية",
          name: "سارة ك.",
          quote: "عملائي كلهم بيبعتوا فويسات: «المقاس ده متوفر؟» «الشحن بكام؟». البوت بيفهم الصوتيات بالمصري ويرد بالتفاصيل والصور. حاجة كنت فاكراها مستحيلة.",
          metric: "< ٥ ثواني",
          metricLabel: "متوسط الرد على أي استفسار",
        },
        {
          icon: Building2,
          biz: "شركة تسويق عقاري — الشيخ زايد",
          name: "محمود ر.",
          quote: "العميل اللي بيسأل عن شقة ومحدش بيرد عليه في ساعة بيكون اشترى من حد تاني. البوت بيرد فوراً بالتفاصيل والصور ويحجز معاد المعاينة — مبيعاتنا حسّت بالفرق بسرعة.",
          metric: "x٣",
          metricLabel: "أضعاف عدد المعاينات المحجوزة",
        },
        {
          icon: Hotel,
          biz: "شاليهات مصيفية — الساحل الشمالي",
          name: "هشام ف.",
          quote: "في الصيف بيجيلنا مئات الرسائل في اليوم عن الأسعار والمواعيد المتاحة. كان مستحيل نرد على الكل. البوت بيرد على الجميع ويسجّل الحجز، وإحنا بس بنأكد.",
          metric: "١٠٠٪",
          metricLabel: "من الرسائل بتاخد رد",
        },
      ],
    },
    en: {
      badge: "Testimonials",
      title: "Real results from real businesses",
      sub: "Business owners across industries share what changed after hiring their ArqFlow AI employee.",
      note: "Business names adjusted to protect our clients' privacy.",
      items: [
        {
          icon: UtensilsCrossed,
          biz: "Grill restaurant — Nasr City",
          name: "Ahmed S.",
          quote: "We were losing all our late-night orders. Now the bot takes the complete order with address and details while we sleep, and we wake up to orders ready in the dashboard.",
          metric: "+40%",
          metricLabel: "more orders in the first month",
        },
        {
          icon: Stethoscope,
          biz: "Dental clinic — Maadi",
          name: "Dr. Mariam A.",
          quote: "Our receptionist spent half her day answering “how much is the consultation” and “where's the clinic”. The bot took all of that, and bookings now log themselves even after working hours.",
          metric: "-70%",
          metricLabel: "fewer routine calls",
        },
        {
          icon: Dumbbell,
          biz: "Gym — New Cairo",
          name: "Omar H.",
          quote: "Most inquiries come at night after people finish work. The bot replies in a second and sends them our offers — we now close memberships without anyone setting foot in the gym first.",
          metric: "+25%",
          metricLabel: "more new memberships",
        },
        {
          icon: ShoppingBag,
          biz: "Online clothing store — Alexandria",
          name: "Sara K.",
          quote: "All my customers send voice notes: “is this size available?” “how much is shipping?”. The bot understands Egyptian voice messages and replies with details and photos. I thought that was impossible.",
          metric: "< 5s",
          metricLabel: "average reply to any inquiry",
        },
        {
          icon: Building2,
          biz: "Real estate agency — Sheikh Zayed",
          name: "Mahmoud R.",
          quote: "A lead asking about an apartment who waits an hour has already bought from someone else. The bot replies instantly with details and photos and books the viewing — our sales felt the difference fast.",
          metric: "3x",
          metricLabel: "more viewings booked",
        },
        {
          icon: Hotel,
          biz: "Beach chalets — North Coast",
          name: "Hesham F.",
          quote: "In summer we get hundreds of messages a day about prices and availability. Answering everyone was impossible. The bot replies to all of them and logs the booking — we just confirm.",
          metric: "100%",
          metricLabel: "of messages get a reply",
        },
      ],
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.items.map((it, i) => (
            <Reveal key={it.biz} delay={i * 0.07}>
              <figure className="card card-hover p-7 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center shrink-0">
                    <it.icon className="w-5 h-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{it.name}</p>
                    <p className="text-muted text-xs truncate">{it.biz}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3" aria-label="5/5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-warning fill-current" aria-hidden />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed flex-1">“{it.quote}”</blockquote>
                <figcaption className="mt-5 pt-4 border-t border-app flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-success shrink-0" aria-hidden />
                  <span className="text-xl font-extrabold gradient-text">{it.metric}</span>
                  <span className="text-muted text-xs leading-snug">{it.metricLabel}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-muted text-xs mt-8">{t.note}</p>
      </section>
      <CTABanner />
    </>
  );
}
