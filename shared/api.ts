/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * OCR extraction request
 */
export interface OCRRequest {
  text: string;
}

/**
 * OCR extraction response
 */
export interface OCRResponse {
  success: boolean;
  text: string;
  detectedLanguages?: string[];
  error?: string;
  processingTime?: number;
}

/**
 * OCR health check response
 */
export interface OCRHealthResponse {
  status: string;
  message: string;
}
