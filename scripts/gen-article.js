#!/usr/bin/env node
/**
 * gen-article.js
 * --------------------------------------------------------------------
 * Picks the next unwritten topic from content-roadmap.json, asks Claude
 * to write a 700–900 word SEO article, and saves it to /articles.
 *
 * Run locally: ANTHROPIC_API_KEY=sk-... npm run gen-article
 * Run in CI:   GitHub Actions secret ANTHROPIC_API_KEY (see weekly-content.yml)
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

// Model id is read from an env var so it can be rotated without a code change when
// Anthropic retires a model. Set repo variable ANTHROPIC_MODEL to override the default.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';
const ROADMAP_FILE = 'content-roadmap.json';
const ARTICLES_DIR = 'articles';

// Expose a step output so the CI workflow can skip inject/commit when nothing was written.
function setOutput(key, val) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${val}\n`);
}

function existingSlugs() {
  if (!fs.existsSync(ARTICLES_DIR)) return new Set();
  return new Set(
    fs.readdirSync(ARTICLES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/^\d+-/, '').replace(/\.md$/, ''))
  );
}

function nextNumber() {
  if (!fs.existsSync(ARTICLES_DIR)) return 1;
  const nums = fs.readdirSync(ARTICLES_DIR)
    .map(f => parseInt(f.match(/^(\d+)-/)?.[1] ?? '0', 10))
    .filter(n => !isNaN(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

const SYSTEM = `You are a sourdough expert and SEO writer. You write for home bakers — beginners and intermediates — who want concrete, useful information.

Tone: confident, direct, free of AI-cliche phrases ("in today's fast-paced world", "let's dive in", "elevate your baking"). Write like a baker, not a content marketer.

Style:
- Open with the problem or question. No throat-clearing.
- Specific numbers, temperatures, ratios, times — not vague advice.
- Acknowledge tradeoffs and edge cases. Don't oversimplify.
- Mention the on-page calculator naturally where it actually helps. Don't shoehorn.
- Use H2 (##) and H3 (###) generously to break up long sections — improves both readability and featured-snippet eligibility.
- Include a comparison table (markdown table) where the topic naturally has 3+ variants to compare.
- Include an FAQ section with 4–6 likely reader questions toward the end (## Common questions, then ### each question).
- End with concrete next steps the reader can take today.

Length: 1500–2000 words. Long enough to rank against established sourdough sites in 2026, short enough that every paragraph earns its place. No filler, no padding, no recap section.

Format: pure markdown, starting with the title as a # heading. No frontmatter, no metadata block.`;

// Retry transient Anthropic API failures (429 rate limit, 5xx, 529 overloaded) with
// exponential backoff so a single hiccup doesn't skip the whole week's article.
async function withRetry(fn, { tries = 4, baseMs = 2000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err && err.status;
      const transient = status === 429 || status === 500 || status === 502 || status === 503 || status === 529;
      if (attempt === tries || !transient) break;
      const wait = baseMs * 2 ** (attempt - 1);
      console.warn(`Claude API attempt ${attempt}/${tries} failed (status ${status}); retrying in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function main() {
  const roadmap = JSON.parse(fs.readFileSync(ROADMAP_FILE, 'utf8'));
  const written = existingSlugs();
  const next = roadmap.find(t => !written.has(t.slug));
  if (!next) {
    console.log('Roadmap exhausted. Add more topics to content-roadmap.json.');
    setOutput('created', 'false');
    return;
  }

  console.log(`Generating: ${next.title}`);
  const client = new Anthropic();
  const msg = await withRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Write the article: "${next.title}"

Target keyword: ${next.keyword}

Audience: home sourdough bakers
Goal: rank in Google for the target keyword and genuinely help readers.

Output the article as pure markdown, starting with # ${next.title}.`
    }]
  }));

  const content = msg.content.map(b => b.text || '').join('').trim();
  if (!content) throw new Error('Empty response from Claude');

  const num = String(nextNumber()).padStart(2, '0');
  const filename = `${num}-${next.slug}.md`;
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  // Atomic write: a crash mid-write must not leave a half-written .md that inject then ships.
  const finalPath = path.join(ARTICLES_DIR, filename);
  const tmpPath = `${finalPath}.tmp`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, finalPath);
  console.log(`✓ Wrote ${filename} (${content.length} chars)`);
  setOutput('created', 'true');
}

main().catch(e => { console.error(e); process.exit(1); });
