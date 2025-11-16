/**
 * DOCX to PDF Converter Utility
 * Converts DOCX content to searchable PDF using browser print functionality
 */

/**
 * Converts DOCX HTML content to PDF using browser print dialog
 * This creates a searchable PDF (unlike image-based PDFs)
 */
export async function convertDocxToSearchablePdf(
  htmlContent: string,
  filename: string = "document.pdf"
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a hidden iframe for printing (no new tab)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    
    // Create a container div with proper styling for PDF
    const htmlWithStyles = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${filename}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            #doc-container {
              max-width: none;
              margin: 0;
              padding: 0;
              background: none;
              box-shadow: none;
              border: none;
            }
            @page {
              margin: 1in;
            }
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
            p, ul, ol, table {
              page-break-inside: auto;
            }
            p {
              widows: 2;
              orphans: 2;
            }
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          #doc-container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
            font-family: 'Noto Sans Devanagari', 'Inter', sans-serif;
          }
          #doc-container h1 { font-size: 2em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
          #doc-container h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
          #doc-container h3 { font-size: 1.25em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
          #doc-container p { margin-bottom: 1em; line-height: 1.6; }
          #doc-container ul { list-style-type: disc; margin-left: 2em; margin-bottom: 1em; }
          #doc-container ol { list-style-type: decimal; margin-left: 2em; margin-bottom: 1em; }
          #doc-container table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
          #doc-container th, #doc-container td { border: 1px solid #ccc; padding: 8px; }
          #doc-container th { background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <div id="doc-container">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    // Append iframe to body (hidden)
    document.body.appendChild(iframe);

    // Wait for iframe to be ready
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      reject(new Error("Could not access iframe document"));
      return;
    }

    // Write HTML to iframe
    iframeDoc.open();
    iframeDoc.write(htmlWithStyles);
    iframeDoc.close();

    // Wait for content and fonts to load
    const waitForLoad = () => {
      if (iframe.contentWindow && iframeDoc.readyState === "complete") {
        // Wait for fonts to load
        setTimeout(() => {
          try {
            // Trigger print dialog from iframe
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              
              // Clean up after print dialog is handled
              setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
              }, 500);
            } else {
              document.body.removeChild(iframe);
              reject(new Error("Could not access iframe window"));
            }
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        }, 1000); // Wait 1 second for fonts to load
      } else {
        setTimeout(waitForLoad, 100);
      }
    };

    // Start waiting for load
    iframe.onload = waitForLoad;
    
    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (iframeDoc.readyState === "complete") {
        waitForLoad();
      }
    }, 500);
  });
}

/**
 * Converts plain text to HTML format suitable for DOCX to PDF conversion
 */
export function textToHtml(text: string): string {
  // Split text into paragraphs (double line breaks)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Convert each paragraph to HTML
  const htmlParagraphs = paragraphs.map(paragraph => {
    // Handle single line breaks within paragraphs
    const lines = paragraph.split('\n').filter(line => line.trim().length > 0);
    const content = lines.join('<br>');
    
    // Detect headings (lines that are short and end without punctuation)
    if (lines.length === 1 && lines[0].length < 100 && !lines[0].match(/[.!?]$/)) {
      return `<h2>${lines[0]}</h2>`;
    }
    
    return `<p>${content}</p>`;
  });

  return htmlParagraphs.join('\n');
}

