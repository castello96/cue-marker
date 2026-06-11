import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Cue, Project } from '../types';
import {
  BOX_W,
  BOX_H,
  LINE_THICKNESS,
  LABEL_FONT_SIZE,
  NOTE_FONT_SIZE,
  CUT_COLOR,
  CUT_WASH_OPACITY,
  INSERT_COLOR,
  INSERT_FILL,
  INSERT_FILL_OPACITY,
  INSERT_BOX_W,
  INSERT_PAD,
  INSERT_FONT_SIZE,
  INSERT_LINE_H,
} from '../constants';
import { computeLanes, boxXForSide } from '../cues/layout';
import { wrapText } from '../cues/wrap';

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  };
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = keyFn(item);
    let arr = out.get(k);
    if (!arr) {
      arr = [];
      out.set(k, arr);
    }
    arr.push(item);
  }
  return out;
}

export async function exportAnnotatedPdf(
  project: Project,
  sourceBytes: Uint8Array,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(new Uint8Array(sourceBytes));
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const typeById = new Map(project.cueTypes.map(t => [t.id, t]));

  const visibleCues: Cue[] = project.cues.filter(
    c => project.visibility[c.typeId] !== false,
  );
  const byPage = groupBy(visibleCues, c => c.page);

  for (const [pageNum, cues] of byPage) {
    const page = doc.getPage(pageNum - 1);
    const { width, height } = page.getSize();
    const lanes = computeLanes(cues);

    for (const cue of cues) {
      const type = typeById.get(cue.typeId);
      if (!type) continue;
      const { r, g, b } = hexToRgb01(type.color);
      const color = rgb(r, g, b);
      const y = height - cue.y;
      const side = cue.side ?? 'left';
      const boxX = boxXForSide(side, lanes.get(cue.id) ?? 0, width);

      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: LINE_THICKNESS,
        color,
      });

      page.drawRectangle({
        x: boxX,
        y: y - BOX_H / 2,
        width: BOX_W,
        height: BOX_H,
        borderColor: color,
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });

      const label = `${cue.page}.${cue.number}`;
      page.drawText(label, {
        x: boxX + 3,
        y: y - 4,
        size: LABEL_FONT_SIZE,
        font: helvBold,
        color,
      });

      if (cue.note) {
        const noteWidth = helv.widthOfTextAtSize(cue.note, NOTE_FONT_SIZE);
        page.drawText(cue.note, {
          x: side === 'right' ? boxX - 6 - noteWidth : boxX + BOX_W + 6,
          y: y + 2,
          size: NOTE_FONT_SIZE,
          font: helv,
          color,
        });
      }
    }
  }

  if (project.showCuts !== false) {
    const cutColor = (() => { const { r, g, b } = hexToRgb01(CUT_COLOR); return rgb(r, g, b); })();
    const cutsByPage = groupBy(project.cuts ?? [], c => c.page);
    for (const [pageNum, pageCuts] of cutsByPage) {
      const page = doc.getPage(pageNum - 1);
      const { width, height } = page.getSize();

      const drawCutLabel = (text: string, yTopOrigin: number) => {
        const y = height - yTopOrigin;
        page.drawRectangle({
          x: 8, y: y - BOX_H / 2, width: BOX_W, height: BOX_H,
          borderColor: cutColor, borderWidth: 1, color: rgb(1, 1, 1),
        });
        page.drawText(text, { x: 12, y: y - 4, size: LABEL_FONT_SIZE, font: helvBold, color: cutColor });
      };

      for (const cut of pageCuts) {
        const yTop = height - cut.yStart;   // top boundary (larger pdf-y)
        const yBot = height - cut.yEnd;     // bottom boundary
        const h = Math.max(0, yTop - yBot);

        page.drawRectangle({ x: 0, y: yBot, width, height: h, color: cutColor, opacity: CUT_WASH_OPACITY });
        page.drawRectangle({ x: 2, y: yBot, width: 4, height: h, color: cutColor });
        page.drawLine({ start: { x: 0, y: yTop }, end: { x: width, y: yTop }, thickness: 1, color: cutColor, dashArray: [5, 3] });
        page.drawLine({ start: { x: 0, y: yBot }, end: { x: width, y: yBot }, thickness: 1, color: cutColor, dashArray: [5, 3] });
        drawCutLabel('OUT', cut.yStart);
        drawCutLabel('IN', cut.yEnd);
        if (h >= 18) {
          const size = 14;
          const tw = helvBold.widthOfTextAtSize('CUT', size);
          const tx = width / 2 - tw / 2;
          const ty = yBot + h / 2 - size * 0.35;
          // white halo (8 offset copies) so CUT stays legible over the wash and text
          const o = 0.9;
          const white = rgb(1, 1, 1);
          for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]) {
            page.drawText('CUT', { x: tx + dx, y: ty + dy, size, font: helvBold, color: white });
          }
          page.drawText('CUT', { x: tx, y: ty, size, font: helvBold, color: cutColor });
        }
        if (cut.note) {
          page.drawText(cut.note, { x: 8 + BOX_W + 6, y: yBot + h / 2, size: NOTE_FONT_SIZE, font: helv, color: cutColor });
        }
      }
    }
  }

  if (project.showInserts !== false) {
    const insColor = (() => { const { r, g, b } = hexToRgb01(INSERT_COLOR); return rgb(r, g, b); })();
    const insFill = (() => { const { r, g, b } = hexToRgb01(INSERT_FILL); return rgb(r, g, b); })();
    const measure = (s: string) => helv.widthOfTextAtSize(s, INSERT_FONT_SIZE);
    const insByPage = groupBy(project.inserts ?? [], i => i.page);
    for (const [pageNum, pageInserts] of insByPage) {
      const page = doc.getPage(pageNum - 1);
      const { width, height } = page.getSize();
      for (const insert of pageInserts) {
        const lines = wrapText(insert.text, INSERT_BOX_W - 2 * INSERT_PAD, measure);
        const linesToDraw = lines.length ? lines : [''];
        const side = insert.side ?? 'left';
        const boxTopPt = insert.y - INSERT_LINE_H / 2 - INSERT_PAD;
        const boxHPt = linesToDraw.length * INSERT_LINE_H + 2 * INSERT_PAD;
        const boxXPt = side === 'right' ? width - 12 - INSERT_BOX_W : 12;
        const lineY = height - insert.y;

        page.drawRectangle({
          x: boxXPt,
          y: height - (boxTopPt + boxHPt),
          width: INSERT_BOX_W,
          height: boxHPt,
          color: insFill,
          opacity: INSERT_FILL_OPACITY,
          borderColor: insColor,
          borderWidth: 1,
        });

        const caretPath = side === 'right' ? 'M 10 0 L 0 5 L 10 10 Z' : 'M 0 0 L 10 5 L 0 10 Z';
        const caretX = side === 'right' ? width - 12 : 2;
        page.drawSvgPath(caretPath, { x: caretX, y: lineY + 5, color: insColor });

        linesToDraw.forEach((ln, i) => {
          if (!ln) return;
          const baselineTop = boxTopPt + INSERT_PAD + i * INSERT_LINE_H + INSERT_FONT_SIZE;
          page.drawText(ln, { x: boxXPt + INSERT_PAD, y: height - baselineTop, size: INSERT_FONT_SIZE, font: helv, color: insColor });
        });
      }
    }
  }

  const out = await doc.save();
  return out;
}
