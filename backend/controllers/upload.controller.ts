import { Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';
import { parseInstagramData, parseInstagramJson, parseZipExport, detectInstagramDataRole } from '../services/parser.service.ts';
import type { ExtractedUser } from '../types/index.ts';

export async function getUploads(req: Request, res: Response) {
  try {
    const uploads = await dbService.getUploads();
    res.json(uploads);
  } catch (err: any) {
    console.error('Error fetching uploads:', err);
    res.status(500).json({ error: 'Failed to retrieve uploads: ' + err.message });
  }
}

export async function deleteUpload(req: Request, res: Response) {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    if (isNaN(uploadId)) {
      return res.status(400).json({ error: 'Invalid upload ID format.' });
    }
    const success = await dbService.deleteUpload(uploadId);
    if (success) {
      res.json({ success: true, message: `Upload ${uploadId} deleted successfully.` });
    } else {
      res.status(404).json({ error: `Upload ${uploadId} not found.` });
    }
  } catch (err: any) {
    console.error('Error deleting upload:', err);
    res.status(500).json({ error: 'Failed to delete upload: ' + err.message });
  }
}

export async function handleUpload(req: Request, res: Response) {
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
      // Collect all uploaded individual files
      const allUploadedFiles: Express.Multer.File[] = [];
      for (const field of Object.keys(files)) {
        allUploadedFiles.push(...files[field]);
      }

      for (const file of allUploadedFiles) {
        const lowerName = file.originalname.toLowerCase();
        const fileContent = file.buffer.toString('utf8');

        // Check role using content and filename
        let role = detectInstagramDataRole(fileContent, file.originalname);

        // If role is still unknown or fieldname is explicit, respect fieldname
        if (role === 'unknown') {
          if (file.fieldname === 'followers' || lowerName.includes('follower')) {
            role = 'followers';
          } else if (file.fieldname === 'following' || lowerName.includes('following')) {
            role = 'following';
          }
        }

        if (role === 'both') {
          try {
            const obj = JSON.parse(fileContent);
            if (obj.relationships_followers) {
              followers.push(...parseInstagramJson(obj.relationships_followers));
            }
            if (obj.relationships_following) {
              following.push(...parseInstagramJson(obj.relationships_following));
            }
          } catch {
            const parsed = parseInstagramData(fileContent);
            followers.push(...parsed);
          }
        } else if (role === 'followers') {
          const parsed = parseInstagramData(fileContent);
          followers.push(...parsed);
        } else if (role === 'following') {
          const parsed = parseInstagramData(fileContent);
          following.push(...parsed);
        } else {
          // Heuristic fallback for arbitrary single files
          const parsed = parseInstagramData(fileContent);
          if (followers.length === 0) {
            followers.push(...parsed);
          } else {
            following.push(...parsed);
          }
        }
      }

      // Deduplicate lists by canonical lowercased handle
      const fMap = new Map<string, ExtractedUser>();
      for (const u of followers) {
        const key = u.username.trim().toLowerCase();
        if (!fMap.has(key)) {
          fMap.set(key, u);
        }
      }
      followers = Array.from(fMap.values());

      const foMap = new Map<string, ExtractedUser>();
      for (const u of following) {
        const key = u.username.trim().toLowerCase();
        if (!foMap.has(key)) {
          foMap.set(key, u);
        }
      }
      following = Array.from(foMap.values());

      if (followers.length === 0 && following.length === 0) {
        return res.status(400).json({
          error:
            'Could not recognize valid Instagram data. Please upload followers and following files (.json, .html, or .zip) from your Instagram export.',
        });
      }
    }

    // Save upload session to database
    const upload = await dbService.createUpload(label || null, followers, following);

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
