import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Database config (matches Ad Astra UI pg pool settings)
const connectionString = process.env.PG_URL || 'postgresql://adastra:adastra@localhost/adastra';
const pool = new pg.Pool({ connectionString });

// Output Directory (Your new Obsidian Inbox folder)
const inboxDir = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline/01-Inbox';
// Check other folders to ensure we don't recreate archived or processed notes
const pipelineBase = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline';

async function syncTweets() {
  const client = await pool.connect();
  try {
    // 1. Fetch approved tweets from the last 48 hours (to cover weekends/holidays)
    const res = await client.query(`
      SELECT id, handle, text, timestamp, url, likes, retweets, replies 
      FROM shared.dashboard_tweets 
      WHERE curation_status = 'approved'
        AND ts_epoch > (EXTRACT(EPOCH FROM NOW()) * 1000 - 48 * 60 * 60 * 1000)
      ORDER BY ts_epoch DESC
    `);
    
    const tweets = res.rows;
    console.log(`Fetched ${tweets.length} tweets from database.`);

    // 2. Scan Obsidian pipeline folders to see what we've already synced
    const existingIds = new Set();
    const subfolders = ['01-Inbox', '02-Researching', '03-Ready', '04-Approved', '05-Archive'];
    
    for (const folder of subfolders) {
      const dirPath = path.join(pipelineBase, folder);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          // Extract tweet ID from filename format: [handle]-[id].md
          const match = file.match(/-(\d+)\.md$/);
          if (match) existingIds.add(match[1]);
        }
      }
    }

    // 3. Sync unsynced tweets to 01-Inbox
    let syncedCount = 0;
    for (const tweet of tweets) {
      if (existingIds.has(tweet.id)) continue; // Skip if already exists anywhere in the pipeline
      
      // Clean up handle for safety
      const sanitizedHandle = tweet.handle.replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `${sanitizedHandle}-${tweet.id}.md`;
      const filePath = path.join(inboxDir, filename);

      // Clean up tweet text (sometimes X text has duplicate newlines or trailing spaces)
      const cleanText = tweet.text.trim();

      // Simple filter: skip retweets or very short casual replies
      if (cleanText.startsWith('@') || cleanText.length < 40) {
        continue;
      }

      // Create markdown file content with YAML frontmatter
      const fileContent = `---
type: X - Event News
status: inbox
handle: "${tweet.handle}"
tweet_id: "${tweet.id}"
url: "${tweet.url}"
likes: ${tweet.likes || 0}
retweets: ${tweet.retweets || 0}
replies: ${tweet.replies || 0}
fetched_at: ${new Date().toISOString()}
---

# Curation Source (X)
**From:** @${tweet.handle}  
**Link:** [Open on X](${tweet.url})  

> [!quote]
> ${cleanText.replace(/\n/g, '\n> ')}
`;

      fs.writeFileSync(filePath, fileContent, 'utf-8');
      
      // Update DB status to 'synced' to prevent duplicate syncs
      await client.query(`
        UPDATE shared.dashboard_tweets 
        SET curation_status = 'synced' 
        WHERE id = $1
      `, [tweet.id]);
      
      syncedCount++;
    }

    console.log(`Successfully synced ${syncedCount} new tweets to 01-Inbox.`);
  } finally {
    client.release();
  }
}

syncTweets()
  .then(() => pool.end())
  .catch(err => {
    console.error('Sync failed:', err);
    pool.end();
  });
