import AdmZip from 'adm-zip';
import type { ExtractedUser } from '../types/index.ts';

const RESERVED_HANDLES = new Set([
  '_u',
  'u',
  'instagram',
  'about',
  'legal',
  'explore',
  'reels',
  'stories',
  'direct',
  'accounts',
  'developer',
  'terms',
  'privacy',
  'help',
  'api',
  'graphql',
  'p',
  'reel',
  'tv',
  'channel',
  'meta',
  'threads',
  'support',
  'login',
  'signup',
  'settings',
  'instagram user',
  'null',
  'undefined',
]);

/**
 * Validates whether a given string is a valid Instagram username handle.
 * Instagram handles: 1-30 chars, alphanumeric + dots + underscores, no leading/trailing dots, no double dots.
 */
export function isValidInstagramHandle(handle: string): boolean {
  if (!handle) return false;
  const clean = handle.trim().toLowerCase();
  if (clean.length < 1 || clean.length > 30) return false;
  if (!/^[a-z0-9._]+$/.test(clean)) return false;
  if (clean.startsWith('.') || clean.endsWith('.')) return false;
  if (clean.includes('..')) return false;
  if (RESERVED_HANDLES.has(clean)) return false;
  return true;
}

/**
 * Sanitizes and normalizes an Instagram username or URL.
 * Accurately extracts the handle from URLs, including Instagram's mobile `_u/<username>` redirect paths.
 */
export function sanitizeUsername(raw: string): string {
  if (!raw) return '';
  // Strip zero-width spaces, non-breaking spaces, and trim
  let cleaned = raw.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();

  // If it's a URL or contains an Instagram web link, extract the actual username path segment
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.includes('instagram.com/')) {
    try {
      const urlStr = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
      const parsedUrl = new URL(urlStr);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        // Handle Instagram mobile redirects: /_u/<username> or /u/<username>
        if ((segments[0] === '_u' || segments[0] === 'u') && segments.length > 1) {
          cleaned = segments[1];
        } else if (segments.length >= 2 && (segments[0] === 'reel' || segments[0] === 'p' || segments[0] === 'stories')) {
          // If URL points to post/reel/story, not a user profile
          return '';
        } else {
          cleaned = segments[0];
        }
      }
    } catch {
      const match = cleaned.match(/instagram\.com\/(?:_u\/)?([a-zA-Z0-9._]+)/i);
      if (match) cleaned = match[1];
    }
  }

  // Strip query strings, hash fragments, leading @, and trailing slashes
  cleaned = cleaned.split('?')[0].split('#')[0];
  cleaned = cleaned.replace(/^@+/, '').replace(/\/+$/, '').trim().toLowerCase();

  if (RESERVED_HANDLES.has(cleaned)) return '';
  return cleaned;
}

/**
 * Detects whether a parsed object, string content, or file represents followers, following, or both.
 * Prioritizes explicit filename conventions when available.
 */
export function detectInstagramDataRole(
  content: string | object,
  fileName?: string
): 'followers' | 'following' | 'both' | 'unknown' {
  // If fileName is provided, check explicit filename conventions
  if (fileName) {
    const base = fileName.split('/').pop()?.toLowerCase() || '';
    if (
      base.includes('pending') ||
      base.includes('recent_follow') ||
      base.includes('unfollowed') ||
      base.includes('close_friends') ||
      base.includes('blocked') ||
      base.includes('suggestions')
    ) {
      return 'unknown';
    }
    if (/^followers(_\d+)?\.(json|html?)$/i.test(base) || base === 'followers.json' || base === 'followers.html') {
      return 'followers';
    }
    if (
      /^following(_\d+)?\.(json|html?)$/i.test(base) ||
      base === 'following.json' ||
      base === 'following.html' ||
      base === 'relationships_following.json'
    ) {
      return 'following';
    }
  }

  let data: any = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch {
      // HTML content role detection
      const lower = content.trim().toLowerCase();
      if (/<title[^>]*>[^<]*follower/i.test(lower) || /<h[123][^>]*>[^<]*follower/i.test(lower)) {
        return 'followers';
      }
      if (/<title[^>]*>[^<]*following/i.test(lower) || /<h[123][^>]*>[^<]*following/i.test(lower)) {
        return 'following';
      }
      if (fileName) {
        const lowerFile = fileName.toLowerCase();
        if (lowerFile.includes('follower')) return 'followers';
        if (lowerFile.includes('following')) return 'following';
      }
      return 'unknown';
    }
  }

  if (!data) return 'unknown';

  if (typeof data === 'object' && !Array.isArray(data)) {
    if (data.relationships_following && data.relationships_followers) return 'both';
    if (data.relationships_following || data.following) return 'following';
    if (data.relationships_followers || data.followers) return 'followers';
  }

  if (Array.isArray(data)) {
    for (const item of data.slice(0, 15)) {
      if (item && typeof item === 'object') {
        // In following exports, item.title contains the followed user's handle
        if (typeof item.title === 'string' && item.title.trim().length > 0) {
          return 'following';
        }
      }
    }
    if (fileName && fileName.toLowerCase().includes('following')) {
      return 'following';
    }
    return 'followers';
  }

  return 'unknown';
}

