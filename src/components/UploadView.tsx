import React, { useState, useRef } from 'react';
import { extractInstagramUsers } from '../services/parser';
import { saveSnapshot, seedDemoData } from '../services/storage';
import { InstagramUser, Snapshot } from '../types';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileCode,
  ArrowRight,
  Info,
} from 'lucide-react';

interface UploadViewProps {
  onSnapshotCreated: (snapshot: Snapshot) => void;
  onOpenGuide: () => void;
  onDemoLoaded: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onSnapshotCreated,
  onOpenGuide,
  onDemoLoaded,
}) => {
  const [note, setNote] = useState('');
  const [followersFile, setFollowersFile] = useState<{
    file: File;
    users: InstagramUser[];
  } | null>(null);
  const [followingFile, setFollowingFile] = useState<{
    file: File;
    users: InstagramUser[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const followersInputRef = useRef<HTMLInputElement>(null);
  const followingInputRef = useRef<HTMLInputElement>(null);

  const handleFollowersChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const users = extractInstagramUsers(text);
      if (users.length === 0) {
        throw new Error('No valid follower usernames found in this JSON file.');
      }
      setFollowersFile({ file, users });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse followers file.';
      setError(`Followers JSON Error: ${msg}`);
      setFollowersFile(null);
    }
  };

  const handleFollowingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const users = extractInstagramUsers(text);
      if (users.length === 0) {
        throw new Error('No valid following usernames found in this JSON file.');
      }
      setFollowingFile({ file, users });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse following file.';
      setError(`Following JSON Error: ${msg}`);
      setFollowingFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!followersFile || !followingFile) {
      setError('Please upload both followers.json and following.json files.');
      return;
    }

    setIsProcessing(true);
    try {
      const newSnapshot = saveSnapshot(
        followersFile.users,
        followingFile.users,
        note || undefined
      );
      onSnapshotCreated(newSnapshot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save snapshot';
      setError(msg);
      setIsProcessing(false);
    }
  };

  const handleLoadDemo = () => {
    const demos = seedDemoData();
    onDemoLoaded();
    if (demos.length > 0) {
      onSnapshotCreated(demos[0]); // newest snapshot
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Upload Instagram Snapshot
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Import your weekly data export to compare follower changes, unfollowers, and reciprocity.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>How to Export from Instagram</span>
          </button>
        </div>

        {/* Demo Data Quick Trigger */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-slate-900 border border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Want to test with sample data first?
              </h2>
              <p className="text-xs text-slate-400">
                Instantly load 2 weekly snapshots to preview unfollower and reciprocity analytics.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="load-demo-data-btn"
            onClick={handleLoadDemo}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Load Sample Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Main Upload Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Followers Upload Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                followersFile
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
              }`}
              onClick={() => followersInputRef.current?.click()}
            >
              <input
                ref={followersInputRef}
                type="file"
                id="followers"
                name="followers"
                accept=".json"
                className="hidden"
                onChange={handleFollowersChange}
              />

              {followersFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">
                    {followersFile.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Parsed <span className="font-bold text-slate-200">{followersFile.users.length}</span> followers
                  </p>
                  <span className="inline-block text-[11px] text-emerald-400/90 underline pt-1">
                    Click to replace file
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Followers File
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <code>followers.json</code> or <code>followers_1.json</code>
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Browse JSON File
                  </span>
                </div>
              )}
            </div>

            {/* Following Upload Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                followingFile
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
              }`}
              onClick={() => followingInputRef.current?.click()}
            >
              <input
                ref={followingInputRef}
                type="file"
                id="following"
                name="following"
                accept=".json"
                className="hidden"
                onChange={handleFollowingChange}
              />

              {followingFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">
                    {followingFile.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Parsed <span className="font-bold text-slate-200">{followingFile.users.length}</span> following accounts
                  </p>
                  <span className="inline-block text-[11px] text-emerald-400/90 underline pt-1">
                    Click to replace file
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Following File
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <code>following.json</code>
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Browse JSON File
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Snapshot Label/Note */}
          <div>
            <label
              htmlFor="note"
              className="block text-sm font-semibold text-slate-300 mb-1.5"
            >
              Upload Note / Tag <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Week 34 Snapshot, Post-Launch Checkup"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Give this snapshot a name to easily identify and compare it later in your history log.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="analyze-submit-btn"
            disabled={isProcessing || !followersFile || !followingFile}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
              isProcessing || !followersFile || !followingFile
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.99]'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Snapshot...' : 'Analyze & Save Snapshot'}</span>
          </button>
        </form>
      </div>

      {/* Quick Info / Instructions Callout */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
          <p className="text-slate-300 font-medium">Privacy & Security Note</p>
          <p>
            Your Instagram export files are processed strictly in your browser session and stored locally in your browser storage. No account passwords or login credentials are required.
          </p>
        </div>
      </div>
    </div>
  );
};
