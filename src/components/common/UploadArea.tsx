import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  isOpen: boolean;
  onUploaded: (fileKey: string, fileName: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ isOpen, onUploaded, onClose, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setProgress(5);
    setError(null);

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          fileSize: selectedFile.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error ?? 'Failed to get upload URL');
      }

      setProgress(30);

      // Step 2: Upload file (dev mock via PUT route)
      const uploadRes = await fetch(`/api/upload/put?key=${encodeURIComponent(presignData.key)}&uploadId=${presignData.uploadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
        body: selectedFile,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? 'Upload failed');
      }

      setProgress(100);
      onUploaded(presignData.key, selectedFile.name);
      setSelectedFile(null);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors duration-250 bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Upload nguồn tài liệu
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            isUploading
              ? 'border-[var(--border-color)] opacity-60'
              : 'border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-subtle)]/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="w-10 h-10 mx-auto text-[var(--accent-primary)]" />
              <p className="text-sm font-medium text-[var(--text-primary)] truncate px-4">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-xs text-[var(--status-error)] hover:underline"
                >
                  Chọn file khác
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-10 h-10 mx-auto text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Kéo thả file vào đây hoặc <span className="text-[var(--accent-primary)] font-medium">chọn file</span>
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                MP4, WebM, MP3, WAV, PDF, PNG, TXT... (tối đa 2GB)
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">Đang tải lên...</span>
              <span className="text-[var(--accent-primary)] font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--status-error)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-all bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedFile || isUploading || disabled}
            onClick={handleUpload}
            className="px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] shadow-xs"
          >
            {isUploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tải...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tải lên
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;
};