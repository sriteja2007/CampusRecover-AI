import React, { useState, useEffect, useCallback } from 'react';
import { DragAndDropUploader } from './DragAndDropUploader';
import { ImagePreview } from './ImagePreview';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { CloudinaryUploadResponse } from '../../services/cloudinary/upload.service';
import { MAX_UPLOAD_FILES } from '../../config/cloudinary';
import { AlertCircle } from 'lucide-react';

interface UploadedImage {
  url: string;
  publicId: string;
}

interface MultipleImageUploaderProps {
  onUploadSuccess: (images: UploadedImage[]) => void;
  maxFiles?: number;
  initialImages?: UploadedImage[];
}

export const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  onUploadSuccess,
  maxFiles = MAX_UPLOAD_FILES,
  initialImages = [],
}) => {
  const { uploadMultiple, multipleProgress, loading, error, clearError } = useCloudinaryUpload();
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages);
  const [localFiles, setLocalFiles] = useState<{ file: File; id: string; preview: string }[]>([]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      localFiles.forEach((lf) => URL.revokeObjectURL(lf.preview));
    };
  }, [localFiles]);

  const handleDrop = async (acceptedFiles: File[]) => {
    clearError();
    
    // Check total files
    const totalCurrentFiles = uploadedImages.length + localFiles.length;
    if (totalCurrentFiles + acceptedFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images in total.`);
      return;
    }

    // Create local previews immediately
    const newLocalFiles = acceptedFiles.map((file, index) => ({
      file,
      id: `${file.name}-${index}`,
      preview: URL.createObjectURL(file),
    }));

    setLocalFiles((prev) => [...prev, ...newLocalFiles]);

    // Start upload
    const responses = await uploadMultiple(acceptedFiles);
    
    if (responses && responses.length > 0) {
      const successfulUploads = responses.filter(r => r !== null) as CloudinaryUploadResponse[];
      
      const newUploadedImages = successfulUploads.map((res) => ({
        url: res.secure_url,
        publicId: res.public_id,
      }));

      const updatedImages = [...uploadedImages, ...newUploadedImages];
      setUploadedImages(updatedImages);
      onUploadSuccess(updatedImages);

      // Remove the successfully uploaded files from local preview
      setLocalFiles((prev) => prev.filter(lf => !newLocalFiles.find(nlf => nlf.id === lf.id)));
    } else {
      // Remove local previews if upload completely failed
      setLocalFiles((prev) => prev.filter(lf => !newLocalFiles.find(nlf => nlf.id === lf.id)));
    }
  };

  const handleRemove = useCallback((indexToRemove: number) => {
    const updatedImages = [...uploadedImages];
    updatedImages.splice(indexToRemove, 1);
    setUploadedImages(updatedImages);
    onUploadSuccess(updatedImages);
  }, [uploadedImages, onUploadSuccess]);

  const canUploadMore = uploadedImages.length + localFiles.length < maxFiles;

  return (
    <div className="w-full space-y-4">
      {canUploadMore && (
        <DragAndDropUploader
          onDrop={handleDrop}
          maxFiles={maxFiles - uploadedImages.length - localFiles.length}
          disabled={loading}
        />
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {(uploadedImages.length > 0 || localFiles.length > 0) && (
        <div className="flex flex-wrap gap-4 mt-4">
          {/* Display already uploaded images */}
          {uploadedImages.map((img, index) => (
            <ImagePreview
              key={img.publicId}
              url={img.url}
              onRemove={() => handleRemove(index)}
              isUploading={false}
            />
          ))}

          {/* Display images currently uploading */}
          {localFiles.map((lf) => (
            <ImagePreview
              key={lf.id}
              url={lf.preview}
              progress={multipleProgress[lf.id] || 0}
              isUploading={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
