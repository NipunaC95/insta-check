import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './server/db.ts';
import { parseInstagramJson, parseZipExport, ExtractedUser } from './server/parser.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security & Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Multer memory storage with 10MB file size limit
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit as specified
  },
  fileFilter: (req, file, cb) => {
    // Sanitise and validate file extension / mime type
    const originalName = file.originalname.toLowerCase();
    const isJson = originalName.endsWith('.json') || file.mimetype.includes('json');
    const isZip = originalName.endsWith('.zip') || file.mimetype.includes('zip') || file.mimetype.includes('octet-stream');

    if (isJson || isZip) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.originalname}. Only .json and .zip files are allowed.`));
    }
  },
});

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/uploads - lists all uploads with timestamps
app.get('/api/uploads', async (req: Request, res: Response) => {
  try {
    const uploads = await dbManager.getUploads();
    res.json(uploads);
  } catch (err: any) {
    console.error('Error fetching uploads:', err);
    res.status(500).json({ error: 'Failed to retrieve uploads: ' + err.message });
  }
});

// GET /api/dashboard/:uploadId - returns stats and lists for that upload
app.get('/api/dashboard/:uploadId', async (req: Request, res: Response) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    if (isNaN(uploadId)) {
      return res.status(400).json({ error: 'Invalid upload ID format.' });
    }

    const compareWithId = req.query.compareWithId
      ? parseInt(req.query.compareWithId as string, 10)
      : undefined;

    const dashboard = await dbManager.getDashboard(uploadId, compareWithId);
    res.json(dashboard);
  } catch (err: any) {
    console.error(`Error computing dashboard for upload ${req.params.uploadId}:`, err);
    res.status(404).json({ error: err.message || 'Dashboard data not found.' });
  }
});

// DELETE /api/uploads/:uploadId - deletes an upload session
app.delete('/api/uploads/:uploadId', async (req: Request, res: Response) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    if (isNaN(uploadId)) {
      return res.status(400).json({ error: 'Invalid upload ID format.' });
    }
    const success = await dbManager.deleteUpload(uploadId);
    if (success) {
      res.json({ success: true, message: `Upload ${uploadId} deleted successfully.` });
    } else {
      res.status(404).json({ error: `Upload ${uploadId} not found.` });
    }
  } catch (err: any) {
    console.error('Error deleting upload:', err);
    res.status(500).json({ error: 'Failed to delete upload: ' + err.message });
  }
});

// POST /api/upload - accepts files, parses, stores data, returns upload ID
app.post(
  '/api/upload',
  uploadMiddleware.fields([
    { name: 'followers', maxCount: 1 },
    { name: 'following', maxCount: 1 },
    { name: 'archive', maxCount: 1 },
    { name: 'files', maxCount: 5 }, // For generic multi-file picker
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const label = (req.body.label as string) || undefined;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          error: 'No files uploaded. Please upload followers_1.json and following.json or a ZIP export.',
        });
      }

      let followers: ExtractedUser[] = [];
      let following: ExtractedUser[] = [];

      // Check if a ZIP file was uploaded in any field
      let zipFile: Express.Multer.File | undefined;
      for (const field of Object.keys(files)) {
        for (const file of files[field]) {
          if (file.originalname.toLowerCase().endsWith('.zip')) {
            zipFile = file;
            break;
          }
        }
        if (zipFile) break;
      }

      if (zipFile) {
        console.log(`Processing ZIP export: ${zipFile.originalname} (${zipFile.size} bytes)`);
        const extracted = parseZipExport(zipFile.buffer);
        followers = extracted.followers;
        following = extracted.following;

        if (followers.length === 0 && following.length === 0) {
          return res.status(400).json({
            error:
              'No followers or following data found in the uploaded ZIP file. Please ensure it contains followers_1.json and following.json.',
          });
        }
      } else {
        // Look for followers and following files among uploaded files
        const allUploadedFiles: Express.Multer.File[] = [];
        for (const field of Object.keys(files)) {
          allUploadedFiles.push(...files[field]);
        }

        for (const file of allUploadedFiles) {
          const lowerName = file.originalname.toLowerCase();
          const fileContent = file.buffer.toString('utf8');

          if (lowerName.includes('follower') || file.fieldname === 'followers') {
            const parsed = parseInstagramJson(fileContent);
            followers.push(...parsed);
          } else if (lowerName.includes('following') || file.fieldname === 'following') {
            const parsed = parseInstagramJson(fileContent);
            following.push(...parsed);
          } else {
            // Try parsing and guessing based on structure
            try {
              const obj = JSON.parse(fileContent);
              if (obj.relationships_followers) {
                followers.push(...parseInstagramJson(obj));
              } else if (obj.relationships_following) {
                following.push(...parseInstagramJson(obj));
              }
            } catch {
              // Ignore unparseable files
            }
          }
        }

        // Deduplicate lists
        const fMap = new Map<string, ExtractedUser>();
        for (const u of followers) fMap.set(u.username, u);
        followers = Array.from(fMap.values());

        const foMap = new Map<string, ExtractedUser>();
        for (const u of following) foMap.set(u.username, u);
        following = Array.from(foMap.values());

        if (followers.length === 0 && following.length === 0) {
          return res.status(400).json({
            error:
              'Could not recognize valid Instagram data. Please upload followers_1.json and following.json from your Instagram export.',
          });
        }
      }

      // Save upload session to database
      const upload = await dbManager.createUpload(label || null, followers, following);

      console.log(
        `Successfully saved upload session #${upload.id}: ${followers.length} followers, ${following.length} following.`
      );

      res.status(201).json({
        success: true,
        message: 'Instagram export uploaded and processed successfully.',
        uploadId: upload.id,
        followersCount: followers.length,
        followingCount: following.length,
        label: upload.label,
        uploadedAt: upload.uploaded_at,
      });
    } catch (err: any) {
      console.error('Upload processing error:', err);
      res.status(500).json({ error: 'Failed to process Instagram export: ' + err.message });
    }
  }
);

