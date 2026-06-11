import { useStore } from '../store';
import styles from './PageNavigator.module.css';

export function PageNavigator() {
  const currentPage = useStore(s => s.currentPage);
  const numPages = useStore(s => s.numPages);
  const viewMode = useStore(s => s.viewMode);
  const setCurrentPage = useStore(s => s.setCurrentPage);
  const setViewMode = useStore(s => s.setViewMode);
  const nextPage = useStore(s => s.nextPage);
  const prevPage = useStore(s => s.prevPage);

  if (!numPages) return null;

  const leftPage = viewMode === 'double'
    ? currentPage - ((currentPage - 1) % 2)
    : currentPage;
  const rightPage = leftPage + 1;
  const atStart = leftPage <= 1;
  const atEnd = viewMode === 'double'
    ? rightPage >= numPages
    : currentPage >= numPages;

  return (
    <div className={styles.bar}>
      <button onClick={prevPage} disabled={atStart}>Prev</button>
      <input
        type="number"
        min={1}
        max={numPages}
        value={leftPage}
        onChange={e => setCurrentPage(Number(e.target.value) || 1)}
      />
      {viewMode === 'double' && rightPage <= numPages && (
        <span className={styles.spreadLabel}>+ {rightPage}</span>
      )}
      <span className={styles.total}>of {numPages}</span>
      <button onClick={nextPage} disabled={atEnd}>Next</button>

      <div className={styles.spacer} />

      <div className={styles.viewToggle}>
        <button
          className={viewMode === 'single' ? styles.activeToggle : ''}
          onClick={() => setViewMode('single')}
        >
          Single
        </button>
        <button
          className={viewMode === 'double' ? styles.activeToggle : ''}
          onClick={() => setViewMode('double')}
        >
          Double
        </button>
      </div>
    </div>
  );
}
