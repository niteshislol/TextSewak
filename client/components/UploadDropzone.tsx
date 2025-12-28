import { useRef, useState } from "react";
import { Upload, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { CameraCapture } from "./CameraCapture";
import { ImageCropModal } from "./ImageCropModal";

interface UploadDropzoneProps {
  onFileChange: (file: File | null, autoExtract?: boolean) => void;
  filePreview: string | null;
  fileName: string | null;
  disabled?: boolean;
}

export function UploadDropzone({
  onFileChange,
  filePreview,
  fileName,
  disabled = false,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

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
      handleFileProcess(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileProcess = (file: File) => {
    if (file.type.startsWith("image/")) {
      setPendingImageFile(file);
      setShowCropModal(true);
    } else {
      onFileChange(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    onFileChange(croppedFile);
    setPendingImageFile(null);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-4">
        Upload Image or Other Files
      </label>

      {filePreview && fileName ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-card border-2 border-primary rounded-lg p-6 text-center"
        >
          <img
            src={filePreview}
            alt={fileName}
            className="w-full max-h-64 object-contain mx-auto mb-4 rounded-lg"
          />
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
          className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Upload size={32} className="mx-auto mb-3 text-primary" />
          <p className="text-sm font-semibold text-foreground mb-2">
            Drag and drop your file here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            or click to browse (PNG, JPG, JPEG, WEBP, HEIC)
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose File
            </button>
            <button
              onClick={() => setShowCameraModal(true)}
              disabled={disabled}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Use device camera to capture document"
            >
              <Camera size={18} />
              Use Camera
            </button>
          </div>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".png,.jpg,.jpeg,.webp,.heic,image/png,image/jpeg,image/webp,image/heic"
        className="hidden"
        disabled={disabled}
      />

      <CameraCapture
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => {
          handleFileProcess(file);
          setShowCameraModal(false);
        }}
        disabled={disabled}
      />

      {pendingImageFile && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setPendingImageFile(null);
          }}
          onCrop={handleCropComplete}
          imageFile={pendingImageFile}
        />
      )}
    </div>
  );
}
