#!/usr/bin/env node
/**
 * Beidou X/Twitter Adapter — scrapes tweets from profiles via Chrome CDP.
 * Connects to a running Chrome instance on port 18800 (authenticated session).
 *
 * Usage:
 *   node x_headless_adapter.mjs kenalkripto --since 2026-07-25T00:00:00Z --until 2026-07-26T00:00:00Z --out snapshot.json
 *   node x_headless_adapter.mjs kenalkripto sarjana_crypto --since ... --until ... --dedup-file ids.json --targets kenalkripto --out snapshot.json
 */

import { chromium } from 'playwright';
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CDP_URL         = 'http://localhost:18800';
const SCROLL_DELAY    = 1500;
const MAX_SCROLLS     = 200;
const STALE_LIMIT     = 10;
const DELAY_BETWEEN   = 3000; // between accounts

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const { values, positionals } = parseArgs({
  options: {
    accounts:  { type: 'string', short: 'a' },
    out:       { type: 'string', short: 'o' },
    help:      { type: 'boolean', short: 'h' },
    since:     { type: 'string' },
    until:     { type: 'string' },
    'dedup-file': { type: 'string' },
    targets:   { type: 'string' },
    'max-posts': { type: 'string' },
  },
  allowPositionals: true,
  strict: false,
});

