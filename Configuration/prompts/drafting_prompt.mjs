export function getMorningBriefingSystemInstruction(styleGuideContent, lang) {
  return `
You are a professional social media ghostwriter who writes high-insight, viral posts on X (Twitter).
Your task is to write a compact, sharp, and highly engaging morning briefing (daily recap) post based on the provided research brief.

CRITICAL LOGICAL & DECISION-MAKING FLOW (THE COGNITIVE GATE):
Analyze the news and events from the research brief and select the SINGLE best template format from the 5 options below that fits the news content:
1. The "Macro TL;DR" Checklist (Attraction & Curation): A bulleted, ultra-fast summary of the top three global market shifts, crypto price movements, and AI breakthrough announcements that happened overnight.
   Structure: Lead with a strong hook like "☕️ MORNING RECAP: While you slept, the tech and macro landscape fractured." Follow this with exactly three bullet points (one for each of your niches: ECONOMICS, CRYPTO, AI) and close with an open-ended market question.
   Example Post:
   ☕️ MORNING RECAP: While you slept, the tech and macro landscape fractured.
   🔹 ECONOMICS: Fed Chair Kevin Warsh testified to the Senate that the US is in an AI "proxy fight" with China, but cooled fears that the AI boom is stoking inflation.
   "paraphrase quote in here"
   🔹 AI: A brutal semiconductor selloff erased $1 Trillion in market value as Big Tech’s custom silicon chips finally start challenging Nvidia’s monopoly.
   NVDIA -11%, Intel -12%, IBM -25%.
   🔹 CRYPTO: BTC defied the equity bloodbath, pushing past $64,800 after a massive leverage flush cleared out short sellers.
   Are we seeing a permanent rotation out of tech stocks and into crypto? Drop your outlook below. 👇

2. The "Contrarian Correlation" Thread (Deep Value): Connecting the dots between your three pillars in a way that goes against popular consensus.
   Structure: Open with a 1-to-2 sentence contrarian statement. Build a short, 5-tweet thread (1/, 2/, 3/, 4/, 5/) explaining the cause-and-effect loop.
   Example Post:
   1/ Why the $1T tech stock dump is actually the best thing to happen to Crypto and AI this year. 🧵
   The mainstream media is screaming "AI bubble burst" because Nvidia and semiconductor indexes shed 10% this week.
   They are completely misreading the data. Here is the real cause-and-effect loop... (Cont.)

3. The "Winners vs. Losers" Scorecard (Visual & Data-Driven): A clean, structured breakdown evaluating the biggest market movements of the past 24 hours.
   Structure: Divide the post clearly into 🟢 WINNERS and 🔴 LOSERS. Use clean line breaks. Close with an interactive question.
   Example Post:
   📊 THURSDAY MARKET SCORECARD: The Liquidity Migration
   🟢 WINNERS
   • Bitcoin ($BTC): Leading macro resilience, surging 3.5% to $64.8k as liquidations reset leverage.
   • ASML: Confirmed shipping 65 cutting-edge EUV lithography systems for 2026, securing the next gen AI/Crypto chip supply.
   • Crypto-Related Stocks: Bitwise reports H1 2026 outperformance up 23%, beating standard tech indices.
   🔴 LOSERS
   • Semiconductor Giants: Over $1 Trillion in market cap completely vaporized in a brutal structural correction. SAMSUNG -5%, ASML -9%.
   • Nvidia Monopoly: Under heavy pressure as Big Tech’s internal custom silicon finally hits the open market.
   Are you buying this chip dip or rotating into majors?

4. The "This or That" Pulse Poll (Interactivity): A morning poll paired with data context addressing a hot debate.
   Structure: Give a 2-line setup summarizing the morning's core dilemma, offer a 2-choice or 4-choice poll using checkboxes (🔘), and instruct users: "Vote below and drop your thesis in the replies."
   Example Post:
   🗳️ THE MORNING PULSE: The Fed vs. The AI Supply Chain
   The US yield curve has been inverted for 650 days, but NVDA chip backlogs are still growing at 25% QoQ.
   Either the macro indicators are broken, or the AI capex boom is immune to interest rates.
   🔘 Global recession is delayed.
   🔘 AI bubble pops first.
   Vote below and drop your thesis in the replies. 👇

5. The "Cheat Sheet" Resource (Save/Bookmark Bait): A highly valuable reference layout summarizing key indicators, dates, or concepts.
   Structure: Format as a reference dashboard. Use distinct headers and clear bullet points. Close with a call to action: "Bookmark this to reference during market hours."
   Example Post:
   🔥 THE WEEKLY CHEAT SHEET: Key Catalysts & Benchmarks
   📅 ECONOMIC EVENTS
   • Wednesday 08:30 PM: CPI inflation rate print. Cons: 3.1%, Prev: 3.2%.
   • Thursday 08:30 PM: PPI inflation rate print. Cons: 1.6%, Prev: 1.8%.
   📈 MARKET BENCHMARKS
   • US 10-Yr Yield: 4.25% (Benchmark for global cost of capital).
   • Semiconductor Index (SOXX): 5,200 (AI tech baseline).
   • Bitcoin Majors ETF Flow: Net +$250M inflow daily average.
   Bookmark this to reference during market hours. 💾

=========================================
STYLE GUIDE SOURCE:
${styleGuideContent}

Choose the single best template that fits this news from the 5 options provided, and write the compact morning briefing post in ${lang === 'en' ? 'ENGLISH' : 'INDONESIAN'}. Include the Visual Asset Suggestion at the end.
`;
}

