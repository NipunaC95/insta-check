import { Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';
import { ExtractedUser } from '../types/index.ts';

export async function createDemoSessions(req: Request, res: Response) {
  try {
    // Helper to generate sample profile pic URL
    const getPic = (u: string) => `https://unavatar.io/instagram/${u}`;

    // Session 1: Baseline 30 days ago
    const sampleFollowers1: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/', profile_pic_url: getPic('alex_travels') },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/', profile_pic_url: getPic('sophia_designs') },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/', profile_pic_url: getPic('tech_marcus') },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/', profile_pic_url: getPic('elena_art') },
      { username: 'david_fitness', profile_url: 'https://www.instagram.com/david_fitness/', profile_pic_url: getPic('david_fitness') },
      { username: 'chloe_coffee', profile_url: 'https://www.instagram.com/chloe_coffee/', profile_pic_url: getPic('chloe_coffee') },
      { username: 'jordan_sneakers', profile_url: 'https://www.instagram.com/jordan_sneakers/', profile_pic_url: getPic('jordan_sneakers') },
      { username: 'maya_books', profile_url: 'https://www.instagram.com/maya_books/', profile_pic_url: getPic('maya_books') },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/', profile_pic_url: getPic('lucas_films') },
      { username: 'olivia_fashion', profile_url: 'https://www.instagram.com/olivia_fashion/', profile_pic_url: getPic('olivia_fashion') },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/', profile_pic_url: getPic('noah_outdoors') },
      { username: 'emma_bakes', profile_url: 'https://www.instagram.com/emma_bakes/', profile_pic_url: getPic('emma_bakes') },
    ];

    const sampleFollowing1: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/', profile_pic_url: getPic('alex_travels') },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/', profile_pic_url: getPic('sophia_designs') },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/', profile_pic_url: getPic('tech_marcus') },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/', profile_pic_url: getPic('elena_art') },
      { username: 'david_fitness', profile_url: 'https://www.instagram.com/david_fitness/', profile_pic_url: getPic('david_fitness') },
      { username: 'chloe_coffee', profile_url: 'https://www.instagram.com/chloe_coffee/', profile_pic_url: getPic('chloe_coffee') },
      { username: 'celebrity_musician', profile_url: 'https://www.instagram.com/celebrity_musician/', profile_pic_url: getPic('celebrity_musician') },
      { username: 'natgeo_photography', profile_url: 'https://www.instagram.com/natgeo_photography/', profile_pic_url: getPic('natgeo_photography') },
      { username: 'hype_brand', profile_url: 'https://www.instagram.com/hype_brand/', profile_pic_url: getPic('hype_brand') },
      { username: 'creator_studio', profile_url: 'https://www.instagram.com/creator_studio/', profile_pic_url: getPic('creator_studio') },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/', profile_pic_url: getPic('lucas_films') },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/', profile_pic_url: getPic('noah_outdoors') },
    ];

    // Session 2: Current session (showing unfollowers, new followers, non-followers back)
    const sampleFollowers2: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/', profile_pic_url: getPic('alex_travels') },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/', profile_pic_url: getPic('sophia_designs') },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/', profile_pic_url: getPic('tech_marcus') },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/', profile_pic_url: getPic('elena_art') },
      { username: 'maya_books', profile_url: 'https://www.instagram.com/maya_books/', profile_pic_url: getPic('maya_books') },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/', profile_pic_url: getPic('lucas_films') },
      { username: 'olivia_fashion', profile_url: 'https://www.instagram.com/olivia_fashion/', profile_pic_url: getPic('olivia_fashion') },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/', profile_pic_url: getPic('noah_outdoors') },
      { username: 'emma_bakes', profile_url: 'https://www.instagram.com/emma_bakes/', profile_pic_url: getPic('emma_bakes') },
      { username: 'liam_code', profile_url: 'https://www.instagram.com/liam_code/', profile_pic_url: getPic('liam_code') },
      { username: 'zoe_skater', profile_url: 'https://www.instagram.com/zoe_skater/', profile_pic_url: getPic('zoe_skater') },
      { username: 'ava_music', profile_url: 'https://www.instagram.com/ava_music/', profile_pic_url: getPic('ava_music') },
    ];

    const sampleFollowing2: ExtractedUser[] = [
      { username: 'alex_travels', profile_url: 'https://www.instagram.com/alex_travels/', profile_pic_url: getPic('alex_travels') },
      { username: 'sophia_designs', profile_url: 'https://www.instagram.com/sophia_designs/', profile_pic_url: getPic('sophia_designs') },
      { username: 'tech_marcus', profile_url: 'https://www.instagram.com/tech_marcus/', profile_pic_url: getPic('tech_marcus') },
      { username: 'elena_art', profile_url: 'https://www.instagram.com/elena_art/', profile_pic_url: getPic('elena_art') },
      { username: 'david_fitness', profile_url: 'https://www.instagram.com/david_fitness/', profile_pic_url: getPic('david_fitness') },
      { username: 'celebrity_musician', profile_url: 'https://www.instagram.com/celebrity_musician/', profile_pic_url: getPic('celebrity_musician') },
      { username: 'natgeo_photography', profile_url: 'https://www.instagram.com/natgeo_photography/', profile_pic_url: getPic('natgeo_photography') },
      { username: 'hype_brand', profile_url: 'https://www.instagram.com/hype_brand/', profile_pic_url: getPic('hype_brand') },
      { username: 'creator_studio', profile_url: 'https://www.instagram.com/creator_studio/', profile_pic_url: getPic('creator_studio') },
      { username: 'lucas_films', profile_url: 'https://www.instagram.com/lucas_films/', profile_pic_url: getPic('lucas_films') },
      { username: 'noah_outdoors', profile_url: 'https://www.instagram.com/noah_outdoors/', profile_pic_url: getPic('noah_outdoors') },
      { username: 'liam_code', profile_url: 'https://www.instagram.com/liam_code/', profile_pic_url: getPic('liam_code') },
    ];

    const upload1 = await dbService.createUpload('Instagram Export - Last Month', sampleFollowers1, sampleFollowing1);
    const upload2 = await dbService.createUpload('Instagram Export - Latest Today', sampleFollowers2, sampleFollowing2);

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
}
