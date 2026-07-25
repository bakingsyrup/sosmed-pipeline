# AI Glossary (English)

This file contains the living database of AI technical terms and frameworks in English.

---

## ** Open-Weight Model

**What it is?**
** Open-Weight Model is a type of AI model where the trained parameters (the “weights”) are released publicly, allowing anyone to download, host, fine-tune, and run the model on their own servers without needing to rely on a centralized API provider.

**Why it is important?**
It democratizes access to powerful AI, letting startups, researchers, and even hobbyists avoid expensive per-request fees and data privacy risks. A major open-weight release like Kimi K3 can instantly shift market power, because it proves that cutting-edge performance no longer requires exclusive access to the most advanced chips or a subscription to a proprietary API.

**Explain like I'm 10**
Think of a restaurant that gives away its secret recipe for free. Now anyone can cook that exact meal at home, tweak the spiciness, and even open their own food stall using the same recipe—no need to pay the restaurant or even visit it.

**Example / Study Case**
Moonshot AI’s Kimi K3: a 2.8-trillion-parameter open-weight model that matched frontier US models. Its public release triggered a massive sell-off in semiconductor stocks because investors realized efficient, publicly-available AI could undercut the brute-force hardware thesis.

<!-- Date: 2026-07-19 -->

---

## ** Proprietary Model

**What it is?**
** Proprietary Model is a “closed” AI system where the model architecture, training data, and final weights are kept secret by the provider. The only way to use it is through a controlled API or subscription, with no ability to inspect or modify the underlying model.

**Why it is important?**
It protects the provider’s intellectual property and creates a recurring revenue moat. However, it also locks users into a single ecosystem and can stifle competition. When a powerful open-weight alternative appears, proprietary models risk losing their pricing power and developer mindshare.

**Explain like I'm 10**
Imagine a restaurant that only serves their secret dish inside their own dining room. You can only eat it by going there and paying whatever price they set, and you never get to see the recipe—so you can never cook it at home or improve it yourself.

**Example / Study Case**
Models like GPT-5.6 (or earlier versions) are typically proprietary. Developers pay per token to use them via API, and cannot run the model locally. The Kimi K3 shock directly challenged this model, forcing enterprises to reconsider whether they need to remain locked into expensive, closed systems when an open-weight alternative exists.

<!-- Date: 2026-07-19 -->

---

## Clinical-grade AI

**What it is?**
Clinical-grade AI is an artificial intelligence model that has been tested, validated, and cleared by a regulator like the FDA for real use in diagnosing, treating, or managing patient care. It is not a demo or a research prototype; it is legally allowed to assist in medical decisions because it meets strict safety benchmarks.

**Why it is important?**
Without clinical-grade validation, any AI tool remains a liability in a hospital. This standard determines which algorithms get integrated into radiology workflows, clinical note systems, and treatment planning. It is the gatekeeper that separates a Silicon Valley toy from a tool a doctor can trust with our lungs, bloodwork, or heart scans.

**Explain like I’m 10**
Imagine you have a super-smart friend who’s really good at spotting broken bones in X-ray pictures. You wouldn’t let that friend actually sign the medical report unless a real teacher (the FDA) tested them and gave them a license. Clinical-grade AI is that licensed friend—it still needs a grown-up doctor watching, but it’s officially allowed to help.

**Example / Study Case**
An AI model that analyzes CT scans for pulmonary embolism must run through a FDA 510(k) clearance process before a hospital can use it. Once cleared, radiologists can rely on it to flag potential clots, but they still need to confirm—this shifts the workflow from searching to verifying.

<!-- Date: 2026-07-23 -->

---

## Human-in-the-loop (HITL)

**What it is?**
Human-in-the-loop (HITL) is a governance framework where an AI produces a recommendation or prediction, but a human expert must review and approve that output before any final action is taken. It is a mandatory checkpoint designed to catch errors, biases, or dangerous edge cases the model was not trained on.

**Why it is important?**
AI models fail in unpredictable ways, especially when they encounter rare diseases or messy real-world data. HITL is what prevents an automated misdiagnosis from reaching a patient. It also gives regulators and liability insurers a clear audit trail: every automated decision was consciously verified by a licensed clinician.

**Explain like I’m 10**
Think of a self-driving car that always asks you to keep your hands on the wheel. The car can steer and brake, but if it gets confused by a weird intersection, you’re there to take over. The AI does the heavy lifting, but you’re the final boss who keeps everyone safe.

**Example / Study Case**
When an AI-powered triage tool in the ER suggests a patient be sent home, a nurse or physician must review the vital signs and the AI’s reasoning before discharge. If the model missed a subtle symptom, the human catches it—this loop keeps the hospital legally protected and the patient alive.

<!-- Date: 2026-07-23 -->
