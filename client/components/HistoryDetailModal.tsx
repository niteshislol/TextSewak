import { useRef, useState } from "react";
import { X, Copy, Download, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { DocumentHistoryItem } from "@/hooks/use-document-history";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, AlignmentType } from "docx";
import { toast } from "sonner";
import { PdfExportModal } from "./PdfExportModal";

interface HistoryDetailModalProps {
  item: DocumentHistoryItem;
  onClose: () => void;
}

export function HistoryDetailModal({ item, onClose }: HistoryDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownloadAsText = () => {
    const element = document.createElement("a");
    const file = new Blob([item.extractedText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${item.fileName}-extracted-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAsDocx = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: "Extracted Text",
                style: "Heading1",
              }),
              new Paragraph({
                text: `From: ${item.fileName}`,
                style: "Normal",
              }),
              new Paragraph({
                text: `Extracted on: ${new Date(item.createdAt).toLocaleString()}`,
                style: "Normal",
              }),
              new Paragraph({
                text: "",
              }),
              ...item.extractedText.split("\n").map(
                (line) =>
                  new Paragraph({
                    text: line || " ",
                    alignment: AlignmentType.LEFT,
                  }),
              ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.href = url;
      element.download = `${item.fileName}-extracted-${Date.now()}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      toast.success("Document downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
      toast.error("Failed to download document");
    }
  };

  const handleDownloadAsImage = async () => {
    try {
      if (!textContainerRef.current) return;

      const canvas = await html2canvas(textContainerRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const element = document.createElement("a");
        element.href = url;
        element.download = `${item.fileName}-extracted-${Date.now()}.png`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(url);
        toast.success("Image downloaded successfully!");
      }, "image/png");
    } catch (err) {
      console.error("Failed to generate image:", err);
      toast.error("Failed to download image");
    }
  };

  return (
    <>
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
          className="bg-card rounded-lg overflow-hidden w-full max-w-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {item.fileName}
              </h2>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div
              ref={textContainerRef}
              className="text-foreground whitespace-pre-wrap leading-relaxed font-mono text-sm bg-secondary/30 p-4 rounded-lg"
            >
              {item.extractedText}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 bg-secondary/30 flex gap-3 flex-wrap justify-end border-t border-border">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={18} className="text-accent" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Copy</span>
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadAsText}
                title="Download as text file"
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
              >
                📄 TXT
              </button>
              <button
                onClick={() => setShowPdfModal(true)}
                title="Download as PDF"
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
              >
                📕 PDF
              </button>
              <button
                onClick={handleDownloadAsDocx}
                title="Download as Word document"
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
              >
                📘 DOCX
              </button>
              <button
                onClick={handleDownloadAsImage}
                title="Download as image"
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
              >
                🖼️ PNG
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        text={item.extractedText}
      />
    </>
  );
}
