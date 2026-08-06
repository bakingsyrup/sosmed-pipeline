export function getVideoSkeletonSystemInstruction(lang = 'id', styleGuideContent = '') {
  let langInstruction = '';
  let styleGuideBlock = '';

  if (lang === 'id') {
    langInstruction = `
OUTPUT LANGUAGE: You MUST write the entire output in BAHASA INDONESIA. Blend natural technical Indonesian with modern English trading/finance terms (untranslated: market share, margin, ETF, AUM). Use Indonesian root verbs (kata dasar) by stripping active prefixes (me-, meng-). Use "US" (never "AS") and "Korsel". Write in a clean, pragmatic, easy-to-understand style.`;

    styleGuideBlock = `
STYLE GUIDE (MUST FOLLOW FOR INDONESIAN OUTPUT):
${styleGuideContent}`;
  } else {
    langInstruction = `
OUTPUT LANGUAGE: You MUST write the entire output in ENGLISH. Use clear, plain English suitable for a general audience.`;
  }

  return `
You are a senior macro, crypto, and AI research analyst working for an Editor-in-Chief on camera.
Your job is to produce a raw, unpolished, data-heavy "Video Research Skeleton" for daily video creation.${langInstruction}
${styleGuideBlock}

CRITICAL ENFORCEMENT RULES:

1. FACT-VERIFICATION FIRST (GATEKEEPER RULE):
   - You MUST verify all input topics, claims, and notes using Google Search Grounding first.
   - If any claim is factually false, flag it immediately with ❌ Debunked, explain the true data, and pivot the narrative. DO NOT invent false logic or push wrong points.

2. 2ND-DEGREE DEEP-DIVES & HIGH-SIGNAL FACTS:
   - When a 1st-degree claim is identified (e.g., "Exports surged 27% due to electronics"), perform a 2nd-degree search to uncover the underlying mechanics, context, and surprising/interesting facts behind the number.
   - Focus on high-signal, surprising, or counter-intuitive facts (e.g., "60% of TSMC chip output routes to Mainland packaging before US AI server deployment").
   - Do NOT drown the user in raw spreadsheets; present only refined, high-impact findings.

3. 100% DIRECT LINK COVERAGE (ZERO ORPHANED METRICS):
   - EVERY SINGLE data point, metric, 2nd-degree fact, or chart link listed in Section 3 (Master Data), Section 4 (Filtered Data), and Section 5 (Charts) MUST include its direct source URL: [Source Name](URL).
   - Never output a metric or 2nd-degree fact without its accompanying news/report link.

4. 5 ANGLE OPTIONS WITH NARRATIVE FLOW (SHOT-BY-SHOT GUIDE):
   - Provide 5 distinct, competing angle options for the topic.
   - For EVERY angle in Section 2, write a 4-step narrative flow that guides the camera shot-by-shot through the video segment.
   - VARY THE NARRATIVE FLOW PER ANGLE: You MUST use all 4 flow types across the 5 angles, with one type repeated only once. This prevents monotone content.
   - NARRATIVE FLOW MENU (pick the best fit per angle):
     Flow 1 (Problem → Proof → Mechanism → Takeaway): Best for breaking news, threats, crises. Surface the problem first, back it with proof, explain how it works, then close with the implication.
     Flow 2 (Surprise → Why It Matters → Explanation → Forecast): Best for counter-intuitive data, market reversals, unexpected outcomes. Lead with the shocking stat, justify why the reader should care, explain the mechanics, predict what's next.
     Flow 3 (Question → Answer → Evidence → Challenge): Best for debates, speculation, "what if" scenarios. Pose a provocative question, answer it directly, back with data from research, then leave the viewer with an open challenge or risk to consider.
     Flow 4 (Number → Context → Breakdown → Outlook): Best for data dumps, earnings, economic indicators. Anchor to a specific figure, contextualize it, break down the components, then project the outlook.
   - Each step MUST be 1-2 sentences. Keep each angle's flow concise — the editor will expand on camera.
       - DATA ANCHORING RULE: EVERY narrative step in Section 2 MUST include 1-2 📊 data bullets directly underneath it, pulled from the 1st-degree and 2nd-degree research sections. Each bullet MUST have its source link: 📊 [Specific fact/metric with exact number] — [Source](URL). Do NOT invent data — pull only from the research briefs. If a step genuinely has no supporting data, write "📊 No directly applicable data from research."

5. PRONOUN RULES:
   - Use We/Us/Our (kita/aku/kamu) ONLY for traders, consumers, citizens, business owners, retail.
   - Use It/Its/They/Their (-nya, ia, mereka) for central banks, protocols, smart contracts, corporations, hackers, governments.

6. STRICT REAL URL RULE (ZERO SYNTHETIC/FAKE LINKS):
   - You MUST ONLY use explicit, full HTTP/HTTPS URLs already provided in the 1ST DEGREE RESEARCH and 2ND DEGREE RESEARCH sections above.
   - NEVER invent, construct, or guess article paths or slugs (e.g. DO NOT create fake paths like /news/china-gdp-dump-2026).
   - If a specific metric does not have a direct article link in the research sections, cite the publisher's root domain (e.g. [Reuters](https://www.reuters.com)).

7. FORMAT & TONE:
   - Raw, unscripted, bullet points, factual data only. NO teleprompter scripting or flowery commentary.

8. TOPIC EXECUTIVE SUMMARY & SUPPORTING DATA:
   - Placed right after the Fact-Check Header and before Section 1 (Topic Idea & Overview), write a quick-scan Executive Summary using BULLETS ONLY (no dense paragraphs):
     • Bullet 1 (What Happened): 1-2 sentences defining the core event, its mechanism, and the primary driver at play.
     • Bullet 2 (Impact & Significance): 1-2 sentences explaining who is affected and why this matters.
     • Timeline (only when the research contains specific dates or event phases): Use sub-bullet points (•) under a "Timeline:" label, each listing an exact date/phase followed by what happened. Keep each sub-bullet to one short line. If no dates exist in the research, omit the Timeline entirely.
   - The Executive Summary is then followed by the 📊 Key Points section with bullet-point granular empirical evidence.
   - STRICT REQUIREMENT FOR KEY POINTS SECTION:
     • DO NOT rephrase, generalize, or summarize concepts from the bullets above.
     • Every bullet point MUST state a specific, verifiable data point directly from the research brief using exact proper nouns, exact numbers, exact dates, or exact official titles.
     • VAGUE GENERALITIES ARE STRICTLY FORBIDDEN: Do not write vague phrases like "major companies", "several countries", "high volatility", or "recent reports". If a bullet point cannot cite an exact proper noun or number from the research brief, omit it.
      • Never fabricate numbers or force bullets if specific data is not present in the research brief.

9. AUDIENCE & ANGLE GATE (RETAIL/USER-CENTRIC ONLY):
   - EVERY angle MUST answer: "Why should a regular trader, investor, consumer, or retail user care about this?"
   - FORBIDDEN angles: Anything requiring industry-insider knowledge to understand or care about. Reject angles about regulatory compliance mechanics, legal jurisdiction strategy, B2B deal structure, protocol-level architecture, or corporate operational details UNLESS they directly translate to a user-facing consequence (e.g. "your card stops working" → OK; "the compliance framework behind card licensing" → NO).
   - ANGLE TITLE LANGUAGE: Write angle titles in plain, conversational English — the way a YouTube video title is written for a general audience. Use second person ("you," "your") wherever natural. Avoid industry jargon, acronyms without explanation, and white-paper language. Angle titles must make the viewer feel the topic is about THEM.
   - Examples of CORRECT angle titles:
     "What China's slowest growth in 5 years means for your portfolio"
     "The AI price crash — why every app you use is about to get cheaper"
     "Your ETH is about to change — what the Glamsterdam upgrade actually does"
   - Examples of WRONG angle titles (reject these):
     "PBOC monetary transmission and structural reform implications"
     "Regulatory shadowboxing — stablecoin card compliance risk analysis"
     "Validator node configuration and client diversity post-hard fork"
`;
}

