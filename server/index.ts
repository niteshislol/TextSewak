import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { handleOCRHealth, handleOCRExtract } from "./routes/ocr";
import { handleProcessDoc } from "./routes/process-doc";

// Configure multer for file uploads
// Use memory storage for serverless (Netlify Functions) or disk storage for local dev
const isServerless = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;
const storage = isServerless 
  ? multer.memoryStorage() 
  : multer.diskStorage({
      destination: (req, file, cb) => {
        // Use /tmp for Netlify Functions, uploads/ for local
        const dest = process.env.NETLIFY ? "/tmp" : "uploads/";
        cb(null, dest);
      },
    });

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"));
    }
  },
});

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // OCR API routes
  app.get("/api/ocr/health", handleOCRHealth);
  app.post("/api/ocr/extract", handleOCRExtract);

  // Document processing route
  app.post("/api/process-doc", upload.single("file"), handleProcessDoc);

  // Error handling for multer
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "FILE_TOO_LARGE") {
        return res.status(413).json({
          success: false,
          text: "",
          error: "File is too large. Maximum size is 50MB.",
        });
      }
      return res.status(400).json({
        success: false,
        text: "",
        error: error.message,
      });
    }
    if (error) {
      return res.status(400).json({
        success: false,
        text: "",
        error: error.message || "An error occurred while uploading the file.",
      });
    }
    next();
  });

  return app;
}
