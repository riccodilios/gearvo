import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

type ClerkEmail = { email_address: string; id: string };
type ClerkUserEvent = {
  data: {
    id: string;
    email_addresses?: ClerkEmail[];
    primary_email_address_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    username?: string | null;
  };
  type: string;
};

/**
 * Clerk user webhook.
 * Prefer configuring CLERK_WEBHOOK_SECRET and verifying with Svix in production.
 * When secret is unset (local), rejects in production and accepts signed-off payloads in dev only.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  const payload = await req.text();
  const headerPayload = await headers();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }
  } else {
    try {
      const { Webhook } = await import('svix');
      const wh = new Webhook(secret);
      wh.verify(payload, {
        'svix-id': headerPayload.get('svix-id') ?? '',
        'svix-timestamp': headerPayload.get('svix-timestamp') ?? '',
        'svix-signature': headerPayload.get('svix-signature') ?? '',
      });
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let evt: ClerkUserEvent;
  try {
    evt = JSON.parse(payload) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const u = evt.data;
    const emails = u.email_addresses ?? [];
    const email =
      emails.find((e) => e.id === u.primary_email_address_id)?.email_address ??
      emails[0]?.email_address ??
      `${u.id}@users.clerk.local`;
    const fullName =
      [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'User';

    await prisma.user.upsert({
      where: { clerkId: u.id },
      create: {
        clerkId: u.id,
        email,
        fullName,
        avatarUrl: u.image_url ?? null,
      },
      update: {
        email,
        fullName,
        avatarUrl: u.image_url ?? null,
      },
    });
  }

  if (evt.type === 'user.deleted') {
    const id = evt.data.id;
    if (id) await prisma.user.deleteMany({ where: { clerkId: id } });
  }

  return NextResponse.json({ ok: true });
}
