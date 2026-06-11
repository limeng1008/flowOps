# FlowOps IAM UI Contract

This contract is extracted only from Apache-side UI code under `packages/ui/src`.
It is the clean-room input for the self-owned IAM implementation.

## Sources Read

-   `packages/ui/src/api/auth.js`
-   `packages/ui/src/api/account.api.js`
-   `packages/ui/src/api/user.js`
-   `packages/ui/src/api/client.js`
-   `packages/ui/src/store/reducers/authSlice.js`
-   `packages/ui/src/utils/authUtils.js`
-   `packages/ui/src/views/auth/*`
-   Auth pages also reference `packages/ui/src/api/loginmethod.js`,
    `packages/ui/src/api/sso.js`, and `packages/ui/src/api/audit.js`; those are
    recorded below as auth-page-adjacent endpoints.

No `packages/server/src/enterprise/**` or `packages/server/src/IdentityManager.ts`
implementation was used to produce this file.

## HTTP Client Behavior

-   Base URL: every `client` call is under `${baseURL}/api/v1`.
-   `Content-Type: application/json`
-   Header: `x-request-from: internal`
-   `withCredentials: true`; browser cookies are expected to carry auth state.
-   On `401` with `{ message: ErrorMessage.TOKEN_EXPIRED, retry: true }`, the UI
    calls `POST /auth/refreshToken` with credentials and retries the original
    request if the response body has an `id`.
-   On other `401`, the UI clears local auth state.

## LoggedInUser Payload

`loginSuccess`, `workspaceSwitchSuccess`, `upgradePlanSuccess`, SSO success, and
refresh-token success all consume the same top-level payload shape.

Required fields consumed by `AuthUtils.extractUser`:

```ts
{
    id: string
    email: string
    name: string
    status?: string
    role?: unknown
    isSSO?: boolean
    activeOrganizationId?: string
    activeOrganizationSubscriptionId?: string | null
    activeOrganizationCustomerId?: string | null
    activeOrganizationProductId?: string | null
    activeWorkspaceId?: string
    activeWorkspace?: unknown
    lastLogin?: string | Date | null
    isOrganizationAdmin?: boolean
    assignedWorkspaces?: unknown[]
    permissions?: string[]
    token?: string
    features?: Record<string, unknown>
}
```

State/localStorage effects:

-   `user` is the extracted object above.
-   `token` is stored from `payload.token`, but normal API calls use cookies.
-   `permissions` is stored from `payload.permissions`.
-   `features` is stored from `payload.features`.
-   `isGlobal` is `user.isOrganizationAdmin`.
-   `isAuthenticated` is set to `true`.

For T2 self auth, `assignedWorkspaces`, `activeWorkspaceId`, `permissions`,
`features`, and `isOrganizationAdmin` must be present because the shell and
menus read them immediately after login.

## T2 Core Auth Endpoints

### `POST /auth/login`

Source: `api/auth.js`, `views/auth/signIn.jsx`.

Request:

```json
{
    "email": "user@example.com",
    "password": "plain text password"
}
```

Success response: the LoggedInUser payload. The UI dispatches `loginSuccess`
with `response.data` and navigates to the requested protected route or default
dashboard.

Cookie behavior: the self implementation must set httpOnly auth cookies on
success. The UI sends subsequent requests with `withCredentials: true`.

Failure behavior used by UI:

-   `401` plus `{ "redirectUrl": "..." }` redirects the browser.
-   Otherwise the UI displays `response.data.message` or the axios error message.

### `POST /auth/refreshToken`

Source: `api/client.js`.

Request body: `{}`.

Success response: LoggedInUser payload. The UI only checks that `response.data.id`
exists before retrying the original request.

### `POST /auth/resolve`

Source: `api/auth.js`, `views/auth/login.jsx`.

Request body: `{}`.

Success response:

```json
{
    "redirectUrl": "/signin"
}
```

The UI assigns `window.location.href = response.data.redirectUrl`.

### `POST /account/register`

Source: `api/account.api.js`, `views/auth/register.jsx`.

Enterprise-form request used by the UI:

```json
{
    "user": {
        "name": "Display Name",
        "email": "user@example.com",
        "credential": "plain text password",
        "tempToken": "invite token"
    }
}
```

Cloud-form request also exists and omits `tempToken`; it may include
`user.referral`. T2 self behavior follows the plan: the first empty-database
registration may omit `tempToken`, later registrations require a valid invite
token.

Success response: any truthy JSON body. The UI clears the form and navigates to
`/signin` after showing a success message.

Failure response: the UI displays `response.data.message` for enterprise mode.

### `POST /account/logout`

Source: `api/account.api.js`, `authSlice.js`, `authUtils.js`.

Request body: none.

Expected behavior: clear server-side httpOnly auth cookies. The UI also clears
local storage and non-httpOnly cookies via `logoutSuccess`.

### `POST /account/forgot-password`

Source: `api/account.api.js`, `views/auth/forgotPassword.jsx`.

Request:

```json
{
    "user": {
        "email": "user@example.com"
    }
}
```

Success response: any truthy JSON body. The UI shows a generic
"reset instructions sent" message.

Failure response: either a string or an object with `message`.

### `POST /account/reset-password`

Source: `api/account.api.js`, `views/auth/resetPassword.jsx`.

Request:

```json
{
    "user": {
        "email": "user@example.com",
        "tempToken": "reset token",
        "password": "new plain text password"
    }
}
```

