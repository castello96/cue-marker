import type { CueType } from './types';

export const BUILT_IN_CUE_TYPES: CueType[] = [
  { id: 'mic', name: 'Mic', color: '#1f6feb', builtIn: true, shortcut: 'm' },
  { id: 'track', name: 'Track', color: '#8957e5', builtIn: true, shortcut: 't' },
  { id: 'sfx', name: 'SFX', color: '#cf222e', builtIn: true, shortcut: 's' },
  { id: 'light', name: 'Lighting', color: '#bf8700', builtIn: true, shortcut: 'l' },
];

export const BOX_W = 28;
export const BOX_H = 14;
export const BOX_X = 2;
export const LANE_GAP = 3;
export const LINE_THICKNESS = 0.75;
export const LABEL_FONT_SIZE = 9;
export const NOTE_FONT_SIZE = 8;

// Cut (skipped-section) annotation styling
export const CUT_COLOR = '#6e7681';
export const CUT_WASH_OPACITY = 0.3;

// Insert (added-line) annotation styling
export const INSERT_COLOR = '#2da44e';     // border / text / caret (green)
export const INSERT_FILL = '#eaf7ee';      // light-green note background
export const INSERT_FILL_OPACITY = 0.85;   // slightly see-through so script shows
export const INSERT_BOX_W = 190;           // points, width of the margin note box
export const INSERT_PAD = 4;               // points, padding inside the box
export const INSERT_FONT_SIZE = 9;         // points
export const INSERT_LINE_H = 11;           // points, line height for wrapped text

export const CUSTOM_TYPE_COLORS = [
  '#2da44e',
  '#d4a72c',
  '#bc4c00',
  '#0969da',
  '#a475f9',
  '#cf222e',
  '#1a7f37',
  '#9a6700',
];
