import { useState } from 'react';
import { useStore } from '../store';
import { CUSTOM_TYPE_COLORS } from '../constants';
import styles from './CueTypePalette.module.css';

export function CueTypePalette() {
  const cueTypes = useStore(s => s.cueTypes);
  const activeTypeId = useStore(s => s.activeTypeId);
  const visibility = useStore(s => s.visibility);
  const setActiveTypeId = useStore(s => s.setActiveTypeId);
  const toggleVisibility = useStore(s => s.toggleVisibility);
  const removeCueType = useStore(s => s.removeCueType);
  const updateCueType = useStore(s => s.updateCueType);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className={styles.palette}>
      <div className={styles.heading}>Cue Types</div>
      <ul className={styles.list}>
        {cueTypes.map(t => {
          const isActive = t.id === activeTypeId;
          const visible = visibility[t.id] !== false;
          const editing = editingId === t.id;

          if (editing) {
            return (
              <li key={t.id} className={`${styles.item} ${styles.editingItem}`}>
                <div className={styles.editor}>
                  <div className={styles.editorRow}>
                    <input
                      className={styles.nameInput}
                      value={t.name}
                      onChange={e => updateCueType(t.id, { name: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                      autoFocus
                    />
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={t.color}
                      onChange={e => updateCueType(t.id, { color: e.target.value })}
                      title="Custom color"
                    />
                  </div>
                  <div className={styles.colors}>
                    {CUSTOM_TYPE_COLORS.map(c => (
                      <button
                        key={c}
                        className={styles.color}
                        style={{ background: c, outline: c === t.color ? '2px solid #fff' : 'none' }}
                        onClick={() => updateCueType(t.id, { color: c })}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                  <label className={styles.subLabel}>Numbering</label>
                  <div className={styles.numbering}>
                    <button
                      className={t.numbering === 'page' ? styles.numActive : ''}
                      onClick={() => updateCueType(t.id, { numbering: 'page' })}
                      title="Page-relative: <page>.<n>"
                    >
                      Page
                    </button>
                    <button
                      className={t.numbering === 'global' ? styles.numActive : ''}
                      onClick={() => updateCueType(t.id, { numbering: 'global' })}
                      title="Sequential across the whole show"
                    >
                      Global
                    </button>
                    <input
                      type="number"
                      className={styles.stepInput}
                      value={t.step}
                      min={1}
                      onChange={e => updateCueType(t.id, { step: Math.max(1, Number(e.target.value) || 1) })}
                      title="Gap between auto-assigned numbers"
                    />
                  </div>
                  <div className={styles.editorActions}>
                    <button onClick={() => setEditingId(null)}>Done</button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => { removeCueType(t.id); setEditingId(null); }}
                      disabled={cueTypes.length <= 1}
                      title={cueTypes.length <= 1 ? 'Keep at least one type' : 'Delete type'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={t.id} className={`${styles.item} ${isActive ? styles.active : ''}`}>
              <button
                className={styles.row}
                onClick={() => setActiveTypeId(t.id)}
                title="Set as active type"
              >
                <span className={styles.swatch} style={{ background: t.color }} />
                <span className={styles.name}>{t.name}</span>
              </button>
              <button
                className={styles.eye}
                onClick={() => toggleVisibility(t.id)}
                title={visible ? 'Hide' : 'Show'}
                aria-label={visible ? 'Hide' : 'Show'}
              >
                {visible ? 'VIS' : 'HID'}
              </button>
              <button
                className={styles.edit}
                onClick={() => setEditingId(t.id)}
                title="Edit type"
                aria-label="Edit type"
              >
                Edit
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
