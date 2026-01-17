/**
 * Text to DOCX Converter Utility
 * Converts plain text to DOCX format using the docx library
 */

import { Document, Packer, Paragraph, AlignmentType, TextRun, HeadingLevel } from "docx";

/**
 * Converts plain text to DOCX format
 * @param text - The text content to convert
 * @param title - Optional title for the document
 * @returns A Blob containing the DOCX file
 */
export async function textToDocx(
  text: string,
  title: string = "Extracted Text"
): Promise<Blob> {
  // Split text into paragraphs (double line breaks)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const docxParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 48, // 24pt
          color: "000000",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: "",
      spacing: { after: 200 },
    }),
  ];

  // Convert each paragraph
  paragraphs.forEach((paragraph) => {
    const lines = paragraph.split("\n").filter((line) => line.trim().length > 0);

    // Detect if it's a heading (single line, short, no ending punctuation)
    if (
      lines.length === 1 &&
      lines[0].length < 100 &&
      !lines[0].match(/[.!?]$/)
    ) {
      docxParagraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: lines[0],
              bold: true,
              size: 36, // 18pt for headings
              color: "000000",
            }),
          ],
        })
      );
    } else {
      // Regular paragraph - handle line breaks
      const runs: TextRun[] = [];
      lines.forEach((line, index) => {
        runs.push(new TextRun({
          text: line,
          size: 32, // 16pt requested
          color: "000000",
          font: "Arial"
        }));
        if (index < lines.length - 1) {
          runs.push(new TextRun({ text: "", break: 1, size: 32, color: "000000" }));
        }
      });

      docxParagraphs.push(
        new Paragraph({
          children: runs,
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        })
      );
    }
  });

  // Create the document
  const doc = new Document({
    sections: [
      {
        children: docxParagraphs,
      },
    ],
  });

  // Generate the blob
  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Converts DOCX blob to HTML using mammoth.js
 * This is used for the DOCX to PDF conversion flow
 */
export async function docxToHtml(docxBlob: Blob): Promise<string> {
  // Dynamically import mammoth
  const mammoth = await import("mammoth");

  const arrayBuffer = await docxBlob.arrayBuffer();

  const result = await mammoth.convertToHtml({ arrayBuffer });

  if (result.messages.length > 0) {
    console.warn("Mammoth.js conversion messages:", result.messages);
  }

  return result.value;
}

