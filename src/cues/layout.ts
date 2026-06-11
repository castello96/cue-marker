import type { Cue, CueSide } from '../types';
import { BOX_H, BOX_W, BOX_X, LANE_GAP } from '../constants';

// Vertical clearance (in PDF points) required between two boxes before they are
// considered to collide and need separate lanes.
const VERTICAL_GAP = 2;

/**
 * Assigns each cue a horizontal "lane" so that number boxes that would otherwise
 * overlap vertically are staggered sideways instead. Lanes are computed
 * independently per side: a left-edge box never collides with a right-edge box,
 * so each side starts its own lane numbering at 0.
 *
 * Computed in PDF point space so the on-screen overlay and the exported PDF agree.
 * Pass only the cues that will actually be drawn (single page, visible types).
 */
export function computeLanes(cues: Cue[]): Map<string, number> {
  const lanes = new Map<string, number>();
  for (const side of ['left', 'right'] as const) {
    const group = cues
      .filter(c => (c.side ?? 'left') === side)
      .slice()
      .sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
    const laneBottoms: number[] = [];
    for (const c of group) {
      const top = c.y - BOX_H / 2;
      const bottom = c.y + BOX_H / 2;
      let lane = 0;
      while (lane < laneBottoms.length && top < laneBottoms[lane] + VERTICAL_GAP) {
        lane++;
      }
      laneBottoms[lane] = bottom;
      lanes.set(c.id, lane);
    }
  }
  return lanes;
}

/**
 * X coordinate of a cue's number box, in the same unit as pageWidth.
 * Left-side boxes grow rightward from the page edge; right-side boxes grow
 * leftward from the right edge. BOX_W / BOX_X / LANE_GAP are unitless constants
 * used identically in screen-pixel space (overlay) and point space (export).
 */
export function boxXForSide(side: CueSide, lane: number, pageWidth: number): number {
  const offset = lane * (BOX_W + LANE_GAP);
  return side === 'right'
    ? pageWidth - BOX_W - BOX_X - offset
    : BOX_X + offset;
}
