# Roast My GitHub 🔥

An AI-powered web app that generates brutally funny roasts of any GitHub user's public repositories. Enter a username, pick a roast style, and watch Gemini AI tear apart years of questionable coding decisions.

**Live demo:** [git-hub-roast-master--rexhajafrore02.replit.app](https://git-hub-roast-master--rexhajafrore02.replit.app/)

[![Deploy on Replit](https://img.shields.io/badge/Deploy%20on-Replit-F26207?style=for-the-badge&logo=replit&logoColor=white)](https://replit.com/new/github/afrorerexhaj/roast-my-github)

---

## What It Does

1. User enters a GitHub username
2. The app fetches their public repositories via the GitHub API
3. Gemini AI reads the repo names, languages, star counts, descriptions, and fork status
4. It generates a personalised roast in one of four styles:
   - **Normal** — sharp, witty, conversational
   - **Corporate Jargon** — passive-aggressive performance review speak
   - **Pirate** — arr, shiver me timbers, nautical humiliation
   - **Haiku** — 5-7-5 syllable roasting, one repo at a time

Results include the user's avatar, repo count, the roast itself, and a "Prime Offenders" grid of their top repositories by stars.

---

## Tech Stack

- **Frontend:** React + Vite + TypeScript, shadcn/ui, Tailwind CSS, Framer Motion
- **Backend:** Express 5 + TypeScript, Node.js 24
- **AI:** Google Gemini 2.5 Flash via `@google/genai`
- **Data source:** GitHub public REST API (no auth required)
- **Monorepo:** pnpm workspaces with shared OpenAPI contract, Orval codegen
- **Fonts:** Space Grotesk + JetBrains Mono

---

## Forking on Replit

1. Click **Fork** on the Replit project page
2. Open the **Secrets** tab (lock icon in the sidebar)
3. Add a secret: `GEMINI_API_KEY` → your key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free)
4. The workflows start automatically — the app will be live in the preview pane within ~30 seconds

That's it. No database, no extra config, no `.env` files needed.

To publish your fork, click **Publish** in the top-right corner and add your own `GEMINI_API_KEY` to the deployment secrets when prompted.

---

## Running Locally

### Prerequisites

- Node.js 24+
- pnpm 10+
- A [Gemini API key](https://aistudio.google.com/apikey) (free)

### Setup

```bash
git clone https://github.com/yourusername/roast-my-github
cd roast-my-github
pnpm install
```

Create a `.env` file in `artifacts/api-server/`:

```env
GEMINI_API_KEY=your_key_here
PORT=8080
NODE_ENV=development
```

### Run

```bash
# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# In a separate terminal, start the frontend (port 5173)
pnpm --filter @workspace/roast-my-github run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Other useful commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API hooks and Zod schemas from the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## The Prompt

The AI prompt is constructed server-side in `artifacts/api-server/src/routes/roast/index.ts`. It includes:

- The GitHub username
- A list of up to 15 repos with name, language, star count, description, and whether it's a fork
- Total repo count and fork count
- Style-specific instructions injected per roast type

Here is an abbreviated version of the prompt template:

```
You are a savage but funny code roaster. Roast the GitHub user "${username}" based on their public repositories.

Style: [style-specific instructions]

Their repositories:
- repo-name (language, N stars, "description", [forked])
...

Write a roast that:
- References specific repos, languages, or patterns you notice
- Comments on things like: too many forks, abandoned projects, weird naming, lack of stars, obsessive use of one language
- Is funny and creative, not generic
- Is 2-4 paragraphs (or haiku format if haiku style)
- Is not racist, sexist, or genuinely hurtful — keep it about the code
```

Style instructions per mode:

| Style | Instruction |
|---|---|
| Normal | Sharp, witty, casual conversational tone |
| Corporate | Obnoxious buzzwords — "synergize", "low-hanging fruit", passive-aggressive perf review |
| Pirate | Full pirate speak — "Arr!", "Shiver me timbers!", nautical metaphors throughout |
| Haiku | 3–5 haikus in 5-7-5 structure, each roasting a different aspect, each with a title |

---

## Prompts Used

This app was built using [Replit Agent](https://replit.com/agent). Below are the exact prompts and fixes applied during the session.

**Prompt 1 — Initial build:**

> Build a "Roast My GitHub" web app. The user enters a GitHub username, the app fetches their public repos using the GitHub API, then generates a funny roast based on their repos using the Gemini API (gemini-1.5-flash model). Include roast style options: Normal, Corporate Jargon, Pirate, and Haiku. Show a loading state while fetching. Handle errors gracefully (user not found, private profile, etc). Make the UI dark themed and fun looking.

**Fix 1 — Gemini model not found:**

After the initial build, the `gemini-1.5-flash` model returned a 404 from the API (`models/gemini-1.5-flash is not found for API version v1beta`). Updated the model in `artifacts/api-server/src/routes/roast/index.ts` to `gemini-2.5-flash`, which is the current supported version.

**Fix 2 — "Failed to generate roast" error in production:**

The deployed app showed a generic "Failed to generate roast" error for all API failures (user not found, no public repos, etc). Root cause: the frontend error handler read `error?.response?.data?.error`, but the generated API client (`ApiError` class in `custom-fetch.ts`) stores the parsed response body at `error.data`, not `error.response.data` — `error.response` is the raw `Response` object. Fixed by changing the error path to `error?.data?.error || error?.message`.

**Prompt 2 — UI tweaks:**

> Remove the subtitle text "Brutal, AI-generated reality checks for your public repositories." from the homepage completely. And beside "torvalds" write only "name".

Removed the subtitle `<motion.p>` element entirely and changed the username input placeholder from `"torvalds"` to `"name"`.

---

## What I'd Do With More Time

**Better GitHub data.** The current implementation only uses repo names, languages, star counts, and descriptions. With more time I'd pull in commit frequency, language breakdown percentages, longest streak without a commit, README quality score, and issue/PR activity — the more data, the more personalised and savage the roast.

**Rate limiting and caching.** Right now every request hits both the GitHub API and Gemini with no throttling. I'd add Redis-backed caching (same username + style = cached roast for 10 minutes) and rate limiting per IP to prevent abuse and runaway API costs.

**Shareable roast cards.** Generate an OG image (avatar + roast excerpt) that users can share to Twitter/X or copy as a link. `@vercel/og` or Puppeteer could render a styled card server-side.

**GitHub OAuth.** Let users sign in with GitHub so the app can access slightly more data (e.g. private repo count, contribution graph) for a richer roast, while still only ever roasting public information.

**Streaming output.** Switch Gemini from `generateContent` to `generateContentStream` so the roast text types out word by word instead of appearing all at once — much more dramatic and satisfying.

**Roast leaderboard.** Store generated roasts in a database and let users upvote their favourites. Show a public feed of the most-roasted repos and the most brutal roasts of the week.

**More styles.** Shakespearean English, Gen Z slang, formal academic paper abstract, motivational speaker, legal cease-and-desist — the style system is already designed to be extensible.

---

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/routes/roast/index.ts   # Core roast logic
│   └── roast-my-github/     # React + Vite frontend
│       └── src/pages/home.tsx
├── lib/
│   ├── api-spec/            # OpenAPI contract (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   └── api-zod/             # Generated Zod validation schemas
└── pnpm-workspace.yaml
```

---

## License

MIT
