# Sunday Funday Dance Competition 2026

React + Vite + Supabase participant registration portal. Includes a **General Mechanics** button that opens the supplied official mechanics in a readable scrollable window.

## Setup
1. Install Node.js LTS.
2. Copy `.env.example` to `.env` and add your Supabase URL and publishable key.
3. Put the official City Government of Ligao seal at `public/logo.png`.
4. Run `npm install`, then `npm run dev`.

## Important before accepting registrations
- Populate `albay_barangays` for the eight selected localities using verified PSA PSGC records.
- The mechanics file provided contains section numbering gaps (VI, VII, X are absent) and no detailed penalties section; the modal reproduces the provided content without inventing missing sections.
- Confirm the SQL RPC and age validation with test records before launch. Review consent wording with the LGU Data Protection Officer.
- Never expose a Supabase service-role key in frontend code.
