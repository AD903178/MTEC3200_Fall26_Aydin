# Project Instructions

Read this file before every task.

## About This Project

[One sentence describing the app.] See `PRD.md` for full details.

## Stack

- Next.js (App Router), React
- Tailwind CSS
- [Component library, e.g. shadcn/ui]
- Data: [fake data in /data for now. No database yet.]
- APIs: [list any, or "none"]

## Commands

- Run: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Code Style

- Use TypeScript.
- One component per file.
- Put reusable components in `components/`.
- Use Tailwind classes. No separate CSS files. Prefer Tailwind's spacing utilities over arbitrary pixel values for spacing and sizing; reserve arbitrary values for custom typography or layout geometry that has no suitable utility.
- Use clear, descriptive names.
- Put sections into their own component, so that code is easy to read from a top-level and put them inside `components/`.

## Rules

- Don't add dependencies without asking. Components from [component library] are the exception.
- Use components from [component library] before building new ones.
- Add [component library] components as needed. List each one in `docs/components.md`.
- Build one screen at a time.
- Read `PRD.md` before adding any feature. Don't add features that aren't in it.
- Don't change working screens unless asked.
- Never commit `.env.local` or API keys.
- Update `PROGRESS.md` after each task.

## How to Talk to Me

- I am a student with limited coding knowledge. Explain things to me knowing my level.
- Keep explanations short.
- Tell me which files you touched.
- Stop after each task so I can test it manually.