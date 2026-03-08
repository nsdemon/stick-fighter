# Fix 404 on Vercel — Where to Find Root Directory

Root Directory is under **Build & Deployment**, not General.

1. Open your project on [vercel.com](https://vercel.com).
2. Click **Settings** in the top nav (or the project’s **Settings** tab).
3. In the left sidebar, click **Build and Deployment** (or scroll until you see it).
4. On that page, scroll down. You’ll see **Root Directory** with an input (often “Leave empty to use repository root”).
5. If your game files (`index.html`, `game.js`, `styles.css`) are in a subfolder (e.g. `stick fighter`), type that folder name there (e.g. `stick fighter`).
6. Click **Save** and redeploy (Deployments → … on latest → **Redeploy**).

---

**Easier option:** Put the game at the **root** of your Git repo (so the repo root contains `index.html`). Then you don’t need to set Root Directory at all — leave it empty.
