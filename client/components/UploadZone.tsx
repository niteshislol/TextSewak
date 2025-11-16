import { Upload, Image as ImageIcon, FileText, X } from "lucide-react";
import { useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
}

const ACCEPTED_FORMATS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

export function UploadZone({
  onFileSelect,
  selectedFile,
  onRemoveFile,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (ACCEPTED_FORMATS.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert(
        "Please upload a valid file format (PDF, Word, PNG, JPG, WEBP, or HEIC)",
      );
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;

    if (selectedFile.type.startsWith("image/")) {
      return <ImageIcon className="w-6 h-6 text-accent" />;
    }
    return <FileText className="w-6 h-6 text-accent" />;
  };

  if (selectedFile) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-foreground mb-2">
          Selected File
        </label>
        <div className="flex items-center justify-between p-4 border-2 border-primary bg-secondary rounded-lg">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <p className="font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={onRemoveFile}
            className="p-2 hover:bg-background rounded-lg transition-colors"
            aria-label="Remove file"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        Upload Document or Image
      </label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary hover:bg-secondary"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-3 text-primary" />
        <p className="font-semibold text-foreground mb-1">
          Drag and drop your file here
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse (PDF, Word, PNG, JPG, WEBP, HEIC)
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Choose File
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="px-4 py-2 border border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors"
          >
            Use Camera
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic"
        onChange={handleFileInput}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  );
}
