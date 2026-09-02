import { InstagramUser } from '../types';

/**
 * Extracts Instagram usernames and profile links regardless of export version or format.
 * Supports:
 * - standard string_list_data arrays (followers_1.json, following.json)
 * - relationships_followers / relationships_following wrappers
 * - raw user objects or title/value attributes
 * - legacy Instagram JSON export formats
 */
export function extractInstagramUsers(input: string | object | ArrayBuffer): InstagramUser[] {
  let parsed: unknown;

  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error('Invalid JSON format. Please ensure you uploaded a valid .json export file.');
    }
  } else if (input instanceof ArrayBuffer) {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(input);
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Failed to decode and parse JSON from file buffer.');
    }
  } else if (typeof input === 'object' && input !== null) {
    parsed = input;
  } else {
    throw new Error('Unsupported input format for Instagram data parser.');
  }

  let entries: unknown[] = [];

  if (Array.isArray(parsed)) {
    entries = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.relationships_followers)) {
      entries = obj.relationships_followers;
    } else if (Array.isArray(obj.relationships_following)) {
      entries = obj.relationships_following;
    } else if (Array.isArray(obj.followers)) {
      entries = obj.followers;
    } else if (Array.isArray(obj.following)) {
      entries = obj.following;
    } else {
      // Look for first array value in object keys
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          entries = obj[key] as unknown[];
          break;
        }
      }
    }
  }

  const userMap = new Map<string, InstagramUser>();

  for (const item of entries) {
    if (!item) continue;

    let username: string | null = null;
    let profileUrl: string | null = null;
    let timestamp: number | null = null;

    if (typeof item === 'string') {
      username = item;
    } else if (typeof item === 'object' && item !== null) {
      const record = item as Record<string, unknown>;

      if (Array.isArray(record.string_list_data) && record.string_list_data.length > 0) {
        const entry = record.string_list_data[0] as Record<string, unknown>;
        username = (entry.value as string) || (record.title as string) || null;
        profileUrl = (entry.href as string) || null;
        timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : null;
      } else if (record.value && typeof record.value === 'string') {
        username = record.value;
        profileUrl = (record.href as string) || null;
        timestamp = typeof record.timestamp === 'number' ? record.timestamp : null;
      } else if (record.title && typeof record.title === 'string') {
        username = record.title;
        profileUrl = (record.href as string) || null;
      } else if (record.username && typeof record.username === 'string') {
        username = record.username;
        profileUrl = (record.profile_url as string) || (record.profileUrl as string) || null;
        timestamp = typeof record.timestamp === 'number' ? record.timestamp : null;
      }
    }

    if (username && typeof username === 'string') {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      if (cleanUsername && !userMap.has(cleanUsername)) {
        userMap.set(cleanUsername, {
          username: cleanUsername,
          profileUrl: profileUrl || `https://www.instagram.com/${cleanUsername}/`,
          timestamp: timestamp || null,
        });
      }
    }
  }

  return Array.from(userMap.values());
}
