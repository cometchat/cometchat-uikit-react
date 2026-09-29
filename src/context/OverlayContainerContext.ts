import { createContext, useContext } from 'react';
import { useCometChatFrameContext } from './CometChatFrameContext';

/**
 * The element that fixed/overlay UI is confined to.
 *
 * Overlays (the fullscreen viewer, call screens, confirm dialogs, backdrops) must cover the
 * CometChat app and nothing else — not the host page around it. In a standalone app those are the
 * same thing, but in an embed (the low-code app inset in a page, the builder's preview pane, the
 * dashboard) they are very different, and a viewport-covering overlay reads as a broken widget.
 *
 * `CometChatThemeProvider` publishes its `.cometchat` wrapper here, and `.cometchat` carries
 * `position: relative` (styles/index.css) so `position: absolute` overlays resolve against it.
 */
export const CometChatOverlayContainerContext = createContext<HTMLElement | null>(null);

CometChatOverlayContainerContext.displayName = 'CometChatOverlayContainerContext';

/**
 * Returns the node overlays should portal into.
 *
 * Falls back to the owning document's `<body>` when no provider is present — a raw UI Kit
 * consumer mounting a component without `CometChatProvider` still gets a working overlay, just an
 * uncontained one. The fallback is the *frame's* document, not the global one, so an overlay
 * inside a widget's iframe portals within that iframe rather than into the host page.
 */
export function useOverlayContainer(): HTMLElement | null {
  const container = useContext(CometChatOverlayContainerContext);
  const { iframeDocument } = useCometChatFrameContext();
  if (container) return container;
  return (iframeDocument ?? (typeof document !== 'undefined' ? document : null))?.body ?? null;
}
