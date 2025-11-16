import { useRef, useState, useEffect } from "react";
import { X, Camera as CameraIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export function CameraCapture({
  isOpen,
  onClose,
  onCapture,
  disabled = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startCamera = async () => {
    try {
      setIsInitializing(true);
      setCameraError(null);
      setIsCameraReady(false);

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          "Camera access is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.",
        );
        setIsInitializing(false);
        return;
      }

      let stream: MediaStream | null = null;

      // Try with environment-facing camera first (rear camera on mobile)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (environmentError) {
        console.warn(
          "Environment-facing camera not available, trying user-facing:",
          environmentError,
        );

        // Try with user-facing camera (front camera on mobile)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "user" },
            },
            audio: false,
          });
        } catch (userFacingError) {
          console.warn(
            "User-facing camera not available, trying basic camera access:",
            userFacingError,
          );

          // Fall back to basic camera access with no constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready before setting isCameraReady
        const onLoadedMetadata = () => {
          setIsCameraReady(true);
          setCameraError(null);
          videoRef.current?.removeEventListener(
            "loadedmetadata",
            onLoadedMetadata,
          );
        };

        videoRef.current.addEventListener("loadedmetadata", onLoadedMetadata);

        // Timeout fallback in case loadedmetadata doesn't fire
        const timeoutId = setTimeout(() => {
          setIsCameraReady(true);
          setCameraError(null);
        }, 3000);

        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Failed to access camera:", error);

      let errorMessage = "Unable to access camera";
      let errorDetails = "";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera permission denied";
          errorDetails =
            "Please allow camera access in your browser settings and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera device found";
          errorDetails =
            "Make sure a camera is connected to your device and is not in use by another application.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is in use";
          errorDetails =
            "The camera is being used by another application. Close it and try again.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Camera configuration not supported";
          errorDetails =
            "Your camera doesn't support the required settings. Please try again.";
        } else if (error.name === "TimeoutError") {
          errorMessage = "Camera request timed out";
          errorDetails = "Please check your connection and try again.";
        } else if (error.name === "TypeError") {
          errorMessage = "Secure connection required";
          errorDetails = "Camera access requires HTTPS or localhost.";
        } else {
          errorDetails = error.message || String(error);
        }
      } else if (error instanceof Error) {
        errorDetails = error.message;
      }

      const fullErrorMessage = errorDetails
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;

      setCameraError(fullErrorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let cleanupTimeout: number | undefined;
    startCamera().then((cleanup) => {
      if (cleanup) cleanupTimeout = cleanup as unknown as number;
    });

    return () => {
      if (cleanupTimeout) clearTimeout(cleanupTimeout);
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    try {
      const context = canvasRef.current.getContext("2d");
      if (!context) throw new Error("Failed to get canvas context");

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Failed to capture photo");
            return;
          }

          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          onCapture(file);
          stopCamera();
          onClose();
          toast.success("Photo captured!");
        },
        "image/jpeg",
        0.95,
      );
    } catch (error) {
      console.error("Failed to capture photo:", error);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
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
        className="bg-card rounded-lg overflow-hidden w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Take Photo</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-black relative aspect-video w-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 gap-4">
              <AlertCircle size={40} className="text-red-500 flex-shrink-0" />
              <div className="text-center">
                <p className="text-sm font-medium mb-1">{cameraError}</p>
                <p className="text-xs text-gray-300">
                  Try these troubleshooting steps:
                </p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1">
                  <li>• Make sure a camera is connected to your device</li>
                  <li>• Check that no other app is using the camera</li>
                  <li>• Allow camera permissions in browser settings</li>
                  <li>• Try refreshing the page</li>
                </ul>
              </div>
              <button
                onClick={startCamera}
                disabled={isInitializing}
                className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isInitializing ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {!isCameraReady && !cameraError && (
            <div className="text-white text-center">
              <p>Initializing camera...</p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 bg-secondary/30 flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={isCapturing || disabled || !isCameraReady}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CameraIcon size={18} />
            {isCapturing ? "Capturing..." : "Capture Photo"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
