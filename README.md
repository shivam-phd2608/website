# TriBloom Farms · Farm Dashboard

Polyhouse → harvest → packhouse → grading → packing → market → sales, plus expenses,
partner capital and reports, for TriBloom Farms (Doddaballapur).

**How it runs (all free, nothing that sleeps or expires):**

| Piece | Where it lives | Cost |
|---|---|---|
| Your data | A Google Sheet in your Google Drive (shivam.phd@gmail.com) | Free (uses your 200 GB) |
| The "server" that reads/writes the Sheet and checks logins | Google Apps Script, attached to that Sheet | Free |
| The dashboard website | Cloudflare Pages, at **app.tribloom.in** | Free |
| The code | A private GitHub repository | Free |

You can open the Sheet any time and see every harvest, sale and expense as rows.
If you correct a number directly in the Sheet, the dashboard picks it up within ~20 seconds.

---

## One-time setup (about 30–40 minutes)

Do the parts in order. Each step says exactly **where** to click or paste.

### Part A · Create the Google Sheet and its script (≈10 min)

1. **In your browser**, go to <https://sheets.google.com> signed in as **shivam.phd@gmail.com** →
   click **Blank spreadsheet**.
2. **In the Sheet**, click the title "Untitled spreadsheet" (top-left) → type **TriBloom Farm Data** → Enter.
3. **In the Sheet's menu bar**: **Extensions → Apps Script**. A new tab opens with a file called `Code.gs`.
4. **In the Apps Script tab**: click inside the code area, select everything (Ctrl+A / Cmd+A) and delete it.
   Open `google/Code.gs` from this project (any text editor, or Notepad), copy **all** of it,
   and paste it into the Apps Script code area.
5. **Still in the Apps Script code area**, near the top, find this line:
   ```
   FIRST_PASSWORD: 'Change-This-Password-1',
   ```
   Replace `Change-This-Password-1` with **your own** password (8+ characters), keeping the quotes.
   This becomes your dashboard login password.
6. Click the project name "Untitled project" (top-left) → rename it **TriBloom backend**.
   Press **Ctrl+S / Cmd+S** (or the 💾 Save icon).
7. *(Optional, sets the time zone to India)* **In Apps Script**: ⚙️ **Project Settings** (left bar) →
   tick **Show "appsscript.json" manifest file in editor** → go back to **< > Editor** →
   open `appsscript.json` → replace its contents with `google/appsscript.json` from this project → Save.
8. **In Apps Script, top toolbar**: in the function drop-down (next to ▷ Run / Debug), choose
   **setupTriBloom** → click **▷ Run**.
   - A box says "Authorization required" → **Review permissions** → choose **shivam.phd@gmail.com**.
   - You'll see "Google hasn't verified this app". That's normal: it is your own script.
     Click **Advanced** → **Go to TriBloom backend (unsafe)** → **Allow**.
   - The log at the bottom shows *Execution completed*.
9. **Switch back to the Sheet tab**: you'll now see tabs like *Team, Harvest, Packing, Sales, Expenses…*
   Done: this Sheet is your database.

### Part B · Publish the script as a web app (≈5 min)

1. **In the Apps Script tab**, top-right: **Deploy → New deployment**.
2. Click the ⚙️ next to "Select type" → **Web app**.
3. Fill in:
   - Description: `TriBloom v1`
   - Execute as: **Me (shivam.phd@gmail.com)**
   - Who has access: **Anyone**
     *(This only means the dashboard can reach it. Nobody can read data without a TriBloom login.)*
4. Click **Deploy** (approve permissions again if asked).
5. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…long…/exec`.
   Keep it in a note; you'll paste it in Part D.

> Quick test: paste that URL into a new browser tab. You should see
> `{"ok":true,"app":"TriBloom dashboard API",…}`.

### Part C · Put the code on GitHub (≈5 min)

1. Go to <https://github.com> and sign in (or create a free account with shivam.phd@gmail.com).
2. Top-right **+ → New repository** → name **tribloom-dashboard** → choose **Private** → **Create repository**.
3. On the new empty repository page, click the link **uploading an existing file**.
4. Unzip `tribloom-dashboard.zip` on your computer. Open the unzipped folder, select **everything inside it**
   (the `app`, `components`, `google`, `lib`, `public` folders and the loose files like `package.json`)
   and drag it all onto the GitHub upload page.
   - Drag the *contents*, not the outer folder, so that `package.json` sits at the top level of the repository.
5. Scroll down → **Commit changes**.

### Part D · Put the dashboard online with Cloudflare Pages (≈10 min)

1. Go to <https://dash.cloudflare.com/sign-up> and create a free account (shivam.phd@gmail.com is fine).
2. **In the Cloudflare dashboard, left menu**: **Workers & Pages** → **Create application** →
   choose the **Pages** option (*"Import an existing Git repository"*) → **Connect GitHub** → allow access to
   **tribloom-dashboard** → select it → **Begin setup**.
3. On "Set up builds and deployments":
   - Project name: `tribloom-dashboard`
   - Production branch: `main`
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npm run build`
   - Build output directory: `out`
4. Open **Environment variables (advanced)** → add two variables:

   | Variable name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the Web app URL from Part B (ends in `/exec`) |
   | `NODE_VERSION` | `22` |

5. **Save and Deploy**. After 2–3 minutes you get a link like `https://tribloom-dashboard.pages.dev`.
   Open it and sign in with **shivam.phd@gmail.com** + the password you set in Part A step 5.

