# 🛠️ Temporary Working Document & Automated Workflow Blueprint: Repurposing X Threads to Multi-Platform

**Created:** August 8, 2026  
**Status:** Temporary Working Workspace (To be converted into automated pipeline SOP, then archived/deleted)  
**Primary Test Case:** *Hedging Spot Portfolios via Futures (Ex-Ajaib X Thread)*  

---

## 🎯 Goal & Core Philosophy

1. **Test Case Objective**: Repurpose yesterday's 6-post X thread on *Delta Neutral Hedging* across YouTube formats (Shorts, Video Essay, Community Post).
2. **De-Sponsorship Protocol**: Automatically strip out client-paid advertising (e.g., Ajaib referral code, app links, sponsor logos) for all secondary platforms (YouTube, IG, TikTok, LinkedIn).
3. **Automation Pipeline Goal**: Establish the exact mapping logic, prompt structure, and data transformation rules so future thread repurposing can be executed programmatically (<10s) via Lulua/Shinku engines.

---

## 📥 1. Raw Source Input (Original X Thread)

```text
Post 1 (Hook):
Jika Bitcoin jebol support, ini trik amankan portofolio kita
Saat ini, Bitcoin sudah sideways 2 bulan lebih.
Jika jebol, harga Bitcoin dan crypto mungkin akan turun lebih dalam.
Ini tips batasi kerugian kita jika pegang koin spot pakai teknik hedging di Futures 🧵(1/6)

Post 2 (Concept & Math):
Apa itu teknik hedging?
Ini strategi buka posisi short di Futures (kotak merah) senilai koin yang kamu pegang di spot(kotak hijau).
Jadi saat harga crash, rugi di spot akan diimbangi oleh cuan dari short (delta neutral).
Contoh: Kamu pegang 1 BTC di spot senilai $60.000, lalu buka short 1 BTC.
Saat harga turun ke $40.000, portofolio spot kamu rugi -$20.000.
Tapi posisi short di Futures justru cuan +$20.000.
Hasilnya? Nilai aset kamu tetap utuh di $60.000 tanpa perlu jual koin BTC sama sekali. (2/6)

Post 3 (Entry Timing & Market Psychology):
Kapan waktu paling pas untuk mulai buka posisi short?
Saat daily candle sudah tutup dibawah support kuat di timeframe daily dengan volume tinggi.
Ada beberapa timing lain yang dipakai orang, tapi ini yang utama.
Kenapa? karena jika harga closing di bawah support, muncul persepsi umum kalau harga akan turun lebih dalam.
Ini yang disebut 'self-fulfilling prophecy'—karena mayoritas trader percaya, penurunan beneran terjadi.
Lalu, sampai kapan kita harus tahan posisi short nya?(3/6)

Post 4 (Exit Timing & Margin Mode Safety):
Kapan waktu tepat untuk tutup posisi short dan lepas hedging?
Saat harga sentuh support kuat, mulai sideways, dan volume turun
Kenapa tutup? Untuk hindari terkikis biaya funding rate.
Bear market biasanya awet berbulan-bulan, simpan short terlalu lama bikin kita rutin bayar biaya ekstra.
Selain itu, pastikan hedging kita aman dari volatilitas tinggi.
Caranya? Pisahkan saldo wallet utama pakai Isolated Margin (kotak hijau), kita sudah bahas ini di post lalu:(4/6)

Post 5 (Risk Management Rules):
Ingat, hedging bukan alat buat spekulasi tebak arah market.
Ada 2 aturan wajib bagi kita retail agar strategi ini tidak jadi boomerang:
1. Wajib Leverage Rendah, maximum 1x - 2x (kotak merah)
Tujuan hedging adalah proteksi modal, bukan cari cuan cepat.
Leverage tinggi malah buat risiko margin call jika ternyata harga memantul naik.
2. Pantau Funding Rate
Saat mayoritas market short, pastikan biaya funding rate tidak gerus modal kamu (kotak hijau).(5/6)

Post 6 (Original Paid Client CTA - TO BE STRIPPED):
Kunci bertahan di crypto: pintar amankan modal pas bear market.
Cuan bull run tidak ada artinya kalau porto kita habis tergerus oleh beruang.
Kalau kamu mau pakai fitur ini, download Ajaib Kripto di App Store dan Play store, pakai kodeku (adastra) ya😀(6/6)
```

---

## 🧼 2. Automatic De-Sponsorship & Value-Swap SOP

### Transformation Rules:
1. **Detect Client Elements**: Identify referral codes (`adastra`), brand app downloads (`Ajaib Kripto`), sponsor links, or client visual overlays.
2. **Purge & Sanitize**: Remove the final sponsored CTA entirely.
3. **Inject Owned Authority CTA**:
   * **YouTube Shorts**: Subscribing for risk management frameworks.
   * **YouTube Long-Form**: Channel subscription + owned community/workspace link.
   * **YouTube Community**: Comment section interaction / subscriber poll.

