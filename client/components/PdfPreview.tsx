import { useState, useEffect, useRef } from "react";
import { FileText, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

interface PdfPreviewProps {
  pdfFile: File;
  onPageRangeChange: (start: number, end: number) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function PdfPreview({
  pdfFile,
  onPageRangeChange,
  onClose,
  disabled = false,
}: PdfPreviewProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setEndPage(pdf.numPages);
        setPreviewPage(1);
        await renderPage(1, pdf);
      } catch (error) {
        console.error("Failed to load PDF:", error);
        toast.error("Failed to load PDF file");
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfFile]);

  const renderPage = async (pageNum: number, doc?: any) => {
    const pdf = doc || pdfDoc;
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewImage(dataUrl);
    } catch (error) {
      console.error("Failed to render PDF page:", error);
      toast.error("Failed to render PDF page");
    }
  };

  useEffect(() => {
    if (pdfDoc && previewPage) {
      renderPage(previewPage);
    }
  }, [previewPage, pdfDoc]);

  const handleStartPageChange = (value: number) => {
    const newStart = Math.max(1, Math.min(value, totalPages));
    setStartPage(newStart);
    if (newStart > endPage) {
      setEndPage(newStart);
    }
    onPageRangeChange(newStart, endPage);
  };

  const handleEndPageChange = (value: number) => {
    const newEnd = Math.max(startPage, Math.min(value, totalPages));
    setEndPage(newEnd);
    onPageRangeChange(startPage, newEnd);
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <FileText size={20} className="animate-pulse" />
          <span>Loading PDF...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-card border border-border rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          <h3 className="font-semibold text-foreground">PDF Preview</h3>
        </div>
        <button
          onClick={onClose}
          disabled={disabled}
          className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          Total pages: {totalPages}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              Start Page
            </label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={startPage}
              onChange={(e) => handleStartPageChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              End Page
            </label>
            <input
              type="number"
              min={startPage}
              max={totalPages}
              value={endPage}
              onChange={(e) => handleEndPageChange(parseInt(e.target.value) || totalPages)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Preview (Page {previewPage})
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                disabled={disabled || previewPage === 1}
                className="px-2 py-1 text-sm border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPreviewPage(Math.min(totalPages, previewPage + 1))}
                disabled={disabled || previewPage === totalPages}
                className="px-2 py-1 text-sm border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <img
              src={previewImage}
              alt={`PDF page ${previewPage}`}
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}

