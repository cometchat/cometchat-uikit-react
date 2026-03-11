import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { sanitizeHtmlStringToFragment } from "../../../utils/util";

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
            // Use safe fragment parser instead of innerHTML to prevent XSS
            // innerHTML would execute event handlers (e.g. onerror) during parsing
            const finalFragment = sanitizeHtmlStringToFragment(text, textFormatters);

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
