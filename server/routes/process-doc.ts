import { RequestHandler } from "express";
import * as fs from "fs";
import type { Request } from "express";

interface MulterRequest extends Request {
  file?: {
    filename?: string;
    path?: string;
    buffer?: Buffer;
    mimetype: string;
    size: number;
  };
}

/**
 * Extract text from PDF using pdf-parse and fall back to OCR if needed
 */
async function extractTextFromPdf(
  pdfBuffer: Buffer,
  language: string,
  filePath: string | null,
): Promise<string> {
  try {
    // Dynamic import of pdf-parse - handle both CommonJS and ESM exports
    const pdfParse = await import("pdf-parse").then(
      (module) => module.default || module,
    );

    if (typeof pdfParse !== "function") {
      throw new Error("pdf-parse module did not export a function");
    }

    const pdfData = await pdfParse(pdfBuffer);
    let extractedText = pdfData.text || "";

    // If text extraction failed or returned empty, use OCR as fallback
    if (!extractedText || extractedText.trim().length === 0) {
      console.log("PDF text extraction empty, falling back to OCR...");
      if (filePath) {
        extractedText = await performImageOCR(filePath, language, pdfBuffer);
      } else {
        // If no file path, create temp file for OCR
        const tempPath = `/tmp/${Date.now()}-pdf-temp.pdf`;
        fs.writeFileSync(tempPath, pdfBuffer);
        try {
          extractedText = await performImageOCR(tempPath, language, pdfBuffer);
        } finally {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        }
      }
    }

    return extractedText;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    // Fall back to OCR if pdf-parse fails
    try {
      console.log("PDF parsing failed, using OCR fallback...");
      if (filePath) {
        return await performImageOCR(filePath, language, pdfBuffer);
      } else {
        // If no file path, create temp file for OCR
        const tempPath = `/tmp/${Date.now()}-pdf-temp.pdf`;
        fs.writeFileSync(tempPath, pdfBuffer);
        try {
          return await performImageOCR(tempPath, language, pdfBuffer);
        } finally {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        }
      }
    } catch (ocrError) {
      throw new Error(
        "Failed to extract text from PDF: " +
          (ocrError instanceof Error ? ocrError.message : String(ocrError)),
      );
    }
  }
}

/**
 * Process document file (PDF or Word) for text extraction
 * PDFs are converted to images first, then OCR is applied
 */
export const handleProcessDoc: RequestHandler = async (
  req: MulterRequest,
  res,
) => {
  const startTime = Date.now();

  try {
    // Check if file is present
    if (!req.file) {
      return res.status(400).json({
        success: false,
        text: "",
        error: "No file uploaded. Please provide a PDF or Word document.",
      });
    }

    const { language = "hin" } = req.body;
    const fileType = req.file.mimetype;
    
    // Handle both memory storage (serverless) and disk storage (local)
    let fileBuffer: Buffer;
    let tempFilePath: string | null = null;
    
    if (req.file.buffer) {
      // Memory storage (Netlify Functions)
      fileBuffer = req.file.buffer;
      // Create a temporary file path for OCR if needed
      tempFilePath = `/tmp/${Date.now()}-${req.file.filename || 'temp'}`;
    } else if (req.file.path) {
      // Disk storage (local development)
      fileBuffer = fs.readFileSync(req.file.path);
      tempFilePath = req.file.path;
    } else {
      throw new Error("File data not available");
    }

    let extractedText = "";

    // Handle PDF files - extract text using pdf-parse with OCR fallback
    if (fileType === "application/pdf") {
      try {
        extractedText = await extractTextFromPdf(fileBuffer, language, tempFilePath || "");
      } catch (pdfError) {
        console.error("PDF processing error:", pdfError);
        throw new Error(
          `Failed to extract text from PDF: ${
            pdfError instanceof Error ? pdfError.message : String(pdfError)
          }`,
        );
      }
    }
    // Handle Word documents (.docx)
    else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } catch (wordError) {
        console.error("Word parsing error:", wordError);
        throw new Error("Failed to extract text from Word document");
      }
    }
    // Handle Word 97-2003 documents (.doc)
    else if (fileType === "application/msword") {
      throw new Error(
        "Legacy Word (.doc) files are not supported. Please convert to .docx format.",
      );
    } else {
      throw new Error(
        `Unsupported file type: ${fileType}. Please upload a PDF or Word document.`,
      );
    }

    // Clean up temp file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error("Error cleaning up temp file:", e);
      }
    }

    const processingTime = Date.now() - startTime;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        text: "",
        error: "No text could be extracted from the document.",
      });
    }

    res.status(200).json({
      success: true,
      text: extractedText,
      processingTime,
    });
  } catch (error) {
    // Clean up temp file if error occurs
    const tempPath = req.file?.path || (req.file?.buffer ? `/tmp/${Date.now()}-temp` : null);
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        console.error("Error cleaning up temp file:", e);
      }
    }

    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Document processing error:", error);
    res.status(500).json({
      success: false,
      text: "",
      error: errorMessage,
      processingTime,
    });
  }
};

/**
 * Perform OCR on image file using Tesseract.js
 * Supports multiple languages but defaults to English for reliability
 */
async function performImageOCR(
  filePath: string,
  language: string,
  _pdfBuffer: Buffer | null,
): Promise<string> {
  try {
    const Tesseract = await import("tesseract.js");

    // Use English + the requested language for better accuracy
    // English is most reliable for Tesseract
    const languages =
      language && language !== "eng" ? [language, "eng"] : ["eng"];

    const worker = await Tesseract.createWorker(languages, 1, {
      corePath:
        "https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js",
      langPath: "https://cdn.jsdelivr.net/npm/tesseract.js@v5/dist/lang-data/",
    });

    // Recognize text in image
    const result = await worker.recognize(filePath);
    const text = result.data.text || "";

    // Terminate worker
    await worker.terminate();
    return text;
  } catch (ocrError) {
    console.error("OCR error:", ocrError);
    throw new Error(
      "Could not extract text from image using OCR. The document may be empty or corrupted.",
    );
  }
}
