import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: 'gearvo',
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, service: 'gearvo', error: 'database_unreachable' },
      { status: 503 }
    );
  }
}
