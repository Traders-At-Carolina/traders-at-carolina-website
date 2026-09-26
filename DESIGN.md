---
name: Traders at Carolina
description: A provisional editorial system for an active student quantitative-finance learning floor.
colors:
  navy: "#081f33"
  navy-deep: "#041522"
  carolina-blue: "#7bafd4"
  carolina-blue-hover: "#9bc7e6"
  carolina-blue-pale: "#dcecf7"
  ink: "#102638"
  muted: "#556a7b"
  line: "#cdd9e1"
  surface-white: "#ffffff"
  surface-cool: "#edf3f6"
  canvas: "#f7f9fb"
  field-surface: "#fbfcfd"
  focus-gold: "#f2b544"
  danger: "#b42318"
typography:
  display:
    fontFamily: "'Chivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(3.1rem, 7vw, 6rem)"
    fontWeight: 760
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Chivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 4.1rem)"
    fontWeight: 710
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Chivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.65rem)"
    fontWeight: 680
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "'Chivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'Chivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 650
    lineHeight: 1.45
    letterSpacing: "0.08em"
rounded:
  mark: "0.55rem"
  field: "0.65rem"
  small-control: "0.7rem"
  button: "0.8rem"
  container: "0.85rem"
  card: "0.9rem"
  pill: "999px"
spacing:
  xs: "0.45rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "clamp(5.5rem, 10vw, 9.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.carolina-blue}"
    textColor: "{colors.navy-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0.8rem 1.3rem"
    height: "3.25rem"
  button-primary-hover:
    backgroundColor: "{colors.carolina-blue-hover}"
    textColor: "{colors.navy-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0.8rem 1.3rem"
    height: "3.25rem"
  button-light:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0.8rem 1.3rem"
    height: "3.25rem"
  button-ghost-light:
    backgroundColor: "transparent"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0.8rem 1.3rem"
    height: "3.25rem"
  navigation-link:
    backgroundColor: "transparent"
    textColor: "rgba(255, 255, 255, 0.77)"
    typography: "{typography.body}"
    padding: "0.55rem 0.7rem"
    height: "2.7rem"
  navigation-link-active:
    backgroundColor: "transparent"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    padding: "0.55rem 0.7rem"
    height: "2.7rem"
  card-event:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  chip-neutral:
    backgroundColor: "{colors.surface-cool}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.62rem"
    height: "1.8rem"
  input-default:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 0.9rem"
    height: "3.25rem"
  input-focus:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 0.9rem"
    height: "3.25rem"
  empty-state:
    backgroundColor: "rgba(255, 255, 255, 0.64)"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    padding: "clamp(1.5rem, 4vw, 2.5rem)"
  page-hero-blue:
    backgroundColor: "{colors.carolina-blue}"
    textColor: "{colors.navy-deep}"
    typography: "{typography.display}"
    padding: "clamp(6rem, 12vw, 10.5rem)"
---

# Design System: Traders at Carolina

## Overview

**Creative North Star: "The Carolina Learning Floor"**

The current system frames Traders at Carolina as an active place to learn in public: broad editorial fields, compact data labels, direct status language, and a first viewport grounded in campus rather than generic finance imagery. Deep navy supplies institutional weight, Carolina blue carries action and signal, and generous white space keeps dense ideas approachable.

This is the implemented design baseline, not approved final club branding. Its tokens, components, responsive behavior, and accessibility rules are real and should be preserved when extending the current build, while the palette, mark, and overall identity remain intentionally swappable in a later brand phase.

**Key Characteristics:**

- A campus-first opening that pairs a full-bleed photograph with a high-contrast editorial headline.
- Deep navy anchors, open white and cool-white fields, and Carolina blue used as a signal rather than decoration.
- Large, tightly set headings balanced by compact uppercase data labels and readable body copy.
- Broad split grids, ruled lists, and deliberate empty states instead of a wall of interchangeable cards.
- Clear Join and Partners paths with restrained motion, visible focus, and mobile-first fallbacks.

## Colors

The palette is cool, institutional, and high-contrast: navy establishes the floor, Carolina blue identifies action and live information, and pale neutral fields create breathing room.

### Primary

- **Carolina Signal** (`carolina-blue`): The main accent for primary actions, emphasized words, live indicators, feature bands, and data values.
- **Deep Carolina Navy** (`navy`): The principal dark field for statistic bands and grounded content regions.
- **After Midnight** (`navy-deep`): The deepest navigation, footer, partner, recruitment, and member-access surface.
- **Signal Lift** (`carolina-blue-hover`): The brighter hover response for primary actions.
- **Carolina Mist** (`carolina-blue-pale`): A quiet accent surface for fallbacks, icons, and low-emphasis visual placeholders.

### Neutral

