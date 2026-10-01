# Traders at Carolina

Website for Traders at Carolina, UNC's quantitative finance club. Built with Next.js (App Router), TypeScript and Tailwind CSS, statically generated and deployed on Vercel.

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # Vitest
pnpm typecheck
pnpm lint
pnpm build
```

`/styleguide` (not indexed) renders every design token and shared component.

## Updating content

Club officers only need to edit files in `content/`:

| File | What it controls |
|---|---|
| `content/site.ts` | Mission line, contact email, social links, recruiting status and dates |
| `content/nav.ts` | Header and footer navigation |

### Each recruiting cycle

In `content/site.ts` → `recruiting`:

1. Set `applyUrl` to the new Google Form and `applicationsOpen: true`.
2. Set `applyDeadline` (`"YYYY-MM-DDTHH:mm"`, Eastern time).
3. Redeploy.

At the deadline, also set the Google Form to **Not accepting responses**. Apply buttons switch to the closed state automatically on the next build after the deadline.

The build fails with a clear message if the recruiting config is invalid (for example, applications open without a Google Forms URL).

## Specs

Design and page specs live in `docs/specs/`:

- `00-vision-and-style.md` — brand, tokens, typography, shared components (implemented)
- `01-home.md` … `05-apply.md` — page specs

## Pending from the club

- Logo files (SVG) — the header currently uses a typeset wordmark (`components/Wordmark.tsx`).
- Contact email, Instagram and LinkedIn URLs.
- Whether UNC requires a student-organization disclaimer in the footer.
