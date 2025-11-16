import { useRef, useState } from "react";
import { X, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { textToDocx, docxToHtml } from "@/utils/textToDocx";
import { convertDocxToSearchablePdf, textToHtml } from "@/utils/docxToPdf";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export function PdfExportModal({ isOpen, onClose, text }: PdfExportModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!text || text.trim().length === 0) {
      toast.error("No text to convert");
      return;
    }

    setIsLoading(true);
    setStatus("Converting text to DOCX...");

    try {
      // Step 1: Convert text to DOCX
      const docxBlob = await textToDocx(text, "Extracted Text");
      setStatus("Converting DOCX to HTML...");

      // Step 2: Convert DOCX to HTML using mammoth.js
      const htmlContent = await docxToHtml(docxBlob);
      setStatus("Opening print dialog for searchable PDF...");

      // Step 3: Convert HTML to searchable PDF using browser print
      await convertDocxToSearchablePdf(htmlContent, `extracted-text-${Date.now()}.pdf`);

      toast.success(
        "Print dialog opened! Select 'Save as PDF' to download searchable PDF.",
        { duration: 5000 }
      );

      // Close modal after a delay
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      setStatus(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate PDF. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-card rounded-lg overflow-hidden w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <h2 className="text-lg font-semibold text-foreground">
            Export as PDF
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center">
            <div
              ref={previewRef}
              id="preview-content"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "15mm",
                background: "white",
                margin: "auto",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              className="text-black rounded-sm"
            >
              {/* A4 Page Content - Preview of what will be in PDF */}
              <div className="prose prose-sm max-w-none">
                <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
                  Extracted Document
                </h1>
                <div
                  style={{
                    fontSize: "11pt",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: textToHtml(text) }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-3 border-t border-border bg-secondary/20">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                Searchable PDF Export
              </p>
              <p>
                This will create a <strong>searchable PDF</strong> (not an image).
                The print dialog will open - select <strong>"Save as PDF"</strong> or{" "}
                <strong>"Print to PDF"</strong> as the destination.
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-3 bg-blue-50 dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800"
          >
            <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
              {status}
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="p-4 bg-secondary/30 flex gap-3 justify-end border-t border-border">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Download size={18} />
            {isLoading ? "Converting..." : "Convert & Download PDF"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
