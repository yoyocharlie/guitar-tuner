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

## Decisions to confirm

`/autoplan` normally pauses after the CEO premise pass for human confirmation. This environment does not expose the interactive question tool, so these defaults are documented instead of being confirmed inline.

- Keep the product wedge guitar-first for v1, even though the tuning model already supports bass and 7-string.
- Treat custom tunings, favorites, and reference tone as in-scope v1 features because the current code already ships them and they stay inside the existing blast radius.
- Keep GitHub Pages and browser-only architecture as hard constraints.

## GSTACK REVIEW REPORT

| Phase       | Status    | Verdict            | Notes                                                                                                                                                |
| ----------- | --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| CEO         | Completed | DONE_WITH_CONCERNS | Strong product direction, but the plan is underspecified on Safari microphone failure and the actual MVP boundary.                                   |
| Design      | Completed | DONE_WITH_CONCERNS | Visual direction is sharp, but first-run permission UX and denied-state fallback are not designed deeply enough.                                     |
| Engineering | Completed | DONE_WITH_CONCERNS | Current architecture is viable, but the plan misses a delivery step for cross-browser audio verification and audio-context lifecycle constraints.    |
| DX          | Not run   | OUT OF SCOPE       | This is a consumer web app, not a developer-facing product.                                                                                          |
| Overall     | Completed | DONE_WITH_CONCERNS | Good plan with a clear product thesis. Needs sharper handling for permission failure, unsupported browsers, and release-quality acceptance criteria. |

## Autoplan Intake

Here's what I'm working with: a product-and-design doc for a browser guitar tuner, plus an already-implemented React/Vite codebase in `src/features/tuner`. UI scope: yes. DX scope: no. Loaded review skills from disk where available in this environment and ran the full review pipeline with auto-decisions, using this design doc as the plan artifact.

Artifacts examined:

- Plan: `GUITAR_TUNER_DESIGN.md`
- App shell: `src/app/App.tsx`, `src/main.tsx`
- Core flow: `src/features/tuner/components/tuner-workspace.tsx`
- Audio and pitch logic: `src/features/tuner/hooks/use-tuner.ts`, `src/features/tuner/lib/audio.ts`, `src/features/tuner/lib/music.ts`
- Product data and settings: `src/features/tuner/lib/tunings.ts`, `src/features/tuner/types.ts`
- Supporting UI: `settings-sheet.tsx`, `tuning-sheet.tsx`, `string-grid.tsx`, `meter.tsx`, `diagnostics-panel.tsx`, `history-trail.tsx`

Validation run:

- `vp check` ✅
- `vp test` ✅

Outside-voice degradation matrix:

- Claude subagent: unavailable in this host toolset
- Codex CLI: unavailable (`codex` not installed)
- Review mode: single-reviewer mode

## CEO Review

### 0A. Premise Challenge

Premises identified and evaluated:

1. A browser tuner can feel instant enough to replace native or hardware options for casual and intermediate players.
   Verdict: accepted. The current code already proves a viable loop with Web Audio capture, rolling smoothing, string targeting, and a calm meter in `use-tuner.ts`.

2. Simplicity and trust beat feature count in this category.
   Verdict: accepted strongly. The implementation already benefits from this. `TunerWorkspace` keeps one primary surface and pushes secondary controls into sheets instead of crowding the main canvas.

3. Alternate tunings should feel first-class in v1 rather than post-MVP.
   Verdict: accepted. This is inside the current blast radius because preset data, selection UI, persistence, and share links already exist.

4. Multi-instrument support should be structurally possible but not the product story yet.
   Verdict: accepted. `presetTunings` already contains bass and 7-string data, but the positioning should stay guitar-first so the experience does not become generic.

5. GitHub Pages and zero-backend remain hard constraints.
   Verdict: accepted. Nothing in the current architecture requires a server, and adding one would mostly create deployment and privacy complexity without improving the core loop.

6. Permission failure can be handled with copy and fallback UI rather than a real alternate path.
   Verdict: challenged. The current product promise says tune in seconds, but denied or unsupported microphone states currently degrade to button-label/state text changes instead of a purpose-built recovery flow.

### 0B. Existing Code Leverage Map

