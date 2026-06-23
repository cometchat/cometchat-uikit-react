/**
 * Draggable
 *
 * Makes an element draggable with pointer events.
 * Adapted from WaveSurfer library for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2
 */

export function makeDraggable(
  element: HTMLElement | null,
  onDrag: (dx: number, dy: number, x: number, y: number) => void,
  onStart?: (x: number, y: number) => void,
  onEnd?: (x: number, y: number) => void,
  threshold = 3,
  mouseButton = 0,
  touchDelay = 100
): () => void {
  if (!element) return () => void 0;

  const doc = element.ownerDocument;
  const isTouchDevice = matchMedia('(pointer: coarse)').matches;

  let unsubscribeDocument: () => void = () => void 0;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== mouseButton) return;

    event.preventDefault();
    event.stopPropagation();

    let startX = event.clientX;
    let startY = event.clientY;
    let isDragging = false;
    const touchStartTime = Date.now();

    const onPointerMove = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isTouchDevice && Date.now() - touchStartTime < touchDelay) return;

      const x = event.clientX;
      const y = event.clientY;
      const dx = x - startX;
      const dy = y - startY;

      if (isDragging || Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        const rect = element.getBoundingClientRect();
        const { left, top } = rect;

        if (!isDragging) {
          onStart?.(startX - left, startY - top);
          isDragging = true;
        }

        onDrag(dx, dy, x - left, y - top);

        startX = x;
        startY = y;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (isDragging) {
        const x = event.clientX;
        const y = event.clientY;
        const rect = element.getBoundingClientRect();
        const { left, top } = rect;

        onEnd?.(x - left, y - top);
      }
      unsubscribeDocument();
    };

    const onPointerLeave = (e: PointerEvent) => {
      // Listen to events only on the document and not on inner elements
      if (!e.relatedTarget || e.relatedTarget === doc.documentElement) {
        onPointerUp(e);
      }
    };

    const onClick = (event: MouseEvent) => {
      if (isDragging) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isDragging) {
        event.preventDefault();
      }
    };

    doc.addEventListener('pointermove', onPointerMove);
    doc.addEventListener('pointerup', onPointerUp);
    doc.addEventListener('pointerout', onPointerLeave);
    doc.addEventListener('pointercancel', onPointerLeave);
    doc.addEventListener('touchmove', onTouchMove, { passive: false });
    doc.addEventListener('click', onClick, { capture: true });

    unsubscribeDocument = () => {
      doc.removeEventListener('pointermove', onPointerMove);
      doc.removeEventListener('pointerup', onPointerUp);
      doc.removeEventListener('pointerout', onPointerLeave);
      doc.removeEventListener('pointercancel', onPointerLeave);
      doc.removeEventListener('touchmove', onTouchMove);
      setTimeout(() => {
        doc.removeEventListener('click', onClick, { capture: true });
      }, 10);
    };
  };

  element.addEventListener('pointerdown', onPointerDown);

  return () => {
    unsubscribeDocument();
    element.removeEventListener('pointerdown', onPointerDown);
  };
}
