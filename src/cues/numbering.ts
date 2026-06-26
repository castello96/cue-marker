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

// The next auto-assigned number for a new cue of this type. Numbers are stable
// (never recomputed on reorder); gaps leave room to insert without renumbering.
export function nextCueNumber(cues: Cue[], type: CueType, page: number): number {
  const step = type.step > 0 ? type.step : DEFAULT_STEP;
  if (type.numbering === 'global') {
    const sibs = cues.filter(c => c.typeId === type.id);
    return sibs.length ? Math.max(...sibs.map(c => c.number)) + step : step;
  }
  const sibs = cues.filter(c => c.typeId === type.id && c.page === page);
  return sibs.length ? Math.max(...sibs.map(c => c.number)) + step : 0;
}

// Clean re-sequence for a type, clearing any manual overrides. Page mode
// renumbers per page (0, step, 2*step ...); global mode renumbers the whole
// show by reading order (step, 2*step ...).
export function resequence(cues: Cue[], type: CueType, page: number): Cue[] {
  const step = type.step > 0 ? type.step : DEFAULT_STEP;
  const numberById = new Map<string, number>();

  if (type.numbering === 'global') {
    const ordered = cues
      .filter(c => c.typeId === type.id)
      .sort((a, b) => a.page - b.page || a.y - b.y || a.id.localeCompare(b.id));
    ordered.forEach((c, i) => numberById.set(c.id, (i + 1) * step));
    return cues.map(c =>
      c.typeId === type.id ? { ...c, number: numberById.get(c.id)!, customLabel: undefined } : c,
    );
  }

  const ordered = cues
    .filter(c => c.typeId === type.id && c.page === page)
    .sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
  ordered.forEach((c, i) => numberById.set(c.id, i * step));
  return cues.map(c =>
    c.typeId === type.id && c.page === page
      ? { ...c, number: numberById.get(c.id)!, customLabel: undefined }
      : c,
  );
}
