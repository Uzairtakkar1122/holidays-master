/**
 * ALLOWED USERS CONFIG
 * --------------------
 * Add any Google-account email here to grant access to private/protected pages.
 * Comparison is case-insensitive.
 *
 * Example:
 *   'john@gmail.com',
 *   'client@company.com',
 */
export const ALLOWED_EMAILS = [
    // ← add authorised emails here, one per line
    // 'you@gmail.com',
    'muhammaduzairuzikhan@gmail.com'
];

/**
 * Returns true if the given email is in the whitelist.
 * @param {string} email
 */
export const isAllowedUser = (email = '') =>
    ALLOWED_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
