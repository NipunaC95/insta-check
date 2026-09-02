import React from 'react';
import { Upload, History, HelpCircle, Sparkles, RefreshCw, Instagram } from 'lucide-react';
import { UploadSession } from '../types.ts';

interface NavbarProps {
  currentSession: UploadSession | null;
  onOpenUpload: () => void;
  onOpenSessions: () => void;
  onOpenGuide: () => void;
  onLoadDemo: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSession,
  onOpenUpload,
  onOpenSessions,
  onOpenGuide,
  onLoadDemo,
  onRefresh,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-950/30">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  Follower Insights
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10">
                  Instagram
                </span>
              </div>
              {currentSession && (
                <p className="text-xs text-white/40 truncate max-w-xs sm:max-w-md">
                  Active: <span className="font-medium text-white/80">{currentSession.label || `Upload #${currentSession.id}`}</span>
                  <span className="text-white/40 ml-1">
                    ({new Date(currentSession.uploaded_at).toLocaleDateString()})
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="refresh-btn"
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Dashboard"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#dc2743]' : ''}`} />
            </button>

            <button
              id="demo-data-btn"
              type="button"
              onClick={onLoadDemo}
              disabled={isLoading}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#f09433] bg-[#1a1612] hover:bg-[#251f19] border border-[#f09433]/30 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f09433]" />
              Load Demo Data
            </button>

            <button
              id="guide-btn"
              type="button"
              onClick={onOpenGuide}
              title="How to export your Instagram data"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              id="history-btn"
              type="button"
              onClick={onOpenSessions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-white/50" />
              <span className="hidden sm:inline">Sessions</span>
            </button>

            <button
              id="upload-primary-btn"
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 rounded-lg shadow-md shadow-pink-950/40 transition-all transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Export</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
