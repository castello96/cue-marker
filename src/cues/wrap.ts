// Shared text wrapping so the on-screen overlay and the exported PDF break
// lines identically. Works in a unit-agnostic space: callers pass a maxWidth
// and a measure() that returns widths in the same unit (PDF points here).

export function wrapText(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (para.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

let measureCtx: CanvasRenderingContext2D | null = null;

// Returns a width measurer (in points) for on-screen wrapping, using a canvas
// at the given point size treated as pixels. Matches the export font family.
export function canvasMeasure(fontSize: number): (s: string) => number {
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  const ctx = measureCtx!;
  ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
  return (s: string) => ctx.measureText(s).width;
}
