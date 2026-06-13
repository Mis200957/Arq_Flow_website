"use client";

import { useT } from "@/lib/i18n";
import { Reveal, PageHero } from "@/components/marketing/Shared";

export default function TermsClient() {
  const t = useT({
    ar: {
      badge: "قانوني",
      title: "الشروط والأحكام",
      updated: "آخر تحديث: يونيو ٢٠٢٦",
      intro:
        "الشروط دي بتنظم استخدامك لخدمات ArqFlow المقدمة من Al-Haggag Digital Systems. باشتراكك في الخدمة أو استخدامك للموقع، فأنت بتوافق على الشروط دي.",
      sections: [
        {
          h: "١. الخدمة",
          ps: [
            "ArqFlow بيوفر وكلاء ذكاء اصطناعي بيردّوا على رسائل واتساب الخاصة بنشاطك التجاري، مع لوحة تحكم لمتابعة المحادثات والطلبات.",
            "الخدمة مقدمة «كما هي» مع التزامنا ببذل أقصى جهد لضمان استمراريتها ودقتها. ردود الذكاء الاصطناعي مبنية على البيانات اللي بتوفرها عن نشاطك، وأنت مسؤول عن صحة البيانات دي وتحديثها.",
          ],
        },
        {
          h: "٢. الاشتراك والدفع",
          ps: [
            "الاشتراك بيتكون من: رسوم تأسيس بتتدفع مرة واحدة عند بدء الخدمة + اشتراك شهري حسب الباقة المختارة. كل الأسعار بالجنيه المصري ومعلنة في صفحة الأسعار.",
            "الدفع بيتم عبر التحويل (إنستاباي، فودافون كاش، وي باي) مع رفع إثبات التحويل. تفعيل الخدمة بيبدأ بعد تأكيد فريقنا لاستلام المبلغ.",
            "الاشتراك الشهري بيتجدد بالدفع المسبق. التأخر في سداد الشهر الجديد قد يؤدي لإيقاف الخدمة مؤقتاً لحين السداد.",
            "كل باقة ليها حد شهري لعدد الرسائل الذكية. عند تجاوز الحد، تقدر تترقى لباقة أعلى أو تستنى بداية الشهر التالي.",
          ],
        },
        {
          h: "٣. سياسة الاسترداد والإلغاء",
          ps: [
            "رسوم التأسيس غير قابلة للاسترداد بعد بدء تجهيز (provisioning) وكيلك الذكي، لأنها مقابل أعمال بناء وتخصيص بتتنفذ فعلياً.",
            "لو طلبت إلغاء قبل بدء التجهيز، بيتم استرداد كامل المبلغ المدفوع.",
            "الاشتراك الشهري قابل للإلغاء في أي وقت من غير أي غرامات — الإلغاء بيمنع التجديد للشهر التالي، والخدمة بتفضل شغالة لنهاية الشهر المدفوع.",
            "المبالغ المدفوعة عن شهر جارٍ لا تُسترد جزئياً.",
          ],
        },
        {
          h: "٤. الاستخدام المقبول",
          ps: [
            "تلتزم باستخدام الخدمة في نشاط تجاري مشروع، وبعدم استخدامها لإرسال رسائل مزعجة (سبام)، أو محتوى مخالف للقانون، أو انتهاك شروط استخدام منصة واتساب.",
            "يحق لنا إيقاف أو إنهاء الخدمة فوراً في حالة الاستخدام المخالف، دون استرداد للمبالغ المدفوعة.",
            "أنت مسؤول عن الحفاظ على سرية بيانات دخولك للوحة التحكم.",
          ],
        },
        {
          h: "٥. حدود المسؤولية",
          ps: [
            "نلتزم ببذل العناية الواجبة في تشغيل الخدمة، لكن لا نضمن خلوها التام من الانقطاعات أو الأخطاء، ولا نتحمل مسؤولية أي أضرار غير مباشرة أو خسارة أرباح ناتجة عن استخدام الخدمة أو انقطاعها.",
            "في جميع الأحوال، يقتصر الحد الأقصى لمسؤوليتنا على إجمالي المبالغ المدفوعة منك خلال الثلاثة أشهر السابقة للمطالبة.",
            "ArqFlow خدمة مستقلة غير تابعة لشركة WhatsApp أو Meta، وأي تغييرات في سياسات المنصات دي خارجة عن سيطرتنا.",
          ],
        },
        {
          h: "٦. الملكية والبيانات",
          ps: [
            "بيانات نشاطك ومحادثات عملاءك تظل ملكاً لك. التقنية والأنظمة والكود المشغّل للخدمة ملك لـ Al-Haggag Digital Systems.",
            "تفاصيل التعامل مع البيانات موضحة في سياسة الخصوصية، وهي جزء لا يتجزأ من هذه الشروط.",
          ],
        },
        {
          h: "٧. تعديل الشروط",
          ps: [
            "يحق لنا تعديل هذه الشروط أو الأسعار مع إخطارك قبل السريان بوقت كافٍ. التعديلات السعرية لا تنطبق بأثر رجعي على شهور مدفوعة مقدماً.",
            "لأي استفسار قانوني: hello@arqflow.app",
          ],
        },
      ],
    },
    en: {
      badge: "Legal",
      title: "Terms of Service",
      updated: "Last updated: June 2026",
      intro:
        "These terms govern your use of ArqFlow services provided by Al-Haggag Digital Systems. By subscribing to the service or using this website, you agree to these terms.",
      sections: [
        {
          h: "1. The service",
          ps: [
            "ArqFlow provides AI agents that answer WhatsApp messages for your business, along with a dashboard to track conversations and orders.",
            "The service is provided “as is” with our commitment to best efforts in uptime and accuracy. AI replies are based on the data you provide about your business; you are responsible for the accuracy of that data and for keeping it updated.",
          ],
        },
        {
          h: "2. Subscription & payment",
          ps: [
            "The subscription consists of: a one-time setup fee paid at service start + a monthly subscription per the chosen plan. All prices are in Egyptian pounds and published on the pricing page.",
            "Payment is made by transfer (InstaPay, Vodafone Cash, WE Pay) with uploaded proof. Service activation begins after our team confirms receipt of the amount.",
            "The monthly subscription renews on a prepaid basis. Late payment for a new month may result in temporary suspension until settled.",
            "Each plan has a monthly limit of AI messages. If you exceed it, you can upgrade to a higher plan or wait for the next month's reset.",
          ],
        },
        {
          h: "3. Refund & cancellation policy",
          ps: [
            "The setup fee is non-refundable once provisioning of your AI agent has begun, as it pays for build and customization work that is actually performed.",
            "If you request cancellation before provisioning begins, the full amount paid is refunded.",
            "The monthly subscription is cancellable anytime with no penalties — cancellation prevents renewal for the following month, and service continues until the end of the paid month.",
            "Amounts paid for a month in progress are not partially refunded.",
          ],
        },
        {
          h: "4. Acceptable use",
          ps: [
            "You agree to use the service for a lawful business, and not to use it for spam, unlawful content, or in violation of WhatsApp's platform terms.",
            "We may suspend or terminate the service immediately in case of violating use, without refund of amounts paid.",
            "You are responsible for keeping your dashboard credentials confidential.",
          ],
        },
        {
          h: "5. Limitation of liability",
          ps: [
            "We exercise due care in operating the service but do not guarantee it will be entirely free of interruptions or errors, and we are not liable for indirect damages or lost profits arising from use or interruption of the service.",
            "In all cases, our maximum liability is limited to the total amounts you paid in the three months preceding the claim.",
            "ArqFlow is an independent service not affiliated with WhatsApp or Meta, and changes to those platforms' policies are outside our control.",
          ],
        },
        {
          h: "6. Ownership & data",
          ps: [
            "Your business data and your customers' conversations remain yours. The technology, systems, and code operating the service belong to Al-Haggag Digital Systems.",
            "Data handling details are set out in the Privacy Policy, which forms an integral part of these terms.",
          ],
        },
        {
          h: "7. Changes to terms",
          ps: [
            "We may amend these terms or prices with sufficient advance notice before they take effect. Price changes never apply retroactively to months already paid.",
            "For any legal inquiry: hello@arqflow.app",
          ],
        },
      ],
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.updated} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <Reveal>
          <p className="text-muted leading-relaxed">{t.intro}</p>
        </Reveal>
        <div className="space-y-8 mt-10">
          {t.sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.04}>
              <div className="card p-7">
                <h2 className="font-extrabold text-lg text-accent">{s.h}</h2>
                <div className="space-y-3 mt-3">
                  {s.ps.map((p, j) => (
                    <p key={j} className="text-muted text-sm leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
