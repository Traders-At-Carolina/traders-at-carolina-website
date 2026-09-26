# Traders at Carolina Public Website

A responsive React and TypeScript implementation of the public Traders at Carolina experience.

## Run locally

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run test
npm run lint
npm run build
```

## Public routes

- `/` — Home
- `/about` — About & Team
- `/membership` — Membership
- `/events` — Competitions & Events
- `/partners` — Partners
- `/join` — Recruitment and interest form
- `/login` — Future member authentication entry

## Content architecture

Recurring public content is defined in `src/data/siteContent.ts` using the interfaces in `src/types/content.ts`. The page components consume that data through `src/data/selectors.ts`, which enforces publication state and event date behavior.

The empty arrays in the content file are intentional. Verified statistics, people, events, photos, organizations, contact information, and social links were not supplied, so the public UI renders explicit empty states rather than fabricated claims. A future admin API can replace these exports while preserving the page structure and types.

## Before production launch

1. Connect the content selectors to the admin-backed data source.
2. Replace the prototype interest-form browser storage with a secure submission endpoint.
3. Connect authentication and role-based member/admin routing at `/login`.
4. Add approved club statistics, executive board profiles, events, photography, placements, collaborators, sponsors, social URLs, and partnership contact information.
5. Configure the deployment host to rewrite public routes to `index.html` for client-side routing.
6. Complete the final brand-design phase and replace the generated campus atmosphere image if official photography is preferred.
