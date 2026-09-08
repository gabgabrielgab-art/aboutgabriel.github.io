# Setting up automatic crash-course delivery

The "Prototype Builder with AI" download now sends itself: a visitor
enters their email on the gate form and immediately gets an email with
the PDF link — no manual step from you. You're BCC'd on that same email
automatically, so you always know who requested it.

The main "Start a project" contact form is untouched — it still delivers
straight to gabgabrielgab@gmail.com via FormSubmit, same as before.

This runs through **EmailJS**, a service that lets a static site send
real email from client-side JS with no backend. Free tier is 200
emails/month — plenty for a portfolio site. You need to create an
account and one template — I can't do this part for you, it requires
signing in with your own Google account.

**Until you complete this setup**, the gate form still works safely: it
falls back to just notifying you via FormSubmit (like before), so no
request is ever lost — visitors just won't get the automatic email yet.

## 1. Create an EmailJS account and connect Gmail

1. Go to https://www.emailjs.com/ and sign up (free).
2. **Email Services** → **Add New Service** → choose **Gmail** → connect
   `gabgabrielgab@gmail.com` (this is the account emails will be *sent
   from*; visitor replies will land there too, which is what you want).
3. Copy the **Service ID** it gives you (looks like `service_abc1234`).
4. **Account** → **General** → copy your **Public Key**.

## 2. Create the delivery template

Go to **Email Templates** → **Create New Template**.

- **To email**: `{{to_email}}`
- **BCC**: `gabgabrielgab@gmail.com`  ← set this in the template's own
  "To/CC/BCC" settings in the EmailJS dashboard, not in code. This is
  what gets you a copy of every request automatically.
- **Subject**: `Your download — {{course}}`
- **Content**, e.g.:

  ```
  Here you go — thanks for your interest.

  {{course}}: {{download_link}}

  If you have questions after reading it, just reply to this email.

  — Gabriel
  ```

- Save it, then copy its **Template ID** (looks like `template_xyz9876`).

## 3. Plug the three values into the site

Open `assets/email-config.js` and replace the placeholders:

```js
export const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';        // from step 1.4
export const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';        // from step 1.3
export const EMAILJS_TEMPLATE_DELIVER = 'YOUR_DELIVER_TEMPLATE_ID'; // from step 2
```

Commit and push. That's it — no other code changes needed.

## 4. Test it for real

Go to the live site → Courses → "Get the PDF" → use a real email address
you can check → confirm you get the email with the download link →
confirm gabgabrielgab@gmail.com got a BCC copy of the same email.

## Adding more gated downloads later

If you gate another course the same way, add its file and title to
`COURSE_FILES` in `assets/email-config.js`:

```js
export const COURSE_FILES = {
  'Prototype Builder with AI': 'assets/never-too-matcha-prototyping-with-ai.pdf',
  'Product Management': 'assets/some-other-file.pdf',
};
```

If a course isn't in that map, the gate form still works — it just
falls back to notifying you instead of auto-delivering, so nothing
breaks if you wire up the gate before the file itself is ready.
