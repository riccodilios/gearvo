import { WelcomeContinueClient } from './WelcomeContinueClient';

export const dynamic = 'force-dynamic';

/**
 * Post-auth router (client-driven).
 * Server redirects race Clerk's OAuth handshake on Netlify with development keys;
 * wait for ClerkJS to report signed-in, then resolve destination via a server action.
 */
export default function WelcomeContinuePage() {
  return <WelcomeContinueClient />;
}
