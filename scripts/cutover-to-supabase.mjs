/**
 * Apply hosted Supabase URLs from .supabase-cloud.json (or env) to .env,
 * then migrate + seed + provision demo Clerk links.
 *
 * Usage:
 *   node scripts/cutover-to-supabase.mjs
 *
 * Or with explicit env:
 *   $env:DATABASE_URL="...pooled..."
 *   $env:DIRECT_URL="...direct..."
 *   node scripts/cutover-to-supabase.mjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const cloudPath = path.join(root, '.supabase-cloud.json');

function loadUrls() {
  if (process.env.DATABASE_URL && process.env.DIRECT_URL) {
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
    };
  }
  if (!fs.existsSync(cloudPath)) {
    console.error('Missing .supabase-cloud.json and DATABASE_URL/DIRECT_URL env.');
    console.error('Run: node scripts/create-supabase-cloud.mjs');
    process.exit(1);
  }
  const cloud = JSON.parse(fs.readFileSync(cloudPath, 'utf8'));
  return {
    DATABASE_URL: cloud.DATABASE_URL,
    DIRECT_URL: cloud.DIRECT_URL,
  };
}

function upsertEnv(file, updates) {
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}="${value.replace(/"/g, '\\"')}"`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(text)) text = text.replace(re, line);
    else text = `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(file, text.endsWith('\n') ? text : text + '\n');
}

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

async function main() {
  const urls = loadUrls();
  process.env.DATABASE_URL = urls.DATABASE_URL;
  process.env.DIRECT_URL = urls.DIRECT_URL;

  upsertEnv(path.join(root, '.env'), {
    DATABASE_URL: urls.DATABASE_URL,
    DIRECT_URL: urls.DIRECT_URL,
  });
  console.log('Updated .env with Supabase DATABASE_URL + DIRECT_URL');

  run('npx', ['prisma', 'generate']);
  run('npx', ['prisma', 'migrate', 'deploy']);
  run('npx', ['prisma', 'db', 'seed']);
  run('node', ['scripts/provision-demo-clerk.js']);
  run('node', ['scripts/verify-workspace-isolation.js']);

  console.log(`
=== CUTOVER COMPLETE ===

Netlify environment variables to set:

DATABASE_URL=${urls.DATABASE_URL}
DIRECT_URL=${urls.DIRECT_URL}

Plus existing Clerk keys (unchanged):
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
CRON_SECRET
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
