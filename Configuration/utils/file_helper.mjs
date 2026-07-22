import fs from 'fs';
import path from 'path';

/**
 * Extract sources from Google Search grounding metadata
 */
export function extractSources(data) {
  const metadata = data.candidates?.[0]?.groundingMetadata;
  if (!metadata || !metadata.groundingChunks) return [];

  const sources = [];
  for (const chunk of metadata.groundingChunks) {
    if (chunk.web && chunk.web.uri) {
      sources.push({
        title: chunk.web.title || 'Source',
        url: chunk.web.uri
      });
    }
  }

  // Deduplicate
  const seen = new Set();
  return sources.filter(src => {
    if (seen.has(src.url)) return false;
    seen.add(src.url);
    return true;
  });
}

/**
 * Simple Markdown Frontmatter Parser
 */
export function parseMarkdown(content) {
  const lines = content.split('\n');
  const frontmatter = {};
  const bodyLines = [];
  let inFrontmatter = false;
  let hasParsedFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      if (!hasParsedFrontmatter && i === 0) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        hasParsedFrontmatter = true;
        continue;
      }
    }

    if (inFrontmatter) {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        let val = line.slice(colonIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        frontmatter[key] = val;
      }
    } else {
      bodyLines.push(line);
    }
  }

  return { frontmatter, body: bodyLines.join('\n').trim() };
}

/**
 * Extract quote text blocks (from [!quote] headers)
 */
export function extractTweetText(body) {
  const lines = body.split('\n');
  const quoteLines = [];
  let inQuote = false;

  for (const line of lines) {
    if (line.includes('[!quote]')) {
      inQuote = true;
      continue;
    }
    if (inQuote) {
      if (line.trim().startsWith('>')) {
        let clean = line.trim().substring(1);
        if (clean.startsWith(' ')) clean = clean.substring(1);
        quoteLines.push(clean);
      } else if (line.trim() === '') {
        quoteLines.push('');
      } else {
        break; // Quote block finished
      }
    }
  }
  
  const text = quoteLines.join('\n').trim();
  return text || body;
}

/**
 * Recursively list files in a directory
 */
export function getFilesRecursive(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  }
  return results;
}

/**
 * Scan folders recursively for already drafted/posted terms in frontmatter
 */
export function getActiveGlossaryTerms(pipelineBase) {
  const activeTerms = new Set();
  const scanDirs = [
    path.join(pipelineBase, '03-Ready', '00-Glossary-Drafts'),
    path.join(pipelineBase, '04-Approved'),
    path.join(pipelineBase, '05-Archive')
  ];
  
  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = getFilesRecursive(dir);
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = parseMarkdown(content);
        if (parsed.frontmatter.type === 'X - Glossary Post') {
          if (parsed.frontmatter.term_1) activeTerms.add(parsed.frontmatter.term_1.toLowerCase());
          if (parsed.frontmatter.term_2) activeTerms.add(parsed.frontmatter.term_2.toLowerCase());
        }
      } catch (err) {
        // Skip failed reads silently
      }
    }
  }
  return activeTerms;
}

/**
 * Scan database files in 06-Glossaries and extract defined terms
 */
export function getDefinedGlossaryTerms(pipelineBase) {
  const definedTerms = new Map();
  const glossaryDir = path.join(pipelineBase, '06-Glossaries');
  if (!fs.existsSync(glossaryDir)) return definedTerms;
  
  const files = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(glossaryDir, file);
    const category = file.split('-')[1] || '';
    const lang = file.includes('-EN.md') ? 'en' : 'id';
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileParts = content.split(/\n---\n|---\n/);
      const rawEntries = fileParts.slice(1);
      for (const rawEntry of rawEntries) {
        const trimmed = rawEntry.trim();
        if (trimmed) {
          const match = trimmed.match(/^##\s*([^\n]+)/);
          if (match) {
            const termName = match[1].trim();
            const key = termName.toLowerCase();
            if (!definedTerms.has(key)) {
              definedTerms.set(key, { name: termName, category, texts: {} });
            }
            definedTerms.get(key).texts[lang] = trimmed;
          }
        }
      }
    } catch (err) {
      // Silently skip
    }
  }
  return definedTerms;
}

/**
 * Scan database files in 06-Glossaries and count entries added today SGT
 */
export function countTodayGlossaryEntries(pipelineBase) {
  const glossaryDir = path.join(pipelineBase, '06-Glossaries');
  if (!fs.existsSync(glossaryDir)) return 0;

  const todaySgt = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Singapore' });
  const dateComment = `<!-- Date: ${todaySgt} -->`;
  let count = 0;

  try {
    const files = fs.readdirSync(glossaryDir).filter(f => f.endsWith('-EN.md'));
    for (const file of files) {
      const filePath = path.join(glossaryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const escapedComment = dateComment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = content.match(new RegExp(escapedComment, 'g'));
      if (matches) {
        count += matches.length;
      }
    }
  } catch (err) {
    console.error('Error counting today\'s glossary entries:', err.message);
  }

  return count;
}

/**
 * Parse, sort alphabetically, and append terms to the glossary database markdown files
 */
export function appendGlossaryAlphabetically(filePath, newEntriesText) {
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  } else {
    const lang = filePath.endsWith('-EN.md') ? 'English' : 'Indonesian';
    const category = filePath.includes('AI') ? 'AI' : filePath.includes('Economics') ? 'Economics' : 'Crypto';
    content = `# ${category} Glossary (${lang})\n\nThis file contains the living database of ${category} technical terms and frameworks in ${lang}.\n\n---\n`;
  }

  const fileParts = content.split(/\n---\n|---\n/);
  const fileHeader = fileParts[0] || '';
  const entriesMap = new Map();

  const rawEntries = fileParts.slice(1);
  for (const rawEntry of rawEntries) {
    const trimmed = rawEntry.trim();
    if (trimmed) {
      const match = trimmed.match(/^##\s*([^\n]+)/);
      if (match) {
        const termName = match[1].trim();
        entriesMap.set(termName.toLowerCase(), { name: termName, text: trimmed });
      }
    }
  }

  const todaySgt = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Singapore' });

  const newParts = newEntriesText.split(/(?=^##\s)/m);
  for (const part of newParts) {
    let trimmed = part.trim();
    if (trimmed) {
      const match = trimmed.match(/^##\s*([^\n]+)/);
      if (match) {
        const termName = match[1].trim();
        if (!trimmed.includes('<!-- Date:')) {
          trimmed += `\n\n<!-- Date: ${todaySgt} -->`;
        }
        entriesMap.set(termName.toLowerCase(), { name: termName, text: trimmed });
      }
    }
  }

  const sortedEntries = Array.from(entriesMap.values());
  sortedEntries.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const sortedContent = sortedEntries.map(e => e.text).join('\n\n---\n\n');
  const finalFileContent = `${fileHeader.trim()}\n\n---\n\n${sortedContent}\n`;

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, finalFileContent, 'utf8');
}
