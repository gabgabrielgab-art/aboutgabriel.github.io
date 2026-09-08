# Setting up the crash-course email confirmation

The "Prototype Builder with AI" download now works as a double opt-in:

1. Visitor submits their email on the site → gets a **confirmation email**.
2. They click the link → lands on `confirm.html` on your site.
3. They click **"Confirm & send"** (a deliberate second click, not automatic —
   see the note in `assets/confirm.js` about why) → they get a **second
   email with the PDF link**, and you get a copy of that same email (BCC),
   so you know exactly who asked and when — with zero manual step from you.

The main "Start a project" contact form is untouched — it still delivers
straight to gabgabrielgab@gmail.com via FormSubmit, no confirmation step.

This all runs through **EmailJS** (a service that lets a static site send
real email from client-side JS, no backend needed). Free tier is 200
emails/month. You need to create an account and two templates — I can't do
this part for you, it requires you to sign in with your own Google account.

## 1. Create an EmailJS account and connect Gmail

1. Go to https://www.emailjs.com/ and sign up (free).
2. **Email Services** → **Add New Service** → choose **Gmail** → connect
   `gabgabrielgab@gmail.com` (this is the account emails will be *sent
   from*; visitor replies will land there too, which is what you want).
3. Copy the **Service ID** it gives you (looks like `service_abc1234`).
4. **Account** → **General** → copy your **Public Key**.

## 2. Create the two email templates

Go to **Email Templates** → **Create New Template**, twice.

### Template 1 — "Confirm your request" (sent to the visitor first)

- **To email**: `{{to_email}}`
- **Subject**: `Confirm your request — {{course}}`
- **Content**, e.g.:

  ```
  Hi,

  You asked for the "{{course}}" crash course from Gabriel's site.

  Click below to confirm it's really you, and I'll send the download
  straight over:

  {{confirm_link}}

  Didn't request this? Just ignore this email — nothing else happens.

  — Gabriel
  ```

- Save it, then copy its **Template ID** (looks like `template_xyz9876`).
  This is `EMAILJS_TEMPLATE_CONFIRM`.

### Template 2 — "Here's your download" (sent after they confirm)

- **To email**: `{{to_email}}`
- **BCC**: `gabgabrielgab@gmail.com`  ← set this in the template's own
  "To/CC/BCC" settings in the EmailJS dashboard, not in code. This is what
  gets you a copy of every confirmed request automatically.
- **Subject**: `Your download — {{course}}`
- **Content**, e.g.:

  ```
  Here you go — thanks for confirming.

  {{course}}: {{download_link}}

  If you have questions after reading it, just reply to this email.

  — Gabriel
  ```

- Save it, copy its **Template ID**. This is `EMAILJS_TEMPLATE_DELIVER`.

## 3. Plug the four values into the site

Open `assets/email-config.js` and replace the placeholders:

```js
export const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';       // from step 1.4
export const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';       // from step 1.3
export const EMAILJS_TEMPLATE_CONFIRM = 'YOUR_CONFIRM_TEMPLATE_ID'; // from step 2, template 1
export const EMAILJS_TEMPLATE_DELIVER = 'YOUR_DELIVER_TEMPLATE_ID'; // from step 2, template 2
```

Commit and push. That's it — no other code changes needed.

## 4. Test it for real

Go to the live site → Courses → "Get the PDF" → use a real email address
you can check → confirm you get email 1 → click through → confirm you get
the download page *and* email 2 → confirm gabgabrielgab@gmail.com got a
BCC copy of email 2.

## Adding more gated downloads later

If you gate another course the same way, add its file and title to
`COURSE_FILES` in `assets/email-config.js`:

```js
export const COURSE_FILES = {
  'Prototype Builder with AI': 'assets/never-too-matcha-prototyping-with-ai.pdf',
  'Product Management': 'assets/some-other-file.pdf',
};
```

If a course isn't in that map, the flow still works (visitor still
confirms, you still get notified) — it just tells them you'll follow up
directly instead of showing a download button, so nothing breaks if you
wire up the confirmation step before the file itself is ready.

## On the "security" of the confirm link

The link contains a signature (a hash of the email + course + timestamp +
a fixed string in `email-config.js`). It's enough to stop casual spam and
detect a tampered or expired (>7 day old) link — but the signing string
ships in plain, unminified JS, so it is not real cryptographic protection
against someone who reads the source and deliberately wants to forge a
link. For a portfolio contact/download gate that's a reasonable trade-off;
it is not appropriate for anything security-sensitive.
