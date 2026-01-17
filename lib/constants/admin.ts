/**
 * Admin Configuration
 * Centralized admin settings for the application
 */

// Admin email whitelist - users with these emails can access the admin dashboard
export const ADMIN_EMAILS = [
  'scheppat@bc.edu',
  'hunterschep@gmail.com',
] as const;

/**
 * Check if an email belongs to an admin user
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number]);
}

