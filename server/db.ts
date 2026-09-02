import pg from 'pg';
import { ExtractedUser } from './parser.ts';

const { Pool } = pg;

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

class DatabaseManager {
  private pgPool: pg.Pool | null = null;
  private isPgAvailable = false;
  private memoryUploads: UploadRow[] = [];
  private memoryFollowers: UserRow[] = [];
  private memoryFollowing: UserRow[] = [];
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
        console.warn('PostgreSQL pool background error (falling back to memory if down):', err.message);
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

            CREATE INDEX IF NOT EXISTS idx_followers_upload_id ON followers(upload_id);
            CREATE INDEX IF NOT EXISTS idx_followers_username ON followers(username);
            CREATE INDEX IF NOT EXISTS idx_following_upload_id ON following(upload_id);
            CREATE INDEX IF NOT EXISTS idx_following_username ON following(username);
          `);
          this.isPgAvailable = true;
          console.log('PostgreSQL connected and schema verified successfully.');
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.log(`PostgreSQL not reachable (${err.message}). Using built-in persistent storage for AI Studio sandbox mode.`);
        this.isPgAvailable = false;
      }
    }
  }

  public async createUpload(
    label: string | null,
    followers: ExtractedUser[],
    following: ExtractedUser[]
  ): Promise<UploadRow> {
    const followersCount = followers.length;
    const followingCount = following.length;

    if (this.isPgAvailable && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');

        // Insert Upload record
        const uploadRes = await client.query<UploadRow>(
          `INSERT INTO uploads (label, followers_count, following_count, uploaded_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING id, uploaded_at, label, followers_count, following_count`,
          [label || null, followersCount, followingCount]
        );
        const upload = uploadRes.rows[0];

        // Insert followers in batch chunks
        const chunkSize = 1000;
        for (let i = 0; i < followers.length; i += chunkSize) {
          const chunk = followers.slice(i, i + chunkSize);
          const valuePlaceholders: string[] = [];
          const params: any[] = [];
          chunk.forEach((u, idx) => {
            const base = idx * 4;
            valuePlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
            params.push(upload.id, u.username, u.profile_url, u.profile_pic_url || null);
          });
          if (valuePlaceholders.length > 0) {
            await client.query(
              `INSERT INTO followers (upload_id, username, profile_url, profile_pic_url)
               VALUES ${valuePlaceholders.join(', ')}`,
              params
            );
          }
        }

        // Insert following in batch chunks
        for (let i = 0; i < following.length; i += chunkSize) {
          const chunk = following.slice(i, i + chunkSize);
          const valuePlaceholders: string[] = [];
          const params: any[] = [];
          chunk.forEach((u, idx) => {
            const base = idx * 4;
            valuePlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
            params.push(upload.id, u.username, u.profile_url, u.profile_pic_url || null);
          });
          if (valuePlaceholders.length > 0) {
            await client.query(
              `INSERT INTO following (upload_id, username, profile_url, profile_pic_url)
               VALUES ${valuePlaceholders.join(', ')}`,
              params
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

    // Fallback in-memory storage
    const uploadId = this.nextUploadId++;
    const upload: UploadRow = {
      id: uploadId,
      uploaded_at: new Date().toISOString(),
      label: label || null,
      followers_count: followersCount,
      following_count: followingCount,
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

    for (const f of following) {
      this.memoryFollowing.push({
        id: this.nextUserId++,
        upload_id: uploadId,
        username: f.username,
        profile_url: f.profile_url,
        profile_pic_url: f.profile_pic_url || null,
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
    return [...this.memoryUploads].sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
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

  public async getFollowers(uploadId: number): Promise<UserRow[]> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query<UserRow>(
        'SELECT id, upload_id, username, profile_url, profile_pic_url FROM followers WHERE upload_id = $1 ORDER BY username ASC',
        [uploadId]
      );
      return res.rows;
    }
    return this.memoryFollowers
      .filter((f) => f.upload_id === uploadId)
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  public async getFollowing(uploadId: number): Promise<UserRow[]> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query<UserRow>(
        'SELECT id, upload_id, username, profile_url, profile_pic_url FROM following WHERE upload_id = $1 ORDER BY username ASC',
        [uploadId]
      );
      return res.rows;
    }
    return this.memoryFollowing
      .filter((f) => f.upload_id === uploadId)
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  public async deleteUpload(id: number): Promise<boolean> {
    if (this.isPgAvailable && this.pgPool) {
      const res = await this.pgPool.query('DELETE FROM uploads WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
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

  public async getDashboard(currentUploadId: number, compareWithUploadId?: number) {
    const currentUpload = await this.getUploadById(currentUploadId);
    if (!currentUpload) {
      throw new Error(`Upload with ID ${currentUploadId} not found`);
    }

    const allUploads = await this.getUploads();
    let previousUpload: UploadRow | null = null;

    if (compareWithUploadId && compareWithUploadId !== currentUploadId) {
      previousUpload = await this.getUploadById(compareWithUploadId);
    } else {
      // Find the most recent upload before currentUpload
      const currentTime = new Date(currentUpload.uploaded_at).getTime();
      const priorUploads = allUploads
        .filter((u) => u.id !== currentUploadId && new Date(u.uploaded_at).getTime() < currentTime)
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

      if (priorUploads.length > 0) {
        previousUpload = priorUploads[0];
      } else {
        // If there are other uploads, pick the closest one
        const others = allUploads.filter((u) => u.id !== currentUploadId);
        if (others.length > 0) {
          previousUpload = others[0];
        }
      }
    }

    const [currFollowers, currFollowing] = await Promise.all([
      this.getFollowers(currentUploadId),
      this.getFollowing(currentUploadId),
    ]);

    const prevFollowers = previousUpload ? await this.getFollowers(previousUpload.id) : [];

    // Build Maps and Sets for O(1) lookups
    const currFollowersSet = new Set(currFollowers.map((f) => f.username.toLowerCase()));
    const currFollowingSet = new Set(currFollowing.map((f) => f.username.toLowerCase()));
    const prevFollowersSet = new Set(prevFollowers.map((f) => f.username.toLowerCase()));

    // 1. Unfollowers: were in previous followers but not in current followers
    const unfollowers = previousUpload
      ? prevFollowers.filter((f) => !currFollowersSet.has(f.username.toLowerCase()))
      : [];

    // 2. Non-followers back: users you follow who don't follow you back (current upload)
    const nonFollowersBack = currFollowing.filter(
      (f) => !currFollowersSet.has(f.username.toLowerCase())
    );

    // 3. New followers: in current followers but not in previous followers
    const newFollowers = previousUpload
      ? currFollowers.filter((f) => !prevFollowersSet.has(f.username.toLowerCase()))
      : [];

    // 4. Fans: users who follow you, but you don't follow them back
    const fans = currFollowers.filter((f) => !currFollowingSet.has(f.username.toLowerCase()));

    // 5. Mutuals: follow each other
    const mutuals = currFollowers.filter((f) => currFollowingSet.has(f.username.toLowerCase()));

    return {
      currentUpload,
      previousUpload,
      totalFollowers: currFollowers.length,
      totalFollowing: currFollowing.length,
      unfollowersCount: unfollowers.length,
      nonFollowersBackCount: nonFollowersBack.length,
      newFollowersCount: newFollowers.length,
      fansCount: fans.length,
      mutualsCount: mutuals.length,
      unfollowers,
      nonFollowersBack,
      newFollowers,
      fans,
      mutuals,
      allFollowers: currFollowers,
      allFollowing: currFollowing,
    };
  }
}

export const dbManager = new DatabaseManager();
