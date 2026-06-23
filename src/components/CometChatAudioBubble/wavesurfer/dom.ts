/* eslint-disable */
/**
 * DOM Utilities
 *
 * Helper functions for creating DOM elements.
 * Adapted from WaveSurfer library for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2
 */

type TreeNode = {
  [key: string]: string | number | boolean | CSSStyleDeclaration | TreeNode | Node;
} & {
  xmlns?: string;
  style?: Partial<CSSStyleDeclaration>;
  textContent?: string | Node;
  children?: TreeNode;
};

function renderNode(tagName: string, content: TreeNode, doc: Document): HTMLElement | SVGElement {
  const element = content.xmlns
    ? (doc.createElementNS(content.xmlns, tagName) as SVGElement)
    : (doc.createElement(tagName) as HTMLElement);

  for (const [key, value] of Object.entries(content)) {
    if (key === 'children') {
      for (const [childKey, childValue] of Object.entries(content)) {
        if (typeof childValue === 'string') {
          element.appendChild(doc.createTextNode(childValue));
        } else {
          element.appendChild(renderNode(childKey, childValue as TreeNode, doc));
        }
      }
    } else if (key === 'style') {
      Object.assign((element as HTMLElement).style, value);
    } else if (key === 'textContent') {
      element.textContent = value as string;
    } else {
      element.setAttribute(key, value.toString());
    }
  }

  return element;
}

export function createElement(
  tagName: string,
  content: TreeNode & { xmlns: string },
  container?: Node
): SVGElement;
export function createElement(tagName: string, content?: TreeNode, container?: Node): HTMLElement;
export function createElement(
  tagName: string,
  content?: TreeNode,
  container?: Node
): HTMLElement | SVGElement {
  const doc = container?.ownerDocument || document;
  const el = renderNode(tagName, content || {}, doc);
  container?.appendChild(el);
  return el;
}

export default createElement;
