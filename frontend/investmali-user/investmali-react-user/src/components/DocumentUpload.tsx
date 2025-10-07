import React, { useRef } from 'react';

interface DocumentUploadProps {
  label: string;
  description?: string;
  file?: File;
  onFileChange: (file: File | undefined) => void;
  accept?: string;
  required?: boolean;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  description,
  file,
  onFileChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
  className = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    onFileChange(selectedFile);
  };

  const handleRemoveFile = () => {
    onFileChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-mali-emerald transition-colors duration-300">
        {!file ? (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-mali-emerald hover:text-mali-emerald/80 font-medium"
              >
                Cliquez pour sélectionner un fichier
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés: PDF, JPG, PNG (max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-mali-emerald" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-mali-emerald hover:text-mali-emerald/80 text-sm font-medium"
              >
                Changer
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        required={required && !file}
      />
    </div>
  );
};

export default DocumentUpload;
