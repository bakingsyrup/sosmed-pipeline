---
style_name: "Article_SystematizedPlaybook_HighUtility"
format: "long_form_article"
promo_post: "[[style-Short_NegativeContrarian_BookmarkUtility]]"
---

## 📌 Source Reference & Original Content
- 🔗 **Direct Link:** [Inspect Content on X](https://x.com/milesdeutscher/status/2082563079536345518)

### 📜 Complete Original Text:
> 296K
> TL;DR: How to prompt the Claude 5 family (Fable, Opus & Sonnet) for maximum token efficiency, smarter responses & more Claude productivity.
> The bottom line is that the way you prompt the Claude 5 family needs to fundamentally change from any other Anthropic model you're used to.
> Each model has its own unique quirks, and by the end of the article, you'll know exactly how to navigate them and use Fable, Opus & Sonnet 5 for maximum productivity.
> This is everything that you need to know (by Anthropic).
> Table of Contents
> l: General Claude 5 Prompting Principles
> II: Prompting Fable 5
> III: Prompting Opus 5
> IV: Prompting Sonnet 5
> V: Recap & Practical Takeaways
> All the tips, strategies, and methods suggested here are sourced directly from Anthropic themselves - at the end of this guide, I listed all my sources.
> I: General Claude 5 Prompting Principles
> Before we get into each individual model, there are a few principles that apply across the entire Claude 5 family.
> Get these right, and the model-specific stuff becomes far easier; in general, if you only make a few changes to how you prompt the Claude 5 family, make it these:
> 1.     Your old prompts may be working against you
> Anthropic is very clear about this. Prompts,  skills, and project instructions you tuned for older models can now actually produce worse results than a simple fresh prompt would (the reason is that older Claude models needed a lot of hand-holding).
> If a prompt, skill, or system prompt was built for an older model, the best move is to start fresh rather than port it over.
> 2.     Effort level
> Every Claude 5 model has an effort setting, and it is the primary control for the trade-off between intelligence, speed, and cost.
> The general scale looks like this:
> Low or medium: quick questions, simple rewrites, basic research,  anything conversational
> High: the default, and right for most tasks
> Xhigh: your hardest problems, complex builds, multi-step analysis, anything where quality is non-negotiable
> Max: absolute maximum capability, no constraints on token spend.
> 3.     Say what you want, because new models take you literally
> Older models would read between the lines and generalize. The  Claude 5 family is more literal.
> It does exactly what you ask,  and it does not silently assume you meant something broader.
> 4.     Controlling output length
> Turning effort down does not reliably make responses shorter. If you want a shorter answer, you have to actually ask for one.
> A  short instruction like "keep this concise, skip the caveats, get to the point" does more than any effort setting will.
> General Claude 5 Principles
> II: Prompting Fable 5
> Fable 5 is the most unique model on this list for a few reasons: it's extremely autonomous, expensive, and capable.
> It is built to run autonomously for hours, manage dozens of subagents, and complete multi-day tasks with very little hand-holding.
> Here's how to maximize it:
> Tell it why, not just what
> Other models run fine on pure instructions, but Fable does not. It wants the reasoning behind the task, because context lets it connect your request to the bigger picture rather than guessing at your intent, and this is also why it asks so many clarifying questions before it starts.  \
> Anthropic recommends this exact structure:
> TELL IT WHY  "I'm working on [the larger task] for [who it's for]. They need  [what the output enables]. With that in mind: [your actual  request]."
> 2.     Keep your instructions short
> With Fable, over-engineering your prompt can actually make the output worse, because you are constraining a model that would have found the right approach on its own.
> Add needed context but keep instructions short.
> 3.     Checkpoints
> Fable is built to run on its own, which means if you do not set the checkpoints, it will set them itself. For anything important or sensitive, you want to draw those lines explicitly.
> CHECKPOINT PROMPT  "Pause for me only when the work genuinely requires my input: a  destructive or irreversible action, a real scope change, or  something only I can provide. Otherwise, keep going and report  back when done."
> 4.     Give Fable a memory database
> Fable performs noticeably better when it can record lessons from previous runs and refer back to them. This can be as simple as pointing it at a markdown file to write notes in.
> MEMORY INSTRUCTION
> 
> "Store one lesson per file with a one-line summary at the top.
> Record corrections and confirmed approaches alike, including why
> they mattered. Don't save what the repo or chat history already
> records. Update an existing note rather than creating a
> duplicate. Delete notes that turn out to be wrong."
> Optimal Fable 5 Prompting Structure
> OPTIMAL FABLE PROMPT
> 
> "I'm working on [the larger task] for [who it's for].
> They need [what the output enables].
> 
> Request: [your specific ask in one clear sentence]
> 
> Output format: [exactly how you want the result delivered]
> 
> Constraints: [what Fable must not assume on its own]"
> 
> [Diagram: the four-part Fable prompt structure]
> These tips are the highest-leverage changes you should make to the way that you prompt Fable.
> But if you use Fable 5 often and want a deeper dive, read this:
> AI Edge
> @aiedge_
> ·
> Jun 11
> Article
> Fable 5 (Mythos) Prompting Masterclass by Anthropic
> TLDR: Anthropic just published the official playbook for prompting the most powerful AI model on earth - I translated it.
> Most people won't read this guide (it's buried in the API docs), which is...
> 23
> 237
> 1.2K
> 1.9M
> III: Prompting Opus 5
> Just a few days ago, Anthropic published the new Opus 5 prompting guidelines. I haven't seen anyone talk about it yet, so you're getting the early scoop here.
> Opus 5 is the model most of you will use day-to-day. It is a capable all-rounder that performs brilliantly out of the box, but there are a few tweaks you can implement to make it even better.
> 1.     Stop telling it to double-check itself
> No need to add "verify your answer" or "double-check before responding" to important prompts. Opus 5 already catches and fixes its own mistakes without being asked.
> When you tell it to re-check, you are stacking on top of what it already does, which burns tokens for no real gain.
> 2.     Ask for short
> Opus 5's default answers are longer than previous versions.  Again, if you want a shorter answer, you have to actually say so.
> A simple instruction handles it:
> CONCISENESS PROMPT  "Keep responses focused, brief, and concise. Spend most of the  response on the main answer, and keep caveats short. When  explaining something, give a high-level summary unless I ask for  depth."
> 3.     Constraining the scope
> Opus 5 can expand a task on its own, adding steps you did not ask for or applying its own judgment about what the job should be.
> Just make sure to be clear about exactly what you want Opus to do, and tell it to stay on track for only those goals.
> 4.     Reviews
> Many of you will probably be using Opus 5 for review work. Things like codebase review, writing review, and so on.
> Make sure to ask for everything, THEN filter.
> This one is slightly counterintuitive from the first point, but for review work, it's necessary.
> For example, if you ask Opus 5 to "only flag the serious issues" or "be conservative" when reviewing something, it takes you literally and reports less. This means other real problems may slip through, so the fix is to ask for full coverage first, then filter in a second pass.
> Prompting Opus 5
> IV: Prompting Sonnet 5
> And lastly, Sonnet 5, the fastest model in the group.
> I like to think of Sonnet 5 as the workhorse. It's fast, cheap, and genuinely good at pretty much anything you throw at it. For most everyday work, it is the model you want to run.
> Raise the effort
> Sonnet 5 respects effort levels strictly, especially at the low end. At low and medium, it scopes its work to exactly what was asked and nothing more.  This is great for speed and cost, but if you throw a genuinely complex problem at it on low effort, you can get extremely shallow reasoning back.
> The fix is not to write a cleverer prompt or switch models, but to simply swap reasoning efforts to xHigh+ and let the model think properly.
> Sonnet 5 on low/medium is best for daily tasks, but xHigh+ is still extremely capable while staying cost-efficient.
> 2.     Sonnet calibrates its own length
> Unlike Opus 5, Sonnet 5 adjusts response length to the complexity of the task.
> i.e., short answers on simple lookups and longer ones on open-ended analysis - just keep this in mind for how you prompt in terms of length & complexity. What you put in is generally what you get out.
> 3.      Frontend design taste
> This is the one most people will actually feel. On open-ended design and frontend briefs, Sonnet 5 settles into a consistent house style. It looks fine for some projects and completely wrong for others.
> Generic instructions like "don't use that color" or "make it cleaner" just move it to a different fixed style.
> To fix this, two things work: a) give it a concrete frontend spec and b) add taste/design skills so Sonnet 5's frontend capabilities improve.
> 4.    Tone & writing style
> Sonnet responds very well to tone & writing style instructions.
> Feel free to add things like:
> Use a warm, collaborative tone. Acknowledge the user's framing before answering.
> 
> Prompting Sonnet 5
> V: Recap & Practical Takeaways
> This was a dense one, so here is everything condensed into what actually matters.
> The Universal Rules: these apply to all Claude 5 models
> Start fresh, don't port over. Prompts, skills, and instructions built for older models often make Claude 5 worse, not better.
> Stop over-instructing.
> Match effort to task. Low and medium for daily work. High as your default. xHigh and above for the genuinely hard stuff. Most
> Say exactly what you mean.
> Using Specific Models
> Fable 5 → genuinely hard, long-running jobs.
> Opus 5 → capable all-rounder, daily use
> Sonnet 5 → speed, cost, and volume.
> If you take nothing else from this article, take these three things:
> With Fable, tell it why, and make sure to use checkpoints inside your loops.
> 2.    With Opus, ask for less, and direct it towards only your end goal.
> 3.    With Sonnet, be specific. It does exactly what you ask, so vagueness gets you a vague result.
> Resources used for this article:
> Prompting Fable 5: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
> Prompting Opus 5: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
> Prompting Sonnet 5: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5
> Closing
> I hope you found this article helpful.
> If you did, be sure to follow me here @aiedge_. Every single week, I post articles that help you better understand and use AI.
> If you enjoy AI content in a written format, feel free to subscribe to my newsletter.
> Every Wednesday, I send a publication that contains one key AI workflow I built, an AI news recap, and my own personal research into robotics, AI & more.
> If that interests you, subscribe here:
> https://newsletter.aiedgehq.co/
> 100% free, no spam ever & unsub anytime

