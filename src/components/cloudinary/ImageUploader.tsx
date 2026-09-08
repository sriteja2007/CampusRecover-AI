import React, { useState, useEffect, useCallback } from 'react';
import { DragAndDropUploader } from './DragAndDropUploader';
import { ImagePreview } from './ImagePreview';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { AlertCircle } from 'lucide-react';

interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploaderProps {
  onUploadSuccess: (image: UploadedImage | null) => void;
  initialImage?: UploadedImage;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  initialImage,
}) => {
  const { upload, progress, loading, error, clearError } = useCloudinaryUpload();
  
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(initialImage || null);
  const [localFilePreview, setLocalFilePreview] = useState<string | null>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (localFilePreview) URL.revokeObjectURL(localFilePreview);
    };
  }, [localFilePreview]);

  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    clearError();
    const file = acceptedFiles[0];

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setLocalFilePreview(previewUrl);

    // Start upload
    const response = await upload(file);
    
    if (response) {
      const newImage = {
        url: response.secure_url,
        publicId: response.public_id,
      };
      setUploadedImage(newImage);
      onUploadSuccess(newImage);
    }
    
    // Clear local preview
    setLocalFilePreview(null);
  };

  const handleRemove = useCallback(() => {
    setUploadedImage(null);
    onUploadSuccess(null);
  }, [onUploadSuccess]);

  const hasImage = !!uploadedImage || !!localFilePreview;

  return (
    <div className="w-full space-y-4">
      {!hasImage && (
        <DragAndDropUploader
          onDrop={handleDrop}
          maxFiles={1}
          disabled={loading}
        />
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {hasImage && (
        <div className="flex justify-center mt-4">
          {uploadedImage ? (
            <ImagePreview
              url={uploadedImage.url}
              onRemove={handleRemove}
              isUploading={false}
            />
          ) : localFilePreview ? (
            <ImagePreview
              url={localFilePreview}
              progress={progress}
              isUploading={true}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
