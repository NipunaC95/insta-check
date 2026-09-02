import React from 'react';
import { Users, UserMinus, UserX, UserPlus, HeartHandshake, EyeOff } from 'lucide-react';
import { DashboardStats } from '../types.ts';

interface SummaryCardsProps {
  stats: DashboardStats;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  activeTab,
  onSelectTab,
}) => {
  const followerDiff = stats.previousUpload
    ? stats.totalFollowers - stats.previousUpload.followers_count
    : null;

  const cards = [
    {
      id: 'nonFollowersBack',
      title: "Don't Follow Back",
      count: stats.nonFollowersBackCount,
      subtitle: 'Users you follow who do not follow back',
      icon: UserX,
      color: 'amber',
      textColor: 'text-[#ff4d4d]',
      badgeBg: 'bg-red-500/10',
      badgeColor: 'text-[#ff4d4d]',
      highlight: true,
    },
    {
      id: 'unfollowers',
      title: 'Lost Followers',
      count: stats.unfollowersCount,
      subtitle: stats.previousUpload ? 'Unfollowed since last export' : 'Compare with previous export',
      icon: UserMinus,
      color: 'rose',
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-400/10',
      badgeColor: 'text-blue-400',
      highlight: true,
    },
    {
      id: 'newFollowers',
      title: 'New Followers',
      count: stats.newFollowersCount,
      subtitle: stats.previousUpload ? 'Gained since last export' : 'Compare with previous export',
      icon: UserPlus,
      color: 'emerald',
      textColor: 'text-green-400',
      badgeBg: 'bg-green-500/10',
      badgeColor: 'text-green-400',
      highlight: false,
    },
    {
      id: 'mutuals',
      title: 'Mutual Friends',
      count: stats.mutualsCount,
      subtitle: 'You follow each other',
      icon: HeartHandshake,
      color: 'indigo',
      textColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10',
      badgeColor: 'text-indigo-400',
      highlight: false,
    },
    {
      id: 'fans',
      title: 'Fans (Not Followed Back)',
      count: stats.fansCount,
      subtitle: 'They follow you, you do not follow back',
      icon: EyeOff,
      color: 'purple',
      textColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/10',
      badgeColor: 'text-purple-400',
      highlight: false,
    },
    {
      id: 'allFollowers',
      title: 'Total Followers',
      count: stats.totalFollowers,
      subtitle: followerDiff !== null
        ? `${followerDiff >= 0 ? `+${followerDiff}` : followerDiff} vs previous session`
        : 'Current export snapshot',
      icon: Users,
      color: 'slate',
      textColor: 'text-white',
      badgeBg: 'bg-white/10',
      badgeColor: 'text-white/70',
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeTab === card.id;

        return (
          <button
            key={card.id}
            id={`summary-card-${card.id}`}
            type="button"
            onClick={() => onSelectTab(card.id)}
            className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              isSelected
                ? 'bg-[#1c1c1c] border-white/20 ring-1 ring-white/20 shadow-xl'
                : 'bg-[#161616] border-white/5 hover:border-white/15 hover:bg-[#191919]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.badgeBg} ${card.badgeColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${card.textColor}`}>
                {card.count.toLocaleString()}
              </span>
            </div>

            <p className="text-[10px] text-white/40 mt-1.5 line-clamp-1 font-medium">
              {card.subtitle}
            </p>

            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
