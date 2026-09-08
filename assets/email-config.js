// EmailJS configuration for automatic crash-course PDF delivery.
//
// Fill in the three EmailJS values below from your dashboard before this
// feature actually sends anything — see EMAIL_SETUP.md at the repo root
// for exact step-by-step instructions. Until they're filled in, the gate
// form falls back to just notifying you (via FormSubmit) so requests
// still reach you, but visitors won't get an automatic email.

export const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
export const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';

// Sent to the VISITOR the moment they submit the gate form, containing
// the {{download_link}}. Set your own address as a static BCC *inside
// this template's own EmailJS settings* (not in code) so you get a copy
// of every delivery automatically, with no extra API call needed.
export const EMAILJS_TEMPLATE_DELIVER = 'YOUR_DELIVER_TEMPLATE_ID';

export const NOTIFY_EMAIL = 'gabgabrielgab@gmail.com';

// Which file each gated course delivers automatically, keyed by the
// exact course title used elsewhere on the site (data-course-title).
// Path is relative to the site root. A course not listed here still
// works — the gate form just falls back to notifying you instead of
// auto-delivering, so you can wire up the confirmation step before the
// file itself is ready.
export const COURSE_FILES = {
  'Prototype Builder with AI': 'assets/never-too-matcha-prototyping-with-ai.pdf',
};