| Sub-problem                     | Existing code                                       | Reuse verdict                                                             |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Tuning data model               | `src/features/tuner/lib/tunings.ts`                 | Reuse as-is. Already structured as product data rather than UI constants. |
| Frequency math and note mapping | `src/features/tuner/lib/music.ts`                   | Reuse as core domain layer. Clear and small.                              |
| Pitch detection and smoothing   | `src/features/tuner/hooks/use-tuner.ts`             | Reuse, extend carefully. Most product risk already lives here.            |
| Main tuner canvas               | `src/features/tuner/components/tuner-workspace.tsx` | Reuse, but simplify state ownership over time if new features pile in.    |
| Tuning library / custom builder | `src/features/tuner/components/tuning-sheet.tsx`    | Reuse. Already covers favorites and custom creation.                      |
| Settings and calibration        | `src/features/tuner/components/settings-sheet.tsx`  | Reuse. Missing some planned controls, but the pattern is right.           |
| Offline / installability        | `src/main.tsx`, `public/sw.js`                      | Reuse. Static-hostable path already exists.                               |

### 0C. Dream State Diagram

```text
CURRENT
  Browser tuner with strong visual shell, real mic capture, preset/custom tunings,
  reference tone, favorites, tune-all mode, diagnostics, offline shell.

THIS PLAN
  Turn the current implementation into the clean open-source tuner people trust:
  calm first-run UX, stable lock behavior, one-tap alternate tunings, mobile-first polish,
  contributor-friendly tuning data.

12-MONTH IDEAL
  The default bookmarked tuner on mobile web for guitar players.
  Fast permission onboarding, great noisy-room behavior, teacher-shareable tuning URLs,
  installable PWA feel, and a contributor pipeline for new tunings/instruments without
  touching the rendering system.
```

### 0C-bis. Implementation Alternatives

| Approach                                                       | Effort | Risk   | Pros                                                                         | Cons                                                                      |
| -------------------------------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A. Ship current architecture with focused UX hardening         | Low    | Low    | Fastest path to a lovable public v1. Reuses almost everything already built. | Leaves some state concentration in `TunerWorkspace`.                      |
| B. Pause for deeper architecture cleanup before feature polish | Medium | Medium | Cleaner internals before more features land.                                 | Delays real user feedback on the thing that matters most: trust and feel. |
| C. Expand immediately into broader instrument platform         | Medium | High   | Bigger long-term surface area.                                               | Violates the strongest product wedge and risks a generic tuner identity.  |

Auto-decision: choose A.
Reason: highest completeness for the next shipping step without adding architecture churn or widening scope beyond the blast radius.

### 0D. Mode-Specific Analysis

Mode forced by `/autoplan`: SELECTIVE EXPANSION.

Approved expansions inside blast radius:

- Explicit first-run permission explainer and denied/unsupported recovery copy.
- Release criteria for mobile Safari and Android Chrome microphone behavior.
- Shareable tuning URL polish because the code already writes `?t=` in `tuner-workspace.tsx`.
- Contributor path for adding presets because `presetTunings` is already the extension seam.

Deferred expansions outside practical v1 blast radius:

- Accounts or cloud sync.
- AI coaching or song/chord intelligence.
- Broad instrument-brand repositioning.

### 0E. Temporal Interrogation

Hour 1:

- User opens site, grants mic, plucks a string, sees a big note and meter.
- Risk today: if permission fails, the UX does not yet teach the recovery path well enough.

Hour 6:

- User flips through alternate tunings, favorites one, maybe shares a preset URL.
- Current code supports most of this already, which is a strong signal that the plan should acknowledge these features as product, not side extras.

Week 2:

- Real users expose Safari and noisy-room edge cases.
- The plan needs explicit quality gates here or the product will feel flaky despite a strong design thesis.

Month 6:

- Biggest regret risk is not missing one more feature. It is shipping a tuner that looks premium but loses trust on edge devices.

### 0F. Mode Selection Confirmation

SELECTIVE EXPANSION still fits. The right move is not bigger scope everywhere. It is selective hardening around trust, fallback, and real-world microphone behavior.

### CEO Findings

1. Permission failure is underdesigned relative to the core promise.
   Severity: high.
   Why it matters: the promise is "tune in seconds," but denied/unsupported states are where first-time trust is won or lost.
   Fix: add a dedicated first-run/permission state to the plan with pre-prompt explainer, denied-state recovery steps, unsupported-browser copy, and reference-tone-only fallback behavior.

2. The MVP boundary in the doc is looser than the actual product shape.
   Severity: medium.
   Why it matters: the implementation already includes favorites, custom tunings, diagnostics, share links, and tune-all mode. If the plan still talks like those are optional haze, execution and messaging drift apart.
   Fix: rewrite the MVP section into "must ship," "already built but needs polish," and "defer." Keep the story consistent with the current codebase.

