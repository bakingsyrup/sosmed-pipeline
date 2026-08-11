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

  // 2. Live Chrome CDP Fetcher (Always Live-Fetch for 100% Full Thread & X Article Support)
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
    await sleep(2000);

    // Wait up to 5s for X lazy-rendered card components to mount into DOM
    await page.waitForSelector('[data-testid*="article"], [data-testid="article-cover-image"], a[href*="/article/"]', { timeout: 5000 }).catch(() => {});
    await sleep(2000);

    // Pre-scroll detection & capture of X Article link (direct card OR quoted tweet article)
    // Must happen before deep-scroll virtualized timeline unmounts elements
    const findArticleUrl = () => page.evaluate(() => {
      const res = { strategy: null, url: null };
      // Strategy 1: CSS selectors for article card elements — try all, prefer real URLs over click-required
      let clickRequiredFallback = null;
      const selectors = [
        'a[href*="/i/article/"]',
        'a[href*="/article/"]',
        '[data-testid="article-cover-image"]',
        '[data-testid*="article"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          if (el.tagName === 'A') { res.strategy = 'S1-selector:' + sel; res.url = el.href; return res; }
          const link = el.querySelector('a[href*="/article/"]') || el.closest('a');
          if (link) { res.strategy = 'S1-selector:' + sel + '-via-link'; res.url = link.href; return res; }
          if (!clickRequiredFallback) clickRequiredFallback = sel;
        }
      }
      // Strategy 2: Meta tags for quoted tweet article URLs
      const metaEl = document.querySelector('meta[content*="/i/article/"]');
      if (metaEl) { res.strategy = 'S2-meta'; res.url = metaEl.content; return res; }
      // Strategy 3: Brute-force scan of innerHTML for article URLs (relative & absolute)
      const html = document.body ? document.body.innerHTML : '';
      // Check visible href links first (they're the actual article), then meta tags
      const relMatch = html.match(/(?:href|data-href|data-url)=["'](\/i\/article\/\d+)/);
      if (relMatch) { res.strategy = 'S3-innerHTML-rel'; res.url = 'https://x.com' + relMatch[1]; return res; }
      const absMatch = html.match(/https?:\/\/[^"'\s<]*\/i\/article\/\d+/);
      if (absMatch) { res.strategy = 'S3-innerHTML-abs'; res.url = absMatch[0]; return res; }
      // Strategy 4: Scan data-href attributes & other link attrs
      const allEls = document.querySelectorAll('[data-href*="/article/"], [href*="/article/"]');
      for (const el of allEls) {
        const url = el.getAttribute('href') || el.getAttribute('data-href') || '';
        if (url && /\/article\/\d+/.test(url)) {
          res.strategy = 'S4-attrs';
          res.url = url.startsWith('http') ? url : 'https://x.com' + (url.startsWith('/') ? '' : '/') + url;
          return res;
        }
      }
      // Last resort: if we found a click-required element but no URL could be extracted
      if (clickRequiredFallback) {
        res.strategy = 'S1-click-required:' + clickRequiredFallback;
        res.url = 'click-required:' + clickRequiredFallback;
        return res;
      }
      res.strategy = 'none-found';
      return res;
    });

    let hasArticleCard = false;
    let extractedArticleUrl = null;
    const initialResult = await findArticleUrl();
    if (!extractedArticleUrl && initialResult.url && !initialResult.url.startsWith('click-required:')) {
      hasArticleCard = true;
      extractedArticleUrl = initialResult.url;
      console.log(`  🔗 Detected embedded X Article card at top of post! URL: ${extractedArticleUrl}`);
    } else if (!hasArticleCard && initialResult.url && initialResult.url.startsWith('click-required:')) {
      hasArticleCard = true;
      console.log(`  🔗 Detected article card (click required) at top of post`);
    }

    // Auto-click "Show more" buttons and scroll down to load full thread posts (Tweets 1 to 5+)
    console.log(`  Expanding long tweet 'Show more' links & loading full thread length (deep scroll)...`);
    const allCollectedTweets = new Map();
    let opHandle = authorHandle || '';
    let extractedArticleBodyText = null;

    for (let scrollStep = 0; scrollStep < 8; scrollStep++) {
      // Step A: Click "Show more" to expand long tweets (scope to main content column to avoid sidebar clicks)
      await page.evaluate(() => {
        const mainColumn = document.querySelector('[data-testid="primaryColumn"]') || 
                           document.querySelector('[role="main"]') || 
                           document.body;
        const candidates = mainColumn.querySelectorAll('a[role="link"], button, span[role="button"]');
        candidates.forEach(el => {
          const txt = (el.innerText || '').trim().toLowerCase();
          if (txt === 'show more' || txt === 'show more…') {
            try { el.click(); } catch {}
          }
        });
      });

      // Wait 1.5s for X's async network request to expand the tweet text in DOM
      await sleep(1500);

      // Step B: Extract expanded text from DOM
      const stepData = await page.evaluate(({ expectedHandle }) => {
        const RESERVED_X_ROUTES = new Set([
          'search', 'home', 'explore', 'notifications', 'messages',
          'settings', 'i', 'hashtag', 'tos', 'privacy', 'intent',
          'jobs', 'communities', 'topics', 'lists',
        ]);
        const extractHandle = (href) => {
          const m = href.match(/(?:x\.com\/|\/)([A-Za-z0-9_]{1,15})(?:\/|$)/i);
          if (!m) return '';
          const handle = m[1].toLowerCase();
          return RESERVED_X_ROUTES.has(handle) ? '' : handle;
        };

        const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
        let foundHandle = expectedHandle || '';
        if (!foundHandle && articles[0]) {
          const handleLinks = articles[0].querySelectorAll('a[role="link"]');
          for (const a of handleLinks) {
            const h = extractHandle(a.getAttribute('href') || '');
            if (h) { foundHandle = h; break; }
          }
        }

        const tweets = [];

        for (const article of articles) {
          const handleLinks = article.querySelectorAll('a[role="link"]');
          let articleAuthor = '';
          for (const a of handleLinks) {
            const h = extractHandle(a.getAttribute('href') || '');
            if (h) { articleAuthor = h; break; }
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
          }
        }

        window.scrollBy(0, 1000);
        return { foundHandle, tweets };
      }, { expectedHandle: opHandle });

      if (stepData.foundHandle) opHandle = stepData.foundHandle;

      if (stepData.tweets && Array.isArray(stepData.tweets)) {
        for (const t of stepData.tweets) {
          if (!allCollectedTweets.has(t.id) || t.text.length > allCollectedTweets.get(t.id).text.length) {
            allCollectedTweets.set(t.id, t);
          }
        }
      }

      await sleep(1000);
    }

    // Post-scroll re-scan: quoted tweet article cards may have lazy-loaded during scrolling
    if (!extractedArticleUrl) {
      const postScrollResult = await findArticleUrl();
      if (postScrollResult.url && !postScrollResult.url.startsWith('click-required:')) {
        hasArticleCard = true;
        extractedArticleUrl = postScrollResult.url;
        console.log(`  🔗 Post-scroll scan found article URL: ${extractedArticleUrl}`);
      }
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

    // If we landed on a Grok share page (JS redirect after page load), the article card
    // from the quoted tweet is not rendered. Fetch the raw status page HTML to extract the
    // article URL, then navigate directly to it.
    if ((page.url().includes('/grok/') || page.url().includes('/i/share/')) && !extractedArticleUrl && tweetId) {
      console.log(`  ⚠️ Grok share page detected, fetching raw status HTML for article URL...`);
      try {
        const htmlRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LuluaFetcher/1.0)' }
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const patterns = [
            /content="(https?:\/\/[^"]*\/i\/article\/\d+)/,  // schema.org sharedContent — canonical article ID
            /href="(\/i\/article\/\d+)/,                     // visible article card link — status page entry
            /https?:\/\/[^"'\s<]*\/i\/article\/\d+/,         // absolute article URL in HTML
          ];
          for (const pat of patterns) {
            const m = html.match(pat);
            if (m) {
              const articleUrl = m[1] || m[0];
              extractedArticleUrl = articleUrl.startsWith('http') ? articleUrl : 'https://x.com' + articleUrl;
              hasArticleCard = true;
              console.log(`  ✅ Extracted article URL from raw HTML: ${extractedArticleUrl}`);
              break;
            }
          }
        }
      } catch (e) {
        console.warn(`  ⚠️ Raw HTML fetch for article URL failed: ${e.message}`);
      }
    }

    // If an X Article card was detected pre-scroll or an article URL was captured, extract full article text
    if (hasArticleCard || extractedArticleUrl) {
      console.log(`  🔗 Extracting X Article content...`);
      try {
        if (hasArticleCard && !extractedArticleUrl) {
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

        const articleContent = await page.evaluate(({ targetHandle }) => {
          const isArticlePage = window.location.href.includes('/article/');

          if (isArticlePage) {
            const fullText = document.body.innerText || '';
            const lines = fullText.split('\n').map(l => l.trim());
            
            // Find article body start: after the header stats (e.g. "20\n41\n268\n392K")
            let startIdx = -1;
            let statCount = 0;
            for (let i = 0; i < lines.length; i++) {
              if (/^\d+K?$/.test(lines[i])) {
                statCount++;
                if (statCount >= 3) { startIdx = i + 1; break; }
              } else if (lines[i].length > 0) {
                statCount = 0;
              }
            }
            if (startIdx === -1) startIdx = 0;

            // Find end: article footer has date + numeric stats in consecutive lines
            // Pattern: "· Jul 28" / "Jul 11" → "12" → "53" → "226" → "198K"
            let endIdx = lines.length;
            for (let i = lines.length - 1; i > startIdx + 5; i--) {
              const window = lines.slice(i - 4, i + 1);
              const combo = window.join('|');
              const dateMatch = /^(·\s+)?[A-Z][a-z]{2}\s+\d{1,2}$/.test(window[0]);
              const numCount = window.slice(1).filter(l => /^\d+K?$/.test(l)).length;
              if (dateMatch && numCount >= 3) {
                endIdx = i - 4;
                break;
              }
            }

            // Collect body text from start to end
            let articleText = '';
            for (let i = startIdx; i < endIdx; i++) {
              const line = lines[i];
              if (line === 'Want to publish your own Article?') break;
              if (line === 'Upgrade to Premium' && i > startIdx + 10) break;
              articleText += (articleText ? '\n' : '') + line;
            }
            if (articleText.trim().length > 100) return articleText.trim();
          }

          // Fallback: extract from <article> elements for non-article pages or if body text parsing failed
          const articles = Array.from(document.querySelectorAll('article'));
          const opArticles = articles.filter(art => {
            const handleLinks = Array.from(art.querySelectorAll('a[role="link"]'));
            const author = handleLinks.map(a => a.getAttribute('href') || '').find(h => /^\/[A-Za-z0-9_]{1,15}$/.test(h))?.slice(1)?.toLowerCase();
            return !author || (targetHandle && author === targetHandle.toLowerCase());
          });
          const opTexts = opArticles.map(art => {
            const textEls = Array.from(art.querySelectorAll('[data-testid="tweetText"]'));
            if (textEls.length > 0) {
              return textEls.map(el => el.innerText.trim()).filter(Boolean).join('\n\n');
            }
            return art.innerText ? art.innerText.trim() : '';
          }).filter(t => t.length > 30);
          if (opTexts.length > 0) return opTexts.join('\n\n---\n\n');
          const topArticle = document.querySelector('article[data-testid="tweet"]') || document.querySelector('[data-testid="article"]');
          return topArticle ? topArticle.innerText.trim() : '';
        }, { targetHandle: opHandle });

        if (articleContent && articleContent.length > 100) {
          extractedArticleBodyText = articleContent;
          fullPayloadText += `\n\n=========================================\n`;
          fullPayloadText += `--- FULL X ARTICLE BODY CONTENT ---\n`;
          fullPayloadText += `=========================================\n\n`;
          fullPayloadText += articleContent;
          console.log(`  ✅ Successfully extracted full X Article text (${articleContent.length} chars).`);
        } else {
          console.log(`  ⚠️ Article content too short or empty (${articleContent ? articleContent.length : 0} chars), skipping article dissection.`);
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
      articleUrl: extractedArticleUrl || null,
      hasArticle: Boolean(extractedArticleBodyText),
      isDual: Boolean(extractedArticleBodyText && extractedArticleBodyText.length > 50),
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
