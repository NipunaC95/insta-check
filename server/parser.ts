import AdmZip from 'adm-zip';

export interface ExtractedUser {
  username: string;
  profile_url: string;
  profile_pic_url?: string | null;
  timestamp?: number | null;
}

/**
 * Extracts a clean Instagram username from a string or link
 */
export function sanitizeUsername(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  // If it's a URL, extract the path segment
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const parsedUrl = new URL(cleaned);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        cleaned = segments[0];
      }
    } catch {
      // Fallback regex
      const match = cleaned.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      if (match) cleaned = match[1];
    }
  }
  // Strip leading @ or trailing slashes
  cleaned = cleaned.replace(/^@+/, '').replace(/\/+$/, '');
  return cleaned.toLowerCase();
}

/**
 * Parses raw Instagram JSON structure for followers or following
 */
export function parseInstagramJson(rawJson: string | object): ExtractedUser[] {
  let data: any;
  if (typeof rawJson === 'string') {
    try {
      data = JSON.parse(rawJson);
    } catch (err) {
      console.error('Failed to parse JSON string:', err);
      return [];
    }
  } else {
    data = rawJson;
  }

  const results: ExtractedUser[] = [];
  const seenUsernames = new Set<string>();

  // Helper to extract user from Instagram item object
  const processItem = (item: any) => {
    if (!item) return;

    let username = '';
    let profileUrl = '';
    let timestamp: number | null = null;
    let profilePicUrl: string | null = item.profile_pic_url || null;

    // Check string_list_data (standard Instagram export format)
    if (Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
      const first = item.string_list_data[0];
      if (first.value) {
        username = first.value;
      }
      if (first.href) {
        profileUrl = first.href;
      }
      if (first.timestamp) {
        timestamp = Number(first.timestamp);
      }
    }

    // Fallbacks if string_list_data wasn't populated or value was empty
    if (!username && item.title) {
      username = item.title;
    }
    if (!username && item.username) {
      username = item.username;
    }
    if (!username && item.value) {
      username = item.value;
    }

    // If profileUrl exists but username doesn't
    if (!username && profileUrl) {
      username = sanitizeUsername(profileUrl);
    }

    // Clean username
    username = sanitizeUsername(username);
    if (!username) return;

    if (!profileUrl) {
      profileUrl = `https://www.instagram.com/${username}/`;
    }

    if (!seenUsernames.has(username)) {
      seenUsernames.add(username);
      results.push({
        username,
        profile_url: profileUrl,
        profile_pic_url: profilePicUrl,
        timestamp,
      });
    }
  };

  // Determine root container
  if (Array.isArray(data)) {
    for (const item of data) {
      processItem(item);
    }
  } else if (data && typeof data === 'object') {
    // Check known wrapped fields
    if (Array.isArray(data.relationships_followers)) {
      for (const item of data.relationships_followers) {
        processItem(item);
      }
    } else if (Array.isArray(data.relationships_following)) {
      for (const item of data.relationships_following) {
        processItem(item);
      }
    } else if (Array.isArray(data.followers)) {
      for (const item of data.followers) {
        processItem(item);
      }
    } else if (Array.isArray(data.following)) {
      for (const item of data.following) {
        processItem(item);
      }
    } else {
      // Traverse keys if it's an object mapping
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (Array.isArray(val)) {
          for (const item of val) {
            processItem(item);
          }
        } else if (val && typeof val === 'object') {
          processItem(val);
        }
      }
    }
  }

  return results;
}

/**
 * Extracts followers and following lists from a ZIP buffer
 */
export function parseZipExport(buffer: Buffer): {
  followers: ExtractedUser[];
  following: ExtractedUser[];
} {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();

  let followers: ExtractedUser[] = [];
  let following: ExtractedUser[] = [];

  const followersMap = new Map<string, ExtractedUser>();
  const followingMap = new Map<string, ExtractedUser>();

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    const entryName = entry.entryName.toLowerCase();

    // Check followers file (e.g. followers_1.json, followers.json, etc.)
    if (entryName.includes('follower') && entryName.endsWith('.json')) {
      try {
        const text = entry.getData().toString('utf8');
        const list = parseInstagramJson(text);
        for (const u of list) {
          followersMap.set(u.username, u);
        }
      } catch (err) {
        console.error(`Error parsing ${entry.entryName} from zip:`, err);
      }
    }

    // Check following file (e.g. following.json, relationships_following.json)
    if (entryName.includes('following') && entryName.endsWith('.json')) {
      try {
        const text = entry.getData().toString('utf8');
        const list = parseInstagramJson(text);
        for (const u of list) {
          followingMap.set(u.username, u);
        }
      } catch (err) {
        console.error(`Error parsing ${entry.entryName} from zip:`, err);
      }
    }
  }

  followers = Array.from(followersMap.values());
  following = Array.from(followingMap.values());

  return { followers, following };
}
