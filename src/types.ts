export type CueTypeId = string;
export type CueId = string;
export type CueSide = 'left' | 'right';

export type NumberingMode = 'page' | 'global';

export interface CueType {
  id: CueTypeId;
  name: string;
  color: string;
  builtIn: boolean;
  shortcut?: string;
  numbering: NumberingMode; // 'page' = <page>.<n>, 'global' = sequential across show
  step: number;             // gap between auto-assigned numbers (e.g. 10)
}

export interface Cue {
  id: CueId;
  typeId: CueTypeId;
  page: number;
  y: number;
  note: string;
  number: number;        // auto-assigned, stable; sub-number (page mode) or absolute (global)
  customLabel?: string;  // manual override of the displayed label
  side: CueSide;
}

export interface Cut {
  id: string;
  page: number;
  yStart: number; // PDF points from top, top edge of the cut
  yEnd: number;   // PDF points from top, bottom edge (yEnd >= yStart)
  note: string;
}

export interface Insert {
  id: string;
  page: number;
  y: number;      // PDF points from top, the line the text is added at
  text: string;
  side: CueSide;
}

export type Selection =
  | { kind: 'cue'; id: string }
  | { kind: 'cut'; id: string }
  | { kind: 'insert'; id: string }
  | null;

export type Tool = 'cue' | 'cut' | 'insert';

export interface Project {
  schemaVersion: 1;
  pdfFilename: string;
  cueTypes: CueType[];
  cues: Cue[];
  cuts: Cut[];
  inserts: Insert[];
  visibility: Record<CueTypeId, boolean>;
  showCuts: boolean;
  showInserts: boolean;
  createdAt: string;
  updatedAt: string;
}
