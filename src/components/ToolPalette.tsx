import { useStore } from '../store';
import { CUT_COLOR, INSERT_COLOR } from '../constants';
import styles from './ToolPalette.module.css';

export function ToolPalette() {
  const tool = useStore(s => s.tool);
  const setTool = useStore(s => s.setTool);
  const showCuts = useStore(s => s.showCuts);
  const toggleShowCuts = useStore(s => s.toggleShowCuts);
  const showInserts = useStore(s => s.showInserts);
  const toggleShowInserts = useStore(s => s.toggleShowInserts);
  const cutCount = useStore(s => s.cuts.length);
  const insertCount = useStore(s => s.inserts.length);

  const hint =
    tool === 'cue'
      ? 'Click the page to place a cue.'
      : tool === 'cut'
        ? 'Drag down the page to mark a cut.'
        : 'Click the page to add an insert, then type the text.';

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>Tool</div>
      <div className={styles.toggle}>
        <button className={tool === 'cue' ? styles.active : ''} onClick={() => setTool('cue')}>Cue</button>
        <button className={tool === 'cut' ? styles.active : ''} onClick={() => setTool('cut')}>Cut</button>
        <button className={tool === 'insert' ? styles.active : ''} onClick={() => setTool('insert')}>Insert</button>
      </div>
      <div className={styles.hint}>{hint}</div>

      <div className={styles.cutsRow}>
        <span className={styles.cutsLabel}>
          <span className={styles.swatch} style={{ background: CUT_COLOR }} />
          Cuts ({cutCount})
        </span>
        <button className={styles.eye} onClick={toggleShowCuts} title={showCuts ? 'Hide cuts' : 'Show cuts'}>
          {showCuts ? 'VIS' : 'HID'}
        </button>
      </div>
      <div className={styles.cutsRow}>
        <span className={styles.cutsLabel}>
          <span className={styles.swatch} style={{ background: INSERT_COLOR }} />
          Inserts ({insertCount})
        </span>
        <button className={styles.eye} onClick={toggleShowInserts} title={showInserts ? 'Hide inserts' : 'Show inserts'}>
          {showInserts ? 'VIS' : 'HID'}
        </button>
      </div>
    </div>
  );
}
