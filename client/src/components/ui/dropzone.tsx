import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  onFileDrop: (file: File) => void;
  maxSize?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Dropzone({ 
  onFileDrop, 
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB
  disabled = false,
  children 
}: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileDrop(acceptedFiles[0]);
    }
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxSize,
    multiple: false,
  });

  return (
    <div 
      {...getRootProps()} 
      className={`w-full bg-white border-2 border-dashed rounded-lg p-8 transition
        ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-secondary-300'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input {...getInputProps()} />
      {children}
    </div>
  );
}
