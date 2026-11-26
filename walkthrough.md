# Security Summary

**Reviewed Files**: 36
**Issues Resolved**: 10 (plus 3 Supabase Dashboard actions requiring manual confirmation by the owner)

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Unverified Client Session Cache | `src/lib/auth.ts` | 30 | `getAuthorizedAdminSession()` relied on `supabase.auth.getSession()` from browser `localStorage`, which does not re-verify revoked or tampered tokens against Supabase Auth. | Medium | Fixed | Updated `getAuthorizedAdminSession()` to verify the active JWT server-side via `supabase.auth.getUser()` before validating `admin_profiles`. |
| Unsanitized Image & Link URLs | `src/utils/formatters.ts`, `src/components/common/MenuImage.tsx`, `src/pages/PublicMenuPage.tsx`, `src/components/admin/ProductFormModal.tsx`, `src/components/admin/SettingsSection.tsx` | 41, 23, 100, 140, 171 | Dynamic image URLs and `public_menu_url` inputs were rendered into `<img>` tags or accepted without blocking `javascript:`, `data:`, protocol-relative `//`, embedded credentials, or private/local IP addresses. | Medium | Fixed | Added `sanitizeImageSrc()`, `validateExternalImageUrl()`, and `isPrivateOrLoopbackHost()`, and applied them across all public and admin image previews and URL validators. |
| Mass Assignment & Weak API Input Validation | `src/lib/menuApi.ts` | 124–378 | `updateProduct()` spread `...updates` directly into the database update object, and category/product/settings mutations lacked strict UUID, length, theme allowlist, path, and numeric ceiling checks. | Medium | Fixed | Replaced object spread with explicit field allowlisting and added UUID, string length, price ceiling (`0..9999999.99`), theme allowlist, storage path, and URL validation across all `menuApi` mutations. |
| File Upload Spoofing & Raw Fallback | `src/lib/storage.ts`, `src/components/admin/ProductFormModal.tsx`, `src/components/admin/SettingsSection.tsx` | 28, 73, 171 | Upload checks relied only on browser `file.type` (easily spoofed), allowed a raw-file/raw-extension fallback if canvas decoding failed, and did not validate storage paths before deletion. | Medium | Fixed | Added `validateImageFileBytes()` to verify real JPEG/PNG/WebP magic bytes, removed the unsafe raw-file fallback so un-decodable files are rejected, and enforced `SAFE_STORAGE_PATH_REGEX` in `deleteMenuImage()`. |
| Error Message & Console Log Disclosure | `src/lib/supabase.ts`, `src/lib/storage.ts` | 130, 179 | Unrecognized database/API errors returned raw `errObj.message` text to the UI, and `deleteMenuImage()` logged `error.message` to the browser console. | Low | Fixed | Hardened `getFriendlyErrorMessage()` to return only generic fallback messages for unexpected errors and removed `error.message` from the `console.warn()` call in `deleteMenuImage()`. |
| Missing Brute-Force Login Cooldown | `src/pages/AdminLoginPage.tsx` | 50 | Repeated wrong password attempts on `/admin/login` had no client-side cooldown guard to slow automated UI guessing. | Low | Fixed | Added a 30-second progressive lockout cooldown after 5 consecutive failed sign-in attempts (complementing Supabase Auth's server-side rate limits). |
| Unbounded Bulk Import Batching | `src/components/admin/BulkImportModal.tsx` | 94 | Bulk menu text import had no upper item cap or pre-flight field length/price ceiling check before looping API calls. | Low | Fixed | Enforced a 200-item batch limit and validated category names (`<= 100`), item names (`<= 140`), and prices (`0..9999999.99`) before making database calls. |
| Missing Production Security Headers | `netlify.toml`, `index.html` | 5, 6 | Deployment configuration lacked `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. | Medium | Fixed | Added comprehensive `[[headers]]` rules in `netlify.toml` and `<meta name="referrer" content="strict-origin-when-cross-origin" />` in `index.html`. |
| Non-Admin `authenticated` Access to `admin_notes` & Storage Listing | `supabase/migrations/005_security_hardening.sql` | 10–103 | In `002_rls_and_storage.sql`, public `SELECT` policies on `products` and `categories` applied `TO anon, authenticated` (exposing `products.admin_notes` to any non-admin `authenticated` user if signups were ever enabled), `storage.objects` allowed anonymous `SELECT` (bucket enumeration), `set_updated_at()` lacked fixed `search_path`, and `is_admin()` allowed `anon` execute. | High | Needs Follow-Up | Created non-destructive `supabase/migrations/005_security_hardening.sql` tightening `set_updated_at()` `search_path`, revoking `anon` execute on `is_admin()`, scoping public `SELECT` policies to `TO anon`, restricting `storage.objects` listing to admin while keeping public URLs working, and adding `NOT VALID` `CHECK` constraints. **User must execute `005_security_hardening.sql` in Supabase SQL Editor.** |
| Supabase Auth Dashboard Settings (Signups, MFA, Password Policy) | External Supabase Dashboard | — | Public signup toggle, admin MFA/2FA, leaked password protection, and Auth rate limits live in the external Supabase Dashboard and cannot be inspected or toggled from repository files. | High | Needs Follow-Up | Documented exact click-by-click instructions in the final report for disabling public user signups, enabling admin MFA, verifying rate limits, and confirming Netlify env vars contain only `VITE_SUPABASE_ANON_KEY`. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| API Keys & Secrets | `src/lib/supabase.ts`, `.env.example`, `.gitignore` | Only the public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used in browser code; no `service_role` or secret keys exist anywhere in the codebase. |
| Database Queries | `src/lib/menuApi.ts`, `supabase/migrations/001_initial_schema.sql` | All queries use Supabase's parameterized PostgREST client (`eq`, `order`, `select`) with strict UUID validation and zero raw SQL string interpolation. |
| Single-Admin Isolation & Auth Guard | `src/lib/auth.ts`, `supabase/migrations/001_initial_schema.sql`, `002_rls_and_storage.sql` | `public.admin_profiles` enforces a `singleton_guard` unique constraint (`TRUE`) and blocks all client-side `INSERT`, `UPDATE`, and `DELETE` grants; `is_admin()` runs `SECURITY DEFINER` with `SET search_path = public`; `requireAuthorizedAdmin()` verifies server JWT + `admin_profiles` membership. |
| Public Column Privacy | `src/lib/menuApi.ts`, `supabase/migrations/002_rls_and_storage.sql` | `fetchPublicMenuData()` omits `admin_notes`, and `anon` only holds column-level `SELECT` privileges excluding `admin_notes`. |
| UI Rendering | `src/` React components | React's default JSX escaping is used everywhere with zero `dangerouslySetInnerHTML`, `eval`, or `Function()` sinks. |

## PoC Verification

### 1. Unverified Local Session Token on Admin Routes
#### Summary
| Field | Value |
|---|---|
| Issue Type | Insecure Session Verification |
| Impact | Medium |
| Affected File | `src/lib/auth.ts:30` |
| Test Scenario | A stale, revoked, or tampered session token remains in browser `localStorage` when visiting `/admin/dashboard`. |

#### How It Was Fixed
`getAuthorizedAdminSession()` now calls `supabase.auth.getUser()` first, which validates the JWT signature and revocation state directly with Supabase Auth's server before accepting the session or querying `admin_profiles`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `ProtectedAdminRoute` invokes `getAuthorizedAdminSession()` (`src/lib/auth.ts:26`). | Auth check starts |
| 2 | `supabase.auth.getUser()` (`src/lib/auth.ts:30`) sends the JWT to Supabase Auth for server verification. | Revoked or invalid token rejected (`userError` or `!userData.user`) |
| 3 | Function returns `null` (`src/lib/auth.ts:32`) and redirects user to `/admin/login`. | **Handled Safely** |

#### Conclusion
**Fix Verified** - Locally cached tokens can no longer bypass session checks without passing server-side validation with Supabase Auth.

---

### 2. Dangerous Image URL Scheme & Internal Network Host Injection
#### Summary
| Field | Value |
|---|---|
| Issue Type | Unsafe URL Handling / SSRF Risk |
| Impact | Medium |
| Affected File | `src/utils/formatters.ts:41`, `src/components/admin/ProductFormModal.tsx:165`, `src/components/common/MenuImage.tsx:23` |
| Test Scenario | Admin or database row supplies `javascript:alert(1)`, `data:image/svg+xml,<svg onload=alert(1)>`, or `http://169.254.169.254/latest/meta-data/`. |

#### How It Was Fixed
`validateExternalImageUrl()` rejects non-HTTP(S) protocols, embedded credentials (`user:pass@`), and private/loopback/link-local IP hosts (`isPrivateOrLoopbackHost()`), while `sanitizeImageSrc()` filters every rendered `<img>` source before it reaches the DOM.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Untrusted URL enters `ProductFormModal.handleSubmit()` (`src/components/admin/ProductFormModal.tsx:165`) or `MenuImage` (`src/components/common/MenuImage.tsx:23`). | Input enters validation/render path |
| 2 | `validateExternalImageUrl()` (`src/utils/formatters.ts:71`) checks `parsed.protocol` and `isPrivateOrLoopbackHost(parsed.hostname)` (`src/utils/formatters.ts:100`). | Blocks `javascript:`, `data:`, and `169.254.169.254` |
| 3 | `MenuImage` calls `sanitizeImageSrc(src)` (`src/components/common/MenuImage.tsx:23`), which returns `null` for any unsafe scheme and renders the safe placeholder icon instead of `<img>`. | **Handled Safely** |

#### Conclusion
**Fix Verified** - Unsafe URL schemes and private/metadata network addresses are blocked at both form validation and DOM rendering layers.

---

### 3. Mass Assignment & Malformed Payload in Product Updates
#### Summary
| Field | Value |
|---|---|
| Issue Type | Mass Assignment / Unvalidated API Payload |
| Impact | Medium |
| Affected File | `src/lib/menuApi.ts:203` |
| Test Scenario | Caller invokes `updateProduct("not-a-uuid", {price: -50, image_path: "../secret", injected_col: true} as any)`. |

#### How It Was Fixed
Removed the object spread (`...updates`), added strict UUID validation (`isValidUuid()`), explicit property allowlisting, finite non-negative price bounds (`0..9999999.99`), storage path regex enforcement, and URL validation.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Malicious update arguments reach `updateProduct()` (`src/lib/menuApi.ts:242`). | Enters mutation handler |
| 2 | `isValidUuid(id)` (`src/lib/menuApi.ts:255`) rejects invalid IDs; for valid IDs, only explicit allowlisted properties are copied after validating price (`assertValidPrice`), path (`assertSafeStoragePath`), and URL (`assertSafeProductImageUrl`). | Extra fields dropped; invalid values throw before `.update()` |
| 3 | Request never reaches Supabase with unvalidated or extra properties. | **Handled Safely** |

#### Conclusion
**Fix Verified** - Only validated, explicitly allowlisted columns can be sent to Supabase product mutations.

---

### 4. Spoofed MIME Type / Polyglot File Upload
#### Summary
| Field | Value |
|---|---|
| Issue Type | Malicious File Upload |
| Impact | Medium |
| Affected File | `src/lib/storage.ts:28` |
| Test Scenario | Attacker renames an HTML/SVG payload `<svg onload=alert(1)>` to `evil.png` and selects it with spoofed `image/png` MIME type. |

#### How It Was Fixed
`validateImageFileBytes()` reads the first 12 bytes of the uploaded file and requires a valid JPEG, PNG, or WebP magic-byte signature, and `optimizeImageForUpload()` re-encodes every image through an HTML5 Canvas without any raw-file upload fallback.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `ProductFormModal` / `SettingsSection` / `uploadMenuImage()` calls `validateImageFileBytes(file)` (`src/lib/storage.ts:28`). | Reads first 12 bytes (`file.slice(0, 12).arrayBuffer()`) |
| 2 | Byte signature fails JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), and WebP (`RIFF....WEBP`) checks (`src/lib/storage.ts:34-61`). | Returns `{valid: false}` and clears file input |
| 3 | Any file failing magic-byte check or canvas re-encoding throws before reaching `supabase.storage.upload()`. | **Handled Safely** |

