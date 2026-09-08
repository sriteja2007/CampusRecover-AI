import { useState, useCallback } from 'react';
import { uploadImage, uploadMultipleImages, compressImage, CloudinaryUploadResponse } from '../services/cloudinary/upload.service';
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_FORMATS } from '../config/cloudinary';

interface UseCloudinaryUploadResult {
  upload: (file: File) => Promise<CloudinaryUploadResponse | null>;
  uploadMultiple: (files: File[]) => Promise<CloudinaryUploadResponse[]>;
  progress: number;
  multipleProgress: Record<string, number>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useCloudinaryUpload = (): UseCloudinaryUploadResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [multipleProgress, setMultipleProgress] = useState<Record<string, number>>({});

  const clearError = useCallback(() => setError(null), []);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_IMAGE_FORMATS.includes(file.type)) {
      setError(`Invalid file format. Allowed formats: ${ALLOWED_IMAGE_FORMATS.join(', ')}`);
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`File size exceeds the 10MB limit.`);
      return false;
    }
    return true;
  };

  const upload = useCallback(async (file: File): Promise<CloudinaryUploadResponse | null> => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      if (!validateFile(file)) {
        setLoading(false);
        return null;
      }

      const compressedFile = await compressImage(file);
      const response = await uploadImage(compressedFile, (prog) => {
        setProgress(prog);
      });

      setLoading(false);
      return response;
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
      setLoading(false);
      return null;
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[]): Promise<CloudinaryUploadResponse[]> => {
    setLoading(true);
    setError(null);
    setMultipleProgress({});

    try {
      const validFiles = files.filter(validateFile);
      if (validFiles.length === 0) {
        setLoading(false);
        return [];
      }

      const compressedFiles = await Promise.all(validFiles.map(f => compressImage(f)));
      
      const responses = await uploadMultipleImages(compressedFiles, (progs) => {
        setMultipleProgress(progs);
      });

      setLoading(false);
      return responses;
    } catch (err: any) {
      setError(err.message || "An error occurred during multiple upload");
      setLoading(false);
      return [];
    }
  }, []);

  return {
    upload,
    uploadMultiple,
    progress,
    multipleProgress,
    loading,
    error,
    clearError,
  };
};
