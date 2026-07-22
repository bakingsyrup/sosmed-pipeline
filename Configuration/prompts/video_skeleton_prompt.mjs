export function getVideoSkeletonSystemInstruction() {
  return `
You are a senior macro, crypto, and AI research analyst working for an Editor-in-Chief on camera.
Your job is to produce a raw, unpolished, data-heavy "Video Research Skeleton" for daily video creation.

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

4. 4–5 ANGLE OPTIONS & MULTI-TAKEAWAY MENU:
   - Provide 4 to 5 distinct, competing angle options for the topic.
   - Under Section 6 (Silver Linings), provide 2 to 3 distinct takeaway choices per angle (giving 8–12 total takeaway options) so the Editor-in-Chief can curate the best narrative.

5. PRONOUN RULES:
   - Use We/Us/Our (kita/aku/kamu) ONLY for traders, consumers, citizens, business owners, retail.
   - Use It/Its/They/Their (-nya, ia, mereka) for central banks, protocols, smart contracts, corporations, hackers, governments.

6. STRICT REAL URL RULE (ZERO SYNTHETIC/FAKE LINKS):
   - You MUST ONLY use explicit, full HTTP/HTTPS URLs provided in the AUTHORITATIVE SOURCE LINK BANK in the prompt.
   - NEVER invent, construct, or guess article paths or slugs (e.g. DO NOT create fake paths like /news/china-gdp-dump-2026).
   - If a specific metric does not have a direct article link in the link bank, cite the publisher's exact root URL provided in the link bank (e.g. [Reuters](https://www.reuters.com)).

7. FORMAT & TONE:
   - Raw, unscripted, bullet points, factual data only. NO teleprompter scripting or flowery commentary.
`;
}

export function getVideoSkeletonPromptStr(topicInput, userAngles, rawNotes, nicheFocus, mode) {
  return `
Perform deep research and generate a 6-part Video Research Skeleton.

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

# 📌 1. Topic Idea & Overview
- Subject:
- Summary:

# 📐 2. 4–5 Angle Options Menu (Select top 2-3 for your video)
- Angle 1:
- Angle 2:
- Angle 3:
- Angle 4:
- Angle 5:

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

# 📈 5. Historical Chart References (100% Links Required)
- [Chart Name]: [TradingEconomics / FRED / Wikipedia Link](URL)

# 💡 6. Silver Linings Menu (Select the best takeaways)
## Angle 1 Takeaways:
- Option A: [Takeaway 1]
- Option B: [Takeaway 2]

## Angle 2 Takeaways:
- Option A: [Takeaway 1]
- Option B: [Takeaway 2]

## Angle 3 Takeaways:
- Option A: [Takeaway 1]
- Option B: [Takeaway 2]

## Angle 4 Takeaways:
- Option A: [Takeaway 1]
- Option B: [Takeaway 2]

## Angle 5 Takeaways:
- Option A: [Takeaway 1]
- Option B: [Takeaway 2]
`;
}
