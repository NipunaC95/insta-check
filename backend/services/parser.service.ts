import AdmZip from 'adm-zip';
import type { ExtractedUser } from '../types/index.ts';

/**
 * Sanitizes and normalizes an Instagram username or URL.
 * Accurately extracts the handle from URLs, including Instagram's mobile `_u/<username>` redirect paths.
 */
export function sanitizeUsername(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // If it's a URL or contains an Instagram web link, extract the actual username path segment
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.includes('instagram.com/')) {
    try {
      const urlStr = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
      const parsedUrl = new URL(urlStr);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        // Instagram mobile exports frequently use /_u/<username> or /u/<username>
        if ((segments[0] === '_u' || segments[0] === 'u') && segments.length > 1) {
          cleaned = segments[1];
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
  cleaned = cleaned.replace(/^@+/, '').replace(/\/+$/, '').trim();
  return cleaned.toLowerCase();
}

/**
 * Detects whether a parsed object or string content represents followers, following, or both
 */
export function detectInstagramDataRole(content: string | object): 'followers' | 'following' | 'both' | 'unknown' {
  let data: any = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch {
      const lower = content.toLowerCase();
      if (lower.includes('following')) return 'following';
      if (lower.includes('follower')) return 'followers';
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
    // Check elements in the array
    for (const item of data.slice(0, 10)) {
      if (item && typeof item === 'object') {
        // Followers export format in Meta exports typically includes media_list_data and empty title
        if ('media_list_data' in item) return 'followers';
        // Check string_list_data hrefs for following patterns
        if (Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
          const first = item.string_list_data[0];
          if (first && first.href && first.href.includes('/_u/')) {
            return 'following';
          }
        }
      }
    }
    // Meta standard array export for connections is followers_1.json
    return 'followers';
  }

  return 'unknown';
}

/**
 * Parses raw Instagram JSON structure for followers or following.
 * Supports:
 * - Direct array of items: [{ title: "", media_list_data: [], string_list_data: [{ href, value, timestamp }] }]
 * - Relationships object: { relationships_following: [{ title: "username", string_list_data: [{ href, timestamp }] }] }
 * - Relationships object: { relationships_followers: [ ... ] }
 * - Root-level properties: { followers: [ ... ] }, { following: [ ... ] }
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
    if (!item || typeof item !== 'object') return;

    let username = '';
    let timestamp: number | null = null;
    let profilePicUrl: string | null = item.profile_pic_url || null;

    // Check string_list_data (standard Instagram export format)
    if (Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
      for (const entry of item.string_list_data) {
        if (!entry) continue;
        if (entry.value && !username) {
          username = entry.value;
        }
        if (entry.href && !username) {
          username = sanitizeUsername(entry.href);
        }
        if (entry.timestamp && !timestamp) {
          timestamp = Number(entry.timestamp);
        }
      }
    }

    // Fallbacks if string_list_data didn't yield a username
    if (!username && item.title) {
      username = item.title;
    }
    if (!username && item.username) {
      username = item.username;
    }
    if (!username && item.value) {
      username = item.value;
    }
    if (!username && item.name) {
      username = item.name;
    }

    username = sanitizeUsername(username);
    if (!username) return;

    // Build canonical Instagram profile URL
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
