import React from 'react';
import { Users, UserMinus, UserX, UserPlus, HeartHandshake, EyeOff } from 'lucide-react';
import { DashboardStats } from '../types/index.ts';

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
      subtitle: 'Accounts you follow who do not follow back',
      icon: UserX,
      badgeText: 'Lost reciprocity',
    },
    {
      id: 'unfollowers',
      title: 'Lost Followers',
      count: stats.unfollowersCount,
      subtitle: stats.previousUpload ? 'Unfollowed since previous export' : 'Compare with previous export',
      icon: UserMinus,
      badgeText: 'Unfollowed',
    },
    {
      id: 'newFollowers',
      title: 'New Followers',
      count: stats.newFollowersCount,
      subtitle: stats.previousUpload ? 'Gained since previous export' : 'Compare with previous export',
      icon: UserPlus,
      badgeText: 'Gained',
    },
    {
      id: 'mutuals',
      title: 'Mutual Friends',
      count: stats.mutualsCount,
      subtitle: 'Accounts you follow each other mutually',
      icon: HeartHandshake,
      badgeText: 'Mutual',
    },
    {
      id: 'fans',
      title: 'Fans',
      count: stats.fansCount,
      subtitle: 'Followers you do not follow back',
      icon: EyeOff,
      badgeText: 'Followers only',
    },
    {
      id: 'allFollowers',
      title: 'Total Followers',
      count: stats.totalFollowers,
      subtitle:
        followerDiff !== null
          ? `${followerDiff >= 0 ? `+${followerDiff}` : followerDiff} vs previous session`
          : 'Current export snapshot',
      icon: Users,
      badgeText: 'Total',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeTab === card.id;

        return (
          <button
            key={card.id}
            id={`summary-card-${card.id}`}
            type="button"
            onClick={() => onSelectTab(card.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer relative overflow-hidden group ${
              isSelected
                ? 'bg-zinc-900/90 border-zinc-400 ring-1 ring-zinc-400/20 shadow-xl'
                : 'bg-[#09090b] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-zinc-400">
                {card.title}
              </span>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-900 border-zinc-800/80 text-zinc-500 group-hover:text-zinc-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
                {card.count.toLocaleString()}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
              {card.subtitle}
            </p>

            {isSelected && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
};