if (values.help) {
  console.log(`Usage: node x_headless_adapter.mjs [handles...] [--accounts file.json] [--out file.json] [--since ISO] [--until ISO] [--dedup-file path] [--targets handle1,handle2] [--max-posts N]`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Extract tweet data from article elements on the page.
 * skipIds: array of tweet IDs to skip (already scraped before).
 */
async function extractTweetsFromPage(page, skipIds = []) {
  return page.evaluate((skipIdsArr) => {
    const skipSet = new Set(skipIdsArr);
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    const tweets = [];

    for (const article of articles) {
      try {
        const textEl = article.querySelector('[data-testid="tweetText"]');
        const text = textEl ? textEl.innerText.trim() : '';

        const timeEl = article.querySelector('time');
        const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;
        const linkEl = timeEl ? timeEl.closest('a') : null;
        const tweetUrl = linkEl ? linkEl.href : '';

        const idMatch = tweetUrl.match(/status\/(\d+)/);
        const id = idMatch ? idMatch[1] : '';

        if (!id || skipSet.has(id)) continue;

        const handleLinks = article.querySelectorAll('a[role="link"]');
        let authorHandle = '';
        for (const a of handleLinks) {
          const href = a.getAttribute('href') || '';
          if (/^\/[A-Za-z0-9_]{1,15}$/.test(href)) {
            authorHandle = href.slice(1);
            break;
          }
        }

        let likes = 0, retweets = 0, replies = 0, bookmarks = 0, views = 0;

        const replyBtn = article.querySelector('[data-testid="reply"]');
        const rtBtn    = article.querySelector('[data-testid="retweet"]');
        const likeBtn  = article.querySelector('[data-testid="like"], [data-testid="unlike"]');
        const bookBtn  = article.querySelector('[data-testid="bookmark"], [data-testid="removeBookmark"]');

        const parseCount = (el) => {
          if (!el) return 0;
          const label = el.getAttribute('aria-label') || '';
          const m = label.match(/([\d,]+)/);
          return m ? parseInt(m[1].replace(/,/g, '')) : 0;
        };

        replies   = parseCount(replyBtn);
        retweets  = parseCount(rtBtn);
        likes     = parseCount(likeBtn);
        bookmarks = parseCount(bookBtn);

        const viewSpans = article.querySelectorAll('a[role="link"] span');
        for (const span of viewSpans) {
          const parentAria = span.closest('a')?.getAttribute('aria-label') || '';
          const vm = parentAria.match(/([\d,]+)\s*views/i);
          if (vm) views = parseInt(vm[1].replace(/,/g, ''));
        }

        const socialContext = article.querySelector('[data-testid="socialContext"]');
        const isRetweet = socialContext ? /reposted/i.test(socialContext.innerText) : false;

        tweets.push({
          id, text, author: authorHandle, timestamp,
          ts_epoch: timestamp ? new Date(timestamp).getTime() : null,
          likes, retweets, replies, bookmarks, views,
          url: tweetUrl, is_retweet: isRetweet,
        });
      } catch (e) {}
    }
    return tweets;
  }, skipIds);
}

// ---------------------------------------------------------------------------
// Scrape one account
// ---------------------------------------------------------------------------
async function scrapeAccount(page, handle, opts) {
  const { since, until, dedupIds, isTarget, maxPosts } = opts;
  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();
  const skipIds = new Set(dedupIds || []);
  const POST_CAP = maxPosts !== undefined ? parseInt(maxPosts, 10) : (isTarget ? Infinity : 20);
  const maxScrollsCount = maxPosts !== undefined ? Math.max(MAX_SCROLLS, Math.ceil(POST_CAP / 2)) : MAX_SCROLLS;

  const url = `https://x.com/${handle}`;
  console.log(`  @${handle}: navigating (max-posts target: ${POST_CAP})...`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  const notFound = await page.evaluate(() => {
    const h = document.querySelector('[data-testid="empty_state_header_text"]');
    return h ? h.innerText : null;
  });
  if (notFound) {
    console.log(`  @${handle}: profile not found`);
    return { handle, followers: 0, tweets: [], error: 'profile not found' };
  }

  const followers = await page.evaluate(() => {
    const link = document.querySelector('a[href$="/verified_followers"], a[href$="/followers"]');
    if (!link) return 0;
    const label = link.getAttribute('aria-label') || link.innerText || '';
    const m = label.match(/([\d,.]+)\s*([KMkm]?)/);
    if (!m) return 0;
    let num = parseFloat(m[1].replace(/,/g, ''));
    const unit = m[2].toUpperCase();
    if (unit === 'K') num *= 1000;
    if (unit === 'M') num *= 1000000;
    return Math.round(num);
  });

  const allTweets = new Map();
  let staleCount = 0;
  let boundaryPassed = false;

  for (let scroll = 0; scroll < maxScrollsCount; scroll++) {
    const found = await extractTweetsFromPage(page, [...skipIds]);
    const prevSize = allTweets.size;

    for (const t of found) {
      if (!allTweets.has(t.id)) {
        allTweets.set(t.id, t);
        skipIds.add(t.id);
      }
    }

    if (allTweets.size >= POST_CAP) {
      break;
    }

    // Boundary: stop when the current scroll finds ONLY tweets older than the window.
    // Ignores pinned/old tweets from earlier scrolls (they'd block the check forever).
    if (scroll >= 3 && found.length > 0) {
      const allThisScrollOlder = found.every(t => !t.ts_epoch || t.ts_epoch < sinceMs);
      if (allThisScrollOlder) boundaryPassed = true;
    }

    const newCount = allTweets.size - prevSize;

    if (newCount === 0) {
      staleCount++;
      if (staleCount >= STALE_LIMIT) break;
    } else {
      staleCount = 0;
    }

    if (boundaryPassed) break;

    await page.mouse.wheel(0, 800);
    await sleep(SCROLL_DELAY);
  }

  let tweets = [...allTweets.values()]
    .filter(t => t.ts_epoch >= sinceMs && t.ts_epoch < untilMs)
    .sort((a, b) => (a.ts_epoch || 0) - (b.ts_epoch || 0));

  if (Number.isFinite(POST_CAP)) tweets = tweets.slice(0, POST_CAP);

  const label = isTarget ? 'target' : `capped at ${POST_CAP}`;
  console.log(`  @${handle}: ${tweets.length} tweets (${label}) scraped (${followers} followers)`);
  return { handle, followers, tweets, error: null };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let handles = [...positionals];

  if (values.accounts) {
    const raw = await readFile(values.accounts, 'utf-8');
    const list = JSON.parse(raw);
    for (const entry of list) {
      handles.push(typeof entry === 'string' ? entry : entry.handle);
    }
  }

  handles = [...new Set(handles.map(h => h.replace(/^@/, '')))];

  if (handles.length === 0) {
    console.error('No accounts given. Pass handles as args or use --accounts file.json');
    process.exit(1);
  }

  const since = values.since || new Date(Date.now() - 86400000).toISOString();
  const until = values.until || new Date().toISOString();
  const maxPostsParam = values['max-posts'] ? parseInt(values['max-posts'], 10) : undefined;

  let dedupMap = {};
  if (values['dedup-file']) {
    try {
      const raw = await readFile(values['dedup-file'], 'utf-8');
      dedupMap = JSON.parse(raw);
    } catch {}
  }

  const rawTargets = values.targets || '';
  const isTargetAll = rawTargets.trim().toLowerCase() === 'all';
  const targetSet = new Set(
    rawTargets.split(',').map(h => h.trim().replace(/^@/, '').toLowerCase()).filter(Boolean)
  );

  console.log(`Scraping tweets for ${handles.length} account(s)...`);
  console.log(`  Window: ${since} → ${until}`);
  console.log(`  Targets: ${isTargetAll ? 'ALL ACCOUNTS' : [...targetSet].join(', ') || 'none'}`);
  if (maxPostsParam) console.log(`  Max Posts Limit: ${maxPostsParam}`);
  if (Object.keys(dedupMap).length > 0) console.log(`  Dedup: ${Object.keys(dedupMap).length} handle(s) with history\n`);

  const { acquireLock, releaseLock } = await import('/home/silvester/Documents/skills/ui/server/lib/cdp-lock.mjs');
  const lock = await acquireLock('18800-page');
  let browser, page;
  try {
    const { connectCDP } = await import('/home/silvester/Documents/skills/ui/server/lib/cdp-connect.mjs');
    const conn = await connectCDP(18800, { caller: 'beidou-adapter', maxRetries: 2 });
    browser = conn.browser;
    page = conn.page;

    const results = [];
    for (const handle of handles) {
      try {
        const isTarget = isTargetAll || targetSet.has(handle.toLowerCase());
        const result = await scrapeAccount(page, handle, {
          since, until,
          dedupIds: dedupMap[handle] || [],
          isTarget,
          maxPosts: maxPostsParam,
        });
        results.push(result);
      } catch (err) {
        console.log(`  @${handle}: ERROR — ${err.message}`);
        results.push({ handle, tweets: [], error: err.message });
      }
      if (handle !== handles[handles.length - 1]) await sleep(DELAY_BETWEEN);
    }

    await page.goto('about:blank').catch(() => {});

    console.log('\n--- Summary ---');
    const total = results.reduce((sum, r) => sum + r.tweets.length, 0);
    for (const r of results) {
      const status = r.error ? `FAILED (${r.error})` : `${r.tweets.length} tweets`;
      console.log(`  @${r.handle.padEnd(20)} ${status}`);
    }
    console.log(`  Total: ${total} tweets`);

    if (values.out) {
      await writeFile(values.out, JSON.stringify(results, null, 2));
      console.log(`\nSaved to ${values.out}`);
    } else {
      console.log('\n' + JSON.stringify(results, null, 2));
    }
  } finally {
    await releaseLock(lock);
  }
}

main().catch(err => { console.error(err); process.exit(1); }).finally(() => process.exit(0));
