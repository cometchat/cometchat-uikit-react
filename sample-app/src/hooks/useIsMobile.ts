import { useEffect, useState } from 'react';
import { useCometChatFrameContext, useOverlayContainer } from '@cometchat/chat-uikit-react';

/** Width below which the app collapses to a single pane. */
export const MOBILE_BREAKPOINT = 768;

/**
 * Tracks whether the app should render its single-pane ("mobile") layout.
 *
 * Measures **the app's own box**, not a window. "Mobile" here means "this chat UI is narrow",
 * which is a question about the container — and the container is not always the viewport
 *
 * The observed element is `.cometchat` (the wrapper `CometChatProvider` renders), obtained from
 * `useOverlayContainer()` — the same node overlays portal into, so "the app" means the same thing
 * for layout and for containment.
 *
 * Falls back to window width when there is no container to observe (a component mounted outside
 * `CometChatProvider`, or an environment without `ResizeObserver`), which keeps the standalone
 * case working unchanged.
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const container = useOverlayContainer();
  const { iframeWindow } = useCometChatFrameContext();

  const [isMobile, setIsMobile] = useState(
    () => (iframeWindow ?? window).innerWidth < breakpoint
  );

  useEffect(() => {
    const fallbackWindow = iframeWindow ?? window;

    // No container, or no ResizeObserver: measure the window as before.
    if (!container || typeof ResizeObserver === 'undefined') {
      const update = () => setIsMobile(fallbackWindow.innerWidth < breakpoint);
      update();
      fallbackWindow.addEventListener('resize', update);
      return () => fallbackWindow.removeEventListener('resize', update);
    }

    /**
     * `getBoundingClientRect()` rather than the observer entry's `contentRect`, because the
     * initial measurement has to happen before any resize occurs — the observer fires once on
     * observe, but reading the element directly makes the first value correct even if it does not.
     */
    const measure = () => {
      const width = container.getBoundingClientRect().width;
      // A container reporting 0 is mid-layout (or display:none); the window is a better guess
      // than collapsing to the mobile layout for a frame.
      setIsMobile(width > 0 ? width < breakpoint : fallbackWindow.innerWidth < breakpoint);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container, iframeWindow, breakpoint]);

  return isMobile;
}
