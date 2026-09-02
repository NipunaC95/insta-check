import React from 'react';
import { ActiveTab, Snapshot } from '../types';
import { Users, History, UploadCloud, HelpCircle, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  latestSnapshot?: Snapshot;
  onLoadDemo: () => void;
  snapshotsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  latestSnapshot,
  onLoadDemo,
  snapshotsCount,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center space-x-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-[2px] shadow-sm">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Users className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold text-slate-100 tracking-tight block">
                IG Snapshot Tracker
              </span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
                Follower & Unfollower Analytics
              </span>
            </div>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {latestSnapshot && (
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Results</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
            {snapshotsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {snapshotsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">How to Export</span>
          </button>

          {snapshotsCount === 0 && (
            <button
              onClick={onLoadDemo}
              className="ml-2 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
              title="Load sample snapshot data to preview the tool"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Demo Data</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
