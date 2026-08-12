export function getPlannerSystemInstruction() {
  return `
You are a Social Media Content Strategist and Thread Planner Agent.
Your task is to analyze an input topic and a selected Style Wireframe Blueprint (Part 3 Elastic Phases), and generate a Thread Skeleton Plan + a Targeted Research Shopping List.

CRITICAL INSTRUCTIONS:
1. **Analyze Context Depth & Topic Type**:
   - For NEW/BREAKING topics: Ground your plan in the input's context snippet / URL.
   - For HISTORICAL/KNOWN topics (e.g. LUNA depeg, FTX collapse, 3AC): Use your pre-trained historical knowledge to outline the authentic chronological timeline and key entities.
2. **Elastic Thread Outline**: Outline the proposed thread post-by-post following the wireframe's Elastic Narrative Phases. Do NOT hardcode fixed post counts; scale dynamically based on topic depth.
3. **Research Shopping List Generation**:
   - For each post slot requiring factual backing, create a specific research request.
   - For every request, state BOTH:
     a) **Data Wanted**: The specific metric, timestamp, dollar figure, or event proof requested.
     b) **Intent / Purpose**: WHY you need this data (e.g. "To prove liquidity was thinned before the whale dump"). This enables the Research Agent to find alternative evidence if exact data is unavailable or if a false premise is caught.
4. **Post Count Constraint**: If a target post count is specified in the input, plan EXACTLY that many posts in the skeleton. Do not exceed it. If no post count is given, scale naturally based on topic depth.

Output format MUST be clean, structured JSON containing:
{
  "thread_title": "...",
  "planned_post_count": N,
  "skeleton_outline": [
    { "post_num": 1, "phase": "Phase 1: Hook", "summary": "...", "data_needed": "..." }
  ],
  "research_shopping_list": [
    { "slot_id": "Post 2 Data", "data_wanted": "Exact $ UST pulled from Curve 3pool on May 7", "intent": "Prove liquidity thinned before attack" }
  ]
}
`;
}

export function getPlannerPromptStr(inputPayload, wireframeBlueprint, falsePremiseFeedback = null) {
  let promptStr = `INPUT TOPIC PAYLOAD:\n`;
  promptStr += `- Topic ID: "${inputPayload.topic_id || 'N/A'}"\n`;
  promptStr += `- Core Topic: "${inputPayload.core_topic || 'Strategic Post Topic'}"\n`;
  if (inputPayload.context_snippet) promptStr += `- Context Snippet: "${inputPayload.context_snippet}"\n`;
  if (inputPayload.source_url) promptStr += `- Source URL: "${inputPayload.source_url}"\n`;
  if (inputPayload.target_post_count) promptStr += `- Target Post Count: ${inputPayload.target_post_count} (plan EXACTLY this many posts)\n`;
  if (inputPayload.format) promptStr += `- Output Format: ${inputPayload.format}\n`;

  if (falsePremiseFeedback) {
    promptStr += `\n⚠️ FALSE PREMISE RE-PLANNING FEEDBACK FROM RESEARCH AGENT:\n`;
    promptStr += `${JSON.stringify(falsePremiseFeedback, null, 2)}\n`;
    promptStr += `INSTRUCTION: Update your thread skeleton and shopping list to reflect the true ground-truth reality reported above!\n`;
  }

  promptStr += `\nSELECTED STYLE BANK WIREFRAME BLUEPRINT (PART 3 ELASTIC PHASES):\n`;
  promptStr += `${wireframeBlueprint.blueprint_text || wireframeBlueprint}\n\n`;
  promptStr += `TASK: Generate the Thread Skeleton Plan and Targeted Research Shopping List JSON. When context snippet instructions (hook angle, closing tone, CTA, post count) conflict with the wireframe blueprint's default phases, the context snippet ALWAYS wins.`;

  return promptStr;
}

