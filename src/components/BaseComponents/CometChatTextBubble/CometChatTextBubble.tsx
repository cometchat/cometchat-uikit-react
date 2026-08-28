import { useEffect, useRef, useState } from "react";
import { useCometChatTextBubble } from "./useCometChatTextBubble";
import { fireClickEvent } from "../../../utils/util";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";
import { MentionsTargetElement } from "../../../Enums/Enums";

interface TextBubbleProps {
    /* text to be displayed as a message. */
    text: string;
    /* array of text formatters used for various customization purposes. */
    textFormatters?: Array<CometChatTextFormatter>;
    /* boolean to toggle bubble styling */
    isSentByMe?: boolean;
}
/*
    CometChatTextBubble is a generic component used to display text messages.
    It accepts a "text" prop for the message to be shown and a "textFormatters" array for any required text formatting for customization purposes.
    A unique id has to be provided to this component for updating the html element.
*/
const CometChatTextBubble = (props: TextBubbleProps) => {
    const {
        text = "",
        textFormatters = [],
        isSentByMe = true,
    } = props;
    const [textState, setTextState] = useState(text);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef<HTMLDivElement | null>(null);
    /**
     * Function to identify single emoji and increase font size
     * @param input 
     * @returns 
     */
    const isSingleEmoji = (input: string): string => {
        const trimmedInput = input.trim();
        const singleEmojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
        return singleEmojiRegex.test(trimmedInput) ? "cometchat-text-bubble__body-text-emoji" : "";
      };

    const {
        appendTextInHtml
    } = useCometChatTextBubble({ textFormatters });

    useEffect(()=>{
        setIsExpanded(false)
    },[text])

    /**
     * Process text: convert raw HTML to markdown, sanitize, run formatters, and render.
     * Done in a single effect to avoid flash of unsanitized content.
    */
    useEffect(() => {
        setTextState(text);
    }, [text, textFormatters, setTextState]);
    useEffect(() => {
        if (textRef.current) {
            const markdownText = CometChatUIKitUtility.convertSupportedHtmlToMarkdown(text);
            let finalText = CometChatUIKitUtility.sanitizeTextForBubble(markdownText);

            if (textFormatters && textFormatters.length) {
                for (let i = 0; i < textFormatters.length; i++) {
                    const result = textFormatters[i].getFormattedText(finalText, {
                        mentionsTargetElement: MentionsTargetElement.textbubble,
                    });
                    if (typeof result === 'string') {
                        finalText = result;
                    }
                }
            }
            appendTextInHtml(textRef.current, finalText);
            setTextState(finalText);
        }
    }, [text, textFormatters, appendTextInHtml]);

    useEffect(()=>{
        if(textRef.current){
            // Use requestAnimationFrame to measure after browser layout/paint
            requestAnimationFrame(() => {
                if(textRef.current){
                    // Use a tolerance to account for inline elements (e.g. <code>) whose
                    // padding and border add a few extra pixels to scrollHeight without
                    // the content actually overflowing visually.
                    const tolerance = 8;
                    const isOverflowing = textRef.current.scrollHeight - textRef.current.clientHeight > tolerance;
                    setIsTruncated(isOverflowing);
                }
            });
        }
    },[textState])

    return (
        <div className="cometchat">
            <div className={`cometchat-text-bubble  ${isSentByMe ? "cometchat-text-bubble-outgoing" : "cometchat-text-bubble-incoming"}`}>
                <div className="cometchat-text-bubble__body">
                    <div ref={textRef} className={`cometchat-text-bubble__body-text ${isSingleEmoji(text)} ${isExpanded ? 'cometchat-text-bubble__body-text--expanded' : ''}`} style={
                        isExpanded ? undefined : { WebkitLineClamp: 4 }
                    }></div>
                    {isTruncated && !isExpanded && (
                        <span className="cometchat-text-bubble__read-more" onClick={() => {
                                setIsExpanded(true)
                                fireClickEvent()

                            }}>{getLocalizedString("text_message_read_more")}</span>
                    )}
                    {isExpanded && isTruncated && (
                        <span className="cometchat-text-bubble__read-less" onClick={() => {
                                setIsExpanded(false)
                                fireClickEvent()
                            }}>{getLocalizedString("text_message_show_less")}</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export { CometChatTextBubble };
