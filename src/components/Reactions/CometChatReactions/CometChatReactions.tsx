import React, { useCallback, useEffect, useRef, useState } from "react";
import {CometChatReactionList} from "../CometChatReactionList/CometChatReactionList";
import { CometChatPopover } from "../../BaseComponents/CometChatPopover/CometChatPopover";
import {CometChatReactionInfo} from "../CometChatReactionInfo/CometChatReactionInfo";
import { MessageBubbleAlignment, Placement } from "../../../Enums/Enums";
import { useCometChatErrorHandler } from "../../../CometChatCustomHooks";

interface ReactionsProps {
    messageObject: CometChat.BaseMessage;
    alignment?: MessageBubbleAlignment;
    reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
    onReactionListItemClick?: (reaction: CometChat.Reaction,
        message: CometChat.BaseMessage) => void;
    hoverDebounceTime?: number;
    onReactionClick?: (reaction: CometChat.ReactionCount, message: CometChat.BaseMessage) => void;
    /* Optional callback function to handle error logs. */
    onError?: ((error: CometChat.CometChatException) => void) | null;
}

export const CometChatReactions: React.FC<ReactionsProps> = ({
    messageObject,
    alignment = MessageBubbleAlignment.left,
    onReactionListItemClick,
    reactionsRequestBuilder,
    hoverDebounceTime = 500,
    onReactionClick,onError
}) => {
    const errorHandler = useCometChatErrorHandler(onError);

    const [messageReactions, setMessageReactions] = useState<CometChat.ReactionCount[]>([]);
    const [maxVisibleEmojis, setMaxVisibleEmojis] = useState(0);
    const [popoverVisibility, setPopoverVisibility] = useState<Record<string, boolean>>({});
    const [moreListAlignment, setMoreListAlignment] = useState<Placement>(Placement.right);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const [previousWidth, setPreviousWidth] = useState(0);
    const parentRef: any = useRef(null);

    /* This function is used to set the reaction state. */
    const checkReaction = () => {
        try {
            setMessageReactions(messageObject.getReactions() || []);
        } catch (error) {
            errorHandler(error, "checkReaction")
        }
    };

    /* This function updates the number of allowed maximum visible emojis as per message bubble. */
    const updateMaxVisibleEmojis = useCallback(
        (availableWidth = 0) => {
            try {
                const maxVisibleEmojis = getMaxVisibleEmojis(availableWidth);
                setMaxVisibleEmojis(!isNaN(maxVisibleEmojis) ? maxVisibleEmojis : 0);
            } catch (error) {
                errorHandler(error, "updateMaxVisibleEmojis");
            }
        }, [maxVisibleEmojis]
    );

    /* This function is used to check and update the width and maximum visible emojis. */
    const attachObserver = useCallback(
        () => {
         try {
            const parentNode = parentRef.current?.parentNode?.parentNode;
            let child = null;
            if (parentNode) {
                const childNode = parentNode.querySelector('.cometchat-message-bubble__body-content-view') || parentNode.firstChild;
                if (childNode) {
                    child = childNode
                }
            }     if (child && !resizeObserver.current) {
                resizeObserver.current = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        const newWidth = entry.contentRect.width;
                        if (previousWidth !== newWidth) {
                            setPreviousWidth(newWidth);
                            updateMaxVisibleEmojis(newWidth);
                        }
                    }
                });
                resizeObserver.current.observe(child);
            }
         } catch (error) {
            errorHandler(error, "attachObserver");

         }
        }, []
    )

    /* This function calculates and returns the number of maximum possible emojis. */
    const getMaxVisibleEmojis = (availableWidth: number) => {
        try {
            const emojiWidth = 36;
            const effectiveWidth = availableWidth;
            const maxFitEmojis = Math.floor(effectiveWidth / emojiWidth);
            const adjustedMaxEmojis = Math.max(0, maxFitEmojis - 2);
            const num = Math.min(100, adjustedMaxEmojis);
            return num === 0 ? 1 : num;
        } catch (error) {
            errorHandler(error, "getMaxVisibleEmojis");
            return 1; // Default fallback
        }
    };

    /* This function returns the count of extra reaction items. */
    const moreCount = useCallback(
        () => {
            try {
                return messageReactions.length > maxVisibleEmojis
                    ? messageReactions.length - maxVisibleEmojis
                    : 0;
            } catch (error) {
                errorHandler(error, "moreCount");
                return 0;
            }        }, [messageReactions, maxVisibleEmojis]
    );

    /* This function returns the position of the message bubble. */
    const checkBubblePosition = () => {
        try {
            const bubble = parentRef.current?.parentNode;
            if (bubble) {
                const rect = bubble.getBoundingClientRect();
                const isAtTop = rect.top < window.innerHeight / 2;
                const isAtBottom = rect.bottom > window.innerHeight / 2;
                return isAtTop ? Placement.bottom : isAtBottom ? Placement.top : Placement.bottom;
            } else {
                return Placement.bottom;
            }
        } catch (error) {
            errorHandler(error, "checkBubblePosition");
            return Placement.bottom; // Default fallback
        }
    };

    /* Purpose of this function is to check and set the alignment of more reactions list. */
    const getPlacementAlignment = (callback: Function) => {
        try {
            if (window.innerWidth <= 768) {
                setMoreListAlignment(checkBubblePosition());
            } else {
                setMoreListAlignment(
                    alignment === MessageBubbleAlignment.left ? Placement.right : Placement.left
                );
            }
            callback();
        } catch (error) {
            errorHandler(error, "getPlacementAlignment");
        }
    };

    useEffect(() => {
        try {
            if (messageObject) {
                attachObserver();
                checkReaction();
            }
            return () => {
                if (resizeObserver.current) {
                    resizeObserver.current.disconnect();
                    resizeObserver.current = null;
                }
            };
        } catch (error) {
            errorHandler(error, "useEffect");
        }
    }, [messageObject, alignment]);



    /* This function returns view component for reaction info as tooltip. */
    const showReactions = useCallback(
        () => {
            return messageReactions.slice(0, maxVisibleEmojis).map((reaction,index) => {
                return (
                    <div className="cometchat-reactions-info-wrapper" key={`${reaction.getReaction()}-${index}`}
>
                        <CometChatPopover
                            useParentContainer={true}
                            showOnHover={true}
                            debounceOnHover={hoverDebounceTime}
                            placement={Placement.top}
                            key={reaction.getReaction()}
                            content={reactionPopupUi(reaction)}
                        >
                            {reactionChildUi(reaction)}
                        </CometChatPopover>
                    </div>
                );
            });
        },
        [messageReactions, maxVisibleEmojis, setPopoverVisibility, popoverVisibility]
    );

    /* This function returns Reaction Info component. */
    const reactionPopupUi = useCallback(
        (reaction: CometChat.ReactionCount) => {
            return (
                <div>
                    <CometChatReactionInfo
                        messageObject={messageObject}
                        reaction={reaction.getReaction()}
                        placement={Placement.top}
                    />
                </div>

            );
        }, [popoverVisibility]
    )

    /* This function returns the reaction on which the reaction info tooltip is opened. */
    const reactionChildUi = (reaction: CometChat.ReactionCount) => {
        return (
            <button
                className={reaction?.getReactedByMe() ? "cometchat-reactions__reaction-you" : "cometchat-reactions__reaction"}
                onClick={() => {
                    if (onReactionClick) {
                        onReactionClick(reaction, messageObject);
                    }
                }}
            >
                <span className="cometchat-reactions__reaction-emoji">
                    {reaction.getReaction()}
                </span>
                <span className="cometchat-reactions__reaction-count">
                    {reaction.getCount()}
                </span>
            </button>
        );
    };

    /* This function returns the Reaction detailed list on click of more reactions. */
    const showMoreUi = useCallback(
        (number: number) => {
            const newReactionList = messageReactions.slice(-number);
            const myReaction = newReactionList.find((reaction) => reaction.getReactedByMe());
            const showActive = !!myReaction;
            return (
                <CometChatPopover
                    useParentContainer={true}
                    placement={moreListAlignment}
                    content={
                        <div >
                            <CometChatReactionList
                                messageObject={messageObject}
                                reactionsRequestBuilder={reactionsRequestBuilder}
                                reactionItemClicked={onReactionListItemClick}
                            />
                        </div>
                    }
                    childClickHandler={(openContent: Function, e: Event) => {
                        getPlacementAlignment(() => {
                            openContent(e);
                        });
                    }}
                >
                    <div className="cometchat-reactions__more-reaction">
                        <div className="cometchat-reactions__more-reaction-count">
                            +{number}
                        </div>
                    </div>
                </CometChatPopover>
            );
        }, [messageReactions, moreListAlignment]
    );

    return (
        <div
            ref={parentRef}
            className="cometchat-reactions"
            onMouseEnter={() => updateMaxVisibleEmojis(previousWidth)}
            onMouseLeave={() => setPopoverVisibility({})}
        >
            {showReactions()}
            {moreCount() > 0 && showMoreUi(moreCount())}
        </div>
    );
};
