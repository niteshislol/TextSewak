import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createWorker, Worker, PSM } from "tesseract.js";
import { toast } from "sonner";
import { Loader2, Zap, X, Trash2, Gavel } from "lucide-react";
import { motion } from "framer-motion";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { UploadDropzone } from "@/components/UploadDropzone";
import { DocumentUploadDropzone } from "@/components/DocumentUploadDropzone";
import { ImageUrlInput } from "@/components/ImageUrlInput";
import { PdfPreview } from "@/components/PdfPreview";
import { OcrResult } from "@/components/OcrResult";
import { DocumentHistory } from "@/components/DocumentHistory";
import { useDocumentHistory, type DocumentHistoryItem } from "@/hooks/use-document-history";
import { preprocessImage } from "@/utils/imagePreprocessing";
import { HowToUse } from "@/components/HowToUse";

// Dynamically import pdfjs-dist
let pdfjsLib: any = null;

const loadPdfJs = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined") {
      // Use the worker from the public folder (copied during setup)
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }
  return pdfjsLib;
};

type OcrProgress = {
  progress: number;
  status: string;
};

export default function Index() {
  const navigate = useNavigate();
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Document upload state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [pdfPageRange, setPdfPageRange] = useState<{ start: number; end: number } | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const [language, setLanguage] = useState("hindi-original");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [result, setResult] = useState("");
  const [shouldAutoExtract, setShouldAutoExtract] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "document" | null>(null);
  const [preprocessImageEnabled, setPreprocessImageEnabled] = useState(false);
  const [strictMode, setStrictMode] = useState(true);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const isProcessingRef = useRef(false);

  const { history, saveToHistory, deleteFromHistory, clearHistory } =
    useDocumentHistory();

  // Initialize worker on language change
  useEffect(() => {
    const initWorker = async () => {
      if (workerRef.current) {
        try {
          await workerRef.current.terminate();
        } catch (e) {
          console.warn("Could not terminate previous worker:", e);
        }
      }

      try {
        let ocrLangCode;
        if (language === "hindi-original") {
          ocrLangCode = "hin";
        } else {
          ocrLangCode = language === "eng" ? "eng" : `eng+${language}`;
        }

        const newWorker = await createWorker(ocrLangCode, 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress({
                status: m.status,
                progress: m.progress || 0,
              });
            }
          },
        });
        workerRef.current = newWorker;
        setWorker(newWorker);
      } catch (err) {
        console.error("Failed to initialize Tesseract worker:", err);
        toast.error("Failed to initialize OCR engine");
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate().catch(console.error);
      }
    };
  }, [language]);

  const handleImageFileChange = (newFile: File | null, autoExtract = false) => {
    setImageFile(newFile);
    setDocumentFile(null);
    setDocumentFileName(null);
    setImageUrl(null);
    setResult("");
    setShouldAutoExtract(autoExtract);
    setUploadType("image");
    setShowPdfPreview(false);
    setPdfPageRange(null);

    if (newFile) {
      setImageFileName(newFile.name);
      if (newFile.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(newFile));
      } else {
        setFilePreview(null);
      }
    } else {
      setImageFileName(null);
      setFilePreview(null);
    }
  };

  const handleImageUrlLoad = (url: string) => {
    setImageUrl(url);
    setImageFile(null);
    setImageFileName(null);
    setDocumentFile(null);
    setDocumentFileName(null);
    setResult("");
    setUploadType("image");
    setFilePreview(url);
    setShowPdfPreview(false);
    setPdfPageRange(null);
  };

  const handleDocumentFileChange = (newFile: File | null) => {
    setDocumentFile(newFile);
    setImageFile(null);
    setImageFileName(null);
    setImageUrl(null);
    setFilePreview(null);
    setResult("");
    setUploadType("document");
    setShowPdfPreview(false);
    setPdfPageRange(null);

    if (newFile) {
      setDocumentFileName(newFile.name);
      if (newFile.type === "application/pdf") {
        setShowPdfPreview(true);
        setPdfPageRange(null);
      }
    } else {
      setDocumentFileName(null);
    }
  };

  const handlePdfPageRangeChange = (start: number, end: number) => {
    setPdfPageRange({ start, end });
  };

  const handleClearAll = () => {
    setImageFile(null);
    setImageFileName(null);
    setDocumentFile(null);
    setDocumentFileName(null);
    setImageUrl(null);
    setFilePreview(null);
    setResult("");
    setProgress(null);
    setShouldAutoExtract(false);
    setUploadType(null);
    setShowPdfPreview(false);
    setPdfPageRange(null);
    setPreprocessImageEnabled(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleClear = () => {
    setResult("");
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleCancel = async () => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    if (workerRef.current) {
      try {
        await workerRef.current.terminate();
        workerRef.current = null;
        setWorker(null);
      } catch (e) {
        console.warn("Could not terminate worker:", e);
      }
    }
    setIsLoading(false);
    setProgress(null);
    toast.info("Processing cancelled");
  };

  const handleExtract = async () => {
    const currentFile = imageFile || documentFile;
    const currentImageUrl = imageUrl;

    if (!currentFile && !currentImageUrl) {
      toast.error("Please upload a file or enter an image URL first.");
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    isProcessingRef.current = true;
    setProgress({ status: "Initializing...", progress: 0 });
    setResult("");

    try {
      let extractedText = "";

      // Handle image OCR (from file or URL)
      if (uploadType === "image" && (currentFile?.type.startsWith("image/") || currentImageUrl)) {
        if (!workerRef.current) {
          let ocrLangCode;
          if (language === "hindi-original") {
            ocrLangCode = "hin";
          } else {
            ocrLangCode = language === "eng" ? "eng" : `eng+${language}`;
          }

          workerRef.current = await createWorker(ocrLangCode, 1, {
            logger: (m) => {
              setProgress({
                status: m.status,
                progress: m.progress || 0,
              });
            },
          });
          setWorker(workerRef.current);
        }

        // --- SPECIFIC LOGIC FOR HINDI ORIGINAL ---
        if (language === "hindi-original") {
          // 1. PSM 6: Assume a single uniform block of text (Good for pages)
          await workerRef.current.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          });

          // 2. White-listing: Banning English characters if strict mode is on
          if (strictMode) {
            // Allow only Devanagari Unicode range + basic punctuation + numbers
            const hindiWhitelist =
              " \u0900\u0901\u0902\u0903\u0904\u0905\u0906\u0907\u0908\u0909\u090a\u090b\u090c\u090d\u090e\u090f\u0910\u0911\u0912\u0913\u0914\u0915\u0916\u0917\u0918\u0919\u091a\u091b\u091c\u091d\u091e\u091f\u0920\u0921\u0922\u0923\u0924\u0925\u0926\u0927\u0928\u0929\u092a\u092b\u092c\u092d\u092e\u092f\u0930\u0931\u0932\u0933\u0934\u0935\u0936\u0937\u0938\u0939\u093a\u093b\u093c\u093d\u093e\u093f\u0940\u0941\u0942\u0943\u0944\u0945\u0946\u0947\u0948\u0949\u094a\u094b\u094c\u094d\u094e\u094f\u0950\u0951\u0952\u0953\u0954\u0955\u0956\u0957\u0958\u0959\u095a\u095b\u095c\u095d\u095e\u095f\u0960\u0961\u0962\u0963\u0964\u0965\u0966\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0970\u0971\u0972\u0973\u0974\u0975\u0976\u0977\u0978\u0979\u097a\u097b\u097c\u097d\u097e\u097f.,-!?\"'";
            await workerRef.current.setParameters({
              tessedit_char_whitelist: hindiWhitelist,
            });
          }
        }

        let imageToProcess: File | HTMLImageElement | HTMLCanvasElement;

        if (currentImageUrl) {
          // Load image from URL
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = currentImageUrl;
          });

          if (preprocessImageEnabled) {
            imageToProcess = preprocessImage(img);
          } else {
            imageToProcess = img;
          }
        } else if (currentFile) {
          if (preprocessImageEnabled) {
            // Load image and preprocess
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = URL.createObjectURL(currentFile);
            });
            imageToProcess = preprocessImage(img);
          } else {
            imageToProcess = currentFile;
          }
        } else {
          throw new Error("No image to process");
        }

        if (!isProcessingRef.current) {
          throw new Error("Processing cancelled");
        }

        const { data: { text } } = await workerRef.current.recognize(imageToProcess);
        extractedText = text;
        setResult(text);
        toast.success("Text extracted successfully!");

        if (currentFile) {
          await saveToHistory(currentFile, extractedText, language);
        }
      }
      // Handle PDF processing
      else if (uploadType === "document" && currentFile?.type === "application/pdf") {
        if (!workerRef.current) {
          const ocrLangCode = language === "eng" ? "eng" : `eng+${language}`;
          workerRef.current = await createWorker(ocrLangCode, 1, {
            logger: (m) => {
              setProgress({
                status: m.status,
                progress: m.progress || 0,
              });
            },
          });
          setWorker(workerRef.current);
        }

        const pdfjs = await loadPdfJs();
        const arrayBuffer = await currentFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        let start = pdfPageRange?.start || 1;
        let end = pdfPageRange?.end || numPages;
        if (end === 0 || end > numPages) end = numPages;
        if (start < 1) start = 1;
        if (start > end) [start, end] = [end, start];

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Failed to get canvas context");

        const fullText: string[] = [];

        for (let i = start; i <= end; i++) {
          if (!isProcessingRef.current) {
            throw new Error("Processing cancelled");
          }

          setProgress({
            status: `Processing page ${i} of ${numPages}...`,
            progress: (i - start) / (end - start + 1),
          });

          const page = await pdf.getPage(i);
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport }).promise;

          if (!isProcessingRef.current) {
            throw new Error("Processing cancelled");
          }

          let imageToProcess: HTMLCanvasElement = canvas;
          if (preprocessImageEnabled) {
            const img = new Image();
            img.src = canvas.toDataURL();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            imageToProcess = preprocessImage(img);
          }

          const { data: { text } } = await workerRef.current.recognize(imageToProcess);
          fullText.push(text);
        }

        extractedText = fullText.join("\n\n");
        setResult(extractedText);
        toast.success("PDF processed successfully!");

        await saveToHistory(currentFile, extractedText, language);
      }
      // Handle Word documents (server-side)
      else if (uploadType === "document" && currentFile?.type.includes("word")) {
        setProgress({
          status: "Processing document on server...",
          progress: 0.5,
        });
        const formData = new FormData();
        formData.append("file", currentFile);
        formData.append("language", language);

        const response = await fetch("/api/process-doc", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to process document");
        }

        const data = await response.json();
        extractedText = data.text;
        setResult(data.text);
        toast.success("Document processed successfully!");

        await saveToHistory(currentFile, extractedText, language);
      } else {
        throw new Error("Unsupported file type.");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === "Processing cancelled") {
        toast.info("Processing cancelled by user");
      } else {
        toast.error(
          error instanceof Error ? error.message : "An unknown error occurred.",
        );
      }
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      isProcessingRef.current = false;
      setProgress(null);
    }
  };

  useEffect(() => {
    if (shouldAutoExtract && (imageFile || documentFile || imageUrl)) {
      handleExtract();
      setShouldAutoExtract(false);
    }
  }, [shouldAutoExtract, imageFile, documentFile, imageUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          {/* Document Upload Section */}
          <DocumentUploadDropzone
            onFileChange={handleDocumentFileChange}
            fileName={documentFileName}
            disabled={isLoading}
          />

          {/* PDF Preview */}
          {showPdfPreview && documentFile && documentFile.type === "application/pdf" && (
            <div className="w-full mt-4">
              <PdfPreview
                pdfFile={documentFile}
                onPageRangeChange={handlePdfPageRangeChange}
                onClose={() => setShowPdfPreview(false)}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Separator */}
          <div className="w-full h-px bg-border my-8" />

          {/* Image Upload Section */}
          <UploadDropzone
            onFileChange={handleImageFileChange}
            filePreview={filePreview}
            fileName={imageFileName}
            disabled={isLoading}
          />

          {/* Image URL Input */}
          <div className="w-full mt-4">
            <ImageUrlInput
              onImageLoad={handleImageUrlLoad}
              disabled={isLoading}
            />
          </div>

          {/* Pre-processing Toggle */}
          {uploadType === "image" && (filePreview || imageUrl) && (
            <div className="w-full mt-4 flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
              <input
                type="checkbox"
                id="preprocess-toggle"
                checked={preprocessImageEnabled}
                onChange={(e) => setPreprocessImageEnabled(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
              />
              <div className="flex-1">
                <label
                  htmlFor="preprocess-toggle"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Improve Low-Contrast/Blurry Image
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Only check this if the image is blurry or has bad lighting (like a photo of a screen).
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-center mt-6">
            <LanguageSelector
              language={language}
              setLanguage={setLanguage}
              disabled={isLoading}
            />
            {language === "hindi-original" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="strict-mode"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                />
                <label
                  htmlFor="strict-mode"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Strict Hindi (No English)
                </label>
              </div>
            )}
            <div className="flex gap-2">
              {isLoading && isProcessing && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
              )}
              <button
                onClick={handleExtract}
                disabled={isLoading || (!imageFile && !documentFile && !imageUrl)}
                className="px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Zap size={20} />
                )}
                {isLoading ? "Extracting..." : "Extract Text"}
              </button>
            </div>
          </div>

          {/* Clear All Button */}
          {(imageFile || documentFile || imageUrl || result) && (
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear All
            </button>
          )}

          {/* Progress Indicator */}
          {isLoading && progress && (
            <div className="w-full mt-6 text-center">
              <p className="text-sm text-accent mb-2 capitalize">
                {progress.status}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <motion.div
                  className="bg-primary h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Result Box */}
          <OcrResult
            text={result}
            onClear={handleClear}
            onTextChange={(newText) => setResult(newText)}
          />

          {result && (
            <div className="w-full flex justify-end mt-4">
              <button
                onClick={() => navigate("/legalanalysis", { state: { text: result } })}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2"
              >
                <Gavel size={20} />
                Do Legal Analysis
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* Fixed Help Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40 mb-16 md:mb-0">
        <HowToUse />
      </div>

      <Footer />
    </div>
  );
}
