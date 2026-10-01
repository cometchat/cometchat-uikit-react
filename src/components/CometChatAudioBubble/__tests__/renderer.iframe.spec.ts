import { afterEach, describe, expect, it } from 'vitest';
import Renderer from '../wavesurfer/renderer';

/**
 * The no-code widget renders the chat inside an iframe, so the waveform container belongs to the
 * iframe's realm: it is an instance of the iframe window's HTMLElement, not the host page's.
 */
describe('wavesurfer Renderer with a container inside an iframe', () => {
  let iframe: HTMLIFrameElement | undefined;

  const containerInIframe = (): { el: HTMLElement; doc: Document; win: Window } => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const win = iframe.contentWindow!;
    const el = doc.createElement('div');
    doc.body.appendChild(el);
    return { el, doc, win };
  };

  afterEach(() => {
    iframe?.remove();
  });

  it('is a different realm, so the host HTMLElement check alone cannot recognise it', () => {
    const { el, win } = containerInIframe();
    expect(el instanceof HTMLElement).toBe(false);
    expect(el instanceof (win as Window & typeof globalThis).HTMLElement).toBe(true);
  });

  it('throws "Container not found" without the iframe document and window', () => {
    const { el } = containerInIframe();
    expect(() => new Renderer({ container: el, height: 16 } as never)).toThrow(
      'Container not found'
    );
  });

  it("mounts into the iframe when given the container's own document and window", () => {
    const { el, doc, win } = containerInIframe();
    expect(
      () => new Renderer({ container: el, height: 16 } as never, undefined, doc, win)
    ).not.toThrow();
    expect(el.children.length).toBeGreaterThan(0);
  });
});