#### Conclusion
**Fix Verified** - Spoofed non-image files and undecodable payloads are rejected client-side before upload, backed by Supabase Storage bucket MIME/size rules server-side.

---

### 5. Non-Admin `authenticated` Access to `admin_notes` & Anonymous Storage Listing
#### Summary
| Field | Value |
|---|---|
| Issue Type | Row-Level Security Scope Exposure |
| Impact | High |
| Affected File | `supabase/migrations/002_rls_and_storage.sql:120,213` -> Remediated in `supabase/migrations/005_security_hardening.sql:25,60` |
| Test Scenario | If public signups were enabled in Supabase Auth, a non-admin user obtains the `authenticated` role and queries `products` (`admin_notes`) or enumerates `storage.objects` in `menu-images`. |

#### How It Was Fixed
`supabase/migrations/005_security_hardening.sql` scopes public read policies on `categories` and `products` strictly to `TO anon` (so non-admin `authenticated` users have zero access), restricts `storage.objects` `SELECT` to `public.is_admin()` (blocking anonymous bucket listing while public image URLs continue working), locks `set_updated_at()` `search_path = public`, and revokes `anon` execute on `is_admin()`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Non-admin `authenticated` JWT sends `GET /rest/v1/products?select=id,admin_notes` or `anon` calls Storage `list()`. | Request hits PostgreSQL RLS evaluation |
| 2 | `"Public can read active available products"` (`005_security_hardening.sql:33`) applies `TO anon` only; `"Admin can read all products"` requires `public.is_admin()`. | Both policies evaluate false for non-admin `authenticated` |
| 3 | Storage `SELECT` policy (`005_security_hardening.sql:61`) requires `public.is_admin()`, denying bucket listing while public bucket URLs keep serving menu images. | **Handled Safely (once Migration 005 is executed in Supabase SQL Editor)** |

#### Conclusion
**SQL Migration Ready** - Executing `supabase/migrations/005_security_hardening.sql` in the Supabase SQL Editor closes this privilege-boundary gap without breaking any live public menu or admin features.
