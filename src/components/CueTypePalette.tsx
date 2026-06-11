import { useStore } from '../store';
import styles from './CueTypePalette.module.css';

export function CueTypePalette() {
  const cueTypes = useStore(s => s.cueTypes);
  const activeTypeId = useStore(s => s.activeTypeId);
  const visibility = useStore(s => s.visibility);
  const setActiveTypeId = useStore(s => s.setActiveTypeId);
  const toggleVisibility = useStore(s => s.toggleVisibility);
  const removeCueType = useStore(s => s.removeCueType);

  return (
    <div className={styles.palette}>
      <div className={styles.heading}>Cue Types</div>
      <ul className={styles.list}>
        {cueTypes.map(t => {
          const isActive = t.id === activeTypeId;
          const visible = visibility[t.id] !== false;
          return (
            <li
              key={t.id}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
            >
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
              {!t.builtIn && (
                <button
                  className={styles.delete}
                  onClick={() => removeCueType(t.id)}
                  title="Delete cue type"
                >
                  X
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
