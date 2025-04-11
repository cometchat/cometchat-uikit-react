import React, { useEffect, useState, useRef, useCallback } from "react";
import { CometChat, ReactionsRequestBuilder } from "@cometchat/chat-sdk-javascript";
import { Placement, States } from "../../../Enums/Enums";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { localize } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { useCometChatErrorHandler } from "../../../CometChatCustomHooks";

interface ReactionInfoProps {
    /* Base message object of which reaction info is viewed. */
    messageObject: CometChat.BaseMessage;
    /* Emoji reaction character. */
    reaction: string;
    /* To specify the position of the component. */
    placement?: Placement;
    /* Optional callback function to handle error logs. */
    onError?: ((error: CometChat.CometChatException) => void) | null;
}

export const CometChatReactionInfo: React.FC<ReactionInfoProps> = ({
    messageObject,
    reaction,
    placement = Placement.top,
    onError
}) => {
    const [reactionNames, setReactionNames] = useState<string[]>([]);
    const [totalReactions, setTotalReactions] = useState(0);
    const [state, setState] = useState<States>(States.loading);
    const [placementState, setPlacementState] = useState<Placement>(placement);
    const isInteracting = useRef<boolean>(false);
    const hasMessageUpdated = useRef<boolean>(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
    const infoRef = useRef<HTMLDivElement>(null);

    const reactedText = localize("REACTED");
    const andText = localize("AND");
    const othersText = localize("OTHERS");
    const youText = localize("YOU");
    const limit = CometChatUIKitConstants.requestBuilderLimits.reactionInfoLimit;
    const errorHandler = useCometChatErrorHandler(onError);

    useEffect(() => {
        checkVisibilityOfElement();
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
  
    }, []);

    useEffect(() => {
        resetElements();
        hasMessageUpdated.current = true;
        fetchReactionsOnInteraction();
    }, [messageObject]);

    const resetElements = () => {
        setReactionNames([]);
        setTotalReactions(0);
    };

    /* This function is used to check the visibility of the reaction info tooltip. */
    const checkVisibilityOfElement = useCallback(
        () => {
        try {
            observerRef.current = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        isInteracting.current = true;
                        setTotalReactions(getTotalReactionCount()!);
                        fetchReactionsOnInteraction();
                    }
                });
            });
            observerRef.current.observe(document.getElementById("reaction-info-container") as Element); 
        } catch (error) {
            errorHandler(error,"checkVisibilityOfElement")
        }
        }, []
    )

    /* Purpose of this function is to fetch the reaction data when interaction happens. */
    const fetchReactionsOnInteraction = useCallback(
        async () => {
        try {
            if (isInteracting && hasMessageUpdated) {
                isInteracting.current = false;
                hasMessageUpdated.current = false;
                setReactionNames([]);
                await fetchReactions();
            } else if (isInteracting) {
                if (state === States.error || state === States.loading) {
                    setReactionNames([]);
                    await fetchReactions();
                };
                isInteracting.current = false;
            }
        } catch (error) {
            errorHandler(error,"fetchReactionsOnInteraction")
        }
        }, []
    )

    /* The purpose of this function is to fetch the reactions data and update all the required states. */
    const fetchReactions = async () => {
        try {
            if (reactionNames.length > 0) {
                return;
            }
            setState(States.loading);
            let builder: ReactionsRequestBuilder = new CometChat.ReactionsRequestBuilder().setLimit(limit);
            const reactionBuilder = builder.setMessageId(messageObject?.getId()).setReaction(reaction).build();
            try {
                const reactionList = await reactionBuilder.fetchNext();
                const fetchedReactionNames: string[] = [];
                reactionList.forEach((reaction: any) => {
                    if (reaction?.reactedBy?.uid === loggedInUser?.getUid()) {
                        fetchedReactionNames.unshift(youText);
                    } else {
                        fetchedReactionNames.push(reaction?.reactedBy?.name);
                    }
                });
                setReactionNames(fetchedReactionNames);
                setState(States.loaded);
            } catch (error) {
                setState(States.error);
                console.log("error", error);
            }
        } catch (error) {
            errorHandler(error,"fetchReactions")
        }
    };

    /* This function is used to calculate the total count of the reactions on required message. */
    const getTotalReactionCount = () => {
       try {
        const messageReactions = messageObject.getReactions();
        const reactionObj = messageReactions.find((reaction: any) => {
            return reaction.getReaction() === reaction;
        });
        return reactionObj ? reactionObj.getCount() : 0;
       } catch (error) {
        errorHandler(error,"getTotalReactionCount")
       }
    };

    /* This function returns the Error state component for the reaction info. */
    const getErrorStateView = useCallback(
        () => (
            <div className="cometchat-reaction-info__error">
                {"Tooltip failed to load. Try again later."}
            </div>
        ), [state]
    )

    /* This function returns the Loading state component for the reaction info. */
    const getLoadingStateView = useCallback(
        () => (
            <div className="cometchat-reaction-info__loading" />
        ), [state]
    );

    /* This function returns the reaction info view when the states are loaded. */
    const getLoadedStateView = useCallback(
        () => {
            const pendingCount = totalReactions - reactionNames.length;
            return (
                <div className="cometchat-reaction-info__emoji-text">
                    <span className="cometchat-reaction-info__emoji">
                        {reaction}
                    </span>
                    <div>
                        <div className="cometchat-reaction-info__title">
                            {reactionNames?.join(", ")}
                            {totalReactions > reactionNames.length && ` ${andText} ${pendingCount} ${othersText}`}
                        </div>
                        <div className="cometchat-reaction-info__description">{reactedText}</div>
                    </div>
                </div>
            );
        }, [state]
    );

    const updatePlacementBasedOnPosition = () => {
       try {
        const height = infoRef.current?.scrollHeight!;
        const width = infoRef.current?.scrollWidth!;
        const rect = infoRef.current?.getBoundingClientRect();
        const x_left = rect?.left!,
            x_right = rect?.right!,
            y_bot = rect?.bottom!,
            y_top = rect?.top!;

        const viewportHeight = window.innerHeight, viewportWidth = window.innerWidth;
        if (placement === Placement.top || placement === Placement.bottom) {
            if (placement === Placement.top) {
                if (y_top - height - 10 < 0) {
                    setPlacementState(Placement.bottom);
                }
            } else if (placement === Placement.bottom) {
                if ((y_bot + height + 10) > viewportHeight) {
                    setPlacementState(Placement.top);
                }
            }
        } else if (placement === Placement.left || placement === Placement.right) {
            if (placement === Placement.left) {
                if (x_left - width - 10 < 0) {
                    setPlacementState(Placement.right);
                }
            } else if (placement === Placement.right) {
                if (x_right + width + 10 > viewportWidth) {
                    setPlacementState(Placement.left);
                }
            }
        }
       } catch (error) {
        errorHandler(error,"updatePlacementBasedOnPosition")
       }
    }

    useEffect(() => {
        setTimeout(() => updatePlacementBasedOnPosition(), 100);
    }, []);

    return (
        <div
            id="reaction-info-container"
            ref={infoRef}
            className="cometchat cometchat-reaction-info"
            style={placementState === Placement.top || placementState === Placement.bottom ?
                { flexDirection: "column" } :
                placementState === Placement.left || placementState === Placement.right ?
                    { flexDirection: "row" }
                    : {}
            }
        >
            <div className="cometchat-reaction-info__content">
                {state === States.loading && getLoadingStateView()}
                {state === States.error && getErrorStateView()}
                {state === States.loaded && getLoadedStateView()}
            </div>
        </div>
    );
};
