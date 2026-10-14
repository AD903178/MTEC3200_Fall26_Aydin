# Product Requirements Document: Night Reset

## Project Overview

Night Reset is a small, personal routine-planning app for people who lose track of time doomscrolling or gaming at night and end up going to sleep later than intended. The initial use case is helping a student wind down after evening activities and notice when scrolling is cutting into sleep.

The MVP lets a user set a target bedtime, see a wind-down cue, and record whether they went to bed on time. It is designed to add awareness and a deliberate stopping point rather than shame the user for staying up.

The research expresses a wish for social media to shut down at night. A browser-based MVP cannot reliably close or block other apps, websites, or console games, so Night Reset will not claim to enforce a curfew. Its first release will test whether a clear reminder and a simple nightly check-in are useful before considering stronger device-level controls.

**MVP outcome:** A user can set a bedtime, receive or see a wind-down reminder in the app, record the night's outcome, and review recent results.

## Target users

- Primary: A student who relaxes with video games or social media, loses track of time, and wants to get to sleep at a more regular hour.
- Secondary: Anyone who wants a lightweight, self-directed reminder to stop scrolling and begin a bedtime routine.

The MVP is intended for an individual user, not parents, schools, or employers managing someone else's device.

## Skills Required

- NextJs (required)
- Vercel (required)
- TypeScript and React
- Responsive UI development with HTML and CSS
- Browser local storage for saving the user's settings and check-ins
- Browser notification fundamentals, if notifications are included; the app must explain that browser notifications may require permission and may not work when the app is closed

AI may be used to help build the app; an AI feature is not required in the MVP.

## Key Features

### Milestone 1 — Bedtime plan

- Let the user set and edit a target bedtime and a wind-down reminder time.
- Show the target and reminder times clearly on a simple home screen.
- Save the plan on the user's device so it remains after refreshing or reopening the app.
- Work on a phone-sized screen as well as desktop.
- Provide a clear empty or first-use state and a way to change the plan without losing check-in history.

**Validation:** A first-time user can save a bedtime plan, refresh the page, and see the same plan.

### Milestone 2 — Nightly reminder and check-in

- At the selected wind-down time, show a clear in-app reminder while the app is open. If browser notifications are implemented, ask permission only after explaining why and provide an in-app alternative.
- Let the user record whether they went to bed on time, later than planned, or did not follow the plan.
- Let the user optionally record a brief note about what kept them up; do not require it.
- Show a simple recent history of check-ins and the user's bedtime target, without judgmental language.
- Allow a user to correct or delete a check-in.

**Validation:** A user can see the reminder in the supported app state, save a check-in, refresh the page, and find the entry in their recent history.

## Open questions

- Should the MVP be a voluntary reminder and tracking tool, or is preventing access to selected apps/sites a launch requirement? App/site blocking would require a different platform and is outside the browser MVP.
- Should reminders follow one bedtime every day, or support different schedules for class days and non-class days?
- Is an in-app reminder sufficient for the first test, or are browser notifications essential? Browser notifications have permission and background-delivery limitations.
- Should settings and check-ins remain only on the user's device, or should a later version support accounts and syncing across devices?
