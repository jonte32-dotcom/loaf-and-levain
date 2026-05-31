// Edge middleware: blocks sensitive source paths BEFORE cache lookup.
// This overrides any stale Cloudflare edge cache from earlier deploys
// where private files were accidentally exposed.

const BLOCKED_PREFIXES = [
  '/pro-pdf/',
  '/email-sequence/',
  '/marketing/',
  '/scripts/',
  '/lead-magnet/',
  '/pinterest/',
  '/.github/',
  '/articles/'    // articles are inlined into the main HTML; raw .md not needed publicly
];

const BLOCKED_EXACT = [
  '/content-roadmap.json',
  '/package.json',
  '/package-lock.json',
  '/.gitignore',
  '/.deploy-trigger',
  '/config.local.json',
  // Paid / source assets that must NOT be free to download. They live in the repo
  // root, so under a root deploy (output dir '.') they would otherwise be public.
  '/Sourdough Schedule Pro.pdf',
  '/Sourdough-Cheat-Sheet.pdf',
  '/sourdough-pro-cover.jpg',
  // Gitignored data files — defence-in-depth in case gitignore ever fails under a root deploy.
  '/forms.json',
  '/form-detail.json',
  '/camp-detail.json',
  '/automation-detail.json'
];

const BLOCKED_SUFFIXES = ['.md'];

function isBlocked(pathname) {
  if (BLOCKED_EXACT.includes(pathname)) return true;
  for (const p of BLOCKED_PREFIXES) {
    if (pathname.startsWith(p)) return true;
  }
  // Block any .md outside the calculator
  for (const s of BLOCKED_SUFFIXES) {
    if (pathname.endsWith(s)) return true;
  }
  return false;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Decode so paths with spaces (e.g. "/Sourdough%20Schedule%20Pro.pdf") match BLOCKED_EXACT.
  let pathname = url.pathname;
  try { pathname = decodeURIComponent(pathname); } catch (e) { /* malformed escape — fall back to raw */ }
  if (isBlocked(pathname)) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=300',
        'x-blocked-by': 'edge-middleware'
      }
    });
  }
  return context.next();
}
