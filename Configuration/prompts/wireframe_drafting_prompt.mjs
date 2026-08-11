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

  if (falsePremiseFeedback) {
    promptStr += `\n⚠️ FALSE PREMISE RE-PLANNING FEEDBACK FROM RESEARCH AGENT:\n`;
    promptStr += `${JSON.stringify(falsePremiseFeedback, null, 2)}\n`;
    promptStr += `INSTRUCTION: Update your thread skeleton and shopping list to reflect the true ground-truth reality reported above!\n`;
  }

  promptStr += `\nSELECTED STYLE BANK WIREFRAME BLUEPRINT (PART 3 ELASTIC PHASES):\n`;
  promptStr += `${wireframeBlueprint.blueprint_text || wireframeBlueprint}\n\n`;
  promptStr += `TASK: Generate the Thread Skeleton Plan and Targeted Research Shopping List JSON.`;

  return promptStr;
}

export function getWireframeSystemInstruction(styleGuideContent, lang) {
  return `
You are a professional social media ghostwriter who writes high-insight, viral posts on X (Twitter).
Your task is to write social media draft variations based on selected Style Bank Wireframe Blueprints (Part 3 Elastic Narrative Phases) and verified research data.

=========================================
STYLE GUIDE SOURCE:
${styleGuideContent}

CRITICAL EXECUTION DIRECTIVES:
1. Follow all writing style, formatting, and tone rules specified in the STYLE GUIDE above.
2. Output Language: ${lang === 'en' ? 'ENGLISH (write drafts 100% in English)' : 'INDONESIAN (blended naturally with English tech/trading terms)'}.
3. Headline Formatting: Write opening headlines in standard SENTENCE CASE (e.g. "Why 90% of system prompts fail", NOT Title Case).
4. Line-Break Density: Use double line breaks (\\n\\n) between every sentence block. Exactly 1 sentence per text block.
5. Anti-Hype Rule: Avoid generic buzzwords ("game-changer", "unleash", "masif", "raksasa"). Use raw, active verbs (*kata dasar*) and concrete quantitative figures.
6. Elastic Phase Scaling: Follow the slot progression specified in Part 3 of the blueprint. Dynamically scale the post count (1/N ... N/N) to fit the research brief's full information depth.
`;
}

export function getWireframeDraftPromptStr(inputPayload, wireframeBlueprints, researchBrief, lang) {
  const bpArray = Array.isArray(wireframeBlueprints) ? wireframeBlueprints : (wireframeBlueprints ? [wireframeBlueprints] : []);
  const blueprintsStr = bpArray.map((bp, index) => `
=========================================
BLUEPRINT FOR DRAFT ${index + 1}: ${bp.template_name || `Template ${index + 1}`}
Part 3 Blueprint Schema:
${bp.blueprint_text || bp}
`).join('\n');

  return `
INPUT TOPIC PAYLOAD:
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
Using the verified research brief and style guide, generate FOUR (4) distinct draft variations for an X (Twitter) post by populating the selected Style Bank Wireframe Blueprints.

Separate all 4 drafts clearly with standard markdown headers:

### Draft 1 (${bpArray[0]?.template_name || 'Style Variation 1'})
[Content for Draft 1 following Blueprint 1]

### Draft 2 (${bpArray[1]?.template_name || 'Style Variation 2'})
[Content for Draft 2 following Blueprint 2]

### Draft 3 (${bpArray[2]?.template_name || 'Style Variation 3'})
[Content for Draft 3 following Blueprint 3]

### Draft 4 (${bpArray[3]?.template_name || 'Style Variation 4'})
[Content for Draft 4 following Blueprint 4]
`;
}