/**
 * Parses raw Instagram JSON structure for followers or following.
 */
export function parseInstagramJson(rawJson: string | object): ExtractedUser[] {
  let data: any;
  if (typeof rawJson === 'string') {
    try {
      data = JSON.parse(rawJson);
    } catch {
      return parseInstagramHtml(rawJson);
    }
  } else {
    data = rawJson;
  }

  const results: ExtractedUser[] = [];
  const seenUsernames = new Set<string>();

  const processItem = (item: any) => {
    if (!item || typeof item !== 'object') return;

    let username = '';
    let timestamp: number | null = null;
    let profilePicUrl: string | null = item.profile_pic_url || null;

    // Check string_list_data (standard Instagram export format)
    if (Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
      for (const entry of item.string_list_data) {
        if (!entry) continue;

        let candidate = '';
        // 1. If entry.href exists, extract handle from href
        if (entry.href) {
          const fromHref = sanitizeUsername(entry.href);
          if (isValidInstagramHandle(fromHref)) {
            candidate = fromHref;
          }
        }

        // 2. If entry.value is a valid handle, it can also be used
        if (entry.value) {
          const fromVal = sanitizeUsername(entry.value);
          if (isValidInstagramHandle(fromVal)) {
            candidate = fromVal;
          }
        }

        if (candidate && !username) {
          username = candidate;
        }
        if (entry.timestamp && !timestamp) {
          timestamp = Number(entry.timestamp);
        }
      }
    }

    // Fallbacks if string_list_data didn't yield a valid username
    if (!username && item.title) {
      const fromTitle = sanitizeUsername(item.title);
      if (isValidInstagramHandle(fromTitle)) {
        username = fromTitle;
      }
    }
    if (!username && item.username) {
      const fromUsername = sanitizeUsername(item.username);
      if (isValidInstagramHandle(fromUsername)) {
        username = fromUsername;
      }
    }
    if (!username && item.value) {
      const fromValue = sanitizeUsername(item.value);
      if (isValidInstagramHandle(fromValue)) {
        username = fromValue;
      }
    }

    if (!username || !isValidInstagramHandle(username)) return;

    const canonicalProfileUrl = `https://www.instagram.com/${username}/`;

    if (!seenUsernames.has(username)) {
      seenUsernames.add(username);
      results.push({
        username,
        profile_url: canonicalProfileUrl,
        profile_pic_url: profilePicUrl,
        timestamp,
      });
    }
  };

  if (Array.isArray(data)) {
    for (const item of data) {
      processItem(item);
    }
  } else if (data && typeof data === 'object') {
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
      // Traverse keys in case of arbitrary wrapper objects
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
 * Parses Instagram HTML export files (e.g. followers_1.html, following.html)
 */
export function parseInstagramHtml(htmlContent: string): ExtractedUser[] {
  const results: ExtractedUser[] = [];
  const seenUsernames = new Set<string>();

  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1] || '';
    const innerText = (match[2] || '').replace(/<[^>]+>/g, '').trim();

    let username = '';
    if (href.includes('instagram.com')) {
      username = sanitizeUsername(href);
    }
    if ((!username || !isValidInstagramHandle(username)) && innerText) {
      username = sanitizeUsername(innerText);
    }

    if (username && isValidInstagramHandle(username) && !seenUsernames.has(username)) {
      seenUsernames.add(username);
      results.push({
        username,
        profile_url: `https://www.instagram.com/${username}/`,
        profile_pic_url: null,
        timestamp: null,
      });
    }
  }

  return results;
}

