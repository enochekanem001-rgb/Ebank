# Formspree verification email setup

The app sends verification codes through the Formspree endpoint configured in `email.mjs`.

1. Confirm the Formspree form at `https://formspree.io/f/xppzyyeo` is active.
2. In Formspree, enable the form's autoresponder and set its recipient field to the submitted `email` value. Without an autoresponder, Formspree sends the submission notification only to the form owner, not to each person signing in.
3. Restart the app:

```bash
npm run dev
```

The verification code is submitted to Formspree with the email address entered in the sign-in form. The code is delivered to that address only when the Formspree autoresponder is enabled and configured; otherwise it goes to the form owner's inbox. The code is not displayed in the browser or terminal.

# Real bank transfers

The Send money action uses Paystack's Nigerian bank transfer API. Copy `.env.example` to `.env`, set `PAYSTACK_SECRET_KEY` to a Paystack secret key, and restart the API. Keep this key on the server; never put it in `src/main.js`.

Paystack must have a funded transfer balance and the account must be enabled for Transfers. Test keys create test transfers; live keys send real money and require Paystack verification and sufficient balance.