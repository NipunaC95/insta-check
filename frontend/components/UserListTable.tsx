import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  ArrowUpDown,
  Download,
  FileCode,
  FileSpreadsheet,
  UserX,
  UserMinus,
  UserPlus,
  HeartHandshake,
  EyeOff,
  Users,
} from 'lucide-react';
import { UserRecord, DashboardStats } from '../types/index.ts';
import { exportToCSV, exportToHTML } from '../services/export.ts';
import { UserAvatar } from './UserAvatar.tsx';

interface UserListTableProps {
  stats: DashboardStats;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  stats,
  activeTab,
  onSelectTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copiedUser, setCopiedUser] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Tab definitions formatted in clean Resend monochrome/subtle accents
  const tabs = [
    {
      id: 'nonFollowersBack',
      label: "Don't Follow Back",
      count: stats.nonFollowersBackCount,
      icon: UserX,
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    },
    {
      id: 'unfollowers',
      label: 'Lost Followers',
      count: stats.unfollowersCount,
      icon: UserMinus,
      badgeClass: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    },
    {
      id: 'newFollowers',
      label: 'New Followers',
      count: stats.newFollowersCount,
      icon: UserPlus,
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    },
    {
      id: 'mutuals',
      label: 'Mutuals',
      count: stats.mutualsCount,
      icon: HeartHandshake,
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    },
    {
      id: 'fans',
      label: 'Fans',
      count: stats.fansCount,
      icon: EyeOff,
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    },
    {
      id: 'allFollowers',
      label: 'All Followers',
      count: stats.totalFollowers,
      icon: Users,
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    },
    {
      id: 'allFollowing',
      label: 'All Following',
      count: stats.totalFollowing,
      icon: Users,
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    },
  ];

  // Get raw list based on active tab
  const rawList: UserRecord[] = useMemo(() => {
    switch (activeTab) {
      case 'unfollowers':
        return stats.unfollowers;
      case 'nonFollowersBack':
        return stats.nonFollowersBack;
      case 'newFollowers':
        return stats.newFollowers;
      case 'fans':
        return stats.fans;
      case 'mutuals':
        return stats.mutuals;
      case 'allFollowers':
        return stats.allFollowers;
      case 'allFollowing':
        return stats.allFollowing;
      default:
        return stats.nonFollowersBack;
    }
  }, [activeTab, stats]);

  // Filter and sort list
  const filteredList = useMemo(() => {
    let result = rawList;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((u) => u.username.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      const cmp = a.username.localeCompare(b.username);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [rawList, searchTerm, sortDirection]);

  // Copy single username
  const handleCopyUsername = (username: string) => {
    navigator.clipboard.writeText(`@${username}`);
    setCopiedUser(username);
    setTimeout(() => setCopiedUser(null), 2000);
  };

  // Copy all visible usernames
  const handleCopyAll = () => {
    const text = filteredList.map((u) => `@${u.username}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  // Handle HTML report export
  const onExportHTML = () => {
    const currentLabel = stats.currentUpload.label || `Upload #${stats.currentUpload.id}`;
    const baseLabel = stats.previousUpload?.label || (stats.previousUpload ? `Upload #${stats.previousUpload.id}` : undefined);
    exportToHTML(activeTab, activeTabMeta.label, filteredList, currentLabel, baseLabel);
    setShowExportMenu(false);
  };

  // Handle CSV export
  const onExportCSV = () => {
    exportToCSV(activeTab, filteredList);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-[#09090b] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Resend-style Category Tabs Header */}
      <div className="border-b border-zinc-800/80 bg-black/40 overflow-x-auto scrollbar-none">
        <div className="flex items-center px-3 pt-2 gap-1 min-w-max">
          {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-zinc-900/90 text-white border-white'
                    : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/30'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-zinc-100' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action and Search Bar */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/40">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="user-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search username..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/70 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
          />
        </div>

        {/* Resend Controls: Sort, Copy All, and Exports (.html & .csv) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <button
            id="sort-toggle-btn"
            type="button"
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sort: {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </button>

          <button
            id="copy-all-btn"
            type="button"
            onClick={handleCopyAll}
            disabled={filteredList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied All</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Handles</span>
              </>
            )}
          </button>

          {/* Export Buttons: HTML Report & CSV */}
          <div className="relative inline-flex items-center gap-1.5">
            {/* Direct HTML Export Button (Resend Primary Style) */}
            <button
              id="export-html-btn"
              type="button"
              onClick={onExportHTML}
              disabled={filteredList.length === 0}
              title="Export standalone interactive HTML report with search and links"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export HTML</span>
            </button>

            {/* Direct CSV Export Button (Resend Secondary Style) */}
            <button
              id="export-csv-btn"
              type="button"
              onClick={onExportCSV}
              disabled={filteredList.length === 0}
              title="Export as CSV spreadsheet"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table / List View */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <activeTabMeta.icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200">
            {searchTerm ? 'No matching usernames' : `No accounts in ${activeTabMeta.label}`}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No usernames matched "${searchTerm}". Try another search term.`
              : activeTab === 'unfollowers' && !stats.previousUpload
              ? 'Upload a second export session to compare and see who unfollowed you over time.'
              : 'All caught up. No accounts fall into this category.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">
                <th className="px-4 sm:px-6 py-3 w-12 text-center">#</th>
                <th className="px-4 sm:px-6 py-3">Account</th>
                <th className="px-4 sm:px-6 py-3 hidden sm:table-cell">Profile URL</th>
                <th className="px-4 sm:px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filteredList.map((user, idx) => {
                const isCopied = copiedUser === user.username;

                return (
                  <tr
                    key={`${user.username}-${idx}`}
                    className="hover:bg-zinc-900/40 transition-colors group"
                  >
                    {/* Index */}
                    <td className="px-4 sm:px-6 py-3 text-center text-zinc-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* User info & handle link */}
                    <td className="px-4 sm:px-6 py-3">
                      <a
                        href={user.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 group/user-link hover:opacity-95 transition-opacity"
                        title={`View @${user.username}'s profile on Instagram`}
                      >
                        <UserAvatar user={user} sizeClass="w-7 h-7" />
                        <div>
                          <span className="font-mono font-medium text-zinc-200 group-hover/user-link:text-white group-hover/user-link:underline transition-colors block">
                            @{user.username}
                          </span>
                          <span className="text-[10px] text-zinc-500 block sm:hidden">
                            instagram.com/{user.username}
                          </span>
                        </div>
                      </a>
                    </td>

                    {/* Desktop URL display link */}
                    <td className="px-4 sm:px-6 py-3 hidden sm:table-cell">
                      <a
                        href={user.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline inline-flex items-center gap-2 font-mono text-[11px]"
                        title={`Open link: ${user.profile_url}`}
                      >
                        <UserAvatar user={user} sizeClass="w-4 h-4" />
                        <span className="truncate max-w-xs">{user.profile_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                      </a>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyUsername(user.username)}
                          title="Copy @handle"
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <a
                          href={user.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-colors"
                          title={`Visit profile of ${user.username}`}
                        >
                          <UserAvatar user={user} sizeClass="w-4 h-4" />
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count and export hint */}
      <div className="px-4 sm:px-6 py-3 border-t border-zinc-800/80 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          Showing <span className="font-medium text-zinc-300">{filteredList.length}</span> of{' '}
          <span className="font-medium text-zinc-300">{rawList.length}</span> accounts
        </span>

        <div className="flex items-center gap-3">
          {stats.previousUpload && activeTab === 'unfollowers' && (
            <span className="text-zinc-500 text-xs hidden sm:inline">
              Baseline: {stats.previousUpload.label || `Upload #${stats.previousUpload.id}`}
            </span>
          )}
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-zinc-500 text-[11px]">
            Formats supported: <strong className="text-zinc-400">.html</strong> report &amp;{' '}
            <strong className="text-zinc-400">.csv</strong> data
          </span>
        </div>
      </div>
    </div>
  );
};
