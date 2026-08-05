import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  ALLOW_DEV_AUTH_BYPASS: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  INTEGRATION_SECRETS_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema> & {
  clerkConfigured: boolean;
  isProduction: boolean;
  allowDevBypass: boolean;
};

function loadEnv(): ServerEnv {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    ALLOW_DEV_AUTH_BYPASS: process.env.ALLOW_DEV_AUTH_BYPASS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    INTEGRATION_SECRETS_KEY: process.env.INTEGRATION_SECRETS_KEY,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    // Soft fail at import for build-time without DB; hard checks happen at runtime helpers
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error(`Invalid environment: ${msg}`);
    }
  }

  const data = parsed.success
    ? parsed.data
    : {
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        ALLOW_DEV_AUTH_BYPASS: process.env.ALLOW_DEV_AUTH_BYPASS === 'true',
      };

  const clerkConfigured = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
  const isProduction = data.NODE_ENV === 'production';
  const allowDevBypass = !isProduction && !!data.ALLOW_DEV_AUTH_BYPASS;

  return {
    ...data,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    INTEGRATION_SECRETS_KEY: process.env.INTEGRATION_SECRETS_KEY,
    clerkConfigured,
    isProduction,
    allowDevBypass,
  } as ServerEnv;
}

export const env = loadEnv();

export function assertClerkConfigured() {
  if (env.isProduction && !env.clerkConfigured) {
    throw new Error('Clerk keys are required in production.');
  }
}