3. The plan says guitar-first but the data model already exposes bass and 7-string.
   Severity: medium.
   Why it matters: this is strategically fine in code, but product copy can accidentally widen the wedge and weaken positioning.
   Fix: make guitar the headline product, with extended instruments described as contributor-friendly structural capacity rather than equal-front-door messaging.

### CEO Consensus Table

```text
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ───── ─────────────────────────────
  Product wedge                       9/10    n/a    Stay guitar-first
  Scope discipline                    8/10    n/a    Selective expansion only
  Trust / permission strategy         5/10    n/a    Needs explicit recovery UX
  6-month regret avoidance            7/10    n/a    Biggest risk is flaky edge UX
  Reuse vs reinvention                9/10    n/a    Reuse current architecture
```

## Design Review

### Design Dimensions

| Dimension             | Score | What would make it a 10                                                                               |
| --------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| Visual identity       | 8/10  | Push the permission and idle states into the same polished visual language as the active tuner state. |
| Information hierarchy | 8/10  | Give first-run and mic-denied states a dedicated hierarchy instead of reusing the live layout.        |
| Interaction model     | 7/10  | Clarify the relationship between auto-detect, manual select, tune-all mode, and diagnostics.          |
| Mobile ergonomics     | 8/10  | Strong already. A touch more thumb-priority thinking for secondary actions would help.                |
| Accessibility         | 7/10  | Add clearer planned non-color signals and recovery copy for no-audio states.                          |
| Emotional tone        | 9/10  | Calm instrument-panel direction is distinctive and worth preserving.                                  |

### What I Examined

- The stated visual direction in `GUITAR_TUNER_DESIGN.md`
- Main layout and state presentation in `tuner-workspace.tsx`
- Secondary flows in `tuning-sheet.tsx`, `settings-sheet.tsx`, `diagnostics-panel.tsx`, `meter.tsx`, and `string-grid.tsx`

The implementation already aligns well with the calm, dark-first instrument-panel direction. The weak spot is not aesthetics. It is state-specific UX for permission, failure, and guidance.

### Design Findings

1. First-run UX is described, but not actually designed as a screen state.
   Severity: high.
   Evidence: the design doc mentions a permission explainer, but the implemented surface still renders the main tuner canvas immediately and mostly relies on `Enable mic` plus status text.
   Fix: add a dedicated "pre-listening" state to the plan with exact copy blocks, primary CTA, privacy reassurance, and what the user can do before granting access.

2. Denied and unsupported mic states are functionally present but visually under-specified.
   Severity: high.
   Evidence: `getMicLabel` and `getMicButtonLabel` expose these states, but there is no planned recovery card, troubleshooting affordance, or fallback pathway in the design doc.
   Fix: design one recovery panel that handles denied, unsupported, and generic error states without collapsing back into the live tuning layout.

3. Diagnostics and power-user controls may dilute the "camera app, not dashboard" principle if they keep growing.
   Severity: medium.
   Evidence: the live workspace already includes diagnostics, live state, shortcuts, settings, custom tuning, tune-all, favorites, and sharing. It still works, but the plan should explicitly cap what remains on the default surface.
   Fix: lock a rule in the plan: only note, meter, strings, mic CTA, and one path to tunings belong on the main mobile viewport by default.

### Recommended Plan Changes

- Add a state map: `idle -> requesting -> listening -> locked`, plus `denied`, `unsupported`, and `too noisy` branches.
- Specify copy for all non-happy-path states.
- Define which controls are always visible vs hidden in sheets.
- Keep the dark-first panel aesthetic, large note readout, and restrained accent strategy exactly as written.

## Engineering Review

### Architecture Summary

Current architecture is straightforward and mostly right for the product:

```text
src/main.tsx
  -> App
    -> TunerWorkspace
      -> usePersistentState (settings, tuning, favorites, customs)
      -> useTuner
        -> buildTargets / music math
        -> getUserMedia + AudioContext + AnalyserNode
        -> detectPitch + smoothing + lock heuristics
      -> visual components (meter, string grid, sheets, diagnostics)
```

### Data Flow

```text
Mic input
  -> Web Audio analyser buffer
  -> detectPitch()
  -> rolling pitch frame smoothing
  -> target selection against active tuning
  -> cents + lock state + status text
  -> TunerSnapshot
  -> UI components render note / meter / strings / diagnostics
```

### What I Examined

- Pitch detection and lock heuristics in `use-tuner.ts`
- Note math and target generation in `music.ts`
- Reference tone implementation in `audio.ts`
- State and feature composition in `tuner-workspace.tsx`

