import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCometChatTextBubble } from "./useCometChatTextBubble";
import { fireClickEvent } from "../../../utils/util";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { MentionsTargetElement } from "../../../Enums/Enums";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";

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
        isSentByMe = true
    } = props;
    const [textState, setTextState] = useState(text);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef<HTMLParagraphElement | null>(null);
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
     * Check if textFormatters are available
    */
    useEffect(() => {
        const sanitizedText = CometChatUIKitUtility.sanitizeText(text);
        setTextState(sanitizedText);
    }, [text, textFormatters, setTextState]);
    useEffect(() => {
        if (textRef.current) {
            let finalText = textState;
            if (textFormatters && textFormatters.length) {
                for (let i = 0; i < textFormatters.length; i++) {
                    (finalText as string | void) = textFormatters[i].getFormattedText(finalText, {
                        mentionsTargetElement: MentionsTargetElement.textbubble,
                    });
                }
            }
            
            appendTextInHtml(textRef.current, finalText);
        }
    }, [text, textFormatters, setIsTruncated, appendTextInHtml, textState]);

    useLayoutEffect(()=>{
        if(textRef.current){
            const isOverflowing = textRef.current.scrollHeight >= 80;
            setIsTruncated(isOverflowing);
        }
    },[text, textState, setIsTruncated])

    return (
        <div className="cometchat">
            <div className={`cometchat-text-bubble  ${isSentByMe ? "cometchat-text-bubble-outgoing" : "cometchat-text-bubble-incoming"}`}>
                <div className="cometchat-text-bubble__body">
                    <p ref={textRef} className={`cometchat-text-bubble__body-text ${isSingleEmoji(text)}`} style={{
                        WebkitLineClamp: isExpanded ? 'unset' : 4,
                    }}>{textState}</p>
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