---

style_name: "Article_SystematizedPlaybook_HighUtility"

### Part 1: Metadata & Ratio Trigger
**Trigger:** Bookmarks (High Utility/Save Value). 
**Mechanics:** The content functions as an "evergreen reference manual." By positioning itself as a direct translation of proprietary, buried technical documentation, it creates an "information arbitrage" value proposition that forces users to bookmark the post for future implementation.

### Part 2: Psychological Lever
**Primary Driver:** High Utility & Authority.
**Secondary Driver:** FOMO (The "Early Scoop" on new model behavior). 
**Mechanism:** The content establishes the author as an authority by synthesizing inaccessible technical documentation into a "Masterclass" format. It leverages the user's anxiety about their current prompting habits being "outdated" (a form of technical obsolescence) to drive engagement.

### Part 3: Micro-Rhythm & Pacing Rules
*   **Hook Line Length:** Strictly <12 words. High punchiness.
*   **Line-break Density:** High. Use of frequent double-spacing to isolate individual "laws" or "rules."
*   **Whitespace Pacing:** 2:1 ratio of text blocks to white space. Each section ends with a "summary" block.
*   **Bullet/List Patterns:** Alternating between numbered lists (for hierarchy) and blockquote-style syntax (for prompt templates).
*   **Section Progression:** "Universal Rules" → "Model-Specific Deep Dives" → "Consolidated Action Plan" → "Conversion/CTA."

### Part 4: Plug-and-Play Wireframe Blueprint

[Hook: Current status quo invalidation + Benefit promise]
"TL;DR: How to prompt [Model Family] for [High-Level Benefit]. The bottom line is [Contrarian Truth about old habits]. Here is the [Specific Guide] you need."

[Section: Universal Principles]
"Before you dive in, follow these [Number] rules:
1. [Principle 1]: [Brief explanation].
2. [Principle 2]: [Brief explanation]."

[Section: Model Deep-Dive Pattern (Repeat for N models)]
"III: Prompting [Model Name]
[Model Name] is [Primary Personality Trait]. To maximize it:
1. [Strategy]: [Explanation].
2. [Actionable Template]:
[CODE_BLOCK: Parameterized Prompt Example]"

[Section: The "Cheat Sheet" Summary]
"Recap & Practical Takeaways:
If you take nothing else from this article, remember:
- [Takeaway A]
- [Takeaway B]
- [Takeaway C]"

[CTA: Identity Signaling + Lead Magnet]
"I hope you found this helpful. 
Follow [Account Name] for [Specific Niche] insights. 
If you prefer deep-dives, join [Number] others in my newsletter: [URL]."