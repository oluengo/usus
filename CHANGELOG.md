# Changelog

All Usus versions. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); [SemVer](https://semver.org/) numbering (MAJOR.MINOR.PATCH).

## [3.8.0] — in testing (beta)

- Countdown notification (APK): while you train, the session and the rest or timed set carry on in a notification, with Pause and Skip, and it alerts you when time is up even if you leave Usus or turn the screen off. Android will ask for notification permission; turn it off in Settings → Alerts.
- When a session ends, “Post on Nostr” right away, if you have an account connected.
- Today: “Week 11 of 16” as the title with the variant below as a coloured label; all of today's routines, the Daily one too, with the same “Start” button.

## [3.7.2] — 2026-11-07

- Nostr backup by sections: routines and plans, workouts and progress, diary, weight and cycle, and settings. When saving and restoring you choose which.
- The backup, on Nostr and as a file, now also carries your settings (equipment, catalogue, timers, progression, theme, language…) and the history of exercise move-ups.
- Each profile keeps its own Nostr backup: another profile's or the web's no longer overwrites yours. The automatic backup only saves what has changed.

## [3.7.1] — 2026-11-07

- Nostr on the web: sign in with your browser extension (Alby, nos2x…), as well as with a bunker.
- Nostr with just your npub: read-only, your profile shows but there are no backups or posting.

## [3.7.0] — 2026-11-06

- Before starting: below “Start”, the equipment the routine needs, in one line. Anything not in “My equipment” is marked. It shows even with the catalogue turned off.
- ⇄ Swap exercise: first those in its progression (harder and easier) and similar movements at a close level; the whole catalogue, folded below.
- Nostr: automatic backup after every session and, when you open Usus, a notice if there's a newer backup on Nostr (from another phone or the web). Turn it off in Settings → Data and backups.
- Settings grouped in blocks like in Wavestr, with a new “Nostr account” section: your picture, name and verification, plus the public key and Lightning to copy.
- Nostr in the APK: sign in with Amber, the Nostr signer for Android, like in Wavestr; on the web or without Amber, with a bunker.
- Moving up: choose after how many sessions on target it's suggested (1 to 5; 2 by default) in Settings → Workout.
- Timed sets: in “How many seconds were you short?” the numbers no longer carry an “s”.

## [3.6.0] — 2026-11-04

- Nostr (optional): connect your account with a bunker (Amber, nsec.app…) in Settings → Profile; the backup is in Settings → Data and backups. Usus never sees your private key and, without Nostr, connects to nothing.
- Backup on Nostr: the full backup, compressed and encrypted so only you can read it. “Save backup to Nostr” and “Restore from Nostr”, for example to move your data to another phone.
- Post on Nostr: the workout (text and, if you like, its image) and your routines or plan with their link. You see and edit the note before posting.
- The APK now asks for Internet permission, used only for Nostr.

## [3.5.2] — 2026-10-30

- What was missing in each set: the question is now “How many were you short?” (or how many seconds, in timed sets) and it's subtracted from what you did. So the suggestion to move up and the summary count what you really did. Unanswered, the set counts as complete.
- Cards from suggestions: in “Ready to step up” (or down) and in the ⇄ Swap exercise suggestions, tap the name or ⓘ to see what the exercise is about.

## [3.5.1] — 2026-10-26

- Share to Usus: from your AI app, Share menu → Usus takes its reply (text or file) to the review, with no copy and paste. In the APK and in the web app installed on Android.
- Unanswered RIR: if you haven't marked how many you had left when the rest ends (or how much longer you could have held, in timed sets), it counts as 0. With “×” the set stays without a value.
- Windows: the title sits right at the top (content no longer peeks above it when scrolling) and has more room before what follows.
- After an update, instead of the what's new window there's a short notice that hides by itself. What's new is still in Settings → About (tap the version).

## [3.5.0] — 2026-10-24

- Restart the plan: from the plan's ⋯ menu in Today or in Library → Plan, it goes back to week 1 from today, with no chosen week or pauses. Your routines, sessions and history are not touched. When a plan ends, Today offers it.
- New profile: the exercise catalogue is chosen in the same form. Once created, Usus switches to it with no more questions and tells you you're now on the new profile. With a session in progress, it asks you to finish it first.

## [3.4.0] — 2026-10-23

- Rest between exercises: below “Next”, the upcoming catalogue exercise with its short card folded; open it to see what it's for and how to do it (with your note if it has one) and a link to the full card.
- First use: “Skip the intro” in the welcome wizard. It accepts the notice, leaves the catalogue on and goes straight to the app.

## [3.3.0] — 2026-10-20

- Create plan with AI (Library → Plan and Progress → Summary): in 4 steps (about you, what you're after, your week and for the AI) Usus prepares instructions with your data, how the AI should reply and the catalogue link, with each exercise's recommended range and joints. Copy or export them, paste them into your AI and its reply comes back to Usus to review before importing.
- Clear warnings: an AI isn't a coach or a health professional, and you'll be sharing health data with an external service. Usus sends nothing. “Remember my answers” keeps the form filled in for next time.
- When adding a received or AI plan, if its variant letters are already used by your routines, they're changed to free ones so plans don't get mixed.
- AI reply in one tap: copy its reply (or just its code block) and tap “Paste the AI's reply”. If you save it as a file, Import data also takes it to the review.
- Windows with one design: title at the top with ✕ to close, always in the same place; steps with a progress bar and Back/Next at the bottom. When you close a half-finished process, Usus tells you whether it's lost or saved. In Create plan with AI you can now choose your sex.

## [3.2.0] — 2026-10-20

- Guided plan: a few questions (goal, days, minutes, equipment, aches and level, with a quick test or your own choice) and Usus suggests catalogue routines at your level, with warm-up, main work, accessories and cool-down. Review the suggestion, move each exercise up or down its progression, and the routines (variants A and B) and an in-order plan are created.
- Cards from anywhere: tap the name of a catalogue exercise in a routine, before starting or in the Diary to see how it's done. If the profile doesn't have the catalogue turned on, you're asked to turn it on.

## [3.1.0] — 2026-10-20

- Complete catalogue: 106 new exercises (268 in total). Progressions without gaps, single-level families now with an entry and a next step, and new blocks for rings, parallel bars, grip, handstand, mobility and stretching, warm-up, balance and cardio.
- Cardio, a new movement type in Exercises, and jump rope, a new piece of equipment.
- Each card shows its role (main, accessory, mobility, warm-up or cardio), the recommended range per set and the joints it loads most. When you add an exercise from the catalogue, reps or seconds start in the middle of that range.

## [3.0.0] — 2026-10-20
- New layout: Today · Library · Diary · Progress · Settings. Library brings together Routines, Plan and Exercises; Stats is now called Progress.
- Today: what's on, at the top with a single Start button; shortcuts to another routine, a free session and an activity; reminders together under “To do”.
- Routines grouped by variant. Each routine opens on its own screen (on a computer, next to the list) with Start, Edit, Print, Share and Duplicate.
- The progression plan moves from Today to Library → Plan, next to the routines it uses.
- Cleaner Today: what's on, the plan week in one line (tap to see it) and a ⋯ menu to deload this week or pause the plan for 1 to 4 weeks. “Routines and days” are chosen inside the plan itself.
- In-order plans: today is the next session still to do, whatever the day; if you start on a Sunday or miss a day you catch up, and the plan week moves on when all are done. Your plans switch to this mode automatically from the week you were on, and when editing them you can go back to an earlier week to catch up.
- Training: a fixed header with time and progress, bigger sets and a bottom bar with the next action (mark the set, start the countdown, next exercise or finish).
- Progress: the Summary is now four cards (this week, consistency, records and weight), each linking to its details; figures and charts share one style, and period notes move to Habits.
- Diary in rows: each item of the day in a row with its icon, detail and value (training first); anything missing goes under “Add to this day”. Weight is logged here.
- Settings in groups, each with its own screen: Profile, Workout, Alerts, Appearance and language, Data and backups, and About. Switches to turn options on.
- More compact routine editor on phones: one row per exercise with its summary; tap it to open the details.
- Unified style: one kind of tabs, buttons with fixed sizes and dialogs as bottom sheets on phones. Purple is now only for AI.
- Guided first run in steps: language and notices, catalogue, equipment and how to start (create your first routine or import a backup).
- Translations move to standard files (gettext) so the app can be translated from the browser.
- Fix: adding a received plan keeps its progression rule, and the previous active plan is saved in My plans.

## [2.5.0] — 2026-10-17
- Routine design mode: sections, supersets and circuits (rounds, rest between rounds), reorder with ↑ ↓ or by dragging, estimated duration.
- Supersets and circuits while training too, with the current round in view and the countdown chained.
- Edit mode for PC or large screens (turns on by itself): one row per exercise, catalogue alongside and a fixed bar with Save.
- Desktop: sidebar for sections; Routines with the list on the left and the selected routine on the right; catalogue in a grid.
- Print / PDF: one sheet per exercise (or two per sheet) or a weekly sheet with 6 sessions.
- Countdown rebuilt: get-ready, set, side switch (adjustable), rests; three sounds (tick, start, end); vibration always follows alerts; screen stays on for the whole session.
- RIR for timed sets; clearly visible “Exercise done”; notes editable on finished sessions.
- Several plans: one active and the rest saved (activate, duplicate, delete).

## [2.3.0] — 2026-10-14
- Notes in Stats: an orange dot on days with a note (Consistency, Load, Weight, Sleep, Steps, each exercise's progress); tap it to see everything logged that day.
- “Didn't train” days marked in Consistency; “Notes for the period” in every tab; each exercise's notes in its history.
- Android app: Settings → App → Updates.

## [2.2.2] — 2026-10-13
- First Android app release (APK), in Releases: the same app, with its data kept apart from the PWA's. One permission only (vibration), no Internet. Can be updated with Obtainium.
- Catalogue cards in Catalan and English; exercise names in Catalan.
- Softer sound alerts.
- “Built with AI · tested by humans” and a privacy page.

## [2.2.1] — 2026-10-13
- Exercise technique (tempo, pause, range, grip): same card, separate history and progression.

## [2.2.0] — 2026-10-13
- Session effort (RPE 1–10) and weekly load; optional RIR per set.
- Swap an exercise for one session only, and notes per exercise.

## [2.1.0] — 2026-10-13
- Analyse with external AI: a text with instructions and your data for the AI you use (report with charts and an A4 PDF). Optional data for the analysis.
- Data as CSV: a .zip with one table per data type.

## [2.0.0] — 2026-10-12
- Optional exercise catalogue per profile (cards, equipment, level and progression), linking your exercises, and my equipment.
- Progression assistant: suggestions to step up or go back after a session, and automatic increases in the plan's ↑ week.

## [1.4.0] — 2026-10-12
- Training alerts in Settings → App: sound and vibration, sound only, vibration only or off.

## [1.3.1] — 2026-10-12
- Works offline again (the service worker had been empty since 1.2.1).

## [1.3.0] — 2026-10-12

When you receive a routine you already have, you can update it instead of duplicating it.

## [1.2.2] — 2026-10-12

Switching profile keeps you on the same screen.

## [1.2.1] — 2026-10-12

Settings reorganised into tabs (Workout, Body, App, Data).

## [1.2.0] — 2026-10-12

Independent profiles on the same phone (own data, settings and backup), optional period log on women's profiles, copying routines between profiles, and links to the source code and to report problems on GitHub.

## [1.1.0] — 2026-10-11

Sharing: the app from Settings, a workout as an image or text, and routines or the whole programme with an optional plan, by link or file, with no servers. Automatic theme by default and a new icon.

## [1.0.0] — 2026-10-11

First public release: routines with rep- or time-based sets, chained countdowns with optional auto-start, session pause, progression plan with a Today screen, diary (sleep, supplements, steps, activity, notes), weekly weight, optional cycle tracking (approximate estimate, off by default), configurable stats, JSON/CSV backups, three languages and offline use. Data stays on the device.
