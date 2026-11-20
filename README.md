# QR Menu — Digital Menu System

A production-ready digital QR menu application for restaurants, cafés, bakeries, ice cream parlours, and food businesses. Powered by React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL, Authentication, and Storage).

Customers scan **one permanent QR code** pointing to `/menu` and always see your latest published products, photographs, categories, and prices without any login, cart, or checkout clutter. You manage everything from a private, single-administrator dashboard at `/admin/dashboard`.

---

## Step-by-Step Setup Guide (Beginner-Friendly)

### 1. How to Run the Project Locally

1. Make sure **Node.js (v18 or newer)** is installed on your computer.
2. Open a terminal in the project folder and install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (after configuring `.env` below):
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000/menu` for the public customer menu, or `http://localhost:3000/admin/login` for the administrator login.

---

### 2. How to Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project**.
3. Choose your Organization, enter a project name (e.g., `qr-menu`), set a strong **Database Password** (save it somewhere safe), and pick a region close to your business.
4. Click **Create new project** and wait 1–2 minutes for provisioning to finish.

---

### 3. How to Find the Supabase Project URL

1. Inside your Supabase project dashboard, open **Project Settings** (the gear icon in the bottom-left sidebar).
2. Click **Data API** (or **API**).
3. Copy the **Project URL** (it looks like `https://abcdefghijklm.supabase.co`).

---

### 4. How to Find the Publishable (Anon) Key

1. On that same **Project Settings → API** page, look for **Project API keys**.
2. Copy the **`anon` / `publishable`** key.
3. **CRITICAL SECURITY RULE:** Never copy or expose the **`service_role`** (secret) key in this frontend project or `.env` file. Only use the `anon` publishable key.

---

### 5. How to Configure Environment Variables

1. In the project root folder, copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and replace the placeholder values with your real Supabase details:
   ```env
   VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-publishable-anon-key"
   VITE_PUBLIC_MENU_BASE_URL=""
   ```
3. Save the file and restart `npm run dev` if it was already running.

---

### 6. How to Execute SQL Migration Files

1. In your Supabase dashboard, open **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/001_initial_schema.sql` from this project, copy all of its contents, paste into the SQL Editor, and click **Run**.
4. Open another **New query**, paste the contents of `supabase/migrations/002_rls_and_storage.sql`, and click **Run**.

---

### 7. How to Configure the Storage Bucket

Running `002_rls_and_storage.sql` automatically creates the `menu-images` Storage bucket with:
- Public read access for menu photographs.
- 5 MB per-file upload limit.
- Allowed formats: JPEG, PNG, WebP.

You can verify it under **Storage → Buckets** in your Supabase dashboard (`menu-images` should appear marked **Public**).

---

### 8. How to Configure RLS Policies

Row Level Security (RLS) is automatically enabled and configured by `002_rls_and_storage.sql`:
- **Public customers (`anon`)** can only read active categories, active & available products (excluding private `admin_notes`), and public business settings. They cannot insert, update, or delete any records or storage files.
- **Authorized administrator** (verified via `public.is_admin()` against `public.admin_profiles`) has full permission to manage categories, products, settings, and `menu-images` storage objects.

---

### 9. How to Create the First Admin Securely

This system allows **strictly one administrator** and has no public signup page.

1. In Supabase Dashboard, go to **Authentication → Users**.
2. Click **Add user → Create new user**.
3. Enter your administrator email address and a strong password.
4. Check **Auto Confirm User** and click **Create user**.
5. Open **SQL Editor → New query**, paste the contents of `supabase/migrations/003_admin_provisioning.sql`, replace `'your-admin-email@example.com'` with the exact email you just created, and click **Run**.
   - This links your Supabase Auth user into `public.admin_profiles` (which enforces a single-row database lock so no second admin can ever be added).
6. (Optional security hardening) In **Authentication → Providers → Email** or **User Signups**, you may turn **off** "Allow new users to sign up" in Supabase Auth settings so nobody else can register in your project.

---

### 10. How to Test Product Creation

1. Visit `/admin/login` and sign in with your administrator email and password.
2. Open **Settings** and enter your Business Name, Menu Heading, and Currency Symbol (default `₹`), then save.
3. Open **Categories** and create a category (for example: *Starters*, *Main Course*, or *Desserts*).
4. Open **Products**, click **Add Product**, upload a real food photograph, enter the name and price, choose the category, and click **Add Product**.

---

### 11. How to Test Public Menu Access

1. Open an Incognito/Private browser window (where you are **not** logged in as admin) and visit `/menu`.
2. Confirm that:
   - Your business name, heading, category heading, food photograph, product name, and price appear cleanly.
   - Admin notes, cart buttons, and admin links do **not** appear.
3. In the admin dashboard, edit a product price or toggle **Hide** on a product, then refresh `/menu` in the private window to confirm the public menu reflects the change immediately.

---

### 12. How to Configure the Production Domain

1. Once you have your real domain (for example, `https://yourrestaurant.com`), sign in to `/admin/dashboard`.
2. Go to **Settings** (or **QR Code**) and set **Permanent Public Menu URL** to:
   `https://yourrestaurant.com/menu`
