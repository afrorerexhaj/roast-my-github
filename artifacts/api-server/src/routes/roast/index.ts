import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";
import { GenerateRoastBody } from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

interface GitHubRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  description: string | null;
  fork: boolean;
  updated_at: string;
}

function buildPrompt(
  username: string,
  repos: GitHubRepo[],
  style: string
): string {
  const repoSummary = repos
    .slice(0, 15)
    .map(
      (r) =>
        `- ${r.name} (${r.language ?? "unknown language"}, ${r.stargazers_count} stars${r.description ? `, "${r.description}"` : ""}${r.fork ? ", forked" : ""})`
    )
    .join("\n");

  const styleInstructions: Record<string, string> = {
    normal:
      "Write a funny, sharp, witty roast in a casual conversational tone. Be playful and clever but not mean-spirited.",
    corporate:
      "Write the roast entirely in obnoxious corporate jargon and buzzwords. Use phrases like 'synergize', 'leverage', 'paradigm shift', 'circle back', 'move the needle', 'low-hanging fruit', etc. Make it sound like a passive-aggressive performance review.",
    pirate:
      "Write the roast entirely in pirate speak! Use 'Arr!', 'Shiver me timbers!', 'Blimey!', 'Davy Jones' locker', nautical metaphors, and pirate slang throughout. Make it dramatic and swashbuckling.",
    haiku:
      "Write the roast as a series of 3-5 haikus (5-7-5 syllable structure). Each haiku should roast a different aspect of their GitHub profile. Label each haiku with a title.",
  };

  return `You are a savage but funny code roaster. Roast the GitHub user "${username}" based on their public repositories below.

Style: ${styleInstructions[style] ?? styleInstructions.normal}

Their repositories:
${repoSummary}

Total public repos: ${repos.length}
Forked repos: ${repos.filter((r) => r.fork).length}

Write a roast that:
- References specific repos, languages, or patterns you notice
- Comments on things like: too many forks, abandoned projects, weird naming, lack of stars, obsessive use of one language, suspicious repo names, etc.
- Is funny and creative, not generic
- Is 2-4 paragraphs (or haiku format if haiku style)
- Do NOT use markdown headers, just plain text (or haiku format)
- Do NOT be racist, sexist, or genuinely hurtful — keep it about the code

Just write the roast, nothing else.`;
}

router.post("/roast", async (req, res): Promise<void> => {
  const parsed = GenerateRoastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, style } = parsed.data;

  // Fetch GitHub user
  const userRes = await fetch(`https://api.github.com/users/${username}`, {
    headers: { "User-Agent": "roast-my-github-app" },
  });

  if (userRes.status === 404) {
    res.status(404).json({ error: `GitHub user "${username}" not found.` });
    return;
  }

  if (!userRes.ok) {
    req.log.error({ status: userRes.status }, "GitHub API error fetching user");
    res.status(500).json({ error: "Failed to fetch GitHub user data." });
    return;
  }

  const userData = (await userRes.json()) as {
    avatar_url: string;
    public_repos: number;
  };

  // Fetch repos
  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers: { "User-Agent": "roast-my-github-app" } }
  );

  if (!reposRes.ok) {
    req.log.error({ status: reposRes.status }, "GitHub API error fetching repos");
    res.status(500).json({ error: "Failed to fetch GitHub repositories." });
    return;
  }

  const repos = (await reposRes.json()) as GitHubRepo[];

  if (!Array.isArray(repos) || repos.length === 0) {
    res.status(422).json({
      error: `"${username}" has no public repositories to roast!`,
    });
    return;
  }

  const topRepos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      language: r.language,
      stars: r.stargazers_count,
      description: r.description,
    }));

  const prompt = buildPrompt(username, repos, style);

  req.log.info({ username, style }, "Generating roast");

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const roastText = response.text ?? "No roast generated.";

  res.json({
    roast: roastText,
    username,
    avatarUrl: userData.avatar_url,
    repoCount: userData.public_repos,
    topRepos,
  });
});

export default router;
