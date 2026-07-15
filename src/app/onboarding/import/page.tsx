"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  X,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  HelpCircle
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Field, Spinner, StatCard } from "@/components/ui";
import { OnboardingHeader } from "../OnboardingWizard";

interface ExtractedItem {
  id: string;
  name: string;
  price: string;
  description: string;
}

function OnboardingImportWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importType = (searchParams.get("type") === "services" ? "services" : "products") as "products" | "services";
  const { lang, pick } = useLang();

  // Wizard steps: source -> upload -> processing -> preview
  const [step, setStep] = useState<"source" | "upload" | "processing" | "preview">("source");
  const [sourceType, setSourceType] = useState<"file" | "google">("file");
  const [file, setFile] = useState<File | null>(null);
  const [googleUrl, setGoogleUrl] = useState("");
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [processingState, setProcessingState] = useState<"uploading" | "reading" | "extracting" | "organizing" | "preparing">("uploading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translations
  const t = {
    ar: {
      title: importType === "products" ? "استيراد المنتجات ذكياً" : "استيراد الخدمات ذكياً",
      sub: importType === "products"
        ? "ارفع قائمة المنتجات الخاصة بك (ملف أو رابط جوجل) وسيقوم الذكاء الاصطناعي باستخراج الأسماء والأسعار والوصف تلقائياً."
        : "ارفع قائمة الخدمات الخاصة بك (ملف أو رابط جوجل) وسيقوم الذكاء الاصطناعي باستخراج الأسماء والأسعار والتفاصيل تلقائياً.",
      chooseSource: "اختر مصدر البيانات",
      fileUpload: "رفع ملف محلي",
      fileUploadSub: "Excel, CSV, PDF, Word, TXT",
      googleLink: "رابط جوجل درايف",
      googleLinkSub: "Google Sheets / Docs (عام)",
      dragDrop: "اسحب وأفلت الملف هنا أو اضغط للتصفح",
      fileTypes: "Excel, CSV, PDF, Word, TXT (حد أقصى 10 ميجابايت)",
      googlePlaceholder: "الصق رابط Google Doc أو Google Sheet هنا...",
      startBtn: "بدء الاستخراج بالذكاء الاصطناعي",
      backBtn: "العودة للتسجيل",
      extracting: "جاري استخراج البيانات...",
      extractedItems: "العناصر المكتشفة",
      missingPrices: "أسعار مفقودة",
      duplicateNames: "أسماء مكررة",
      emptyDescriptions: "وصف مفقود",
      confirmBtn: "تأكيد واستيراد القائمة",
      cancelBtn: "إلغاء",
      addNewItem: "إضافة عنصر جديد",
      itemName: "اسم العنصر",
      itemPrice: "السعر (ج.م)",
      itemDesc: "الوصف",
      emptyStateTitle: "لم نجد أي عناصر",
      emptyStateBody: "تأكد من محتوى الملف أو الرابط وأعد المحاولة.",
      validationError: "يرجى تصحيح الأخطاء قبل الاستيراد.",
      googleLinkHint: "تأكد من أن الرابط متاح للعامة ('anyone with the link can view') ليتمكن المساعد من قراءته.",
      statusMessages: {
        uploading: "جاري رفع الملف...",
        reading: "جاري قراءة الملف واستخراج النصوص...",
        extracting: "جاري تحليل البيانات بالذكاء الاصطناعي...",
        organizing: "جاري تنظيم وهيكلة البيانات...",
        preparing: "جاري إعداد المعاينة..."
      }
    },
    en: {
      title: importType === "products" ? "Smart Product Import" : "Smart Service Import",
      sub: importType === "products"
        ? "Upload your product catalog (file or Google link) and the AI will automatically extract names, prices, and descriptions."
        : "Upload your service list (file or Google link) and the AI will automatically extract names, prices, and details.",
      chooseSource: "Choose Data Source",
      fileUpload: "Local File Upload",
      fileUploadSub: "Excel, CSV, PDF, Word, TXT",
      googleLink: "Google Drive Link",
      googleLinkSub: "Google Sheets / Docs (Public)",
      dragDrop: "Drag and drop your file here, or click to browse",
      fileTypes: "Excel, CSV, PDF, Word, TXT (Max 10MB)",
      googlePlaceholder: "Paste your shareable Google Doc or Sheet link here...",
      startBtn: "Start AI Extraction",
      backBtn: "Back to Onboarding",
      extracting: "Extracting data...",
      extractedItems: "Detected Items",
      missingPrices: "Missing Prices",
      duplicateNames: "Duplicate Names",
      emptyDescriptions: "Empty Descriptions",
      confirmBtn: "Confirm & Import List",
      cancelBtn: "Cancel",
      addNewItem: "Add New Item",
      itemName: "Item Name",
      itemPrice: "Price (EGP)",
      itemDesc: "Description",
      emptyStateTitle: "No items found",
      emptyStateBody: "Please verify the file or link content and try again.",
      validationError: "Please fix the validation issues before importing.",
      googleLinkHint: "Make sure the link sharing is set to 'Anyone with the link can view' so the assistant can access it.",
      statusMessages: {
        uploading: "Uploading file...",
        reading: "Reading file and extracting text...",
        extracting: "Analyzing data with AI...",
        organizing: "Organizing and structuring data...",
        preparing: "Preparing preview..."
      }
    }
  };

  const currentT = lang === "ar" ? t.ar : t.en;

  // Run validation checks on extracted items
  const runValidation = (items: ExtractedItem[]) => {
    const names = items.map((i) => i.name.trim().toLowerCase());
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    names.forEach((name) => {
      if (name && seen.has(name)) {
        duplicates.add(name);
      } else if (name) {
        seen.add(name);
      }
    });

    let missingPriceCount = 0;
    let duplicateCount = 0;
    let emptyDescCount = 0;

    items.forEach((item) => {
      const price = parseFloat(item.price);
      if (!item.price.trim() || isNaN(price) || price === 0) {
        missingPriceCount++;
      }
      if (duplicates.has(item.name.trim().toLowerCase())) {
        duplicateCount++;
      }
      if (!item.description.trim()) {
        emptyDescCount++;
      }
    });

    return {
      total: items.length,
      missingPrices: missingPriceCount,
      duplicates: duplicateCount,
      emptyDescriptions: emptyDescCount,
      duplicateSet: duplicates,
    };
  };

  const stats = runValidation(extractedItems);

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrorMessage(lang === "ar" ? "حجم الملف يتجاوز 10 ميجابايت" : "File size exceeds 10MB");
        return;
      }
      setFile(selectedFile);
      setErrorMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        setErrorMessage(lang === "ar" ? "حجم الملف يتجاوز 10 ميجابايت" : "File size exceeds 10MB");
        return;
      }
      setFile(droppedFile);
      setErrorMessage(null);
    }
  };

  // Parsing Pipeline Trigger
  const startExtraction = async () => {
    setErrorMessage(null);
    setStep("processing");
    setProcessingState("uploading");

    const fd = new FormData();
    fd.append("importType", importType);
    if (sourceType === "file" && file) {
      fd.append("file", file);
    } else if (sourceType === "google" && googleUrl) {
      fd.append("url", googleUrl);
    } else {
      setErrorMessage(lang === "ar" ? "يرجى اختيار ملف أو إدخال رابط" : "Please select a file or input a link");
      setStep("upload");
      return;
    }

    // Step indicators loop
    const statusSteps: Array<typeof processingState> = ["uploading", "reading", "extracting", "organizing", "preparing"];
    let currentIdx = 0;
    const progressTimer = setInterval(() => {
      if (currentIdx < statusSteps.length - 1) {
        currentIdx++;
        setProcessingState(statusSteps[currentIdx]);
      }
    }, 700);

    try {
      const apiRequest = fetch("/api/import/parse", {
        method: "POST",
        body: fd,
      });

      // Keep screen loaded for at least 2.5s for smooth transitions
      const [response] = await Promise.all([
        apiRequest,
        new Promise((resolve) => setTimeout(resolve, 2500))
      ]);

      clearInterval(progressTimer);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Parsing failed");
      }

      setExtractedItems(data.items || []);
      setStep("preview");
    } catch (err: any) {
      clearInterval(progressTimer);
      setErrorMessage(err.message || "An unexpected error occurred");
      setStep("upload");
    }
  };

  // Inline Edits
  const handleItemChange = (id: string, field: keyof ExtractedItem, value: string) => {
    setExtractedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "price") {
          // Normalize prices to numbers and decimals only
          const val = value.replace(/[^\d.]/g, "").slice(0, 50);
          return { ...item, [field]: val };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewItem = () => {
    const newItem: ExtractedItem = {
      id: `manual_${Date.now()}`,
      name: "",
      price: "",
      description: "",
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  // Save to localStorage and redirect back
  const confirmImport = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("arqflow_onboarding_form");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // Map ExtractedItem to the ItemRow format (removing id)
          const itemsToMerge = extractedItems
            .filter((item) => item.name.trim())
            .map((item) => ({
              name: item.name.trim(),
              price: item.price.trim(),
              description: item.description.trim(),
            }));

          const targetKey = importType === "products" ? "products" : "services";
          parsed[targetKey] = [...(parsed[targetKey] || []), ...itemsToMerge];

          localStorage.setItem("arqflow_onboarding_form", JSON.stringify(parsed));
          localStorage.setItem("arqflow_import_success", String(itemsToMerge.length));
        } catch (e) {
          console.error("Failed to append imported items:", e);
        }
      }
      router.push("/onboarding");
    }
  };

  const handleCancel = () => {
    router.push("/onboarding");
  };

  return (
    <div className="relative z-10">
      <OnboardingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[rgba(0,229,163,0.12)] text-accent flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </span>
              {currentT.title}
            </h1>
            <p className="text-muted text-sm mt-1.5 leading-relaxed max-w-xl">{currentT.sub}</p>
          </div>
          <button
            onClick={handleCancel}
            className="btn-ghost text-sm flex items-center gap-1 hover:text-accent"
          >
            {lang === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {currentT.backBtn}
          </button>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.08)] px-4 py-3 flex items-start gap-2.5 text-sm text-danger">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{lang === "ar" ? "حدث خطأ أثناء الاستخراج" : "Extraction Error"}</p>
              <p className="mt-0.5 opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Choose source */}
        {step === "source" && (
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-bold border-b border-app pb-2">{currentT.chooseSource}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSourceType("file");
                  setStep("upload");
                }}
                className="card card-hover p-6 text-start flex flex-col items-center sm:items-start text-center sm:text-start gap-3 transition-all border border-app hover:border-accent"
              >
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white shrink-0 shadow-lg">
                  <FileText className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg">{currentT.fileUpload}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{currentT.fileUploadSub}</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setSourceType("google");
                  setStep("upload");
                }}
                className="card card-hover p-6 text-start flex flex-col items-center sm:items-start text-center sm:text-start gap-3 transition-all border border-app hover:border-accent"
              >
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white shrink-0 shadow-lg">
                  <LinkIcon className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg">{currentT.googleLink}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{currentT.googleLinkSub}</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Upload File / Google URL */}
        {step === "upload" && (
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-app pb-2">
              <h2 className="text-lg font-bold">
                {sourceType === "file" ? currentT.fileUpload : currentT.googleLink}
              </h2>
              <button
                onClick={() => setStep("source")}
                className="text-xs text-accent hover:underline"
              >
                {lang === "ar" ? "تغيير المصدر" : "Change Source"}
              </button>
            </div>

            {sourceType === "file" ? (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-strong rounded-2xl flex flex-col items-center justify-center gap-3 py-10 px-4 cursor-pointer hover:border-accent hover:bg-[rgba(44,76,69,0.03)] transition-all bg-[rgba(7,15,28,0.2)]"
                >
                  <Upload className="w-8 h-8 text-accent animate-pulse" />
                  <p className="font-semibold text-sm">{currentT.dragDrop}</p>
                  <p className="text-xs text-muted">{currentT.fileTypes}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>

                {file && (
                  <div className="flex items-center gap-3 rounded-xl border border-app bg-[rgba(7,15,28,0.5)] px-4 py-3">
                    <FileText className="w-5 h-5 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" dir="ltr" style={{ textAlign: "start" }}>{file.name}</p>
                      <p className="text-xs text-muted mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="btn-ghost !p-1.5 text-danger"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Field label={currentT.googlePlaceholder} required>
                  <input
                    className="input-base"
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    dir="ltr"
                    style={{ textAlign: "start" }}
                  />
                </Field>
                <p className="text-xs text-muted flex items-start gap-1.5 leading-relaxed bg-[rgba(44,76,69,0.05)] border border-app rounded-xl p-3">
                  <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>{currentT.googleLinkHint}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setStep("source")} className="btn-outline">
                {currentT.cancelBtn}
              </button>
              <button
                onClick={startExtraction}
                disabled={sourceType === "file" ? !file : !googleUrl.trim()}
                className="btn-primary"
              >
                {currentT.startBtn}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Processing (smooth simulated extraction) */}
        {step === "processing" && (
          <div className="card p-8 flex flex-col items-center justify-center gap-6 min-h-[300px] text-center relative overflow-hidden">
            <div className="glow-orb w-48 h-48 bg-brand-teal opacity-20 -top-16 -end-16" />
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-app flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-extrabold text-lg text-app">{currentT.extracting}</p>
              <p className="text-sm text-accent animate-pulse">
                {currentT.statusMessages[processingState]}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Review */}
        {step === "preview" && (
          <div className="space-y-6">
            {/* stats overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label={currentT.extractedItems}
                value={stats.total}
                icon={<FileText className="w-5 h-5 text-accent" />}
              />
              <StatCard
                label={currentT.missingPrices}
                value={
                  <span className={stats.missingPrices > 0 ? "text-danger" : ""}>
                    {stats.missingPrices}
                  </span>
                }
                icon={
                  <AlertCircle
                    className={cn("w-5 h-5", stats.missingPrices > 0 ? "text-danger animate-bounce" : "text-muted")}
                  />
                }
              />
              <StatCard
                label={currentT.duplicateNames}
                value={
                  <span className={stats.duplicates > 0 ? "text-warning" : ""}>
                    {stats.duplicates}
                  </span>
                }
                icon={
                  <AlertCircle
                    className={cn("w-5 h-5", stats.duplicates > 0 ? "text-warning animate-pulse" : "text-muted")}
                  />
                }
              />
              <StatCard
                label={currentT.emptyDescriptions}
                value={stats.emptyDescriptions}
                icon={<AlertCircle className="w-5 h-5 text-muted" />}
              />
            </div>

            {/* list section */}
            <div className="card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-app pb-3 flex-wrap gap-2">
                <h2 className="text-lg font-bold">{lang === "ar" ? "مراجعة العناصر وتعديلها" : "Review & Edit Items"}</h2>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="btn-outline !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {currentT.addNewItem}
                </button>
              </div>

              {extractedItems.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-10 h-10 text-muted mx-auto mb-3 opacity-60" />
                  <p className="font-bold text-lg">{currentT.emptyStateTitle}</p>
                  <p className="text-muted text-sm mt-1">{currentT.emptyStateBody}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {extractedItems.map((item, index) => {
                    const isDupe = stats.duplicateSet.has(item.name.trim().toLowerCase());
                    const priceVal = parseFloat(item.price);
                    const isMissingPrice = !item.price.trim() || isNaN(priceVal) || priceVal === 0;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border border-app p-4 relative bg-[rgba(7,15,28,0.2)]",
                          (isDupe || isMissingPrice) && "border-l-4 border-l-danger bg-[rgba(248,113,113,0.01)]"
                        )}
                      >
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute top-3 end-3 btn-ghost !p-1.5 text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid sm:grid-cols-[2fr_1fr] gap-3 pe-8">
                          <Field
                            label={`${currentT.itemName} ${index + 1}`}
                            error={isDupe ? (lang === "ar" ? "اسم مكرر" : "Duplicate name") : undefined}
                          >
                            <input
                              className="input-base"
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                              placeholder={lang === "ar" ? "مثال: بيتزا خضروات" : "e.g. Vegetarian Pizza"}
                              maxLength={200}
                            />
                          </Field>

                          <Field
                            label={currentT.itemPrice}
                            error={isMissingPrice ? (lang === "ar" ? "السعر مطلوب" : "Price required") : undefined}
                          >
                            <input
                              className="input-base"
                              dir="ltr"
                              style={{ textAlign: "start", direction: "ltr" }}
                              inputMode="decimal"
                              value={item.price}
                              onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                              placeholder="100"
                              maxLength={50}
                            />
                          </Field>
                        </div>

                        <div className="mt-3">
                          <Field label={currentT.itemDesc}>
                            <input
                              className="input-base"
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                              placeholder={lang === "ar" ? "مثال: الحجم وسط مع جبنة إضافية" : "e.g. Medium size with extra cheese"}
                              maxLength={500}
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirm / Cancel actions */}
              <div className="flex gap-3 justify-end pt-3 border-t border-app">
                <button onClick={handleCancel} className="btn-outline">
                  {currentT.cancelBtn}
                </button>
                <button
                  onClick={confirmImport}
                  disabled={extractedItems.length === 0}
                  className="btn-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {currentT.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-app relative overflow-x-clip">
      {/* ambient decoration */}
      <div className="glow-orb w-[480px] h-[480px] bg-brand-teal -top-40 -start-40" />
      <div className="glow-orb w-[420px] h-[420px] bg-brand-navy bottom-0 -end-32" />
      <div className="grid-bg absolute inset-0 opacity-30 pointer-events-none" />

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
        }
      >
        <OnboardingImportWizard />
      </Suspense>
    </div>
  );
}
