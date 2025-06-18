// @ts-ignore - mammoth doesn't have proper types
import mammoth from "mammoth";
// @ts-ignore - Direct lib import to avoid test file issues
import * as pdfParse from "pdf-parse/lib/pdf-parse.js";

export interface ProcessedFile {
  name: string;
  type: string;
  content: string;
  error?: string;
}

// Helper function to fetch file as buffer
async function fetchFileBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Extract text from PDF
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Extract text from Word document
async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Word document parsing error:", error);
    throw new Error(
      `Failed to parse Word document: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Extract text from plain text files
async function extractPlainText(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Text file parsing error:", error);
    throw new Error(
      `Failed to parse text file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Main file processing function
export async function processFileForAI(attachment: {
  name: string;
  url: string;
  type: string;
  size: number;
}): Promise<ProcessedFile> {
  const { name, url, type } = attachment;

  try {
    // Handle images (return as-is for vision models)
    if (type.startsWith("image/")) {
      return {
        name,
        type,
        content: `[Image: ${name}]`, // Vision models will process the image directly
      };
    }

    // Fetch file content for text extraction
    const buffer = await fetchFileBuffer(url);
    let content: string;

    switch (type) {
      case "application/pdf":
        content = await extractPdfText(buffer);
        break;

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword":
        content = await extractWordText(buffer);
        break;

      case "text/plain":
      case "text/markdown":
      case "text/csv":
      case "application/json":
      case "text/javascript":
      case "text/typescript":
      case "text/html":
      case "text/css":
        content = await extractPlainText(buffer);
        break;

      default:
        // Try as plain text for unknown types
        try {
          content = await extractPlainText(buffer);
        } catch {
          throw new Error(`Unsupported file type: ${type}`);
        }
    }

    // Truncate very long content (to stay within token limits)
    const maxLength = 50000; // ~50k chars should be safe for most models
    if (content.length > maxLength) {
      content = `${content.substring(0, maxLength)}\n\n[Content truncated due to length...]`;
    }

    return {
      name,
      type,
      content: content.trim(),
    };
  } catch (error) {
    console.error(`Error processing file ${name}:`, error);
    return {
      name,
      type,
      content: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Process multiple files concurrently
export async function processMultipleFiles(
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>
): Promise<ProcessedFile[]> {
  const promises = attachments.map((attachment) =>
    processFileForAI(attachment)
  );
  return Promise.all(promises);
}

// Format processed files for AI consumption
export function formatFilesForAI(processedFiles: ProcessedFile[]): string {
  return processedFiles
    .map((file) => {
      if (file.error) {
        return `File: ${file.name}\nError: ${file.error}\n`;
      }

      if (file.type.startsWith("image/")) {
        return `Image: ${file.name}\n`;
      }

      return `File: ${file.name} (${file.type})\n\n${file.content}\n\n---\n`;
    })
    .join("\n");
}
