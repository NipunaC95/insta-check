import { Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';
import { parseInstagramData, parseZipExport } from '../services/parser.service.ts';
import { ExtractedUser } from '../types/index.ts';

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
      // Look for followers and following files among uploaded files
      const allUploadedFiles: Express.Multer.File[] = [];
      for (const field of Object.keys(files)) {
        allUploadedFiles.push(...files[field]);
      }

      for (const file of allUploadedFiles) {
        const lowerName = file.originalname.toLowerCase();
        const fileContent = file.buffer.toString('utf8');

        if (lowerName.includes('follower') || file.fieldname === 'followers') {
          const parsed = parseInstagramData(fileContent);
          followers.push(...parsed);
        } else if (lowerName.includes('following') || file.fieldname === 'following') {
          const parsed = parseInstagramData(fileContent);
          following.push(...parsed);
        } else {
          try {
            const obj = JSON.parse(fileContent);
            if (obj.relationships_followers) {
              followers.push(...parseInstagramData(fileContent));
            } else if (obj.relationships_following) {
              following.push(...parseInstagramData(fileContent));
            }
          } catch {
            // Check if HTML document contains follower or following keywords
            if (fileContent.includes('instagram.com')) {
              const parsed = parseInstagramData(fileContent);
              if (lowerName.includes('follower')) {
                followers.push(...parsed);
              } else {
                following.push(...parsed);
              }
            }
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
