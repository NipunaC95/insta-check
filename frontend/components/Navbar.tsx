import React from 'react';
import { Upload, History, HelpCircle, Sparkles, RefreshCw, Instagram } from 'lucide-react';
import { UploadSession } from '../types/index.ts';

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
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Brand (Resend clean minimal style) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-xs">
              <Instagram className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight">
                  Follower Insights
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Instagram
                </span>
              </div>
              {currentSession && (
                <p className="text-[11px] text-zinc-500 truncate max-w-xs sm:max-w-md font-mono">
                  Active: <span className="text-zinc-300 font-sans">{currentSession.label || `Upload #${currentSession.id}`}</span>
                  <span className="text-zinc-500 ml-1">
                    ({new Date(currentSession.uploaded_at).toLocaleDateString()})
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              id="refresh-btn"
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Dashboard"
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-zinc-200' : ''}`} />
            </button>

            <button
              id="guide-btn"
              type="button"
              onClick={onOpenGuide}
              title="Step-by-step export guide"
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              id="demo-data-btn"
              type="button"
              onClick={onLoadDemo}
              disabled={isLoading}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              Demo Data
            </button>

            <button
              id="history-btn"
              type="button"
              onClick={onOpenSessions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sessions</span>
            </button>

            {/* Primary CTA (Signature Resend White Button) */}
            <button
              id="upload-primary-btn"
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-black bg-white hover:bg-zinc-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Export</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
