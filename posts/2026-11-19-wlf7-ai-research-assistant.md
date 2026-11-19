Next week I travel to Faridabad for the 7th World Landslide Forum, hosted by Amrita Vishwa Vidyapeetham from 22 to 27 November. On 24 November, in Session 1.1, I present something I have been building since March: an AI research assistant for landslide science, made with UNESCO's Disaster Risk Reduction Unit and the International Consortium on Landslides (ICL).

## The problem it tries to solve

The landslide community has produced a large, valuable body of peer-reviewed work. But the people who most need it, such as engineers, planners and disaster managers, rarely have time to search journals, and much of it is not in their language. Good evidence exists. It just does not reach the decision.

## What I built

The assistant indexes **202 peer-reviewed articles**, split into **more than 970 passages** that can be searched by meaning rather than by keyword. When someone asks a question, it finds the most relevant passages, writes an answer from them, and links every statement back to its source so it can be checked. It answers in **12 languages**.

Under the hood it is retrieval-augmented generation: vector embeddings for search, a language model for the answer, and a serverless deployment on Cloudflare Workers so that it stays fast and cheap to run.

## What I learned building it

- **Citations are the product.** Practitioners do not need a confident paragraph; they need to see where it came from.
- **Retrieval quality matters more than the model.** Most of my time went into how papers are split into passages and how passages are ranked.
- **Language is a real barrier.** Answering in the user's language changed who could use the tool.

<!-- EDIT: add one or two personal lines here, such as what surprised you, a question someone asked in testing, or what you want feedback on at the Forum. -->

## What comes next

The assistant is in live testing ahead of public release on the ICL website. If you are at the Forum, come to Session 1.1 on 24 November. If not, I will post the slides and a short demo here afterwards.

*Co-authors: Soichiro Yasukawa (UNESCO), Shinji Sassa (National Institute of Maritime, Port and Aviation Technology, and ICL) and Matjaž Mikoš (University of Ljubljana).*
