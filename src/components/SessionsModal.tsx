import React from 'react';
import { X, Calendar, Users, Trash2, ArrowRightLeft, Sparkles, Check } from 'lucide-react';
import { UploadSession } from '../types.ts';

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
      <div className="relative bg-[#121212] rounded-2xl max-w-2xl w-full shadow-2xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col text-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161616]/60 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Upload Sessions History</h2>
            <p className="text-xs text-white/40">
              Select an active export and choose which previous export to compare against
            </p>
          </div>
          <button
            id="close-sessions-modal"
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-white/40 mb-3">No upload sessions found yet.</p>
              <button
                id="modal-load-demo-btn"
                type="button"
                onClick={onLoadDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#f09433] bg-[#1a1612] hover:bg-[#251f19] border border-[#f09433]/30 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#f09433]" />
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
                      ? 'bg-[#1a1a1a] border-[#dc2743]/50 ring-1 ring-[#dc2743]/30'
                      : isCompare
                      ? 'bg-[#1a1a1a] border-[#f09433]/50 ring-1 ring-[#f09433]/30'
                      : 'bg-[#161616] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {upload.label || `Upload Session #${upload.id}`}
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white">
                            <Check className="w-3 h-3" /> Active Session
                          </span>
                        )}

                        {isCompare && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f09433] text-black">
                            <ArrowRightLeft className="w-3 h-3" /> Comparison Base
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/40 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-white/30" />
                          {new Date(upload.uploaded_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-white/30" />
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
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors cursor-pointer"
                        >
                          Set as Active
                        </button>
                      )}

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onSelectCompare(isCompare ? null : upload.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            isCompare
                              ? 'bg-[#f09433] text-black border-[#f09433] hover:bg-[#f09433]/90'
                              : 'text-white/80 bg-white/5 hover:bg-white/10 border-white/10'
                          }`}
                        >
                          {isCompare ? 'Clear Comparison' : 'Compare Against'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteUpload(upload.id)}
                        title="Delete Session"
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161616]/60 flex items-center justify-between shrink-0">
          <button
            id="add-sample-demo-btn"
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#f09433] hover:underline cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f09433]" />
            Add Demo Test Sessions
          </button>
          <button
            id="done-sessions-modal-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
