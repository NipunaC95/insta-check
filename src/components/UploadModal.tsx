import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Archive, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UploadResponse } from '../types.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (res: UploadResponse) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [followersFile, setFollowersFile] = useState<File | null>(null);
  const [followingFile, setFollowingFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the 10 MB limit.`);
        return;
      }

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.zip')) {
        setZipFile(file);
        setFollowersFile(null);
        setFollowingFile(null);
      } else if (lowerName.includes('follower') && lowerName.endsWith('.json')) {
        setFollowersFile(file);
        setZipFile(null);
      } else if (lowerName.includes('following') && lowerName.endsWith('.json')) {
        setFollowingFile(file);
        setZipFile(null);
      } else if (lowerName.endsWith('.json')) {
        // Fallback: assign to whichever is empty
        if (!followersFile) {
          setFollowersFile(file);
        } else if (!followingFile) {
          setFollowingFile(file);
        }
        setZipFile(null);
      } else {
        setErrorMessage(`Unsupported file format: ${file.name}. Please upload .json or .zip files.`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!zipFile && (!followersFile || !followingFile)) {
      setErrorMessage(
        'Please upload both followers_1.json and following.json files, OR upload a single .zip export.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (label.trim()) {
        formData.append('label', label.trim());
      }

      if (zipFile) {
        formData.append('archive', zipFile);
      } else {
        if (followersFile) formData.append('followers', followersFile);
        if (followingFile) formData.append('following', followingFile);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload export.');
      }

      onUploadSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSelection = () => {
    setFollowersFile(null);
    setFollowingFile(null);
    setZipFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121212] rounded-2xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden text-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161616]/60">
          <div>
            <h2 className="text-lg font-bold text-white">Upload Instagram Export</h2>
            <p className="text-xs text-white/40">
              Provide JSON files or the downloaded ZIP archive (Max 10 MB)
            </p>
          </div>
          <button
            id="close-upload-modal"
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-[#ff4d4d]">
              <AlertCircle className="w-4 h-4 text-[#ff4d4d] shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#dc2743] bg-[#dc2743]/10 scale-[0.99]'
                : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json,.zip,application/json,application/zip"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 text-[#f09433] flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Click to browse or drag & drop files here
            </p>
            <p className="text-xs text-white/40 mt-1">
              Select <span className="font-mono text-white/70">followers_1.json</span> &{' '}
              <span className="font-mono text-white/70">following.json</span>, or the full{' '}
              <span className="font-mono text-white/70">.zip</span> archive
            </p>
          </div>

          {/* Detected Files Status */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-white/60 block">Detected Files:</span>

            {zipFile ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-purple-200">{zipFile.name}</span>
                  <span className="text-purple-400 text-[10px]">
                    ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetSelection();
                  }}
                  className="text-purple-400 hover:text-purple-200 text-xs cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Followers check */}
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                    followersFile
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/30'
                  }`}
                >
                  {followersFile ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-white/30 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-medium block truncate text-white">
                      {followersFile ? followersFile.name : 'followers_1.json'}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {followersFile ? `${(followersFile.size / 1024).toFixed(1)} KB` : 'Required'}
                    </span>
                  </div>
                </div>

                {/* Following check */}
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                    followingFile
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/30'
                  }`}
                >
                  {followingFile ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-white/30 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-medium block truncate text-white">
                      {followingFile ? followingFile.name : 'following.json'}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {followingFile ? `${(followingFile.size / 1024).toFixed(1)} KB` : 'Required'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Label */}
          <div>
            <label htmlFor="upload-label" className="block text-xs font-semibold text-white/70 mb-1">
              Session Label (Optional)
            </label>
            <input
              id="upload-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Export September 2026"
              className="w-full px-3 py-2 text-sm bg-black/40 border border-white/10 text-white placeholder-white/30 rounded-lg focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/20"
            />
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              id="cancel-upload-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-upload-btn"
              type="submit"
              disabled={isSubmitting || (!zipFile && (!followersFile || !followingFile))}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-md shadow-pink-950/40 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process & Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
