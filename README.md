# Sunday Funday Dance Competition 2026

React + Vite + Supabase registration portal with an authenticated competition admin dashboard and General Mechanics.

## Published URLs

- Registration: https://cswdoligaocity.online/sundayfundaydancecompetition/
- Admin: https://cswdoligaocity.online/sundayfundaydancecompetition/#admin
- The domain root redirects to the registration portal.

## GitHub Pages deployment

The GitHub Actions workflow builds the Vite app with the base path `/sundayfundaydancecompetition/`, publishes the app inside that directory, retains the custom-domain `CNAME` file at the published root, and creates a root redirect page.

Repository secrets required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not add a `CNAME` file under `public/`; the workflow creates it at the published root.

## Local development

1. Install Node.js LTS.
2. Create a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Run `npm run build` to verify a production build.
