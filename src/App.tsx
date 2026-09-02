import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { SummaryCards } from './components/SummaryCards.tsx';
import { UserListTable } from './components/UserListTable.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { SessionsModal } from './components/SessionsModal.tsx';
import { HowToGuideModal } from './components/HowToGuideModal.tsx';
import { UploadSession, DashboardStats, UploadResponse } from './types.ts';
import {
  UploadCloud,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Instagram,
} from 'lucide-react';

export default function App() {
  const [uploads, setUploads] = useState<UploadSession[]>([]);
  const [currentUploadId, setCurrentUploadId] = useState<number | null>(null);
  const [compareWithId, setCompareWithId] = useState<number | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<string>('nonFollowersBack');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Toast / notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all upload sessions
  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch('/api/uploads');
      if (!res.ok) throw new Error('Failed to load uploads');
      const data: UploadSession[] = await res.json();
      setUploads(data);
      return data;
    } catch (err: any) {
      console.error('Error loading uploads:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch dashboard stats for an upload
  const fetchDashboard = useCallback(
    async (uploadId: number, comparisonId?: number | null) => {
      setIsLoading(true);
      setError(null);
      try {
        const url = comparisonId
          ? `/api/dashboard/${uploadId}?compareWithId=${comparisonId}`
          : `/api/dashboard/${uploadId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to calculate dashboard insights.');
        setDashboardStats(data);
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const list = await fetchUploads();
      if (list.length > 0) {
        const latest = list[0].id;
        setCurrentUploadId(latest);
        await fetchDashboard(latest);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchUploads, fetchDashboard]);

  // When currentUploadId or compareWithId changes
  useEffect(() => {
    if (currentUploadId) {
      fetchDashboard(currentUploadId, compareWithId);
    }
  }, [currentUploadId, compareWithId, fetchDashboard]);

  // Handler for successful file upload
  const handleUploadSuccess = async (res: UploadResponse) => {
    showToast(`Successfully processed ${res.followersCount} followers and ${res.followingCount} following.`);
    const updatedList = await fetchUploads();
    setCurrentUploadId(res.uploadId);
    setCompareWithId(null); // default to immediate previous upload
  };

  // Handler to load demo data
  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed demo data.');
      showToast('Demo sessions created! Comparing latest vs previous month.');
      const updatedList = await fetchUploads();
      if (data.currentUploadId) {
        setCurrentUploadId(data.currentUploadId);
        setCompareWithId(data.previousUploadId || null);
      } else if (updatedList.length > 0) {
        setCurrentUploadId(updatedList[0].id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to delete an upload
  const handleDeleteUpload = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this upload session?')) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete upload.');
      showToast('Upload session deleted.');
      const list = await fetchUploads();
      if (currentUploadId === id) {
        if (list.length > 0) {
          setCurrentUploadId(list[0].id);
          setCompareWithId(null);
        } else {
          setCurrentUploadId(null);
          setDashboardStats(null);
        }
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const currentSession = uploads.find((u) => u.id === currentUploadId) || null;
  const compareSession = uploads.find((u) => u.id === compareWithId) || dashboardStats?.previousUpload || null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-950/90 text-red-200 border-red-800/60'
                : 'bg-[#1a1a1a] text-white border-white/10'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentSession={currentSession}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenSessions={() => setIsSessionsModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onLoadDemo={handleLoadDemo}
        onRefresh={() => currentUploadId && fetchDashboard(currentUploadId, compareWithId)}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-[#ff4d4d] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#ff4d4d] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Notice:</span> {error}
            </div>
          </div>
        )}

        {/* Empty State when no uploads exist */}
        {!isLoading && uploads.length === 0 && (
          <div className="max-w-2xl mx-auto my-12 text-center bg-[#161616] border border-white/5 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center mb-5 shadow-lg shadow-pink-950/40">
              <Instagram className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              Track Who Unfollowed You on Instagram
            </h2>

            <p className="text-sm text-white/60 mt-2 max-w-md mx-auto leading-relaxed">
              Upload your official Instagram data export (JSON or ZIP) to view your unfollowers,
              accounts that don't follow you back, and new followers over time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                id="empty-upload-btn"
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 rounded-xl shadow-lg shadow-pink-950/40 transition-all transform active:scale-95 cursor-pointer"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload Export (JSON or ZIP)</span>
              </button>

              <button
                id="empty-demo-btn"
                type="button"
                onClick={handleLoadDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#f09433] bg-[#1a1612] hover:bg-[#251f19] border border-[#f09433]/30 rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#f09433]" />
                <span>Try Demo Data</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-white/40">
              <HelpCircle className="w-4 h-4" />
              <span>Need help getting your data?</span>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="text-[#dc2743] font-semibold hover:underline cursor-pointer"
              >
                Read step-by-step export instructions
              </button>
            </div>
          </div>
        )}

        {/* Active Dashboard View */}
        {dashboardStats && (
          <div className="space-y-6">
            {/* Session comparison banner */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Comparing:
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#dc2743]/15 text-white border border-[#dc2743]/30">
                  Current: {dashboardStats.currentUpload.label || `Session #${dashboardStats.currentUpload.id}`}
                </span>

                <ArrowRightLeft className="w-3.5 h-3.5 text-white/40 hidden sm:inline" />

                {compareSession ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 text-white/80 border border-white/10">
                    Baseline: {compareSession.label || `Session #${compareSession.id}`}
                  </span>
                ) : (
                  <span className="text-xs text-white/40 italic">
                    (No previous session to compare unfollowers yet &mdash; upload another to track changes)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="change-comparison-btn"
                  type="button"
                  onClick={() => setIsSessionsModalOpen(true)}
                  className="text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Change Comparison
                </button>
              </div>
            </div>

            {/* Summary Metrics */}
            <SummaryCards
              stats={dashboardStats}
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
            />

            {/* User List Table */}
            <UserListTable
              stats={dashboardStats}
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !dashboardStats && (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#dc2743] mb-3" />
            <p className="text-sm font-medium text-white/60">
              Analyzing follower graph and calculating insights...
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#121212] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white/70">Instagram Follower Insights</span>
            <span>&bull;</span>
            <span>PostgreSQL &amp; Docker Containerized</span>
          </div>
          <div>
            Data is parsed locally and never sent to external third parties.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <SessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        uploads={uploads}
        currentUploadId={currentUploadId}
        compareWithId={compareWithId}
        onSelectCurrent={(id) => {
          setCurrentUploadId(id);
          setIsSessionsModalOpen(false);
        }}
        onSelectCompare={(id) => {
          setCompareWithId(id);
          setIsSessionsModalOpen(false);
        }}
        onDeleteUpload={handleDeleteUpload}
        onLoadDemo={async () => {
          await handleLoadDemo();
          setIsSessionsModalOpen(false);
        }}
      />

      <HowToGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
