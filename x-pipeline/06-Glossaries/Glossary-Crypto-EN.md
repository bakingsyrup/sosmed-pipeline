# Crypto Glossary (English)

This file contains the living database of Crypto technical terms and frameworks in English.

---

## Consensus Rules

**What it is?**
Consensus Rules are the fundamental, non-negotiable programmatic laws that all nodes in a blockchain network must follow to agree on a single, valid ledger. They define what makes a transaction or block valid — like block size limits, signature verification, and coin supply.

**Why it is important?**
Consensus rules are the constitution of a blockchain. They prevent central authorities from manipulating the ledger and ensure every participant — from a small retail node to a giant mining pool — operates under the same objective standards. Without them, there is no decentralized money, because anyone could create fake coins or alter history. Changing these rules, even through a soft fork, is an extremely delicate governance decision because it shifts the boundaries of what the network considers "valid."

**Explain like I'm 10**
Think of a board game like Monopoly. Everyone agrees on the rulebook before playing: you collect $200 when you pass Go, you go to jail on specific rolls. Those rules are the consensus rules. If you try to change "jail" to mean "get an extra turn" in the middle of the game, the other players will refuse to continue because you broke the foundational agreement. To change the rule, everyone must agree first. Bitcoin's consensus rules are that rulebook — and they're the only thing keeping the money real.

**Example / Study Case**
Bitcoin's hard cap of 21 million coins is a consensus rule. Every node checks that no block creates more than the allowed subsidy. If a miner tried to give themselves 100 extra Bitcoin, every full node would automatically reject the block, because it violates the supply rule. This strict, pre-agreed math is what gives Bitcoin its scarcity and trust.

<!-- Date: 2026-07-19 -->

---

## Ecosystem Bootstrapping

**What it is?**
Ecosystem Bootstrapping is the process of incentivizing developers and users to join a new blockchain network through grants, subsidies, or accelerator support to reach critical mass. 

**Why it is important?**
When a new network launches, it is essentially a ghost town. The protocol has to spend heavy capital to attract builders to its ecosystem. It gives out free money, pays for security audits, and provides market-making liquidity so startups can launch their products easily.

**Explain like I'm 10**
Imagine opening a brand new mall. The mall owner gives free rent to big anchor brands for the first year just so regular shoppers start coming in.

**Example / Study Case**
MegaETH funded 20 startups and paid for their security audits to kickstart its network activity.

---

## Liquidity Squeeze

**What it is?**
Liquidity Squeeze is a market condition where available asset supply on exchanges dries up rapidly.

**Why it is important?**
It makes the order book thin, meaning even small buy orders can cause massive price spikes. We must monitor this because if we trade on leverage, wild volatility can easily wipe out our accounts.

**Explain like I'm 10**
Imagine going to a market to buy apples, but a huge restaurant chain just bought 90% of the apples. The remaining sellers will immediately jack up the price for the few apples left.

**Example / Study Case**
Abraxas Capital withdraws 45,996 ETH from Binance, leaving the exchange with fewer tokens to facilitate daily retail trades.

<!-- Date: 2026-07-17 -->

---

## Soft Fork

**What it is?**
Soft Fork is a backward-compatible upgrade to a blockchain protocol, where nodes that do not upgrade can still validate new blocks and transactions, even if they don't use the new features.

**Why it is important?**
Soft forks are the least disruptive way to update a blockchain. They allow the network to evolve without forcing every participant to upgrade immediately, preventing a chain split. However, a soft fork can also introduce new consensus rules that restrict certain previously valid transactions, which is exactly what BIP 110 proposes — making it a governance tool, not just a technical one.

**Explain like I'm 10**
Imagine a club where all kids must wear a red shirt. Everyone knows the rule. Now the club leader says: from next week, no one wearing a blue cap is allowed. Kids already inside with blue caps can stay, but new ones with blue caps can't enter. The old kids still understand the red shirt rule, but there's now an additional restriction. That's a soft fork: old members still follow the game, but new rules quietly change what's acceptable.

**Example / Study Case**
SegWit (Segregated Witness) was a soft fork activated on Bitcoin in 2017. It changed how transaction data was structured, allowing more transactions per block. Nodes that didn't upgrade could still validate blocks, but they couldn't verify the new 'witness' data. This made Bitcoin more scalable without splitting the chain.

<!-- Date: 2026-07-19 -->

---

## Staking

**What it is?**
Staking is locking up cryptocurrency in a blockchain’s proof-of-stake mechanism to help validate transactions, secure the network, and earn rewards.

**Why it is important?**
It transforms idle assets into yield-generating instruments, turning HODL strategies into income-producing ones. It also removes liquid supply from exchanges, which can amplify price volatility during sudden demand shifts.

**Explain like I'm 10**
Imagine you give your bike to a bike-sharing fleet and in return they pay you a small rental fee every day. The bike can’t be used by you while it’s in the fleet, but you’re earning money just for holding it.

**Example / Study Case**
Bitmine stakes 85% of its 5.77 million ETH holdings, making that supply unavailable for immediate sale and deepening the liquidity squeeze.

<!-- Date: 2026-07-21 -->

---

## Value Capture

**What it is?**
Value Capture is the ability of a protocol or business model to retain a portion of the economic value generated by its users or applications. 

**Why it is important?**
Without it, a protocol operates like a charity. It pays for initial growth but gets absolutely nothing back when the projects succeed. The protocol must enforce a mechanism, like transaction fees, token burns, or equity ownership, to sustain its own treasury.

**Explain like I'm 10**
Once the mall is packed with shoppers, the owner must start charging rent and parking fees to make an actual profit.

**Example / Study Case**
Because MegaETH failed to capture value from its incubated startups, it shifted toward building its own first-party apps to keep revenue in-house.
