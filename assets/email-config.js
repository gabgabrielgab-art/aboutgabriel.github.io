// EmailJS configuration for the crash-course double opt-in flow.
//
// Fill in the four EmailJS values below from your dashboard before this
// feature will actually send anything — see EMAIL_SETUP.md at the repo
// root for exact step-by-step instructions. Until they're filled in,
// the gate form on the site will show a friendly error instead of
// silently failing.

export const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
export const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';

// Template 1 — sent to the VISITOR the moment they submit the gate form.
// Must contain a link built from the {{confirm_link}} variable.
export const EMAILJS_TEMPLATE_CONFIRM = 'YOUR_CONFIRM_TEMPLATE_ID';

// Template 2 — sent to the VISITOR once they click "Confirm & send" on
// confirm.html, containing the {{download_link}}. Set Gabriel's address
// as a static BCC *inside this template's own EmailJS settings* (not in
// code) so he's copied on every delivery automatically, with no extra
// API call needed.
export const EMAILJS_TEMPLATE_DELIVER = 'YOUR_DELIVER_TEMPLATE_ID';

export const NOTIFY_EMAIL = 'gabgabrielgab@gmail.com';

// Not a real secret — it ships in this public, unminified file, so treat
// it as a speed bump rather than real security. It stops a casual/lazy
// bypass of the confirm step and lets confirm.html detect a tampered or
// expired link; it will not stop someone who reads the source. See
// assets/confirm-link.js for how it's used.
export const LINK_SIGNING_STRING = 'never-too-matcha-v1';
export const LINK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Which file each gated course delivers once confirmed, keyed by the
// exact course title used elsewhere on the site (data-course-title).
// Path is relative to the site root.
export const COURSE_FILES = {
  'Prototype Builder with AI': 'assets/never-too-matcha-prototyping-with-ai.pdf',
};
