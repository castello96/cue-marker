import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { CUT_COLOR, INSERT_COLOR } from '../constants';
import { cueLabel } from '../cues/numbering';
import styles from './CueInspector.module.css';

export function CueInspector() {
  const cues = useStore(s => s.cues);
  const cuts = useStore(s => s.cuts);
  const inserts = useStore(s => s.inserts);
  const cueTypes = useStore(s => s.cueTypes);
  const selected = useStore(s => s.selected);
  const updateCueNote = useStore(s => s.updateCueNote);
  const updateCueSide = useStore(s => s.updateCueSide);
  const updateCueLabel = useStore(s => s.updateCueLabel);
  const renumberPage = useStore(s => s.renumberPage);
  const deleteCue = useStore(s => s.deleteCue);
  const updateCutNote = useStore(s => s.updateCutNote);
  const deleteCut = useStore(s => s.deleteCut);
  const updateInsertText = useStore(s => s.updateInsertText);
  const updateInsertSide = useStore(s => s.updateInsertSide);
  const deleteInsert = useStore(s => s.deleteInsert);
  const noteFocusNonce = useStore(s => s.noteFocusNonce);

  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const firstRun = useRef(true);

  // Focus the text field only when explicitly requested (Enter / double-click /
  // insert creation), never on plain selection.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    fieldRef.current?.focus();
    fieldRef.current?.select();
  }, [noteFocusNonce]);

  const cue = selected?.kind === 'cue' ? cues.find(c => c.id === selected.id) : undefined;
  const cut = selected?.kind === 'cut' ? cuts.find(c => c.id === selected.id) : undefined;
  const insert = selected?.kind === 'insert' ? inserts.find(i => i.id === selected.id) : undefined;
  const type = cue ? cueTypes.find(t => t.id === cue.typeId) : undefined;

  const singleLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const SideToggle = ({ side, onSet }: { side: 'left' | 'right'; onSet: (s: 'left' | 'right') => void }) => (
    <>
      <label className={styles.fieldLabel}>{cue ? 'Number side' : 'Text side'}</label>
      <div className={styles.sideToggle}>
        <button className={side === 'left' ? styles.activeSide : ''} onClick={() => onSet('left')}>Left</button>
        <button className={side === 'right' ? styles.activeSide : ''} onClick={() => onSet('right')}>Right</button>
      </div>
    </>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>Selected</div>

      {cue && (
        <div className={styles.body}>
          <div className={styles.title}>
            <span className={styles.swatch} style={{ background: type?.color }} />
            <span className={styles.label}>{type?.name} {cueLabel(cue, type)}</span>
          </div>

          <label className={styles.fieldLabel}>Number</label>
          <div className={styles.numberRow}>
            <input
              className={styles.note}
              value={cueLabel(cue, type)}
              onChange={e => updateCueLabel(cue.id, e.target.value)}
              onKeyDown={singleLineKeyDown}
              title="Edit to override; clear to revert to auto-numbering"
            />
            <button
              className={styles.renumber}
              onClick={() => renumberPage(cue.page, cue.typeId)}
              title="Re-sequence cleanly with gaps"
            >
              {type?.numbering === 'global' ? 'Renumber all' : 'Renumber page'}
            </button>
          </div>

          <label className={styles.fieldLabel}>Note</label>
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            className={styles.note}
            placeholder="Add a note"
            value={cue.note}
            onChange={e => updateCueNote(cue.id, e.target.value)}
            onKeyDown={singleLineKeyDown}
          />
          <SideToggle side={cue.side ?? 'left'} onSet={s => updateCueSide(cue.id, s)} />
          <button className={styles.delete} onClick={() => deleteCue(cue.id)}>Delete cue</button>
        </div>
      )}

      {cut && (
        <div className={styles.body}>
          <div className={styles.title}>
            <span className={styles.swatch} style={{ background: CUT_COLOR }} />
            <span className={styles.label}>Cut (page {cut.page})</span>
          </div>
          <label className={styles.fieldLabel}>Note</label>
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            className={styles.note}
            placeholder="e.g. cut to top of next scene"
            value={cut.note}
            onChange={e => updateCutNote(cut.id, e.target.value)}
            onKeyDown={singleLineKeyDown}
          />
          <button className={styles.delete} onClick={() => deleteCut(cut.id)}>Delete cut</button>
        </div>
      )}

      {insert && (
        <div className={styles.body}>
          <div className={styles.title}>
            <span className={styles.swatch} style={{ background: INSERT_COLOR }} />
            <span className={styles.label}>Insert (page {insert.page})</span>
          </div>
          <label className={styles.fieldLabel}>Added text</label>
          <textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            className={styles.textarea}
            placeholder="Type the added line(s)"
            rows={3}
            value={insert.text}
            onChange={e => updateInsertText(insert.id, e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              } else if ((e.key === 'Backspace' || e.key === 'Delete') && insert.text === '') {
                e.preventDefault();
                deleteInsert(insert.id);
              }
            }}
          />
          <SideToggle side={insert.side ?? 'left'} onSet={s => updateInsertSide(insert.id, s)} />
          <button className={styles.delete} onClick={() => deleteInsert(insert.id)}>Delete insert</button>
        </div>
      )}

      {!cue && !cut && !insert && (
        <div className={styles.placeholder}>
          Click a cue, cut, or insert to edit it. Press Enter to jump to its text.
        </div>
      )}
    </div>
  );
}
