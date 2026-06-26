import type { Cue, CueType } from '../types';
import { DEFAULT_STEP } from '../constants';

// The displayed label for a cue. Page mode shows <page> for the first cue and
// <page>.<n> for the rest; global mode shows the absolute number. A custom label
// (manual override) always wins.
export function cueLabel(cue: Cue, type: CueType | undefined): string {
  if (cue.customLabel) return cue.customLabel;
  if (type?.numbering === 'global') return `${cue.number}`;
  return cue.number === 0 ? `${cue.page}` : `${cue.page}.${cue.number}`;
}

// The next auto-assigned number for a new cue of this type. Both modes start the
// first cue at 0 and add the step thereafter, so page mode (step 10) gives
// 0, 10, 20 and global mode (step 1) gives 0, 1, 2. Numbers are stable (never
// recomputed on reorder); the gap leaves room to insert without renumbering.
export function nextCueNumber(cues: Cue[], type: CueType, page: number): number {
  const step = type.step > 0 ? type.step : DEFAULT_STEP;
  const sibs =
    type.numbering === 'global'
      ? cues.filter(c => c.typeId === type.id)
      : cues.filter(c => c.typeId === type.id && c.page === page);
  return sibs.length ? Math.max(...sibs.map(c => c.number)) + step : 0;
}

// Clean re-sequence by reading order, clearing manual overrides. Page mode
// renumbers each page independently (0, step, 2*step ...); global mode renumbers
// the whole show in page-then-position order (0, step, 2*step ...).
export function resequence(cues: Cue[], type: CueType): Cue[] {
  const step = type.step > 0 ? type.step : DEFAULT_STEP;
  const numberById = new Map<string, number>();

  if (type.numbering === 'global') {
    cues
      .filter(c => c.typeId === type.id)
      .sort((a, b) => a.page - b.page || a.y - b.y || a.id.localeCompare(b.id))
      .forEach((c, i) => numberById.set(c.id, i * step));
  } else {
    const byPage = new Map<number, Cue[]>();
    for (const c of cues.filter(c => c.typeId === type.id)) {
      const arr = byPage.get(c.page) ?? [];
      arr.push(c);
      byPage.set(c.page, arr);
    }
    for (const arr of byPage.values()) {
      arr.sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
      arr.forEach((c, i) => numberById.set(c.id, i * step));
    }
  }

  return cues.map(c =>
    c.typeId === type.id ? { ...c, number: numberById.get(c.id)!, customLabel: undefined } : c,
  );
}

// Re-sequence only one page of a page-mode type (or the whole type for global).
export function resequencePage(cues: Cue[], type: CueType, page: number): Cue[] {
  if (type.numbering === 'global') return resequence(cues, type);
  const step = type.step > 0 ? type.step : DEFAULT_STEP;
  const numberById = new Map<string, number>();
  cues
    .filter(c => c.typeId === type.id && c.page === page)
    .sort((a, b) => a.y - b.y || a.id.localeCompare(b.id))
    .forEach((c, i) => numberById.set(c.id, i * step));
  return cues.map(c =>
    c.typeId === type.id && c.page === page
      ? { ...c, number: numberById.get(c.id)!, customLabel: undefined }
      : c,
  );
}
