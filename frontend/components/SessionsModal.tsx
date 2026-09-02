import React from 'react';
import { X, Calendar, Users, Trash2, ArrowRightLeft, Sparkles, Check } from 'lucide-react';
import { UploadSession } from '../types/index.ts';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploads: UploadSession[];
  currentUploadId: number | null;
  compareWithId: number | null;
  onSelectCurrent: (id: number) => void;
  onSelectCompare: (id: number | null) => void;
  onDeleteUpload: (id: number) => void;
  onLoadDemo: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  uploads,
  currentUploadId,
  compareWithId,
  onSelectCurrent,
  onSelectCompare,
  onDeleteUpload,
  onLoadDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#0c0c0e] rounded-xl max-w-2xl w-full shadow-2xl border border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/40 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Upload Sessions History</h2>
            <p className="text-xs text-zinc-400">
              Select an active export and choose which previous export to compare against
            </p>
          </div>
          <button
            id="close-sessions-modal"
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-500 mb-3">No upload sessions found yet.</p>
              <button
                id="modal-load-demo-btn"
                type="button"
                onClick={onLoadDemo}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                Load Demo Comparison Sessions
              </button>
            </div>
          ) : (
            uploads.map((upload) => {
              const isCurrent = currentUploadId === upload.id;
              const isCompare = compareWithId === upload.id;

              return (
                <div
                  key={upload.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-zinc-900/90 border-zinc-500 ring-1 ring-zinc-500/20 shadow-md'
                      : isCompare
                      ? 'bg-zinc-900/70 border-zinc-700 ring-1 ring-zinc-700/20'
                      : 'bg-[#09090b] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-xs sm:text-sm">
                          {upload.label || `Upload Session #${upload.id}`}
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white text-black">
                            <Check className="w-3 h-3" /> Active Session
                          </span>
                        )}

                        {isCompare && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                            <ArrowRightLeft className="w-3 h-3" /> Baseline
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                          {new Date(upload.uploaded_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-zinc-600" />
                          {upload.followers_count.toLocaleString()} followers &bull;{' '}
                          {upload.following_count.toLocaleString()} following
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onSelectCurrent(upload.id)}
                          className="px-3 py-1 text-xs font-medium text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Make Active
                        </button>
                      )}

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onSelectCompare(isCompare ? null : upload.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            isCompare
                              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750'
                              : 'text-zinc-400 bg-zinc-900/60 hover:text-white hover:bg-zinc-900 border-zinc-800'
                          }`}
                        >
                          {isCompare ? 'Clear Baseline' : 'Set Baseline'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteUpload(upload.id)}
                        title="Delete Session"
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span>Reset Demo Sessions</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