- **Quant Ink** (`ink`): Default text on light surfaces.
- **Slate Note** (`muted`): Supporting copy, metadata, and intentionally lower-emphasis detail.
- **Rule Blue-Gray** (`line`): Borders, dividers, card separators, and structural rules.
- **Open White** (`surface-white`): Primary content fields, cards, and light controls.
- **Cool Lab Surface** (`surface-cool`): Alternating section bands, neutral chips, and quiet app-like zones.
- **Canvas Air** (`canvas`): The page canvas behind the surface system.
- **Field Frost** (`field-surface`): Resting input fill before focus.

### State

- **Focus Gold** (`focus-gold`): The global keyboard-focus outline; it must remain visually distinct from Carolina blue.
- **Validation Red** (`danger`): Invalid fields and error copy only.

### Named Rules

**The Signal, Not Wash Rule.** Carolina blue should mark action, emphasis, or a meaningful content field; do not tint every section blue.

**The Deep Field Rule.** Navy surfaces carry the highest-attention moments—navigation, first viewports, learning modules, status bands, and the footer—while white space does the everyday explanatory work.

## Typography

**Display Font:** Chivo Variable (with Helvetica Neue, Arial, and sans-serif fallbacks)  
**Body Font:** Chivo Variable (with Helvetica Neue, Arial, and sans-serif fallbacks)

**Character:** One variable grotesk carries the entire site. Weight, scale, compression, and spacing create an assertive editorial hierarchy without introducing a separate decorative face.

### Hierarchy

- **Display** (760, fluid `3.1rem–6rem`, 1.05): Page and hero statements; keep line lengths short enough to form deliberate editorial blocks.
- **Headline** (710, fluid `2.25rem–4.1rem`, 1.05): Section propositions and major closing actions.
- **Title** (680, fluid `1.25rem–1.65rem`, 1.05): Cards, list rows, disclosures, and process steps.
- **Body** (400, `1rem`, 1.6): General reading copy, with paragraphs capped at `72ch`; prominent explanatory copy may scale fluidly to roughly `1.35rem`.
- **Label** (650, `0.78rem`, 0.08em tracking, uppercase where used): Facts, pending states, sequence markers, footer headings, and compact data descriptors.

### Named Rules

**The One-Family Rule.** Keep Chivo as the sole interface family and build hierarchy through the established variable weights and fluid scales.

**The Short-Statement Rule.** Display headlines are dense and line-broken by layout, not stretched across the full container; most hero titles stay between `8ch` and `14ch`.

## Layout

The site uses a centered `76rem` content container with `1.5rem` side gutters on larger screens and `1rem` gutters below `50rem`; the header may extend to `88rem`. Sections breathe with a fluid vertical rhythm from `5.5rem` to `9.5rem`, reducing to `4.75rem` on the narrowest screens. Major compositions are broad two-column editorial fields, while repeated content uses ruled grids and lists before reaching for cards.

The full-bleed home hero fills the first viewport below the `5.25rem` header and places the core name, purpose, membership action, event action, and recruitment status above the fold. Supporting pages use large split-field heroes or a dark signal graphic. Image crops and scrims move at small widths to protect text contrast and keep the campus setting legible.

At `70rem`, primary navigation becomes a full-height slide-in panel and four-column systems begin collapsing. At `50rem`, split layouts stack, repeated grids become single-column, featured cards stop spanning horizontally, and horizontal action bands become vertical. At `34rem`, button rows become full-width, form and statistic grids become single-column, and mobile heading sizes and section spacing tighten. The implementation supports a minimum viewport width of `20rem`.

**The Editorial Field Rule.** Prefer one strong split, ruled sequence, or full-width color field over several nested cards.

## Elevation & Depth

The system is flat by default. Depth comes primarily from full-width tonal changes, dark/light contrast, photographic scrims, borders, and clipped containers; shadows are reserved for interactive lift or isolated cards that must detach from the page.

### Shadow Vocabulary

- **Action Lift** (`0 0.55rem 1.3rem rgba(2, 17, 29, 0.18)`): Appears only when a primary button rises on hover.
- **Event Float** (`0 1rem 3rem rgba(21, 49, 68, 0.1)`): Gives event cards a soft, ambient separation from light sections.
- **Access Panel** (`0 1.2rem 3.5rem rgba(8, 31, 51, 0.12)`): Isolates the member-access panel on its cool background.
- **Status Glow** (`0 0.2rem 0.75rem rgba(123, 175, 212, 0.5)`): A small luminous cue attached to status dots, never a general surface effect.

### Named Rules

**The Flat-by-Default Rule.** Do not add shadows to ruled lists, section fields, or navigation; elevation is an exception for hover feedback and isolated cards.

## Shapes

Controls are softly rounded while editorial structure stays rectilinear. Fields use a `0.65rem` radius, compact controls use `0.7rem`, primary buttons use `0.8rem`, and cards top out at `0.9rem`; chips and status labels are fully pill-shaped. The small bar-chart brand mark and signal graphics use simple vertical geometry inside restrained rounded frames.

