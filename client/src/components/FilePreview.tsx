import { FileX } from "lucide-react";
import { getFileIcon } from "@/lib/openai";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const fileIcon = getFileIcon(file.name);
  
  return (
    <div className="flex items-center bg-neutral-100 rounded-md px-3 py-1 text-sm">
      <span className="mr-1">{fileIcon}</span>
      <span className="text-sm text-neutral-800 mr-2 truncate max-w-[150px]">
        {file.name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="text-neutral-500 hover:text-neutral-700"
      >
        <FileX className="h-4 w-4" />
      </button>
    </div>
  );
}
