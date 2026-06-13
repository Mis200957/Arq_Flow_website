"use client";

import Link from "next/link";
import { HelpCircle, Rocket, CreditCard, Cpu, MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SUPPORT_WHATSAPP } from "@/lib/plans";
import {
  Reveal,
  PageHero,
  Accordion,
  CTABanner,
} from "@/components/marketing/Shared";

export default function FaqClient() {
  const t = useT({
    ar: {
      badge: "الأسئلة الشائعة",
      title: "كل اللي محتاج تعرفه عن ArqFlow",
      sub: "لو سؤالك مش هنا، كلمنا واتساب وهنرد عليك بسرعة — بني آدم حقيقي، مش بوت 😄",
      contact: "اسأل سؤالك على واتساب",
      groups: [
        {
          icon: HelpCircle,
          title: "أسئلة عامة",
          items: [
            { q: "إيه هو ArqFlow بالظبط؟", a: "ArqFlow هو نظام بيركّب لنشاطك وكيل ذكاء اصطناعي خاص على واتساب: بيرد على عملاءك فوراً ٢٤ ساعة، ياخد الطلبات والحجوزات، يفهم المصري والعربي والإنجليزي، ويحوّل للبشر لما يحتاج. كل ده مع لوحة تحكم تتابع منها كل حاجة." },
            { q: "هل ArqFlow مناسب لحجم نشاطي؟", a: "لو نشاطك بيستقبل رسائل واتساب من عملاء — فهو مناسب. عندنا باقات تبدأ من ٥٠٠ ج.م شهرياً للنشاط الصغير، وتوصل لباقات إنتربرايز للشركات اللي بتستقبل آلاف الرسائل. شغالين مع مطاعم وعيادات ومحلات وجيمات وعقارات وفنادق وغيرهم." },
            { q: "إيه الفرق بين ArqFlow وأي شات بوت تاني؟", a: "البوتات التقليدية بترد بقوالب جاهزة وبتقف عند أول سؤال خارج السيناريو. وكيل ArqFlow بيفهم اللغة الطبيعية واللهجة المصرية والرسائل الصوتية، ومتدرّب على بيانات نشاطك أنت تحديداً — فبيرد رد حقيقي مفيد، مش «اختر من القائمة»." },
          ],
        },
        {
          icon: Rocket,
          title: "الإعداد والتشغيل",
          items: [
            { q: "محتاج خبرة تقنية عشان أشترك؟", a: "إطلاقاً. كل المطلوب منك تملا فورم الأونبوردنج بمعلومات نشاطك وتمسح QR كود من موبايلك لربط الواتساب — زي ما بتفتح واتساب ويب بالظبط. الباقي كله علينا." },
            { q: "هل لازم رقم واتساب جديد؟", a: "لأ، بنوصّل الوكيل برقم واتساب نشاطك الحالي. عملاءك هيكلموا نفس الرقم اللي متعودين عليه. ولو حابب تخصص رقم جديد للبوت، ده كمان ممكن." },
            { q: "أقدر أعدّل معلومات البوت بعد التشغيل؟", a: "أيوه، في أي وقت. غيّرت المنيو؟ زوّدت خدمة؟ عدّلت المواعيد؟ ابعتلنا التحديث من لوحة التحكم أو على واتساب الدعم وهيتطبق على معرفة البوت." },
          ],
        },
        {
          icon: CreditCard,
          title: "الفواتير والدفع",
          items: [
            { q: "إيه طرق الدفع المتاحة؟", a: "إنستاباي، فودافون كاش، ووي باي. بتحوّل المبلغ وترفع صورة إيصال التحويل، وفريقنا بيأكد الدفع وبيبدأ التجهيز فوراً. كل الأسعار بالجنيه المصري." },
            { q: "هل في عقد سنوي أو التزام طويل؟", a: "لأ. الاشتراك شهري وتقدر تلغيه في أي وقت من غير غرامات — ببساطة مش بيتجدد الشهر التالي. الالتزام الوحيد هو رسوم التأسيس اللي بتتدفع مرة واحدة." },
            { q: "إيه اللي يحصل لو وقفت الاشتراك ورجعت تاني؟", a: "لو رجعت خلال ٩٠ يوم، وكيلك وقاعدة معرفته بيكونوا محفوظين وبنرجّعهم من غير رسوم تأسيس جديدة. بعد ٩٠ يوم ممكن نحتاج رسوم إعادة تجهيز مخفضة." },
          ],
        },
        {
          icon: Cpu,
          title: "أسئلة تقنية",
          items: [
            { q: "فين بتتخزن بيانات نشاطي ومحادثات عملائي؟", a: "البيانات بتتخزن بشكل آمن على بنية Supabase السحابية بتشفير كامل. كل بيزنس له بياناته المعزولة، ومحادثات عملاءك مش بتتستخدم لتدريب نماذج عامة ولا بتتشارك مع أي طرف تالت." },
            { q: "إيه اللي بيحصل لو النت قطع أو في مشكلة تقنية؟", a: "النظام شغّال على بنية سحابية موزعة بمراقبة مستمرة — مش سيرفر في مكتبنا. لو حصلت أي مشكلة نادرة، فريقنا بيتدخل فوراً والرسائل الواردة بتتسجل ومش بتضيع." },
            { q: "هل البوت ممكن يغلط في الرد؟", a: "وكيلنا متدرّب يرد بس من قاعدة معرفة نشاطك، ولو السؤال خارج معرفته بيحوّل لبشري بدل ما يخمّن. ومع كل تصحيح بتبعته، معرفته بتتحدث — فدقته بتزيد مع الوقت." },
          ],
        },
      ],
    },
    en: {
      badge: "FAQ",
      title: "Everything you need to know about ArqFlow",
      sub: "If your question isn't here, WhatsApp us and you'll get a quick answer — from a real human, not a bot 😄",
      contact: "Ask on WhatsApp",
      groups: [
        {
          icon: HelpCircle,
          title: "General",
          items: [
            { q: "What exactly is ArqFlow?", a: "ArqFlow installs a private AI agent on your business WhatsApp: it answers customers instantly 24/7, takes orders and bookings, understands Egyptian Arabic and English, and escalates to humans when needed. All with a dashboard where you track everything." },
            { q: "Is ArqFlow right for my business size?", a: "If your business receives WhatsApp messages from customers — it's right for you. Plans start at 500 EGP/month for small businesses and scale to Enterprise for companies handling thousands of messages. We serve restaurants, clinics, stores, gyms, real estate, hotels, and more." },
            { q: "How is ArqFlow different from other chatbots?", a: "Traditional bots reply with canned templates and break at the first off-script question. An ArqFlow agent understands natural language, Egyptian dialect, and voice messages, and is trained on your specific business data — so it gives genuinely useful answers, not “choose from the menu”." },
          ],
        },
        {
          icon: Rocket,
          title: "Setup",
          items: [
            { q: "Do I need technical skills to subscribe?", a: "Not at all. All you do is fill the onboarding form with your business info and scan a QR code from your phone to connect WhatsApp — exactly like opening WhatsApp Web. We handle everything else." },
            { q: "Do I need a new WhatsApp number?", a: "No, we connect the agent to your current business WhatsApp number. Customers keep messaging the number they already know. If you'd prefer a dedicated new number for the bot, that's possible too." },
            { q: "Can I update the bot's knowledge after launch?", a: "Yes, anytime. Changed the menu? Added a service? New hours? Send the update from your dashboard or via support WhatsApp and it gets applied to the bot's knowledge." },
          ],
        },
        {
          icon: CreditCard,
          title: "Billing",
          items: [
            { q: "What payment methods are available?", a: "InstaPay, Vodafone Cash, and WE Pay. You transfer the amount and upload a screenshot of the receipt; our team confirms and provisioning starts immediately. All prices are in Egyptian pounds." },
            { q: "Is there an annual contract or long commitment?", a: "No. The subscription is monthly and cancellable anytime without penalties — it simply doesn't renew next month. The only one-time commitment is the setup fee." },
            { q: "What if I pause my subscription and come back?", a: "If you return within 90 days, your agent and its knowledge base are preserved and restored with no new setup fee. After 90 days, a reduced re-provisioning fee may apply." },
          ],
        },
        {
          icon: Cpu,
          title: "Technical",
          items: [
            { q: "Where are my business data and customer chats stored?", a: "Data is stored securely on Supabase cloud infrastructure with full encryption. Every business has isolated data, and your customers' conversations are never used to train public models or shared with any third party." },
            { q: "What happens if there's an outage or technical issue?", a: "The system runs on distributed cloud infrastructure with continuous monitoring — not a server in our office. In the rare event of an issue, our team intervenes immediately and incoming messages are queued, not lost." },
            { q: "Can the bot give a wrong answer?", a: "Our agents are trained to answer only from your business knowledge base, and when a question falls outside it, they escalate to a human instead of guessing. Every correction you send updates its knowledge — so accuracy improves over time." },
          ],
        },
      ],
    },
  });

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-14">
        {t.groups.map((g, gi) => (
          <Reveal key={g.title} delay={gi * 0.05}>
            <h2 className="font-extrabold text-xl flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center">
                <g.icon className="w-4.5 h-4.5" aria-hidden />
              </span>
              {g.title}
            </h2>
            <Accordion items={g.items} idPrefix={`faq-g${gi}`} defaultOpen={gi === 0 ? 0 : null} />
          </Reveal>
        ))}
        <Reveal className="text-center">
          <Link
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <MessageCircle className="w-4 h-4" aria-hidden />
            {t.contact}
          </Link>
        </Reveal>
      </section>
      <CTABanner />
    </>
  );
}
