/**
 * Image preprocessing utility using Otsu's method for thresholding
 * Improves OCR accuracy for low-contrast or blurry images
 */

/**
 * Preprocesses an image using Otsu's method for optimal thresholding
 * Converts the image to grayscale and applies binary thresholding
 * @param img - The HTMLImageElement to process
 * @returns A canvas element with the processed image
 */
export function preprocessImage(img: HTMLImageElement): HTMLCanvasElement {
  // Create a canvas to draw the image on
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set canvas dimensions to match the image's original, non-styled size
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0);

  // Get the pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // --- START: OTSU'S METHOD IMPLEMENTATION ---
  // This is a smarter way to find the threshold dynamically
  // instead of guessing a fixed value.

  // 1. Create a grayscale histogram
  const histogram = new Array(256).fill(0);
  const grayscaleData: number[] = []; // Store grayscale values for the second pass

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Use luminance formula for grayscale
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    histogram[luminance]++;
    grayscaleData.push(luminance); // Store for later
  }

  const totalPixels = grayscaleData.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * histogram[t];
  }

  let sumB = 0;
  let wB = 0; // Weight Background
  let wF = 0; // Weight Foreground

  let maxVariance = 0;
  let optimalThreshold = 0;

  // 2. Loop through all possible thresholds to find the best one
  for (let t = 0; t < 256; t++) {
    wB += histogram[t]; // Weight Background
    if (wB === 0) continue;

    wF = totalPixels - wB; // Weight Foreground
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB; // Mean Background
    const mF = (sum - sumB) / wF; // Mean Foreground

    // Calculate Between Class Variance
    const variance = wB * wF * (mB - mF) * (mB - mF);

    // Check if this is the new max variance
    if (variance > maxVariance) {
      maxVariance = variance;
      optimalThreshold = t;
    }
  }

  console.log("Optimal threshold calculated:", optimalThreshold);
  // --- END: OTSU'S METHOD ---

  // 3. Apply the new, calculated threshold
  for (let i = 0; i < data.length; i += 4) {
    // Get the grayscale value we stored
    const luminance = grayscaleData[i / 4];

    // Apply the optimal threshold
    const value = luminance < optimalThreshold ? 0 : 255;
    data[i] = value; // Red
    data[i + 1] = value; // Green
    data[i + 2] = value; // Blue
    // data[i + 3] (Alpha) stays the same
  }

  // Put the modified pixel data back onto the canvas
  ctx.putImageData(imageData, 0, 0);

  // Return the canvas itself, which Tesseract can read
  return canvas;
}

