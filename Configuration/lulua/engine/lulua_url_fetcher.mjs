import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '../../../');
const SNAPSHOT_DIR = path.join(BASE_DIR, 'beidou-pipeline/01-Snapshots');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Decoupled Post & Thread Content Fetcher for Lulua Dissector.
 */
export async function fetchPostOrThreadText(inputUrlOrText, platform = 'x') {
  const trimmed = inputUrlOrText ? inputUrlOrText.trim() : '';

  // 1. Normalize input (strip leading slashes e.g. /x.com/..., prepend https:// if missing)
  let cleanInput = trimmed.replace(/^\/+/, '');
  if (!/^https?:\/\//i.test(cleanInput) && /(?:x|twitter|instagram|tiktok|youtube|youtu\.be)\.com\//i.test(cleanInput)) {
    cleanInput = 'https://' + cleanInput;
  }

  // Detect if input is a URL directly or contains an embedded URL
  const embeddedUrlMatch = cleanInput.match(/https?:\/\/(?:www\.)?(?:x|twitter|instagram|tiktok|youtube|youtu\.be)\.com\/[^\s\)\>]+/i) || cleanInput.match(/^https?:\/\/[^\s]+/i);
  const isUrl = Boolean(embeddedUrlMatch);

  if (!isUrl) {
    return { ok: true, isUrl: false, text: trimmed };
  }

  const url = embeddedUrlMatch[0];
  console.log(`🌐 [Lulua Fetcher] Resolving post URL: ${url}`);

  // Extract status ID if present
  const idMatch = url.match(/status\/(\d+)/i);
  const tweetId = idMatch ? idMatch[1] : null;

  // Extract author handle from URL if present (e.g., x.com/satyaXBT/status/123)
  const handleMatch = url.match(/x\.com\/([a-zA-Z0-9_]+)\/status/i) || url.match(/twitter\.com\/([a-zA-Z0-9_]+)\/status/i);
  let authorHandle = handleMatch ? handleMatch[1].toLowerCase() : null;

  // 2. Try Disk Cache Lookaside first (fast check)
  if (tweetId && fs.existsSync(SNAPSHOT_DIR)) {
    try {
      const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.startsWith('snapshot-') && f.endsWith('.json')).sort().reverse();
      for (const file of files) {
        const content = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf8');
        const snapshot = JSON.parse(content);
        const accounts = Array.isArray(snapshot) ? snapshot : Object.values(snapshot);
        for (const acc of accounts) {
          if (acc.tweets && Array.isArray(acc.tweets)) {
            const match = acc.tweets.find(t => String(t.id) === String(tweetId));
            if (match && match.text && match.text.length > 50 && !match.has_card) {
              console.log(`⚡ [Lulua Fetcher] Found exact tweet in Beidou snapshot cache: ${file}`);
              return {
                ok: true,
                isUrl: true,
                url,
                text: `Author: @${acc.handle || authorHandle || 'unknown'}\n\n${match.text}`,
                author: acc.handle || authorHandle,
                fromCache: true
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Disk cache lookaside check warning:', e.message);
    }
  }

  // 3. Live Chrome CDP Fetcher (Full Thread & X Article Support)
  let acquireLock, releaseLock, connectCDP;
  try {
    const cdpLockMod = await import('/home/silvester/Documents/skills/ui/server/lib/cdp-lock.mjs');
    acquireLock = cdpLockMod.acquireLock;
    releaseLock = cdpLockMod.releaseLock;
    const cdpConnMod = await import('/home/silvester/Documents/skills/ui/server/lib/cdp-connect.mjs');
    connectCDP = cdpConnMod.connectCDP;
  } catch (err) {
    console.warn('⚠️ CDP modules not available:', err.message);
    return { ok: false, isUrl: true, url, text: url, error: 'CDP modules unavailable' };
  }

  let lock = null;
  let conn = null;

  try {
    lock = await acquireLock('18800-page');
    conn = await connectCDP(18800, { caller: 'lulua-dissector', maxRetries: 2 });
    const page = conn.page;

    console.log(`  Navigating to status URL...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait up to 5s for X lazy-rendered card components to mount into DOM
    await page.waitForSelector('[data-testid*="article"], [data-testid="article-cover-image"], a[href*="/article/"]', { timeout: 5000 }).catch(() => {});
    await sleep(2000);

    // Pre-scroll check for embedded X Article card before timeline virtualized scrolling unmounts top elements
    let hasArticleCard = await page.evaluate(() => {
      const el = document.querySelector('[data-testid*="article"], [data-testid="article-cover-image"], a[href*="/article/"]');
      return Boolean(el);
    });
    if (hasArticleCard) {
      console.log(`  🔗 Detected embedded X Article card at top of post!`);
    }

    // Auto-click "Show more" buttons and scroll down to load full thread posts (Tweets 1 to 5+)
    console.log(`  Expanding long tweet 'Show more' links & loading full thread length (deep scroll)...`);
    const allCollectedTweets = new Map();
    let opHandle = authorHandle || '';
    let extractedArticleUrl = null;
    let extractedArticleBodyText = null;

    for (let scrollStep = 0; scrollStep < 8; scrollStep++) {
      // Step A: Click all visible "Show more" buttons inside tweet articles
      await page.evaluate(() => {
        const showMoreElements = Array.from(document.querySelectorAll('article[data-testid="tweet"] [data-testid="tweet-text-show-more-link"], article[data-testid="tweet"] button, article[data-testid="tweet"] span'))
          .filter(el => {
            const txt = (el.innerText || '').trim().toLowerCase();
            return txt === 'show more' || txt === 'show more…';
          });
        showMoreElements.forEach(el => {
          try { el.click(); } catch {}
        });
      });

      // Wait 1.5s for X's async network request to expand the tweet text in DOM
      await sleep(1500);

      // Step B: Extract expanded text from DOM
      const stepData = await page.evaluate(({ expectedHandle, currentTweetId }) => {
        const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
        let foundHandle = expectedHandle || '';
        if (!foundHandle && articles[0]) {
          const handleLinks = articles[0].querySelectorAll('a[role="link"]');
          for (const a of handleLinks) {
            const href = a.getAttribute('href') || '';
            if (/^\/[A-Za-z0-9_]{1,15}$/.test(href)) {
              foundHandle = href.slice(1).toLowerCase();
              break;
            }
          }
        }

        const tweets = [];
        let articleUrl = null;

        for (const article of articles) {
          const handleLinks = article.querySelectorAll('a[role="link"]');
          let articleAuthor = '';
          for (const a of handleLinks) {
            const href = a.getAttribute('href') || '';
            if (/^\/[A-Za-z0-9_]{1,15}$/.test(href)) {
              articleAuthor = href.slice(1).toLowerCase();
              break;
            }
          }

          if (!foundHandle || articleAuthor === foundHandle) {
            const textEls = Array.from(article.querySelectorAll('[data-testid="tweetText"]'));
            let text = '';
            if (textEls.length > 0) {
              text = textEls.map(el => (el.innerText || '').trim()).filter(Boolean).join('\n\n');
            } else {
              text = article.innerText ? article.innerText.trim() : '';
            }
            const timeEl = article.querySelector('time');
            const linkEl = timeEl ? timeEl.closest('a') : null;
            const tweetUrl = linkEl ? linkEl.href : '';
            const idMatch = tweetUrl ? tweetUrl.match(/status\/(\d+)/) : null;
            const id = idMatch ? idMatch[1] : text.slice(0, 40);

            if (text) {
              tweets.push({ id, text, author: articleAuthor });
            }

            if (!articleUrl) {
              const pageArticleLink = document.querySelector('a[href*="/article/"], a[href*="/i/article/"]');
              if (pageArticleLink) {
                articleUrl = pageArticleLink.href;
              } else {
                // Check for embedded quote cards on the page pointing to another status/article link
                const quoteLink = Array.from(document.querySelectorAll('a[href*="/status/"]'))
                  .find(a => {
                    const href = a.href || '';
                    return currentTweetId && !href.includes(currentTweetId) && !href.includes('/analytics') && !href.includes('/quotes') && !href.includes('/retweets') && !href.includes('/likes');
                  });
                if (quoteLink) {
                  articleUrl = quoteLink.href;
                }
              }
            }
          }
        }

        window.scrollBy(0, 1000);
        return { foundHandle, tweets, articleUrl };
      }, { expectedHandle: opHandle, currentTweetId: tweetId });

      if (stepData.foundHandle) opHandle = stepData.foundHandle;
      if (stepData.articleUrl && !extractedArticleUrl) extractedArticleUrl = stepData.articleUrl;

      if (stepData.tweets && Array.isArray(stepData.tweets)) {
        for (const t of stepData.tweets) {
          if (!allCollectedTweets.has(t.id) || t.text.length > allCollectedTweets.get(t.id).text.length) {
            allCollectedTweets.set(t.id, t);
          }
        }
      }

      await sleep(1000);
    }

    const opTweets = Array.from(allCollectedTweets.values()).map(t => t.text);

    if (opTweets.length === 0) {
      console.warn(`  [Lulua Fetcher] Warning: No tweets found on page`);
      await page.goto('about:blank').catch(() => {});
      return { ok: false, isUrl: true, url, text: null, error: 'No tweets found on page' };
    }

    let fullPayloadText = `Author: @${opHandle || 'unknown'}\n\n`;
    if (opTweets.length > 1) {
      fullPayloadText += `--- Thread Content (${opTweets.length} Posts) ---\n\n`;
      opTweets.forEach((tText, idx) => {
        fullPayloadText += `[Post ${idx + 1}]:\n${tText}\n\n`;
      });
    } else {
      fullPayloadText += opTweets[0] || url;
    }

    // If an X Article card is present (via data-testid="article-cover-image", [data-testid*="article"], or href="/article/"), click & extract full article text
    hasArticleCard = hasArticleCard || await page.evaluate(() => {
      const el = document.querySelector('[data-testid*="article"], [data-testid="article-cover-image"], a[href*="/article/"]');
      return Boolean(el);
    });

    if (hasArticleCard || extractedArticleUrl) {
      console.log(`  🔗 Detected embedded X Article card. Navigating to extract full article body...`);
      try {
        if (hasArticleCard && !extractedArticleUrl) {
          // Scroll back to top to ensure virtualized element is mounted in DOM before clicking
          await page.evaluate(() => window.scrollTo(0, 0));
          await sleep(1500);

          // Click the article card element using Playwright native click to trigger navigation
          await page.click('[data-testid*="article"], [data-testid="article-cover-image"], a[href*="/article/"]').catch(() => {});
          await sleep(4000);
          if (page.url() !== url) {
            extractedArticleUrl = page.url();
          }
        } else if (extractedArticleUrl && page.url() !== extractedArticleUrl) {
          await page.goto(extractedArticleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(3000);
        }

        const articleContent = await page.evaluate(() => {
          const articleEl = document.querySelector('[data-testid="article"]') || document.querySelector('article') || document.querySelector('main');
          return articleEl ? articleEl.innerText.trim() : document.body.innerText.trim();
        });

        if (articleContent && articleContent.length > 100) {
          extractedArticleBodyText = articleContent;
          fullPayloadText += `\n\n=========================================\n`;
          fullPayloadText += `--- FULL X ARTICLE BODY CONTENT ---\n`;
          fullPayloadText += `=========================================\n\n`;
          fullPayloadText += articleContent;
          console.log(`  ✅ Successfully extracted full X Article text (${articleContent.length} chars).`);
        }
      } catch (articleErr) {
        console.warn('  ⚠️ Failed to extract full X Article body:', articleErr.message);
      }
    }

    await page.goto('about:blank').catch(() => {});
    console.log(`✅ [Lulua Fetcher] Successfully extracted post/thread payload (${fullPayloadText.length} chars).`);

    return {
      ok: true,
      isUrl: true,
      url,
      text: fullPayloadText,
      postText: `Author: @${opHandle || 'unknown'}\n\n` + opTweets.join('\n\n'),
      articleText: extractedArticleBodyText || null,
      hasArticle: Boolean(extractedArticleBodyText),
      author: opHandle,
      threadCount: opTweets.length
    };

  } catch (err) {
    console.error(`❌ [Lulua Fetcher] Error during CDP fetch for ${url}:`, err.message);
    return { ok: false, isUrl: true, url, text: null, error: err.message };
  } finally {
    if (releaseLock && lock) {
      try { await releaseLock(lock); } catch {}
    }
  }
}
