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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Sessions History</h2>
            <p className="text-xs text-slate-500">
              Select an active export and choose which previous export to compare against
            </p>
          </div>
          <button
            id="close-sessions-modal"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 mb-3">No upload sessions found yet.</p>
              <button
                id="modal-load-demo-btn"
                type="button"
                onClick={onLoadDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
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
                  className={`pt-3 first:pt-0 p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-500/20'
                      : isCompare
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {upload.label || `Upload Session #${upload.id}`}
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                            <Check className="w-3 h-3" /> Active Session
                          </span>
                        )}

                        {isCompare && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                            <ArrowRightLeft className="w-3 h-3" /> Comparison Base
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(upload.uploaded_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
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
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
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
                              ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          }`}
                        >
                          {isCompare ? 'Clear Comparison' : 'Compare Against'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteUpload(upload.id)}
                        title="Delete Session"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            id="add-sample-demo-btn"
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Add Demo Test Sessions
          </button>
          <button
            id="done-sessions-modal-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
