"use client";

import {
  Zap,
  ShoppingCart,
  Mic,
  Check,
  X,
  Minus,
  Clock,
  FileText,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Reveal,
  PageHero,
  CTABanner,
} from "@/components/marketing/Shared";

/* ---------- visual mocks ---------- */

function ChatLinesMock() {
  const t = useT({
    ar: {
      q: "بكام الكشف؟ وإيه مواعيدكم النهاردة؟",
      a: "الكشف ٣٠٠ ج.م 😊 والعيادة فاتحة النهاردة من ٤ عصراً لـ ١٠ مساءً. تحب أحجزلك ميعاد؟",
      time: "الرد خلال ٣ ثواني",
    },
    en: {
      q: "How much is the consultation? And what are today's hours?",
      a: "The consultation is 300 EGP 😊 We're open today 4 PM–10 PM. Want me to book you a slot?",
      time: "Replied in 3 seconds",
    },
  });
  return (
    <div className="glass-strong p-6 space-y-3">
      <div className="max-w-[85%] self-start bg-[rgba(14,32,56,0.1)] border border-app rounded-2xl rounded-ss-md px-4 py-3 text-sm">
        {t.q}
      </div>
      <div className="max-w-[85%] ms-auto bg-gradient-to-br from-brand-teal to-brand-sky text-white rounded-2xl rounded-se-md px-4 py-3 text-sm leading-relaxed">
        {t.a}
      </div>
      <p className="text-xs text-success flex items-center gap-1.5 justify-end">
        <Clock className="w-3.5 h-3.5" aria-hidden /> {t.time}
      </p>
    </div>
  );
}

function OrderMock() {
  const t = useT({
    ar: {
      title: "طلب جديد #1042",
      items: ["٢ × فراخ مشوية — ٢٤٠ ج.م", "١ × رز بسمتي — ٤٠ ج.م", "توصيل مدينة نصر — ٤٠ ج.م"],
      total: "الإجمالي: ٣٢٠ ج.م",
      status: "مؤكد تلقائياً",
    },
    en: {
      title: "New order #1042",
      items: ["2 × Grilled chicken — 240 EGP", "1 × Basmati rice — 40 EGP", "Delivery to Nasr City — 40 EGP"],
      total: "Total: 320 EGP",
      status: "Auto-confirmed",
    },
  });
  return (
    <div className="glass-strong p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" aria-hidden /> {t.title}
        </p>
        <span className="badge badge-success">{t.status}</span>
      </div>
      <ul className="space-y-2.5">
        {t.items.map((it) => (
          <li key={it} className="text-sm text-muted flex items-center gap-2">
            <Check className="w-4 h-4 text-success shrink-0" aria-hidden /> {it}
          </li>
        ))}
      </ul>
      <div className="section-divider my-4" />
      <p className="font-extrabold text-accent">{t.total}</p>
    </div>
  );
}

function VoiceMock() {
  const t = useT({
    ar: {
      voice: "رسالة صوتية · ٠:١٢",
      transcript: "«هو في مقاس ٤٢ من الكوتشي الأبيض اللي نزلتوه؟»",
      reply: "أيوه متوفر مقاس ٤٢ 👟 سعره ١٫٨٥٠ ج.م والشحن مجاني فوق الـ ١٥٠٠. أثبتهولك؟",
      label: "البوت فهم الصوتية بالمصري ورد نصياً",
    },
    en: {
      voice: "Voice message · 0:12",
      transcript: "“Do you have size 42 of the white sneakers you just posted?”",
      reply: "Yes, size 42 is in stock 👟 It's 1,850 EGP with free shipping over 1,500. Shall I reserve it?",
      label: "The bot understood the Egyptian voice note and replied in text",
    },
  });
  return (
    <div className="glass-strong p-6 space-y-3">
      <div className="max-w-[85%] self-start bg-[rgba(14,32,56,0.1)] border border-app rounded-2xl rounded-ss-md px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[rgba(184,144,99,0.2)] text-accent flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" aria-hidden />
          </span>
          <div className="flex items-center gap-0.5" aria-hidden>
            {[6, 12, 8, 16, 10, 14, 7, 12, 9, 15, 8, 11].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-brand-sky" style={{ height: h }} />
            ))}
          </div>
          <span className="text-xs text-muted whitespace-nowrap">{t.voice}</span>
        </div>
        <p className="text-xs text-muted mt-2 italic">{t.transcript}</p>
      </div>
      <div className="max-w-[85%] ms-auto bg-gradient-to-br from-brand-teal to-brand-sky text-white rounded-2xl rounded-se-md px-4 py-3 text-sm leading-relaxed">
        {t.reply}
      </div>
      <p className="text-xs text-accent text-center">{t.label}</p>
    </div>
  );
}

