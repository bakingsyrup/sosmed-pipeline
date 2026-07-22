---
type: Video Sourcing Config
status: active
last_updated: 2026-07-22
---

# ⚙️ Video News Sourcing & Baseline Configuration

This file contains the baseline gold-standard channels and subreddits used by `mode: auto` to calculate median popularity baselines and detect 2x-5x trending outlier news topics across YouTube and Reddit.

## 📺 YouTube Baseline Competitor Anchors

| Niche | Channel Name | Target URL / Handle |
| :--- | :--- | :--- |
| **Macro** | Andrei Jikh | `https://www.youtube.com/@AndreiJikh` |
| **Macro** | ColdFusion | `https://www.youtube.com/@ColdFusion` |
| **Macro** | Sean Foo | `https://www.youtube.com/@SeanFooGold` |
| **Crypto** | Coin Bureau | `https://www.youtube.com/@CoinBureau` |
| **Crypto** | Altcoin Daily | `https://www.youtube.com/@AltcoinDaily` |
| **Crypto** | Paul Barron Network | `https://www.youtube.com/@PaulBarronNetwork` |
| **AI** | AI Revolution | `https://www.youtube.com/@airevolutionx` |

## 🗪 Reddit Target Subreddits

| Niche | Subreddit | Focus |
| :--- | :--- | :--- |
| **Macro** | `r/Economics` | Global macro trend analysis & fiscal updates |
| **Macro** | `r/WallStreetBets` | Retail market sentiment & macro trade plays |
| **Macro** | `r/Macroeconomics` | Structural inflation & central bank policy |
| **Crypto** | `r/cryptocurrency` | General market news & major crypto catalysts |
| **Crypto** | `r/defi` | Decentralized yields, protocol updates, exploits |
| **AI** | `r/LocalLLaMA` | Open-source AI models & local hardware news |
| **AI** | `r/Singularity` | AGI progress, frontier models & tech breakthroughs |
| **AI** | `r/ArtificialInteligence` | Enterprise AI adoption & hardware industry news |

---
> [!NOTE]
> The Video Agent reads this file at runtime during `mode: auto` to calculate popularity baselines and discover top trending news topics.
