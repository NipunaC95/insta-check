import { Snapshot, InstagramUser } from '../types';

const STORAGE_KEY = 'ig_tracker_snapshots_v1';

export function getSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.sort((a, b) => b.id - a.id);
    }
    return [];
  } catch (err) {
    console.error('Failed to load snapshots from storage:', err);
    return [];
  }
}

export function getSnapshotById(id: number): Snapshot | undefined {
  const snapshots = getSnapshots();
  return snapshots.find((s) => s.id === id);
}

export function saveSnapshot(
  followers: InstagramUser[],
  following: InstagramUser[],
  note?: string,
  customDate?: string
): Snapshot {
  const snapshots = getSnapshots();
  const nextId = snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.id)) + 1 : 1;

  const newSnapshot: Snapshot = {
    id: nextId,
    uploadedAt: customDate || new Date().toISOString(),
    note: note?.trim() || `Snapshot #${nextId}`,
    followers,
    following,
  };

  const updated = [newSnapshot, ...snapshots];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSnapshot;
}

export function updateSnapshotNote(id: number, note: string): void {
  const snapshots = getSnapshots();
  const index = snapshots.findIndex((s) => s.id === id);
  if (index !== -1) {
    snapshots[index].note = note.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }
}

export function deleteSnapshot(id: number): void {
  const snapshots = getSnapshots();
  const filtered = snapshots.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Seed realistic demo snapshots (Week 1 Baseline & Week 2 Followup)
 * with demonstrable unfollowers, new followers, and non-reciprocal accounts.
 */
export function seedDemoData(): Snapshot[] {
  const week1Followers: InstagramUser[] = [
    { username: 'alex_travels', profileUrl: 'https://www.instagram.com/alex_travels/', timestamp: 1711900000 },
    { username: 'design_studio_nyc', profileUrl: 'https://www.instagram.com/design_studio_nyc/', timestamp: 1711900000 },
    { username: 'sarah.codes', profileUrl: 'https://www.instagram.com/sarah.codes/', timestamp: 1711900000 },
    { username: 'coffee_and_crafts', profileUrl: 'https://www.instagram.com/coffee_and_crafts/', timestamp: 1711900000 },
    { username: 'mark_fitness_pro', profileUrl: 'https://www.instagram.com/mark_fitness_pro/', timestamp: 1711900000 },
    { username: 'elena_photography', profileUrl: 'https://www.instagram.com/elena_photography/', timestamp: 1711900000 },
    { username: 'crypto_daily_news', profileUrl: 'https://www.instagram.com/crypto_daily_news/', timestamp: 1711900000 },
    { username: 'brand_guru_marketing', profileUrl: 'https://www.instagram.com/brand_guru_marketing/', timestamp: 1711900000 },
    { username: 'urban_architect', profileUrl: 'https://www.instagram.com/urban_architect/', timestamp: 1711900000 },
    { username: 'chef_mariano', profileUrl: 'https://www.instagram.com/chef_mariano/', timestamp: 1711900000 },
    { username: 'neon_art_gallery', profileUrl: 'https://www.instagram.com/neon_art_gallery/', timestamp: 1711900000 },
    { username: 'julie_creates', profileUrl: 'https://www.instagram.com/julie_creates/', timestamp: 1711900000 },
    { username: 'tech_insider_hub', profileUrl: 'https://www.instagram.com/tech_insider_hub/', timestamp: 1711900000 },
    { username: 'vibe_check_daily', profileUrl: 'https://www.instagram.com/vibe_check_daily/', timestamp: 1711900000 },
    { username: 'hiking_adventures_co', profileUrl: 'https://www.instagram.com/hiking_adventures_co/', timestamp: 1711900000 },
    { username: 'dan_the_developer', profileUrl: 'https://www.instagram.com/dan_the_developer/', timestamp: 1711900000 },
    { username: 'maya.wildlife', profileUrl: 'https://www.instagram.com/maya.wildlife/', timestamp: 1711900000 },
    { username: 'vintage_vinyl_records', profileUrl: 'https://www.instagram.com/vintage_vinyl_records/', timestamp: 1711900000 },
  ];

  const week1Following: InstagramUser[] = [
    { username: 'alex_travels', profileUrl: 'https://www.instagram.com/alex_travels/' },
    { username: 'design_studio_nyc', profileUrl: 'https://www.instagram.com/design_studio_nyc/' },
    { username: 'sarah.codes', profileUrl: 'https://www.instagram.com/sarah.codes/' },
    { username: 'crypto_daily_news', profileUrl: 'https://www.instagram.com/crypto_daily_news/' },
    { username: 'brand_guru_marketing', profileUrl: 'https://www.instagram.com/brand_guru_marketing/' },
    { username: 'celebrity_spotlight', profileUrl: 'https://www.instagram.com/celebrity_spotlight/' },
    { username: 'national_geographic', profileUrl: 'https://www.instagram.com/national_geographic/' },
    { username: 'techcrunch', profileUrl: 'https://www.instagram.com/techcrunch/' },
    { username: 'nasa_official', profileUrl: 'https://www.instagram.com/nasa_official/' },
    { username: 'urban_architect', profileUrl: 'https://www.instagram.com/urban_architect/' },
    { username: 'julie_creates', profileUrl: 'https://www.instagram.com/julie_creates/' },
    { username: 'hiking_adventures_co', profileUrl: 'https://www.instagram.com/hiking_adventures_co/' },
    { username: 'dan_the_developer', profileUrl: 'https://www.instagram.com/dan_the_developer/' },
  ];

  // Week 2:
  // - Unfollowers (were in week 1 followers, now gone): crypto_daily_news, brand_guru_marketing, neon_art_gallery
  // - New followers: samantha_ux, pixel_craftsman, soundwave_records
  // - Still following: alex_travels, design_studio_nyc, sarah.codes, etc.
  const week2Followers: InstagramUser[] = [
    { username: 'alex_travels', profileUrl: 'https://www.instagram.com/alex_travels/', timestamp: 1711900000 },
    { username: 'design_studio_nyc', profileUrl: 'https://www.instagram.com/design_studio_nyc/', timestamp: 1711900000 },
    { username: 'sarah.codes', profileUrl: 'https://www.instagram.com/sarah.codes/', timestamp: 1711900000 },
    { username: 'coffee_and_crafts', profileUrl: 'https://www.instagram.com/coffee_and_crafts/', timestamp: 1711900000 },
    { username: 'mark_fitness_pro', profileUrl: 'https://www.instagram.com/mark_fitness_pro/', timestamp: 1711900000 },
    { username: 'elena_photography', profileUrl: 'https://www.instagram.com/elena_photography/', timestamp: 1711900000 },
    { username: 'urban_architect', profileUrl: 'https://www.instagram.com/urban_architect/', timestamp: 1711900000 },
    { username: 'chef_mariano', profileUrl: 'https://www.instagram.com/chef_mariano/', timestamp: 1711900000 },
    { username: 'julie_creates', profileUrl: 'https://www.instagram.com/julie_creates/', timestamp: 1711900000 },
    { username: 'tech_insider_hub', profileUrl: 'https://www.instagram.com/tech_insider_hub/', timestamp: 1711900000 },
    { username: 'vibe_check_daily', profileUrl: 'https://www.instagram.com/vibe_check_daily/', timestamp: 1711900000 },
    { username: 'hiking_adventures_co', profileUrl: 'https://www.instagram.com/hiking_adventures_co/', timestamp: 1711900000 },
    { username: 'dan_the_developer', profileUrl: 'https://www.instagram.com/dan_the_developer/', timestamp: 1711900000 },
    { username: 'maya.wildlife', profileUrl: 'https://www.instagram.com/maya.wildlife/', timestamp: 1711900000 },
    { username: 'vintage_vinyl_records', profileUrl: 'https://www.instagram.com/vintage_vinyl_records/', timestamp: 1711900000 },
    { username: 'samantha_ux', profileUrl: 'https://www.instagram.com/samantha_ux/', timestamp: 1712500000 },
    { username: 'pixel_craftsman', profileUrl: 'https://www.instagram.com/pixel_craftsman/', timestamp: 1712500000 },
    { username: 'soundwave_records', profileUrl: 'https://www.instagram.com/soundwave_records/', timestamp: 1712500000 },
  ];

  const week2Following: InstagramUser[] = [
    { username: 'alex_travels', profileUrl: 'https://www.instagram.com/alex_travels/' },
    { username: 'design_studio_nyc', profileUrl: 'https://www.instagram.com/design_studio_nyc/' },
    { username: 'sarah.codes', profileUrl: 'https://www.instagram.com/sarah.codes/' },
    { username: 'crypto_daily_news', profileUrl: 'https://www.instagram.com/crypto_daily_news/' }, // Still following them even after they unfollowed!
    { username: 'brand_guru_marketing', profileUrl: 'https://www.instagram.com/brand_guru_marketing/' },
    { username: 'celebrity_spotlight', profileUrl: 'https://www.instagram.com/celebrity_spotlight/' },
    { username: 'national_geographic', profileUrl: 'https://www.instagram.com/national_geographic/' },
    { username: 'techcrunch', profileUrl: 'https://www.instagram.com/techcrunch/' },
    { username: 'nasa_official', profileUrl: 'https://www.instagram.com/nasa_official/' },
    { username: 'urban_architect', profileUrl: 'https://www.instagram.com/urban_architect/' },
    { username: 'julie_creates', profileUrl: 'https://www.instagram.com/julie_creates/' },
    { username: 'hiking_adventures_co', profileUrl: 'https://www.instagram.com/hiking_adventures_co/' },
    { username: 'dan_the_developer', profileUrl: 'https://www.instagram.com/dan_the_developer/' },
    { username: 'samantha_ux', profileUrl: 'https://www.instagram.com/samantha_ux/' }, // followed back
  ];

  const snap1: Snapshot = {
    id: 1,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Week 1 Baseline Export',
    followers: week1Followers,
    following: week1Following,
  };

  const snap2: Snapshot = {
    id: 2,
    uploadedAt: new Date().toISOString(),
    note: 'Week 2 Weekly Checkup (Demo)',
    followers: week2Followers,
    following: week2Following,
  };

  const demoSnapshots = [snap2, snap1];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSnapshots));
  return demoSnapshots;
}