/* ---------- deep dives ---------- */

function DeepDives() {
  const t = useT({
    ar: {
      sections: [
        {
          icon: Zap,
          badge: "السرعة",
          h: "ردود فورية بتبيع بدل ما تأجّل",
          p: "في مصر، العميل اللي مش بيلاقي رد بيكلم المنافس اللي بعدك في السيرش. وكيل ArqFlow بيرد في أقل من ٥ ثواني — بإجابة كاملة فيها السعر والتفاصيل، مش «حاضر هشوف وأرد عليك».",
          points: ["رد كامل بالأسعار والتفاصيل من أول رسالة", "شغّال في الأعياد والإجازات ونص الليل", "بيفتكر العميل القديم وتفضيلاته"],
        },
        {
          icon: ShoppingCart,
          badge: "الأتمتة",
          h: "طلبات وحجوزات بتتسجّل لوحدها",
          p: "البوت مش بس بيرد — بيقفل البيعة. بياخد تفاصيل الأوردر، يأكّد العنوان والسعر، ويسجّل الطلب في لوحة تحكمك فوراً. إنت بس تجهّز وتوصّل.",
          points: ["تأكيد تلقائي للسعر والعنوان قبل التسجيل", "كل طلب بيظهر في الداشبورد لحظياً", "حجوزات مواعيد للعيادات والصالونات"],
        },
        {
          icon: Mic,
          badge: "اللغة",
          h: "بيفهم الفويسات والمصري — زي أي موظف شاطر",
          p: "العميل المصري بيبعت صوتية أسهل ما يكتب. وكيل ArqFlow بيسمع الرسالة الصوتية، يفهم اللهجة المصرية بمصطلحاتها، ويرد رد مظبوط — بالعربي أو بالإنجليزي حسب لغة العميل.",
          points: ["تحويل الصوت لنص وفهم المقصود مش بس الكلام", "مدرّب على اللهجة المصرية والمصطلحات الدارجة", "بيبدّل بين العربي والإنجليزي تلقائياً"],
        },
      ],
    },
    en: {
      sections: [
        {
          icon: Zap,
          badge: "Speed",
          h: "Instant replies that sell instead of stall",
          p: "In Egypt, a customer who gets no reply messages your competitor next. An ArqFlow agent replies in under 5 seconds — with a complete answer including prices and details, not “let me check and get back to you”.",
          points: ["Full answers with prices and details from the first message", "Working on holidays, weekends, and at 3 AM", "Remembers returning customers and their preferences"],
        },
        {
          icon: ShoppingCart,
          badge: "Automation",
          h: "Orders and bookings that log themselves",
          p: "The bot doesn't just chat — it closes the sale. It takes the full order, confirms address and price, and logs it in your dashboard instantly. You just prepare and deliver.",
          points: ["Auto-confirms price and address before logging", "Every order appears in your dashboard in real time", "Appointment booking for clinics and salons"],
        },
        {
          icon: Mic,
          badge: "Language",
          h: "Understands voice notes and Masry — like your best employee",
          p: "Egyptian customers send voice notes more than text. An ArqFlow agent listens to the voice message, understands the Egyptian dialect with all its slang, and replies precisely — in Arabic or English, matching the customer.",
          points: ["Transcribes voice and understands intent, not just words", "Trained on Egyptian dialect and everyday slang", "Switches between Arabic and English automatically"],
        },
      ],
    },
  });

  const visuals = [ChatLinesMock, OrderMock, VoiceMock];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16 sm:space-y-24">
      {t.sections.map((s, i) => {
        const Visual = visuals[i];
        return (
          <div key={s.h} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal className={cn(i % 2 === 1 && "lg:order-2")}>
              <span className="badge badge-accent mb-4">
                <s.icon className="w-3.5 h-3.5" aria-hidden /> {s.badge}
              </span>
              <h2 className="text-[1.75rem] leading-9 sm:text-4xl sm:leading-[1.2] font-extrabold">{s.h}</h2>
              <p className="text-muted mt-4 leading-relaxed">{s.p}</p>
              <ul className="mt-6 space-y-3">
                {s.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15} className={cn(i % 2 === 1 && "lg:order-1")}>
              <Visual />
            </Reveal>
          </div>
        );
      })}
    </section>
  );
}

