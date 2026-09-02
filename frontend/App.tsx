import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { SummaryCards } from './components/SummaryCards.tsx';
import { UserListTable } from './components/UserListTable.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { SessionsModal } from './components/SessionsModal.tsx';
import { HowToGuideModal } from './components/HowToGuideModal.tsx';
import { UploadSession, DashboardStats, UploadResponse } from './types/index.ts';
import {
  fetchUploads as apiFetchUploads,
  fetchDashboard as apiFetchDashboard,
  deleteUploadSession,
  createDemoSessions,
} from './services/api.ts';
import {
  UploadCloud,
  Sparkles,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Instagram,
  FileCode,
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
  const loadUploads = useCallback(async () => {
    try {
      const data = await apiFetchUploads();
      setUploads(data);
      return data;
    } catch (err: any) {
      console.error('Error loading uploads:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch dashboard stats for an upload
  const loadDashboard = useCallback(
    async (uploadId: number, comparisonId?: number | null) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetchDashboard(uploadId, comparisonId);
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
      const list = await loadUploads();
      if (list.length > 0) {
        const latest = list[0].id;
        setCurrentUploadId(latest);
        await loadDashboard(latest);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [loadUploads, loadDashboard]);

  // When currentUploadId or compareWithId changes
  useEffect(() => {
    if (currentUploadId) {
      loadDashboard(currentUploadId, compareWithId);
    }
  }, [currentUploadId, compareWithId, loadDashboard]);

  // Handler for successful file upload
  const handleUploadSuccess = async (res: UploadResponse) => {
    showToast(`Successfully processed ${res.followersCount} followers and ${res.followingCount} following.`);
    await loadUploads();
    setCurrentUploadId(res.uploadId);
    setCompareWithId(null);
  };

  // Handler to load demo data
  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const data = await createDemoSessions();
      showToast('Demo sessions loaded. Comparing latest vs previous snapshot.');
      const updatedList = await loadUploads();
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
      await deleteUploadSession(id);
      showToast('Upload session deleted.');
      const list = await loadUploads();
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
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Toast Notification (Resend minimal floating toast) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-2xl border text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-zinc-900 text-rose-300 border-rose-500/30'
                : 'bg-zinc-900 text-zinc-200 border-zinc-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
        onRefresh={() => currentUploadId && loadDashboard(currentUploadId, compareWithId)}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Notice:</span> {error}
            </div>
          </div>
        )}

        {/* Empty State when no uploads exist (Resend Clean Obsidian Style) */}
        {!isLoading && uploads.length === 0 && (
          <div className="max-w-xl mx-auto my-12 text-center bg-[#09090b] border border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 flex items-center justify-center mb-4">
              <Instagram className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Instagram Follower Insights
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              Upload your official Instagram data export (JSON, HTML, or ZIP) to analyze unfollowers,
              mutual accounts, and non-reciprocal following. Export results to HTML or CSV.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-8">
              <button
                id="empty-upload-btn"
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-black bg-white hover:bg-zinc-200 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Export (JSON, HTML, ZIP)</span>
              </button>

              <button
                id="empty-demo-btn"
                type="button"
                onClick={handleLoadDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                <span>Load Demo Data</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How do I export Instagram data?</span>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="text-zinc-300 font-medium hover:underline cursor-pointer"
              >
                View step-by-step guide
              </button>
            </div>
          </div>
        )}

        {/* Active Dashboard View */}
        {dashboardStats && (
          <div className="space-y-5">
            {/* Session comparison banner */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                <span className="text-zinc-500 font-mono uppercase tracking-wider text-[11px]">
                  Comparison:
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-zinc-900 text-zinc-100 border border-zinc-700">
                  Active: {dashboardStats.currentUpload.label || `Session #${dashboardStats.currentUpload.id}`}
                </span>

                <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-600 hidden sm:inline" />

                {compareSession ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-zinc-950 text-zinc-400 border border-zinc-800">
                    Baseline: {compareSession.label || `Session #${compareSession.id}`}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">
                    No baseline session selected. Upload a 2nd export to compare unfollowers over time.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="change-comparison-btn"
                  type="button"
                  onClick={() => setIsSessionsModalOpen(true)}
                  className="text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                >
                  Change Baseline
                </button>
              </div>
            </div>

            {/* Summary Metrics */}
            <SummaryCards
              stats={dashboardStats}
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
            />

            {/* User List Table with HTML/CSV Export */}
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
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-zinc-400 mb-3" />
            <p className="text-xs font-medium text-zinc-400">
              Analyzing follower graph and calculating metrics...
            </p>
          </div>
        )}
      </main>

      {/* Footer (Resend minimalist subtle footer) */}
      <footer className="mt-auto border-t border-zinc-900 bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 font-sans font-medium">Follower Insights</span>
            <span>&bull;</span>
            <span>HTML &amp; CSV Exports</span>
            <span>&bull;</span>
            <span>Node.js / TypeScript &amp; PostgreSQL</span>
          </div>
          <div>
            Data is parsed locally and never shared with third parties.
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
