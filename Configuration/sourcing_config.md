---
type: Sourcing Config
status: active
last_updated: 2026-07-18
---

# ⚙️ Sourcing & Ideation Configuration

This file contains the seed lists and settings used by the automated Sourcing Agent to calculate niche-specific baselines and scan for trending "How-To" topics on YouTube and Reddit.

## 📺 YouTube Gold-Standard Competitors

| Niche | Channel Name | Target URL / Handle |
| :--- | :--- | :--- |
| **AI Dev** | Nate Herk | `https://www.youtube.com/@NateHerk` |
| **AI Dev** | Matthew Berman | `https://www.youtube.com/@MatthewBerman` |
| **AI Dev** | Miles Deutscher | `https://www.youtube.com/@MilesDeutscher` |
| **Crypto** | CoinGecko | `https://www.youtube.com/@CoinGecko` |
| **Crypto** | Jesse Eckel | `https://www.youtube.com/@JesseEckel` |
| **Crypto** | Altcoin Daily | `https://www.youtube.com/@AltcoinDaily` |

## 🗪 Reddit Target Subreddits

| Niche | Subreddit | Focus |
| :--- | :--- | :--- |
| **AI Dev** | `r/LocalLLaMA` | Open-source LLMs, local memory systems |
| **AI Dev** | `r/ArtificialInteligence` | Broad AI applications and guides |
| **Crypto** | `r/defi` | Decentralized finance, yields, arbitrage |
| **Crypto** | `r/cryptocurrency` | General market strategies and tutorials |

---
> [!NOTE]
> The Sourcing Agent reads this file at runtime to dynamically calculate median views and identify target subreddits.
