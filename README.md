# Night Reset

Night Reset is a bedtime-planning app for people who want to wind down on time instead of losing track of the evening while gaming or scrolling. It is intended to provide a gentle reminder and help users notice their bedtime habits, not to block apps, websites, or games.

## Project status

The project currently contains the default Next.js starter page. The bedtime plan, reminders, and check-in features described below are planned for the MVP and are not implemented yet.

The MVP is intended to let a user:

- Set and update a target bedtime and wind-down reminder time.
- See an in-app reminder while the app is open.
- Record whether they went to bed on time, later than planned, or did not follow the plan, with an optional note.
- Review, correct, or delete recent check-ins.

Settings and check-ins are intended to stay in the browser on the user's device. Browser notifications, if added, require permission and may not be delivered when the app is closed; the in-app reminder is the alternative. The app will not claim to enforce a curfew or reliably block other apps or sites.

## Requirements

- Node.js and npm

## Run locally

From the repository root, install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available commands

Run these from the repository root:

```bash
npm run dev    # Start the development server
npm run lint   # Check code with ESLint
npm run build  # Build the production app
npm run start  # Start the production server (after building)
```

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4

## Deployment

The intended deployment target is [Vercel](https://vercel.com/). See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for deployment guidance.
