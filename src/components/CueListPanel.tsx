import { useStore } from '../store';
import styles from './CueListPanel.module.css';

export function CueListPanel() {
  const cues = useStore(s => s.cues);
  const cueTypes = useStore(s => s.cueTypes);
  const visibility = useStore(s => s.visibility);
  const setCurrentPage = useStore(s => s.setCurrentPage);
  const selectCue = useStore(s => s.selectCue);
  const selected = useStore(s => s.selected);

  const typeById = new Map(cueTypes.map(t => [t.id, t]));
  const visible = cues
    .filter(c => visibility[c.typeId] !== false)
    .slice()
    .sort((a, b) => a.page - b.page || a.y - b.y);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>Cues ({visible.length})</div>
      <ul className={styles.list}>
        {visible.map(cue => {
          const type = typeById.get(cue.typeId);
          if (!type) return null;
          return (
            <li
              key={cue.id}
              className={`${styles.item} ${selected?.kind === 'cue' && selected.id === cue.id ? styles.selected : ''}`}
              onClick={() => {
                setCurrentPage(cue.page);
                selectCue(cue.id);
              }}
            >
              <span className={styles.swatch} style={{ background: type.color }} />
              <span className={styles.label}>{cue.page}.{cue.number}</span>
              <span className={styles.type}>{type.name}</span>
              <span className={styles.note}>{cue.note || ''}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