Success response: any truthy JSON body. The UI shows success and returns to
`/signin`.

Failure response: either a string or an object with `message`.

### `POST /account/verify`

Source: `api/account.api.js`, `views/auth/verify-email.jsx`.

Request:

```json
{
    "user": {
        "tempToken": "verification token"
    }
}
```

Success response: any truthy JSON body. The UI shows success and returns to
`/signin`.

T2 self decision point from the plan: email verification is not enabled for the
self track unless SMTP/workflow support is added. A compatible success response
for known tokens, or a clear "not enabled" response, is acceptable if documented
in the implementation report.

### `POST /account/resend-verification`

Source: `api/account.api.js`, `views/auth/signIn.jsx`.

Request:

```json
{
    "email": "user@example.com"
}
```

Success response: any truthy JSON body. The UI hides the resend button and shows
a success message.

### `POST /account/invite`

Source: `api/account.api.js`.

Request body: opaque to the auth pages. T2 self implementation should accept the
admin/user-management caller shape when later UI screens call this API, and at
minimum support an email/name/workspace/role based body for curl and tests.

Expected T2 self behavior from the plan: owner/admin creates an invite token,
persists it on the invited user, sends email if SMTP is configured, and otherwise
returns an invite link in the JSON response.

## Other Account Endpoints Present In API Layer

### `POST /account/confirm-email-change`

Request:

```json
{
    "user": {
        "tempToken": "email change token"
    }
}
```

Success response: any truthy JSON body. This is outside the T2 curl chain.

### `POST /account/billing`

Request body: none. Outside T2 self auth.

### `DELETE /account/delete`

Request body: opaque `body` sent as axios `data`. Outside T2 self auth.

## User API Endpoints Present In API Layer

These are listed for route compatibility. User management behavior belongs to
later IAM tasks unless directly needed by T2 auth.

-   `GET /user?id={id}`
-   `PUT /user` with caller-provided body
-   `GET /organizationuser?organizationId={organizationId}`
-   `GET /organizationuser?organizationId={organizationId}&userId={userId}`
-   `GET /organizationuser?userId={userId}`
-   `PUT /organizationuser` with caller-provided body
-   `DELETE /organizationuser?organizationId={organizationId}&userId={userId}`
-   `GET /organization/additional-seats-quantity?subscriptionId={subscriptionId}`
-   `GET /organization/customer-default-source?customerId={customerId}`
-   `GET /organization/additional-seats-proration?subscriptionId={subscriptionId}&quantity={quantity}`
-   `POST /organization/update-additional-seats` with `{ subscriptionId, quantity, prorationDate }`
-   `GET /organization/plan-proration?subscriptionId={subscriptionId}&newPlanId={newPlanId}`
-   `POST /organization/update-subscription-plan` with `{ subscriptionId, newPlanId, prorationDate }`
-   `GET /organization/get-current-usage`
-   `GET /workspaceuser?workspaceId={workspaceId}`
-   `GET /workspaceuser?roleId={roleId}`
-   `GET /workspaceuser?userId={userId}&workspaceId={workspaceId}`
-   `GET /workspaceuser?userId={userId}`
-   `GET /workspaceuser?organizationId={organizationId}&userId={userId}`
-   `DELETE /workspaceuser?workspaceId={workspaceId}&userId={userId}`

## Auth-Page-Adjacent Endpoints

These endpoints are referenced by pages under `views/auth/*`, but SSO and audit
screen completion are assigned to later tasks in the plan.

### `GET /loginmethod/default`

Used by sign-in/register pages to decide whether to show SSO buttons.

Expected response:

```json
{
    "providers": ["azure", "google", "auth0", "github"]
}
```

For T2 self password-only auth, returning `{ "providers": [] }` is compatible.

### `GET /loginmethod?organizationId={organizationId}`

Used by the SSO config page. Response shape consumed by UI:

```ts
{
    providers: Array<{
        name: 'azure' | 'google' | 'auth0' | 'github'
        status: 'enable' | 'disable'
        config: Record<string, string | undefined>
    }>
    callbacks: Array<{
        providerName: string
        callbackURL: string
    }>
}
```

### `PUT /loginmethod`

Request body includes `organizationId`, `userId`, and a `providers` array with
provider config/status. Outside T2 self auth.

### `POST /loginmethod/test`

Request body is the same as `PUT /loginmethod`, with a single provider and
`providerName`. Outside T2 self auth.

### Browser redirect `GET /{provider}/login`

Sign-in/register pages assign `window.location.href = /api/v1/{provider}/login`.
SSO is out of scope for T2 self auth.

### `GET /auth/sso-success?token={token}`

Success response is the LoggedInUser payload. SSO is out of scope for T2 self
auth.

### `POST /audit/login-activity`

Request body:

```json
{
    "pageNo": 1,
    "startDate": "Date object serialized by axios",
    "endDate": "Date object serialized by axios",
    "activityCodes": [0, 1, -1, -2, -3, -4]
}
```

Response shape consumed by UI:

```ts
{
    count: number
    currentPage: number
    pageSize: number
    data: Array<{
        activityCode: 0 | 1 | -1 | -2 | -3 | -4 | -99
        username?: string
        attemptedDateTime: string | Date
        loginMode?: string
        message?: string
    }>
}
```

Login activity display is completed in T4, but T2 login/logout should already
write activity rows so the later route can expose them.
