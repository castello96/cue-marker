import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export async function loadPdfDocument(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const buf = new Uint8Array(bytes);
  return await pdfjs.getDocument({ data: buf }).promise;
}

export interface RenderResult {
  scale: number;
  width: number;
  height: number;
  pdfWidth: number;
  pdfHeight: number;
}

export interface RenderHandle {
  task: RenderTask;
  result: Promise<RenderResult>;
}

export function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  containerWidth: number,
): RenderHandle {
  const baseViewport = page.getViewport({ scale: 1 });
  const dpr = window.devicePixelRatio || 1;
  const fitScale = containerWidth / baseViewport.width;
  const viewport = page.getViewport({ scale: fitScale });

  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const task = page.render({ canvasContext: ctx, viewport, canvas });
  const result = task.promise.then(() => ({
    scale: fitScale,
    width: viewport.width,
    height: viewport.height,
    pdfWidth: baseViewport.width,
    pdfHeight: baseViewport.height,
  }));

  return { task, result };
}

if (import.meta.env.DEV) {
  (window as unknown as { __loadPdfDocument: typeof loadPdfDocument }).__loadPdfDocument = loadPdfDocument;
}
