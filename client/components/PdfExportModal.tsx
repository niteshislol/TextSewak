import { useRef, useState } from "react";
import { X, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export function PdfExportModal({ isOpen, onClose, text }: PdfExportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleConvert = () => {
    if (!text || text.trim().length === 0) {
      toast.error("No text to convert");
      return;
    }

    setIsLoading(true);
    setStatus("Preparing searchable PDF...");

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      setIsLoading(false);
      return;
    }

    // Write content
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Extracted_Text_${Date.now()}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    padding: 40px;
                    color: #000;
                    background: #fff;
                }
                pre {
                    white-space: pre-wrap;
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    font-size: 14pt;
                    line-height: 1.6;
                }
                h1 { text-align: center; font-size: 18pt; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>Extracted Text</h1>
            <pre>${text}</pre>
            <script>
                window.onload = function() {
                    // Slight delay to ensure fonts load
                    setTimeout(function() {
                        window.print();
                        window.parent.postMessage('print-closed', '*');
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    doc.close();

    // Listen for completion (approximate)
    toast.info("Please select 'Save as PDF' in the print dialog.");

    setTimeout(() => {
      document.body.removeChild(iframe);
      setIsLoading(false);
      setStatus(null);
      onClose();
    }, 2000); // Wait long enough for dialog to trigger
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-card rounded-lg overflow-hidden w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Export PDF</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-medium">Download as PDF</h3>
              <p className="text-sm text-muted-foreground">Save the extracted text as a clean PDF document.</p>
            </div>
          </div>

          {status && (
            <div className="text-sm text-center text-blue-500 animate-pulse">{status}</div>
          )}
        </div>

        <div className="p-4 bg-secondary/30 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md hover:bg-secondary transition-colors">Cancel</button>
          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? "Generating..." : <><Download size={16} /> Download PDF</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
