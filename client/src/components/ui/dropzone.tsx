import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { FileX, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileWithPreview extends File {
  preview?: string;
}

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  currentFiles?: File[];
  className?: string;
}

export function Dropzone({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    "text/plain": [".txt"],
    "application/pdf": [".pdf"],
    "text/html": [".html"],
    "text/css": [".css"],
    "application/javascript": [".js", ".jsx"],
    "text/javascript": [".js", ".jsx"],
    "application/typescript": [".ts", ".tsx"],
    "text/x-python": [".py"],
  },
  currentFiles = [],
  className,
}: DropzoneProps) {
  const [files, setFiles] = useState<File[]>(currentFiles);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} files`);
        return;
      }

      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, maxFiles, onFilesSelected]
  );

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-4 cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-neutral-300 hover:border-primary/50",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-neutral-400" />
          <p className="text-sm text-neutral-600">
            {isDragActive
              ? "Drop the files here..."
              : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-neutral-500">
            {`Supports: .txt, .pdf, .py, .js, .jsx, .ts, .tsx, .html, .css (Max: ${maxFiles} files, ${
              maxSize / 1024 / 1024
            }MB each)`}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-neutral-700">
            Selected Files ({files.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center bg-neutral-100 rounded-md px-3 py-1 text-sm"
              >
                <span className="text-sm text-neutral-800 mr-2 truncate max-w-[150px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <FileX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