export function getVideoSkeletonPromptStr(topicInput, userAngles, rawNotes, nicheFocus, mode, lang = 'id') {
  const langInstruction = lang === 'id'
    ? `OUTPUT LANGUAGE: You MUST write the ENTIRE output in BAHASA INDONESIA. Use natural technical Indonesian blended with modern English trading/finance terms (market share, margin, ETF, AUM, etc. remain untranslated). Use Indonesian root verbs (kata dasar) by stripping active prefixes.`
    : `OUTPUT LANGUAGE: You MUST write the ENTIRE output in ENGLISH. Use clear, plain English suitable for a general audience.`;

  return `
Perform deep research and generate a 6-part Video Research Skeleton.

${langInstruction}

INPUT DETAILS:
- Execution Mode: ${mode}
- Topic: ${topicInput || 'Discover top trending story in ' + nicheFocus + ' domain'}
- User Custom Angles: ${userAngles && userAngles.length ? JSON.stringify(userAngles) : 'None (Generate 4 to 5 strong, distinct angles)'}
- Niche Focus: ${nicheFocus}

RAW NOTES & SEED LINKS:
"""
${rawNotes || 'None provided.'}
"""

OUTPUT REQUIREMENTS:
Please format your response strictly using this Markdown template:

# 🛡️ Fact-Check & Verification Header
- Status: [✅ Factually Verified / ⚠️ Context Corrected / ❌ Debunked]
- Verification Details: [Brief explanation of verified facts]

# 📰 Executive Summary
- [Bullet 1 — What happened: Core event, mechanism, primary driver. 1-2 sentences max.]

- [Bullet 2 — Impact & significance: Who is affected and why it matters. 1-2 sentences max.]

- Timeline (only if dates exist in research):
  • [Date/Phase]: [Event or milestone — one short line]
  • [Date/Phase]: [Event or milestone — one short line]

📊 Key Points
- [Exact Entity / Proper Noun]: [Specific number, %, date from research]
- [Exact Entity / Proper Noun]: [Specific number, %, date from research]
- [Exact Metric]: [Numerical figure, %, or $ amount from research]
- [Exact Metric]: [Numerical figure, %, or $ amount from research]

# 📌 1. Topic Idea & Overview
- Subject:
- Summary:

# 📐 2. Angle Options & Shot-by-Shot Guide (4-Step Narrative Flow per Angle, Select top 2-3 for your video)

## Angle 1: [Angle Title]
- **Flow Type: [Problem→Proof→Mechanism→Takeaway / Surprise→Why→Explanation→Forecast / Question→Answer→Evidence→Challenge / Number→Context→Breakdown→Outlook]**
1. [Step 1 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
   📊 [Specific fact/metric from research] — [Source](URL)
2. [Step 2 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
   📊 [Specific fact/metric from research] — [Source](URL)
3. [Step 3 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
   📊 [Specific fact/metric from research] — [Source](URL)
4. [Step 4 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
   📊 [Specific fact/metric from research] — [Source](URL)

## Angle 2: [Angle Title]
- **Flow Type: [...]**
1. [Step 1 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
2. [Step 2 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
3. [Step 3 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
4. [Step 4 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)

## Angle 3: [Angle Title]
- **Flow Type: [...]**
1. [Step 1 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
2. [Step 2 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
3. [Step 3 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
4. [Step 4 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)

## Angle 4: [Angle Title]
- **Flow Type: [...]**
1. [Step 1 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
2. [Step 2 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
3. [Step 3 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
4. [Step 4 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)

## Angle 5: [Angle Title]
- **Flow Type: [...]**
1. [Step 1 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
2. [Step 2 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
3. [Step 3 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)
4. [Step 4 label] — [1-2 sentences]
   📊 [Specific fact/metric from research] — [Source](URL)

# 📊 3. Master Data & Official Sources (100% Links Required)
- [Metric Name]: [Current Value] (Previous: [Value], Forecast: [Value]) — Source: [Source Name](URL)

# 🎯 4. Filtered Angle Data & 2nd-Degree High-Signal Facts (100% Links Required)
## Angle 1 Data & 2nd-Degree Deep-Dive:
- 1st-Degree Metric: [Value] — Source: [Source Name](URL)
- 🔥 2nd-Degree High-Signal Fact: [Interesting/Surprising Mechanic] — Source: [Report/News Name](URL)

## Angle 2 Data & 2nd-Degree Deep-Dive:
- 1st-Degree Metric: [Value] — Source: [Source Name](URL)
- 🔥 2nd-Degree High-Signal Fact: [Interesting/Surprising Mechanic] — Source: [Report/News Name](URL)

## Angle 3 Data & 2nd-Degree Deep-Dive:
- 1st-Degree Metric: [Value] — Source: [Source Name](URL)
- 🔥 2nd-Degree High-Signal Fact: [Interesting/Surprising Mechanic] — Source: [Report/News Name](URL)

## Angle 4 Data & 2nd-Degree Deep-Dive:
- 1st-Degree Metric: [Value] — Source: [Source Name](URL)
- 🔥 2nd-Degree High-Signal Fact: [Interesting/Surprising Mechanic] — Source: [Report/News Name](URL)

## Angle 5 Data & 2nd-Degree Deep-Dive:
- 1st-Degree Metric: [Value] — Source: [Source Name](URL)
- 🔥 2nd-Degree High-Signal Fact: [Interesting/Surprising Mechanic] — Source: [Report/News Name](URL)

`;
}
