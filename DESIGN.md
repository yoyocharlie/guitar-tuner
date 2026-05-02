# Guitar Tuner Design System

## Thesis

This product should feel like a finely made precision instrument, not a dashboard, lesson page, or glossy app concept. The first impression should communicate expensive hardware, precision, and calm trust.

The intended memory is: this feels expensive, exact, and musically serious.

## Brand Posture

- Premium, not flashy.
- Precise, not clinical.
- Crafted, not rustic.
- Quietly modern, not trendy.

The visual language should suggest matte graphite, machined edges, engraved labeling, and measured feedback. Avoid anything that reads earthy, cozy, playful, soft, or marketing-heavy.

## Visual Direction

### Aesthetic

`Precision hardware`

Part boutique pedal, part Leica control surface, part modern tuner hardware.

This means:

- One dominant object in the first viewport.
- Intentional specular edges and restrained material contrast.
- Very little decorative noise.
- Strong geometry and disciplined spacing.
- Motion used as signal, not spectacle.
- Shapes should feel engineered, not bubbly.

### Composition

The first viewport is a single physical-feeling object.

- The primary tuning surface dominates the screen.
- Supporting controls orbit or dock around it.
- Settings, diagnostics, and tuning management are secondary layers.
- Avoid stacked dashboard cards as the main composition.

The experience should feel closer to operating expensive tuning hardware than browsing an app.

## Color System

Use a dark graphite palette with cold highlights. Do not use brown, amber-heavy warmth, muddy golds, or startup-app glow styling.

### Core Palette

- `--color-bg`: `#07111A`
- `--color-surface`: `#0D1720`
- `--color-surface-2`: `#121D27`
- `--color-border`: `#2A3847`
- `--color-text`: `#F3F7FB`
- `--color-text-muted`: `#90A0B3`
- `--color-accent`: `#6EC8FF`
- `--color-success`: `#7EF0C2`
- `--color-danger`: `#FF7A90`

### Usage Rules

- The background should stay deep and low-glare.
- Raised surfaces should read like matte coated metal, not glossy UI cards.
- Accent cyan is for active tuning focus, live listening, and key highlights.
- Success mint is reserved for lock-in and confirmed in-tune states.
- Error rose is only for denied, unsupported, or unstable states.
- Muted text should stay readable and cool, never beige.
- Most of the interface should feel dark, quiet, and dense. Bright accents are rare.

### Contrast

- Primary readouts must stay extremely high contrast.
- Small labels can soften, but never disappear into the surface.
- Borders should be subtle but visible enough to define the object silhouette.

## Typography

The type system should combine technical precision with just enough identity to avoid feeling generic.

### Roles

- UI sans: `Instrument Sans` or a close equivalent for labels, controls, and structural text
- Technical mono: `IBM Plex Mono` for cents, note values, and readouts
- Editorial accent: `Fraunces` for rare moments like tuning names or a single signature label

### Rules

- Sans does most of the work.
- Mono appears where measurement matters.
- Serif is sparse and intentional.
- Do not let serif text dominate the interface.
- Labels should feel engraved or printed, not product-marketing styled.

### Tone

- Big note readouts should feel authoritative.
- Support text should stay compact and restrained.
- Avoid long explanatory paragraphs in the core interface.

## Layout Rules

### First Viewport

The home screen should contain:

- current detected note
- obvious intonation feedback
- tuning name
- six string targets
- mic state
- discreet entry points for tuning library and settings

Everything else is secondary.

### Structure

- Use one primary surface, not multiple equal-weight containers.
- Keep support modules attached to the main object visually.
- Mobile should feel native and singular, not like a desktop page compressed down.
- Desktop can expand horizontally, but should preserve the single-instrument feel.
- Corners can be firm or only slightly rounded. Avoid soft pill-heavy geometry.

### Density

- Base spacing unit: `8px`
- Tighten control clusters.
- Give the note display and tuning surface generous breathing room.
- Prefer fewer, larger zones over many medium boxes.

## Component Guidance

### Primary Tuning Surface

- Circular or near-circular focal geometry is encouraged if it reads like hardware, not wellness UI.
- The note, cents, and lock state should feel mechanically related.
- Meter feedback should appear integrated into the surface, not pasted below it.
- The object needs a believable outer shell and inner measurement system.

### String Targets

- Strings should feel instrument-specific, not like generic segmented controls.
- Numbering and note names can pair together, with a technical and premium feel.
- Active and locked states should be obvious without becoming loud.
- Reduce pill shapes and toy-like button silhouettes.

### Sheets and Secondary Panels

- Use darker recessed surfaces.
- Keep copy short.
- Prioritize scannability over explanation.
- Advanced controls belong here, not in the main canvas.

### Diagnostics

- Treat diagnostics as technical instrumentation.
- Use mono and compact labels.
- Keep them visually subordinate to the main tuning task.

## Motion

Motion should reinforce confidence.

Use:

- damped meter movement
- minimal listening pulse
- crisp lock-in glow
- short state transitions

Avoid:

- floaty card transitions
- decorative parallax
- soft blob pulses
- exaggerated springiness
- ambient neon haze

If motion feels playful, it is wrong for this product.

## Safe Choices

These stay aligned with user expectations:

- dark low-glare interface
- giant central note readout
- immediately legible sharp/flat feedback
- progressive disclosure for settings and tuning management

## Deliberate Risks

These give the product its own face:

1. Use a colder graphite-and-metal palette instead of acoustic wood warmth.
   Why: it feels more exact and more like real hardware.
   Cost: less cozy and less conventionally “guitar.”

2. Make the main screen read as one built object instead of stacked cards.
   Why: it becomes memorable and hardware-like.
   Cost: less generic app familiarity.

3. Keep typography mostly industrial and technical, with only a tiny serif accent.
   Why: it keeps the product expensive without drifting into editorial lifestyle branding.
   Cost: less overt personality if handled too conservatively.

## Anti-Patterns

Do not ship any of the following:

- muddy brown or poop-colored palettes
- whiskey-barrel acoustic tropes
- generic SaaS card dashboards
- purple or pink startup gradients
- floating decorative blobs
- soft glow-heavy premium-app styling
- giant explainer paragraphs in the main workflow
- icon-grid home screens
- marketing page composition ahead of tuning workflow

## Implementation Intent

Before additional UI code changes:

- keep the palette cool and clean
- preserve a single dominant tuning object
- make the screen feel premium on mobile first
- remove anything that reads like filler or dashboard scaffolding

If a decision is visually polished but makes the interface feel more generic, reject it.
