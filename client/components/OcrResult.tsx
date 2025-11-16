import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Download,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Volume2,
  Square,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Document, Packer, Paragraph, AlignmentType } from "docx";
import html2canvas from "html2canvas";
import { useTheme } from "@/hooks/use-theme";
import { PdfExportModal } from "./PdfExportModal";
import { toast } from "sonner";

interface OcrResultProps {
  text: string;
  onClear: () => void;
  onTextChange?: (text: string) => void;
}

export function OcrResult({ text, onClear, onTextChange }: OcrResultProps) {
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [isReading, setIsReading] = useState(false);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownloadAsText = () => {
    const element = document.createElement("a");
      const file = new Blob([editedText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setShowDownloadMenu(false);
  };

  const handleDownloadAsPDF = () => {
    setShowDownloadMenu(false);
    setShowPdfModal(true);
  };

  const handleDownloadAsDocx = async () => {
    setIsDownloading(true);
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
                text: "",
              }),
              ...editedText.split("\n").map(
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
      element.download = `extracted-text-${Date.now()}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAsImage = async () => {
    setIsDownloading(true);
    try {
      if (!textContainerRef.current) return;

      const originalStyles = textContainerRef.current.getAttribute("style");
      const isDarkMode = theme === "dark";
      const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
      const textColor = isDarkMode ? "#f3f4f6" : "#000000";

      textContainerRef.current.style.maxHeight = "none";
      textContainerRef.current.style.overflow = "visible";
      textContainerRef.current.style.backgroundColor = bgColor;
      textContainerRef.current.style.color = textColor;
      textContainerRef.current.style.padding = "24px";

      const canvas = await html2canvas(textContainerRef.current, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      if (originalStyles) {
        textContainerRef.current.setAttribute("style", originalStyles);
      } else {
        textContainerRef.current.removeAttribute("style");
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const element = document.createElement("a");
        element.href = url;
        element.download = `extracted-text-${Date.now()}.png`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(url);
        setShowDownloadMenu(false);
      }, "image/png");
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReadAloud = () => {
    if (!editedText.trim()) {
      toast.error("No text to read");
      return;
    }

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    setIsReading(true);
    const utterance = new SpeechSynthesisUtterance(editedText);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => {
      setIsReading(false);
      toast.error("Failed to read text");
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleStopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
  };

  const handleCleanText = () => {
    if (!editedText) return;

    let cleaned = editedText;
    // Replace 3 or more line breaks with two (preserving paragraphs)
    cleaned = cleaned.replace(/(\r\n|\n|\r){3,}/g, "\n\n");
    // Fix single line breaks within sentences (a common OCR issue)
    cleaned = cleaned.replace(/([.?!])\s*\n\s*([A-Z])/g, "$1 $2"); // Joins sentences split by a newline
    cleaned = cleaned.replace(/([a-z,])\n([a-z])/g, "$1 $2"); // Joins words split by a newline

    setEditedText(cleaned);
    if (onTextChange) {
      onTextChange(cleaned);
    }
    toast.success("Text cleaned!");
  };

  const handleTextChange = (newText: string) => {
    setEditedText(newText);
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  if (!text && !editedText) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-8"
    >
      <label className="block text-sm font-medium text-foreground mb-4">
        Extracted Text
      </label>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-foreground">OCR Result</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleReadAloud}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              {isReading ? (
                <>
                  <Square size={16} />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Volume2 size={16} />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            <button
              onClick={handleStopReading}
              disabled={!isReading}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square size={16} />
              <span>Stop</span>
            </button>

            <button
              onClick={handleCleanText}
              disabled={!editedText}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={16} />
              <span>Clean Text</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} className="text-accent" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
                <ChevronDown size={16} />
              </button>

              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50"
                >
                  <button
                    onClick={handleDownloadAsText}
                    disabled={isDownloading}
                    className="w-full text-left px-4 py-2.5 text-sm rounded-t-lg hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>📄</span>
                    <span>Text (.txt)</span>
                  </button>
                  <button
                    onClick={handleDownloadAsPDF}
                    disabled={isDownloading}
                    className="w-full text-left px-4 py-2.5 text-sm border-t border-border hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>📕</span>
                    <span>PDF (.pdf)</span>
                  </button>
                  <button
                    onClick={handleDownloadAsDocx}
                    disabled={isDownloading}
                    className="w-full text-left px-4 py-2.5 text-sm border-t border-border hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>📘</span>
                    <span>Word (.docx)</span>
                  </button>
                  <button
                    onClick={handleDownloadAsImage}
                    disabled={isDownloading}
                    className="w-full text-left px-4 py-2.5 text-sm border-t border-border rounded-b-lg hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>🖼️</span>
                    <span>Image (.png)</span>
                  </button>
                </motion.div>
              )}
            </div>

            <button
              onClick={onClear}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div ref={textContainerRef} className="p-6 max-h-96 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => handleTextChange(e.target.value)}
            className="w-full h-48 p-3 bg-background border border-border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-mono text-sm leading-relaxed"
            placeholder="Extracted text will appear here..."
          />
        </div>
      </div>

      <PdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        text={editedText}
      />
    </motion.div>
  );
}
