import { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface DocumentUploadDropzoneProps {
  onFileChange: (file: File | null) => void;
  fileName: string | null;
  disabled?: boolean;
}

export function DocumentUploadDropzone({
  onFileChange,
  fileName,
  disabled = false,
}: DocumentUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidDocumentFile(file)) {
        onFileChange(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidDocumentFile(file)) {
        onFileChange(file);
      }
    }
  };

  const isValidDocumentFile = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".pdf", ".docx"];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    return hasValidType || hasValidExtension;
  };

  const getFileIcon = () => {
    if (!fileName) return null;
    if (fileName.toLowerCase().endsWith(".pdf")) {
      return "📄";
    } else if (fileName.toLowerCase().endsWith(".docx")) {
      return "📝";
    }
    return "📋";
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-4">
        Upload Document (Word or PDF)
      </label>

      {fileName ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-card border-2 border-primary rounded-lg p-6 text-center"
        >
          <div className="text-4xl mb-3">{getFileIcon()}</div>
          <p className="text-sm font-semibold text-foreground truncate">
            {fileName}
          </p>
          <button
            onClick={() => onFileChange(null)}
            disabled={disabled}
            className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            Remove File
          </button>
        </motion.div>
      ) : (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <FileText size={32} className="mx-auto mb-3 text-primary" />
          <p className="text-sm font-semibold text-foreground mb-2">
            Drag and drop your document here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            or click to browse (PDF, DOCX)
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            Choose Document
          </button>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
