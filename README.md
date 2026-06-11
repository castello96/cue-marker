# Cue Marker

A browser-based tool for marking up a theater script PDF with cues, replacing the
traditional pencil-and-paper workflow. You load a script, drop numbered cue lines
across the pages, organize them by type, and export a flattened PDF that the A1 can
print and follow during the show.

Each cue is drawn as a horizontal line spanning the page with a small numbered box
at the page edge. Cue numbers follow `<page>.<n>`, where `n` resets on every page
and increments independently for each cue type. So on page 5 you might have mic cues
`5.1, 5.2, 5.3` and sound-FX cues `5.1, 5.2` running side by side without interfering
with each other.

Everything runs locally in the browser. There is no server, no account, and no data
leaves your machine.

## Features

- **Load any script PDF** and page through it one page or two pages at a time.
- **Single or double-page view.** Double-page mimics an open binder (pages pair as
  1-2, 3-4, 5-6) and is the default.
- **Cue types.** Four built-ins (Mic, Track, SFX, Lighting), each with its own color,
  plus any number of custom types you define with a name and color.
- **One-click cue placement.** Pick the active cue type, click a spot on the page, and
  a numbered cue line is drawn there. Numbering is automatic.
- **Independent per-type numbering.** Each cue type keeps its own `<page>.<n>` sequence
  on each page.
- **Reposition cues** by dragging them vertically or nudging with the arrow keys. Cues
  of the same type on the same page renumber automatically when they cross.
- **Per-cue notes** edited in a sidebar inspector (no popups blocking the script).
- **Per-cue number side.** Put a cue's number box on the left or right edge. Useful
  when a cluster of cues would otherwise crowd one margin and cover the text.
- **Automatic collision handling.** Number boxes that would overlap vertically are
  staggered sideways into lanes (computed independently for each side) so every number
  stays readable.
- **Show / hide cue types** to focus on one layer at a time. Hidden types are also
  excluded from the export.
- **Cue list panel** showing every cue grouped by page; click one to jump to it.
- **Save and reopen projects** as a single `.cue` file that bundles the PDF together
  with all your cues.
- **Export a flattened PDF** with the visible cues drawn directly onto the original
  pages, color-coded by type, ready to print.

## Getting started

Requirements: a recent version of [Node.js](https://nodejs.org/) (18+) and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5174)
```

Other scripts:

```bash
npm run build    # type-check and build a production bundle into dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
```

To deploy, run `npm run build` and serve the static `dist/` directory from any web
host. No backend is required.

## How to use it

### 1. Load a script

Click **Open PDF** in the toolbar and choose your script. It renders in the main area.
Use the page controls (or the Left / Right arrow keys) to move through it, and the
**Single / Double** toggle to switch between one-page and two-page (binder) views.

### 2. Place cues

1. In the **Cue Types** panel, click a type to make it the active type (or press its
   shortcut: `m`, `t`, `s`, `l`).
2. Click a spot on the page where the cue should go. A numbered line is drawn across
   the page at that height, with the next available number for that type.

Repeat to place as many cues as you need. Placing a cue never opens a dialog, so you
can drop several in a row quickly.

### 3. Adjust position

- **Drag** a cue line up or down to move it.
- **Nudge** the selected cue with **Up / Down** arrows (1 pt per press), or
  **Shift+Up / Shift+Down** for a coarser 10 pt step.

Whenever a cue crosses another of the same type on the same page, both renumber so the
sequence always runs top to bottom.

### 4. Add a note

Notes are optional and most cues will not need one.

- Click a cue to select it. Its details appear in the **Selected Cue** inspector in
  the sidebar.
- Type into the **Note** field there. Changes save as you type.
- Shortcuts: with a cue selected, press **Enter** to jump straight into its note field,
  or **double-click** the cue on the page to do the same.

### 5. Move a number to the other margin

In the inspector, use the **Number side** toggle to render a cue's number box on the
**Left** or **Right** edge. Reach for this when staggered boxes start covering script
text on one side; moving a few of them to the opposite margin clears the clutter.

### 6. Manage cue types

- Toggle a type's visibility with the **VIS / HID** button next to it. Hidden types
  disappear from the page and are left out of the export.
- Add a custom type with **+ Add custom type**, giving it a name and color.

### 7. Save your work

- **Save Project** downloads a `.cue` file containing the script and all your cues.
- **Open Project** reopens a previously saved `.cue` file, restoring everything exactly.

### 8. Export for the show

**Export PDF** produces `<script-name>_marked.pdf`: a copy of the original PDF with the
currently visible cues drawn onto it (line, numbered box, note, color-coded by type).
Open it in any PDF viewer and print.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Left / Right | Previous / next page (moves a full spread in double-page view) |
| Up / Down | Nudge the selected cue up / down by 1 pt |
| Shift+Up / Shift+Down | Nudge the selected cue by 10 pt |
| Enter | Focus the note field of the selected cue |
| Esc | Deselect the current cue |
| Delete / Backspace | Delete the selected cue |
| `m` / `t` / `s` / `l` | Set the active cue type to Mic / Track / SFX / Lighting |

Shortcuts are ignored while you are typing in a text field.

## Project file format

A saved project is a `.cue` file, which is a ZIP archive containing:

- `manifest.json` — schema version, original PDF filename, creation timestamp
- `project.json` — all cues, cue types, and visibility settings
- `source.pdf` — the original script PDF

Bundling the PDF with the cues means a project is a single self-contained file: it can
be moved, backed up, or shared, and the cues can never drift out of sync with the
script they were drawn on.

## How it works

- **Rendering** uses [PDF.js](https://mozilla.github.io/pdf.js/) to draw each page to a
  canvas, with an SVG overlay on top for the cue lines and number boxes.
- **Export** uses [pdf-lib](https://pdf-lib.js.org/) to draw the cues directly onto the
  original PDF pages, so the output is the real script plus annotations (not a
  re-rendered image).
- **Coordinates** for each cue are stored in PDF points measured from the top of the
  page, independent of zoom and screen size, so the on-screen overlay and the exported
  PDF always agree.
- **Numbering** is recomputed after every change by sorting each `(page, type)` group
  top to bottom.

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) for in-browser rendering
- [pdf-lib](https://pdf-lib.js.org/) for PDF export
- [Zustand](https://zustand-demo.pmnd.rs/) for state
- [JSZip](https://stuk.github.io/jszip/) for the `.cue` bundle

## Project structure

```
src/
  App.tsx                 # layout + global keyboard shortcuts
  store.ts                # Zustand store (all app state and actions)
  types.ts                # Cue, CueType, Project types
  constants.ts            # built-in cue types, box dimensions
  cues/
    numbering.ts          # per-(page, type) renumbering
    layout.ts             # collision lanes + left/right box positioning
  pdf/
    render.ts             # PDF.js page rendering
    export.ts             # pdf-lib flattened export
    coords.ts             # pixel <-> PDF point conversion
  project/
    bundle.ts             # .cue zip pack / unpack
  components/             # Toolbar, PdfCanvas, PdfPage, CueOverlay,
                          # CueInspector, CueListPanel, CueTypePalette,
                          # CueTypeManager, PageNavigator
public/
  pdf.worker.min.mjs      # PDF.js worker
  test.pdf                # a sample multi-page script for trying the app
```

The bundled `public/test.pdf` is only a placeholder for experimenting; it can be
deleted without affecting the app.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned and possible future enhancements.
