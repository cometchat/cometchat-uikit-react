import { useMemo } from "react";
import { CometChatCardView } from "@cometchat/cards-react";
import { CometChatUIKit } from "../../../CometChatUIKit/CometChatUIKit";
import { CometChatUIEvents } from "../../../events/CometChatUIEvents";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";

interface CardBubbleProps {
    /** The card message. Used to read the raw card payload and to tag forwarded actions. */
    message?: CometChat.BaseMessage;
    /**
     * Raw card JSON to render. When omitted, it is derived from `message`
     * (`getCard()` → `data.card`). Used directly for nested agent-card blocks.
     */
    cardJson?: string;
    /** Toggles outgoing/incoming styling, mirroring CometChatTextBubble. */
    isSentByMe?: boolean;
    /**
     * Optional action callback for apps that use this bubble directly. The bubble
     * also always emits `ccCardActionClicked` on the UI event bus. The kit performs
     * no action behavior — the raw action object is forwarded verbatim.
     */
    onCardAction?: (message: CometChat.BaseMessage | undefined, action: any) => void;
}

/**
 * First-party bubble for developer card messages (`category: "card"`).
 *
 * Render-only: the raw card payload is stringified and handed to the prebuilt
 * `CometChatCardView` renderer (mirrors how CometChatNotificationFeed renders
 * cards). The kit never parses or mutates the card body. Card actions are
 * forwarded — never handled here.
 */
const CometChatCardBubble = (props: CardBubbleProps) => {
    const {
        message,
        cardJson: cardJsonProp,
        isSentByMe = true,
        onCardAction,
    } = props;

    // Read the raw card payload defensively: prefer the typed SDK getter when
    // present (Section 1), else fall back to the raw `data.card`.
    const cardJson = useMemo<string>(() => {
        if (typeof cardJsonProp === "string") return cardJsonProp;
        try {
            const raw =
                (message as any)?.getCard?.() ??
                ((message?.getData?.() as any)?.card);
            return raw ? (typeof raw === "string" ? raw : JSON.stringify(raw)) : "";
        } catch {
            return "";
        }
    }, [cardJsonProp, message]);

    const handleAction = (event: any) => {
        if (!event || !event.action) return;
        // Pure forward — both channels (prop + event bus). Apps pick one to avoid
        // double-handling.
        onCardAction?.(message, event.action);
        CometChatUIEvents.ccCardActionClicked.next({
            message: message as CometChat.BaseMessage,
            action: event.action,
        });
    };

    const renderFallback = () => {
        let text = "";
        try {
            text =
                (message as any)?.getFallbackText?.() ||
                (message as any)?.getText?.() ||
                "";
        } catch {
            text = "";
        }
        return text || getLocalizedString("card_message");
    };

    return (
        <div className="cometchat">
            <div
                className={`cometchat-card-bubble ${isSentByMe
                        ? "cometchat-card-bubble-outgoing"
                        : "cometchat-card-bubble-incoming"
                    }`}
            >
                <div className="cometchat-card-bubble__body">
                    {cardJson ? (
                        <CometChatCardView
                            cardJson={cardJson}
                            themeMode={CometChatUIKit.themeMode as any}
                            onAction={handleAction}
                        />
                    ) : (
                        <div className="cometchat-card-bubble__fallback">
                            {renderFallback()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export { CometChatCardBubble };
