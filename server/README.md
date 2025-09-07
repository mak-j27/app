# Server — Mail & Password Reset

Environment variables

- `SENDGRID_API_KEY` — (optional) SendGrid API key. If set, the server will send password reset emails.
- `FROM_EMAIL` — (optional) From address for emails. Defaults to `no-reply@example.com`.
- `FRONTEND_URL` — (optional) Frontend base URL used in reset links. Defaults to `http://localhost:5173`.
- `BCRYPT_SALT_ROUNDS` — (optional) Number of bcrypt salt rounds. Defaults to 12.
- `JWT_SECRET` — (recommended) Secret for JWT tokens.
- `ENABLE_ADMIN_BOOTSTRAP` — (optional) allow admin bootstrap when true.

Notes

- In development, when `SENDGRID_API_KEY` is not configured, the API will return the generated reset token in the `/api/password/forgot` response and log it to the server console. In production you should NOT return the token in responses.
- Tokens are securely generated with `crypto.randomBytes` and stored hashed in the database.

How to install SendGrid dependency

From `server/` directory run:

```bash
npm install
```

(That will install `@sendgrid/mail` added to `package.json`.)
