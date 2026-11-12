# Developing Nookling

Nookling is built like its siblings, and Mise in particular: Svelte 5 and TypeScript, Vite, Dexie over IndexedDB, Capacitor 8 for Android, and the shared design package [`dusk-dawn`](https://github.com/not-mehul/dusk-dawn). Everything visual comes from that package; this repository only places it.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | The app in a browser at http://localhost:5173 |
| `npm run check` | Contrast (`dusk-dawn check`), ESLint, no literal colours (`dusk-dawn colours`), `svelte-check`, Vitest |
| `npm run test:e2e` | A production build, then the Playwright tests at phone size, with axe in both themes |
| `npm run icons` | Renders every launcher icon from `assets/icon-source.svg` |
| `npm run sync` / `android` | Build and copy into the Android project / and open Android Studio |

If Playwright can't find its browser, point it at one with `PLAYWRIGHT_CHROMIUM_PATH`.

## Layout

| Path | What lives there |
|---|---|
| `src/domain/` | Plain, tested logic with no Svelte or browser APIs: settings and, later, the needs simulation |
| `src/data/` | The Dexie database |
| `src/state/` | Reactive state (`*.svelte.ts`) the components read |
| `src/platform/` | Capacitor and browser edges: theme, links between the apps, files, notifications |
| `src/pet/` | The nookling's drawing and behaviour |
| `src/components/` | Screens and their parts; `ui/` holds small shared pieces |
| `src/i18n/` | Strings. English first, in Mise's structure so more languages can follow |

## Links between the apps

`src/platform/links.ts` is the suite's shared file (style.md §14.1), with `nookling` added to `APPS`. Nookling answers `nookling://open`, which only brings it to the front. The other six apps add `nookling` to their copy of `links.ts` and their `<queries>` when the first hand-off to Nookling is built.

## Phases

The app is built in phases, each one committed and working on its own:

1. dusk-dawn 2.2.0: pet tokens, the need meter and the living-subject rule
2. Scaffold: this repository, CI, release, icon
3. The pet: its SVG rig, expressions and forms, and a character sheet
4. The simulation and the database
5. The Nook: the live pet, meters and care actions
6. Touch, the Pantry, haptics and chirps
7. Reminders
8. Growing up: hatching, stages, traits and forms
9. Journal, Play and backups
10. Easter eggs, then v0.1.0
