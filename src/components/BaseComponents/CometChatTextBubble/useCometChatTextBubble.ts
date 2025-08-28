import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";

type ParsedNode = Node | {
    type: 'element',
    tagName: string,
    attributes: { [key: string]: string },
    innerHTML: string
};
export const useCometChatTextBubble = (props: { textFormatters: Array<CometChatTextFormatter> }) => {
    const {
        textFormatters,
    } = props;
    // The value 20 was chosen to safely handle deeply nested HTML structures
    // while preventing potential stack overflow or performance issues.
    // This should be sufficient for all expected message content.
     const MAX_RECURSION_DEPTH = 20;
     function escapeHtmlAttr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

    /*
        This function is used to update the message element with the updated text.
        It accepts html element and a required message string and updates the component by appending that string.
        Only span tags with classes are rendered as HTML, everything else is treated as plain text.
        Supports nested span tags properly and preserves all HTML tags including html, head, body.
    */
    const pasteHtml = (textElement: HTMLElement, text: string) => {
        try {
            // Manual HTML parsing to preserve all tags including html, head, body
            const parseHtmlManually = (htmlString: string): ParsedNode[] => {
                const nodes: ParsedNode[] = [];
                let currentIndex = 0;

                while (currentIndex < htmlString.length) {
                    const tagStart = htmlString.indexOf('<', currentIndex);
                    if (tagStart === -1) {
                        // No more tags, add remaining text
                        if (currentIndex < htmlString.length) {
                            nodes.push(document.createTextNode(htmlString.substring(currentIndex)));
                        }
                        break;
                    }

                    // Add text before the tag
                    if (tagStart > currentIndex) {
                        nodes.push(document.createTextNode(htmlString.substring(currentIndex, tagStart)));
                    }

                    const tagEnd = htmlString.indexOf('>', tagStart);
                    if (tagEnd === -1) {
                        // Malformed tag, treat as text
                        nodes.push(document.createTextNode(htmlString.substring(tagStart)));
                        break;
                    }

                    const fullTag = htmlString.substring(tagStart, tagEnd + 1);
                    const tagContent = htmlString.substring(tagStart + 1, tagEnd);
                    // Check if it's a closing tag or self-closing tag
                    const isClosingTag = tagContent.startsWith('/');
                    const isSelfClosing = tagContent.endsWith('/');
                    let tagName = '';
                    if (isClosingTag) {
                        tagName = tagContent.substring(1).trim();
                    } else if (isSelfClosing) {
                        tagName = tagContent.substring(0, tagContent.length - 1).trim().split(' ')[0];
                    } else {
                        tagName = tagContent.split(' ')[0].trim();
                    }

                    // Only create actual elements for span tags, everything else as text
                    if (tagName.toLowerCase() === 'span' && !isClosingTag && !isSelfClosing) {
                        // Find the matching closing tag using a proper tag matching algorithm
                        const closingTag = `</${tagName}>`;
                        let nestLevel = 1;
                        let searchIndex = tagEnd + 1;
                        let closingTagIndex = -1;

                        while (searchIndex < htmlString.length && nestLevel > 0) {
                            const nextOpenTag = htmlString.indexOf(`<${tagName}`, searchIndex);
                            const nextCloseTag = htmlString.indexOf(closingTag, searchIndex);

                            if (nextCloseTag === -1) break;

                            if (nextOpenTag !== -1 && nextOpenTag < nextCloseTag) {
                                // Found another opening tag before the closing tag
                                const nextOpenTagEnd = htmlString.indexOf('>', nextOpenTag);
                                if (nextOpenTagEnd !== -1 && !htmlString.substring(nextOpenTag, nextOpenTagEnd + 1).endsWith('/>')) {
                                    nestLevel++;
                                }
                                searchIndex = nextOpenTagEnd + 1;
                            } else {
                                // Found closing tag
                                nestLevel--;
                                if (nestLevel === 0) {
                                    closingTagIndex = nextCloseTag;
                                    break;
                                }
                                searchIndex = nextCloseTag + closingTag.length;
                            }
                        }
                        if (closingTagIndex !== -1) {
                            // Extract content between opening and closing tags
                            const innerContent = htmlString.substring(tagEnd + 1, closingTagIndex);
                            // Create element data object instead of actual element here
                            const elementData: ParsedNode = {
                                tagName: 'span',
                                attributes: {},
                                innerHTML: innerContent,
                                type: 'element'
                            };

                            // Parse attributes from the opening tag
                            // Use DOM to parse attributes robustly
                            const tempDiv = document.createElement('div');
                            // Ensure the tag is well-formed for parsing
                            tempDiv.innerHTML = fullTag.replace(/\/?>$/, '></span>');
                            const tempSpan = tempDiv.querySelector('span');
                            if (tempSpan) {
                                for (let i = 0; i < tempSpan.attributes.length; i++) {
                                    const attr = tempSpan.attributes[i];
                                    elementData.attributes[attr.name] = attr.value;
                                }
                            }

                            nodes.push(elementData);
                            currentIndex = closingTagIndex + closingTag.length;
                            continue;
                        }
                    }

                    // For all other cases, treat the tag as plain text
                    nodes.push(document.createTextNode(fullTag));
                    currentIndex = tagEnd + 1;
                }

                return nodes;
            };


            // Recursively process nodes to handle nested spans
            const processNodeRecursively = (node: ParsedNode, depth: number = 0): DocumentFragment => {
                const fragment = document.createDocumentFragment();

                if (depth > MAX_RECURSION_DEPTH) {
                    fragment.appendChild(document.createTextNode('[Max depth reached]'));
                    return fragment;
                }

                if (node instanceof Node) {
                    fragment.appendChild(document.createTextNode(node.textContent || ''));
                } else if (node.type === 'element' && node.tagName === 'span') {
                    const className = node.attributes.class || '';
                    const hasClassName = className.trim().length > 0;

                    if (hasClassName) {
                        const spanElement = document.createElement('span');
                        const allowedAttributes = ['class', 'style', 'data-uid', 'data-entity-type', 'data-entity-id'];
                        Object.keys(node.attributes).forEach(attrName => {
                            const attrValue = node.attributes[attrName];
                            if (allowedAttributes.includes(attrName.toLowerCase()) &&
                                !attrName.toLowerCase().startsWith('on') &&
                                !attrValue.toLowerCase().includes('javascript:')) {
                                spanElement.setAttribute(attrName, attrValue);
                            }
                        });

                        const innerNodes = parseHtmlManually(node.innerHTML);
                        innerNodes.forEach(innerNode => {
                            const childFragment = processNodeRecursively(innerNode, depth + 1);
                            spanElement.appendChild(childFragment);
                        });

                        if (textFormatters && textFormatters.length) {
                            for (let i = 0; i < textFormatters.length; i++) {
                                textFormatters[i].registerEventListeners(
                                    spanElement,
                                    spanElement.classList
                                );
                            }
                        }

                        fragment.appendChild(spanElement);
                    } else {
                        const reconstructedHtml = `<span${Object.keys(node.attributes).map(attr =>
                            ` ${attr}="${escapeHtmlAttr(node.attributes[attr])}"`
                        ).join('')}>${node.innerHTML}</span>`;
                        fragment.appendChild(document.createTextNode(reconstructedHtml));
                    }
                } else if (node.type === 'element') {
                    const reconstructedHtml = `<${node.tagName}${Object.keys(node.attributes).map(attr =>
                        ` ${attr}="${escapeHtmlAttr(node.attributes[attr])}"`
                    ).join('')}>${node.innerHTML}</${node.tagName}>`;
                    fragment.appendChild(document.createTextNode(reconstructedHtml));
                }

                return fragment;
           };

            // Parse and process all nodes
            const parsedNodes = parseHtmlManually(text);
            const finalFragment = document.createDocumentFragment();

            parsedNodes.forEach(node => {
                const processedFragment = processNodeRecursively(node);
                finalFragment.appendChild(processedFragment);
            });

            // Clear and append the processed content
            textElement.textContent = "";
            textElement.appendChild(finalFragment);

        } catch (error) {
            console.error("Error in pasteHtml:", error);
            // Fallback: render everything as plain text
            textElement.textContent = text;
        }
    };

    return {
        pasteHtml,
    }
}