### Part E · Use app.tribloom.in (≈5 min + DNS wait)

1. **In Cloudflare**: Workers & Pages → **tribloom-dashboard** → **Custom domains** tab →
   **Set up a custom domain** → type `app.tribloom.in` → Continue.
   Cloudflare shows a **CNAME** record to add (target `tribloom-dashboard.pages.dev`).
2. **In Hostinger hPanel** (<https://hpanel.hostinger.com>): **Domains → tribloom.in → DNS / Nameservers** →
   **DNS records** → add a record:
   - Type: **CNAME**
   - Name: **app**
   - Points to / Target: **tribloom-dashboard.pages.dev**
   - TTL: leave default → **Add record**.
3. Back in Cloudflare, click **Check DNS records / Activate**. Usually live in 5–30 minutes (can take a few hours).
   HTTPS is set up automatically.

> Your current website at tribloom.in is untouched: only the `app.` sub-address points to Cloudflare.
> Your Hostinger *hosting* plan and your *domain* are separate. The dashboard needs only the domain
> to stay renewed.

---

## Adding your team

1. Sign in → **Settings & team → Team → + Add User**.
2. Enter name, email (any email: Gmail is fine), a password (8+ characters) and a role:
   - **Admin**: everything, including the team and settings
   - **Supervisor / Partner / staff roles**: day-to-day entries
   - **Viewer**: can look, cannot change anything
3. Share the dashboard link, their email and password with them (WhatsApp is fine). They can change
   their own password from the top-right menu → **Change password**.

- **Someone forgot their password:** Team → ✏️ Edit → type a **New password** → Save. They are signed out
  everywhere and use the new one.
- **Someone leaves:** Team → ✏️ Edit → untick **Active** → Save. They lose access straight away.
- **You (admin) forgot your password:** open the Sheet → Extensions → Apps Script → put a new password in
  `FIRST_PASSWORD` → Save → choose **resetAdminPassword** in the function drop-down → ▷ Run.

---

## Making changes later

**Small text/number/layout change in the dashboard**
1. On GitHub, open the file (e.g. `app/page.tsx`) → ✏️ pencil icon → edit → **Commit changes**.
2. Cloudflare rebuilds automatically; the change is live in ~2–3 minutes.
   If a build fails, Cloudflare keeps the previous version online and shows the error under **Deployments**.

**Bigger changes with Claude**
Download the repository (GitHub → **Code → Download ZIP**), share it with Claude with what you want changed,
then upload the changed files back to GitHub the same way as Part C (drag → Commit).

**Change to the Apps Script (`google/Code.gs`)**
1. Paste the new code into the Apps Script editor → Save.
2. **Deploy → Manage deployments** → ✏️ edit the existing deployment → Version: **New version** → **Deploy**.
   *Always edit the existing deployment*: a "New deployment" gives a new URL and you'd have to
   update `NEXT_PUBLIC_API_URL` in Cloudflare.

**Changing the web app URL in Cloudflare** (only if you ever do make a new deployment):
Workers & Pages → tribloom-dashboard → **Settings → Variables and Secrets** → edit `NEXT_PUBLIC_API_URL` →
then **Deployments → ⋯ → Retry deployment** so the new value is built in.

---

## Your data

- **Every record is a row** in the Sheet. Tabs are named for each part of the work
  (*Harvest, To packhouse, Grading, Packing, To market, Sales, Expenses, Capital in…*).
- **Grey rows 1–2 are headers.** Don't edit or delete them. Edit data from row 3 down.
- **Editing in the Sheet:** change a value and the dashboard shows it within ~20 seconds.
- **Deleting:** please delete from the dashboard rather than deleting a whole row in the Sheet.
  (A row deleted by hand disappears from the dashboard only after everyone refreshes.)
- **Tabs starting with `_`** (hidden) hold password hashes and sign-in sessions. Leave them alone.
  Passwords are never stored in readable form.
- **Backups:**
  - Google keeps automatic history: in the Sheet, **File → Version history → See version history**.
  - From the dashboard: **Settings & team → Defaults & Reset → Download backup** saves everything as one file.
  - Monthly habit: **File → Make a copy** of the Sheet.
- **Never share the Sheet itself** with team members. They only need their dashboard login.

## Limits (plenty for one farm)

A Google Sheet holds up to 10 million cells, which is decades of farm records. Google's free
Apps Script limits are far above what a farm team of 10–20 people uses in a day. Saves take about 1–2 seconds;
the badge in the top bar shows *Saving… / Saved*.

---

## For developers

- Next.js 16 (App Router) + React 19 + Tailwind v4, exported as a static site (`out/`).
- `lib/cloud.ts`: talks to the Apps Script web app (login, load, save diffs, poll for changes every 20 s).
- `lib/store.tsx`: app state; every change goes through `saveState()` → `pushChanges()`.
- `google/Code.gs`: the backend. One tab per collection, row 1 headers, hidden row 2 types,
  salted SHA-256 password hashes, 30-day sessions, admin-only collections, viewer role read-only.
- **Run on your own computer:** `npm install`, copy `.env.example` to `.env.local`, paste the `/exec` URL,
  then `npm run dev` → <http://localhost:3000>. With `NEXT_PUBLIC_API_URL` left empty, the app runs in
  demo mode (data only in that browser; login `shiva@tribloom.in` / `Password@123`).