3. Save the setting.

---

### 13. How to Generate the Permanent QR Code

1. Open **QR Code** in `/admin/dashboard`.
2. Confirm the temporary development warning is gone and the URL displays your live production domain (`https://yourdomain.com/menu`).
3. Download the high-resolution **PNG** or vector **SVG**, or click **Print QR Code** to print tabletop displays.
4. You never need to regenerate this QR code when adding, editing, hiding, or deleting menu items.

---

### 14. How to Deploy for Free on Netlify

This project includes `netlify.toml` and `public/_redirects` so all routes (`/menu`, `/admin/login`, `/admin/dashboard`) work automatically on Netlify with free HTTPS.

#### Option A: Deploy via GitHub + Netlify (Recommended)
1. Push your project to a GitHub repository (never commit `.env`).
2. Sign in to [netlify.com](https://www.netlify.com) (free plan) and click **Add new site → Import an existing project**.
3. Select your GitHub repository.
4. Netlify automatically detects `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Before clicking Deploy, open **Environment variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL (`https://your-project-ref.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = your Supabase `anon` / publishable key
6. Click **Deploy site**.

#### Option B: Drag-and-Drop (`dist/`) Without Git
1. Make sure `.env` locally has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Run `npm run build` to create the `dist/` folder.
3. Open **Netlify → Sites → Add new site → Deploy manually**, and drag the `dist/` folder onto the page.

#### Final Step After Netlify Deploy
1. Open your live Netlify site at `https://your-site-name.netlify.app/admin/login`.
2. Sign in, go to **QR Code** (or **Settings**), enter `https://your-site-name.netlify.app/menu` (or your custom domain if connected) into **Production Menu URL**, and click **Save URL**.
3. Download/print your permanent QR code and scan it from your phone to confirm it opens your public menu directly.

---

## Project Structure

```text
├── public/
│   └── .htaccess                  # Hostinger SPA routing rewrite rules
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql # PostgreSQL tables, constraints, triggers
│       ├── 002_rls_and_storage.sql# RLS policies, column grants, storage bucket
│       └── 003_admin_provisioning.sql # Single-admin SQL provisioning template
├── src/
│   ├── components/
│   │   ├── admin/                 # Overview, Products, Categories, QR, Settings
│   │   ├── auth/                  # ProtectedAdminRoute guard
│   │   ├── common/                # MenuImage, ConfirmDialog, SetupRequiredState
│   │   └── public-menu/           # Editorial menu theme configurations
│   ├── lib/
│   │   ├── auth.ts                # Supabase Auth + admin_profiles verification
│   │   ├── menuApi.ts             # Public & admin PostgreSQL queries/mutations
│   │   ├── storage.ts             # Image optimization, validation & Storage upload
│   │   └── supabase.ts            # Supabase client & error formatter
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx # /admin/dashboard
│   │   ├── AdminLoginPage.tsx     # /admin/login
│   │   └── PublicMenuPage.tsx     # /menu
│   ├── types/
│   │   └── menu.ts                # Shared TypeScript interfaces
│   ├── utils/
│   │   └── formatters.ts          # Currency formatting, URL & price validation
│   ├── App.tsx                    # Application router
│   ├── index.css                  # Tailwind CSS v4 + print styles
│   └── main.tsx                   # React entrypoint
└── .env.example                   # Environment variable template
```
