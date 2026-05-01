# Guitar Tuner Design Doc

## What This Project Is

An open-source, mobile-first guitar tuner that feels instant and modern, works entirely in the browser, uses the user's microphone, and stays simple enough that a player can open it and tune in seconds.

The repo is currently a Vite+ starter, so this project still has a clean shot at being opinionated from day one instead of inheriting accidental complexity.

## Product Thesis

Most browser tuners are either ugly utility pages, ad-heavy SEO traps, or cluttered "all features at once" tools. The opportunity here is to build the clean open-source tuner people actually bookmark, share, and trust.

The winning version is:

- Fast enough to feel live.
- Simple enough for a beginner.
- Deep enough for alternate tunings and serious players.
- Static-hostable on GitHub Pages.
- Good enough on mobile that it becomes the default pocket tuner.

## Who It Is For

- Beginners who just need standard tuning without learning music theory first.
- Intermediate players exploring drop tunings, DADGAD, open tunings, 7-string, and baritone setups.
- Teachers who want a clean tool to send students.
- Open-source contributors who want a browser-based audio app worth improving.

## The Core User Promise

"Open the site, allow mic access, pluck a string, and immediately see what string the app thinks it is, how many cents sharp or flat you are, and when you're locked in."

## The Wow Version

The exciting version is not "a tuner with more menus." It's a tuner that feels musically aware.

- It guesses the string you meant.
- It highlights the target note inside the selected tuning.
- It visibly locks when the note stabilizes.
- It stays calm in noisy rooms instead of flickering everywhere.
- It makes alternate tunings feel first-class, not buried.

That turns it from a utility into a tool people recommend.

## Product Principles

- One primary action per screen.
- Progressive disclosure: the default view is minimal, advanced controls live one tap away.
- Tuning first, settings second.
- Visual confidence matters as much as raw detection accuracy.
- Zero backend dependency for the main experience.

## UX Shape

## Home Screen

The first screen should show only the essentials:

- Current detected note.
- Selected tuning name.
- Six string targets as tappable chips.
- A large cents meter with a dead-center "in tune" zone.
- Mic permission state.
- A small button to open tuning library.

The feeling should be closer to a camera app than a dashboard.

## Main Tuning Flow

1. User opens the site.
2. User taps `Enable Mic`.
3. UI shifts into active listening state.
4. User plucks a string.
5. App detects pitch, maps it to the nearest valid target in the current tuning, and shows confidence.
6. When the pitch is stable and close enough, the string chip glows and the meter locks visually.

## Advanced Controls

Advanced features should live in a bottom sheet or drawer, not the default canvas.

- Tuning library.
- Custom tuning builder.
- A4 calibration.
- Manual string select / auto-detect toggle.
- Noise reduction sensitivity.
- Left-handed layout toggle.
- Dark/light/system theme.
- Reference tone playback.

## Feature Set

## Must-Have v1

- Standard tuning preset.
- Alternate tuning presets.
- Microphone input via Web Audio API.
- Real-time pitch detection.
- String detection within the selected tuning.
- Large cents meter.
- In-tune lock state.
- Mobile-first responsive layout.
- GitHub Pages deployment.
- Offline-capable static asset caching.

## Strong v1.1 Features

- Preset packs: standard, drop, open, modal, 7-string, bass.
- Favorites or recently used tunings.
- Custom tuning creation and local persistence.
- Reference tone for each string.
- "Too noisy" guidance when confidence drops.
- Haptic feedback on supported mobile devices when a string locks in tune.

## Bells And Whistles That Actually Matter

- Pitch history trail over the last 1-2 seconds so users can see whether they are overshooting.
- Auto-lock on a detected string, with a quick way to override.
- "Tune all strings" mode that advances focus as each string locks.
- Capo helper that explains effective pitch targets.
- Shareable tuning URLs so a teacher or bandmate can send a preset.

## Features To Avoid Early

- Accounts.
- Cloud sync.
- Social feed features.
- AI coaching features.
- Chord recognition or song detection unless the tuner is already excellent.

Those are distraction magnets.

## Tuning Model

Tunings should be treated as product data, not hardcoded UI constants.

Each tuning definition should include:

- Name.
- Instrument family.
- String count.
- Ordered target notes.
- Optional aliases.
- Category.
- Optional description.

Examples:

- Standard: `E2 A2 D3 G3 B3 E4`
- Drop D: `D2 A2 D3 G3 B3 E4`
- DADGAD: `D2 A2 D3 G3 A3 D4`
- Open G: `D2 G2 D3 G3 B3 D4`

This keeps the system ready for guitar-first now and bass/ukulele/7-string later without a rewrite.

## Pitch Detection Strategy

