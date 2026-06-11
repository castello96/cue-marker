import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfDocument } from '../pdf/render';
import { useStore } from '../store';
import { PdfPage } from './PdfPage';
import styles from './PdfCanvas.module.css';

export interface PageGeometry {
  scale: number;
  width: number;
  height: number;
  pdfWidth: number;
  pdfHeight: number;
}

const SPREAD_GAP = 16;

export function PdfCanvas() {
  const pdfBytes = useStore(s => s.pdfBytes);
  const currentPage = useStore(s => s.currentPage);
  const numPages = useStore(s => s.numPages);
  const viewMode = useStore(s => s.viewMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!pdfBytes) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const d = await loadPdfDocument(pdfBytes);
      if (!cancelled) setDoc(d);
    })();
    return () => { cancelled = true; };
  }, [pdfBytes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(w);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let content;
  if (!pdfBytes) {
    content = (
      <div className={styles.empty}>
        <div className={styles.title}>Open a PDF to begin</div>
        <div className={styles.sub}>Use Open PDF in the toolbar above.</div>
      </div>
    );
  } else if (viewMode === 'double') {
    const leftPage = currentPage - ((currentPage - 1) % 2);
    const rightPage = leftPage + 1;
    const pageWidth = Math.max(120, (containerWidth - SPREAD_GAP) / 2);
    content = (
      <div className={styles.spread} style={{ gap: SPREAD_GAP }}>
        <PdfPage doc={doc} page={leftPage} width={pageWidth} />
        {rightPage <= numPages && (
          <PdfPage doc={doc} page={rightPage} width={pageWidth} />
        )}
      </div>
    );
  } else {
    content = <PdfPage doc={doc} page={currentPage} width={containerWidth} />;
  }

  return (
    <div ref={containerRef} className={styles.scroll}>
      {content}
    </div>
  );
}
