#!/usr/bin/env node
/**
 * Scrape tweets from X/Twitter profiles via Chrome CDP.
 * Connects to a running Chrome instance (same as other /website/x tools).
 *
 * Usage:
 *   node scrape-tweets.mjs WatcherGuru
 *   node scrape-tweets.mjs WatcherGuru coinbureau lookonchain arkham
 *   node scrape-tweets.mjs WatcherGuru --out tweets.json
 *   node scrape-tweets.mjs --accounts accounts.json --out tweets.json
 */

import { chromium } from 'playwright';
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CDP_URL         = 'http://localhost:18800';
const SCROLL_DELAY    = 1500;
const MAX_SCROLLS     = 15;
const STALE_LIMIT     = 3;
const DELAY_BETWEEN   = 3000; // between accounts

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const { values, positionals } = parseArgs({
  options: {
    accounts: { type: 'string', short: 'a' },
    out:      { type: 'string', short: 'o' },
    help:     { type: 'boolean', short: 'h' },
    limit:    { type: 'string', short: 'l' },  // max tweets per account
  },
  allowPositionals: true,
  strict: false,
});

if (values.help) {
  console.log(`Usage: node scrape-tweets.mjs [handles...] [--accounts file.json] [--out file.json] [--limit 50]`);
  process.exit(0);
}

const tweetLimit = parseInt(values.limit) || 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Extract tweet data from article elements on the page.
 * Returns array of tweet objects.
 */
async function extractTweetsFromPage(page) {
  return page.evaluate(() => {
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    const tweets = [];

    for (const article of articles) {
      try {
        // Tweet text
        const textEl = article.querySelector('[data-testid="tweetText"]');
        const text = textEl ? textEl.innerText.trim() : '';

        // Timestamp + link
        const timeEl = article.querySelector('time');
        const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;
        const linkEl = timeEl ? timeEl.closest('a') : null;
        const tweetUrl = linkEl ? linkEl.href : '';

        // Extract tweet ID from URL
        const idMatch = tweetUrl.match(/status\/(\d+)/);
        const id = idMatch ? idMatch[1] : '';

        // Author handle
        const handleLinks = article.querySelectorAll('a[role="link"]');
        let authorHandle = '';
        for (const a of handleLinks) {
          const href = a.getAttribute('href') || '';
          if (/^\/[A-Za-z0-9_]{1,15}$/.test(href)) {
            authorHandle = href.slice(1);
            break;
          }
        }

        // Engagement — aria-labels on group buttons
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

        // Views — via aria-label on role=link spans (works for all accounts)
        const viewSpans = article.querySelectorAll('a[role="link"] span');
        for (const span of viewSpans) {
          const parentAria = span.closest('a')?.getAttribute('aria-label') || '';
          const vm = parentAria.match(/([\d,]+)\s*views/i);
          if (vm) views = parseInt(vm[1].replace(/,/g, ''));
        }

        // Is retweet?
        const socialContext = article.querySelector('[data-testid="socialContext"]');
        const isRetweet = socialContext ? /reposted/i.test(socialContext.innerText) : false;

        if (id) {
          tweets.push({
            id,
            text,
            author: authorHandle,
            timestamp,
            ts_epoch: timestamp ? new Date(timestamp).getTime() : null,
            likes,
            retweets,
            replies,
            bookmarks,
            views,
            url: tweetUrl,
            is_retweet: isRetweet,
          });
        }
      } catch (e) {
        // skip broken article
      }
    }
    return tweets;
  });
}

// ---------------------------------------------------------------------------
// Scrape one account
// ---------------------------------------------------------------------------
async function scrapeAccount(page, handle, limit) {
  const url = `https://x.com/${handle}`;
  console.log(`  @${handle}: navigating...`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000); // wait for tweets to render

  // Check if profile exists
  const notFound = await page.evaluate(() => {
    const h = document.querySelector('[data-testid="empty_state_header_text"]');
    return h ? h.innerText : null;
  });
  if (notFound) {
    console.log(`  @${handle}: profile not found`);
    return { handle, followers: 0, tweets: [], error: 'profile not found' };
  }

  // Extract follower count from profile header
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

  for (let scroll = 0; scroll < MAX_SCROLLS; scroll++) {
    const found = await extractTweetsFromPage(page);
    const prevSize = allTweets.size;

    for (const t of found) {
      if (!allTweets.has(t.id)) allTweets.set(t.id, t);
    }

    const newCount = allTweets.size - prevSize;

    if (newCount === 0) {
      staleCount++;
      if (staleCount >= STALE_LIMIT) break;
    } else {
      staleCount = 0;
    }

    if (allTweets.size >= limit) break;

    await page.mouse.wheel(0, 800);
    await sleep(SCROLL_DELAY);
  }

  const tweets = [...allTweets.values()]
    .sort((a, b) => (b.ts_epoch || 0) - (a.ts_epoch || 0))
    .slice(0, limit);

  console.log(`  @${handle}: ${tweets.length} tweets scraped (${followers} followers)`);
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

  console.log(`Scraping tweets for ${handles.length} account(s)...\n`);

  // Acquire shared page mutex before touching Chrome (same pattern as main fetcher)
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
        const result = await scrapeAccount(page, handle, tweetLimit);
        results.push(result);
      } catch (err) {
        console.log(`  @${handle}: ERROR — ${err.message}`);
        results.push({ handle, tweets: [], error: err.message });
      }
      if (handle !== handles[handles.length - 1]) await sleep(DELAY_BETWEEN);
    }

    // Navigate back to blank for reuse
    await page.goto('about:blank').catch(() => {});

    // Summary
  console.log('\n--- Summary ---');
  const total = results.reduce((sum, r) => sum + r.tweets.length, 0);
  for (const r of results) {
    const status = r.error ? `FAILED (${r.error})` : `${r.tweets.length} tweets`;
    console.log(`  @${r.handle.padEnd(20)} ${status}`);
  }
  console.log(`  Total: ${total} tweets`);

  // Output
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