export function getWireframeSystemInstruction(styleGuideContent, lang, format = '') {
  const isArticle = format === 'article';
  const isSinglePost = format === 'single_post';
  const isThread = !isArticle && !isSinglePost;

  const threadDirectives = `
1. Follow all writing style, formatting, and tone rules specified in the STYLE GUIDE above.
2. Output Language: ${lang === 'en' ? 'ENGLISH (write drafts 100% in English)' : 'INDONESIAN (blended naturally with English tech/trading terms)'}.
3. Headline Formatting: Write opening headlines in standard SENTENCE CASE (e.g. "Why 90% of system prompts fail", NOT Title Case).
4. Line-Break Density: Use double line breaks between every sentence block. Exactly 1 sentence per text block.
5. Anti-Hype Rule: Avoid generic buzzwords ("game-changer", "unleash", "masif", "raksasa"). Use raw, active verbs (*kata dasar*) and concrete quantitative figures.
6. Elastic Phase Scaling: Follow the slot progression specified in Part 3 of the blueprint. Dynamically scale the post count (1/N ... N/N) to fit the research brief's full information depth.`;

  const articleDirectives = `
1. Follow all writing style, formatting, and tone rules specified in the STYLE GUIDE above.
2. Output Language: ${lang === 'en' ? 'ENGLISH (write drafts 100% in English)' : 'INDONESIAN (blended naturally with English tech/trading terms)'}.
3. Structure: Use ## Section Name headings for major topic breaks (e.g. "## Finding Strategies Worth Testing"). This is an X Article, not a thread — sections flow naturally down the page.
4. Paragraph Density: Write natural multi-sentence paragraphs. Do NOT use single-sentence blocks or double line breaks between every sentence. Flowing prose.
5. Anti-Hype Rule: Avoid generic buzzwords ("game-changer", "unleash", "masif", "raksasa"). Use raw, active verbs (*kata dasar*) and concrete quantitative figures.
6. Rich Content: Where the wireframe calls for demonstration blocks or step breakdowns, use bullet lists, numbered steps, code blocks, tables, and blockquotes as appropriate.
7. Closing: End with a formal closing section ("## Wrapping Up" or similar) and a sign-off paragraph. No bridge hooks or cliffhangers.`;

  const singlePostDirectives = `
1. Follow all writing style, formatting, and tone rules specified in the STYLE GUIDE above.
2. Output Language: ${lang === 'en' ? 'ENGLISH (write drafts 100% in English)' : 'INDONESIAN (blended naturally with English tech/trading terms)'}.
3. Headline Formatting: Write the opening line in SENTENCE CASE.
4. Line-Break Density: Use double line breaks between every sentence block. Exactly 1 sentence per text block.
5. Anti-Hype Rule: Avoid generic buzzwords ("game-changer", "unleash", "masif", "raksasa"). Use raw, active verbs (*kata dasar*) and concrete quantitative figures.
6. Single Post: This is a standalone post — no numbering, no separators, no bridge hooks. One complete thought.`;

  const directives = isArticle ? articleDirectives : isSinglePost ? singlePostDirectives : threadDirectives;

  return `
You are a professional social media ghostwriter who writes high-insight, viral posts on X (Twitter).
Your task is to write social media draft variations based on selected Style Bank Wireframe Blueprints (Part 3 Elastic Narrative Phases) and verified research data.

=========================================
STYLE GUIDE SOURCE:
${styleGuideContent}

CRITICAL EXECUTION DIRECTIVES:${directives}
`;
}

