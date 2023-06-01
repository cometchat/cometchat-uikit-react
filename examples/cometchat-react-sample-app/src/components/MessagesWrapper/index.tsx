import { CometChat } from "@cometchat-pro/chat";
import { useEffect, useState } from "react";
import { CometChatMessages } from "@cometchat-pro/react-ui-kit";

type MessagesWrapperProps = { setSomeInterestingAsyncOpStarted : React.Dispatch<React.SetStateAction<boolean>> };

export function MessagesWrapper(props : MessagesWrapperProps) {
    const [group, setGroup] = useState<CometChat.Group>();
    const { setSomeInterestingAsyncOpStarted, ...otherProps } = props;
    
    useEffect(() => {
        (async () => {
            const groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(1).build();
            try {
                setSomeInterestingAsyncOpStarted(true);
                const [fetchGroup] = await groupsRequest.fetchNext();
                setGroup(fetchGroup);
            }
            catch(error) {
                console.log(error);
            }
            finally {
                setSomeInterestingAsyncOpStarted(false);
            }
        })();
    }, [setSomeInterestingAsyncOpStarted]);

    if (!group) {
        return null;
    }

    return (
        <CometChatMessages 
            group = {group}
            {...otherProps}
        />
    );
}
