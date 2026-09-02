import { Snapshot, AnalysisResult, InstagramUser } from '../types';

export function computeAnalysis(
  currentSnapshot: Snapshot,
  prevSnapshot: Snapshot | null
): AnalysisResult {
  const currentFollowersMap = new Map<string, InstagramUser>();
  for (const user of currentSnapshot.followers) {
    currentFollowersMap.set(user.username.toLowerCase(), user);
  }

  const currentFollowingMap = new Map<string, InstagramUser>();
  for (const user of currentSnapshot.following) {
    currentFollowingMap.set(user.username.toLowerCase(), user);
  }

  // 1. Following who don't follow you back (in following, not in followers)
  const notFollowingBack: InstagramUser[] = [];
  for (const [username, user] of currentFollowingMap) {
    if (!currentFollowersMap.has(username)) {
      notFollowingBack.push(user);
    }
  }
  notFollowingBack.sort((a, b) => a.username.localeCompare(b.username));

  // 2. Fans (in followers, not in following)
  const fans: InstagramUser[] = [];
  for (const [username, user] of currentFollowersMap) {
    if (!currentFollowingMap.has(username)) {
      fans.push(user);
    }
  }
  fans.sort((a, b) => a.username.localeCompare(b.username));

  // 3. Mutuals (in both)
  const mutuals: InstagramUser[] = [];
  for (const [username, user] of currentFollowersMap) {
    if (currentFollowingMap.has(username)) {
      mutuals.push(user);
    }
  }
  mutuals.sort((a, b) => a.username.localeCompare(b.username));

  // 4. Temporal diffs if previous snapshot exists
  const unfollowers: InstagramUser[] = [];
  const newFollowers: InstagramUser[] = [];
  const unfollowedByYou: InstagramUser[] = [];
  const newFollowing: InstagramUser[] = [];

  if (prevSnapshot) {
    const prevFollowersMap = new Map<string, InstagramUser>();
    for (const user of prevSnapshot.followers) {
      prevFollowersMap.set(user.username.toLowerCase(), user);
    }

    const prevFollowingMap = new Map<string, InstagramUser>();
    for (const user of prevSnapshot.following) {
      prevFollowingMap.set(user.username.toLowerCase(), user);
    }

    // Unfollowers: were in previous followers, not in current
    for (const [username, user] of prevFollowersMap) {
      if (!currentFollowersMap.has(username)) {
        unfollowers.push(user);
      }
    }
    unfollowers.sort((a, b) => a.username.localeCompare(b.username));

    // New followers: in current followers, not in previous
    for (const [username, user] of currentFollowersMap) {
      if (!prevFollowersMap.has(username)) {
        newFollowers.push(user);
      }
    }
    newFollowers.sort((a, b) => a.username.localeCompare(b.username));

    // Unfollowed by you: were in previous following, not in current
    for (const [username, user] of prevFollowingMap) {
      if (!currentFollowingMap.has(username)) {
        unfollowedByYou.push(user);
      }
    }
    unfollowedByYou.sort((a, b) => a.username.localeCompare(b.username));

    // New following: in current following, not in previous
    for (const [username, user] of currentFollowingMap) {
      if (!prevFollowingMap.has(username)) {
        newFollowing.push(user);
      }
    }
    newFollowing.sort((a, b) => a.username.localeCompare(b.username));
  }

  return {
    snapshot: currentSnapshot,
    prevSnapshot,
    stats: {
      followersCount: currentSnapshot.followers.length,
      followingCount: currentSnapshot.following.length,
      mutualCount: mutuals.length,
      notFollowingBackCount: notFollowingBack.length,
      fansCount: fans.length,
    },
    notFollowingBack,
    fans,
    mutuals,
    unfollowers,
    newFollowers,
    unfollowedByYou,
    newFollowing,
  };
}

export function exportUsersToCsv(users: InstagramUser[], filename: string) {
  const headers = ['Username', 'Profile URL', 'Timestamp', 'Date Added'];
  const rows = users.map((u) => {
    const dateStr = u.timestamp ? new Date(u.timestamp * 1000).toISOString() : '';
    return [
      `"${u.username.replace(/"/g, '""')}"`,
      `"${u.profileUrl.replace(/"/g, '""')}"`,
      u.timestamp ? `${u.timestamp}` : '',
      `"${dateStr}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
