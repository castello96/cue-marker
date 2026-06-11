import JSZip from 'jszip';
import type { Project } from '../types';

interface Manifest {
  schemaVersion: 1;
  pdfFilename: string;
  createdAt: string;
}

export async function packBundle(project: Project, pdfBytes: Uint8Array): Promise<Blob> {
  const zip = new JSZip();
  const manifest: Manifest = {
    schemaVersion: 1,
    pdfFilename: project.pdfFilename,
    createdAt: project.createdAt,
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('project.json', JSON.stringify(project, null, 2));
  zip.file('source.pdf', pdfBytes);
  return zip.generateAsync({ type: 'blob' });
}

export interface UnpackedBundle {
  project: Project;
  pdfBytes: Uint8Array;
}

export async function unpackBundle(file: Blob | ArrayBuffer): Promise<UnpackedBundle> {
  const zip = await JSZip.loadAsync(file);
  const projectFile = zip.file('project.json');
  const pdfFile = zip.file('source.pdf');
  if (!projectFile || !pdfFile) {
    throw new Error('Invalid .cue bundle (missing project.json or source.pdf)');
  }
  const projectJson = await projectFile.async('string');
  const project = JSON.parse(projectJson) as Project;
  const pdfBytes = new Uint8Array(await pdfFile.async('uint8array'));
  return { project, pdfBytes };
}
