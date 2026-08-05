/**
 * Create a hosted Supabase project and print Prisma connection strings.
 *
 * Prerequisites:
 *   1. Create a personal access token: https://supabase.com/dashboard/account/tokens
 *   2. Set: $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 *   3. node scripts/create-supabase-cloud.mjs
 *
 * Optional:
 *   SUPABASE_ORG_ID, SUPABASE_DB_PASSWORD, SUPABASE_REGION (default: ap-southeast-1)
 */
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error(`
Missing SUPABASE_ACCESS_TOKEN.

1. Open https://supabase.com/dashboard/account/tokens
2. Generate a token
3. In PowerShell:
   $env:SUPABASE_ACCESS_TOKEN="sbp_your_token"
   node scripts/create-supabase-cloud.mjs
`);
  process.exit(1);
}

const API = 'https://api.supabase.com/v1';
const PROJECT_NAME = process.env.SUPABASE_PROJECT_NAME || 'gearvo';
const REGION = process.env.SUPABASE_REGION || 'ap-southeast-1';
const DB_PASSWORD =
  process.env.SUPABASE_DB_PASSWORD ||
  `Gv${Math.random().toString(36).slice(2)}${Date.now().toString(36)}!A1`;

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Supabase API ${res.status}: ${JSON.stringify(json)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function buildUrls(ref, password, region) {
  // Supabase pooler hosts vary by project; prefer dashboard URIs when available.
  // These are the standard post-2024 formats:
  const direct = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const pooled = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  const legacyDirect = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  return { direct, pooled, legacyDirect };
}

async function waitHealthy(ref) {
  for (let i = 0; i < 60; i++) {
    const p = await api(`/projects/${ref}`);
    const status = p.status || p.database?.status;
    console.log(`  status: ${status || JSON.stringify(p.status)}`);
    if (status === 'ACTIVE_HEALTHY' || status === 'ACTIVE') return p;
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error('Timed out waiting for project to become healthy');
}

async function main() {
  const orgs = await api('/organizations');
  if (!Array.isArray(orgs) || !orgs.length) {
    throw new Error('No Supabase organizations found for this token.');
  }
  const orgId = process.env.SUPABASE_ORG_ID || orgs[0].id;
  console.log(`Using org: ${orgs[0].name || orgId}`);

  const existing = await api('/projects');
  let project = Array.isArray(existing)
    ? existing.find((p) => p.name === PROJECT_NAME)
    : null;

  if (project) {
    console.log(`Project "${PROJECT_NAME}" already exists (${project.id}).`);
  } else {
    console.log(`Creating project "${PROJECT_NAME}" in ${REGION}...`);
    project = await api('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: PROJECT_NAME,
        organization_id: orgId,
        region: REGION,
        db_pass: DB_PASSWORD,
        plan: 'free',
      }),
    });
    console.log(`Created project id=${project.id} ref=${project.ref || project.id}`);
  }

  const ref = project.ref || project.id;
  console.log('Waiting for database to become healthy...');
  await waitHealthy(ref);

  // Fetch connection info if API exposes it
  let pooled = null;
  let direct = null;
  try {
    const keys = await api(`/projects/${ref}/api-keys`);
    console.log('API keys retrieved:', Array.isArray(keys) ? keys.map((k) => k.name) : 'ok');
  } catch {
    /* optional */
  }

  try {
    // Some accounts expose pooler config here
    const cfg = await api(`/projects/${ref}/config/database/pooler`);
    console.log('Pooler config:', JSON.stringify(cfg).slice(0, 200));
  } catch {
    /* optional */
  }

  const urls = buildUrls(ref, DB_PASSWORD, REGION);
  // Prefer legacy direct host for migrations (always works with sslmode=require)
  direct = `${urls.legacyDirect}?sslmode=require`;
  pooled = `${urls.pooled}&sslmode=require`;

  console.log(`
=== SUPABASE PROJECT READY ===
Project ref: ${ref}
Region:      ${REGION}
DB password: ${DB_PASSWORD}

Add to local .env AND Netlify:

DATABASE_URL="${pooled}"
DIRECT_URL="${direct}"

Then run:
  npx prisma migrate deploy
  npx prisma db seed
  node scripts/provision-demo-clerk.js

IMPORTANT: Store the DB password securely. It is shown once here if the project was just created.
If the project already existed, set SUPABASE_DB_PASSWORD to the known password and re-run.
`);

  // Write a local non-committed file for the agent to continue migration
  const fs = require('fs');
  const out = {
    ref,
    region: REGION,
    DATABASE_URL: pooled,
    DIRECT_URL: direct,
    DB_PASSWORD,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync('.supabase-cloud.json', JSON.stringify(out, null, 2));
  console.log('Wrote .supabase-cloud.json (gitignored) for local cutover.');
}

main().catch((e) => {
  console.error(e.body || e);
  process.exit(1);
});
