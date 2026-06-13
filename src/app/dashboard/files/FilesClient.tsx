"use client";

import { useState, useRef, useMemo } from "react";
import { Upload, Trash2, Download, FolderOpen, File, Image, FileText } from "lucide-react";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type BFile = Tables<"business_files">;

interface Props {
  businessId: string;
  initialFiles: BFile[];
}

const FILE_KINDS = ["general", "menu", "catalog", "policy", "image", "document"];

function FileIcon({ mime }: { mime: string | null }) {
  if (!mime) return <File className="w-6 h-6 text-muted" />;
  if (mime.startsWith("image/")) return <Image className="w-6 h-6 text-accent" />;
  if (mime.includes("pdf") || mime.includes("document")) return <FileText className="w-6 h-6 text-[var(--warning)]" />;
  return <File className="w-6 h-6 text-muted" />;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesClient({ businessId, initialFiles }: Props) {
  const { lang } = useLang();
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState("general");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const t = useT({
    ar: {
      upload: "رفع ملف", uploading: "جاري الرفع...", noFiles: "لا توجد ملفات",
      kind: "نوع الملف", name: "الاسم", size: "الحجم", date: "التاريخ",
      download: "تحميل", delete: "حذف", deleteConfirm: "حذف هذا الملف؟",
    },
    en: {
      upload: "Upload file", uploading: "Uploading...", noFiles: "No files yet",
      kind: "File kind", name: "Name", size: "Size", date: "Date",
      download: "Download", delete: "Delete", deleteConfirm: "Delete this file?",
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${businessId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("business-assets").upload(path, file);
    if (!upErr) {
      const { data: db } = await supabase
        .from("business_files")
        .insert({
          business_id: businessId, file_name: file.name, storage_path: path,
          bucket: "business-assets", kind, mime_type: file.type, size_bytes: file.size,
        })
        .select()
        .single();
      if (db) setFiles((prev) => [db, ...prev]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadFile = async (f: BFile) => {
    const { data } = await supabase.storage.from(f.bucket).createSignedUrl(f.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const deleteFile = async (f: BFile) => {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.storage.from(f.bucket).remove([f.storage_path]);
    await supabase.from("business_files").delete().eq("id", f.id);
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
  };

  return (
    <div className="space-y-4">
      {/* Upload bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select
          className="input-base text-sm w-40"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {FILE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-2"
        >
          {uploading ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {uploading ? t.uploading : t.upload}
        </button>
      </div>

      {files.length === 0 ? (
        <EmptyState icon={<FolderOpen className="w-12 h-12" />} title={t.noFiles} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f) => (
            <div key={f.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <FileIcon mime={f.mime_type} />
                <Badge variant="accent" className="text-[10px]">{f.kind}</Badge>
              </div>
              <p className="text-sm font-semibold truncate" title={f.file_name}>{f.file_name}</p>
              <p className="text-xs text-muted mt-1">{formatBytes(f.size_bytes)}</p>
              <p className="text-xs text-muted">{formatDate(f.created_at, lang)}</p>
              <div className="flex gap-1 mt-3">
                <button onClick={() => downloadFile(f)} className="btn-ghost !p-1.5 flex-1 justify-center">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteFile(f)} className="btn-ghost !p-1.5 flex-1 justify-center text-[var(--danger)]">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
