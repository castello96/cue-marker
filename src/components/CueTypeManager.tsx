import { useState } from 'react';
import { useStore } from '../store';
import { CUSTOM_TYPE_COLORS } from '../constants';
import styles from './CueTypeManager.module.css';

export function CueTypeManager() {
  const addCueType = useStore(s => s.addCueType);
  const setActiveTypeId = useStore(s => s.setActiveTypeId);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CUSTOM_TYPE_COLORS[0]);
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    const t = addCueType(name, color);
    setActiveTypeId(t.id);
    setName('');
    setColor(CUSTOM_TYPE_COLORS[0]);
    setOpen(false);
  };

  return (
    <div className={styles.wrap}>
      {!open ? (
        <button className={styles.add} onClick={() => setOpen(true)}>+ Add custom type</button>
      ) : (
        <div className={styles.form}>
          <input
            className={styles.name}
            placeholder="Type name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
          />
          <div className={styles.colors}>
            {CUSTOM_TYPE_COLORS.map(c => (
              <button
                key={c}
                className={styles.color}
                style={{ background: c, outline: c === color ? '2px solid #fff' : 'none' }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <div className={styles.actions}>
            <button onClick={submit} disabled={!name.trim()}>Add</button>
            <button onClick={() => { setOpen(false); setName(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