export function getWireframeDraftPromptStr(inputPayload, wireframeBlueprints, researchBrief, lang, format = '', singleDraft = false, editorFeedback = '') {
  const bpArray = Array.isArray(wireframeBlueprints) ? wireframeBlueprints : (wireframeBlueprints ? [wireframeBlueprints] : []);
  const blueprintsStr = bpArray.map((bp, index) => `
=========================================
BLUEPRINT FOR DRAFT ${index + 1}: ${bp.template_name || \`Template \${index + 1}\`}
Part 3 Blueprint Schema:
${bp.blueprint_text || bp}
`).join('\n');
  const blueprintsStr = bpArray.map((bp, index) => `
=========================================
BLUEPRINT FOR DRAFT ${index + 1}: ${bp.template_name || `Template ${index + 1}`}
Part 3 Blueprint Schema:
${bp.blueprint_text || bp}
`).join('\n');

  const isArticle = format === 'article';
  const isSinglePost = format === 'single_post';

  const articleOutput = `
OUTPUT FORMAT (X Article): Output as a complete X Article. Use ## Section headings for each major section.
Write multi-sentence paragraphs — flowing prose, not telegraphic blocks.
Include bullet lists, numbered steps, code blocks, tables, and blockquotes where the wireframe calls for demonstration or explanation.
No Post 1/N labels. No --- separators.
End with a formal "## Wrapping Up" closing section and sign-off paragraph.`;

  const singlePostOutput = `
OUTPUT FORMAT (Standalone Post): Output a single standalone post. No post numbering. No --- separators. One complete, self-contained message.`;

  const threadOutput = `
OUTPUT FORMAT (Thread): For each draft, separate individual posts with a --- delimiter and label them as Post 1/N, Post 2/N, etc.
Example:
  Post 1/4
  [content]
  ---
  Post 2/4
  [content]
  ---
  Post 3/4
  [content]
  ---
  Post 4/4
  [content]`;

  const outputFormat = isArticle ? articleOutput : isSinglePost ? singlePostOutput : threadOutput;

  const draftCount = singleDraft ? 'ONE (1)' : 'FOUR (4)';
  const draftTarget = singleDraft
    ? 'Output ONLY the raw draft content — no markdown headers, no draft labels, no numbering. The system will label and format it.'
    : `Separate all 4 drafts clearly with standard markdown headers:

### Draft 1 (${bpArray[0]?.template_name || 'Style Variation 1'})
[Content for Draft 1 following Blueprint 1]

### Draft 2 (${bpArray[1]?.template_name || 'Style Variation 2'})
[Content for Draft 2 following Blueprint 2]

### Draft 3 (${bpArray[2]?.template_name || 'Style Variation 3'})
[Content for Draft 3 following Blueprint 3]

### Draft 4 (${bpArray[3]?.template_name || 'Style Variation 4'})
[Content for Draft 4 following Blueprint 4]`;

  const fbBlock = editorFeedback
    ? `\nCRITICAL EDITOR FEEDBACK — You MUST incorporate ALL of these instructions into the final draft:\n${editorFeedback}\n\n---\n\n`
    : '';

  return `
${fbBlock}INPUT TOPIC PAYLOAD:
- Topic ID: "${inputPayload.topic_id || 'N/A'}"
- Core Topic: "${inputPayload.core_topic || 'Strategic Post Topic'}"
- Sophistication Level: "${inputPayload.sophistication_level || 'Level 1'}"
- Target Style Category: "${inputPayload.category_target || 'HighUtility'}"
- Primary Call-To-Action (20% Anchor): "${inputPayload.revenue_anchor_link || 'Zero-Friction Bookmark & Follow'}"

VERIFIED RESEARCH & GROUNDING BRIEF:
${researchBrief}

SELECTED STYLE BANK WIREFRAME BLUEPRINTS:
${blueprintsStr}

TASK INSTRUCTIONS:
Using the verified research brief and style guide, generate ${draftCount} distinct draft variation${singleDraft ? '' : 's'} for an X (Twitter) post by populating the selected Style Bank Wireframe Blueprints.
${outputFormat}

${draftTarget}
`;
}

export function getStyleSelectionSystemInstruction(lockedStyles = null, excludedStyles = null) {
  const lockInstruction = lockedStyles
    ? `\n\nCRITICAL LOCKED STYLES: The following styles are pre-selected and MUST be included in your output at the positions shown:\n${lockedStyles.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}\n\nPick complementary styles for the remaining slots to fill 4 total. Do NOT suggest alternatives to the locked styles — treat them as non-negotiable.\n`
    : '';

  const excludeInstruction = excludedStyles && excludedStyles.length > 0
    ? `\n\nCOOLDOWN EXCLUSION: The following style FILENAMES were published in the last 10 posts. You MUST NOT select ANY of these exact filenames:\n${excludedStyles.map(s => `  - ${s}`).join('\n')}\n`
    : '';

  return `
You are a Senior Content Strategist and Style Bank Curator.
Your task is to analyze a topic brief and select the 4 best-matching wireframe styles from a Style Bank Index.
${lockInstruction}${excludeInstruction}
SELECTION CRITERIA:
1. **Structural Fit**: Does the topic's natural flow match the style's narrative flow summary? (e.g. a "shocking data → breakdown → CTA" topic fits a "Shocking Stat → Step-by-Step → Retweet Prompt" style)
2. **Diversity**: Pick 4 DISTINCTLY DIFFERENT approaches — don't pick 4 variations of the same archetype. Cover different angles (educational, emotional, debate, story-driven).
3. **Funnel Alignment**: Match the target funnel stage (TOFU = broad reach styles, MOFU = utility/playbook styles, BOFU = deep authority styles).
4. **Persona Match**: If a persona is specified, prefer styles that fit that voice (Tool Mechanic → Step-by-Step/HowTo, Data Journalist → Historical/Data, Risk Manager → Contrarian/Debate, Master Framework → MasterFramework/LeadMagnet).

OUTPUT: Clean JSON only, no markdown wrapper:
{
  "selected_styles": ["style-Filename1", "style-Filename2", "style-Filename3", "style-Filename4"],
  "reasoning": ["Brief reason for style 1", "Brief reason for style 2", "Brief reason for style 3", "Brief reason for style 4"]
}
`;
}

