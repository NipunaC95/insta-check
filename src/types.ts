export interface UserRecord {
  id?: number;
  username: string;
  profile_url: string;
  profile_pic_url?: string | null;
  timestamp?: number | null;
}

export interface UploadSession {
  id: number;
  uploaded_at: string;
  label?: string | null;
  followers_count: number;
  following_count: number;
}

export interface DashboardStats {
  currentUpload: UploadSession;
  previousUpload?: UploadSession | null;
  totalFollowers: number;
  totalFollowing: number;
  unfollowersCount: number;
  nonFollowersBackCount: number;
  newFollowersCount: number;
  fansCount: number;
  mutualsCount: number;
  unfollowers: UserRecord[];
  nonFollowersBack: UserRecord[];
  newFollowers: UserRecord[];
  fans: UserRecord[];
  mutuals: UserRecord[];
  allFollowers: UserRecord[];
  allFollowing: UserRecord[];
}

export interface UploadResponse {
  success: boolean;
  message: string;
  uploadId: number;
  followersCount: number;
  followingCount: number;
  label?: string | null;
  uploadedAt: string;
}
