import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Cue, CueSide, CueType, CueTypeId, Cut, Insert, Project, Selection, Tool } from './types';
import { BUILT_IN_CUE_TYPES, CUSTOM_TYPE_COLORS, DEFAULT_STEP } from './constants';
import { nextCueNumber, resequence } from './cues/numbering';

interface State {
  pdfBytes: Uint8Array | null;
  pdfFilename: string;
  numPages: number;
  currentPage: number;
  viewMode: 'single' | 'double';
  tool: Tool;
  cues: Cue[];
  cuts: Cut[];
  inserts: Insert[];
  cueTypes: CueType[];
  visibility: Record<CueTypeId, boolean>;
  showCuts: boolean;
  showInserts: boolean;
  activeTypeId: CueTypeId;
  selected: Selection;
  noteFocusNonce: number;

  loadPdf: (bytes: Uint8Array, filename: string, numPages: number) => void;
  setNumPages: (n: number) => void;
  setCurrentPage: (n: number) => void;
  setViewMode: (mode: 'single' | 'double') => void;
  setTool: (tool: Tool) => void;
  nextPage: () => void;
  prevPage: () => void;
  setActiveTypeId: (id: CueTypeId) => void;
  toggleVisibility: (id: CueTypeId) => void;
  toggleShowCuts: () => void;
  toggleShowInserts: () => void;
  addCueType: (name: string, color?: string) => CueType;
  updateCueType: (id: CueTypeId, patch: Partial<Pick<CueType, 'name' | 'color' | 'numbering' | 'step'>>) => void;
  removeCueType: (id: CueTypeId) => void;
  addCue: (page: number, y: number) => Cue | null;
  updateCueY: (id: CueId, y: number) => void;
  updateCueNote: (id: CueId, note: string) => void;
  updateCueSide: (id: CueId, side: CueSide) => void;
  updateCueLabel: (id: CueId, label: string) => void;
  setCueTarget: (id: CueId, target: { x: number; y: number } | null) => void;
  renumberPage: (page: number, typeId: CueTypeId) => void;
  deleteCue: (id: CueId) => void;
  addCut: (page: number, yStart: number, yEnd: number) => Cut;
  updateCutRange: (id: string, yStart: number, yEnd: number) => void;
  updateCutNote: (id: string, note: string) => void;
  deleteCut: (id: string) => void;
  addInsert: (page: number, y: number) => Insert;
  updateInsertText: (id: string, text: string) => void;
  updateInsertSide: (id: string, side: CueSide) => void;
  updateInsertY: (id: string, y: number) => void;
  deleteInsert: (id: string) => void;
  selectCue: (id: CueId | null) => void;
  selectCut: (id: string | null) => void;
  selectInsert: (id: string | null) => void;
  nudgeSelected: (delta: number) => void;
  deleteSelected: () => void;
  requestNoteFocus: () => void;
  loadProject: (project: Project, pdfBytes: Uint8Array, numPages: number) => void;
  toProject: () => Project;
  reset: () => void;
}

type CueId = string;

function pickCustomColor(existing: CueType[]): string {
  const used = new Set(existing.map(t => t.color));
  return CUSTOM_TYPE_COLORS.find(c => !used.has(c)) ?? CUSTOM_TYPE_COLORS[0];
}

const initialVisibility = (): Record<CueTypeId, boolean> => {
  const v: Record<CueTypeId, boolean> = {};
  for (const t of BUILT_IN_CUE_TYPES) v[t.id] = true;
  return v;
};

