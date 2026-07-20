# Deployment Note

- Date: 2026-07-20
- Change: adjusted vercel.json to use Vercel's static-build so Vite's `npm run build` runs and dist is served.
- Purpose: Trigger a new commit to cause Vercel to redeploy the site with the correct build step.

If the site still shows a blank page after deployment, open the browser console and check for missing JS files or environment variable errors, then share the console output here and I'll fix them.