# Cue Marker Roadmap

Ideas for v2 and beyond. Grouped roughly by impact, not by priority. Pick what hurts most in real use.

## From the v1 plan (deferred)

- **Undo / redo.** All store mutations are already pure. Wrap the store in a history middleware (e.g. zundo) to get a 20-step undo stack with `Cmd-Z` / `Cmd-Shift-Z`.
- **Continuous scroll / multi-page view.** Today you see one page at a time. A virtualized scroller would let you scrub through the script and place cues across pages without paging clicks.
- **Page thumbnails sidebar.** Quick visual jump to a page, with a small badge showing the cue count per page.
- **Drag cue between pages.** Currently a cue is bound to its page. Allow vertical drag past the page edge to move it to the next or previous page.
- **Keyboard shortcuts beyond Esc / Delete.** Things like `J`/`K` for prev/next page, `1`-`4` to jump to active cue type, arrow keys to nudge the selected cue's Y by a small amount, `N` to focus the note input on the selected cue.
- **Multi-select / bulk operations.** Shift-click a range, then bulk delete, change type, or shift Y by a fixed amount.
- **Rename / recolor built-in types.** Today the four built-ins are immutable. Allow renaming "Lighting" to "FOH" or recoloring Mic if the default conflicts with a preferred color scheme.
- **Auto-save / recent files.** Drop a working copy into IndexedDB on every mutation so a tab crash does not lose 90 minutes of work. Keep a recent files list on the home screen.
- **Search and comments.** Full-text search across notes plus a side comment thread per cue (useful when an A2 or designer wants to leave a question).
- **Cloud sync.** Probably never. If it ever happens, do it as an opt-in syncthing-style folder, not a service.

## Workflow enhancements

- **Drag-and-drop a PDF onto the window** to load it instantly, instead of clicking Open PDF.
- **Drag-and-drop a `.cue` file** onto the window to open a project.
- **Print preview / direct print** without going through the OS PDF app.
- **Confirm before deleting** a cue that has a non-empty note (so you do not nuke a note by accident with the Delete key).
- **Snap to text baseline.** When you click to place a cue, snap the Y to the nearest text line in the PDF using PDF.js text content. This is the single biggest accuracy win.
- **Cue duplication.** `Cmd-D` to duplicate the selected cue at a small Y offset, useful for paired standby/go cues.
- **Copy/paste cues across pages.** Sometimes the same cue pattern repeats scene to scene.
- **Dragging precision: arrow keys nudge** the selected cue by 1pt; `Shift+arrow` by 10pt.
- **Shift-drag to constrain Y** (already vertical, but add a snap-to-grid mode for tidy alignment between adjacent cues).

## Theater-specific features

- **Standby vs. go markers.** Two distinct visual styles per cue (a hollow box for standby, filled for go). A1s often want both visible.
- **Cue ranges.** Some cues span a section ("mic 5.1 holds through page 7"). A range cue draws a vertical bracket along the outside edge across pages.
- **TheatreMix export.** Generate the `.tmx` (or whatever format TheatreMix imports) from the cue list so you do not duplicate data entry.
- **DCA / mic group metadata per cue.** Beyond a free-text note, structured fields for `mics`, `DCAs`, `volume offset`. This is what the plain note becomes when the tool grows up.
- **Show / venue metadata.** Show name, director, sound designer, A1, venue, opening date. Print as a header on every exported page.
- **Pre-show checklist.** A separate panel with show-day reminders independent of the script.
- **Anchor cues to PDF text, not just Y.** If the PDF gets a new revision, re-anchor cues to the surrounding text (using a small text snippet captured at placement time) and warn when an anchor cannot be found.
- **Script revision diff.** Load v1 and v2 of a script side-by-side, show which cue Y positions need to move because text reflowed.
- **Multiple PDFs per project.** Act 1, Act 2, Act 3, prologue, etc. as separate documents within one `.cue` bundle.

## Polish and quality of life

- **Cue list filters.** Filter by type, by page range, by has-note, by recently edited.
- **Per-page cue count badges** in the page navigator and thumbnails.
- **Note formatting.** Two-line notes, bold for emphasis, monospace for technical values.
- **Custom color palette** in the type manager (HSL picker, not just the 8 presets).
- **Theme: light mode for daylight rehearsal.** Currently dark only.
- **Zoom controls.** Fit-width, fit-page, 100%, custom percentage. Helps when placing very fine cues.
- **Confirmation badge** on the Save Project button when there are unsaved changes (a small dot, plus a `before-unload` warning).
- **Export options dialog.** Choose what to include (notes / no notes, color / black-and-white, only some types) before generating.
- **Black-and-white export mode** for cheap office printers that do not handle the four colors well.
- **Single-side margin override** per cue, when text on the left collides with the box and you want to push that one cue to the right edge.

## Power user features

- **MIDI / OSC trigger output.** During the show, a "performance mode" steps through cues with a footswitch and emits MIDI program changes, useful for triggering scene memories on the X32 directly.
- **Plain text cue list export** (`5.1 Mic / Open scene`) for the assistant director's clipboard.
- **CSV export** for the production manager.
- **Bulk find-and-replace** in notes (re-spell a character name across the whole script).
- **Project templates.** Save the cue type set + custom types as a template, reusable across shows.
- **Headphones mode.** A high-contrast view tuned for low-light booth use during a performance: huge cue numbers, dim everything else.

## Robustness

- **Schema versioning and migrations.** When the cue data shape changes (e.g. notes become a structured object), migrate old `.cue` files transparently.
- **Versioned bundles.** Saving creates `showname.cue`, `showname.cue.1`, `showname.cue.2`, keeping a small ring buffer of recent saves.
- **Crash recovery.** On startup, if an IndexedDB working copy exists newer than the last saved bundle, offer to restore.
- **Telemetry off by default, ever.** Personal tool, no analytics.
- **Hotkey customization.** Bind anything to anything via a JSON config.
- **Build a desktop wrapper** (Tauri preferred over Electron for size) so the app runs offline as a real native app with native file dialogs and `.cue` file association in Finder.

## Mobile / tablet (probably out of scope)

- **iPad layout.** Touch-first, Apple Pencil for fine Y placement, useful for marking up at the tech table.
- **iPhone read-only viewer** for during-show reference if the booth iPad fails.

## Anti-goals

Worth writing down so they do not accumulate by default:

- No accounts, no login, no cloud, no sharing UX.
- No in-app PDF editing (highlighting, drawing, etc.). The cue overlay is the only graphical layer.
- No "AI features" that try to guess where to place cues. The whole point is the human gets it right.
- No mobile-first design that compromises desktop ergonomics. The A1's primary tool is a real keyboard at a real table.

## How to pick what to build next

After using the tool on one real show, write down the three moments where you reached for pencil instead of the app. Build the fix for those three first. Repeat after the next show.
