import { CometChat } from "@cometchat-pro/chat";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CometChatMessageHeader } from "@cometchat-pro/react-ui-kit";

type MessageHeaderWrapperProps = { setSomeInterestingAsyncOpStarted : React.Dispatch<React.SetStateAction<boolean>> };

export function MessageHeaderWrapper(props : MessageHeaderWrapperProps) {
    const [group, setGroup] = useState<CometChat.Group>();
    const navigate = useNavigate();
    const { setSomeInterestingAsyncOpStarted, ...otherProps } = props;

    useEffect(() => {
        (async () => {
            const groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(1).build();
            try {
                setSomeInterestingAsyncOpStarted(true);
                const [fetchedGroup] = await groupsRequest.fetchNext();
                setGroup(fetchedGroup);
            } catch(error) {
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
        <CometChatMessageHeader
            group = {group}
            onBack = {() => navigate(-1)}
            {...otherProps}
        />
    );
}