export const useStore = create<State>((set, get) => ({
  pdfBytes: null,
  pdfFilename: '',
  numPages: 0,
  currentPage: 1,
  viewMode: 'double',
  tool: 'cue',
  cues: [],
  cuts: [],
  inserts: [],
  cueTypes: [...BUILT_IN_CUE_TYPES],
  visibility: initialVisibility(),
  showCuts: true,
  showInserts: true,
  activeTypeId: BUILT_IN_CUE_TYPES[0].id,
  selected: null,
  noteFocusNonce: 0,

  loadPdf: (bytes, filename, numPages) => set({
    pdfBytes: bytes,
    pdfFilename: filename,
    numPages,
    currentPage: 1,
    cues: [],
    cuts: [],
    inserts: [],
    selected: null,
  }),

  setNumPages: (n) => set({ numPages: n }),
  setCurrentPage: (n) => set(s => ({
    currentPage: Math.max(1, Math.min(n, s.numPages || 1)),
    selected: null,
  })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTool: (tool) => set({ tool }),

  nextPage: () => set(s => {
    const stride = s.viewMode === 'double' ? 2 : 1;
    const anchor = s.viewMode === 'double'
      ? s.currentPage - ((s.currentPage - 1) % 2)
      : s.currentPage;
    return {
      currentPage: Math.min(s.numPages || 1, anchor + stride),
      selected: null,
    };
  }),
  prevPage: () => set(s => {
    const stride = s.viewMode === 'double' ? 2 : 1;
    const anchor = s.viewMode === 'double'
      ? s.currentPage - ((s.currentPage - 1) % 2)
      : s.currentPage;
    return {
      currentPage: Math.max(1, anchor - stride),
      selected: null,
    };
  }),

  setActiveTypeId: (id) => set({ activeTypeId: id }),

  toggleVisibility: (id) => set(s => ({
    visibility: { ...s.visibility, [id]: !(s.visibility[id] ?? true) },
  })),
  toggleShowCuts: () => set(s => ({ showCuts: !s.showCuts })),
  toggleShowInserts: () => set(s => ({ showInserts: !s.showInserts })),

  addCueType: (name, color) => {
    const t: CueType = {
      id: uuid(),
      name: name.trim() || 'Custom',
      color: color ?? pickCustomColor(get().cueTypes),
      builtIn: false,
      numbering: 'page',
      step: DEFAULT_STEP,
    };
    set(s => ({
      cueTypes: [...s.cueTypes, t],
      visibility: { ...s.visibility, [t.id]: true },
    }));
    return t;
  },

  updateCueType: (id, patch) => set(s => ({
    cueTypes: s.cueTypes.map(t => (t.id === id ? { ...t, ...patch } : t)),
  })),

  removeCueType: (id) => set(s => {
    if (s.cueTypes.length <= 1) return s; // keep at least one type
    const t = s.cueTypes.find(x => x.id === id);
    if (!t) return s;
    const removedCueIds = new Set(s.cues.filter(c => c.typeId === id).map(c => c.id));
    const cues = s.cues.filter(c => c.typeId !== id);
    const visibility = { ...s.visibility };
    delete visibility[id];
    const cueTypes = s.cueTypes.filter(x => x.id !== id);
    const activeTypeId = s.activeTypeId === id ? cueTypes[0]?.id ?? '' : s.activeTypeId;
    const selected =
      s.selected?.kind === 'cue' && removedCueIds.has(s.selected.id) ? null : s.selected;
    return { ...s, cues, visibility, cueTypes, activeTypeId, selected };
  }),

  addCue: (page, y) => {
    const { activeTypeId, cueTypes, cues } = get();
    const type = cueTypes.find(t => t.id === activeTypeId);
    if (!type) return null;
    const cue: Cue = {
      id: uuid(),
      typeId: activeTypeId,
      page,
      y,
      note: '',
      number: nextCueNumber(cues, type, page),
      side: 'left',
    };
    set(s => ({
      cues: [...s.cues, cue],
      selected: { kind: 'cue', id: cue.id },
    }));
    return cue;
  },

  updateCueY: (id, y) => set(s => ({
    cues: s.cues.map(c => (c.id === id ? { ...c, y } : c)),
  })),

  updateCueNote: (id, note) => set(s => ({
    cues: s.cues.map(c => (c.id === id ? { ...c, note } : c)),
  })),

  updateCueSide: (id, side) => set(s => ({
    cues: s.cues.map(c => (c.id === id ? { ...c, side } : c)),
  })),

  updateCueLabel: (id, label) => set(s => ({
    cues: s.cues.map(c => (c.id === id ? { ...c, customLabel: label.trim() || undefined } : c)),
  })),

  setCueTarget: (id, target) => set(s => ({
    cues: s.cues.map(c => (c.id === id ? { ...c, target: target ?? undefined } : c)),
  })),

  renumberPage: (page, typeId) => set(s => {
    const type = s.cueTypes.find(t => t.id === typeId);
    if (!type) return s;
    return { cues: resequence(s.cues, type, page) };
  }),

  deleteCue: (id) => set(s => ({
    cues: s.cues.filter(c => c.id !== id),
    selected: s.selected?.kind === 'cue' && s.selected.id === id ? null : s.selected,
  })),

  addCut: (page, yStart, yEnd) => {
    const cut: Cut = {
      id: uuid(),
      page,
      yStart: Math.max(0, Math.min(yStart, yEnd)),
      yEnd: Math.max(yStart, yEnd),
      note: '',
    };
    set(s => ({ cuts: [...s.cuts, cut], selected: { kind: 'cut', id: cut.id } }));
    return cut;
  },

  updateCutRange: (id, yStart, yEnd) => set(s => ({
    cuts: s.cuts.map(c => (
      c.id === id
        ? { ...c, yStart: Math.max(0, Math.min(yStart, yEnd)), yEnd: Math.max(yStart, yEnd) }
        : c
    )),
  })),

  updateCutNote: (id, note) => set(s => ({
    cuts: s.cuts.map(c => (c.id === id ? { ...c, note } : c)),
  })),

  deleteCut: (id) => set(s => ({
    cuts: s.cuts.filter(c => c.id !== id),
    selected: s.selected?.kind === 'cut' && s.selected.id === id ? null : s.selected,
  })),

  addInsert: (page, y) => {
    const insert: Insert = { id: uuid(), page, y, text: '', side: 'left' };
    set(s => ({ inserts: [...s.inserts, insert], selected: { kind: 'insert', id: insert.id } }));
    return insert;
  },

  updateInsertText: (id, text) => set(s => ({
    inserts: s.inserts.map(i => (i.id === id ? { ...i, text } : i)),
  })),

  updateInsertSide: (id, side) => set(s => ({
    inserts: s.inserts.map(i => (i.id === id ? { ...i, side } : i)),
  })),

  updateInsertY: (id, y) => set(s => ({
    inserts: s.inserts.map(i => (i.id === id ? { ...i, y: Math.max(0, y) } : i)),
  })),

  deleteInsert: (id) => set(s => ({
    inserts: s.inserts.filter(i => i.id !== id),
    selected: s.selected?.kind === 'insert' && s.selected.id === id ? null : s.selected,
  })),

  selectCue: (id) => set({ selected: id ? { kind: 'cue', id } : null }),
  selectCut: (id) => set({ selected: id ? { kind: 'cut', id } : null }),
  selectInsert: (id) => set({ selected: id ? { kind: 'insert', id } : null }),

  nudgeSelected: (delta) => set(s => {
    if (!s.selected) return s;
    const id = s.selected.id;
    if (s.selected.kind === 'cue') {
      return {
        cues: s.cues.map(c => (c.id === id ? { ...c, y: Math.max(0, c.y + delta) } : c)),
      };
    }
    if (s.selected.kind === 'insert') {
      return {
        inserts: s.inserts.map(i => (i.id === id ? { ...i, y: Math.max(0, i.y + delta) } : i)),
      };
    }
    return {
      cuts: s.cuts.map(c => {
        if (c.id !== id) return c;
        const shift = Math.max(delta, -c.yStart); // keep yStart >= 0
        return { ...c, yStart: c.yStart + shift, yEnd: c.yEnd + shift };
      }),
    };
  }),

  deleteSelected: () => {
    const { selected, deleteCue, deleteCut, deleteInsert } = get();
    if (!selected) return;
    if (selected.kind === 'cue') deleteCue(selected.id);
    else if (selected.kind === 'cut') deleteCut(selected.id);
    else deleteInsert(selected.id);
  },

  requestNoteFocus: () => set(s => ({ noteFocusNonce: s.noteFocusNonce + 1 })),

  loadProject: (project, pdfBytes, numPages) => set({
    pdfBytes,
    pdfFilename: project.pdfFilename,
    numPages,
    currentPage: 1,
    cues: project.cues.map(c => ({ ...c, side: c.side ?? 'left' })),
    cuts: (project.cuts ?? []).map(c => ({ ...c })),
    inserts: (project.inserts ?? []).map(i => ({ ...i, side: i.side ?? 'left' })),
    cueTypes: project.cueTypes.length
      ? project.cueTypes.map(t => ({ ...t, numbering: t.numbering ?? 'page', step: t.step ?? DEFAULT_STEP }))
      : [...BUILT_IN_CUE_TYPES],
    visibility: { ...initialVisibility(), ...project.visibility },
    showCuts: project.showCuts ?? true,
    showInserts: project.showInserts ?? true,
    activeTypeId: project.cueTypes[0]?.id ?? BUILT_IN_CUE_TYPES[0].id,
    selected: null,
  }),

  toProject: () => {
    const s = get();
    const now = new Date().toISOString();
    return {
      schemaVersion: 1 as const,
      pdfFilename: s.pdfFilename,
      cueTypes: s.cueTypes,
      cues: s.cues,
      cuts: s.cuts,
      inserts: s.inserts,
      visibility: s.visibility,
      showCuts: s.showCuts,
      showInserts: s.showInserts,
      createdAt: now,
      updatedAt: now,
    };
  },

  reset: () => set({
    pdfBytes: null,
    pdfFilename: '',
    numPages: 0,
    currentPage: 1,
    cues: [],
    cuts: [],
    inserts: [],
    cueTypes: [...BUILT_IN_CUE_TYPES],
    visibility: initialVisibility(),
    showCuts: true,
    showInserts: true,
    activeTypeId: BUILT_IN_CUE_TYPES[0].id,
    selected: null,
  }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { __cueStore: unknown }).__cueStore = useStore;
}
