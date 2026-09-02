import pg from 'pg';
import { ExtractedUser, UploadRow, UserRow, DashboardStats } from '../types/index.ts';

const { Pool } = pg;

export class DatabaseService {
  private pgPool: pg.Pool | null = null;
  private isPgAvailable = false;
  private memoryUploads: UploadRow[] = [];
  private memoryFollowers: UserRow[] = [];
  private memoryFollowing: UserRow[] = [];
  private memoryUnfollowed: Set<string> = new Set<string>();
  private nextUploadId = 1;
  private nextUserId = 1;

  constructor() {
    this.setupPgPool();
  }

  private setupPgPool() {
    try {
      const connectionString = process.env.DATABASE_URL;
      const host = process.env.PGHOST || 'localhost';
      const port = Number(process.env.PGPORT) || 5432;
      const user = process.env.PGUSER || 'postgres';
      const password = process.env.PGPASSWORD || 'postgres';
      const database = process.env.PGDATABASE || 'instagram_insights';

      const config: pg.PoolConfig = connectionString
        ? { connectionString, connectionTimeoutMillis: 3000 }
        : {
            host,
            port,
            user,
            password,
            database,
            connectionTimeoutMillis: 3000,
          };

      this.pgPool = new Pool(config);
      this.pgPool.on('error', (err) => {
        console.warn('PostgreSQL pool background error (falling back to memory):', err.message);
      });
    } catch (err) {
      console.warn('Could not initialize PostgreSQL pool:', err);
    }
  }

