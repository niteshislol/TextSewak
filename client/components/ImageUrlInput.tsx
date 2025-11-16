import { useState } from "react";
import { Link, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ImageUrlInputProps {
  onImageLoad: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageUrlInput({
  onImageLoad,
  disabled = false,
}: ImageUrlInputProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    const url = imageUrl.trim();
    if (!url) {
      toast.error("Please enter an image URL");
      return;
    }

    setIsLoading(true);
    try {
      // Validate URL
      new URL(url);

      // Create an image to test if it loads
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () =>
          reject(
            new Error(
              "Failed to load image. Check the URL and CORS policy.",
            ),
          );
        img.src = url;
      });

      onImageLoad(url);
      toast.success("Image loaded successfully!");
    } catch (error) {
      console.error("Failed to load image from URL:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load image. Please check the URL.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled && !isLoading) {
      handleLoad();
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        Or Enter Image URL
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/image.png"
            disabled={disabled || isLoading}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleLoad}
          disabled={disabled || isLoading || !imageUrl.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <span>Load</span>
          )}
        </button>
      </div>
    </div>
  );
}

