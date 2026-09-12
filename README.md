# Manoj R — cinematic portfolio

A single-page, scroll-driven 3D experience. Scrolling does not move a page; it
moves a camera through one continuous world, twelve chapters deep, from an
object assembling itself in the dark to a sunrise over a range of hills.

Frontend only. No backend, no API, no database, no CMS. Every word on screen
comes from static TypeScript in `src/data/`.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit, strict
```

---

## How it works

Three layers, locked together by exactly one scroll engine.

```
ScrollEngine  ──►  camera rig      (where the camera is)
  (one rAF)   ──►  scene director  (fog, key/fill/rim, exposure)
              ──►  chapter frames  (--presence / --t on twelve DOM elements)
```

**`src/lib/scroll/ScrollEngine.ts`** is the only thing in the project that
listens to scroll. Once per frame it smooths the scroll position, derives a
velocity and a damped pointer, and writes two custom properties — `--presence`
and `--t` — onto each registered element. React never re-renders because the
page scrolled; the only React state tied to scrolling is the current chapter
index, which changes twelve times in the whole film.

It is a module singleton (`engineSingleton.ts`) rather than React context,
because the WebGL tree renders in its own reconciler root where context from
the DOM tree is not available. Both trees import the same instance.

**The scroll track carries no content.** `ScrollTrack` renders twelve empty
spacers whose heights come from the same `weight` values that define the camera
windows, plus one trailing viewport so progress reaches exactly `1` at the
bottom of the document. The readable content lives in `.overlays`, a fixed
layer of twelve chapter frames that dissolve between one another in place.
That is what makes the scrolling feel like a camera rather than a page.

**The world is one space.** Chapters occupy their own cells along `-Z`
(`CELL_Z` in `src/lib/three/cameraRig.ts`), so the camera genuinely travels
from one to the next. Exponential fog dissolves a chapter into the dark long
before the next one is reached, which is why no chapter needs a cross-fade —
the atmosphere is the transition. `SceneGroup` mounts a chapter only while the
camera is near it, so at most two or three exist at any moment.

### Kinetic type

Text is scroll-scrubbed, not triggered. `KineticText` splits a line into words
or characters and derives each unit's reveal from the chapter's linear `--t`,
so scrolling back un-reveals a line exactly the way it arrived and pausing
mid-reveal holds the frame there.

```tsx
<KineticText variant="rise" from={0.04} span={0.3} stagger={0.06} lean exit>
  Turning Ideas into
