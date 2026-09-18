# Post queue

All hundred posts in the index below were published on 18 September 2026, with post dates spread at random across the two years before that (no post is dated earlier than the latest source it cites). The folder is kept for future queued posts; the workflow is unchanged.

Finished posts waiting to be published. Each file is a complete post in the same format as `content/posts/`
(front matter plus markdown, figures inline as SVG), so publishing one is a move, a date stamp, a build, and
a commit. Nothing in this folder is built or listed on the site until you move it.

## Publish one post

```bash
npm run publish -- <slug>            # moves it to content/posts/, dates it today, runs npm run build
npm start                            # optional: preview at http://localhost:8000/blog/<slug>/
git add -A && git commit -m "Publish: <title>" && git push
```

Options: `--date 2026-10-01` publishes with a specific date, `--keep-date` keeps the date already in the file,
`--no-build` skips the build. `npm run publish -- --list` shows what is still queued.

The `date` inside each queued file is a placeholder (the day it was written). The publish step replaces it,
so posts appear in the blog index, the RSS feed and the sitemap in the order you release them.

## Publish in a different order

The files are numbered in the index below only as a suggested order that spreads the topics out. Any order
works; the numbers are not part of the slug or the site.

## Before the first one

The figures rely on styles added to `src/site.css` (the `viz-*` classes and the `.prose figure` rules) and on
two small changes in `scripts/build-pages.mjs` (reading time ignores figure markup; the RSS feed replaces each
figure with a link to the post, because feed readers do not load the site's CSS). Commit those with, or
before, the first post from this queue. `assets/site.css` is already rebuilt.

## Editing a queued post

Edit the markdown as usual. Keep figures as single `<figure class="chart">` blocks with no blank lines inside,
keep every `id` unique within a post (`f1-`, `f2-`, ...), use only the `viz-*` classes for colour, and keep
captions honest: `Source:` with a link for real numbers, `Illustrative:` for a model or a thought experiment.
No em dashes or en dashes anywhere; the site's own deAIfy rules apply to this writing too.

## Index

One hundred posts, in the order they were planned. Publish in any order; each stands alone.

| # | File | Title | Tags | Area |
|---|------|-------|------|------|
| 1 | `treat-the-model-like-a-client.md` | Treat the model like a game client | Agents, Tool Use, Security | llm-engineering |
| 2 | `custom-crm-wrong-answer.md` | When a custom CRM is the wrong answer | CRM, Build Vs Buy, Contract Work | product-enterprise |
| 3 | `flash-loan-free-until-it-reverts.md` | The flash loan is free until it reverts | Flash Loans, Aave, MEV | web3-defi |
| 4 | `two-models-eval-cannot-tell-apart.md` | Two models your eval cannot tell apart | Evaluation, Statistics, Benchmarks | ml-foundations |
| 5 | `qr-ticket-bearer-token.md` | A QR ticket is a bearer token that walks | Security, QR Ticketing, System Design | security-crypto |
| 6 | `client-pays-for-the-research.md` | The client pays for the research | Founding, Consulting, Product Strategy | founder-impact |
| 7 | `idempotency-keys-pointed-other-way.md` | Idempotency keys pointed the other way | API Design, Idempotency, Security | backend-architecture |
| 8 | `student-workshop-actually-rewards.md` | What a student workshop actually rewards | Research, ACL, Writing | nlp-parsing-research |
| 9 | `kubernetes-is-a-payroll-decision.md` | Kubernetes is a payroll decision | Kubernetes, Small Teams, Operations | devops-cloud |
| 10 | `eight-apps-one-release-spine.md` | Eight apps and one release spine | Android, Release Engineering, Product Strategy | mobile-games |
| 11 | `wrong-answer-exchange-rate.md` | Every wrong answer has an exchange rate | Hallucination, Evaluation, Helpdesk | llm-engineering |
| 12 | `what-breaks-leaving-salesforce.md` | What breaks when you leave Salesforce | CRM Migration, Data Modelling, Salesforce | product-enterprise |
| 13 | `spread-that-survives-the-fees.md` | The spread that survives the fees | Arbitrage, Market Microstructure, Shayanomaly | web3-defi |
| 14 | `similarity-threshold-has-no-zero.md` | Your similarity threshold has no zero | Embeddings, Vector Search, RAG | ml-foundations |
| 15 | `what-hardware-backed-promises.md` | What hardware-backed actually promises | Android, Key Management, Hardware Security | security-crypto |
| 16 | `nutrition-has-no-app.md` | Nutrition has no app | Philanthropy, Nutrition, Education | founder-impact |
| 17 | `test-that-reads-another-tenant.md` | The test that reads another tenant's rows | PostgreSQL, Multi-tenant SaaS, Testing | backend-architecture |
| 18 | `cube-nobody-actually-pays.md` | The cube nobody actually pays | Parsing, Algorithms, NLP | nlp-parsing-research |
| 19 | `timeouts-run-in-two-directions.md` | Timeouts run in two directions | Reverse Proxies, Node.js, Reliability | devops-cloud |
| 20 | `engine-cannot-see-the-screen.md` | The engine cannot see the screen | Unity, Architecture, Testing | mobile-games |
| 21 | `user-reads-five-tokens-a-second.md` | The user reads at five tokens a second | Inference, Latency, LLM Serving | llm-engineering |
| 22 | `backflow-ratio-fake-stages.md` | The backflow ratio finds your fake stages | CRM, Sales Pipelines, Data Modelling | product-enterprise |
| 23 | `ticket-does-not-need-blockchain.md` | Your ticket does not need a blockchain | Architecture, Blockchain, Ticketing | web3-defi |
| 24 | `agreement-ceiling-not-a-ceiling.md` | The agreement ceiling is not a ceiling | Labelling, Data Quality, Statistics | ml-foundations |
| 25 | `aes-gcm-collision-horizon.md` | Every AES-GCM key has a collision horizon | Cryptography, AES-GCM, Android | security-crypto |
| 26 | `what-happens-when-you-stop.md` | What happens when you stop giving | Philanthropy, Founding, Children | founder-impact |
| 27 | `migration-tool-does-not-know-locks.md` | Your migration tool does not know about locks | PostgreSQL, Migrations, Prisma | backend-architecture |
| 28 | `parse-that-quietly-became-zero.md` | The parse that quietly became zero | Parsing, Numerical Methods, NLP | nlp-parsing-research |
| 29 | `autoscaling-buys-the-next-spike.md` | Autoscaling buys you the next spike | AWS, Autoscaling, Capacity | devops-cloud |
| 30 | `when-the-host-leaves-the-table.md` | When the host leaves the table | Multiplayer, Photon, Netcode | mobile-games |
| 31 | `the-last-passage-that-mattered.md` | The last passage that mattered | RAG, Retrieval, Latency | llm-engineering |
| 32 | `pipeline-cannot-replay-spreadsheet.md` | A pipeline you cannot replay is a spreadsheet | Data Modelling, CRM, Databases | product-enterprise |
| 33 | `amm-limit-order-cannot-cancel.md` | An AMM is a limit order you cannot cancel | AMM, DeFi, Market Making | web3-defi |
| 34 | `backtest-saw-the-next-tick.md` | Your backtest saw the next tick | Evaluation, Data Leakage, Time Series | ml-foundations |
| 35 | `secrets-have-a-half-life.md` | Secrets have a half-life | Secrets Management, CI/CD, Security | security-crypto |
| 36 | `price-the-outage-not-hour.md` | Price the outage, not the hour | Pricing, Consulting, Reliability | founder-impact |
| 37 | `postgres-counts-processes-not-requests.md` | Postgres counts processes, not requests | PostgreSQL, Serverless, Next.js | backend-architecture |
| 38 | `pumping-lemma-pigeonhole-trees.md` | The pumping lemma is pigeonhole on trees | Formal Languages, Proofs, NLP | nlp-parsing-research |
| 39 | `restore-time-only-backup-metric.md` | Restore time is the only backup metric | Disaster Recovery, Backups, Postmortems | devops-cloud |
| 40 | `one-percent-cannot-tell-you-much.md` | One percent of users cannot tell you much | Android, Staged Rollouts, Release Engineering | mobile-games |
| 41 | `citation-is-a-claim.md` | A citation is a claim about a passage | RAG, Grounding, Citations | llm-engineering |
| 42 | `page-for-two-readers.md` | Write the page for two readers | SEO, Static Sites, AI Crawlers | product-enterprise |
| 43 | `book-that-looks-alive.md` | A book that looks alive can be dead | WebSockets, Order Books, CCXT | web3-defi |
| 44 | `test-set-seen-before.md` | Your test set has been seen before | Data Pipelines, Evaluation, Deduplication | ml-foundations |
| 45 | `install-script-is-the-attack.md` | The install script is the attack | Supply Chain, Npm, Security | security-crypto |
| 46 | `the-keys-only-i-hold.md` | The keys only I hold | Founding, Security, Android | founder-impact |
| 47 | `there-are-two-gaps-not-one.md` | There are two gaps, not one | Event-Driven, PostgreSQL, Reliability | backend-architecture |
| 48 | `four-parsers-one-grammar.md` | Four parsers, one grammar, no winner | Parsing, Structured Output, Algorithms | nlp-parsing-research |
| 49 | `the-lockfile-your-pipeline-never-had.md` | The lockfile your pipeline never had | GitHub Actions, Supply Chain, CI/CD | devops-cloud |
| 50 | `text-never-leaves-the-phone.md` | The text never leaves the phone | Privacy, React Native, On-Device | mobile-games |
| 51 | `lora-adapter-poor-place-for-facts.md` | A LoRA adapter is a poor place for facts | Fine-Tuning, LoRA, RAG | llm-engineering |
| 52 | `fifth-custom-field-table.md` | The fifth custom field is a table | Data Modelling, CRM, PostgreSQL | product-enterprise |
| 53 | `epbs-removes-relay-not-builder.md` | Glamsterdam removes the relay, not the builder | MEV, Ethereum, Glamsterdam | web3-defi |
| 54 | `every-paper-load-bearing-number.md` | Every paper has one load-bearing number | Research, Reading Papers, Evaluation | ml-foundations |
| 55 | `what-survives-pg-dump.md` | What survives a pg_dump | PostgreSQL, Encryption, Threat Modelling | security-crypto |
| 56 | `phone-in-house-not-childs.md` | The phone in the house is not the child's | Digital Access, Education, Android | founder-impact |
| 57 | `capabilities-in-code-roles-in-rows.md` | Capabilities in code, roles in rows | RBAC, PostgreSQL, Multi-tenant SaaS | backend-architecture |
| 58 | `tokeniser-does-not-know-grammar.md` | The tokeniser does not know your grammar | Structured Output, Tokenisation, LLM Inference | nlp-parsing-research |
| 59 | `stale-is-a-feature.md` | Stale is a feature | CDN, Caching, Cloudflare | devops-cloud |
| 60 | `widget-is-a-photograph-of-your-app.md` | A widget is a photograph of your app | Android, Jetpack Glance, UX | mobile-games |
| 61 | `first-thing-quantised-model-forgets.md` | The first thing a quantised model forgets | Quantisation, Inference, Evaluation | llm-engineering |
| 62 | `ticket-promise-with-clock.md` | A ticket is a promise with a clock | Ticketing, Service Desk, State Machines | product-enterprise |
| 63 | `every-external-call-is-a-handover.md` | Every external call is a handover | Solidity, Security, Audits | web3-defi |
| 64 | `four-bits-enough-three-not.md` | Four bits are enough, three are not | Quantisation, Linear Algebra, Inference | ml-foundations |
| 65 | `stateless-tokens-kill-switch.md` | Stateless tokens still need a kill switch | Authentication, JWT, Security | security-crypto |
| 66 | `publish-the-denominator.md` | Publish the denominator | Philanthropy, Measurement, Evidence | founder-impact |
| 67 | `five-order-books-one-frame-budget.md` | Five order books, one frame budget | WebSockets, Realtime, Frontend Performance | backend-architecture |
| 68 | `schema-no-grammar-checks.md` | The part of your schema no grammar checks | Structured Output, JSON Schema, Validation | nlp-parsing-research |
| 69 | `drift-is-a-speed-problem.md` | Drift is a speed problem | Terraform, Infrastructure As Code, Cloud | devops-cloud |
| 70 | `app-with-no-server-no-outages.md` | An app with no server has no outages | Android, Offline-First, Product Strategy | mobile-games |
| 71 | `what-a-grammar-can-never-check.md` | What a grammar can never check | Structured Output, Formal Languages, Constrained Decoding | llm-engineering |
| 72 | `estimates-count-open-questions.md` | Estimates are a count of open questions | Contract Work, Estimation, Consulting | product-enterprise |
| 73 | `solana-caller-writes-argument-list.md` | On Solana the caller writes your argument list | Solana, Anchor, Security | web3-defi |
| 74 | `fine-tuning-taught-it-sound-sure.md` | Fine-tuning taught it to sound sure | Calibration, Fine-Tuning, Probability | ml-foundations |
| 75 | `key-never-assembled.md` | The key that is never assembled | Cryptography, MPC, Wallets | security-crypto |
| 76 | `which-language-your-ai-fails-in.md` | Which language your AI fails in | AI Policy, India, Evaluation | founder-impact |
| 77 | `two-dials-on-the-rate-limiter.md` | Two dials on the rate limiter | Rate Limiting, API Design, Multi-tenant SaaS | backend-architecture |
| 78 | `what-chomsky-normal-form-costs.md` | What Chomsky normal form costs you | Formal Languages, Parsing, Grammars | nlp-parsing-research |
| 79 | `kernel-shared-with-a-stranger.md` | The kernel you share with a stranger | Firecracker, Sandboxing, AI Agents | devops-cloud |
| 80 | `german-needs-a-third-more-room.md` | German needs a third more room | Localisation, Android, UX | mobile-games |
| 81 | `pay-for-context-every-turn.md` | You pay for the context every turn | Cost, Prompt Caching, RAG | llm-engineering |
| 82 | `counting-people-out.md` | Counting people out is the hard part | Ticketing, Analytics, Queueing | product-enterprise |
| 83 | `base-fee-six-blocks-to-double.md` | Base fee takes six blocks to double | Gas, Ethereum, Fee Markets | web3-defi |
| 84 | `number-grows-before-loss-spikes.md` | The number that grows before the loss spikes | Training Dynamics, Transformers, Numerics | ml-foundations |
| 85 | `escrow-bot-cannot-see-faces.md` | An escrow bot that cannot see faces | Telegram, Privacy, System Design | security-crypto |
| 86 | `what-the-letters-owe.md` | What the letters after my name owe | Fellowships, History, Philanthropy | founder-impact |
| 87 | `the-package-everyone-imports.md` | The package everyone imports | Turborepo, Monorepos, CI | backend-architecture |
| 88 | `chain-of-thought-memory-transformers-lack.md` | Chain of thought is the memory transformers lack | Transformers, Chain Of Thought, Formal Languages | nlp-parsing-research |
| 89 | `the-free-tier-is-a-lease.md` | The free tier is a lease | Oracle Cloud, Free Tier, LLM Serving | devops-cloud |
| 90 | `upload-key-is-disposable.md` | Your upload key is disposable | Android, Release Engineering, Post-Quantum | mobile-games |
| 91 | `judge-shares-blind-spots.md` | The judge shares the defendant's blind spots | Evaluation, LLM-as-Judge | llm-engineering |
| 92 | `one-shared-hour-canada.md` | One shared hour with Canada is enough | Remote Work, Contract Work, Time Zones | product-enterprise |
| 93 | `liquidation-race-funded-by-loser.md` | A liquidation is a race funded by the loser | Aave, DeFi, Liquidations | web3-defi |
| 94 | `pumping-lemma-model-test.md` | The pumping lemma as a model test | Formal Languages, Generalisation, Transformers | ml-foundations |
| 95 | `gap-between-signing-verifying.md` | The gap between signing and verifying | Security, Signing, Webhooks | security-crypto |
| 96 | `third-adult-in-classroom-app.md` | The third adult in every classroom app | Education, AI Tutors, Philanthropy | founder-impact |
| 97 | `queue-that-joins-your-transaction.md` | The queue that joins your transaction | PostgreSQL, Background Jobs, Redis | backend-architecture |
| 98 | `compound-pcfgs-leak-context.md` | Compound PCFGs leak context on purpose | Grammar Induction, PCFG, NLP | nlp-parsing-research |
| 99 | `price-of-leaving-not-your-problem.md` | The price of leaving is not your problem | Cloud Cost, Egress, EU Data Act | devops-cloud |
| 100 | `play-reads-your-manifest-first.md` | Play reads your manifest before your users do | Android, Google Play, Release Engineering | mobile-games |
