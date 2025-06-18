"use client";

import { useState } from "react";
import { UploadDropzone } from "~/lib/uploadthing";
import { X, FileText, Image, File } from "lucide-react";
import { cn } from "~/lib/utils";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  onFilesUploaded: (files: FileAttachment[]) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (index: number) => void;
  disabled?: boolean;
}

export function FileUpload({
  onFilesUploaded,
  attachments,
  onRemoveAttachment,
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type === "application/pdf") return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={file.url}
              className="flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800"
            >
              {getFileIcon(file.type)}
              <span className="truncate max-w-[120px]">{file.name}</span>
              <span className="text-neutral-500 text-xs">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(index)}
                className="text-neutral-500 hover:text-red-500"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Auto Upload Dropzone - Always Visible */}
      {uploadError ? (
        <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-4 dark:border-red-600 dark:bg-red-900/20">
          <div className="text-center text-red-800 dark:text-red-200">
            <FileText className="mx-auto h-8 w-8 mb-2 text-red-600" />
            <p className="font-medium">Upload Error</p>
            <p className="text-sm mt-1">{uploadError}</p>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 p-4 dark:border-neutral-600 transition-colors hover:border-neutral-400 dark:hover:border-neutral-500">
          <UploadDropzone
            endpoint="chatAttachment"
            onClientUploadComplete={(res) => {
              console.log("✅ Upload complete:", res);
              const files = res.map((file) => ({
                name: file.name,
                url: file.url, // Using correct UploadThing property
                type: file.type || "application/octet-stream",
                size: file.size,
              }));
              console.log("📁 Processed files:", files);
              onFilesUploaded(files);
              setIsUploading(false);
              console.log("🎉 Files uploaded successfully!");
            }}
            onUploadError={(error: Error) => {
              console.error("❌ Upload error:", error);
              console.error("Error details:", error.message, error.stack);
              setIsUploading(false);
              setUploadError(
                error.message ||
                  "Please check your UploadThing configuration and environment variables"
              );
            }}
            onUploadBegin={(name) => {
              console.log("🚀 Starting upload for:", name);
              setIsUploading(true);
              setUploadError(null); // Clear any previous errors
            }}
            disabled={disabled || isUploading}
            appearance={{
              container: "w-full border-none",
              uploadIcon: "text-neutral-400",
              label: "text-neutral-600 dark:text-neutral-400 text-sm",
              allowedContent:
                "text-neutral-500 dark:text-neutral-500 text-xs mt-1",
              button:
                "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium",
            }}
            content={{
              label: isUploading
                ? "🔄 Uploading files..."
                : disabled
                  ? "❌ Upload disabled"
                  : "📁 Drag & drop files or click to browse",
              allowedContent:
                "Images (4MB), PDFs (16MB), Text files (1MB). Click 'Upload' after selecting files.",
              button: isUploading ? "Uploading..." : "Upload Files",
            }}
          />
        </div>
      )}
    </div>
  );
}
