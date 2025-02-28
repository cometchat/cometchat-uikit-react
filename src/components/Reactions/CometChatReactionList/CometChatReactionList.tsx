import React, { useEffect, useState, useRef, useCallback, UIEvent } from "react";
import { CometChat, ReactionCount } from "@cometchat/chat-sdk-javascript";
import { CometChatListItem } from "../../BaseComponents/CometChatListItem/CometChatListItem";
import { States } from "../../../Enums/Enums";
import { localize } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { useCometChatErrorHandler } from "../../../CometChatCustomHooks";

interface ReactionListProps {
    /* Base message object of which reaction info is viewed. */
    messageObject: CometChat.BaseMessage;
    /* Builder used to update the reactions details in message. */
    reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
    /* Callback which is triggered when any of the reaction item is clicked. */
    reactionItemClicked?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
     /* Optional callback function to handle error logs. */
    onError?: ((error: CometChat.CometChatException) => void) | null;
}

export const CometChatReactionList: React.FC<ReactionListProps> = ({
    messageObject,
    reactionsRequestBuilder,
    reactionItemClicked,
    onError
}) => {
    const [messageReactions, setMessageReactions] = useState<CometChat.ReactionCount[]>([]);
    const [selectedReaction, setSelectedReaction] = useState<string>("all");
    const [requestBuilderMap, setRequestBuilderMap] = useState<Record<string, CometChat.ReactionsRequest>>({});
    const [reactionList, setReactionList] = useState<Record<string, CometChat.Reaction[]>>({});
    const [state, setState] = useState<States>(States.loading);
    const [currentUIList, setCurrentUIList] = useState<CometChat.Reaction[]>([]);
    const [messageUpdated, setMessageUpdated] = useState<boolean>(true);
    const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);

    const selectedRecRef = useRef<string>();

    const allText = localize("ALL");
    const subtitleText = localize("CLICK_TO_REMOVE");
    const youText = localize("YOU");
    const limit = CometChatUIKitConstants.requestBuilderLimits.reactionListLimit;
    const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
    const parentRef = useRef<HTMLDivElement | null>(null);
    const requestBuilderRef = useRef<CometChat.ReactionsRequestBuilder | undefined>(undefined);
    const errorHandler = useCometChatErrorHandler(onError);

    useEffect(() => {
        if (selectedReaction || messageObject) {
            if (messageObject) {
                setMessageUpdated(true);
            }
            showReactionsIfNeeded();
        }
    }, [selectedReaction, messageObject]);

    /* This function is used to check and set the reactions data. */
    const checkReaction = useCallback(
        () => {
            try {
                setMessageReactions(messageObject?.getReactions() || []);
            } catch (error) {
                errorHandler(error,"checkReaction")
            }
        }, [messageObject]
    );

    /* Purpose of this function is to reset all the states used in the component. */
    const resetComponent = () => {
       try {
        setMessageReactions([]);
        setSelectedReaction("all");
        setRequestBuilderMap({});
        setReactionList({});
        setState(States.loading);
        setIsFirstRender(true);
       } catch (error) {
        errorHandler(error,"resetComponent")

       }
    };

    /* This function returns a request builder which is used to fetch and update the reactions data. */
    const getRequestBuilder = useCallback(
        (reaction: string) => {
           try {
            if (requestBuilderMap[reaction]) {
                return requestBuilderMap[reaction];
            }

            if (reactionsRequestBuilder) {
                requestBuilderRef.current = reactionsRequestBuilder;
            } else {
                requestBuilderRef.current = new CometChat.ReactionsRequestBuilder().setLimit(
                    limit
                );
            }
            requestBuilderRef.current.setMessageId(messageObject?.getId());

            if (reaction !== "all") {
                requestBuilderRef.current.setReaction(reaction);
            }

            const request = requestBuilderRef.current.build();
            setRequestBuilderMap((prevState) => {
                return {
                    ...prevState, [reaction || "all"]: request
                }
            });
            return request;
           } catch (error) {
            errorHandler(error,"getRequestBuilder")

           }
        }, [requestBuilderMap]
    );

    /* This function is used to trigger the fetch reaction list logic and update the list state. */
    const showReactions = useCallback(
        async () => {
           try {
            const requestBuilder = getRequestBuilder(selectedRecRef.current!);
            const list = await getReactionList(requestBuilder!, selectedRecRef.current!);
            setCurrentUIList(list!);
           } catch (error) {
            errorHandler(error,"showReactions")

           }
        }, [selectedReaction, selectedRecRef, reactionList]
    );

    /* Purpose of this function is to fetch the reaction list data and retun the list. */
    const getReactionList = useCallback(async (requestBuilder: CometChat.ReactionsRequest, reaction: string) => {
   try {
    setState(States.loading);
    if (reactionList[reaction]) {
        setState(States.loaded);
        return reactionList[reaction];
    }

    try {
        let list = await requestBuilder.fetchNext();
        if (list.length == 0) {
            list = await requestBuilder.fetchPrevious();
        }
        if (list.length < limit) {
            setHasMore(false);
        }
        setState(States.loaded);
        setReactionList((prev) => ({ ...prev, [reaction || "all"]: list }));
        return list;
    } catch (error) {
        setState(States.error);
        return [];
    }
   } catch (error) {
    errorHandler(error,"getReactionList")
   }
    }, [reactionList]);

    /* This function is triggered when the component is rendered, to fetch and display the reaction data. */
    const showReactionsIfNeeded = useCallback(
        async () => {
           try {
            if (messageUpdated && isFirstRender) {
                resetComponent();
                setMessageUpdated(false);
                checkReaction();
                setIsFirstRender(false);
                await showReactions();
            } else if (selectedRecRef.current) {
                setMessageUpdated(false);
                checkReaction();
                await showReactions();
            }
           } catch (error) {
            errorHandler(error,"showReactionsIfNeeded")
           }
        }, [isFirstRender, messageUpdated, setIsFirstRender, reactionList, selectedRecRef]
    );

    /* The purpose of this function is to trigger the fetch reaction data logic on scroll. */
    const fetchNext = useCallback(
        async () => {
            try {
                if (!hasMore || isFetching) return;
                setIsFetching(true);
                const requestBuilder = getRequestBuilder(selectedReaction)!;
                if (!reactionList[selectedReaction] || (reactionList[selectedReaction] && reactionList[selectedReaction].length === 0)) {
                    setIsFetching(false);
                    return;
                } else {
                    const newList = await requestBuilder.fetchNext();
                    if(requestBuilderRef.current && requestBuilderRef.current.limit && newList.length < requestBuilderRef.current.limit){
                        setHasMore(false);
                    }
                    setReactionList((prev) => ({
                        ...prev,
                        [selectedReaction]: [...prev[selectedReaction], ...newList],
                    }));
                    const updatedCurrentUIList = [...currentUIList, ...newList];
                    setCurrentUIList(updatedCurrentUIList);
                    setIsFetching(false);
                }
            } catch (error) {
                errorHandler(error,"fetchNext")
            }
        }, [setSelectedReaction, selectedReaction, reactionList, currentUIList,hasMore,isFetching]
    );

    /* This function is used to return the total reactions count for a message. */
    const getTotalReactionCount = () => {
       try {
        return messageReactions.reduce((acc, reaction) => acc + reaction.getCount(), 0);
       } catch (error) {
        errorHandler(error,"getTotalReactionCount")
       }
    };

    /* Purpose of this function is to check if the reaction is added by the logged in user. */
    const isMyReaction = (reaction: CometChat.Reaction) => {
        try {
            return loggedInUser?.getUid() === reaction?.getReactedBy()?.getUid();
           } catch (error) {
            errorHandler(error,"isMyReaction")
           }
    };

    /*
    * Purpose of this function is to remove the reaction from the message if the user clicks and removes the reaction. 
    * It is done locally using states.
    */
    const updateMessageToRemoveReactionLocally = (reaction: CometChat.Reaction) => {
     try {
        const message = messageObject;
        let changedSelectedReaction = false;

        if (message) {
            const reactions = message.getReactions();
            const index = reactions.findIndex((r) => r.getReaction() === reaction.getReaction());

            if (index !== -1) {
                const reactionCount = reactions[index].getCount();

                if (reactionCount === 1) {
                    reactions.splice(index, 1);
                    setSelectedReaction("all");
                    changedSelectedReaction = true;
                } else {
                    reactions[index].setCount(reactions[index].getCount() - 1);
                }
                updateCurrentUIList(reactions);
                setMessageReactions(reactions);
                if (changedSelectedReaction) {
                    setSelectedReaction("all");
                    selectedRecRef.current = undefined;
                }
            }
        }
     } catch (error) {
        errorHandler(error,"updateMessageToRemoveReactionLocally")
     }
    };

    /* The purpose of this function is to update the state for reaction list. */
    const updateCurrentUIList = (reactions: ReactionCount[]) => {
        if (!reactionList["all"] || reactionList["all"].length === 0) {
            return;
        }
        const tempReactionsArray: CometChat.Reaction[] = [];
        reactions.forEach((reaction) => {
            const filteredReaction = reactionList["all"]?.filter((reactionItem) => {
                return reactionItem?.getReaction() === reaction?.getReaction();
            }) || [];
    
            if (filteredReaction.length > 0) {
                tempReactionsArray.push(filteredReaction[0]);
            }
        });
        setReactionList((prev) => ({ ...prev, ["all"]: tempReactionsArray }));
        setCurrentUIList(tempReactionsArray);
    };

    /* Purpose of this function is to return the slider component view for reactions. */
    const showReactionsSlider = useCallback(() => {
        try {
            const reactionsObject = [
                {
                    id: "all",
                    reaction: allText,
                    count: getTotalReactionCount(),
                },
            ];
    
            messageReactions.forEach((reaction) => {
                reactionsObject.push({
                    id: reaction.getReaction(),
                    reaction: reaction.getReaction(),
                    count: reaction.getCount(),
                });
            });
    
            return reactionsObject.map((reactionObject) => (
                <div
                    className={`cometchat-reaction-list__tabs-tab ${selectedReaction === reactionObject.id && "cometchat-reaction-list__tabs-tab-active"}`}
                    onClick={() => { setSelectedReaction(reactionObject.id); selectedRecRef.current = reactionObject.id }}
                    key={reactionObject.id}
                >
                    <div className={`cometchat-reaction-list__tabs-tab-emoji ${selectedReaction === reactionObject.id && "cometchat-reaction-list__tabs-tab-emoji-active"}`}>
                        {reactionObject.reaction}
                    </div>
                    <div className={`cometchat-reaction-list__tabs-tab-count ${selectedReaction === reactionObject.id && "cometchat-reaction-list__tabs-tab-count-active"}`}>
                        {reactionObject.count}
                    </div>
                </div>
            ));
        } catch (error) {
            errorHandler(error,"showReactionsSlider")
        }
    }, [messageReactions, selectedReaction]);
    useEffect(() => {
        if (!isFirstRender && !isFetching && requestBuilderRef.current && requestBuilderRef.current.limit &&  currentUIList.length < requestBuilderRef.current.limit) {
            fetchNext();
        }
    }, [currentUIList.length, isFirstRender, fetchNext,isFetching]);

    return (
        <div className="cometchat cometchat-reaction-list" ref={parentRef}>
            <div >
                {state === States.loading ? (
                    <>
                        <div className="cometchat-reaction-list__tabs">{showReactionsSlider()}</div>
                        <div className="cometchat-reaction-list__shimmer">
                            {Array.from({ length: 4 }).map((undefined, index) => (
                                <div className="cometchat-reaction-list__shimmer-item" key={index}>
                                    <div className="cometchat-reaction-list__shimmer-item-icon" />
                                    <div className="cometchat-reaction-list__shimmer-item-content" />
                                    <div className="cometchat-reaction-list__shimmer-item-tailview" />
                                </div>
                            ))}
                        </div>
                    </>
                ) : state === States.error ? (
                    <div className="cometchat-reaction-list__error">
                        {localize("ERROR_TEXT")}
                    </div>
                ) : state == States.loaded ? (
                    <div className="cometchat-reaction-container">
                        <div className="cometchat-reaction-list__tabs">{showReactionsSlider()}</div>
                        <div
                            className="cometchat-reaction-list__list"
                            onScroll={(e: UIEvent<HTMLDivElement> & { target: { scrollHeight: number, scrollTop: number, clientHeight: number } }) => {
                                const { scrollHeight, scrollTop, clientHeight } = e.target;
                                const bottom = scrollHeight - scrollTop <= clientHeight + 10
                                if (bottom) {
                                    fetchNext();
                                }
                            }}
                        >
                            {currentUIList.map((reaction) => {
                                const isMe = loggedInUser?.getUid() === reaction?.getReactedBy()?.getUid();
                                return (
                                    <div className="cometchat-reaction-list__list-item" key={reaction?.getReactionId()}>
                                        <CometChatListItem
                                            title={isMe ? youText : reaction?.getReactedBy()?.getName()}
                                            subtitleView={isMe ? <div>
                                                {subtitleText}
                                            </div> : null}
                                            trailingView={<div>
                                                {reaction?.getReaction()}
                                            </div>}
                                            avatarURL={reaction?.getReactedBy()?.getAvatar()}
                                            avatarName={reaction?.getReactedBy()?.getName()}
                                            onListItemClicked={() => {
                                                if (isMyReaction(reaction)) {
                                                    updateMessageToRemoveReactionLocally(reaction);
                                                }
                                                reactionItemClicked?.(reaction, messageObject);
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
