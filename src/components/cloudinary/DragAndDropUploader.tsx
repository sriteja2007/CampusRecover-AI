import React, { useCallback } from 'react';
import { useDropzone, DropEvent, FileRejection } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE_BYTES } from '../../config/cloudinary';

interface DragAndDropUploaderProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const DragAndDropUploader: React.FC<DragAndDropUploaderProps> = ({
  onDrop,
  maxFiles = 1,
  disabled = false,
}) => {
  const handleDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
      onDrop(acceptedFiles, fileRejections, event);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept: ALLOWED_IMAGE_FORMATS.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: MAX_IMAGE_SIZE_BYTES,
    maxFiles,
    disabled,
  });

  const getBorderColor = () => {
    if (disabled) return 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed';
    if (isDragReject) return 'border-red-400 bg-red-50';
    if (isDragActive) return 'border-blue-400 bg-blue-50';
    return 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white cursor-pointer';
  };

  return (
    <div
      {...getRootProps()}
      className={`relative w-full p-8 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center text-center outline-none ${getBorderColor()}`}
    >
      <input {...getInputProps()} />
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4">
        <UploadCloud className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {isDragActive ? "Drop files here..." : "Click to upload or drag and drop"}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        SVG, PNG, JPG or WEBP (max. 10MB)
      </p>
      {maxFiles > 1 && (
        <p className="text-xs text-gray-400 mt-2">
          Up to {maxFiles} images allowed
        </p>
      )}
    </div>
  );
};
