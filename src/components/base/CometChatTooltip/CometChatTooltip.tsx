import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './CometChatTooltip.css';

/** Which third of the tooltip the arrow sits under. */
export type CometChatTooltipArrowVariant = 'left' | 'middle' | 'right';

export interface CometChatTooltipProps {
  /**
   * Element the tooltip points at. Its bounding rect drives the position, so the
   * tooltip re-anchors whenever this element changes.
   */
  anchorEl: HTMLElement | null;
  /**
   * Element the tooltip is kept horizontally within (e.g. the composer). When the
   * anchor is scroll-clipped near an edge, the tooltip is clamped inside these
   * bounds and its arrow slides to keep pointing at the anchor. Defaults to the
   * viewport when omitted/null.
   */
  boundsEl?: HTMLElement | null;
  /** Tooltip contents. */
  children: React.ReactNode;
  /** Vertical gap between the anchor's top edge and the tooltip's bottom (px). */
  gap?: number;
  /** Minimum inset kept from the bounds' left/right edges (px). */
  boundsPadding?: number;
  /** Extra class on the tooltip box. */
  className?: string;
  /** Accessible role. Defaults to "tooltip". */
  role?: React.AriaRole;
  /**
   * Portal target. Defaults to the nearest themed `.cometchat` ancestor of the
   * anchor (so the tooltip inherits the active `data-theme` and design tokens),
   * falling back to the anchor's document body.
   */
  container?: HTMLElement | null;
}

interface Placement {
  top: number;
  left: number;
  /** Arrow offset from the tooltip's left edge (px). */
  arrowLeft: number;
  variant: CometChatTooltipArrowVariant;
}

/** Keep the arrow at least this far from the tooltip's own corners. */
const ARROW_EDGE_INSET = 12;

/**
 * CometChatTooltip — a lightweight, self-positioning tooltip.
 *
 * Portals out of any scroll container (into the nearest themed `.cometchat` wrapper
 * by default, so it inherits the active theme) and positions itself (fixed) above
 * `anchorEl`, so it is never clipped. It is centered over the anchor,
 * then clamped to stay within `boundsEl`; the little arrow slides horizontally (and
 * reports a left/middle/right variant) so it keeps pointing at the anchor's center
 * even when the box was shifted to fit.
 *
 * Presentational only — the caller controls mounting (e.g. on hover/focus).
 */
export const CometChatTooltip: React.FC<CometChatTooltipProps> = ({
  anchorEl,
  boundsEl,
  children,
  gap = 12,
  boundsPadding = 8,
  className,
  role = 'tooltip',
  container,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const tip = tooltipRef.current;
    if (!anchorEl || !tip) return;

    const anchor = anchorEl.getBoundingClientRect();
    const { width: tipW, height: tipH } = tip.getBoundingClientRect();

    // Horizontal bounds: the bounds element's rect, or the viewport.
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : tipW;
    const bounds = boundsEl?.getBoundingClientRect();
    const boundsLeft = (bounds?.left ?? 0) + boundsPadding;
    const boundsRight = (bounds?.right ?? viewportW) - boundsPadding;

    const anchorCenterX = anchor.left + anchor.width / 2;

    // Center on the anchor, then clamp the box inside the bounds. When the bounds
    // are narrower than the tooltip, pin to the left edge (nothing else fits).
    const maxLeft = boundsRight - tipW;
    const centeredLeft = anchorCenterX - tipW / 2;
    const left =
      maxLeft >= boundsLeft ? Math.min(Math.max(centeredLeft, boundsLeft), maxLeft) : boundsLeft;

    // Point the arrow at the anchor's center, kept inside the tooltip's edges.
    const arrowLeft = Math.min(
      Math.max(anchorCenterX - left, ARROW_EDGE_INSET),
      Math.max(tipW - ARROW_EDGE_INSET, ARROW_EDGE_INSET)
    );
    const variant: CometChatTooltipArrowVariant =
      arrowLeft <= tipW / 3 ? 'left' : arrowLeft >= (tipW * 2) / 3 ? 'right' : 'middle';

    setPlacement({ top: anchor.top - gap - tipH, left, arrowLeft, variant });
  }, [anchorEl, boundsEl, gap, boundsPadding, children]);

  if (!anchorEl) return null;

  const boxClass = [
    'cometchat-tooltip',
    placement ? `cometchat-tooltip--arrow-${placement.variant}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      ref={tooltipRef}
      className={boxClass}
      role={role}
      style={{
        top: placement?.top ?? 0,
        left: placement?.left ?? 0,
        // Hidden until measured so it never flashes at 0,0 on first paint.
        visibility: placement ? 'visible' : 'hidden',
        // Exact arrow position; the variant class supplies a sane fallback.
        ['--cometchat-tooltip-arrow-left' as string]: placement
          ? `${String(placement.arrowLeft)}px`
          : '50%',
      }}
    >
      {children}
    </div>,
    container ?? anchorEl.closest<HTMLElement>('.cometchat') ?? anchorEl.ownerDocument.body
  );
};

CometChatTooltip.displayName = 'CometChatTooltip';
