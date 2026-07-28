import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const SNAPSHOT_DIR = path.join(BASE_DIR, 'beidou-pipeline/01-Snapshots');
const OUTLIERS_DIR = path.join(BASE_DIR, 'lulua-pipeline/00-Outliers');

// Thresholds according to client specifications & high-signal virality benchmarks
const THRESHOLDS = {
  BOOKMARK_RATIO: 0.008, // 0.8% (High Utility / Save Value)
  REPLY_RATIO: 0.004,    // 0.4% (High Debate / Comment Velocity)
  RETWEET_RATIO: 0.004,  // 0.4% (High Broadcast / Retweet Velocity)
  LIKE_RATIO: 0.020,     // 2.0% (High Appreciation)
  VIEW_YIELD_MULTIPLE: 2.5 // 2.5x Cohort Median
};

async function runOutlierScanner() {
  console.log('🔍 [Lulua] Starting Daily Outlier Metric Mining...');

  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.error(`❌ Snapshot directory not found: ${SNAPSHOT_DIR}`);
    process.exit(1);
  }

  // Find latest snapshot file
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('⚠️ No Beidou metric snapshots found to scan.');
    return { count: 0, msg: 'No snapshots found' };
  }

  const latestSnapshotFile = files[0];
  const snapshotPath = path.join(SNAPSHOT_DIR, latestSnapshotFile);
  console.log(`📄 Scanning snapshot: ${latestSnapshotFile}`);

  const snapshotData = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const outliers = [];

  // Normalize snapshotData (Array vs Object)
  const accountList = Array.isArray(snapshotData) ? snapshotData : Object.values(snapshotData);

  // Iterate over handles and tweets in snapshot
  for (const accountData of accountList) {
    const handle = accountData.handle || 'unknown';
    const tweets = accountData.tweets || [];
    const followers = accountData.followers || 1;

    // Filter out retweets first so 3rd-party retweets don't distort median baseline
    const originalTweets = tweets.filter(t => !t.is_retweet);

    // Calculate cohort view median for yield check
    const viewsList = originalTweets.map(t => t.views || 0).filter(v => v > 0).sort((a, b) => a - b);
    const medianViews = viewsList.length > 0 
      ? viewsList[Math.floor(viewsList.length / 2)] 
      : 1000;

    // CLIENT DIRECTIVE REACH GATE:
    // < 300k followers -> Min 20% impression yield (views >= followers * 0.20)
    // >= 300k followers -> Min 10% impression yield (views >= followers * 0.10)
    const minReachPct = followers < 300_000 ? 0.20 : 0.10;
    const minViewsFloor = Math.max(Math.round(followers * minReachPct), 1000);

    for (const tweet of originalTweets) {
      const views = tweet.views || 1;
      const likes = tweet.likes || 0;
      const bookmarks = tweet.bookmarks || 0;
      const replies = tweet.replies || 0;
      const retweets = tweet.retweets || 0;

      const likeRatio = likes / views;
      const bookmarkRatio = bookmarks / views;
      const replyRatio = replies / views;
      const retweetRatio = retweets / views;
      const viewYield = views / (followers || 1);
      const yieldVsMedian = views / (medianViews || 1);

      // Enforce Reach Gate: Post MUST meet minimum views threshold
      const passesReachGate = views >= minViewsFloor;

      // Follower Yield Outlier: Post views >= 100% followers (for <300k) or >= 50% followers (for >=300k)
      const minOutlierYieldPct = followers < 300_000 ? 1.0 : 0.5;
      const isFollowerYieldOutlier = viewYield >= minOutlierYieldPct;

      const isBookmarkOutlier = passesReachGate && bookmarks >= 20 && bookmarkRatio >= THRESHOLDS.BOOKMARK_RATIO;
      const isReplyOutlier = passesReachGate && replies >= 15 && replyRatio >= THRESHOLDS.REPLY_RATIO;
      const isRetweetOutlier = passesReachGate && retweets >= 15 && retweetRatio >= THRESHOLDS.RETWEET_RATIO;
      const isLikeOutlier = passesReachGate && likes >= 50 && likeRatio >= THRESHOLDS.LIKE_RATIO;
      const isYieldOutlier = passesReachGate && (yieldVsMedian >= THRESHOLDS.VIEW_YIELD_MULTIPLE || isFollowerYieldOutlier);

      if (isBookmarkOutlier || isReplyOutlier || isRetweetOutlier || isLikeOutlier || isYieldOutlier) {
        const tweetAuthor = tweet.author || handle;
        const tweetId = tweet.id || tweet.tweet_id;
        const tweetUrl = tweet.url || `https://x.com/${tweetAuthor}/status/${tweetId}`;

        // Media & Attachment Detection
        const textContent = tweet.text || '';
        const hasPic = textContent.includes('pic.twitter.com');
        const hasLink = textContent.includes('t.co') || textContent.includes('http://') || textContent.includes('https://');
        
        let mediaType = 'text_only';
        let mediaLabel = '📝 Post Text';
        if (hasPic) {
          mediaType = 'image';
          mediaLabel = '🖼️ Direct Pic Link Attached';
        } else if (hasLink) {
          mediaType = 'article_link';
          mediaLabel = '📰 External Link / X Card Attached';
        }

        outliers.push({
          handle: tweetAuthor,
          tweet_id: tweetId,
          url: tweetUrl,
          text: textContent,
          media: {
            type: mediaType,
            label: mediaLabel,
            has_media: mediaType !== 'text_only'
          },
          timestamp: tweet.timestamp || tweet.created_at,
          metrics: { views, likes, bookmarks, replies, retweets, followers, minViewsFloor },
          ratios: {
            likeRatio: parseFloat(likeRatio.toFixed(4)),
            bookmarkRatio: parseFloat(bookmarkRatio.toFixed(4)),
            replyRatio: parseFloat(replyRatio.toFixed(4)),
            retweetRatio: parseFloat(retweetRatio.toFixed(4)),
            viewYield: parseFloat(viewYield.toFixed(2)),
            yieldVsMedian: parseFloat(yieldVsMedian.toFixed(2))
          },
          triggers: {
            highYield: isYieldOutlier,
            highUtility: isBookmarkOutlier,
            highDebate: isReplyOutlier,
            highBroadcast: isRetweetOutlier,
            highAppreciation: isLikeOutlier
          }
        });
      }
    }
  }

  if (!fs.existsSync(OUTLIERS_DIR)) {
    fs.mkdirSync(OUTLIERS_DIR, { recursive: true });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const outputFile = path.join(OUTLIERS_DIR, `outlier-${todayStr}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(outliers, null, 2));

  // Also write a Markdown (.md) file so Obsidian shows it natively in the file explorer!
  const mdLines = [
    `# 🚀 Lulua Outlier Mining Report (${todayStr})`,
    `**Total High-Yield Outliers Discovered:** ${outliers.length}`,
    `**Scanned Snapshot:** \`${latestSnapshotFile}\``,
    `---`,
    ``
  ];

  outliers.forEach((item, idx) => {
    const triggerFlags = [];
    if (item.triggers.highYield) triggerFlags.push('⚡ High Reach Yield');
    if (item.triggers.highUtility) triggerFlags.push('🔖 High Utility (Bookmarks)');
    if (item.triggers.highDebate) triggerFlags.push('💬 High Debate (Replies)');
    if (item.triggers.highBroadcast) triggerFlags.push('🔄 High Broadcast (Retweets)');
    if (item.triggers.highAppreciation) triggerFlags.push('❤️ High Appreciation (Likes)');

    mdLines.push(`### ${idx + 1}. @${item.handle} (${triggerFlags.join(' | ')})`);
    mdLines.push(`> ${item.text.replace(/\n/g, '\n> ')}`);
    mdLines.push(``);
    mdLines.push(`- **Views:** ${item.metrics.views.toLocaleString()} | **Likes:** ${item.metrics.likes.toLocaleString()} | **Bookmarks:** ${item.metrics.bookmarks} | **Replies:** ${item.metrics.replies} | **Retweets:** ${item.metrics.retweets}`);
    mdLines.push(`- **View Yield vs Median:** ${item.ratios.yieldVsMedian}x | **Bookmark Ratio:** ${(item.ratios.bookmarkRatio * 100).toFixed(2)}% | **Like Ratio:** ${(item.ratios.likeRatio * 100).toFixed(2)}%`);
    mdLines.push(`- 🔗 **Direct X Link:** [Inspect Post on X](${item.url})`);
    mdLines.push(``);
    mdLines.push(`---`);
    mdLines.push(``);
  });

  const mdOutputFile = path.join(OUTLIERS_DIR, `outlier-${todayStr}.md`);
  fs.writeFileSync(mdOutputFile, mdLines.join('\n'));

  console.log(`✅ [Lulua] Mining complete. Discovered ${outliers.length} high-yielding outlier posts.`);
  console.log(`💾 Saved JSON to: ${outputFile}`);
  console.log(`📝 Saved Markdown to: ${mdOutputFile}`);

  // Automatically trigger Briefing Generator
  try {
    const { execSync } = await import('child_process');
    const briefingScript = path.join(__dirname, 'lulua_briefing_generator.mjs');
    console.log('🚀 Triggering Daily Executive Briefing Generator...');
    execSync(`node "${briefingScript}"`, { stdio: 'inherit' });
  } catch (briefErr) {
    console.error('⚠️ Could not run Briefing Generator automatically:', briefErr.message);
  }

  return { count: outliers.length, file: mdOutputFile };
}

runOutlierScanner().catch(err => {
  console.error('❌ Error running Lulua Outlier Scanner:', err);
  process.exit(1);
});
