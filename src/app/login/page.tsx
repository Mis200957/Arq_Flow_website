"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Lock, Mail, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLang, useT } from "@/lib/i18n";
import { Field, Spinner } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { lang, setLang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useT({
    ar: {
      title: "تسجيل الدخول",
      subtitle: "ادخل على لوحة التحكم الخاصة بنشاطك",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "دخول",
      invalid: "بيانات الدخول غير صحيحة. حاول مرة أخرى.",
      noAccount: "لسه معندكش حساب؟",
      subscribe: "اشترك الآن",
      back: "العودة للرئيسية",
    },
    en: {
      title: "Login",
      subtitle: "Access your business dashboard",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      invalid: "Invalid credentials. Please try again.",
      noAccount: "Don't have an account yet?",
      subscribe: "Subscribe now",
      back: "Back to home",
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(t.invalid);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    let dest = params.get("next") ?? "/dashboard";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin" && !params.get("next")) dest = "/admin";
    }
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] bg-brand-teal -top-40 -start-40" />
      <div className="glow-orb w-[400px] h-[400px] bg-brand-sky -bottom-32 -end-32" />
      <div className="absolute inset-0 grid-bg opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full max-w-md p-8 relative"
      >
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="gradient-text">ArqFlow</span>
          </Link>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="btn-ghost !px-3 text-sm"
          >
            <Globe className="w-4 h-4" /> {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>

        <h1 className="text-2xl font-extrabold">{t.title}</h1>
        <p className="text-muted text-sm mt-1 mb-6">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t.email} required>
            <div className="relative">
              <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-muted" />
              <input
                type="email"
                required
                dir="ltr"
                autoComplete="email"
                className="input-base !ps-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </Field>
          <Field label={t.password} required>
            <div className="relative">
              <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-muted" />
              <input
                type="password"
                required
                dir="ltr"
                autoComplete="current-password"
                className="input-base !ps-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </Field>

          {error && (
            <p className="text-danger text-sm bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : t.submit}
          </button>
        </form>

        <p className="text-muted text-sm text-center mt-6">
          {t.noAccount}{" "}
          <Link href="/pricing" className="text-accent font-semibold hover:underline">
            {t.subscribe}
          </Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-muted text-xs hover:text-app">← {t.back}</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