---

## 📺 3. Platform #1 Execution Blueprint: YOUTUBE

### A. Format 1: YouTube Shorts (Vertical 60s Video)

* **Target Length**: 55–60 seconds
* **Pacing**: ~140–160 WPM (Words Per Minute) fast delivery with heavy visual cuts.
* **CTA**: Owned Subscribe Button.

#### 🎬 Production Script & Visual Table
| Frame / Time | Voiceover Script (Bahasa Indonesia) | Visual Cue / Motion Graphic |
| :--- | :--- | :--- |
| **0:00 - 0:05** | *"Bitcoin udah sideways 2 bulan. Kalau support hancur, ini trik amankan porto kamu TANPA jual 1 koin pun!"* | **Hook Graphic**: TradingView BTC chart breaking support line + Text overlay: *"Amankan Porto Pas Crash!"* |
| **0:05 - 0:18** | *"Namanya Delta Neutral Hedging. Misal kamu pegang 1 BTC senilai $60,000 di Spot, lalu kamu buka posisi Short 1 BTC di Futures."* | **Split Screen Diagram**: Spot ($60k) [Green Box] vs Futures Short ($60k) [Red Box]. |
| **0:18 - 0:30** | *"Pas harga BTC anjlok ke $40,000, Spot kamu memang rugi -$20,000. Tapi posisi Short kamu cuan +$20,000. Hasilnya? Porto kamu tetap utuh $60,000."* | **Animated Math**: -$20,000 + $20,000 = $0 Loss. Balance counter locked at $60,000. |
| **0:30 - 0:42** | *"Kapan mulai Short? Tunggu daily candle tutup di bawah support kuat dengan volume tinggi. Ini yang bikin timbul self-fulfilling prophecy."* | **Chart Zoom**: Daily candle closing confirmation + volume spike indicator highlighted in yellow. |
| **0:42 - 0:52** | *"Dua aturan wajib: 1. Wajib leverage rendah (maksimal 1x–2x). 2. Gunakan Isolated Margin biar wallet utama kamu aman dari margin call."* | **Warning Badges**: `1. Leverage 1x-2x Max` \| `2. Isolated Margin Only`. |
| **0:52 - 1:00** | *"Kunci selamat di crypto itu pinter jaga modal pas bear market. Subscribe untuk strategi risk management crypto lainnya!"* | **Evergreen CTA**: Subscribe Button Animation + Profile Icon (`Silvester Ad Astra`). |

---

### B. Format 2: YouTube Long-Form / Video Essay (3–5 Minutes)

* **Target Length**: 3:30 – 5:00 minutes
* **Production Style**: Screen record (TradingView + Interface) + Talking head / Voiceover.
* **Title Idea**: *Cara Amankan Portofolio Crypto Saat Bitcoin Crash (Teknik Delta Neutral Hedging)*

#### 📽️ Structure & Script Outline

1. **Chapter 1: The Bear Market Survival Crisis (0:00 - 0:45)**
   * Market context: Sideways consolidation leading into potential breakdown.
   * Frame the core mistake: Retail traders either panic sell at the bottom or hold down -80%.
2. **Chapter 2: The Math of Delta Neutral Hedging (0:45 - 1:45)**
   * Deep dive into spot holding vs futures shorting.
   * On-screen calculation breakdown ($60k ➔ $40k drop scenario).
3. **Chapter 3: Timing the Hedge: Entry & Exit Rules (1:45 - 3:00)**
   * **Entry**: Daily candle close below major support + volume confirmation (Self-fulfilling prophecy concept).
   * **Exit**: Reaching next major support, volume drying up, and avoiding funding rate decay.
4. **Chapter 4: The 2 Golden Rules of Capital Preservation (3:00 - 4:00)**
   * Why >3x leverage turns a hedge into a gamble.
   * Isolated Margin vs Cross Margin (Wallet firewalling).
   * Monitoring funding rate.
5. **Chapter 5: Outro & Channel CTA (4:00 - 4:30)**
   * Reiterate: *Capital preservation in bear market = wealth in bull market.*
   * **CTA**: Subscribe to *Silvester Ad Astra*, like the video, and drop questions in comments.

---

### C. Format 3: YouTube Community Post (Text + Visual Card)

* **Target Format**: Community Feed Post with single image infographic or poll.

