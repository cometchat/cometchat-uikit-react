import { useCallback } from "react";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { sanitizeHtmlStringToFragment } from "../../../utils/util";

export const useCometChatTextBubble = (props: { textFormatters: Array<CometChatTextFormatter> }) => {
    const {
        textFormatters,
    } = props;

    /*
        This function is used to update the message element with the updated text.
        It accepts html element and a required message string and updates the component by appending that string.
        Now supports rich text HTML tags (bold, italic, underline, etc.).
    */
    const appendTextInHtml = useCallback((textElement: HTMLElement, text: string) => {
        try {
            // Use safe fragment parser instead of innerHTML to prevent XSS
            // innerHTML would execute event handlers (e.g. onerror) during parsing
            const finalFragment = sanitizeHtmlStringToFragment(text, textFormatters, { decodeEntities: false });

            textElement.textContent = "";
            textElement.appendChild(finalFragment);

        } catch (error) {
            console.error("Error in appendTextInHtml:", error);
            textElement.textContent = text;
        }
    }, [textFormatters]);

    return {
        appendTextInHtml,
    }
}
