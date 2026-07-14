"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SUPPORT_WHATSAPP } from "@/lib/plans";
import { Reveal, PageHero } from "@/components/marketing/Shared";

export default function BookDemoClient() {
  const t = useT({
    ar: {
      badge: "ديمو مجاني",
      title: "شوف موظفك الذكي شغّال — قبل ما تدفع جنيه",
      sub: "في الديمو هنوريك محادثة حية لبوت شغّال في مجالك، ونجاوب على كل أسئلتك، ونرشحلك الباقة المناسبة.",
      points: [
        "ديمو حي على واتساب — مش فيديو مسجل",
        "أمثلة من مجال نشاطك أنت تحديداً",
        "من غير أي التزام أو بيانات دفع",
      ],
      formTitle: "احجز معادك",
      formDesc: "املا البيانات وهنفتحلك واتساب بطلب الديمو جاهز — فريقنا هيظبط معاك المعاد.",
      name: "الاسم",
      namePh: "اسمك الكريم",
      bizType: "نوع النشاط",
      bizPh: "اختار مجال نشاطك",
      phone: "رقم الموبايل (واتساب)",
      phonePh: "01xxxxxxxxx",
      submit: "احجز الديمو عبر واتساب",
      types: [
        "مطعم / كافيه",
        "عيادة / مركز طبي",
        "محل / متجر أونلاين",
        "جيم / لياقة",
        "عقارات",
        "فندق / شاليهات",
        "صالون / بيوتي",
        "كورسات / تعليم",
        "صيدلية",
        "مجال آخر",
      ],
      waMessage: (n: string, b: string, p: string) =>
        `مرحباً فريق ArqFlow 👋\n\nعايز أحجز ديمو مجاني.\n\nالاسم: ${n}\nنوع النشاط: ${b}\nرقم الواتساب: ${p}\n\nإمتى أقرب معاد متاح؟`,
    },
    en: {
      badge: "Free demo",
      title: "See your AI employee in action — before paying a pound",
      sub: "In the demo we'll show you a live conversation with a working bot in your industry, answer all your questions, and recommend the right plan.",
      points: [
        "Live demo on WhatsApp — not a recorded video",
        "Examples from your specific industry",
        "No commitment, no payment details",
      ],
      formTitle: "Book your slot",
      formDesc: "Fill in your details and we'll open WhatsApp with your demo request ready — our team will arrange the time with you.",
      name: "Name",
      namePh: "Your name",
      bizType: "Business type",
      bizPh: "Choose your industry",
      phone: "Mobile number (WhatsApp)",
      phonePh: "01xxxxxxxxx",
      submit: "Book the demo via WhatsApp",
      types: [
        "Restaurant / café",
        "Clinic / medical center",
        "Store / online shop",
        "Gym / fitness",
        "Real estate",
        "Hotel / rentals",
        "Salon / beauty",
        "Courses / education",
        "Pharmacy",
        "Other",
      ],
      waMessage: (n: string, b: string, p: string) =>
        `Hello ArqFlow team 👋\n\nI'd like to book a free demo.\n\nName: ${n}\nBusiness type: ${b}\nWhatsApp number: ${p}\n\nWhen is the nearest available slot?`,
    },
  });

  const [name, setName] = useState("");
  const [bizType, setBizType] = useState("");
  const [phone, setPhone] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(t.waMessage(name.trim(), bizType, phone.trim()));
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <PageHero badge={t.badge} title={t.title} subtitle={t.sub} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start max-w-5xl mx-auto">
          <Reveal>
            <ul className="space-y-4">
              {t.points.map((p) => (
                <li key={p} className="card p-5 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden />
                  <span className="text-sm font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={onSubmit} className="glass-strong p-7 sm:p-9">
              <h2 className="font-extrabold text-xl">{t.formTitle}</h2>
              <p className="text-muted text-sm mt-2">{t.formDesc}</p>

              <label className="block mt-6">
                <span className="block text-sm font-semibold mb-1.5">{t.name}</span>
                <input
                  className="input-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePh}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="block mt-4">
                <span className="block text-sm font-semibold mb-1.5">{t.bizType}</span>
                <select
                  className="input-base"
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t.bizPh}
                  </option>
                  {t.types.map((ty) => (
                    <option key={ty} value={ty}>
                      {ty}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block mt-4">
                <span className="block text-sm font-semibold mb-1.5">{t.phone}</span>
                <input
                  className="input-base"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePh}
                  required
                  autoComplete="tel"
                  dir="ltr"
                />
              </label>

              <button type="submit" className="btn-primary w-full mt-6">
                <MessageCircle className="w-4 h-4" aria-hidden />
                {t.submit}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
