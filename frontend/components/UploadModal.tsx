import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Archive, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UploadResponse } from '../types/index.ts';
import { uploadExportFiles } from '../services/api.ts';

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
      const isJsonOrHtml =
        lowerName.endsWith('.json') ||
        lowerName.endsWith('.html') ||
        lowerName.endsWith('.htm');

      if (lowerName.endsWith('.zip')) {
        setZipFile(file);
        setFollowersFile(null);
        setFollowingFile(null);
      } else if (lowerName.includes('follower') && isJsonOrHtml) {
        setFollowersFile(file);
        setZipFile(null);
      } else if (lowerName.includes('following') && isJsonOrHtml) {
        setFollowingFile(file);
        setZipFile(null);
      } else if (isJsonOrHtml) {
        if (!followersFile) {
          setFollowersFile(file);
        } else if (!followingFile) {
          setFollowingFile(file);
        }
        setZipFile(null);
      } else {
        setErrorMessage(`Unsupported file format: ${file.name}. Please upload .json, .html, or .zip files.`);
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
        'Please upload both followers and following export files (.json or .html), OR upload a single .zip archive.'
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

      const data = await uploadExportFiles(formData);
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
      <div className="relative bg-[#0c0c0e] rounded-xl max-w-lg w-full shadow-2xl border border-zinc-800 overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div>
            <h2 className="text-base font-semibold text-white">Upload Instagram Export</h2>
            <p className="text-xs text-zinc-400">
              Supports JSON (.json), HTML (.html), or ZIP archive (Max 10 MB)
            </p>
          </div>
          <button
            id="close-upload-modal"
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-zinc-400 bg-zinc-900/60'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json,.html,.htm,.zip,application/json,application/zip,text/html"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-zinc-200">
              Click to browse or drag & drop files here
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Upload <span className="font-mono text-zinc-300">followers</span> &{' '}
              <span className="font-mono text-zinc-300">following</span> (.json or .html), or the full{' '}
              <span className="font-mono text-zinc-300">.zip</span> export
            </p>
          </div>

          {/* Detected Files Status */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-400 block">Selected Files:</span>

            {zipFile ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium text-zinc-200">{zipFile.name}</span>
                  <span className="text-zinc-500 text-[11px]">
                    ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetSelection();
                  }}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer"
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
                      ? 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-500'
                  }`}
                >
                  {followersFile ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-medium block truncate text-zinc-200 font-mono text-[11px]">
                      {followersFile ? followersFile.name : 'followers (json/html)'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {followersFile ? `${(followersFile.size / 1024).toFixed(1)} KB` : 'Required'}
                    </span>
                  </div>
                </div>

                {/* Following check */}
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                    followingFile
                      ? 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-500'
                  }`}
                >
                  {followingFile ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-medium block truncate text-zinc-200 font-mono text-[11px]">
                      {followingFile ? followingFile.name : 'following (json/html)'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {followingFile ? `${(followingFile.size / 1024).toFixed(1)} KB` : 'Required'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Label */}
          <div>
            <label htmlFor="upload-label" className="block text-xs font-medium text-zinc-400 mb-1">
              Session Label (Optional)
            </label>
            <input
              id="upload-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Export September 2026"
              className="w-full px-3 py-1.5 text-xs bg-zinc-900/70 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Submit / Cancel Buttons (Resend style) */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
            <button
              id="cancel-upload-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-upload-btn"
              type="submit"
              disabled={isSubmitting || (!zipFile && (!followersFile || !followingFile))}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-black bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