// POST /api/demo - seeds two sample upload sessions for instant demonstration
app.post('/api/demo', async (req: Request, res: Response) => {
  try {
    // Session 1: 30 days ago
    const sampleFollowers1: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/' },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/' },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/' },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/' },
      { username: 'david_fitness', profile_url: 'https://www.instagram.com/david_fitness/' },
      { username: 'chloe_coffee', profile_url: 'https://www.instagram.com/chloe_coffee/' },
      { username: 'jordan_sneakers', profile_url: 'https://www.instagram.com/jordan_sneakers/' },
      { username: 'maya_books', profile_url: 'https://www.instagram.com/maya_books/' },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/' },
      { username: 'olivia_fashion', profile_url: 'https://www.instagram.com/olivia_fashion/' },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/' },
      { username: 'emma_bakes', profile_url: 'https://www.instagram.com/emma_bakes/' },
    ];

    const sampleFollowing1: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/' },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/' },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/' },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/' },
      { username: 'david_fitness', profile_url: 'https://www.instagram.com/david_fitness/' },
      { username: 'chloe_coffee', profile_url: 'https://www.instagram.com/chloe_coffee/' },
      { username: 'celebrity_musician', profile_url: 'https://www.instagram.com/celebrity_musician/' },
      { username: 'natgeo_photography', profile_url: 'https://www.instagram.com/natgeo_photography/' },
      { username: 'hype_brand', profile_url: 'https://www.instagram.com/hype_brand/' },
      { username: 'creator_studio', profile_url: 'https://www.instagram.com/creator_studio/' },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/' },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/' },
    ];

    // Session 2: Current (some unfollowed, some new followers, some non-followers back)
    // - Unfollowed: david_fitness, chloe_coffee, jordan_sneakers
    // - New followers: liam_code, zoe_skater, ava_music
    // - Non-followers back: celebrity_musician, natgeo_photography, hype_brand, creator_studio, david_fitness (now unfollowed)
    const sampleFollowers2: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/' },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/' },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/' },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/' },
      { username: 'maya_books', profile_url: 'https://www.instagram.com/maya_books/' },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/' },
      { username: 'olivia_fashion', profile_url: 'https://www.instagram.com/olivia_fashion/' },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/' },
      { username: 'emma_bakes', profile_url: 'https://www.instagram.com/emma_bakes/' },
      { username: 'liam_code', profile_url: 'https://www.instagram.com/liam_code/' },
      { username: 'zoe_skater', profile_url: 'https://www.instagram.com/zoe_skater/' },
      { username: 'ava_music', profile_url: 'https://www.instagram.com/ava_music/' },
    ];

    const sampleFollowing2: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/' },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/' },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/' },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/' },
      { username: 'david_fitness', profile_url: 'https://www.instagram.com/david_fitness/' }, // Still following him, but he unfollowed!
      { username: 'celebrity_musician', profile_url: 'https://www.instagram.com/celebrity_musician/' },
      { username: 'natgeo_photography', profile_url: 'https://www.instagram.com/natgeo_photography/' },
      { username: 'hype_brand', profile_url: 'https://www.instagram.com/hype_brand/' },
      { username: 'creator_studio', profile_url: 'https://www.instagram.com/creator_studio/' },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/' },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/' },
      { username: 'liam_code', profile_url: 'https://www.instagram.com/liam_code/' },
    ];

    const upload1 = await dbManager.createUpload('Instagram Export - Last Month', sampleFollowers1, sampleFollowing1);
    const upload2 = await dbManager.createUpload('Instagram Export - Latest Today', sampleFollowers2, sampleFollowing2);

    res.json({
      success: true,
      message: 'Demo sessions created successfully!',
      previousUploadId: upload1.id,
      currentUploadId: upload2.id,
    });
  } catch (err: any) {
    console.error('Error generating demo data:', err);
    res.status(500).json({ error: 'Failed to create demo data: ' + err.message });
  }
});

async function start() {
  await dbManager.init();

  // If in development mode, hook up Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Instagram Follower Insights server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
