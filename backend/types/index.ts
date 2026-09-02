export interface ExtractedUser {
  username: string;
  profile_url: string;
  profile_pic_url?: string | null;
  timestamp?: number | null;
}

export interface UploadRow {
  id: number;
  uploaded_at: string;
  label: string | null;
  followers_count: number;
  following_count: number;
}

export interface UserRow {
  id: number;
  upload_id: number;
  username: string;
  profile_url: string;
  profile_pic_url: string | null;
}

export interface DashboardStats {
  currentUpload: UploadRow;
  previousUpload: UploadRow | null;
  totalFollowers: number;
  totalFollowing: number;
  nonFollowersBackCount: number;
  unfollowersCount: number;
  newFollowersCount: number;
  mutualsCount: number;
  fansCount: number;
  nonFollowersBack: ExtractedUser[];
  unfollowers: ExtractedUser[];
  newFollowers: ExtractedUser[];
  mutuals: ExtractedUser[];
  fans: ExtractedUser[];
  allFollowers: ExtractedUser[];
  allFollowing: ExtractedUser[];
}
