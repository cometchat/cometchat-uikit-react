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
    */
    const appendTextInHtml = (textElement: HTMLElement, text: string) => {
        try {
            // Create a temporary container to parse the HTML
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = text;

            // Process the container to handle nested content properly
            const processNode = (node: Node): DocumentFragment => {
              const fragment = document.createDocumentFragment();

              if (node.nodeType === Node.TEXT_NODE) {
                // Text nodes are always rendered as plain text
                const textSpan = document.createElement("span");
                textSpan.style.whiteSpace = "pre-wrap";
                textSpan.textContent = node.textContent || '';
                fragment.appendChild(textSpan);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                if (element.tagName.toLowerCase() === "span") {
                  // Check if span has any class name
                  const className = element.getAttribute("class") || "";
                  const hasClassName = className.trim().length > 0;

                  if (hasClassName) {
                    // For span elements with any class name, create a new span and render as HTML
                    const spanElement = document.createElement("span");

                    // Copy allowed attributes
                    const allowedAttributes = [
                      "class",
                      "style",
                      "data-uid",
                      "data-entity-type",
                      "data-entity-id",
                    ];
                    for (let i = 0; i < element.attributes.length; i++) {
                      const attr = element.attributes[i];
                      if (
                        allowedAttributes.includes(attr.name.toLowerCase()) &&
                        !attr.name.toLowerCase().startsWith("on") &&
                        !attr.value.toLowerCase().includes("javascript:")
                      ) {
                        spanElement.setAttribute(attr.name, attr.value);
                      }
                    }

                    // Process child nodes recursively to preserve nested spans
                    const processChildNodes = (
                      parentElement: Element,
                      targetElement: HTMLElement
                    ) => {
                      Array.from(parentElement.childNodes).forEach(
                        (childNode) => {
                          if (childNode.nodeType === Node.TEXT_NODE) {
                            targetElement.appendChild(
                              document.createTextNode(
                                childNode.textContent || ""
                              )
                            );
                          } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                            const childElement = childNode as Element;
                            if (childElement.tagName.toLowerCase() === "span") {
                              const nestedSpan = document.createElement("span");

                              // Copy allowed attributes for child span
                              for (
                                let i = 0;
                                i < childElement.attributes.length;
                                i++
                              ) {
                                const attr = childElement.attributes[i];
                                if (
                                  allowedAttributes.includes(
                                    attr.name.toLowerCase()
                                  ) &&
                                  !attr.name.toLowerCase().startsWith("on") &&
                                  !attr.value
                                    .toLowerCase()
                                    .includes("javascript:")
                                ) {
                                  nestedSpan.setAttribute(
                                    attr.name,
                                    attr.value
                                  );
                                }
                              }

                              // Recursively process nested content
                              processChildNodes(childElement, nestedSpan);
                              targetElement.appendChild(nestedSpan);
                            } else {
                              // For non-span elements, add as text
                              targetElement.appendChild(
                                document.createTextNode(childElement.outerHTML)
                              );
                            }
                          }
                        }
                      );
                    };

                    processChildNodes(element, spanElement);

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
                    // For span elements without any class name, render as plain text including the tags
                    const textSpan = document.createElement("span");
                    textSpan.style.whiteSpace = "pre-wrap";

                    const tempDiv = document.createElement("div");
                    tempDiv.appendChild(element.cloneNode(true));
                    textSpan.textContent = tempDiv.innerHTML;

                    fragment.appendChild(textSpan);
                  }
                } else {
                  // For all other elements, render as plain text including the tags
                  const textSpan = document.createElement("span");
                  textSpan.style.whiteSpace = "pre-wrap";

                  const tempDiv = document.createElement("div");
                  tempDiv.appendChild(element.cloneNode(true));
                  textSpan.textContent = tempDiv.innerHTML;

                  fragment.appendChild(textSpan);
                }
              }

              return fragment;
            };

            const finalFragment = document.createDocumentFragment();
            Array.from(tempContainer.childNodes).forEach((node) => {
              finalFragment.appendChild(processNode(node));
            });

            textElement.textContent = "";
            textElement.appendChild(finalFragment);

        } catch (error) {
            console.error("Error in appendTextInHtml:", error);
            textElement.textContent = text;
        }
    };

    return {
        appendTextInHtml,
    }
}
