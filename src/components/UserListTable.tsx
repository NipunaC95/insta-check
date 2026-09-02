import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  ArrowUpDown,
  Download,
  UserX,
  UserMinus,
  UserPlus,
  HeartHandshake,
  EyeOff,
  Users,
} from 'lucide-react';
import { UserRecord, DashboardStats } from '../types.ts';

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

  // Tab definitions
  const tabs = [
    {
      id: 'nonFollowersBack',
      label: "Don't Follow Back",
      count: stats.nonFollowersBackCount,
      icon: UserX,
      color: 'amber',
      badgeClass: 'bg-red-500/10 text-[#ff4d4d]',
    },
    {
      id: 'unfollowers',
      label: 'Lost Followers',
      count: stats.unfollowersCount,
      icon: UserMinus,
      color: 'rose',
      badgeClass: 'bg-blue-400/10 text-blue-400',
    },
    {
      id: 'newFollowers',
      label: 'New Followers',
      count: stats.newFollowersCount,
      icon: UserPlus,
      color: 'emerald',
      badgeClass: 'bg-green-500/10 text-green-400',
    },
    {
      id: 'mutuals',
      label: 'Mutuals',
      count: stats.mutualsCount,
      icon: HeartHandshake,
      color: 'indigo',
      badgeClass: 'bg-indigo-500/10 text-indigo-400',
    },
    {
      id: 'fans',
      label: 'Fans',
      count: stats.fansCount,
      icon: EyeOff,
      color: 'purple',
      badgeClass: 'bg-purple-500/10 text-purple-400',
    },
    {
      id: 'allFollowers',
      label: 'All Followers',
      count: stats.totalFollowers,
      icon: Users,
      color: 'slate',
      badgeClass: 'bg-white/10 text-white/80',
    },
    {
      id: 'allFollowing',
      label: 'All Following',
      count: stats.totalFollowing,
      icon: Users,
      color: 'slate',
      badgeClass: 'bg-white/10 text-white/80',
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
    navigator.clipboard.writeText(username);
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

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = ['username,profile_url'];
    for (const u of filteredList) {
      csvRows.push(`"${u.username}","${u.profile_url}"`);
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Avatar helper with nice gradient or initial
  const getAvatarGradient = (username: string) => {
    const charCode = username.charCodeAt(0) || 0;
    const gradients = [
      'from-rose-500 to-amber-500',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-indigo-600',
      'from-teal-500 to-emerald-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
    ];
    return gradients[charCode % gradients.length];
  };

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="bg-[#161616] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
      {/* Category Tabs Header */}
      <div className="border-b border-white/5 bg-[#121212] overflow-x-auto scrollbar-none">
        <div className="flex items-center px-4 pt-3 gap-1 min-w-max">
          {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#161616] text-white border-[#dc2743] shadow-sm'
                    : 'text-white/50 hover:text-white border-transparent hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#dc2743]' : 'text-white/40'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isCurrent ? tab.badgeClass : 'bg-white/5 text-white/40'
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
      <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02]">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="user-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search username..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-black/40 border border-white/10 rounded-md text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/20 transition-colors"
          />
        </div>

        {/* Controls: Sort, Copy All, Export */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            id="sort-toggle-btn"
            type="button"
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
            <span>Sort: {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </button>

          <button
            id="copy-all-btn"
            type="button"
            onClick={handleCopyAll}
            disabled={filteredList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied All</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/40" />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            disabled={filteredList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white/60" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table / List View */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-3">
            <activeTabMeta.icon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white/80">
            {searchTerm ? 'No matching usernames' : `No accounts in ${activeTabMeta.label}`}
          </h3>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No usernames matched "${searchTerm}". Try another search term.`
              : activeTab === 'unfollowers' && !stats.previousUpload
              ? 'Upload a second export session to compare and see who unfollowed you over time!'
              : 'All set! No accounts fall into this category.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#141414] text-[10px] uppercase tracking-widest text-white/30 font-bold">
                <th className="px-4 sm:px-6 py-4">User</th>
                <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Profile Link</th>
                <th className="px-4 sm:px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredList.map((user, idx) => {
                const gradient = getAvatarGradient(user.username);
                const isCopied = copiedUser === user.username;

                return (
                  <tr
                    key={`${user.username}-${idx}`}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* User info */}
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {/* Profile Picture or Placeholder Avatar */}
                        {user.profile_pic_url ? (
                          <img
                            src={user.profile_pic_url}
                            alt={user.username}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-white/20 ring-1 ring-pink-500/30"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-tr ${gradient} text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/10`}
                          >
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                              @{user.username}
                            </span>
                          </div>
                          <span className="text-[11px] text-white/40 block sm:hidden">
                            instagram.com/{user.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Desktop URL display */}
                    <td className="px-4 sm:px-6 py-3.5 hidden sm:table-cell">
                      <a
                        href={user.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/60 hover:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-xs">{user.profile_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                      </a>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 sm:px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyUsername(user.username)}
                          title="Copy Username"
                          className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <a
                          href={user.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md border border-blue-500/20 hover:underline transition-colors"
                        >
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

      {/* Footer count summary */}
      <div className="px-4 sm:px-6 py-3 border-t border-white/5 bg-[#121212]/80 flex items-center justify-between text-xs text-white/40">
        <span>
          Showing <span className="font-semibold text-white">{filteredList.length}</span> of{' '}
          <span className="font-semibold text-white">{rawList.length}</span> accounts
        </span>
        {stats.previousUpload && activeTab === 'unfollowers' && (
          <span className="hidden sm:inline text-white/40">
            Compared with {stats.previousUpload.label || `Upload #${stats.previousUpload.id}`}
          </span>
        )}
      </div>
    </div>
  );
};
