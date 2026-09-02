export interface InstagramUser {
  username: string;
  profileUrl: string;
  timestamp?: number | null;
}

export interface Snapshot {
  id: number;
  uploadedAt: string;
  note: string;
  followers: InstagramUser[];
  following: InstagramUser[];
}

export interface AnalysisStats {
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  notFollowingBackCount: number;
  fansCount: number;
}

export interface TemporalDiff {
  unfollowers: InstagramUser[];
  newFollowers: InstagramUser[];
  unfollowedByYou: InstagramUser[];
  newFollowing: InstagramUser[];
}

export interface AnalysisResult {
  snapshot: Snapshot;
  prevSnapshot: Snapshot | null;
  stats: AnalysisStats;
  notFollowingBack: InstagramUser[];
  fans: InstagramUser[];
  mutuals: InstagramUser[];
  unfollowers: InstagramUser[];
  newFollowers: InstagramUser[];
  unfollowedByYou: InstagramUser[];
  newFollowing: InstagramUser[];
}

export type ActiveTab = 'upload' | 'results' | 'history' | 'guide';