  public async init() {
    if (this.pgPool) {
      try {
        const client = await this.pgPool.connect();
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS uploads (
              id SERIAL PRIMARY KEY,
              uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              label VARCHAR(255),
              followers_count INTEGER DEFAULT 0,
              following_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS followers (
              id SERIAL PRIMARY KEY,
              upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
              username VARCHAR(255) NOT NULL,
              profile_url TEXT NOT NULL,
              profile_pic_url TEXT
            );

            CREATE TABLE IF NOT EXISTS following (
              id SERIAL PRIMARY KEY,
              upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
              username VARCHAR(255) NOT NULL,
              profile_url TEXT NOT NULL,
              profile_pic_url TEXT
            );

            CREATE TABLE IF NOT EXISTS unfollowed_users (
              id SERIAL PRIMARY KEY,
              username VARCHAR(255) UNIQUE NOT NULL,
              unfollowed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_followers_upload_id ON followers(upload_id);
            CREATE INDEX IF NOT EXISTS idx_followers_username ON followers(username);
            CREATE INDEX IF NOT EXISTS idx_following_upload_id ON following(upload_id);
            CREATE INDEX IF NOT EXISTS idx_following_username ON following(username);
            CREATE INDEX IF NOT EXISTS idx_unfollowed_username ON unfollowed_users(username);
          `);
          this.isPgAvailable = true;
          console.log('PostgreSQL connected and schema verified successfully.');
        } finally {
          client.release();
        }
      } catch (err: any) {
        this.isPgAvailable = false;
        console.log(`PostgreSQL unavailable (${err.message}). Using in-memory store.`);
      }
    }
  }

  public async createUpload(
    label: string | null,
    followers: ExtractedUser[],
    following: ExtractedUser[]
  ): Promise<UploadRow> {
    if (this.isPgAvailable && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');

        const insertUploadRes = await client.query<UploadRow>(
          `INSERT INTO uploads (label, followers_count, following_count)
           VALUES ($1, $2, $3)
           RETURNING id, uploaded_at, label, followers_count, following_count`,
          [label, followers.length, following.length]
        );
        const upload = insertUploadRes.rows[0];

        // Insert followers in batch chunks of 500
        if (followers.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < followers.length; i += chunkSize) {
            const chunk = followers.slice(i, i + chunkSize);
            const valueStrings: string[] = [];
            const queryParams: any[] = [upload.id];
            let paramIdx = 2;

            for (const user of chunk) {
              valueStrings.push(`($1, $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2})`);
              queryParams.push(user.username, user.profile_url, user.profile_pic_url || null);
              paramIdx += 3;
            }

            await client.query(
              `INSERT INTO followers (upload_id, username, profile_url, profile_pic_url)
               VALUES ${valueStrings.join(', ')}`,
              queryParams
            );
          }
        }

        // Insert following in batch chunks of 500
        if (following.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < following.length; i += chunkSize) {
            const chunk = following.slice(i, i + chunkSize);
            const valueStrings: string[] = [];
            const queryParams: any[] = [upload.id];
            let paramIdx = 2;

            for (const user of chunk) {
              valueStrings.push(`($1, $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2})`);
              queryParams.push(user.username, user.profile_url, user.profile_pic_url || null);
              paramIdx += 3;
            }

            await client.query(
              `INSERT INTO following (upload_id, username, profile_url, profile_pic_url)
               VALUES ${valueStrings.join(', ')}`,
              queryParams
            );
          }
        }

        await client.query('COMMIT');
        return upload;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-Memory Fallback
    const uploadId = this.nextUploadId++;
    const upload: UploadRow = {
      id: uploadId,
      uploaded_at: new Date().toISOString(),
      label: label || `Upload #${uploadId}`,
      followers_count: followers.length,
      following_count: following.length,
    };
    this.memoryUploads.unshift(upload);

    for (const f of followers) {
      this.memoryFollowers.push({
        id: this.nextUserId++,
        upload_id: uploadId,
        username: f.username,
        profile_url: f.profile_url,
        profile_pic_url: f.profile_pic_url || null,
      });
    }

    for (const fo of following) {
      this.memoryFollowing.push({
        id: this.nextUserId++,
        upload_id: uploadId,
        username: fo.username,
        profile_url: fo.profile_url,
        profile_pic_url: fo.profile_pic_url || null,
      });
    }

    return upload;
  }

  public async getUploads(): Promise<UploadRow[]> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query<UploadRow>(
        'SELECT id, uploaded_at, label, followers_count, following_count FROM uploads ORDER BY uploaded_at DESC'
      );
      return res.rows;
    }
    return [...this.memoryUploads];
  }

  public async getUploadById(id: number): Promise<UploadRow | null> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query<UploadRow>(
        'SELECT id, uploaded_at, label, followers_count, following_count FROM uploads WHERE id = $1',
        [id]
      );
      return res.rows[0] || null;
    }
    return this.memoryUploads.find((u) => u.id === id) || null;
  }

  public async deleteUpload(id: number): Promise<boolean> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query('DELETE FROM uploads WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const idx = this.memoryUploads.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.memoryUploads.splice(idx, 1);
      this.memoryFollowers = this.memoryFollowers.filter((f) => f.upload_id !== id);
      this.memoryFollowing = this.memoryFollowing.filter((f) => f.upload_id !== id);
      return true;
    }
    return false;
  }

  public async getFollowers(uploadId: number): Promise<ExtractedUser[]> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query<UserRow>(
        'SELECT username, profile_url, profile_pic_url FROM followers WHERE upload_id = $1 ORDER BY username ASC',
        [uploadId]
      );
      return res.rows.map((r) => ({
        username: r.username,
        profile_url: r.profile_url,
        profile_pic_url: r.profile_pic_url,
      }));
    }
    return this.memoryFollowers
      .filter((f) => f.upload_id === uploadId)
      .map((f) => ({
        username: f.username,
        profile_url: f.profile_url,
        profile_pic_url: f.profile_pic_url,
      }));
  }

  public async getFollowing(uploadId: number): Promise<ExtractedUser[]> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query<UserRow>(
        'SELECT username, profile_url, profile_pic_url FROM following WHERE upload_id = $1 ORDER BY username ASC',
        [uploadId]
      );
      return res.rows.map((r) => ({
        username: r.username,
        profile_url: r.profile_url,
        profile_pic_url: r.profile_pic_url,
      }));
    }
    return this.memoryFollowing
      .filter((f) => f.upload_id === uploadId)
      .map((f) => ({
        username: f.username,
        profile_url: f.profile_url,
        profile_pic_url: f.profile_pic_url,
      }));
  }

  public async getDashboard(currentUploadId: number, compareUploadId?: number): Promise<DashboardStats> {
    const currentUpload = await this.getUploadById(currentUploadId);
    if (!currentUpload) {
      throw new Error(`Upload #${currentUploadId} does not exist.`);
    }

    let previousUpload: UploadRow | null = null;
    if (compareUploadId) {
      previousUpload = await this.getUploadById(compareUploadId);
    } else {
      const all = await this.getUploads();
      const older = all.filter((u) => u.id !== currentUploadId && new Date(u.uploaded_at) < new Date(currentUpload.uploaded_at));
      if (older.length > 0) {
        previousUpload = older[0];
      }
    }

    const currentFollowers = await this.getFollowers(currentUploadId);
    const currentFollowing = await this.getFollowing(currentUploadId);

    const followersMap = new Map<string, ExtractedUser>();
    for (const u of currentFollowers) followersMap.set(u.username, u);

    const followingMap = new Map<string, ExtractedUser>();
    for (const u of currentFollowing) followingMap.set(u.username, u);

    // 1. Non-followers back: People you follow who do not follow you back
    const nonFollowersBack = currentFollowing.filter((u) => !followersMap.has(u.username));

    // 2. Mutuals: People you follow who also follow you back
    const mutuals = currentFollowing.filter((u) => followersMap.has(u.username));

    // 3. Fans: People who follow you, but you don't follow them back
    const fans = currentFollowers.filter((u) => !followingMap.has(u.username));

    // 4. Unfollowers and New Followers compared with previous session
    let unfollowers: ExtractedUser[] = [];
    let newFollowers: ExtractedUser[] = [];

    if (previousUpload) {
      const prevFollowers = await this.getFollowers(previousUpload.id);
      const prevFollowersMap = new Map<string, ExtractedUser>();
      for (const u of prevFollowers) prevFollowersMap.set(u.username, u);

      // Unfollowers: Was following you in previous session, but NOT in current session
      unfollowers = prevFollowers.filter((u) => !followersMap.has(u.username));

      // New Followers: In current session, but was NOT in previous session
      newFollowers = currentFollowers.filter((u) => !prevFollowersMap.has(u.username));
    }

    return {
      currentUpload,
      previousUpload,
      totalFollowers: currentFollowers.length,
      totalFollowing: currentFollowing.length,
      nonFollowersBackCount: nonFollowersBack.length,
      unfollowersCount: unfollowers.length,
      newFollowersCount: newFollowers.length,
      mutualsCount: mutuals.length,
      fansCount: fans.length,
      nonFollowersBack,
      unfollowers,
      newFollowers,
      mutuals,
      fans,
      allFollowers: currentFollowers,
      allFollowing: currentFollowing,
    };
  }

  public async getUnfollowedUsers(): Promise<string[]> {
    if (this.isPgAvailable && this.pgPool) {
      try {
        const res = await this.pgPool.query<{ username: string }>(
          'SELECT username FROM unfollowed_users ORDER BY unfollowed_at DESC'
        );
        return res.rows.map((r) => r.username);
      } catch (err: any) {
        console.warn('Error fetching unfollowed users from PG:', err.message);
      }
    }
    return Array.from(this.memoryUnfollowed);
  }

  public async toggleUnfollowedUser(username: string): Promise<{ username: string; unfollowed: boolean }> {
    const cleanUsername = username.trim().toLowerCase();
    if (this.isPgAvailable && this.pgPool) {
      try {
        const checkRes = await this.pgPool.query(
          'SELECT id FROM unfollowed_users WHERE LOWER(username) = $1',
          [cleanUsername]
        );
        if ((checkRes.rowCount ?? 0) > 0) {
          await this.pgPool.query('DELETE FROM unfollowed_users WHERE LOWER(username) = $1', [cleanUsername]);
          this.memoryUnfollowed.delete(cleanUsername);
          return { username: cleanUsername, unfollowed: false };
        } else {
          await this.pgPool.query(
            'INSERT INTO unfollowed_users (username) VALUES ($1) ON CONFLICT (username) DO NOTHING',
            [cleanUsername]
          );
          this.memoryUnfollowed.add(cleanUsername);
          return { username: cleanUsername, unfollowed: true };
        }
      } catch (err: any) {
        console.warn('Error toggling unfollowed user in PG, falling back to memory:', err.message);
      }
    }

    if (this.memoryUnfollowed.has(cleanUsername)) {
      this.memoryUnfollowed.delete(cleanUsername);
      return { username: cleanUsername, unfollowed: false };
    } else {
      this.memoryUnfollowed.add(cleanUsername);
      return { username: cleanUsername, unfollowed: true };
    }
  }

  public async setUnfollowedUser(username: string, unfollowed: boolean): Promise<{ username: string; unfollowed: boolean }> {
    const cleanUsername = username.trim().toLowerCase();
    if (this.isPgAvailable && this.pgPool) {
      try {
        if (unfollowed) {
          await this.pgPool.query(
            'INSERT INTO unfollowed_users (username) VALUES ($1) ON CONFLICT (username) DO NOTHING',
            [cleanUsername]
          );
          this.memoryUnfollowed.add(cleanUsername);
        } else {
          await this.pgPool.query('DELETE FROM unfollowed_users WHERE LOWER(username) = $1', [cleanUsername]);
          this.memoryUnfollowed.delete(cleanUsername);
        }
        return { username: cleanUsername, unfollowed };
      } catch (err: any) {
        console.warn('Error setting unfollowed user in PG, falling back to memory:', err.message);
      }
    }

    if (unfollowed) {
      this.memoryUnfollowed.add(cleanUsername);
    } else {
      this.memoryUnfollowed.delete(cleanUsername);
    }
    return { username: cleanUsername, unfollowed };
  }
}

export const dbService = new DatabaseService();