</KineticText>
```

Six variants — `rise`, `blur`, `depth`, `stretch`, `wipe`, `fill` — plus:

| Piece | What it does |
| --- | --- |
| `lean` | Skews with scroll direction, from the engine's `--velocity` |
| `exit` | Drifts and dissolves as the chapter closes |
| `onLoad` | Plays once on mount — only the opening chapter needs this |
| `ScrambleText` | Metadata resolving out of glyph noise |
| `CountUp` | A figure counting to its real value as its set arrives |
| `.text-sweep` | A soft edge travelling down a paragraph |

`CountUp` and `ScrambleText` read progress through `SceneContext`, so a figure
nested inside one project counts up when *that station* arrives rather than
when the chapter opens.

### Theme

Light, dark and system, with the choice persisted and the OS followed when
"system" is selected. It is not a background swap: the 3D world changes with
the document.

- `themeStore.ts` is a singleton, for the same reason the scroll engine is —
  the WebGL tree cannot see React context. **Reads are pure.** An earlier
  version notified subscribers from `getResolved()`, which meant a read during
  one component's render set state in another and tore down the WebGL tree.
- A tiny inline script in `<head>` sets the attribute before first paint, so
  there is no flash of the wrong palette.
- The light palette is its own composition — warm paper, graphite ink, copper
  pulled darker to hold contrast — not an inversion of the dark one. Every
  token clears WCAG AA against the brightest backdrop in the world (lowest is
  copper at 5.24:1).
- The world derives its light recipes from the dark ones
  (`toLightRecipe`) rather than maintaining twelve of each, and the director
  blends the two sets by a damped `lightness` value, so switching theme
  mid-scroll is a dissolve rather than a cut.
- Three things the light theme needs that the dark one does not, all handled
  centrally in the director: emissive materials go back through tone mapping
  (they opt out to stay hot on black, and blow to white on paper), fresnel
  rims scale down via a dedicated `uRimScale` uniform so scene animation is
  never fought, and reflection strength is decoupled from ambient.
- Enclosed sets — the interior room, the vault, the education ground — take
  their surface colours from `useThemeHex`. A dark wall vanishes into dark
  fog; on paper the same wall is a grey box floating in nothing.

### Materials

Metal is almost entirely reflection, so a `metalness: 0.9` surface with
nothing to reflect renders black no matter how many lights face it. Rather
than ship an HDRI, `environmentMap.ts` paints an equirectangular studio from
the site palette — dark floor, warm horizon, overhead softbox, cool bounce —
and runs it through PMREM so roughness blurs the reflection correctly. That
one texture is what makes the copper read as burnished rather than flat.

`createRimMaterial` adds a fresnel edge light on top, which is what catches a
silhouette the way three directional lights cannot.

### Where to change things

| I want to change… | Edit |
| --- | --- |
| Any résumé content | `src/data/**` — nothing else |
| How long a chapter lasts | `weight` in `src/data/navigation/scenes.ts` |
| Where the camera goes | the `SHOTS` list in `src/lib/three/cameraRig.ts` |
| Chapter lighting and fog | `src/lib/three/environments.ts` |
| Colour, type, spacing | `src/styles/tokens.css` |

`weight` drives both the DOM spacer height and the camera window, so the two
cannot drift apart. There is a floor: every chapter must be at least a viewport
tall or its frame cannot fill the screen. `scenes.ts` warns in development if a
weight falls below that, and `SceneStage` warns if a chapter's content is
taller than its frame and would be cropped.

---

## Data

Everything is static and typed. Changing a project, a role, a certification or
a contact link means editing one file in `src/data/` — no component knows any
content.

```
src/data/
  profile/{personal,summary,contact}.ts
  experience/experience.ts
  projects/projects.ts          # also owns each project's scroll sub-window
  skills/skills.ts              # orbit radius + inclination per group
  education/education.ts
  certifications/certifications.ts
  achievements/achievements.ts
  languages/languages.ts
  navigation/{scenes,navigation}.ts
```

Two deliberate choices in that data:

- **No profile URLs were supplied**, so LinkedIn, GitHub, Portfolio and
  HackerRank are declared in `contact.ts` as explicit placeholders with
  `href: null`. The contact page renders them as *pending* rather than
  inventing a URL. Fill in `href` and drop `placeholder` to activate one.
- **Nothing is embellished.** Companies, dates, technologies and the 85%
  accuracy figure are exactly as supplied.

---

## Accessibility

The 3D world is decoration for the story; it never carries information. Every
fact is ordinary, selectable, crawlable HTML in the chapter frames, and the
canvas is `aria-hidden`.

- All twelve chapters stay in the accessibility tree at all times. A chapter
  that is currently faded out is never hidden from a screen reader — only
  pointer interaction is gated.
- Focusing into an off-screen chapter flies the camera to it, so a keyboard
  user is never reading a frame they cannot see.
- `prefers-reduced-motion` removes smooth scrolling, camera drift, pointer
  parallax, particle motion and every text reveal. The story still plays; the
  movement does not.
- Route entrances are CSS, and content renders visible by default — an
  animation that fails to start can never leave a page blank.

---

## Performance

- One WebGL canvas for the whole experience, created once and never unmounted.
- Capability detection (`src/lib/three/performance.ts`) sets DPR bounds,
  geometry density, segment counts and whether post-processing runs at all.
- Every particle field and instanced mesh scales through `scaleCount`.
- Frame loops write to refs and pre-allocated vectors; the camera, the lighting
  director and every chapter allocate nothing per frame.
- Three.js loads in its own chunk (`dynamic(..., { ssr: false })`), so the
  readable layer paints without waiting for it.
- Bloom sits above what suspended dust can reach, so only genuinely emissive
  objects halo.
- Kinetic type is pure CSS driven by two custom properties, so a chapter of
  animated headlines costs no JavaScript per frame.
- Where WebGL is unavailable, `WorldFallback` renders a lit horizon in CSS.
  Never a broken canvas.

### Portrait

A phone is not a narrow desktop. The camera dollies in slightly (kept modest,
since some scenes also recentre their subject and the two compound), the hero
artifact centres and rises above the type instead of sitting right of it, the
ranges drop below the frame, and a theme-aware scrim guarantees the type reads
over whatever the world is doing behind it.

---

## Assets

There are none. All geometry is procedural and all textures are drawn on a
canvas at runtime, so the project ships no binary assets and carries no
third-party asset licences. `public/models/README.md` documents how to add a
real GLB if one would tell the story better.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict, `noUncheckedIndexedAccess`)
· Three.js · React Three Fiber · drei · @react-three/postprocessing · Lenis ·
lucide-react · Tailwind (layout utilities only — the visual identity is in
`src/styles/`).