The app lives or dies on pitch stability.

Recommended direction:

- Use the Web Audio API for mic capture and analysis.
- Start with a proven monophonic pitch-detection approach like YIN or autocorrelation.
- Smooth input over a short rolling window so the meter feels stable, not sticky.
- Ignore low-confidence frames.
- Snap string suggestions only to targets in the active tuning.

The key product trick is not just detecting frequency. It is translating noisy frequency into calm musical intent.

## Interaction Details That Matter

- On first load, show a permission explainer before the browser prompt so users know why mic access is needed.
- If mic access is denied, keep the UI useful with a clear retry path and a reference-tone-only fallback.
- When no stable pitch is detected, say `Pluck one string` instead of showing random notes.
- When multiple strings are plausible, show confidence instead of pretending certainty.
- When the user manually taps a string, bias detection heavily toward that target until they change it.

## Visual Direction

The UI should feel like a modern instrument panel, not a skeuomorphic tuner pedal and not a generic SaaS card layout.

- Full-screen mobile layout.
- Dark-first aesthetic with high-contrast note readout.
- One accent color used sparingly for active, in-tune, and focus states.
- Big typography for the detected note.
- Smooth, low-latency animation on the cents needle or bar.
- Subtle glow on lock, not celebratory confetti.

The page should look calm under pressure. Tuning is already a noisy experience.

## Accessibility

- All controls reachable without precise taps.
- Color is never the only signal for sharp/flat/in-tune.
- Reduced motion support.
- Clear permission and error copy.
- Screen-reader labels for selected tuning, detected note, and current status.

## Technical Direction

- React for stateful UI and component structure.
- Vite+ for dev/build/check flow.
- Strict TypeScript-first domain model.
- Browser-only architecture so GitHub Pages hosting stays trivial.
- Local persistence with `localStorage` for selected tuning, calibration, and favorites.
- Optional PWA shell later for better install/offline behavior.

## TypeScript 7 Note

Your brief says TypeScript 7, but this starter is currently on `typescript ~6.0.2`. The design should assume strict typing and modern TS patterns now, then upgrade to TS 7 as soon as the toolchain supports it cleanly. Do not contort v1 around speculative TS-only features.

## GitHub Pages Constraints

- No backend processing.
- Everything must run client-side.
- Microphone access requires HTTPS, which GitHub Pages provides.
- Routing should stay simple unless the app uses hash routing or a Pages-safe SPA fallback.

This is a good fit for the product. A tuner should not need a server.

## Proposed Information Architecture

- `Tune`: the default screen.
- `Tunings`: searchable preset library.
- `Custom`: create/edit saved tunings.
- `Settings`: calibration, theme, handedness, detection behavior.
- `About/Open Source`: GitHub link, contribution path, browser support.

## MVP Cut

If the goal is to ship something lovable quickly, the MVP should be:

- One beautiful tuning screen.
- Standard, Drop D, DADGAD, Open G, Open D presets.
- Accurate single-note detection.
- Auto string suggestion in the active tuning.
- Manual string override.
- Strong mobile UI.
- Local persistence.

That is enough to be real.

## First Demo That People Will Share

The first version worth showing is not just "it detects pitch." It is:

- Open on phone.
- Grant mic.
- Pluck string.
- See note snap correctly.
- See the exact string in the chosen tuning light up.
- Flip to Drop D and watch the target system adapt instantly.

That is a demo.

## Open Source Angle

The open-source story should be part of the product, not an afterthought.

- Tuning definitions should be easy for contributors to add.
- The repo should welcome new preset packs and instrument families.
- The app should have a visible `Suggest a tuning` or `Contribute presets` path.
- The architecture should separate DSP logic from UI so contributors can improve either side independently.

## Risks

- Pitch jitter makes the app feel broken even if the math is technically correct.
- Overloaded UI kills the "simple and modern" promise.
- Mobile Safari mic quirks can dominate support burden.
- Trying to support every instrument immediately can dilute the guitar-first experience.

## Success Criteria

- A first-time user can tune one string within 10 seconds of load.
- The default screen needs no explanation.
- Alternate tunings feel one tap away, not hidden.
- The app works well enough on phone speakers and normal room noise to be trusted.
- Contributors can add a tuning preset without touching rendering logic.

## Recommended Build Order

1. Lock the tuning data model.
2. Prove stable pitch detection with a dead-simple UI.
3. Design the main mobile tuner screen around confidence and lock states.
4. Add preset library and string mapping.
5. Add custom tunings and persistence.
6. Add polish features like reference tone, favorites, and haptics.

## Sharp Product Call

Do not build "the most feature-rich browser tuner."

Build "the cleanest tuner on the web that happens to go deep."

That is the version people keep using.
