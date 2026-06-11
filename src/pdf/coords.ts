export function pixelYToPdfY(pixelY: number, scale: number): number {
  return pixelY / scale;
}

export function pdfYToPixelY(pdfY: number, scale: number): number {
  return pdfY * scale;
}

export function pdfPointsWidthToPixels(pdfWidth: number, scale: number): number {
  return pdfWidth * scale;
}
