import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  imageFile: File;
}

type AspectRatio = {
  label: string;
  ratio: number | null;
};

const ASPECT_RATIOS: AspectRatio[] = [
  { label: "Original", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "2:3", ratio: 2 / 3 },
];

type DragHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | "move"
  | null;

export function ImageCropModal({
  isOpen,
  onClose,
  onCrop,
  imageFile,
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageSrc, setImageSrc] = useState<string>("");
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  // cropArea is now normalized (0 to 1)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setSelectedRatio(null);
      setImageLoaded(false);
      // Initialize to full image (0-1)
      setCropArea({ x: 0, y: 0, width: 1, height: 1 });
    };
    reader.readAsDataURL(imageFile);
  }, [isOpen, imageFile]);

  // Sync wrapper dimensions with image using deterministic calculation
  useEffect(() => {
    if (!imageRef.current || !wrapperRef.current || !containerRef.current || !imageLoaded) return;

    const img = imageRef.current;
    const wrapper = wrapperRef.current;
    const container = containerRef.current;

    const updateDimensions = () => {
      const containerRect = container.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (containerRect.width > 0 && containerRect.height > 0 && naturalWidth > 0 && naturalHeight > 0) {
        // Calculate scale to fit image within container while maintaining aspect ratio
        const scale = Math.min(
          containerRect.width / naturalWidth,
          containerRect.height / naturalHeight
        );

        const finalWidth = naturalWidth * scale;
        const finalHeight = naturalHeight * scale;

        wrapper.style.width = `${finalWidth}px`;
        wrapper.style.height = `${finalHeight}px`;
      }
    };

    // Initial update
    updateDimensions();

    // Observe changes
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);
    resizeObserver.observe(img);

    return () => resizeObserver.disconnect();
  }, [imageLoaded, imageSrc]);

  const handleImageLoad = () => {
    if (!imageRef.current) return;
    setImageLoaded(true);
    // No need to set cropArea here as it's initialized to 0-1 in the file reader callback
  };

  const getImageDisplayDimensions = (): { width: number; height: number } => {
    if (!imageRef.current) return { width: 0, height: 0 };

    const rect = imageRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  };

  const constrainCropArea = (area: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): {
    x: number;
    y: number;
    width: number;
    height: number;
  } => {
    let { x, y, width, height } = area;

    // Constrain to 0-1 bounds
    x = Math.max(0, Math.min(x, 1));
    y = Math.max(0, Math.min(y, 1));
    width = Math.min(width, 1 - x);
    height = Math.min(height, 1 - y);

    return { x, y, width: Math.max(0, width), height: Math.max(0, height) };
  };

  const getMousePosNormalized = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageRef.current) return { x: 0, y: 0 };

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Return normalized coordinates (0-1)
    return {
      x: Math.max(0, Math.min(x / rect.width, 1)),
      y: Math.max(0, Math.min(y / rect.height, 1)),
    };
  };

  const applyAspectRatio = (
    area: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    ratio: number | null,
    imgNaturalWidth: number,
    imgNaturalHeight: number,
  ) => {
    if (!ratio || ratio <= 0 || imgNaturalWidth === 0 || imgNaturalHeight === 0) {
      return area;
    }

    let newWidth = area.width;
    let newHeight = area.height;

    // Calculate height based on width and aspect ratio
    // ratio = (width * imgW) / (height * imgH)
    // height = (width * imgW) / (ratio * imgH)
    const targetHeight = (newWidth * imgNaturalWidth) / (ratio * imgNaturalHeight);

    if (targetHeight <= newHeight) {
      newHeight = targetHeight;
    } else {
      // width = (height * ratio * imgH) / imgW
      newWidth = (newHeight * ratio * imgNaturalHeight) / imgNaturalWidth;
    }

    // Constrain to bounds
    let newX = area.x;
    let newY = area.y;

    if (newX + newWidth > 1) {
      newX = Math.max(0, 1 - newWidth);
    }
    if (newY + newHeight > 1) {
      newY = Math.max(0, 1 - newHeight);
    }

    return { x: newX, y: newY, width: newWidth, height: newHeight };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;

    e.preventDefault();
    const pos = getMousePosNormalized(e);
    setIsDrawing(true);
    setDragHandle("move");
    setStartPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !imageRef.current) return;

    const pos = getMousePosNormalized(e);
    const img = imageRef.current;

    let newCropArea = { ...cropArea };

    if (dragHandle === "move") {
      // Create new crop area by dragging from start position
      let x1 = startPos.x;
      let y1 = startPos.y;
      let x2 = pos.x;
      let y2 = pos.y;

      if (x2 < x1) [x1, x2] = [x2, x1];
      if (y2 < y1) [y1, y2] = [y2, y1];

      newCropArea = {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
      };

      newCropArea = applyAspectRatio(
        newCropArea,
        selectedRatio,
        img.naturalWidth,
        img.naturalHeight,
      );
    } else if (dragHandle) {
      // Handle corner/edge dragging
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      let newX = cropArea.x;
      let newY = cropArea.y;
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;

      if (dragHandle.includes("w")) {
        newX = Math.max(0, cropArea.x + dx);
        newWidth = Math.max(0.01, cropArea.width - dx); // Min width 1%
      }
      if (dragHandle.includes("e")) {
        newWidth = Math.max(0.01, cropArea.width + dx);
      }
      if (dragHandle.includes("n")) {
        newY = Math.max(0, cropArea.y + dy);
        newHeight = Math.max(0.01, cropArea.height - dy); // Min height 1%
      }
      if (dragHandle.includes("s")) {
        newHeight = Math.max(0.01, cropArea.height + dy);
      }

      newCropArea = { x: newX, y: newY, width: newWidth, height: newHeight };
      newCropArea = applyAspectRatio(
        newCropArea,
        selectedRatio,
        img.naturalWidth,
        img.naturalHeight,
      );

      setStartPos(pos);
    }

    // Constrain to image bounds before setting
    newCropArea = constrainCropArea(newCropArea);
    setCropArea(newCropArea);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDragHandle(null);
  };

  const handleCornerMouseDown =
    (handle: DragHandle) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDrawing(true);
      setDragHandle(handle);
      setStartPos(getMousePosNormalized(e));
    };

  const drawCanvas = () => {
    if (
      !canvasRef.current ||
      !imageRef.current ||
      cropArea.width === 0 ||
      !imageLoaded
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Use natural dimensions for drawing
    const actualCropX = cropArea.x * img.naturalWidth;
    const actualCropY = cropArea.y * img.naturalHeight;
    const actualCropWidth = cropArea.width * img.naturalWidth;
    const actualCropHeight = cropArea.height * img.naturalHeight;

    canvas.width = Math.floor(actualCropWidth);
    canvas.height = Math.floor(actualCropHeight);

    ctx.drawImage(
      img,
      Math.floor(actualCropX),
      Math.floor(actualCropY),
      Math.floor(actualCropWidth),
      Math.floor(actualCropHeight),
      0,
      0,
      Math.floor(actualCropWidth),
      Math.floor(actualCropHeight),
    );
  };

  useEffect(() => {
    drawCanvas();
  }, [cropArea, imageLoaded]);

  useEffect(() => {
    if (!isDrawing) return;

    const handleGlobalMouseUp = () => {
      setIsDrawing(false);
      setDragHandle(null);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDrawing]);

  // Apply aspect ratio when it's selected
  useEffect(() => {
    if (!imageLoaded || !imageRef.current || cropArea.width === 0) return;

    // Only apply ratio if one is selected
    if (selectedRatio !== null) {
      const img = imageRef.current;

      let newCropArea = applyAspectRatio(
        cropArea,
        selectedRatio,
        img.naturalWidth,
        img.naturalHeight,
      );

      // Ensure it's within bounds
      newCropArea = constrainCropArea(newCropArea);
      setCropArea(newCropArea);
    }
  }, [selectedRatio, imageLoaded]);

  const handleApplyCrop = () => {
    if (!canvasRef.current || cropArea.width === 0) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const fileName = imageFile.name.split(".")[0] + ".png";
          const croppedFile = new File([blob], fileName, {
            type: "image/png",
            lastModified: Date.now(),
          });
          onCrop(croppedFile);
          onClose();
        }
      },
      "image/png",
      0.95,
    );
  };

  const handleDetectEdges = async () => {
    if (!imageRef.current) return;

    setIsAutoDetecting(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;
      let foundContent = false;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness < 240) {
          foundContent = true;
          const pixelIndex = i / 4;
          const y = Math.floor(pixelIndex / canvas.width);
          const x = pixelIndex % canvas.width;

          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }

      if (foundContent && maxX > minX && maxY > minY) {
        const padding = Math.min(20, Math.floor(maxX - minX) * 0.05);

        // Convert detected pixels to normalized coordinates
        setCropArea({
          x: Math.max(0, (minX - padding) / img.naturalWidth),
          y: Math.max(0, (minY - padding) / img.naturalHeight),
          width: Math.min(1, (maxX - minX + padding * 2) / img.naturalWidth),
          height: Math.min(1, (maxY - minY + padding * 2) / img.naturalHeight),
        });
      }
    } catch (error) {
      console.error("Auto-detect failed:", error);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-lg shadow-lg w-full h-full max-w-7xl max-h-screen flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">Crop Image</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            Drag on the image to create a crop area. Use the corners to resize,
            or adjust aspect ratio below.
          </p>

          {/* Canvas for preview */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Image Container */}
          <div
            ref={containerRef}
            className="bg-muted rounded-lg overflow-hidden border-2 border-border flex items-center justify-center flex-1 min-h-0"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageSrc && (
              <div
                ref={wrapperRef}
                className="relative"
                style={{ maxHeight: "100%", maxWidth: "100%" }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="block select-none"
                  style={
                    {
                      userSelect: "none",
                      WebkitUserDrag: "none",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain"
                    } as React.CSSProperties
                  }
                  onLoad={handleImageLoad}
                  onMouseDown={handleMouseDown}
                />

                {/* Crop Selection Overlay */}
                {imageLoaded && cropArea.width > 0 && imageRef.current && (
                  <>
                    {/* Darkened areas */}
                    <div
                      className="absolute bg-black/40 pointer-events-none"
                      style={{
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${cropArea.y * 100}%`,
                      }}
                    />
                    <div
                      className="absolute bg-black/40 pointer-events-none"
                      style={{
                        top: `${(cropArea.y + cropArea.height) * 100}%`,
                        left: 0,
                        width: "100%",
                        height: `${(1 - (cropArea.y + cropArea.height)) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute bg-black/40 pointer-events-none"
                      style={{
                        top: `${cropArea.y * 100}%`,
                        left: 0,
                        width: `${cropArea.x * 100}%`,
                        height: `${cropArea.height * 100}%`,
                      }}
                    />
                    <div
                      className="absolute bg-black/40 pointer-events-none"
                      style={{
                        top: `${cropArea.y * 100}%`,
                        left: `${(cropArea.x + cropArea.width) * 100}%`,
                        width: `${(1 - (cropArea.x + cropArea.width)) * 100}%`,
                        height: `${cropArea.height * 100}%`,
                      }}
                    />

                    {/* Crop Border */}
                    <div
                      className="absolute border-2 border-primary pointer-events-none"
                      style={{
                        top: `${cropArea.y * 100}%`,
                        left: `${cropArea.x * 100}%`,
                        width: `${cropArea.width * 100}%`,
                        height: `${cropArea.height * 100}%`,
                      }}
                    />

                    {/* Corner handles */}
                    <div
                      className="absolute w-5 h-5 bg-primary rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                      style={{
                        top: `calc(${cropArea.y * 100}% - 2px)`,
                        left: `calc(${cropArea.x * 100}% - 2px)`,
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("nw")}
                    />
                    <div
                      className="absolute w-5 h-5 bg-primary rounded-full cursor-nesw-resize hover:scale-125 transition-transform"
                      style={{
                        top: `calc(${cropArea.y * 100}% - 2px)`,
                        right: `calc(${(1 - (cropArea.x + cropArea.width)) * 100}% - 2px)`,
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("ne")}
                    />
                    <div
                      className="absolute w-5 h-5 bg-primary rounded-full cursor-nesw-resize hover:scale-125 transition-transform"
                      style={{
                        bottom: `calc(${(1 - (cropArea.y + cropArea.height)) * 100}% - 2px)`,
                        left: `calc(${cropArea.x * 100}% - 2px)`,
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("sw")}
                    />
                    <div
                      className="absolute w-5 h-5 bg-primary rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                      style={{
                        bottom: `calc(${(1 - (cropArea.y + cropArea.height)) * 100}% - 2px)`,
                        right: `calc(${(1 - (cropArea.x + cropArea.width)) * 100}% - 2px)`,
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("se")}
                    />

                    {/* Edge handles */}
                    <div
                      className="absolute w-6 h-1 bg-primary/60 cursor-ns-resize hover:bg-primary transition-colors"
                      style={{
                        top: `${cropArea.y * 100}%`,
                        left: `calc(${(cropArea.x + cropArea.width / 2) * 100}% - 12px)`,
                        width: "24px",
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("n")}
                    />
                    <div
                      className="absolute w-6 h-1 bg-primary/60 cursor-ns-resize hover:bg-primary transition-colors"
                      style={{
                        bottom: `${(1 - (cropArea.y + cropArea.height)) * 100}%`,
                        left: `calc(${(cropArea.x + cropArea.width / 2) * 100}% - 12px)`,
                        width: "24px",
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("s")}
                    />
                    <div
                      className="absolute w-1 h-6 bg-primary/60 cursor-ew-resize hover:bg-primary transition-colors"
                      style={{
                        left: `${cropArea.x * 100}%`,
                        top: `calc(${(cropArea.y + cropArea.height / 2) * 100}% - 12px)`,
                        height: "24px",
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("w")}
                    />
                    <div
                      className="absolute w-1 h-6 bg-primary/60 cursor-ew-resize hover:bg-primary transition-colors"
                      style={{
                        right: `${(1 - (cropArea.x + cropArea.width)) * 100}%`,
                        top: `calc(${(cropArea.y + cropArea.height / 2) * 100}% - 12px)`,
                        height: "24px",
                        zIndex: 10,
                      }}
                      onMouseDown={handleCornerMouseDown("e")}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          {imageLoaded && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Aspect Ratio</label>
                <button
                  onClick={handleDetectEdges}
                  disabled={isAutoDetecting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={16} />
                  {isAutoDetecting ? "Detecting..." : "Auto Detect"}
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.label}
                    onClick={() => setSelectedRatio(ar.ratio)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded transition-colors",
                      selectedRatio === ar.ratio
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border hover:border-primary text-foreground",
                    )}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-border bg-muted/30 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCrop}
            disabled={!imageLoaded || cropArea.width === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Crop
          </button>
        </div>
      </motion.div>
    </div>
  );
}