#### 📝 Text Copy Spec
```text
🚨 Bitcoin Sideways 2 Bulan Lebih: Jika Support Jebol, Ini Trik Amankan Portofolio!

Banyak investor crypto bingung saat market terancam crash: Mau jual rugi, atau pasrah porto minus 50%? 

Sebenarnya ada opsi ketiga: **Teknik Hedging (Delta Neutral)**.

📌 Cara Kerjanya:
Jika kamu pegang 1 BTC di Spot ($60k), buka posisi Short 1 BTC di Futures.
• Saat harga turun ke $40k: Spot kamu rugi -$20k, tapi Short kamu cuan +$20k.
• Hasilnya: Aset kamu tetap utuh $60k TANPA perlu jual koin spot sama sekali.

⚠️ 3 Aturan Wajib Buka Hedging:
1. Entry Timing: Tunggu Daily Candle tutup di bawah support kuat + volume tinggi.
2. Safe Leverage: Gunakan leverage RENDAH (1x - 2x max). Hedging = proteksi modal, bukan spekulasi.
3. Margin Safety: Selalu gunakan Isolated Margin agar wallet utama terpisah.

Kunci bertahan di crypto adalah pintar menjaga modal pas bear market. 

💬 Apakah kamu sudah pernah pakai strategi hedging ini? Tulis pengalaman kamu di kolom komentar!
```

---

## 🏛️ 4. Key Architectural Decisions & System Blueprint

### A. Input Medium & Trigger Workflow
* **Master Template**: [`_NEW_REPURPOSE_INPUT.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/_NEW_REPURPOSE_INPUT.md)
* **Trigger Mechanic**: 
  1. User populates input content and edits YAML property `status: draft` ➔ `status: ready`.
  2. Automated file watcher detects `status: ready`, processes the payload, and outputs complete multi-platform draft kits into `03-Ready/` folders.
  3. Post-execution hook **automatically spawns a fresh `_NEW_REPURPOSE_INPUT.md` template file** in the inbox.

---

### B. User-Controlled Sponsorship Matrix
Driven by frontmatter properties and an optional body section:

```yaml
existing_sponsor: yes # yes | no (Is there a sponsor in the source content?)
repurpose_sponsorship: no # yes | no (Should repurposed outputs promote a sponsor?)
target_language: id # id | en
```

| `existing_sponsor` | `repurpose_sponsorship` | Agent Processing Behavior |
| :---: | :---: | :--- |
| **`yes`** | **`no`** | **Purge & Sanitize**: Strips all existing client mentions, app links, and referral codes (`adastra`). Replaces with owned channel CTAs (`Silvester Ad Astra`). |
| **`yes`** | **`yes`** | **Adapt & Transition**: Retains/adapts sponsor messaging across new formats based on the *Sponsorship Brief* body section. |
| **`no`** | **`yes`** | **Inject Sponsor**: Embeds a new sponsor into organic content based on the *Sponsorship Brief* body section. |
| **`no`** | **`no`** | **Pure Organic**: Retains 100% educational flow with standard owned CTAs. |

---

### C. Production-Ready Quality Pillars
To ensure drafts require **<2 minutes of manual human editing**:

1. **Voice & Writing Enforcement**: Ingests [`x_style_guide.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/x_style_guide.md) as ground truth.
   * **Dynamic Prefix Stripping**: Stripping Indonesian verb prefixes (`me-`, `meng-`) to use root verbs (*kata dasar*) for a fast, punchy tone (e.g., *taruh*, *bangun*, *beli*).
   * **Language Control**: Enforces `id` (Indonesian blended with English tech/business terms, `aku/kamu/kita` pronouns) or `en` (English conversational business voice).
   * **Dry & Cynical Endings**: Concludes cleanly with context-specific dry observations or ironic questions.
2. **Hard Mechanical Constraints**:
   * **Shorts/TikTok**: 130–145 words max (~55s at 150 WPM speech rate), max 12 words per sentence.
   * **IG Carousels**: Fixed 7–8 slide budget, 1 concept per slide (max 25 words/slide).
   * **LinkedIn**: 1–2 sentences per block (whitespace formatting).
3. **High-Granularity Visual & Editing Cues**:
   * Every script line paired with unambiguous visual instructions (TradingView chart timeframe, indicator overlay, color hex codes, diagram layouts).

---

### D. Dynamic Angle Mutation & History Logger Engine

1. **Single-Run Uniqueness**: 
   * When generating a bundle (Shorts, Long-Form, IG, LinkedIn) for a single input, the prompt engine enforces distinct psychological angles across all formats so no two platform drafts share the same hook structure.
2. **Multi-Run History Logger (`topic_history_log.json`)**:
   * LLMs are stateless across separate API runs.
   * A persistent log file ([`Configuration/topic_history_log.json`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/topic_history_log.json)) tracks published angles over time.
   * Before generating new content, the script inspects the log and excludes recently used angles, enforcing a **7-to-14 day angle cooldown** to guarantee week-to-week freshness.
3. **Topic-Agnostic & Universal**:
   * All rules, prompt templates, and wireframes are 100% topic-agnostic, working seamlessly across **AI, Crypto, Macroeconomics, Tech, Solopreneurship, and Business**.

---
*Note: This file will be removed once the repurposing framework is fully tested and integrated into the automated Lulua/Shinku scripts.*


