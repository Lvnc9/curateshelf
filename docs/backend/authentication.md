# Authentication & users

Owner: `backend/apps/users/` (backend) and `frontend/src/lib/auth.tsx` (frontend).

CurateShelf uses **stateless JWT auth** (djangorestframework-simplejwt) with **email as the login
identifier**. Django sessions exist only for the `/admin/` site.

## Models

### `User` (`apps/users/models.py`)

A custom user model (`AUTH_USER_MODEL = "users.User"`) built on `AbstractBaseUser + PermissionsMixin`.

| Field | Notes |
|-------|-------|
| `email` | Unique, and the `USERNAME_FIELD` |
| `is_staff`, `is_active`, `date_joined` | Standard |

`UserManager.create_user(email, password)` normalises the email. `create_superuser` sets the staff and
superuser flags.

### `Profile`

One-to-one with `User` (`user.profile`). It holds everything public:

| Field | Notes |
|-------|-------|
| `username` | Unique slug used in URLs (`/u/<username>`) |
| `display_name`, `bio`, `location`, `website`, `avatar` | Editable by the owner |
| `role` | `reader` · `editor` · `vendor` (read-only via the API, set in admin) |
| `loves_given`, `curious_given`, `skips_given` | Denormalised counters maintained by engagement |
| `notify_replies`, `notify_digest` | Email preferences, used by notifications |

**Auto-creation:** the `post_save` signal in `apps/users/signals.py` creates a profile for every new
user. The username is derived from the email's local part (`jane.doe@x` → `jane-doe`, then `jane-doe-1`
on collision), and the display name is a title-cased version of it.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/auth/register/` | public | Create an account. Body: `{email, password (≥8), username?}`. Returns `{user, access, refresh}` (201) |
| `POST` | `/auth/token/` | public | Sign in. Body: `{email, password}`. Returns `{access, refresh}` |
| `POST` | `/auth/token/refresh/` | public | Body: `{refresh}`. Returns a new `access` (and a rotated `refresh`) |
| `GET` / `PATCH` | `/me/` | user | Read/update your own profile (`ProfileSerializer`; counters and role are read-only) |
| `GET` | `/users/<username>/` | public | Public profile (no email) |
| `GET` | `/users/<username>/attitudes/?kind=love\|curious` | public | Someone's public shelf. **Skips are always excluded** |
| `GET` | `/me/attitudes/?kind=` | user | Your own attitudes, including skips (in `apps.engagement`) |

If register is given a `username` that is already taken, it is silently ignored and the
auto-generated one is kept.

### Token settings (`SIMPLE_JWT`)

| Setting | Value |
|---------|-------|
| Access lifetime | 12 hours |
| Refresh lifetime | 7 days |
| Refresh rotation | on (`ROTATE_REFRESH_TOKENS`) |

`EmailTokenObtainPairView` (`apps/users/auth.py`) is SimpleJWT's view with `username_field = "email"`.

## Permissions

- Global default: `IsAuthenticatedOrReadOnly`.
- Staff-only endpoints (`/staff/products/`, `/staff/comments/<id>/moderate/`) use `IsAdminUser`
  (`is_staff=True`).
- Object ownership is implicit: `/me/` always resolves to `request.user.profile`, and comments and
  attitudes are always written as `request.user`.

## Avatars

When `PATCH /me/` includes an `avatar`, the `process_avatar` task resizes it in place to fit 400×400
JPEG (`apps/users/tasks.py`).

## Frontend session (`frontend/src/lib/auth.tsx`)

`AuthProvider` (mounted in `components/Providers.tsx`) exposes `useAuth()`:

| Member | Behaviour |
|--------|-----------|
| `user` | The current `Profile`, or `null` |
| `loading` | `true` until the first `/me/` check finishes |
| `login(email, password)` | `POST /auth/token/`, stores tokens, loads `/me/` |
| `register(email, password, username?)` | `POST /auth/register/`, stores tokens, sets the user |
| `logout()` | Clears tokens and the user |
| `refresh()` | Re-reads `/me/`. If it fails, tokens are cleared (you are signed out) |

Tokens live in `localStorage` under `cs_access` / `cs_refresh`. `lib/api.ts` adds
`Authorization: Bearer <cs_access>` to every request.

**Redirect after sign-in:** pages send signed-out users to `/login?next=<path>` (AttitudeBar,
Settings). The login page only follows `next` values that are same-site relative paths (`/…` but not
`//…`), which prevents an open redirect.

**Demo account:** `seed_demo` creates `reader@curateshelf.local` / `reader12345`. The sign-in page has a
*Use demo reader* button that fills it in.

## Known gaps / next steps

- The frontend does not call `/auth/token/refresh/` yet. After 12 hours the access token expires, the
  next `/me/` call fails, and the user is signed out. A small 401 interceptor in `api.ts` that refreshes
  once and retries would fix this.
- Tokens in `localStorage` are readable by any script on the page. Moving them to httpOnly cookies
  (with CSRF protection) would harden this if the app grows.
- `RegisterSerializer` only enforces `min_length=8`. Django's `AUTH_PASSWORD_VALIDATORS` are not run
  on API sign-up. Calling `validate_password()` in the serializer would apply them.
- No email verification or password reset flow.
