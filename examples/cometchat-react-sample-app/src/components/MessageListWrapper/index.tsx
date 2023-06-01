import { CometChat } from "@cometchat-pro/chat";
import { useEffect, useState } from "react";
import { CometChatMessageList } from "@cometchat-pro/react-ui-kit";

type MessageListWrapperProps = { setSomeInterestingOpStarted : React.Dispatch<React.SetStateAction<boolean>> };

export function MessageListWrapper(props : MessageListWrapperProps) {
    const [group, setGroup] = useState<CometChat.Group>();
    const { setSomeInterestingOpStarted, ...otherProps } = props;

    useEffect(() => {
        (async () => {
            const groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(1).build();
            try {
                setSomeInterestingOpStarted(true);
                const [fetchedGroup] = await groupsRequest.fetchNext();
                setGroup(fetchedGroup);
            }
            catch(error) {
                console.log(error);
            }
            finally {
                setSomeInterestingOpStarted(false);
            }
        })();   
    }, [setSomeInterestingOpStarted]);

    if (!group) {
        return null;
    }

    return (
        <CometChatMessageList 
            group = {group}
            {...otherProps}
        />
    );
}
