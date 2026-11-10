# Email Setup

The backend uses Mailtrap Sandbox SMTP for verification messages, password resets, email address changes, and order receipts. Sandbox messages are captured in your Mailtrap inbox rather than delivered to real recipients.

## Configure Mailtrap

1. Sign in to Mailtrap and open an Email Testing inbox.
2. Open the inbox's SMTP settings and copy its SMTP username and password.
3. Add the values to `backend/.env`:

```dotenv
EMAIL_USER=your_mailtrap_smtp_username
EMAIL_PASS=your_mailtrap_smtp_password
```

The backend connects to `sandbox.smtp.mailtrap.io` on port `2525`. Use the SMTP credentials shown for the inbox, not your Mailtrap account login. Keep `.env` private and never commit real credentials.

Restart the backend after changing the environment variables. Trigger a verification email or password reset, then check the Mailtrap inbox.

## Google Credentials

Google sign-in uses OAuth credentials (`OAUTH_GOOGLE_CLIENT_ID` and `OAUTH_GOOGLE_CLIENT_SECRET`); these are different from Mailtrap credentials.

The current email service uses Mailtrap and does not read Gmail credentials such as `GOOGLE_EMAIL` or `GOOGLE_APP_PASSWORD`. You do not need to configure a Google App Password for the current setup.
