/**
 * Provision real Clerk users for the Al-Noor demo company and link them in Prisma.
 * Usage: node scripts/provision-demo-clerk.js
 */
const { PrismaClient } = require('@prisma/client');
const { loadEnv } = require('./load-env');

const env = loadEnv();
const secret = env.CLERK_SECRET_KEY;
if (!secret) {
  console.error('CLERK_SECRET_KEY missing in .env');
  process.exit(1);
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'GearvoDemo2026!';

const ACCOUNTS = [
  {
    prismaClerkId: 'dev_clerk_owner',
    email: 'demo.owner@gearvo.app',
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    roleLabel: 'Company Owner (platform admin)',
  },
  {
    prismaClerkId: 'dev_clerk_manager',
    email: 'demo.manager@gearvo.app',
    firstName: 'Sara',
    lastName: 'Al-Harbi',
    roleLabel: 'Branch Manager · Riyadh Main',
  },
];

async function clerkFetch(path, options = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
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
    const err = new Error(`Clerk ${res.status}: ${JSON.stringify(json)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function findUserByEmail(email) {
  const q = encodeURIComponent(email);
  const list = await clerkFetch(`/users?email_address=${q}&limit=1`);
  return Array.isArray(list) && list[0] ? list[0] : null;
}

async function ensureClerkUser(account) {
  const existing = await findUserByEmail(account.email);
  if (existing) {
    // Reset password so demos always use the known credential
    await clerkFetch(`/users/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        password: DEMO_PASSWORD,
        skip_password_checks: true,
        first_name: account.firstName,
        last_name: account.lastName,
      }),
    });
    return existing;
  }

  return clerkFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [account.email],
      password: DEMO_PASSWORD,
      first_name: account.firstName,
      last_name: account.lastName,
      skip_password_checks: true,
      skip_password_requirement: false,
    }),
  });
}

async function main() {
  const prisma = new PrismaClient();
  const creds = [];

  try {
    for (const account of ACCOUNTS) {
      const clerkUser = await ensureClerkUser(account);
      const clerkId = clerkUser.id;

      const prismaUser = await prisma.user.findUnique({
        where: { clerkId: account.prismaClerkId },
      });

      if (!prismaUser) {
        console.warn(`No Prisma user for ${account.prismaClerkId} — seed demo first`);
        continue;
      }

      // If another row already has this clerkId, merge carefully
      const clash = await prisma.user.findUnique({ where: { clerkId } });
      if (clash && clash.id !== prismaUser.id) {
        await prisma.membership.deleteMany({ where: { userId: clash.id } });
        await prisma.user.delete({ where: { id: clash.id } });
      }

      await prisma.user.update({
        where: { id: prismaUser.id },
        data: {
          clerkId,
          email: account.email,
          fullName: `${account.firstName} ${account.lastName}`,
          isPlatformAdmin: account.prismaClerkId === 'dev_clerk_owner',
        },
      });

      // Soften MFA so password UI is cleaner (OTP may still appear from instance email settings)
      try {
        await clerkFetch(`/users/${clerkId}/disable_mfa`, { method: 'POST' });
      } catch {
        /* ok */
      }

      creds.push({
        role: account.roleLabel,
        email: account.email,
        password: DEMO_PASSWORD,
        clerkId,
      });
      console.log(`Linked ${account.email} → ${clerkId} (${account.roleLabel})`);
    }

    console.log('\n=== DEMO CREDENTIALS (production) ===');
    for (const c of creds) {
      console.log(`\n${c.role}`);
      console.log(`  Email:    ${c.email}`);
      console.log(`  Password: ${c.password}`);
    }
    console.log('\nSign in at /sign-in then open /dashboard');
    console.log('Company: Al-Noor Auto Care (demo-auto)');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.body || e);
  process.exit(1);
});
