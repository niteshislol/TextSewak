import { RequestHandler } from "express";
import { OCRResponse, OCRHealthResponse } from "@shared/api";

/**
 * Health check endpoint for OCR service
 */
export const handleOCRHealth: RequestHandler = (req, res) => {
  const response: OCRHealthResponse = {
    status: "ok",
    message: "OCR service is running",
  };
  res.status(200).json(response);
};

/**
 * Text extraction endpoint
 * Accepts base64 encoded image or text content
 * Returns extracted text and detected languages
 */
export const handleOCRExtract: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    // Get the image data from request body
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        text: "",
        error:
          "No image data provided. Please provide base64 encoded image data.",
      } as OCRResponse);
    }

    // Import tesseract.js dynamically
    const Tesseract = await import("tesseract.js");

    // Convert base64 to buffer if needed
    let imagePath: string;

    // If it's a data URL, use it directly
    if (imageData.startsWith("data:")) {
      imagePath = imageData;
    } else if (imageData.startsWith("http")) {
      // If it's a URL, use it directly
      imagePath = imageData;
    } else {
      // Otherwise treat as base64
      imagePath = `data:image/png;base64,${imageData}`;
    }

    // Create a worker for OCR processing
    // Using English as primary language (most reliable)
    // Note: Other language data files may not be available on all CDNs
    const worker = await Tesseract.createWorker("eng", 1, {
      corePath:
        "https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js",
      langPath: "https://cdn.jsdelivr.net/npm/tesseract.js@v5/dist/lang-data",
    });

    // Perform OCR - this will recognize text in any of the configured languages
    const result = await worker.recognize(imagePath);

    // Extract the text
    const extractedText = result.data.text || "";

    // Get detected languages if available
    const detectedLanguages: string[] = [];

    // Clean up
    await worker.terminate();

    const processingTime = Date.now() - startTime;

    const response: OCRResponse = {
      success: true,
      text: extractedText,
      detectedLanguages:
        detectedLanguages.length > 0 ? detectedLanguages : undefined,
      processingTime,
    };

    res.status(200).json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred during OCR processing";

    const response: OCRResponse = {
      success: false,
      text: "",
      error: errorMessage,
      processingTime,
    };

    console.error("OCR Error:", error);
    res.status(500).json(response);
  }
};
