import AdmZip from 'adm-zip';
import { ExtractedUser } from '../types/index.ts';

/**
 * Sanitizes and normalizes an Instagram username or URL
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
    } catch {
      // If it fails to parse as JSON, check if it's HTML
      return parseInstagramHtml(rawJson);
    }
  } else {
    data = rawJson;
  }

  const results: ExtractedUser[] = [];
  const seenUsernames = new Set<string>();

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

    // Fallbacks if string_list_data wasn't populated
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

  // Regular expression to match links pointing to instagram profiles or text inside links
  // Patterns like: <a target="_blank" href="https://www.instagram.com/username">username</a>
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1] || '';
    const innerText = (match[2] || '').replace(/<[^>]+>/g, '').trim();

    let username = '';
    if (href.includes('instagram.com')) {
      username = sanitizeUsername(href);
    }
    if (!username && innerText) {
      username = sanitizeUsername(innerText);
    }

    if (username && !seenUsernames.has(username)) {
      // Exclude common Instagram UI links (like /legal, /about, etc.)
      const excluded = ['about', 'legal', 'explore', 'reels', 'direct', 'accounts', 'developer', 'terms', 'privacy'];
      if (!excluded.includes(username)) {
        seenUsernames.add(username);
        results.push({
          username,
          profile_url: href.startsWith('http') ? href : `https://www.instagram.com/${username}/`,
          profile_pic_url: null,
          timestamp: null,
        });
      }
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
 * Extracts followers and following lists from a ZIP archive buffer
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
    const entryName = entry.entryName.toLowerCase();

    // Check followers file (e.g. followers_1.json, followers.json, followers_1.html, etc.)
    if (
      entryName.includes('follower') &&
      (entryName.endsWith('.json') || entryName.endsWith('.html') || entryName.endsWith('.htm'))
    ) {
      try {
        const text = entry.getData().toString('utf8');
        const list = parseInstagramData(text);
        for (const u of list) {
          followersMap.set(u.username, u);
        }
      } catch (err) {
        console.error(`Error parsing ${entry.entryName} from zip:`, err);
      }
    }

    // Check following file (e.g. following.json, following.html, relationships_following.json)
    if (
      entryName.includes('following') &&
      (entryName.endsWith('.json') || entryName.endsWith('.html') || entryName.endsWith('.htm'))
    ) {
      try {
        const text = entry.getData().toString('utf8');
        const list = parseInstagramData(text);
        for (const u of list) {
          followingMap.set(u.username, u);
        }
      } catch (err) {
        console.error(`Error parsing ${entry.entryName} from zip:`, err);
      }
    }
  }

  return {
    followers: Array.from(followersMap.values()),
    following: Array.from(followingMap.values()),
  };
}
