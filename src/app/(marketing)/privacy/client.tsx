"use client";

import { useT } from "@/lib/i18n";
import { Reveal, PageHero } from "@/components/marketing/Shared";

export default function PrivacyClient() {
  const t = useT({
    ar: {
      badge: "قانوني",
      title: "سياسة الخصوصية",
      updated: "آخر تحديث: يونيو ٢٠٢٦",
      intro:
        "خصوصيتك وخصوصية عملائك أمانة عندنا. السياسة دي بتوضح بشفافية إيه البيانات اللي بنجمعها في ArqFlow (مشروع من Al-Haggag Digital Systems)، بنخزنها فين، وبنستخدمها إزاي.",
      sections: [
        {
          h: "١. البيانات اللي بنجمعها",
          ps: [
            "بيانات حسابك: الاسم، الإيميل، رقم الموبايل، واسم ونوع نشاطك التجاري — بنجمعها لما تشترك أو تحجز ديمو.",
            "بيانات نشاطك: المنيو أو قائمة الخدمات، الأسعار، المواعيد، والسياسات اللي بتدّيهالنا في الأونبوردنج — دي المادة اللي بنبني بيها قاعدة معرفة البوت الخاص بيك.",
            "محادثات واتساب: الرسائل المتبادلة بين عملاءك ووكيل الذكاء الاصطناعي بتاع نشاطك، عشان البوت يقدر يخدمهم وتقدر أنت تتابعها من لوحة التحكم.",
            "بيانات الدفع: صور إيصالات التحويل اللي بترفعها لتأكيد الاشتراك. إحنا ما بنجمعش ولا بنخزن بيانات بطاقات بنكية.",
          ],
        },
        {
          h: "٢. فين بتتخزن البيانات",
          ps: [
            "كل البيانات بتتخزن على بنية Supabase السحابية الآمنة، بتشفير أثناء النقل وأثناء التخزين.",
            "بيانات كل بيزنس معزولة عن غيرها — وكيلك الذكي بيشوف معرفة نشاطك أنت بس، ولوحة تحكمك بتعرض بياناتك أنت بس.",
          ],
        },
        {
          h: "٣. بيانات واتساب",
          ps: [
            "ArqFlow بيتوصّل برقم واتساب نشاطك عشان يستقبل رسائل عملاءك ويرد عليها نيابة عنك. إحنا بنعالج الرسائل دي فقط لغرض تشغيل الخدمة ليك.",
            "محادثات عملاءك ملك لنشاطك. ما بنبيعهاش، ما بنشاركهاش مع أي طرف تالت، وما بنستخدمهاش لتدريب نماذج ذكاء اصطناعي عامة.",
            "الرسائل الصوتية بتتحوّل لنص بشكل آلي لغرض الرد عليها فقط.",
            "ArqFlow خدمة مستقلة وغير تابعة لشركة WhatsApp أو Meta.",
          ],
        },
        {
          h: "٤. استخدام البيانات",
          ps: [
            "بنستخدم بياناتك عشان: نشغّل وكيلك الذكي ونحسّنه، نتواصل معاك بخصوص حسابك واشتراكك، ونحلل أداء الخدمة بشكل عام (بأرقام مجمعة من غير تفاصيل شخصية).",
            "ممكن نبعتلك إشعارات خدمية مهمة (تأكيد دفع، اقتراب حد الرسائل، تحديثات). الرسائل التسويقية اختيارية وتقدر توقفها في أي وقت.",
          ],
        },
        {
          h: "٥. حقوقك",
          ps: [
            "ليك الحق تطلب نسخة من بياناتك، تصحيحها، أو حذفها نهائياً في أي وقت.",
            "عند إلغاء اشتراكك وطلب الحذف، بنمسح قاعدة معرفة نشاطك ومحادثاته خلال ٣٠ يوم، باستثناء سجلات الدفع اللي القانون بيلزمنا بالاحتفاظ بيها.",
            "للتواصل بخصوص أي طلب خصوصية: hello@arqflow.app أو واتساب الدعم.",
          ],
        },
        {
          h: "٦. تحديثات السياسة",
          ps: [
            "لو عدّلنا السياسة دي تعديل جوهري، هنبلغك عبر الإيميل أو لوحة التحكم قبل سريان التعديل. استمرارك في استخدام الخدمة بعد التحديث يعتبر موافقة عليه.",
          ],
        },
      ],
    },
    en: {
      badge: "Legal",
      title: "Privacy Policy",
      updated: "Last updated: June 2026",
      intro:
        "Your privacy — and your customers' privacy — is a trust we take seriously. This policy explains transparently what data ArqFlow (a product of Al-Haggag Digital Systems) collects, where it's stored, and how it's used.",
      sections: [
        {
          h: "1. Data we collect",
          ps: [
            "Account data: name, email, mobile number, and your business name and type — collected when you subscribe or book a demo.",
            "Business data: your menu or service list, prices, working hours, and policies you provide during onboarding — the material we use to build your bot's private knowledge base.",
            "WhatsApp conversations: messages exchanged between your customers and your business's AI agent, so the bot can serve them and you can review them in your dashboard.",
            "Payment data: screenshots of transfer receipts you upload to confirm your subscription. We never collect or store bank card details.",
          ],
        },
        {
          h: "2. Where data is stored",
          ps: [
            "All data is stored on secure Supabase cloud infrastructure, encrypted in transit and at rest.",
            "Each business's data is isolated — your agent only sees your business knowledge, and your dashboard only shows your data.",
          ],
        },
        {
          h: "3. WhatsApp data",
          ps: [
            "ArqFlow connects to your business WhatsApp number to receive and answer your customers' messages on your behalf. We process these messages solely to operate the service for you.",
            "Your customers' conversations belong to your business. We do not sell them, share them with third parties, or use them to train general AI models.",
            "Voice messages are transcribed automatically solely for the purpose of answering them.",
            "ArqFlow is an independent service and is not affiliated with WhatsApp or Meta.",
          ],
        },
        {
          h: "4. How we use data",
          ps: [
            "We use your data to: operate and improve your AI agent, communicate with you about your account and subscription, and analyze overall service performance (in aggregate, without personal details).",
            "We may send essential service notifications (payment confirmation, message-limit alerts, updates). Marketing messages are optional and you can opt out anytime.",
          ],
        },
        {
          h: "5. Your rights",
          ps: [
            "You have the right to request a copy of your data, correct it, or permanently delete it at any time.",
            "When you cancel and request deletion, we erase your business knowledge base and conversations within 30 days, except payment records we're legally required to keep.",
            "For any privacy request: hello@arqflow.app or our support WhatsApp.",
          ],
        },
        {
          h: "6. Policy updates",
          ps: [
            "If we make a material change to this policy, we'll notify you via email or your dashboard before it takes effect. Continued use of the service after the update constitutes acceptance.",
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
