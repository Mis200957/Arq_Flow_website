"use client";

import { useMemo, useRef, useState } from "react";
import {
  Save, Upload, FileText, Image as ImageIcon, Trash2, Loader2,
  RefreshCw, Brain, RotateCcw, Database, CheckCircle2,
} from "lucide-react";
import { Field, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type BizFile = Tables<"business_files">;
interface Props {
  businessId: string;
  systemPrompt: string | null;
  initialFiles: BizFile[];
}

type JobAction = "regenerate_prompt" | "rebuild_kb" | "retrain" | "restart_context";

export default function AIManagementPanel({ businessId, systemPrompt, initialFiles }: Props) {
  const { lang } = useLang();
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const t = useT({
    ar: {
      promptTitle: "تعديل البرومبت (System Prompt)", promptHint: "تحكّم كامل في تعليمات المساعد. غيّر بحذر.",
      savePrompt: "حفظ البرومبت", saving: "جاري الحفظ...", saved: "تم الحفظ ✓",
      filesTitle: "ملفات قاعدة المعرفة", filesHint: "ارفع PDF أو Word أو صور — يعالجها النظام تلقائياً ويضيفها لمعرفة المساعد.",
      upload: "رفع ملفات", uploading: "جاري الرفع...", noFiles: "لا توجد ملفات بعد",
      opsTitle: "عمليات الذكاء", queued: "تم الإرسال للمعالجة ✓",
      regenerate_prompt: "إعادة توليد البرومبت", rebuild_kb: "إعادة بناء قاعدة المعرفة",
      retrain: "إعادة تدريب المساعد", restart_context: "إعادة ضبط الذاكرة",
      regenerate_prompt_d: "توليد برومبت جديد من بيانات نشاطك", rebuild_kb_d: "تحديث المعرفة من الملفات والأسئلة",
      retrain_d: "إعادة معالجة كل المصادر", restart_context_d: "مسح ذاكرة المحادثات الحالية",
    },
    en: {
      promptTitle: "Edit Prompt (System Prompt)", promptHint: "Full control over the assistant's instructions. Edit with care.",
      savePrompt: "Save Prompt", saving: "Saving...", saved: "Saved ✓",
      filesTitle: "Knowledge Base Files", filesHint: "Upload PDF, Word or images — processed automatically and added to the assistant's knowledge.",
      upload: "Upload files", uploading: "Uploading...", noFiles: "No files yet",
      opsTitle: "AI Operations", queued: "Queued for processing ✓",
      regenerate_prompt: "Regenerate Prompt", rebuild_kb: "Rebuild Knowledge Base",
      retrain: "Retrain Assistant", restart_context: "Restart Context",
      regenerate_prompt_d: "Generate a fresh prompt from your business data", rebuild_kb_d: "Refresh knowledge from files & FAQs",
      retrain_d: "Re-process all sources", restart_context_d: "Clear current conversation memory",
    },
  });

  const [prompt, setPrompt] = useState(systemPrompt ?? "");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [files, setFiles] = useState<BizFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<JobAction | null>(null);
  const [queued, setQueued] = useState<JobAction | null>(null);

  const savePrompt = async () => {
    setSavingPrompt(true);
    const res = await fetch("/api/dashboard/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_profile", system_prompt: prompt }),
    });
    setSavingPrompt(false);
    if (res.ok) { setPromptSaved(true); setTimeout(() => setPromptSaved(false), 2000); }
  };

  const runJob = async (action: JobAction) => {
    setBusy(action);
    const res = await fetch("/api/dashboard/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (res.ok) { setQueued(action); setTimeout(() => setQueued(null), 2500); }
  };

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    for (const file of Array.from(list)) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const bucket = isImage ? "business-assets" : "kb-files";
      const kind = isImage ? "image" : isPdf ? "pdf" : "kb_doc";
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `${businessId}/${Date.now()}_${sanitized}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) continue;
      const res = await fetch("/api/dashboard/ai/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, file_name: file.name, bucket, kind, mime_type: file.type, size_bytes: file.size }),
      });
      const json = await res.json().catch(() => null);
      if (json?.file) setFiles((prev) => [json.file as BizFile, ...prev]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deleteFile = async (f: BizFile) => {
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
    await fetch(`/api/dashboard/ai/upload?id=${f.id}`, { method: "DELETE" });
  };

  const OPS: { action: JobAction; Icon: typeof RefreshCw }[] = [
    { action: "regenerate_prompt", Icon: RefreshCw },
    { action: "rebuild_kb", Icon: Database },
    { action: "retrain", Icon: Brain },
    { action: "restart_context", Icon: RotateCcw },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Editable system prompt */}
      <div className="card p-6">
        <h3 className="font-bold">{t.promptTitle}</h3>
        <p className="text-xs text-muted mt-1 mb-3">{t.promptHint}</p>
        <textarea className="input-base min-h-48 font-mono text-xs" value={prompt} onChange={(e) => setPrompt(e.target.value)} dir="ltr" />
        <button onClick={savePrompt} disabled={savingPrompt} className="btn-primary mt-3 flex items-center gap-2">
          {savingPrompt ? <><Spinner className="w-4 h-4" /> {t.saving}</> : promptSaved ? <><CheckCircle2 className="w-4 h-4" /> {t.saved}</> : <><Save className="w-4 h-4" /> {t.savePrompt}</>}
        </button>
      </div>

      {/* Knowledge files */}
      <div className="card p-6">
        <h3 className="font-bold">{t.filesTitle}</h3>
        <p className="text-xs text-muted mt-1 mb-3">{t.filesHint}</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-outline flex items-center gap-2 text-sm">
          {uploading ? <><Spinner className="w-4 h-4" /> {t.uploading}</> : <><Upload className="w-4 h-4" /> {t.upload}</>}
        </button>
        <div className="mt-4 space-y-2">
          {files.length === 0 ? (
            <p className="text-muted text-sm">{t.noFiles}</p>
          ) : files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[rgba(14,32,56,0.04)]">
              {f.kind === "image" ? <ImageIcon className="w-4 h-4 text-accent shrink-0" /> : <FileText className="w-4 h-4 text-accent shrink-0" />}
              <span className="text-sm truncate flex-1">{f.file_name}</span>
              <button onClick={() => deleteFile(f)} className="btn-ghost !p-1.5 text-[var(--danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* AI operations */}
      <div className="card p-6">
        <h3 className="font-bold mb-4">{t.opsTitle}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {OPS.map(({ action, Icon }) => (
            <button key={action} onClick={() => runJob(action)} disabled={busy === action}
              className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--border-strong)] text-start transition-all disabled:opacity-60">
              <div className="w-9 h-9 rounded-lg bg-[rgba(184,144,99,0.12)] text-accent flex items-center justify-center shrink-0">
                {busy === action ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t[action]}</p>
                <p className="text-xs text-muted mt-0.5">{queued === action ? t.queued : t[`${action}_d` as keyof typeof t] as string}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
