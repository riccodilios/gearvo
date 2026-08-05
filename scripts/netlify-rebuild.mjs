const token = process.env.NETLIFY_AUTH_TOKEN;
const site = 'e4f0633d-7a37-4615-a8f3-d2ae6988eec5';
if (!token) {
  console.error('NETLIFY_AUTH_TOKEN required');
  process.exit(1);
}

const cmd = process.argv[2] || 'node -e "console.log(JSON.stringify({hasDb:!!process.env.DATABASE_URL,hasDirect:!!process.env.DIRECT_URL}))"';

async function main() {
  const body = { build_settings: { cmd, dir: '' } };
  const u = await fetch(`https://api.netlify.com/api/v1/sites/${site}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  console.log('site update', u.status);

  const res = await fetch(`https://api.netlify.com/api/v1/sites/${site}/builds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clear_cache: true }),
  });
  const b = await res.json();
  console.log('deploy', b.deploy_id);
  const id = b.deploy_id;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const d = await (
      await fetch(`https://api.netlify.com/api/v1/deploys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
    console.log(i, d.state, d.error_message || '');
    if (['ready', 'error', 'broken'].includes(d.state)) {
      console.log('DONE', d.state, d.ssl_url || '');
      process.exit(d.state === 'ready' ? 0 : 1);
    }
  }
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
