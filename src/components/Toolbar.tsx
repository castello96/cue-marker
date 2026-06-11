import { useRef } from 'react';
import { useStore } from '../store';
import { packBundle, unpackBundle } from '../project/bundle';
import { exportAnnotatedPdf } from '../pdf/export';
import { loadPdfDocument } from '../pdf/render';
import styles from './Toolbar.module.css';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Toolbar() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const pdfFilename = useStore(s => s.pdfFilename);
  const pdfBytes = useStore(s => s.pdfBytes);
  const loadPdf = useStore(s => s.loadPdf);
  const loadProject = useStore(s => s.loadProject);
  const toProject = useStore(s => s.toProject);

  const handlePdfPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await loadPdfDocument(bytes);
    loadPdf(bytes, file.name, doc.numPages);
    e.target.value = '';
  };

  const handleProjectPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { project, pdfBytes } = await unpackBundle(file);
      const doc = await loadPdfDocument(pdfBytes);
      loadProject(project, pdfBytes, doc.numPages);
    } catch (err) {
      alert(`Failed to open project: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!pdfBytes) return;
    const project = toProject();
    const blob = await packBundle(project, pdfBytes);
    const base = pdfFilename.replace(/\.pdf$/i, '') || 'cue-project';
    downloadBlob(blob, `${base}.cue`);
  };

  const handleExport = async () => {
    if (!pdfBytes) return;
    const project = toProject();
    const out = await exportAnnotatedPdf(project, pdfBytes);
    const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
    const base = pdfFilename.replace(/\.pdf$/i, '') || 'cue-export';
    downloadBlob(blob, `${base}_marked.pdf`);
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>Cue Marker</div>
      <button onClick={() => pdfInputRef.current?.click()}>Open PDF</button>
      <button onClick={() => projectInputRef.current?.click()}>Open Project</button>
      <button onClick={handleSave} disabled={!pdfBytes}>Save Project</button>
      <button onClick={handleExport} disabled={!pdfBytes}>Export PDF</button>
      <span className={styles.filename}>{pdfFilename}</span>
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handlePdfPick}
        style={{ display: 'none' }}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".cue"
        onChange={handleProjectPick}
        style={{ display: 'none' }}
      />
    </div>
  );
}