export function getStyleSelectionPromptStr(topic, contextSnippet, funnelStage, persona, styleIndexContent, lockedStyles = null, excludedStyles = null) {
  const lockBlock = lockedStyles
    ? `\nLOCKED STYLES (already chosen — include these exactly as-is, pick the remaining slots):\n${lockedStyles.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}\n`
    : '';

  const excludeBlock = excludedStyles && excludedStyles.length > 0
    ? `\nEXCLUDED STYLE FILENAMES (recently published — DO NOT select any of these):\n${excludedStyles.map(s => `  - ${s}`).join('\n')}\n`
    : '';

  return `
TOPIC BRIEF:
- Core Topic: "${topic}"
- Context: "${contextSnippet || 'No additional context provided.'}"
- Funnel Stage: ${funnelStage || 'TOFU'}
- Target Persona: ${persona || 'Auto-select'}
${lockBlock}${excludeBlock}
STYLE BANK INDEX (all available wireframes):
${styleIndexContent}

TASK: Select the 4 best-matching styles for this topic.${lockedStyles ? ' The locked styles above are non-negotiable — output them in the same positions, then fill the remaining slots with complementary picks.' : ''}${excludedStyles ? ' The excluded styles above must NOT appear in your output.' : ''} Return ONLY the JSON object.
`;
}

export function getWriterProposalSystemInstruction() {
  return `
You are a junior content writer at Iroi Media, reporting to your Editor-in-Chief (Silvester / @KenalKripto).
Your job is to research a topic and present a clear, scannable proposal for how to write about it.

VOICE: Smart, analytical, direct. Write like a peer briefing their boss — professional but conversational. Use "Boss" as your opening salutation.

FORMAT RULES:
- Use bullet points ( - ) for ALL lists. Put exactly ONE empty line between every bullet point, paragraph, and section.
- Every sentence MUST be its own bullet point. No multi-sentence bullets.
- Keep each bullet to 1 short sentence or 1 short phrase. Think "fast scan on mobile."
- No nested bullets. Flat list only.

PROPOSAL STRUCTURE:
1. Opening: "Boss, I've researched [topic]." One line.
2. Style recommendation: Style name, then a section "Why I propose this style:" followed by bullets explaining reasoning. Include alternatives considered and why rejected.
3. Proposed post flow: Numbered posts (Post 1:, Post 2:, etc.). For EACH post, provide:
   - hook: [design intent — what this post's hook achieves]
   - hook example: "[concrete example of the hook text]"
   - body: [design intent — what the body covers]
   - body example: "[concrete example of body text]"
   - close: [design intent — how this post bridges to the next]
   - close example: "[concrete example of the bridge/close text]"
   Put one empty line between every element (hook, hook example, body, body example, close, close example). Put one empty line between posts.
4. Quick recap: Compact table of posts (Post 1: hook→body→close, Post 2: hook→body→close, etc.). One line per post.
5. Top 10 interesting facts: Numbered list of verified facts from research with their source data. Each fact on its own bullet line.

CRITICAL: Every element described above MUST be on its own line with an empty line after it. The editor scans on mobile. No dense paragraphs.
`;
}

export function getWriterProposalPromptStr(inputPayload, selectedStyles, plannerSkeleton, researchBrief, lang) {
  return `
TOPIC: "${inputPayload.core_topic || 'Strategic Post'}"

SELECTED STYLES:
${selectedStyles.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

PLANNER SKELETON:
${JSON.stringify(plannerSkeleton, null, 2)}

RESEARCH BRIEF:
${researchBrief}

TARGET LANGUAGE: ${lang === 'en' ? 'ENGLISH' : 'INDONESIAN'}

TASK: Write a complete Writer's Proposal for your Editor-in-Chief. Propose the best style with reasoning. Propose the detailed post-by-post flow with design intent AND concrete examples for every component. List the top 10 most interesting facts from the research. Format everything with bullet points and empty line separators.
`;
}

