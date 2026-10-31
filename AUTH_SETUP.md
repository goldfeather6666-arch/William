# Authentication setup (login / sign-up / Google OAuth)

Login and sign-up depend on two *separate* configuration surfaces. If either is
missing, the forms will fail (or show the amber "Supabase is not configured"
banner). Work through both.

## 1. Vercel environment variables (required)

Add these to **Vercel → Project → Settings → Environment Variables**
for **Production** (and **Preview** if you use previews):

| Variable | Value / how to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL — Dashboard → Settings → API. Starts with `https://`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The **anon** (public) key from the same page. Public, safe for the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | The **service_role** key (server-only). Never expose to the browser. |
| `AI_KEY_ENCRYPTION_SECRET` | A 32-byte base64 AES key used to encrypt user-provided AI keys. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_SITE_URL` | The production domain, e.g. `https://medcoach.app`. Used for auth redirects and metadata. For previews this can be omitted — the app now falls back to the live request origin. |

These are the **only** secrets required for login/sign-up to function. After
adding them, trigger a redeploy (**Redeploy** on the latest deployment).

> `NEXT_PUBLIC_*` values are inlined at build time, so they must be present
> when the deployment builds, not added afterwards.

## 2. Supabase dashboard settings (required)

Also configure your Supabase project (three steps):

1. **Auth → URL Configuration → Redirect URLs** — add every domain you use,
   including the callback path:
   - `http://localhost:3000/auth/callback`
   - `https://<your-domain>/auth/callback`
   - `https://<preview-domain>/auth/callback` (if using previews)
   For Google sign-in you must also add the callback to **Google Cloud
   Console → Credentials → Authorized redirect URIs**:
   `https://<project-ref>.supabase.co/auth/v1/callback`.

2. **Auth → Providers** — enable **Email** (and **Google** if you want the
   "Continue with Google" button). Fill in the Google OAuth client ID/secret.

3. **Auth → Settings → Email** — choose **Confirm email** on/off:
   - *On* (recommended): users must click the verification link before they can
     log in. After sign-up they see "Check your inbox".
   - *Off*: accounts are active immediately and the app logs them straight in.

## 3. What to check when something fails

- **Amber banner on login/register** → missing `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the deployment. Add and redeploy.
- **"Email not confirmed"** at login → email confirmation is on and the user
  hasn't clicked the verification link, or the link pointed at
  `localhost` because the redirect URL wasn't allowlisted (fix in step 2.1).
- **Google button does nothing / loops** → OAuth callback URI not allowlisted in
  Supabase and/or Google Cloud (step 2.1).
- **`?error=callback` after an email link** → the `/auth/callback` route could
  not exchange the code; re-check step 2.1 and the `NEXT_PUBLIC_SITE_URL`.
