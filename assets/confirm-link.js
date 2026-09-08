// Builds and verifies the signed, expiring confirmation link used by the
// crash-course double opt-in flow. See email-config.js for the caveat on
// what this signature actually protects against.

import { LINK_SIGNING_STRING, LINK_MAX_AGE_MS } from './email-config.js';

async function sign(email, course, ts) {
  const data = new TextEncoder().encode(`${email}|${course}|${ts}|${LINK_SIGNING_STRING}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

export async function buildConfirmUrl({ email, course, baseUrl }) {
  const ts = Date.now();
  const sig = await sign(email, course, ts);
  const url = new URL('confirm.html', baseUrl);
  url.searchParams.set('email', email);
  url.searchParams.set('course', course);
  url.searchParams.set('ts', String(ts));
  url.searchParams.set('sig', sig);
  return url.toString();
}

export async function verifyConfirmParams({ email, course, ts, sig }) {
  if (!email || !course || !ts || !sig) return { valid: false, reason: 'missing' };
  if (!/^\d+$/.test(ts)) return { valid: false, reason: 'invalid' };
  const expected = await sign(email, course, ts);
  if (expected !== sig) return { valid: false, reason: 'signature' };
  if (Date.now() - Number(ts) > LINK_MAX_AGE_MS) return { valid: false, reason: 'expired' };
  return { valid: true };
}
