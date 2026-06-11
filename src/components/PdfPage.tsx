import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { renderPageToCanvas } from '../pdf/render';
import type { PageGeometry } from './PdfCanvas';
import { CueOverlay } from './CueOverlay';
import styles from './PdfCanvas.module.css';

interface Props {
  doc: PDFDocumentProxy | null;
  page: number;
  width: number;
}

export function PdfPage({ doc, page, width }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const [geom, setGeom] = useState<PageGeometry | null>(null);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      const p = await doc.getPage(page);
      if (cancelled || !canvasRef.current) return;
      // Fully tear down any in-flight render on this canvas before starting a
      // new one, or pdf.js rejects with "same canvas during multiple render()".
      if (taskRef.current) {
        try { taskRef.current.cancel(); } catch { /* already settled */ }
        try { await taskRef.current.promise; } catch { /* cancelled */ }
        taskRef.current = null;
        if (cancelled || !canvasRef.current) return;
      }
      const { task, result } = renderPageToCanvas(p, canvasRef.current, width);
      taskRef.current = task;
      try {
        const r = await result;
        if (!cancelled) setGeom(r);
      } catch { /* render cancelled */ }
    })();
    return () => {
      cancelled = true;
      if (taskRef.current) {
        try { taskRef.current.cancel(); } catch { /* already settled */ }
      }
    };
  }, [doc, page, width]);

  return (
    <div className={styles.pageColumn}>
      <div
        className={styles.pageWrap}
        style={geom ? { width: geom.width, height: geom.height } : { width }}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
        {geom && <CueOverlay geom={geom} page={page} />}
      </div>
      <div className={styles.pageCaption}>Page {page}</div>
    </div>
  );
}
