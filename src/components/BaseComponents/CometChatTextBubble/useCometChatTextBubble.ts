import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
export const useCometChatTextBubble = (props: { textFormatters: Array<CometChatTextFormatter> }) => {
    const {
        textFormatters,
    } = props;

    const containsHTML = (input: string): boolean => {
        const div = document.createElement("div");
        div.innerHTML = input;
        return div.children.length > 0;
    };
    const decodeHTML = (input: string): string => {
        return input
            .replace(/&(?!amp;|lt;|gt;|quot;|#39;|#\d+;)/g, "&amp;")
            .replace(/&amp;(amp;|lt;|gt;|quot;|#39;|#\d+;)/g, "&$1")
    };
    /*
        This function is used to update the message element with the updated text.
        It accepts html element and a required message string and updates the component by appending that string.
    */
    const pasteHtml = (textElement: HTMLElement, text: string) => {
        try {
            let el = document.createElement("div");
            if (containsHTML(text)) {
                el.innerHTML = decodeHTML(text);
            } else {
                el.textContent = text;
            }
            let frag = document.createDocumentFragment();
            const clonedNodes = Array.from(el.childNodes);
            clonedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const span = document.createElement("span");
                    span.style.whiteSpace = "pre-wrap";
                    span.textContent = node.textContent ?? "";
                    frag.appendChild(span);
                }
                else if (node instanceof HTMLElement) {
                    if (textFormatters && textFormatters.length) {
                        for (let i = 0; i < textFormatters.length; i++) {
                            node = textFormatters[i].registerEventListeners(
                                node as HTMLElement,
                                (node as HTMLElement).classList
                            );
                        }
                    }
                    frag.appendChild(node);
                }
            });
            textElement.textContent = "";
            textElement.appendChild(frag);

        } catch (error) {
            console.error(error);
        }
    };

    return {
        pasteHtml,
    }
}
