import { useRef, useState } from 'react';
import { useStore } from '../store';
import { pdfYToPixelY, pixelYToPdfY, pdfXToPixelX, pixelXToPdfX } from '../pdf/coords';
import {
  BOX_W,
  BOX_H,
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
import { cueLabel } from '../cues/numbering';
import { wrapText, canvasMeasure } from '../cues/wrap';
import type { Cut, Insert } from '../types';
import type { PageGeometry } from './PdfCanvas';
import styles from './CueOverlay.module.css';

const measureInsert = canvasMeasure(INSERT_FONT_SIZE);

interface Props {
  geom: PageGeometry;
  page: number;
}

type Interaction =
  | { type: 'cue-drag'; cueId: string; pixelY: number }
  | { type: 'cut-new'; startPixelY: number; pixelY: number }
  | {
      type: 'cut-move';
      cutId: string;
      pointerStartY: number;
      origStart: number;
      origEnd: number;
      pixelY: number;
    }
  | { type: 'cut-resize'; cutId: string; edge: 'top' | 'bottom'; pixelY: number }
  | { type: 'insert-drag'; insertId: string; pixelY: number }
  | { type: 'cue-target-drag'; cueId: string; pixelX: number; pixelY: number }
  | null;

const MIN_CUT_PX = 6;

export function CueOverlay({ geom, page }: Props) {
  const cues = useStore(s => s.cues);
  const cueTypes = useStore(s => s.cueTypes);
  const visibility = useStore(s => s.visibility);
  const cuts = useStore(s => s.cuts);
  const showCuts = useStore(s => s.showCuts);
  const inserts = useStore(s => s.inserts);
  const showInserts = useStore(s => s.showInserts);
  const tool = useStore(s => s.tool);
  const addCue = useStore(s => s.addCue);
  const updateCueY = useStore(s => s.updateCueY);
  const addCut = useStore(s => s.addCut);
  const updateCutRange = useStore(s => s.updateCutRange);
  const addInsert = useStore(s => s.addInsert);
  const updateInsertY = useStore(s => s.updateInsertY);
  const updateCueTarget = useStore(s => s.setCueTarget);
  const selectCue = useStore(s => s.selectCue);
  const selectCut = useStore(s => s.selectCut);
  const selectInsert = useStore(s => s.selectInsert);
  const selected = useStore(s => s.selected);
  const activeTypeId = useStore(s => s.activeTypeId);
  const requestNoteFocus = useStore(s => s.requestNoteFocus);

  const svgRef = useRef<SVGSVGElement>(null);
  const [interaction, setInteraction] = useState<Interaction>(null);
  // Pointer capture can retarget the trailing click to the SVG itself; this flag
  // stops that click from creating a new annotation after selecting/dragging one.
  const suppressClickRef = useRef(false);

  const typeById = new Map(cueTypes.map(t => [t.id, t]));
  const visibleCues = cues
    .filter(c => c.page === page)
    .filter(c => visibility[c.typeId] !== false);
  const lanes = computeLanes(visibleCues);
  const pageCuts = showCuts ? cuts.filter(c => c.page === page) : [];
  const pageInserts = showInserts ? inserts.filter(i => i.page === page) : [];

  const localY = (clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(geom.height, clientY - rect.top));
  };
  const localX = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(geom.width, clientX - rect.left));
  };

  // ---- background: start a cut (cut tool) ----
  const onBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    suppressClickRef.current = false; // a fresh background interaction is starting
    if (tool !== 'cut') return;
    const y = localY(e.clientY);
    svgRef.current!.setPointerCapture(e.pointerId);
    setInteraction({ type: 'cut-new', startPixelY: y, pixelY: y });
  };

  // ---- background click: place a cue or insert (point tools) ----
  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const suppressed = suppressClickRef.current;
    suppressClickRef.current = false;
    if (e.target !== e.currentTarget) return;
    if (suppressed || interaction) return;
    const pdfY = pixelYToPdfY(localY(e.clientY), geom.scale);
    if (tool === 'cue') {
      addCue(page, pdfY);
    } else if (tool === 'insert') {
      addInsert(page, pdfY);
      requestNoteFocus();
    }
  };

  // ---- cue interactions ----
  const onCuePointerDown = (e: React.PointerEvent, cueId: string) => {
    e.stopPropagation();
    suppressClickRef.current = true;
    selectCue(cueId);
    svgRef.current!.setPointerCapture(e.pointerId);
    setInteraction({ type: 'cue-drag', cueId, pixelY: localY(e.clientY) });
  };
  const onCueDoubleClick = (e: React.MouseEvent, cueId: string) => {
    e.stopPropagation();
    selectCue(cueId);
    requestNoteFocus();
  };
  const onCueTargetPointerDown = (e: React.PointerEvent, cueId: string) => {
    e.stopPropagation();
    suppressClickRef.current = true;
    selectCue(cueId);
    svgRef.current!.setPointerCapture(e.pointerId);
    setInteraction({ type: 'cue-target-drag', cueId, pixelX: localX(e.clientX), pixelY: localY(e.clientY) });
  };

  // ---- cut interactions ----
  const onCutPointerDown = (e: React.PointerEvent, cut: Cut) => {
    e.stopPropagation();
    suppressClickRef.current = true;
    selectCut(cut.id);
    svgRef.current!.setPointerCapture(e.pointerId);
    setInteraction({
      type: 'cut-move',
      cutId: cut.id,
      pointerStartY: localY(e.clientY),
      origStart: pdfYToPixelY(cut.yStart, geom.scale),
      origEnd: pdfYToPixelY(cut.yEnd, geom.scale),
      pixelY: localY(e.clientY),
    });
  };
  const onCutHandlePointerDown = (
    e: React.PointerEvent,
    cutId: string,
    edge: 'top' | 'bottom',
  ) => {
    e.stopPropagation();
    suppressClickRef.current = true;
    selectCut(cutId);
    svgRef.current!.setPointerCapture(e.pointerId);
    setInteraction({ type: 'cut-resize', cutId, edge, pixelY: localY(e.clientY) });
  };
  const onCutDoubleClick = (e: React.MouseEvent, cutId: string) => {
    e.stopPropagation();
    selectCut(cutId);
    requestNoteFocus();
  };

  // ---- insert interactions ----
  const onInsertPointerDown = (e: React.PointerEvent, insertId: string) => {
    e.stopPropagation();
    suppressClickRef.current = true;
    selectInsert(insertId);
    svgRef.current!.setPointerCapture(e.pointerId);
    setInteraction({ type: 'insert-drag', insertId, pixelY: localY(e.clientY) });
  };
  const onInsertDoubleClick = (e: React.MouseEvent, insertId: string) => {
    e.stopPropagation();
    selectInsert(insertId);
    requestNoteFocus();
  };

  // ---- shared move / up ----
  const onPointerMove = (e: React.PointerEvent) => {
    if (!interaction) return;
    if (interaction.type === 'cue-target-drag') {
      setInteraction({ ...interaction, pixelX: localX(e.clientX), pixelY: localY(e.clientY) });
    } else {
      setInteraction({ ...interaction, pixelY: localY(e.clientY) });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!interaction) return;
    try { svgRef.current?.releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
    const y = localY(e.clientY);
    if (interaction.type === 'cue-drag') {
      updateCueY(interaction.cueId, pixelYToPdfY(y, geom.scale));
    } else if (interaction.type === 'cue-target-drag') {
      updateCueTarget(interaction.cueId, {
        x: pixelXToPdfX(localX(e.clientX), geom.scale),
        y: pixelYToPdfY(y, geom.scale),
      });
    } else if (interaction.type === 'insert-drag') {
      updateInsertY(interaction.insertId, pixelYToPdfY(y, geom.scale));
    } else if (interaction.type === 'cut-new') {
      const a = Math.min(interaction.startPixelY, y);
      const b = Math.max(interaction.startPixelY, y);
      if (b - a >= MIN_CUT_PX) {
        addCut(page, pixelYToPdfY(a, geom.scale), pixelYToPdfY(b, geom.scale));
      }
    } else if (interaction.type === 'cut-resize') {
      const cut = cuts.find(c => c.id === interaction.cutId);
      if (cut) {
        const moved = pixelYToPdfY(y, geom.scale);
        const other = interaction.edge === 'top' ? cut.yEnd : cut.yStart;
        updateCutRange(interaction.cutId, Math.min(moved, other), Math.max(moved, other));
      }
    } else if (interaction.type === 'cut-move') {
      const h = interaction.origEnd - interaction.origStart;
      let startPx = interaction.origStart + (y - interaction.pointerStartY);
      startPx = Math.max(0, Math.min(startPx, geom.height - h));
      updateCutRange(
        interaction.cutId,
        pixelYToPdfY(startPx, geom.scale),
        pixelYToPdfY(startPx + h, geom.scale),
      );
    }
    setInteraction(null);
  };

  // Display pixel span for a cut, accounting for any live interaction.
  const cutDisplay = (cut: Cut): [number, number] => {
    const baseStart = pdfYToPixelY(cut.yStart, geom.scale);
    const baseEnd = pdfYToPixelY(cut.yEnd, geom.scale);
    if (interaction?.type === 'cut-move' && interaction.cutId === cut.id) {
      const h = interaction.origEnd - interaction.origStart;
      let s = interaction.origStart + (interaction.pixelY - interaction.pointerStartY);
      s = Math.max(0, Math.min(s, geom.height - h));
      return [s, s + h];
    }
    if (interaction?.type === 'cut-resize' && interaction.cutId === cut.id) {
      return interaction.edge === 'top'
        ? [Math.min(interaction.pixelY, baseEnd), Math.max(interaction.pixelY, baseEnd)]
        : [Math.min(baseStart, interaction.pixelY), Math.max(baseStart, interaction.pixelY)];
    }
    return [baseStart, baseEnd];
  };

  const activeType = typeById.get(activeTypeId);
  const cursor =
    tool === 'cut' ? 'row-resize'
      : tool === 'insert' ? 'crosshair'
        : activeType ? 'crosshair'
          : 'default';

  const renderCutLabel = (text: string, y: number) => (
    <>
      <rect x={8} y={y - BOX_H / 2} width={BOX_W} height={BOX_H} fill="#fff" stroke={CUT_COLOR} strokeWidth={1} />
      <text
        x={8 + 4}
        y={y + 3}
        fontSize={9}
        fontWeight={700}
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        fill={CUT_COLOR}
        pointerEvents="none"
      >
        {text}
      </text>
    </>
  );

  return (
    <svg
      ref={svgRef}
      className={styles.svg}
      width={geom.width}
      height={geom.height}
      onClick={onSvgClick}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor }}
    >
      {/* cuts render first (behind cues) */}
      {pageCuts.map(cut => {
        const [startPx, endPx] = cutDisplay(cut);
        const h = Math.max(0, endPx - startPx);
        const isSelected = selected?.kind === 'cut' && selected.id === cut.id;
        return (
          <g key={cut.id} onDoubleClick={e => onCutDoubleClick(e, cut.id)}>
            <rect
              x={0}
              y={startPx}
              width={geom.width}
              height={h}
              fill={CUT_COLOR}
              opacity={isSelected ? CUT_WASH_OPACITY + 0.06 : CUT_WASH_OPACITY}
              style={{ cursor: 'move' }}
              onPointerDown={e => onCutPointerDown(e, cut)}
            />
            <rect x={2} y={startPx} width={4} height={h} fill={CUT_COLOR} pointerEvents="none" />
            <line x1={0} x2={geom.width} y1={startPx} y2={startPx} stroke={CUT_COLOR} strokeWidth={isSelected ? 1.5 : 1} strokeDasharray="5 3" pointerEvents="none" />
            <line x1={0} x2={geom.width} y1={endPx} y2={endPx} stroke={CUT_COLOR} strokeWidth={isSelected ? 1.5 : 1} strokeDasharray="5 3" pointerEvents="none" />
            {renderCutLabel('OUT', startPx)}
            {renderCutLabel('IN', endPx)}
            {h >= 22 && (
              <text
                x={geom.width / 2}
                y={(startPx + endPx) / 2}
                fontSize={16}
                fontWeight={700}
                letterSpacing={3}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill={CUT_COLOR}
                stroke="#fff"
                strokeWidth={3}
                paintOrder="stroke"
                pointerEvents="none"
              >
                CUT
              </text>
            )}
            {cut.note && (
              <text x={8 + BOX_W + 6} y={startPx + h / 2 + 3} fontSize={11} fill={CUT_COLOR} pointerEvents="none">
                {cut.note}
              </text>
            )}
            {isSelected && (
              <>
                <rect x={0} y={startPx - 5} width={geom.width} height={10} fill="transparent" style={{ cursor: 'ns-resize' }} onPointerDown={e => onCutHandlePointerDown(e, cut.id, 'top')} />
                <rect x={0} y={endPx - 5} width={geom.width} height={10} fill="transparent" style={{ cursor: 'ns-resize' }} onPointerDown={e => onCutHandlePointerDown(e, cut.id, 'bottom')} />
              </>
            )}
          </g>
        );
      })}

      {/* live preview of a new cut being drawn */}
      {interaction?.type === 'cut-new' && (() => {
        const a = Math.min(interaction.startPixelY, interaction.pixelY);
        const b = Math.max(interaction.startPixelY, interaction.pixelY);
        return (
          <g pointerEvents="none">
            <rect x={0} y={a} width={geom.width} height={b - a} fill={CUT_COLOR} opacity={CUT_WASH_OPACITY} />
            <line x1={0} x2={geom.width} y1={a} y2={a} stroke={CUT_COLOR} strokeWidth={1} strokeDasharray="5 3" />
            <line x1={0} x2={geom.width} y1={b} y2={b} stroke={CUT_COLOR} strokeWidth={1} strokeDasharray="5 3" />
          </g>
        );
      })()}

      {/* inserts render between cuts and cues */}
      {pageInserts.map(insert => {
        const isDragging = interaction?.type === 'insert-drag' && interaction.insertId === insert.id;
        const yPt = isDragging ? pixelYToPdfY(interaction.pixelY, geom.scale) : insert.y;
        const side = insert.side ?? 'left';
        const lines = wrapText(insert.text, INSERT_BOX_W - 2 * INSERT_PAD, measureInsert);
        const linesToDraw = lines.length ? lines : [''];
        const boxTopPt = yPt - INSERT_LINE_H / 2 - INSERT_PAD;
        const boxHPt = linesToDraw.length * INSERT_LINE_H + 2 * INSERT_PAD;
        const boxXPt = side === 'right' ? geom.pdfWidth - 12 - INSERT_BOX_W : 12;
        const sc = geom.scale;
        const yPx = yPt * sc;
        const isSelected = selected?.kind === 'insert' && selected.id === insert.id;
        const caret = side === 'right'
          ? `M ${geom.width - 2} ${yPx - 5} L ${geom.width - 2} ${yPx + 5} L ${geom.width - 12} ${yPx} Z`
          : `M 2 ${yPx - 5} L 2 ${yPx + 5} L 12 ${yPx} Z`;
        return (
          <g key={insert.id} onDoubleClick={e => onInsertDoubleClick(e, insert.id)}>
            <path d={caret} fill={INSERT_COLOR} pointerEvents="none" />
            <rect
              x={boxXPt * sc}
              y={boxTopPt * sc}
              width={INSERT_BOX_W * sc}
              height={boxHPt * sc}
              fill={INSERT_FILL}
              fillOpacity={INSERT_FILL_OPACITY}
              stroke={INSERT_COLOR}
              strokeWidth={isSelected ? 1.8 : 1}
              rx={2}
              style={{ cursor: 'move' }}
              onPointerDown={e => onInsertPointerDown(e, insert.id)}
            />
            {linesToDraw.map((ln, i) => (
              <text
                key={i}
                x={(boxXPt + INSERT_PAD) * sc}
                y={(boxTopPt + INSERT_PAD + i * INSERT_LINE_H + INSERT_FONT_SIZE) * sc}
                fontSize={INSERT_FONT_SIZE * sc}
                fontFamily="Helvetica, Arial, sans-serif"
                fill={INSERT_COLOR}
                pointerEvents="none"
              >
                {ln}
              </text>
            ))}
          </g>
        );
      })}

      {/* cues render on top */}
      {visibleCues.map(cue => {
        const type = typeById.get(cue.typeId);
        if (!type) return null;
        const isDragged = interaction?.type === 'cue-drag' && interaction.cueId === cue.id;
        const py = isDragged ? interaction.pixelY : pdfYToPixelY(cue.y, geom.scale);
        const isSelected = selected?.kind === 'cue' && selected.id === cue.id;
        const side = cue.side ?? 'left';
        const boxX = boxXForSide(side, lanes.get(cue.id) ?? 0, geom.width);
        const targeted = !!cue.target;
        const draggingTarget = interaction?.type === 'cue-target-drag' && interaction.cueId === cue.id;
        const ringX = targeted
          ? (draggingTarget ? interaction.pixelX : pdfXToPixelX(cue.target!.x, geom.scale))
          : 0;
        const ringRelY = targeted
          ? (draggingTarget ? interaction.pixelY : pdfYToPixelY(cue.target!.y, geom.scale)) - py
          : 0;
        const leaderStartX = side === 'right' ? boxX : boxX + BOX_W;

        return (
          <g
            key={cue.id}
            transform={`translate(0 ${py})`}
            onPointerDown={e => onCuePointerDown(e, cue.id)}
            onDoubleClick={e => onCueDoubleClick(e, cue.id)}
            className={styles.cueGroup}
            data-cue-id={cue.id}
          >
            {isSelected && (
              <rect x={boxX - 3} y={-BOX_H / 2 - 3} width={BOX_W + 6} height={BOX_H + 6} rx={3} fill={type.color} opacity={0.3} />
            )}
            {isSelected && !targeted && (
              <line x1={0} x2={geom.width} y1={0} y2={0} stroke={type.color} strokeWidth={6} opacity={0.3} />
            )}

            {targeted ? (
              <>
                <line
                  x1={leaderStartX}
                  y1={0}
                  x2={ringX}
                  y2={ringRelY}
                  stroke={type.color}
                  strokeWidth={isSelected ? 1.5 : 1}
                  opacity={isDragged ? 0.6 : 1}
                />
                <ellipse
                  cx={ringX}
                  cy={ringRelY}
                  rx={24}
                  ry={9}
                  fill="transparent"
                  stroke={type.color}
                  strokeWidth={isSelected ? 2 : 1.5}
                  style={{ cursor: 'move' }}
                  pointerEvents="all"
                  onPointerDown={e => onCueTargetPointerDown(e, cue.id)}
                />
              </>
            ) : (
              <line
                x1={0}
                x2={geom.width}
                y1={0}
                y2={0}
                stroke={type.color}
                strokeWidth={isSelected ? 2 : 1}
                opacity={isDragged ? 0.6 : 1}
              />
            )}

            <rect
              x={boxX}
              y={-BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              fill="#fff"
              stroke={type.color}
              strokeWidth={isSelected ? 2 : 1}
            />
            <text
              x={boxX + 3}
              y={3}
              fontSize={9}
              fontWeight={700}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill={type.color}
              pointerEvents="none"
            >
              {cueLabel(cue, type)}
            </text>
            {cue.note && (
              <text
                x={side === 'right' ? boxX - 6 : boxX + BOX_W + 6}
                y={-2}
                fontSize={11}
                textAnchor={side === 'right' ? 'end' : 'start'}
                fill={type.color}
                pointerEvents="none"
              >
                {cue.note}
              </text>
            )}
            {!targeted && (
              <rect
                className={styles.hitZone}
                x={0}
                y={-8}
                width={geom.width}
                height={16}
                fill="transparent"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