/* ---------- comparison table ---------- */

function Comparison() {
  const t = useT({
    ar: {
      badge: "المقارنة",
      title: "ArqFlow مقابل البدائل",
      sub: "موظف إضافي بيكلّفك آلاف شهرياً، والبوتات التقليدية بتزعّل عملاءك. شوف الفرق بنفسك.",
      cols: ["", "ArqFlow", "تعيين موظف", "بوت ردود جاهزة"],
      rows: [
        { f: "التكلفة الشهرية", v: ["من ٥٠٠ ج.م", "٦٠٠٠+ ج.م", "متفاوتة"] },
        { f: "الرد ٢٤ ساعة بدون إجازات", v: ["yes", "no", "yes"] },
        { f: "فهم اللهجة المصرية والفويسات", v: ["yes", "yes", "no"] },
        { f: "ياخد طلبات وحجوزات كاملة", v: ["yes", "yes", "no"] },
        { f: "سرعة الرد", v: ["ثواني", "دقايق لساعات", "فوري لكن غبي"] },
        { f: "يتعامل مع ١٠٠ عميل في نفس اللحظة", v: ["yes", "no", "partial"] },
        { f: "بيتعلم عن نشاطك ويتحسّن", v: ["yes", "yes", "no"] },
        { f: "مش بيستقيل ولا يتأخر", v: ["yes", "no", "yes"] },
      ],
    },
    en: {
      badge: "Comparison",
      title: "ArqFlow vs. the alternatives",
      sub: "An extra employee costs thousands monthly, and canned-reply bots frustrate your customers. See the difference.",
      cols: ["", "ArqFlow", "Hiring staff", "Basic chatbot"],
      rows: [
        { f: "Monthly cost", v: ["From 500 EGP", "6,000+ EGP", "Varies"] },
        { f: "Answers 24/7, no days off", v: ["yes", "no", "yes"] },
        { f: "Understands Egyptian dialect & voice notes", v: ["yes", "yes", "no"] },
        { f: "Takes complete orders & bookings", v: ["yes", "yes", "no"] },
        { f: "Reply speed", v: ["Seconds", "Minutes to hours", "Instant but dumb"] },
        { f: "Handles 100 customers at once", v: ["yes", "no", "partial"] },
        { f: "Learns your business & improves", v: ["yes", "yes", "no"] },
        { f: "Never quits or shows up late", v: ["yes", "no", "yes"] },
      ],
    },
  });

  const cell = (v: string) => {
    if (v === "yes") return <Check className="w-5 h-5 text-success mx-auto" aria-label="✓" />;
    if (v === "no") return <X className="w-5 h-5 text-danger mx-auto" aria-label="✗" />;
    if (v === "partial") return <Minus className="w-5 h-5 text-warning mx-auto" aria-label="~" />;
    return <span className="text-sm">{v}</span>;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <Reveal className="max-w-3xl mx-auto text-center">
        <span className="badge badge-accent mb-4">{t.badge}</span>
        <h2 className="text-[1.75rem] leading-9 sm:text-4xl sm:leading-[1.2] font-extrabold">{t.title}</h2>
        <p className="text-muted mt-4 leading-relaxed">{t.sub}</p>
      </Reveal>
      <Reveal delay={0.1} className="mt-12">
        <div className="glass overflow-x-auto">
          <table className="table-base min-w-[640px]">
            <thead>
              <tr>
                {t.cols.map((c, i) => (
                  <th key={i} className={cn(i > 0 && "text-center", i === 1 && "text-accent")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r) => (
                <tr key={r.f}>
                  <td className="font-semibold text-sm">{r.f}</td>
                  {r.v.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "text-center",
                        i === 0 && "bg-[rgba(14,32,56,0.07)] font-semibold text-accent"
                      )}
                    >
                      {cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- page ---------- */

export default function FeaturesClient() {
  const t = useT({
    ar: {
      badge: "المميزات",
      title: "مش مجرد شات بوت — موظف كامل",
      sub: "ArqFlow بيجمع سرعة الآلة وذكاء أفضل موظف خدمة عملاء، في وكيل واحد شغّال على واتساب نشاطك.",
    },
    en: {
      badge: "Features",
      title: "Not just a chatbot — a full employee",
      sub: "ArqFlow combines machine speed with the intelligence of your best support employee, in one agent living on your business WhatsApp.",
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <DeepDives />
      <div className="section-divider max-w-7xl mx-auto" />
      <Comparison />
      <CTABanner />
    </>
  );
}