Borders are thin and functional. Solid blue-gray rules organize lists and grids, translucent white rules organize dark fields, and dashed borders identify intentional empty states. Images are clipped by their owning card or carousel rather than rounded independently.

**The Soft-Control Rule.** Round what users touch or what must read as a contained object; keep page-level fields, editorial grids, and structural bands square.

## Components

### Buttons

Buttons are compact, weighty actions with a small upward hover response.

- **Shape:** Soft rectangular control (`0.8rem` radius, `3.25rem` minimum height); the header's small variant uses a `0.7rem` radius and `2.7rem` minimum height.
- **Primary:** Carolina Signal background with After Midnight text, semibold-to-bold label weight, and `0.8rem 1.3rem` padding.
- **Hover / Focus:** The primary brightens to Signal Lift, rises `2px`, and gains Action Lift; all keyboard focus uses a `3px` Focus Gold outline with a `4px` offset.
- **Light:** Open White on dark fields; its hover shifts to Carolina Mist.
- **Ghost:** Transparent with a translucent white border on dark media or dark fields; hover strengthens the border and adds a restrained translucent fill.
- **Disabled:** Reduced to `64%` opacity with no lift or shadow; the current submit state uses a wait cursor and spinner.

### Chips

Chips are dense status labels rather than decorative badges.

- **Style:** Fully rounded pill, `0.7rem` type, `680` weight, and compact `0.3rem 0.62rem` padding.
- **State:** Neutral audience labels sit on Cool Lab Surface; open, complete, full, and canceled states use distinct pale semantic fills with dark corresponding text.

### Cards / Containers

Cards are used selectively where an item must travel as one object.

- **Corner Style:** Gently rounded (`0.85rem–0.9rem`).
- **Background:** Open White for events and panels; Carolina Mist for image fallbacks; translucent white for empty states.
- **Shadow Strategy:** Event cards use Event Float; most other containers rely on borders or tonal contrast.
- **Border:** Empty states use a dashed blue-gray border; logo collections and choice grids use solid one-pixel rules.
- **Internal Padding:** Most card bodies use `1.5rem`; featured cards and large states expand fluidly toward `4rem`.

### Inputs / Fields

Fields are calm, explicit, and large enough for touch.

- **Style:** Field Frost background, one-pixel blue-gray stroke, `0.65rem` radius, and `3.25rem` minimum height; labels use compact bold navy text.
- **Focus:** Open White background, darker blue border, and a translucent `3px` Carolina-blue outline.
- **Error / Disabled:** Invalid fields switch the border and helper copy to Validation Red. Submit buttons expose the waiting state rather than hiding it.
- **Choice Fields:** Checkbox options are bordered tiles that invert to navy with white text when selected and retain the global Focus Gold keyboard ring.

### Navigation

The desktop header is an After Midnight bar with muted-white links, a Carolina-blue underline for the active page, a low-emphasis Member Login utility, and a compact Join button. Below `70rem`, the links become a fixed full-height navy panel; the active link changes to Carolina blue, each row receives a divider, and Join remains independently visible in the header.

### Empty States

Empty states are first-class publishing components: a dashed border, quiet icon, clear title, factual explanation, and optional next action. They preserve the intended space without fabricating club statistics, events, people, organizations, or photography.

### Page Heroes

The home hero is photographic and full-bleed, with layered navy scrims protecting white and Carolina-blue type. Interior pages use broad blue, white, or navy editorial fields; the Partners page adds a simple rising-bar signal built from the same accent and motion vocabulary.

**The State-Is-Copy Rule.** Current activity, pending content, and recruitment availability must be communicated in explicit text as well as color.

## Do's and Don'ts

### Do:

- **Do** use deep navy for the highest-attention fields and let Open White or Cool Lab Surface carry longer explanations.
- **Do** keep Carolina blue tied to action, meaningful emphasis, live state, and a few broad feature bands.
- **Do** preserve broad split layouts, ruled sequences, compact data labels, and deliberate empty states as the core editorial grammar.
- **Do** keep Join visually persistent, keep Member Login quieter, and preserve visible focus and reduced-motion behavior.
- **Do** treat this document as the coded provisional baseline while final club brand identity remains unresolved.

### Don't:

- **Don't** present this palette, mark, or visual identity as final approved club branding.
- **Don't** turn the site into a generic finance brochure built from stock trading imagery, glowing charts, or dashboard-style gradients.
- **Don't** place every section inside elevated cards or add shadows where rules and tonal fields already establish structure.
- **Don't** use color alone to communicate event, recruitment, validation, or navigation state.
- **Don't** fill pending modules with invented statistics, logos, events, portraits, or testimonials; use the implemented empty-state pattern.
