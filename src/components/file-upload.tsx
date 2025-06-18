"use client";

import { useState } from "react";
import { UploadDropzone } from "~/lib/uploadthing";
import { X, Paperclip, FileText, Image, File } from "lucide-react";
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
  const [showDropzone, setShowDropzone] = useState(false);

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

      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDropzone(true)}
          disabled={disabled || isUploading}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Paperclip className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Attach Files"}
        </button>
      </div>

      {/* Upload Dropzone */}
      {showDropzone && (
        <div className="rounded-lg border border-neutral-300 p-4 dark:border-neutral-600">
          <UploadDropzone
            endpoint="chatAttachment"
            onClientUploadComplete={(res) => {
              const files = res.map((file) => ({
                name: file.name,
                url: file.url,
                type: file.type || "application/octet-stream",
                size: file.size,
              }));
              onFilesUploaded(files);
              setIsUploading(false);
              setShowDropzone(false);
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
              setIsUploading(false);
            }}
            onUploadBegin={() => {
              setIsUploading(true);
            }}
            appearance={{
              container:
                "border-dashed border-neutral-300 dark:border-neutral-600",
              label: "text-neutral-600 dark:text-neutral-400",
              allowedContent: "text-neutral-500 dark:text-neutral-500 text-xs",
            }}
          />
          <button
            onClick={() => setShowDropzone(false)}
            type="button"
            className="mt-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