No major architecture rewrite is needed. The existing code is compact, typed, and already centered on the real product seam: `useTuner` as the audio/state engine and `tunings.ts` as product data.

### Engineering Findings

1. The plan lacks explicit cross-browser acceptance criteria for the audio stack.
   Severity: high.
   Why it matters: the biggest real technical risk is not the math. It is browser mic behavior, especially Safari. The current implementation creates `AudioContext` on enable and leans on built-in processing flags, which is sensible, but the plan never turns this into a verification matrix.
   Fix: add required acceptance tests for iOS Safari, Android Chrome, denied-permission retry, tab-background/resume behavior, and repeated mic enable/disable cycles.

2. `TunerWorkspace` is becoming the integration monolith.
   Severity: medium.
   Why it matters: at 500+ lines, it still reads clearly today, but any next wave of features risks pushing product logic, sheet orchestration, and view state into a hard-to-change blob.
   Fix: keep the current shape for v1, but add a planned boundary for extracting a small view-model hook or feature slices if new UI states land. Explicit beats clever here; do not abstract preemptively.

3. Reference tone playback and mic capture lifecycle are not called out in the plan as concurrent audio concerns.
   Severity: medium.
   Why it matters: users may play reference tone while listening, rapidly toggle mic, or background the tab. These are where browser audio stacks behave differently.
   Fix: add a small audio lifecycle section to the plan covering reference-tone coexistence, context cleanup, and resume behavior.

### Edge Case Registry

| Area              | Edge case                                         | Coverage status                              |
| ----------------- | ------------------------------------------------- | -------------------------------------------- |
| Permissions       | User denies mic, then retries from browser chrome | Missing from plan                            |
| Browser support   | `getUserMedia` unavailable                        | Partially covered in code, weak in plan      |
| Noise             | Room noise produces unstable frames               | Covered in code, acceptance criteria missing |
| Alternate tunings | Manual string override with non-6-string tunings  | Covered in current data model                |
| Persistence       | Stored custom tuning removed while selected       | Covered in code by reset to default          |
| Share links       | Invalid `?t=` param                               | Covered in `getInitialTuningId()`            |
| Audio lifecycle   | Multiple reference-tone taps / tab backgrounding  | Missing from plan                            |

### Test Coverage Review

Current automated coverage is light and focused on `music.ts` helpers. That is fine for now because the riskiest parts are browser integration behaviors that require manual QA.

Plan additions needed:

- Unit tests for more note-parsing and target-selection edges.
- Manual QA matrix for device/browser audio behaviors.
- Acceptance checks for tune lock stability and no-pitch messaging.

## DX Review

Skipped intentionally. This plan is not for a developer platform, SDK, CLI, or API product, so `/plan-devex-review` does not add meaningful signal here.

## Final Taste Decisions

These were auto-decided but are the places reasonable people could disagree:

1. Ship custom tunings in v1 instead of demoting them to v1.1.
   Auto-decision: yes.
   Why: already in the codebase, inside blast radius, and makes the product feel meaningfully deeper without changing architecture.

2. Keep bass and 7-string presets in the product data at launch.
   Auto-decision: yes in code, soft-pedal in marketing.
   Why: low implementation cost, but the public story should still lead with guitar.

3. Keep diagnostics in the product.
   Auto-decision: yes, but hidden by default.
   Why: useful for trust and debugging, as long as the default mobile canvas stays clean.

## User Challenges

None strong enough to override the stated direction. The core strategy is good. The recommendation is to sharpen it, not replace it.

## Recommended Plan Patch

Add these concrete sections to the plan before further implementation work:

1. A dedicated `Permission + Failure States` section with `idle`, `requesting`, `denied`, `unsupported`, and `too noisy` UX.
2. A `Release Quality Bar` section with required manual QA on Safari, Android Chrome, repeated mic toggles, and background/resume behavior.
3. A `Scope Now / Next / Later` section that aligns the doc with the features already present in code.
4. A `Contributor Path` note pointing to tuning definitions as the main open-source extension point.

## Final Verdict

STATUS: DONE_WITH_CONCERNS

REASON: The plan is already strong and the current implementation proves the product direction works. The remaining gaps are not about ambition. They are about making the trust story complete when browser audio or permissions go wrong.

ATTEMPTED: Reviewed the plan artifact, examined the implemented React/audio architecture, validated the repo with `vp check` and `vp test`, and ran the CEO, design, and engineering passes in single-reviewer mode because Codex/subagent tooling is unavailable here.

RECOMMENDATION: Treat this as approved with required plan edits around permission failure UX, cross-browser audio verification, and tighter MVP language before more scope expands.
