# PathFinder — Digital Career Guidance Platform

PathFinder is a free, mobile-first Progressive Web App (PWA) built for students aged 14–25 (especially first-generation learners on mid-range phones and low-bandwidth connections). In under 15 minutes and with no counsellor or upfront signup required, a student receives:

- **Conversational Profile & Under-18 Safety Check** (1 question per screen, progress bar, skip support)
- **Transparent 24-Question RIASEC Assessment** (plain-language scoring with zero pseudo-scientific claims)
- **Top 5–8 Ranked Career Matches** grounded in 42 verified careers across 8 sectors with fit breakdowns, localized pay ranges (`Global`, `India`, `US`), trade-offs, and `Source` / `Last updated` attribution
- **Prioritized Skill Gap Analysis** (`Learn Now` / `Learn Next` / `Learn Later`) linked to 35 vetted free/low-cost resources
- **Phased 30-Day / 6-Month / 2-Year Roadmap & Progress Tracker** (checklist, daily streak, reminders, offline PWA support, post-use helpfulness rating)
- **Education Pathways & Side-by-Side Career Compare** (degrees, entrance exams, scholarships, plus vocational diplomas, apprenticeships, and free online routes ordered first for tight budgets)
- **Grounded, Safety-Guarded AI Career Mentor** (server-side Gemini `gemini-4-hydrogen`, prompt-injection fencing, pre-LLM crisis/self-harm helpline routing)
- **Shareable Parent / Teacher / Counsellor Summary** (printable PDF view + read-only shareable link excluding private chat logs) & **One-Click Privacy Export / Delete**

---

## Quick Setup & Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
To jump straight into a populated demo student workspace for inspection, open `http://localhost:3000/?autostart=1`.

### Build & Production Start

```bash
npm run build
npm start
```

### Run Unit Tests & 12-Persona Fairness Evaluation Suite

```bash
npm test
```

---

## Environment Variables

See `.env.example`:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Optional (Recommended) | Server-side Gemini API key for personalized career explanations and AI Mentor chat. If unset or unreachable, PathFinder automatically falls back to deterministic matching and dataset-grounded answers. Never exposed to the browser. |
| `APP_URL` | Optional | Public URL used for shareable parent/counsellor links. |
| `PATHFINDER_DEFAULT_REGION` | Optional | Default region preset (`global`, `in`, or `us`). Defaults to `global`. |
| `PATHFINDER_DB_PATH` | Optional | Local SQLite database file path. Defaults to `./data/pathfinder.sqlite`. |

---

## Data Update Guide (For Counsellors & Non-Developers)

All career facts and free learning resources live in two plain JSON files—no application code changes are needed to update salaries, add careers, or refresh links:

1. **`data/resources.json`** — Add or edit free/low-cost courses, portals, and scholarship guides. Each entry needs a unique `id`, `title`, `provider`, `url` (`https://`), `cost`, `duration`, `skills_covered`, `source`, and `last_verified` (`YYYY-MM-DD`).
2. **`data/careers.json`** — Add or edit careers across sectors (`Technology`, `Healthcare`, `Skilled Trades`, `Creative & Media`, `Public Service & Education`, `Business & Finance`, `Agriculture & Food`, `Green Jobs & Energy`).
   - Update `salary_by_region` (`global`, `in`, `us`) whenever labor bureau reports update.
   - Update `education_routes` to keep local entrance exams, apprenticeships, and scholarship names current.
   - Always update `source` and `last_verified` so students and parents see when data was last checked.
3. Run `npm test` after editing JSON files to automatically validate that every `resource_id`, `related_career`, date format, and schema rule passes cleanly.

---

## Success Metrics Instrumented (PII-Free)

All events are logged to SQLite (`analytics_events`) with one-way SHA-256 hashed anonymous session IDs and zero personal data:

- `onboarding_started` & `onboarding_completed` → Onboarding completion rate
- `quiz_completed` & `roadmap_generated` → Roadmap generation rate
- `return_visit` → 7-day return rate
- `roadmap_step_completed` → % of users who complete at least one roadmap step
- `helpfulness_rated` → Post-use *"Did this roadmap help you decide?"* rating
- `share_created` → Parent/counsellor summary shares

Query aggregated counts anytime at `GET /api/metrics/summary`.

---

## Known Limitations

- **Regional Salary & Exam Coverage**: Entry salary ranges and exam pathways currently ship with `Global (USD)`, `India (INR)`, and `United States (USD)` presets; hyper-local city or district variations must be verified with a local counsellor or official government portal.
- **Multilingual Coverage**: The interface ships in English with a Hindi (`hi`) scaffold and multilingual AI Mentor responses, while individual career descriptions in `data/careers.json` remain English-first until regional translators localize the JSON catalog.
- **SQLite MVP Storage**: Optional cross-device sync accounts, shareable snapshots, and PII-free metrics persist in a single-node SQLite database (`node:sqlite`); high-traffic multi-instance deployments should swap `src/server/db.ts` to PostgreSQL using the same parameterized schema.
- **Offline AI Mentor**: Saved roadmaps, skill gaps, career comparisons, and deterministic matching work fully offline via the PWA service worker, while live AI Mentor chat requires an active connection (falling back to dataset-only answers if the AI service is unreachable).
- **No Automated Guarantees**: Fit scores reflect transparent interest + skill + constraint overlap, not admission or job-placement guarantees.

---

## Suggested P2 Next Steps & Impact Measurement

- **P2 Features**: Resume & starter-portfolio builder tailored to each career's starter project, low-bandwidth audio/text mock-interview practice, and a vetted alumni/mentor Q&A directory partnered with local colleges and NGOs.
- **Measuring Real-World Impact**: Partner with 2–3 under-resourced schools for a 60-day pilot tracking (1) % of students completing at least 3 roadmap steps, (2) reduction in students dropping out of mismatched courses after reviewing trade-offs, (3) parent engagement via shared summary links, and (4) 6-month follow-up on scholarship, apprenticeship, or vocational enrollments.
