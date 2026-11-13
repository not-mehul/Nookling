<p align="center"><img src="assets/icon-source.svg" width="88" height="88" alt=""></p>

<h1 align="center">Nookling</h1>

<p align="center"><em>A small round friend, kept in a warm corner of your phone.</em></p>

<p align="center">
  Android&nbsp;·&nbsp;<a href="https://github.com/not-mehul/Nookling/releases/latest">Latest release</a>&nbsp;·&nbsp;MIT&nbsp;·&nbsp;Created by <strong>Mehul Sen</strong>
</p>

---

Nookling is a virtual pet for Android: a perfectly round ball of fluff with enormous eyes and a tiny smile that lives in a lamp-lit nook. It is an idle companion, never a chore: something fun for a spare minute, happy whenever you drop by, and fine while you're busy. It never dies and never guilt-trips.

> Version 0.5.0. Cozy mode is the default; Tamagotchi mode, in Settings, brings back the classic needs and reminders.

## Features

### Cozy or Tamagotchi

- **Cozy** (the default): needs never fall below a comfortable floor, health never drops, messes are rare and it tidies up after itself. Instead of reminders it sends the odd invitation with good news, and instead of a needs chart the Nook shows the day's little moments.
- **Tamagotchi**: four needs as meters, reminders when it needs you, and an optional Gentle mode. Switch any time in Settings.

### Your nookling

- **One original creature**, drawn in the suite's style from shared colour tokens, so it looks at home in Dusk and in Dawn.
- **It grows up.** A seedpod hatches in the first session, becomes a sprout, then a full nookling, then one of four grown forms chosen by how it was cared for. Time away never holds it back.
- **It sleeps when you do**, from the bedtime and wake time you set.
- **Touch it.** Tap to boop, stroke, tickle, hold for a cuddle, drag food to its mouth, scrub it clean. Shake the phone and it wobbles, dizzy.

### While you are away

- **It goes foraging.** Every few hours apart it finds something: a button, a shell, a four-leaf clover, some only in their season. Open the bundle when you're back; each find goes in the **Treasures** book.
- **Little moments.** Come back after a while and you might catch it chasing a moth or napping in a sunbeam. Each one goes in the Journal.
- **Visitors.** Five original critters drop by now and then. Some ask a small favour, which brings a thank-you find; waving goodbye is always fine.
- **Away mode** leaves it with a sitter for up to two weeks.

### Play

- **Nine games**, each a minute or so: Catch, Bubbles, Keep it up, Memory match, Puddle fishing, Pebble stack, Humming (rhythm), Hide and seek and Echo. Best scores are kept, and one is the game of the day, with a small extra and nothing lost by skipping it.
- **Tricks.** Swipe a pattern three times to teach it a bounce, a twirl or a somersault; it shows off what it knows.
- **Chat.** It asks little questions in picture bubbles. Pick one of three replies; it remembers, and brings your answers up later.
- **Fidget.** Stretch it, squish it, let go: boing.

### Make it yours

- **Decorate the nook** with a rug, a lamp, fairy lights and more, earned by playing and finding, never bought. Drag them where you like; the pet uses them.
- **A garden** of three plots in the Pantry. Seeds grow in real time and never wilt, and each first harvest adds a new food.
- **A wardrobe** of hats, scarves and glasses; seasonal ones turn up in their season.
- **Photo mode**: backdrops, poses and stickers, saved to the Journal's album.

### Quiet time

- **A window** with the sky as it is now and the weather, and a soft ambient sound to match.
- **Breathe with me**: in as it grows, out as it settles.
- **A bedtime story** made from a friend, a place and a thing you pick, then a tuck-in.

### Beyond the app

- **A home-screen widget** with the pet, its name and how it is.
- **The other apps.** Cook something in [Mise](https://github.com/not-mehul/Mise) and offer the dish to its Pantry; finish a book in [BookShelf](https://github.com/not-mehul/BookShelf) and give it a copy to read. Nookling always asks before keeping either.

### Your data

- **Backups** as one zip, with the treasures, garden and everything else, and **Dusk and Dawn themes**.
- **A little delight**: soft chirps, celebrations for real milestones, the seasons drifting past the nook, and easter eggs, counted in Settings. All of it respects reduced motion.

## Private by design

The pet lives on the phone. Nookling has no account and no server, and it doesn't even ask for network access.

## Install

Download the signed APK from the [latest release](https://github.com/not-mehul/Nookling/releases/latest) and open it on your phone. The same app also runs in a browser for trying it out.

## The Dusk & Dawn apps

Nookling is one of seven apps by Mehul Sen that share one design system, [Editorial Dusk & Dawn](https://github.com/not-mehul/dusk-dawn), and a common link scheme, so they can hand things to each other.

| App | What it is for |
|---|---|
| [Waymark](https://github.com/not-mehul/Waymark) | Your whole trip, offline: flights, stays, plans and costs on one timeline |
| [BookShelf](https://github.com/not-mehul/BookShelf) | Books, films, shows and the lines worth keeping |
| [Ledger](https://github.com/not-mehul/Ledger) | A record of cities, scored on what matters to you |
| [Colophon](https://github.com/not-mehul/Colophon) | Inspect, fix and rebind EPUB editions |
| [Rosetta](https://github.com/not-mehul/Rosetta) | A quiet library and reader for books, papers and notes |
| [Mise](https://github.com/not-mehul/Mise) | Recipes from anywhere, cooked one step at a time |
| [Nookling](https://github.com/not-mehul/Nookling) | A small round friend to feed, play with and put to bed |

## Build from source

Svelte 5 and TypeScript, built by Vite, with Dexie for storage, in a Capacitor 8 Android app. You need Node 22.12 or later, plus JDK 21 and Android Studio for the app.

```sh
npm install
npm run dev          # http://localhost:5173
npm run check        # contrast, lint, literal colours, typecheck, unit tests
npm run android      # build, sync and open Android Studio
```

[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) covers the scripts, the project layout, how time passes for the pet, and the phases. [RELEASING.md](RELEASING.md) covers signing and releases.

## Credits

Nookling is designed and built by **Mehul Sen** ([@not-mehul](https://github.com/not-mehul)).

- Libraries: Dexie (Apache 2.0), fflate (MIT), Capacitor (MIT) and [Lucide](https://lucide.dev) icons (ISC).
- Fonts and design: Fraunces (SIL Open Font License) through [dusk-dawn](https://github.com/not-mehul/dusk-dawn).
- The nookling, its food and its sounds are original to this app.

## Licence

[MIT](LICENSE) © 2026 Mehul Sen.