/**
 * Universal parser that handles either JSON or HTML formatted Instagram export strings
 */
export function parseInstagramData(content: string): ExtractedUser[] {
  const trimmed = content.trim();
  if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE') || trimmed.includes('<html')) {
    return parseInstagramHtml(trimmed);
  }
  return parseInstagramJson(trimmed);
}

/**
 * Extracts followers and following lists from a ZIP archive buffer.
 * Accurately handles directory nesting like `connections/followers_and_following/` without cross-contamination.
 */
export function parseZipExport(buffer: Buffer): {
  followers: ExtractedUser[];
  following: ExtractedUser[];
} {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();

  const followersMap = new Map<string, ExtractedUser>();
  const followingMap = new Map<string, ExtractedUser>();

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    // Basename isolation: prevent folder names like `followers_and_following` from causing cross-matches
    const entryPath = entry.entryName.replace(/\\/g, '/');
    const baseName = entryPath.split('/').pop()?.toLowerCase() || '';

    // Ignore ancillary files
    if (
      baseName.includes('pending') ||
      baseName.includes('recent_follow') ||
      baseName.includes('unfollowed') ||
      baseName.includes('close_friends') ||
      baseName.includes('blocked') ||
      baseName.includes('suggestions') ||
      baseName.includes('message')
    ) {
      continue;
    }

    const isJsonOrHtml = baseName.endsWith('.json') || baseName.endsWith('.html') || baseName.endsWith('.htm');
    if (!isJsonOrHtml) continue;

    // Followers files (e.g. followers_1.json, followers_2.json, followers.json, followers_1.html)
    const isFollowersFile = /^followers(_\d+)?\.(json|html?)$/i.test(baseName);

    // Following files (e.g. following.json, following_1.json, following.html, relationships_following.json)
    const isFollowingFile =
      /^following(_\d+)?\.(json|html?)$/i.test(baseName) || baseName === 'relationships_following.json';

    if (isFollowersFile) {
      try {
        const text = entry.getData().toString('utf8');
        const list = parseInstagramData(text);
        for (const u of list) {
          followersMap.set(u.username, u);
        }
      } catch (err) {
        console.error(`Error parsing followers file ${entry.entryName} from zip:`, err);
      }
    } else if (isFollowingFile) {
      try {
        const text = entry.getData().toString('utf8');
        const list = parseInstagramData(text);
        for (const u of list) {
          followingMap.set(u.username, u);
        }
      } catch (err) {
        console.error(`Error parsing following file ${entry.entryName} from zip:`, err);
      }
    } else {
      // Content sniffing fallback if filename does not strictly match standard patterns
      try {
        const text = entry.getData().toString('utf8');
        const role = detectInstagramDataRole(text, baseName);
        if (role === 'followers') {
          const list = parseInstagramData(text);
          for (const u of list) followersMap.set(u.username, u);
        } else if (role === 'following') {
          const list = parseInstagramData(text);
          for (const u of list) followingMap.set(u.username, u);
        } else if (role === 'both') {
          try {
            const obj = JSON.parse(text);
            if (obj.relationships_followers) {
              for (const u of parseInstagramJson(obj.relationships_followers)) followersMap.set(u.username, u);
            }
            if (obj.relationships_following) {
              for (const u of parseInstagramJson(obj.relationships_following)) followingMap.set(u.username, u);
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore unrecognized non-connection files
      }
    }
  }

  return {
    followers: Array.from(followersMap.values()),
    following: Array.from(followingMap.values()),
  };
}