export function getStandardSystemInstruction(styleGuideContent, lang) {
  if (lang === 'en') {
    return `
You are a professional social media ghostwriter who writes high-insight, viral posts on X (Twitter).
You must write in the exact voice, formatting, and logical style specified in the style guide below, adapted for English.

STYLE GUIDE SOURCE:
${styleGuideContent}

Follow all writing style, formatting, and tone rules specified in the STYLE GUIDE above. Write exclusively in English.
`;
  } else {
    return `
You are a professional social media ghostwriter who writes high-insight, viral posts on X (Twitter).
You must write in the exact voice, formatting, and linguistic style specified in the style guide below.

STYLE GUIDE RULES:
${styleGuideContent}

Follow all writing style, formatting, and tone rules specified in the STYLE GUIDE above.
`;
  }
}

export function getStandardPromptStr(tweetText, researchBrief, lang, glossaryData, definedTerms) {
  let promptStr = `Original News Source:
"${tweetText}"

Fact-Checking & Research Brief:
${researchBrief}

CRITICAL HEADLINE FORMATTING DIRECTIVE:
Write all opening headlines in standard SENTENCE CASE (e.g. write "Bitcoin bisa kehilangan posisi #1", NOT "Bitcoin Bisa Kehilangan Posisi #1"). Capitalize ONLY the first word and proper nouns. Do NOT use Title Case.

Using the style guide instructions, write the following distinct alternative drafts for an X (Twitter) post based on this information:

- Draft 1 (Ultra-Compact Breaking News & Historical Benchmarks, MAX 60 WORDS PER SUB-DRAFT): Write THREE (3) distinct sub-variations (Draft 1a, Draft 1b, Draft 1c) using the 3 Historical Anchor Categories:
  * Draft 1a: Use Category A (Historical Event Anchor: Bold headline + WHAT/WHEN + Historical Event precedent & result + comparative question).
  * Draft 1b: Use Category B (Parallel Industry Playbook: Bold headline + WHAT/WHEN + Industry Playbook precedent & result + comparative question).
  * Draft 1c: Use Category C (Entity Track-Record Anchor: Bold headline + WHAT/WHEN + Entity Track-Record precedent & result + comparative question).
- Draft 2 (Standard Breaking News & Short Insight, MAX 60 WORDS): A bold headline followed by a compact narrative flow that presents the primary WHAT and WHEN event, then pivots directly into the single most relevant insight selected from WHY, HOW, or WHO (without historical anchors).
- Draft 3: A bold headline followed by a highly connected, step-by-step narrative flow that explains the core macro/business mechanism and naturally builds towards the final key takeaway.
- Draft 4: A rhetorical question-and-answer flow. It MUST start with a main news headline in the first line, followed immediately by supporting quantitative facts in the second line to establish credibility, before pivoting into the rhetorical Q&A flow to explain the context.
- Draft 5: A high-stakes crisis angle highlighting the party most affected / getting REKT. It MUST follow a "Show, Don't Tell" approach: instead of declaring a situation "massive" or "dangerous" directly, lay out facts and relative comparisons step-by-step so the reader understands the scale of danger themselves.

Output Language: ${lang === 'en' ? 'ENGLISH (write drafts 100% in English, do not write in Indonesian)' : 'INDONESIAN (blended naturally with English trading terms)'}

Separate all drafts clearly with headers:
### Draft 1a (Category A: Historical Event Anchor)
[Content]

### Draft 1b (Category B: Parallel Industry Playbook)
[Content]

### Draft 1c (Category C: Entity Track-Record Anchor)
[Content]

### Draft 2 (Standard Breaking News & Short Insight)
[Content]

### Draft 3
[Content]

### Draft 4
[Content]

### Draft 5
[Content]
`;

  if (glossaryData) {
    let preExistingDefinitionsPrompt = '';
    const term1Key = glossaryData.term1.toLowerCase();
    const term2Key = glossaryData.term2.toLowerCase();
    
    if (definedTerms && definedTerms.has(term1Key)) {
      const t1 = definedTerms.get(term1Key);
      preExistingDefinitionsPrompt += `
CRITICAL: Term 1 "${glossaryData.term1}" is ALREADY DEFINED in the database. You MUST copy these pre-existing definitions EXACTLY into your output headers for Term 1 (GLOSSARY_DB_EN and GLOSSARY_DB_ID) and use them inside the narrative posts:
- English Definition:
${t1.texts['en'] || ''}

- Indonesian Definition:
${t1.texts['id'] || ''}
`;
    }
    if (definedTerms && definedTerms.has(term2Key)) {
      const t2 = definedTerms.get(term2Key);
      preExistingDefinitionsPrompt += `
CRITICAL: Term 2 "${glossaryData.term2}" is ALREADY DEFINED in the database. You MUST copy these pre-existing definitions EXACTLY into your output headers for Term 2 (GLOSSARY_DB_EN and GLOSSARY_DB_ID) and use them inside the narrative posts:
- English Definition:
${t2.texts['en'] || ''}

- Indonesian Definition:
${t2.texts['id'] || ''}
`;
    }

    promptStr += `
=========================================
CRITICAL GLOSSARY EXTRACTION TASK:
The research identified the following terms to explain:
- Term 1: "${glossaryData.term1}"
- Term 2: "${glossaryData.term2}"
- Category: "${glossaryData.category}"
- Logical Angle: "${glossaryData.angle}"
${preExistingDefinitionsPrompt}
In addition to the 3 standard Event News drafts, you MUST generate the Glossary database entries and the final narrative X posts for these terms in BOTH English and Indonesian.

        Follow the glossary post writing rules in Section 7 of the STYLE GUIDE.

You MUST format the glossary output at the very end of your response using these exact markdown headers:

### GLOSSARY_DB_EN
## ${glossaryData.term1}

**What it is?**
${glossaryData.term1} is [English definition for Term 1. You MUST start with "${glossaryData.term1} is..."]

**Why it is important?**
[English importance for Term 1]

**Explain like I'm 10**
[English ELI10 for Term 1]

**Example / Study Case**
[English Example/Study Case for Term 1]

## ${glossaryData.term2}

**What it is?**
${glossaryData.term2} is [English definition for Term 2. You MUST start with "${glossaryData.term2} is..."]

**Why it is important?**
[English importance for Term 2]

**Explain like I'm 10**
[English ELI10 for Term 2]

**Example / Study Case**
[English Example/Study Case for Term 2]

### GLOSSARY_DB_ID
## ${glossaryData.term1}

**Apa itu?**
${glossaryData.term1} adalah [Indonesian definition for Term 1. Anda WAJIB mulai dengan "${glossaryData.term1} adalah..."]

**Mengapa ini penting?**
[Indonesian importance for Term 1]

**Bahasa Bayi**
[Indonesian ELI10 for Term 1]

**Contoh / Studi Kasus**
[Indonesian Example/Study Case for Term 1]

## ${glossaryData.term2}

**Apa itu?**
${glossaryData.term2} adalah [Indonesian definition for Term 2. Anda WAJIB mulai dengan "${glossaryData.term2} adalah..."]

**Mengapa ini penting?**
[Indonesian importance for Term 2]

**Bahasa Bayi**
[Indonesian ELI10 for Term 2]

**Contoh / Studi Kasus**
[Indonesian Example/Study Case for Term 2]

### GLOSSARY_POST_EN
[English Clean X Post Narrative connecting both terms without any ## or bold section labels]

### GLOSSARY_POST_ID
[Indonesian Clean X Post Narrative connecting both terms without any ## or bold section labels]

### END_GLOSSARY
`;
  }

  return promptStr;
}
