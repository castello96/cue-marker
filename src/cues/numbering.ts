import type { Cue } from '../types';

export function renumber(cues: Cue[]): Cue[] {
  const buckets = new Map<string, Cue[]>();
  for (const c of cues) {
    const k = `${c.page}|${c.typeId}`;
    let bucket = buckets.get(k);
    if (!bucket) {
      bucket = [];
      buckets.set(k, bucket);
    }
    bucket.push(c);
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
    bucket.forEach((c, i) => {
      c.number = i + 1;
    });
  }
  return cues;
}

export function cueLabel(cue: Cue): string {
  return `${cue.page}.${cue.number}`;
}
